import { withAuth } from "@/helpers/api-helpers";
import { connectedClients } from "@/helpers/realtime-broadcast";

export const GET = withAuth(async ({ session }) => {
  const userRole = session.user.role || 'user';
  console.log(`🔄 Real-time connection: ${session.user.email} (${userRole})`);
  
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
        userEmail: session.user.email
      });
      
      console.log(`✅ Real-time client connected: ${currentClientId} (${userRole}) - Total: ${connectedClients.size}`);
      
      // Send initial connection confirmation
      const initialMessage = {
        type: 'connected',
        data: {
          message: 'Real-time updates connected',
          clientId: currentClientId,
          userRole,
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
        console.log(`❌ Real-time client disconnected: ${currentClientId} (${connectedClients.size} remaining)`);
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

