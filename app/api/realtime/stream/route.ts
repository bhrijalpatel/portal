import { withAuth } from "@/helpers/api-helpers";
import { connectedClients } from "@/helpers/realtime-broadcast";

export const GET = withAuth(async ({ session }) => {
  const userRole = session.user.role || "user";

  // Create a readable stream for Server-Sent Events
  // Variables to track controller and client ID
  let currentClientId: string;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      currentClientId = `${session.user.id}-${Date.now()}`;

      // Store client info with role for permission filtering
      connectedClients.set(currentClientId, {
        controller,
        userId: session.user.id,
        userRole,
        userEmail: session.user.email,
      });


      // Send initial connection confirmation
      const initialMessage = {
        type: "connected",
        data: {
          message: "Real-time updates connected",
          clientId: currentClientId,
          userRole,
          connectedAt: new Date().toISOString(),
        },
      };

      try {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify(initialMessage)}\n\n`,
          ),
        );
      } catch (error) {
        console.error("Error sending initial message:", error);
      }

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          // Send a comment line as heartbeat (SSE comment format)
          controller.enqueue(
            new TextEncoder().encode(
              `:heartbeat ${new Date().toISOString()}\n\n`,
            ),
          );
        } catch {
          // Connection closed, clean up
          clearInterval(heartbeatInterval);
          if (currentClientId) {
            connectedClients.delete(currentClientId);
          }
        }
      }, 30000);

      // Store interval for cleanup
      (
        controller as unknown as { heartbeatInterval: NodeJS.Timeout }
      ).heartbeatInterval = heartbeatInterval;
    },

    cancel() {
      // Clean up heartbeat interval
      const controllerWithInterval = this as unknown as {
        heartbeatInterval?: NodeJS.Timeout;
      };
      if (controllerWithInterval.heartbeatInterval) {
        clearInterval(controllerWithInterval.heartbeatInterval);
      }

      // Remove this specific client
      if (currentClientId) {
        connectedClients.delete(currentClientId);
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
});
