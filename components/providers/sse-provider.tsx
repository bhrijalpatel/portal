"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { toast } from "sonner";

interface SSEContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

export function useSSE() {
  const context = useContext(SSEContext);
  if (context === undefined) {
    throw new Error("useSSE must be used within an SSEProvider");
  }
  return context;
}

interface SSEProviderProps {
  children: React.ReactNode;
}

export function SSEProvider({ children }: SSEProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldConnect, setShouldConnect] = useState(false);

  const connect = () => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log("🔄 SSE already connected");
      return;
    }

    console.log("🔄 Setting up global SSE connection...");
    setShouldConnect(true);
    
    const eventSource = new EventSource('/api/admin/users/stream');
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      console.log("✅ Global SSE connection established");
      setIsConnected(true);
      
      // Clear any reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
    
    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📡 Global SSE message received:", message.type);
        
        switch (message.type) {
          case 'connected':
            toast.success("Real-time updates connected", { duration: 2000 });
            break;
            
          case 'user-updated':
          case 'user-created': 
          case 'user-deleted':
            console.log(`🔄 User ${message.type.split('-')[1]} by ${message.data.updatedBy}`);
            toast.info(`User data updated (${message.data.users.length} users)`);
            
            // Broadcast to all components that need to refresh
            window.dispatchEvent(new CustomEvent('sse-user-update', {
              detail: { 
                type: message.type, 
                users: message.data.users,
                updatedBy: message.data.updatedBy 
              }
            }));
            break;
            
          default:
            console.log("📡 Unknown SSE message type:", message.type);
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error("❌ Global SSE connection error:", error);
      setIsConnected(false);
      
      // Only attempt reconnection if we should still be connected
      if (shouldConnect && eventSource.readyState === EventSource.CLOSED) {
        console.log("🔄 Attempting to reconnect SSE in 5 seconds...");
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldConnect) {
            connect();
          }
        }, 5000);
      }
    };
  };

  const disconnect = () => {
    console.log("🛑 Disconnecting global SSE connection");
    setShouldConnect(false);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsConnected(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const value: SSEContextType = {
    isConnected,
    connect,
    disconnect,
  };

  return (
    <SSEContext.Provider value={value}>
      {children}
    </SSEContext.Provider>
  );
}