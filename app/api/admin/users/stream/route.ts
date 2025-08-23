import { withAdminAuth } from "@/helpers/api-helpers";
import { connectedClients } from "@/helpers/realtime-broadcast";

export const GET = withAdminAuth(async ({ session }) => {
  console.log(`🔄 Admin SSE connection: ${session.user.email}`);
  
  // Create a readable stream for Server-Sent Events
  // Variables to track controller and client ID
  let currentClientId: string;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      currentClientId = `${session.user.id}-${Date.now()}`;
      connectedClients.set(currentClientId, {
        controller,
        userId: session.user.id,
        userRole: session.user.role || 'admin',
        userEmail: session.user.email
      });
      
      console.log(`✅ SSE client connected: ${currentClientId} (${connectedClients.size} total)`);
      
      // Send initial connection confirmation
      const initialMessage = {
        type: 'connected',
        data: {
          message: 'Real-time updates connected',
          clientId: currentClientId,
          connectedAt: new Date().toISOString()
        }
      };
      
      try {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(initialMessage)}\n\n`));
      } catch (error) {
        console.error('Error sending initial message:', error);
      }
    },
    
    cancel() {
      // Remove this specific client
      if (currentClientId) {
        connectedClients.delete(currentClientId);
        console.log(`❌ SSE client disconnected: ${currentClientId} (${connectedClients.size} remaining)`);
      }
    }
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
});

