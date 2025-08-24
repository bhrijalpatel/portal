import { withAdminAuth } from "@/helpers/api-helpers";
import { db } from "@/db/drizzle";
import { userLocks } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { connectedClients } from "@/helpers/realtime-broadcast";

// Schema for lock operations
const lockSchema = z.object({
  userId: z.string(),
  action: z.enum(["lock", "unlock", "check"]),
});

// GET: Check active locks
export const GET = withAdminAuth(async ({ session }) => {
  try {
    console.log(`👀 Fetching active locks for session: ${session.user.email}`);
    
    // ONLY clean up expired locks that belong to disconnected sessions
    // First, get list of currently connected client sessions from SSE
    const currentlyConnectedSessions = new Set<string>();
    for (const [, client] of connectedClients.entries()) {
      currentlyConnectedSessions.add(client.userId);
    }
    
    console.log(`🔗 Currently connected sessions: ${Array.from(currentlyConnectedSessions).join(', ')}`);
    
    // Clean up expired locks ONLY for sessions that are no longer connected
    const expiredLocks = await db
      .select()
      .from(userLocks)
      .where(lte(userLocks.expiresAt, new Date()));
      
    const locksToDelete = expiredLocks.filter(lock => 
      !currentlyConnectedSessions.has(lock.lockedByAdminId)
    );
    
    if (locksToDelete.length > 0) {
      console.log(`🧹 Cleaning ${locksToDelete.length} expired locks from disconnected sessions`);
      for (const lock of locksToDelete) {
        await db.delete(userLocks).where(eq(userLocks.id, lock.id));
        
        // Broadcast unlock event for each cleaned lock
        console.log(`📡 Broadcasting cleanup unlock for user ${lock.lockedUserId}`);
        const unlockEvent = JSON.stringify({
          type: "user-edit-unlock",
          data: {
            userId: lock.lockedUserId,
            reason: "session_disconnected",
            previousAdmin: lock.lockedByAdminEmail,
          },
          triggeredBy: "system_cleanup"
        });
        
        for (const [clientId, client] of connectedClients) {
          if (client.userRole === 'admin') {
            try {
              client.controller.enqueue(new TextEncoder().encode(`data: ${unlockEvent}\n\n`));
              console.log(`📤 Sent cleanup unlock event to ${client.userEmail}`);
            } catch (error) {
              console.log(`❌ Failed to send cleanup unlock to ${clientId}:`, error);
              connectedClients.delete(clientId);
            }
          }
        }
      }
    }

    // Get all remaining active locks
    const activeLocks = await db
      .select()
      .from(userLocks)
      .where(gte(userLocks.expiresAt, new Date()));

    console.log(`📋 Returning ${activeLocks.length} active locks`);
    return Response.json({
      success: true,
      locks: activeLocks,
    });
  } catch (error) {
    console.error("Error fetching locks:", error);
    return Response.json(
      { error: "Failed to fetch locks" },
      { status: 500 }
    );
  }
});

