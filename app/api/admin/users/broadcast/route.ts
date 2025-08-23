import { withAdminAuth } from "@/lib/api-helpers";
import { broadcastUserUpdate } from "@/lib/admin-broadcast";
import { fetchUsersWithRetry } from "@/lib/db-utils";

export const POST = withAdminAuth(async ({ session }, request) => {
  try {
    const body = await request.json();
    const { eventType, userId, userData } = body;
    
    console.log(`📢 Broadcast request: ${eventType} by ${session.user.email}`);
    
    // Fetch latest user data to send to all clients
    const users = await fetchUsersWithRetry();
    
    // Broadcast the update with fresh data
    await broadcastUserUpdate(eventType, {
      users,
      updatedBy: session.user.email,
      userId,
      userData,
    });
    
    return Response.json({ 
      success: true, 
      message: "Update broadcasted",
      eventType,
      connectedClients: "check server logs" // Can't access count here
    });
  } catch (error) {
    console.error("Error broadcasting update:", error);
    return Response.json({ 
      error: "Failed to broadcast update",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
});