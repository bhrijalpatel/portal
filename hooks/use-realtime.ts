"use client";

import { useEffect, useCallback } from "react";

// Event types that components can listen for
export type RealtimeEventCategory =
  | "user"
  | "job-card"
  | "inventory"
  | "financial"
  | "task"
  | "notification"
  | "order";

// Hook for components to easily integrate with real-time updates
export function useRealtime(
  category: RealtimeEventCategory,
  onUpdate: (event: CustomEvent) => void,
) {
  const handleUpdate = useCallback(
    (event: CustomEvent) => {
      onUpdate(event);
    },
    [onUpdate],
  );

  useEffect(() => {
    const eventName = `realtime-${category}-update`;

    window.addEventListener(eventName, handleUpdate as EventListener);

    return () => {
      window.removeEventListener(eventName, handleUpdate as EventListener);
    };
  }, [category, handleUpdate]);
}

// Hook for broadcasting real-time events
export function useBroadcast() {
  const broadcast = useCallback(
    async (
      eventType: string,
      data?: unknown,
      targetEntity?: {
        type?: string;
        id?: string;
        name?: string;
      },
    ) => {
      try {
        const response = await fetch("/api/realtime/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType,
            data,
            targetEntity,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to broadcast event");
        }

        const result = await response.json();
        return result;
      } catch (error) {
        throw error;
      }
    },
    [],
  );

  return { broadcast };
}

// Convenience hooks for specific categories
export const useUserRealtime = (onUpdate: (event: CustomEvent) => void) =>
  useRealtime("user", onUpdate);

export const useJobCardRealtime = (onUpdate: (event: CustomEvent) => void) =>
  useRealtime("job-card", onUpdate);

export const useInventoryRealtime = (onUpdate: (event: CustomEvent) => void) =>
  useRealtime("inventory", onUpdate);

export const useFinancialRealtime = (onUpdate: (event: CustomEvent) => void) =>
  useRealtime("financial", onUpdate);

export const useTaskRealtime = (onUpdate: (event: CustomEvent) => void) =>
  useRealtime("task", onUpdate);

export const useNotificationRealtime = (
  onUpdate: (event: CustomEvent) => void,
) => useRealtime("notification", onUpdate);

export const useOrderRealtime = (onUpdate: (event: CustomEvent) => void) =>
  useRealtime("order", onUpdate);
