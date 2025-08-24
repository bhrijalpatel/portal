// Global shared Map across all API routes and processes
declare global {
  var __GLOBAL_SSE_CLIENTS__:
    | Map<
        string,
        {
          controller: ReadableStreamDefaultController<Uint8Array>;
          userId: string;
          userRole: string;
          userEmail: string;
        }
      >
    | undefined;
}

// Initialize if doesn't exist
globalThis.__GLOBAL_SSE_CLIENTS__ =
  globalThis.__GLOBAL_SSE_CLIENTS__ || new Map();

// Export the global Map
export const connectedClients = globalThis.__GLOBAL_SSE_CLIENTS__;

// Universal event types for all business operations
export type RealtimeEventType =
  | "user-created"
  | "user-updated"
  | "user-deleted"
  | "user-edit-lock"
  | "user-edit-unlock"
  | "user-creation-started"
  | "user-creation-completed"
  | "job-card-created"
  | "job-card-updated"
  | "job-card-completed"
  | "inventory-updated"
  | "stock-low"
  | "stock-out"
  | "salary-updated"
  | "payment-processed"
  | "invoice-generated"
  | "task-assigned"
  | "task-completed"
  | "task-overdue"
  | "notification-sent"
  | "system-announcement"
  | "order-created"
  | "order-updated"
  | "order-cancelled";

// Permission matrix - define which roles can see which events
const EVENT_PERMISSIONS: Record<RealtimeEventType, string[]> = {
  // User management - admin only
  "user-created": ["admin"],
  "user-updated": ["admin"],
  "user-deleted": ["admin"],

  // Collaborative editing - admin only
  "user-edit-lock": ["admin"],
  "user-edit-unlock": ["admin"],
  "user-creation-started": ["admin"],
  "user-creation-completed": ["admin"],

  // Job cards - all users
  "job-card-created": ["admin", "user", "manager", "technician"],
  "job-card-updated": ["admin", "user", "manager", "technician"],
  "job-card-completed": ["admin", "user", "manager", "technician"],

  // Inventory - admin, manager, technician
  "inventory-updated": ["admin", "manager", "technician"],
  "stock-low": ["admin", "manager", "technician"],
  "stock-out": ["admin", "manager", "technician"],

  // Financial - admin, accounting
  "salary-updated": ["admin", "accounting"],
  "payment-processed": ["admin", "accounting"],
  "invoice-generated": ["admin", "accounting"],

  // Tasks - all users
  "task-assigned": ["admin", "user", "manager", "technician"],
  "task-completed": ["admin", "user", "manager", "technician"],
  "task-overdue": ["admin", "user", "manager", "technician"],

  // Notifications - all users
  "notification-sent": ["admin", "user", "manager", "technician", "accounting"],
  "system-announcement": [
    "admin",
    "user",
    "manager",
    "technician",
    "accounting",
  ],

  // Orders - admin, manager
  "order-created": ["admin", "manager"],
  "order-updated": ["admin", "manager"],
  "order-cancelled": ["admin", "manager"],
};

// Function to broadcast updates to relevant users based on permissions
export async function broadcastRealtimeUpdate(
  eventType: RealtimeEventType,
  data: unknown,
  triggeredBy?: string,
) {
  console.log(
    `📡 Broadcasting ${eventType} to eligible clients (triggered by ${triggeredBy || "system"})`,
  );
  console.log(`📊 Current connected clients: ${connectedClients.size}`);
  console.log(
    `🔍 Debug: connectedClients instance:`,
    connectedClients.constructor.name,
    connectedClients,
  );

  // Debug: show all connected clients
  for (const [clientId, client] of connectedClients.entries()) {
    console.log(`   - ${clientId}: ${client.userEmail} (${client.userRole})`);
  }

  const allowedRoles = EVENT_PERMISSIONS[eventType] || [];
  console.log(`🔐 Allowed roles for ${eventType}:`, allowedRoles);

  const eligibleClients = Array.from(connectedClients.entries()).filter(
    ([, client]) => allowedRoles.includes(client.userRole),
  );

  console.log(
    `🎯 Event ${eventType} - ${eligibleClients.length}/${connectedClients.size} clients eligible`,
  );

  const message = {
    type: eventType,
    data: {
      ...(typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)
        : {}),
      triggeredBy,
      timestamp: new Date().toISOString(),
    },
  };

  const messageStr = `data: ${JSON.stringify(message)}\n\n`;

  // Send to eligible clients only
  const disconnectedClients: string[] = [];

  for (const [clientId, client] of eligibleClients) {
    try {
      client.controller.enqueue(new TextEncoder().encode(messageStr));
      console.log(`📤 Sent to ${client.userEmail} (${client.userRole})`);
    } catch (error) {
      console.error(
        `Failed to send to client ${clientId} (${client.userEmail}):`,
        error,
      );
      disconnectedClients.push(clientId);
    }
  }

  // Clean up disconnected clients
  disconnectedClients.forEach((clientId) => {
    connectedClients.delete(clientId);
    console.log(`🧹 Removed disconnected client: ${clientId}`);
  });

  console.log(
    `📡 Broadcast complete. ${eligibleClients.length - disconnectedClients.length} clients notified`,
  );
}

// Note: connectedClients is now exported as a singleton at the top of the file