// POST: Create or remove lock
export const POST = withAdminAuth(async ({ session }, request) => {
  try {
    const body = await request.json();
    const { userId, action } = lockSchema.parse(body);

    if (action === "lock") {
      // First check if user is already locked (including expired ones)
      const existingLock = await db
        .select()
        .from(userLocks)
        .where(eq(userLocks.lockedUserId, userId))
        .limit(1);
      
      console.log(`🔍 Found ${existingLock.length} existing locks for user ${userId}`);

      if (existingLock.length > 0) {
        const lockExpired = new Date(existingLock[0].expiresAt) < new Date();
        console.log(`🕐 Lock expired: ${lockExpired}`);
        
        if (!lockExpired) {
          // Active lock exists
          if (existingLock[0].lockedByAdminId === session.user.id) {
            // Same admin - extend the lock expiry to 15 minutes
            console.log(`🔄 Extending lock for same admin: ${session.user.email}`);
            await db
              .update(userLocks)
              .set({ 
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) 
              })
              .where(eq(userLocks.id, existingLock[0].id));
              
            return Response.json({
              success: true,
              lock: existingLock[0],
              extended: true,
            });
          }
          
          // Someone else has the lock - REJECT
          console.log(`❌ User locked by another admin: ${existingLock[0].lockedByAdminEmail}`);
          return Response.json({
            success: false,
            error: "User is already being edited",
            lockedBy: existingLock[0].lockedByAdminEmail,
          }, { status: 409 });
        } else {
          // Expired lock - clean it up
          console.log(`🧹 Cleaning up expired lock: ${existingLock[0].id}`);
          await db
            .delete(userLocks)
            .where(eq(userLocks.id, existingLock[0].id));
        }
      }

      // Create new lock
      console.log(`🔒 Creating lock for user ${userId} by ${session.user.email}`);
      const newLock = await db
        .insert(userLocks)
        .values({
          lockedUserId: userId,
          lockedByAdminId: session.user.id,
          lockedByAdminEmail: session.user.email,
          sessionId: session.session.id,
          lockType: "edit",
        })
        .returning();
      
      console.log(`✅ Lock created:`, newLock[0]);

      // Broadcast lock event directly to connected clients
      console.log(`📡 Broadcasting lock event to ${connectedClients.size} connected clients`);
      const lockEvent = JSON.stringify({
        type: "user-edit-lock",
        data: {
          userId,
          lockingAdmin: session.user.email,
          lockId: newLock[0].id,
        },
        triggeredBy: session.user.email
      });
      
      for (const [clientId, client] of connectedClients) {
        if (client.userRole === 'admin') {
          try {
            client.controller.enqueue(new TextEncoder().encode(`data: ${lockEvent}\n\n`));
            console.log(`📤 Sent lock event to ${client.userEmail}`);
          } catch (error) {
            console.log(`❌ Failed to send to ${clientId}:`, error);
            connectedClients.delete(clientId);
          }
        }
      }

      return Response.json({
        success: true,
        lock: newLock[0],
      });
    } else if (action === "unlock") {
      // Remove lock (only if owned by this admin)
      const deleted = await db
        .delete(userLocks)
        .where(
          and(
            eq(userLocks.lockedUserId, userId),
            eq(userLocks.lockedByAdminId, session.user.id)
          )
        )
        .returning();

      if (deleted.length > 0) {
        // Broadcast unlock event directly to connected clients
        console.log(`📡 Broadcasting unlock event to ${connectedClients.size} connected clients`);
        const unlockEvent = JSON.stringify({
          type: "user-edit-unlock",
          data: {
            userId,
            unlockingAdmin: session.user.email,
          },
          triggeredBy: session.user.email
        });
        
        for (const [clientId, client] of connectedClients) {
          if (client.userRole === 'admin') {
            try {
              client.controller.enqueue(new TextEncoder().encode(`data: ${unlockEvent}\n\n`));
              console.log(`📤 Sent unlock event to ${client.userEmail}`);
            } catch (error) {
              console.log(`❌ Failed to send to ${clientId}:`, error);
              connectedClients.delete(clientId);
            }
          }
        }
      }

      return Response.json({
        success: true,
        unlocked: deleted.length > 0,
      });
    } else if (action === "check") {
      // Check if specific user is locked
      const lock = await db
        .select()
        .from(userLocks)
        .where(
          and(
            eq(userLocks.lockedUserId, userId),
            gte(userLocks.expiresAt, new Date())
          )
        )
        .limit(1);

      return Response.json({
        success: true,
        isLocked: lock.length > 0,
        lock: lock[0] || null,
      });
    }

    return Response.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error managing lock:", error);
    return Response.json(
      { error: "Failed to manage lock" },
      { status: 500 }
    );
  }
});

// DELETE: Clean up expired locks (maintenance endpoint)
export const DELETE = withAdminAuth(async () => {
  try {
    const deleted = await db
      .delete(userLocks)
      .where(lte(userLocks.expiresAt, new Date()))
      .returning();

    return Response.json({
      success: true,
      cleaned: deleted.length,
    });
  } catch (error) {
    console.error("Error cleaning locks:", error);
    return Response.json(
      { error: "Failed to clean locks" },
      { status: 500 }
    );
  }
});