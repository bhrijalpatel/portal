import { withAuth } from "@/helpers/api-helpers";
import {
  broadcastRealtimeUpdate,
  RealtimeEventType,
} from "@/helpers/realtime-broadcast";
// import { z } from "zod"; // Currently unused but kept for future validation

// Schema for broadcast requests - currently unused but kept for future validation
// const broadcastSchema = z.object({
//   eventType: z.string(),
//   data: z.record(z.any()).optional(),
//   targetEntity: z.object({
//     type: z.string().optional(),
//     id: z.string().optional(),
//     name: z.string().optional()
//   }).optional()
// });

export const POST = withAuth(async ({ session }, request) => {
  try {
    const body = await request.json();

    // Simple validation without Zod for now
    if (!body || typeof body.eventType !== "string") {
      return Response.json(
        {
          error: "Invalid broadcast request - eventType is required",
        },
        { status: 400 },
      );
    }

    const { eventType, data, targetEntity } = body;
    const userRole = session.user.role || "user";
    const triggeredBy = session.user.email;


    // Role-based permissions for triggering events
    const canTriggerEvent = checkBroadcastPermission(eventType, userRole);
    if (!canTriggerEvent) {
      return Response.json(
        {
          error: `Insufficient permissions to broadcast ${eventType}`,
          userRole,
          requiredRoles: getBroadcastRequiredRoles(eventType),
        },
        { status: 403 },
      );
    }

    // Prepare broadcast data
    const broadcastData = {
      ...data,
      targetEntity,
      triggeredBy,
      triggerRole: userRole,
      triggerTime: new Date().toISOString(),
    };

    // Broadcast to all eligible clients
    await broadcastRealtimeUpdate(eventType, broadcastData, triggeredBy);

    return Response.json({
      success: true,
      message: `${eventType} broadcasted successfully`,
      eventType,
      triggeredBy,
      triggerRole: userRole,
      broadcastTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error broadcasting real-time update:", error);
    return Response.json(
      {
        error: "Failed to broadcast update",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});

// Permission check for who can trigger which events
function checkBroadcastPermission(
  eventType: RealtimeEventType,
  userRole: string,
): boolean {
  const BROADCAST_PERMISSIONS: Record<RealtimeEventType, string[]> = {
    // User management - admin only can trigger
    "user-created": ["admin"],
    "user-updated": ["admin"],
    "user-deleted": ["admin"],

    // Collaborative editing - admin only can trigger
    "user-edit-lock": ["admin"],
    "user-edit-unlock": ["admin"],
    "user-creation-started": ["admin"],
    "user-creation-completed": ["admin"],

    // Job cards - users, technicians, managers can trigger
    "job-card-created": ["admin", "user", "manager", "technician"],
    "job-card-updated": ["admin", "user", "manager", "technician"],
    "job-card-completed": ["admin", "user", "manager", "technician"],

    // Inventory - admin, managers, technicians can trigger
    "inventory-updated": ["admin", "manager", "technician"],
    "stock-low": ["admin", "manager", "technician"],
    "stock-out": ["admin", "manager", "technician"],

    // Financial - admin, accounting can trigger
    "salary-updated": ["admin", "accounting"],
    "payment-processed": ["admin", "accounting"],
    "invoice-generated": ["admin", "accounting"],

    // Tasks - all users can trigger
    "task-assigned": ["admin", "manager"],
    "task-completed": ["admin", "user", "manager", "technician"],
    "task-overdue": ["admin", "manager"], // System-triggered mostly

    // Notifications - admin and managers can trigger
    "notification-sent": ["admin", "manager"],
    "system-announcement": ["admin"],

    // Orders - admin, managers can trigger
    "order-created": ["admin", "manager"],
    "order-updated": ["admin", "manager"],
    "order-cancelled": ["admin", "manager"],
  };

  const allowedRoles = BROADCAST_PERMISSIONS[eventType] || [];
  return allowedRoles.includes(userRole);
}

function getBroadcastRequiredRoles(eventType: RealtimeEventType): string[] {
  // This could be extracted to a shared constant if needed
  const permissions = {
    "user-created": ["admin"],
    "user-updated": ["admin"],
    "user-deleted": ["admin"],
    "user-edit-lock": ["admin"],
    "user-edit-unlock": ["admin"],
    "user-creation-started": ["admin"],
    "user-creation-completed": ["admin"],
    "job-card-created": ["admin", "user", "manager", "technician"],
    "job-card-updated": ["admin", "user", "manager", "technician"],
    "job-card-completed": ["admin", "user", "manager", "technician"],
    "inventory-updated": ["admin", "manager", "technician"],
    "stock-low": ["admin", "manager", "technician"],
    "stock-out": ["admin", "manager", "technician"],
    "salary-updated": ["admin", "accounting"],
    "payment-processed": ["admin", "accounting"],
    "invoice-generated": ["admin", "accounting"],
    "task-assigned": ["admin", "manager"],
    "task-completed": ["admin", "user", "manager", "technician"],
    "task-overdue": ["admin", "manager"],
    "notification-sent": ["admin", "manager"],
    "system-announcement": ["admin"],
    "order-created": ["admin", "manager"],
    "order-updated": ["admin", "manager"],
    "order-cancelled": ["admin", "manager"],
  };

  return permissions[eventType] || [];
}
