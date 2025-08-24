"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

interface SSEContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  userRole: string | null;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastRef = useRef<{ message: string; timestamp: number } | null>(null);
  const [shouldConnect, setShouldConnect] = useState(false);
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const previousSessionRef = useRef<string | null>(null);

  // Helper function to prevent duplicate toasts
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const now = Date.now();
    const lastToast = lastToastRef.current;
    
    // Prevent duplicate toasts within 3 seconds
    if (lastToast && lastToast.message === message && (now - lastToast.timestamp) < 3000) {
      console.log(`🚫 Duplicate toast prevented: ${message}`);
      return;
    }
    
    // Show the toast
    lastToastRef.current = { message, timestamp: now };
    
    switch (type) {
      case 'success':
        toast.success(message, { duration: 2000 });
        break;
      case 'warning':
        toast.warning(message);
        break;
      case 'error':
        toast.error(message);
        break;
      default:
        toast.info(message);
        break;
    }
  };

  const connect = () => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log("🔄 Real-time connection already active");
      return;
    }
    
    // Prevent multiple simultaneous connection attempts
    if (eventSourceRef.current?.readyState === EventSource.CONNECTING) {
      console.log("🔄 Real-time connection already in progress");
      return;
    }

    console.log("🔄 Setting up universal real-time connection...");
    setShouldConnect(true);
    
    // Use the universal realtime endpoint instead of admin-specific
    const eventSource = new EventSource('/api/realtime/stream');
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      console.log("✅ Universal real-time connection established");
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
        console.log("📡 Real-time message received:", message.type);
        
        switch (message.type) {
          case 'connected':
            setUserRole(message.data.userRole);
            const capitalizedRole = message.data.userRole ? 
              message.data.userRole.charAt(0).toUpperCase() + message.data.userRole.slice(1) : 
              'User';
            showToast(`Real-time updates connected (${capitalizedRole})`, 'success');
            break;
            
          // User Management Events
          case 'user-updated':
          case 'user-created': 
          case 'user-deleted':
            console.log(`👤 ${message.type} by ${message.data.triggeredBy}`);
            // Don't show toast here - let individual components handle their own notifications
            
            window.dispatchEvent(new CustomEvent('realtime-user-update', {
              detail: { 
                type: message.type, 
                data: message.data,
                triggeredBy: message.data.triggeredBy 
              }
            }));
            break;
            
          // Job Card Events  
          case 'job-card-created':
          case 'job-card-updated':
          case 'job-card-completed':
            console.log(`💼 ${message.type} by ${message.data.triggeredBy}`);
            toast.info(`Job card ${message.type.split('-')[2]}`);
            
            window.dispatchEvent(new CustomEvent('realtime-job-card-update', {
              detail: { 
                type: message.type, 
                data: message.data,
                triggeredBy: message.data.triggeredBy 
              }
            }));
            break;
            
          // Inventory Events
          case 'inventory-updated':
          case 'stock-low':
          case 'stock-out':
            console.log(`📦 ${message.type} by ${message.data.triggeredBy}`);
            
            if (message.type === 'stock-out') {
              showToast(`Stock out: ${message.data.itemName || 'Item'}`, 'error');
            } else if (message.type === 'stock-low') {
              showToast(`Low stock: ${message.data.itemName || 'Item'}`, 'warning');
            } else {
              showToast('Inventory updated');
            }
            
            window.dispatchEvent(new CustomEvent('realtime-inventory-update', {
              detail: { 
                type: message.type, 
                data: message.data,
                triggeredBy: message.data.triggeredBy 
              }
            }));
            break;
            
          // Financial Events
          case 'salary-updated':
          case 'payment-processed':
          case 'invoice-generated':
            console.log(`💰 ${message.type} by ${message.data.triggeredBy}`);
            toast.info(`Finance: ${message.type.replace('-', ' ')}`);
            
            window.dispatchEvent(new CustomEvent('realtime-financial-update', {
              detail: { 
                type: message.type, 
                data: message.data,
                triggeredBy: message.data.triggeredBy 
              }
            }));
            break;
            
          // Task Events
          case 'task-assigned':
          case 'task-completed':
          case 'task-overdue':
            console.log(`📋 ${message.type} by ${message.data.triggeredBy}`);
            
            if (message.type === 'task-assigned') {
              toast.info('New task assigned');
            } else if (message.type === 'task-overdue') {
              toast.warning('Task overdue');
            } else {
              toast.success('Task completed');
            }
            
            window.dispatchEvent(new CustomEvent('realtime-task-update', {
              detail: { 
                type: message.type, 
                data: message.data,
                triggeredBy: message.data.triggeredBy 
              }
            }));
            break;
            
          // Notification Events
          case 'notification-sent':
          case 'system-announcement':
            console.log(`🔔 ${message.type} by ${message.data.triggeredBy}`);
            toast.info(message.data.message || 'New notification');
            
            window.dispatchEvent(new CustomEvent('realtime-notification', {
              detail: { 
                type: message.type, 
                data: message.data,
                triggeredBy: message.data.triggeredBy 
              }
            }));
            break;
            
          // Order Events
          case 'order-created':
          case 'order-updated':
          case 'order-cancelled':
            console.log(`🛒 ${message.type} by ${message.data.triggeredBy}`);
            toast.info(`Order ${message.type.split('-')[1]}`);
            
            window.dispatchEvent(new CustomEvent('realtime-order-update', {
              detail: { 
                type: message.type, 
                data: message.data,
                triggeredBy: message.data.triggeredBy 
              }
            }));
            break;
            
          default:
            console.log("📡 Unknown real-time message type:", message.type);
        }
      } catch (error) {
        console.error("Error parsing real-time message:", error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error("❌ Real-time connection error:", error);
      setIsConnected(false);
      
      // Only attempt reconnection if we should still be connected
      if (shouldConnect && eventSource.readyState === EventSource.CLOSED) {
        console.log("🔄 Attempting to reconnect real-time updates in 5 seconds...");
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldConnect) {
            connect();
          }
        }, 5000);
      }
    };
  };

  const disconnect = () => {
    console.log("🛑 Disconnecting real-time connection");
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
    setUserRole(null);
  };

  // Auto-connect when authenticated and on protected pages
  useEffect(() => {
    // Skip if session is still loading
    if (isPending) return;

    // Check if we're on a protected page
    const isProtectedPage = 
      pathname?.startsWith("/dashboard") ||
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/inventory") ||
      pathname?.startsWith("/jobs") ||
      pathname?.startsWith("/orders") ||
      pathname?.startsWith("/tasks");

    const currentSessionId = session?.user?.id || null;
    const sessionChanged = previousSessionRef.current !== currentSessionId;

    // If session changed (login/logout/user switch)
    if (sessionChanged) {
      console.log("🔄 Session changed:", previousSessionRef.current, "→", currentSessionId);
      previousSessionRef.current = currentSessionId;

      // Always disconnect first when session changes
      disconnect();

      // If authenticated and on protected page, connect after a short delay
      if (currentSessionId && isProtectedPage) {
        console.log("🔑 User authenticated on protected page, establishing SSE connection...");
        setTimeout(() => {
          connect();
        }, 500); // Small delay to ensure auth cookies are set
      }
    } else if (currentSessionId && isProtectedPage && !isConnected && !eventSourceRef.current) {
      // If already authenticated but not connected (e.g., navigating to protected page)
      console.log("📍 Navigated to protected page, establishing SSE connection...");
      connect();
    } else if (!currentSessionId && eventSourceRef.current) {
      // If logged out but still have connection, disconnect
      console.log("🚪 User logged out, closing SSE connection...");
      disconnect();
    }
  }, [session, isPending, pathname, isConnected]);

  // Cleanup on unmount and handle page navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eventSourceRef.current) {
        console.log("🔄 Page unloading, closing SSE connection...");
        eventSourceRef.current.close();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      disconnect();
    };
  }, []);

  const value: SSEContextType = {
    isConnected,
    connect,
    disconnect,
    userRole,
  };

  return (
    <SSEContext.Provider value={value}>
      {children}
    </SSEContext.Provider>
  );
}