import { withAdminAuth } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

// Keep track of connected admin clients
const connectedClients = new Map<string, ReadableStreamDefaultController<any>>();

export const GET = withAdminAuth(async ({ session }, request: NextRequest) => {
  console.log(`🔄 Admin SSE connection: ${session.user.email}`);
  
  // Create a readable stream for Server-Sent Events
  let currentController: ReadableStreamDefaultController<any>;
  let currentClientId: string;

  const stream = new ReadableStream({
    start(controller) {
      currentController = controller;
      currentClientId = `${session.user.id}-${Date.now()}`;
      connectedClients.set(currentClientId, controller);
      
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
        controller.enqueue(`data: ${JSON.stringify(initialMessage)}\n\n`);
      } catch (error) {
        console.error('Error sending initial message:', error);
      }
    },
    
    cancel(reason) {
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

// Function to broadcast updates to all connected clients
export async function broadcastUserUpdate(eventType: 'user-updated' | 'user-created' | 'user-deleted', data: any) {
  console.log(`📡 Broadcasting ${eventType} to ${connectedClients.size} clients`);
  
  const message = {
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  };

  const messageStr = `data: ${JSON.stringify(message)}\n\n`;
  
  // Send to all connected clients
  const disconnectedClients: string[] = [];
  
  for (const [clientId, controller] of connectedClients.entries()) {
    try {
      controller.enqueue(messageStr);
    } catch (error) {
      console.error(`Failed to send to client ${clientId}:`, error);
      disconnectedClients.push(clientId);
    }
  }
  
  // Clean up disconnected clients
  disconnectedClients.forEach(clientId => {
    connectedClients.delete(clientId);
    console.log(`🧹 Removed disconnected client: ${clientId}`);
  });
  
  console.log(`📡 Broadcast complete. ${connectedClients.size} clients notified`);
}