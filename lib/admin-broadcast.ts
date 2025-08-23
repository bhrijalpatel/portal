// Keep track of connected admin clients
const connectedClients = new Map<string, ReadableStreamDefaultController<Uint8Array>>();

// Function to broadcast updates to all connected clients
export async function broadcastUserUpdate(eventType: 'user-updated' | 'user-created' | 'user-deleted', data: unknown) {
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
      controller.enqueue(new TextEncoder().encode(messageStr));
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

// Export connectedClients for use in the stream route
export { connectedClients };