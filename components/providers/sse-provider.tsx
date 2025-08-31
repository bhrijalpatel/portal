"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

interface SSEContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  userRole: string | null;
  lockedRows: Set<string>;
  creationSessions: Set<string>;
  lockRow: (userId: string) => Promise<boolean>;
  unlockRow: (userId: string) => void;
  startCreation: (sessionId: string, creatingAdmin: string) => void;
  completeCreation: (sessionId: string) => void;
  getRowLockInfo: (userId: string) => { isLocked: boolean; lockedBy?: string };
  startEditingSession: (userId: string, adminEmail: string) => void;
  endEditingSession: (userId: string) => void;
  isUserBeingEditedByMe: (userId: string, myEmail: string) => boolean;
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
  const [lockedRows, setLockedRows] = useState<Set<string>>(new Set());
  const [lockOwnership, setLockOwnership] = useState<Map<string, string>>(
    new Map(),
  ); // userId -> lockingAdmin
  const [editingSessions, setEditingSessions] = useState<Map<string, string>>(
    new Map(),
  ); // userId -> adminEmail (who's editing)
  const [creationSessions, setCreationSessions] = useState<Set<string>>(
    new Set(),
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastRef = useRef<{ message: string; timestamp: number } | null>(
    null,
  );
  const [shouldConnect, setShouldConnect] = useState(false);
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const previousSessionRef = useRef<string | null>(null);

  // Helper function to prevent duplicate toasts
  const showToast = (
    message: string,
    type: "success" | "info" | "warning" | "error" = "info",
  ) => {
    const now = Date.now();
    const lastToast = lastToastRef.current;

    // Prevent duplicate toasts within 3 seconds
    if (
      lastToast &&
      lastToast.message === message &&
      now - lastToast.timestamp < 3000
    ) {
      return;
    }

    // Show the toast
    lastToastRef.current = { message, timestamp: now };

    switch (type) {
      case "success":
        toast.success(message, { duration: 2000 });
        break;
      case "warning":
        toast.warning(message);
        break;
      case "error":
        toast.error(message);
        break;
      default:
        toast.info(message);
        break;
    }
  };

  // Collaborative editing functions with database persistence
  const lockRow = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/admin/locks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "lock",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (result.lockedBy) {
          toast.warning(`User is being edited by ${result.lockedBy}`);
        }
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  const unlockRow = async (userId: string) => {
    try {
      await fetch("/api/admin/locks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "unlock",
        }),
      });
    } catch {
    }
  };

  const startCreation = async (sessionId: string, creatingAdmin: string) => {
    try {
      await fetch("/api/realtime/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "user-creation-started",
          data: { sessionId, creatingAdmin },
        }),
      });
    } catch {
    }
  };

  const completeCreation = async (sessionId: string) => {
    try {
      await fetch("/api/realtime/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "user-creation-completed",
          data: { sessionId },
        }),
      });
    } catch {
    }
  };

  const getRowLockInfo = (userId: string) => {
    const isLocked = lockedRows.has(userId);
    const lockedBy = lockOwnership.get(userId);
    return { isLocked, lockedBy };
  };

  // Edit session management
  const startEditingSession = (userId: string, adminEmail: string) => {
    setEditingSessions((prev) => new Map([...prev, [userId, adminEmail]]));
  };

  const endEditingSession = (userId: string) => {
    setEditingSessions((prev) => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  };

  const isUserBeingEditedByMe = (userId: string, myEmail: string) => {
    return editingSessions.get(userId) === myEmail;
  };

  // Fetch active locks from database
  const fetchActiveLocks = useCallback(
    async (currentSession?: typeof session) => {
      try {
        const response = await fetch("/api/admin/locks");
        if (response.ok) {
          const data = await response.json();
          const lockSet = new Set<string>();
          const ownershipMap = new Map<string, string>();
          const editingMap = new Map<string, string>(); // Restore editing sessions

          data.locks.forEach(
            (lock: { lockedUserId: string; lockedByAdminEmail: string }) => {
              lockSet.add(lock.lockedUserId);
              ownershipMap.set(lock.lockedUserId, lock.lockedByAdminEmail);

              // If current user owns this lock, restore editing session
              if (
                lock.lockedByAdminEmail ===
                (currentSession || session)?.user?.email
              ) {
                editingMap.set(lock.lockedUserId, lock.lockedByAdminEmail);
              }
            },
          );

          setLockedRows(lockSet);
          setLockOwnership(ownershipMap);
          setEditingSessions(editingMap); // RESTORE editing state from database
        }
      } catch {
      }
    },
    [session],
  );

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (eventSourceRef.current?.readyState === EventSource.CONNECTING) {
      return;
    }

    setShouldConnect(true);

    // Use the universal realtime endpoint instead of admin-specific
    const eventSource = new EventSource("/api/realtime/stream");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
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

        switch (message.type) {
          case "connected":
            setUserRole(message.data.userRole);
            const capitalizedRole = message.data.userRole
              ? message.data.userRole.charAt(0).toUpperCase() +
                message.data.userRole.slice(1)
              : "User";
            showToast(
              `Real-time updates connected (${capitalizedRole})`,
              "success",
            );

            // Re-fetch locks after SSE connection established (for admin users)
            if (message.data.userRole === "admin") {
              // Small delay to ensure connection is fully established
              setTimeout(() => fetchActiveLocks(), 1000);
            }
            break;

          // User Management Events
          case "user-updated":
          case "user-created":
          case "user-deleted":
            // Don't show toast here - let individual components handle their own notifications

            window.dispatchEvent(
              new CustomEvent("realtime-user-update", {
                detail: {
                  type: message.type,
                  data: message.data,
                  triggeredBy: message.data.triggeredBy,
                },
              }),
            );
            break;

          // Job Card Events
          case "job-card-created":
          case "job-card-updated":
          case "job-card-completed":
            toast.info(`Job card ${message.type.split("-")[2]}`);

            window.dispatchEvent(
              new CustomEvent("realtime-job-card-update", {
                detail: {
                  type: message.type,
                  data: message.data,
                  triggeredBy: message.data.triggeredBy,
                },
              }),
            );
            break;

          // Inventory Events
          case "inventory-updated":
          case "stock-low":
          case "stock-out":

            if (message.type === "stock-out") {
              showToast(
                `Stock out: ${message.data.itemName || "Item"}`,
                "error",
              );
            } else if (message.type === "stock-low") {
              showToast(
                `Low stock: ${message.data.itemName || "Item"}`,
                "warning",
              );
            } else {
              showToast("Inventory updated");
            }

            window.dispatchEvent(
              new CustomEvent("realtime-inventory-update", {
                detail: {
                  type: message.type,
                  data: message.data,
                  triggeredBy: message.data.triggeredBy,
                },
              }),
            );
            break;

          // Financial Events
          case "salary-updated":
          case "payment-processed":
          case "invoice-generated":
            toast.info(`Finance: ${message.type.replace("-", " ")}`);

            window.dispatchEvent(
              new CustomEvent("realtime-financial-update", {
                detail: {
                  type: message.type,
                  data: message.data,
                  triggeredBy: message.data.triggeredBy,
                },
              }),
            );
            break;

          // Task Events
          case "task-assigned":
          case "task-completed":
          case "task-overdue":

            if (message.type === "task-assigned") {
              toast.info("New task assigned");
            } else if (message.type === "task-overdue") {
              toast.warning("Task overdue");
            } else {
              toast.success("Task completed");
            }

            window.dispatchEvent(
              new CustomEvent("realtime-task-update", {
                detail: {
                  type: message.type,
                  data: message.data,
                  triggeredBy: message.data.triggeredBy,
                },
              }),
            );
            break;

          // Notification Events
          case "notification-sent":
          case "system-announcement":
            toast.info(message.data.message || "New notification");

            window.dispatchEvent(
              new CustomEvent("realtime-notification", {
                detail: {
                  type: message.type,
                  data: message.data,
                  triggeredBy: message.data.triggeredBy,
                },
              }),
            );
            break;

          // Order Events
          case "order-created":
          case "order-updated":
          case "order-cancelled":
            toast.info(`Order ${message.type.split("-")[1]}`);

            window.dispatchEvent(
              new CustomEvent("realtime-order-update", {
                detail: {
                  type: message.type,
                  data: message.data,
                  triggeredBy: message.data.triggeredBy,
                },
              }),
            );
            break;

          // Collaborative Editing Events
          case "user-edit-lock":
            setLockedRows((prev) => new Set([...prev, message.data.userId]));
            setLockOwnership(
              (prev) =>
                new Map([
                  ...prev,
                  [message.data.userId, message.data.lockingAdmin],
                ]),
            );

            window.dispatchEvent(
              new CustomEvent("realtime-user-lock", {
                detail: {
                  type: message.type,
                  data: message.data,
                  triggeredBy: message.data.lockingAdmin,
                },
              }),
            );
            break;

          case "user-edit-unlock":
            setLockedRows((prev) => {
              const newSet = new Set(prev);
              newSet.delete(message.data.userId);
              return newSet;
            });
            setLockOwnership((prev) => {
              const newMap = new Map(prev);
              newMap.delete(message.data.userId);
              return newMap;
            });

            window.dispatchEvent(
              new CustomEvent("realtime-user-unlock", {
                detail: {
                  type: message.type,
                  data: message.data,
                },
              }),
            );
            break;

          case "user-creation-started":
            setCreationSessions(
              (prev) => new Set([...prev, message.data.sessionId]),
            );

            window.dispatchEvent(
              new CustomEvent("realtime-user-creation", {
                detail: {
                  type: message.type,
                  data: message.data,
                  triggeredBy: message.data.creatingAdmin,
                },
              }),
            );
            break;

          case "user-creation-completed":
            setCreationSessions((prev) => {
              const newSet = new Set(prev);
              newSet.delete(message.data.sessionId);
              return newSet;
            });

            window.dispatchEvent(
              new CustomEvent("realtime-user-creation", {
                detail: {
                  type: message.type,
                  data: message.data,
                },
              }),
            );
            break;

          default:
        }
      } catch (error) {
        console.error("Error parsing real-time message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("Real-time connection error:", error);
      setIsConnected(false);

      // Only attempt reconnection if we should still be connected
      if (shouldConnect && eventSource.readyState === EventSource.CLOSED) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldConnect) {
            connect();
          }
        }, 5000);
      }
    };
  }, [shouldConnect, fetchActiveLocks]);

  const disconnect = useCallback(() => {
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
  }, []);

  // Auto-connect when authenticated and on protected pages
  useEffect(() => {
    // Skip if session is still loading
    if (isPending) return;

    // Check if we're on a protected page (exclude setup pages to avoid auth conflicts)
    const isProtectedPage =
      (pathname?.startsWith("/dashboard") ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/inventory") ||
        pathname?.startsWith("/jobs") ||
        pathname?.startsWith("/orders") ||
        pathname?.startsWith("/tasks")) &&
      !pathname?.includes("/admin-setup");

    const currentSessionId = session?.user?.id || null;
    const sessionChanged = previousSessionRef.current !== currentSessionId;

    // If session changed (login/logout/user switch)
    if (sessionChanged) {
      previousSessionRef.current = currentSessionId;

      // Always disconnect first when session changes
      disconnect();

      // If authenticated and on protected page, connect after a short delay
      if (currentSessionId && isProtectedPage) {
        setTimeout(() => {
          connect();
          // Fetch existing locks when connecting to admin page
          if (pathname?.startsWith("/admin")) {
            fetchActiveLocks(session);
          }
        }, 500); // Small delay to ensure auth cookies are set
      }
    } else if (
      currentSessionId &&
      isProtectedPage &&
      !isConnected &&
      !eventSourceRef.current
    ) {
      // If already authenticated but not connected (e.g., navigating to protected page)
      connect();
      // Fetch existing locks when connecting to admin page
      if (pathname?.startsWith("/admin")) {
        fetchActiveLocks(session);
      }
    } else if (!currentSessionId && eventSourceRef.current) {
      // If logged out but still have connection, disconnect
      disconnect();
    }

    // ALWAYS fetch locks when navigating to admin pages (Fix for browser restart visibility issue)
    if (currentSessionId && pathname?.startsWith("/admin") && !sessionChanged) {
      fetchActiveLocks(session);
    }
  }, [
    session,
    isPending,
    pathname,
    isConnected,
    connect,
    disconnect,
    fetchActiveLocks,
  ]);

  // Periodic lock refresh for admin users (every 30 seconds)
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (
      session?.user?.role === "admin" &&
      pathname?.startsWith("/admin") &&
      isConnected
    ) {
      refreshInterval = setInterval(() => {
        fetchActiveLocks(session);
      }, 30000); // 30 seconds
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [session?.user?.role, pathname, isConnected, fetchActiveLocks, session]);

  // Cleanup on unmount and handle page navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      disconnect();
    };
  }, [disconnect]);

  const value: SSEContextType = {
    isConnected,
    connect,
    disconnect,
    userRole,
    lockedRows,
    creationSessions,
    lockRow,
    unlockRow,
    startCreation,
    completeCreation,
    getRowLockInfo,
    startEditingSession,
    endEditingSession,
    isUserBeingEditedByMe,
  };

  return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>;
}
