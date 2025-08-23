"use client";

import { useState, useCallback, useEffect } from "react";
import { createColumns, User } from "@/components/admin/user-columns";
import { DataTable } from "@/components/admin/user-data-table";
import { toast } from "sonner";
import { useSSE } from "@/components/providers/sse-provider";

interface ClientUserTableProps {
  initialUsers: User[];
}

export function UserTableClient({ initialUsers }: ClientUserTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, connect } = useSSE();

  // Function to fetch fresh data from API
  const refreshUsers = useCallback(async (showToast: boolean = false) => {
    setIsLoading(true);
    try {
      console.log("🔄 Fetching fresh data from API...");
      const response = await fetch("/api/admin/users/list");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch users");
      }

      const data = await response.json();
      const newUsers = data.users;
      
      // Update state and check for changes using functional update
      setUsers(prevUsers => {
        const dataChanged = JSON.stringify(prevUsers) !== JSON.stringify(newUsers);
        
        console.log(`📊 Data comparison: ${prevUsers.length} → ${newUsers.length} users`);
        
        if (showToast) {
          toast.success("User data refreshed successfully");
        } else if (dataChanged) {
          console.log("🔄 Data changed, showing update notification");
          toast.info(`User data updated (${newUsers.length} users)`);
        }
        
        return newUsers;
      });

    } catch (error: any) {
      console.error("Error refreshing users:", error);

      // Show more helpful error messages
      if (
        error.message?.includes("timeout") ||
        error.message?.includes("starting up")
      ) {
        toast.error("Database is waking up, please try again in a moment", {
          duration: 5000,
        });
      } else if (showToast) {
        toast.error(error.message || "Failed to refresh user data");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for global SSE user updates
  useEffect(() => {
    const handleSSEUserUpdate = (event: CustomEvent) => {
      const { users: updatedUsers } = event.detail;
      console.log("📡 Received global SSE user update, updating table");
      setUsers(updatedUsers);
    };

    // Listen for the global SSE events
    window.addEventListener('sse-user-update', handleSSEUserUpdate as EventListener);

    return () => {
      window.removeEventListener('sse-user-update', handleSSEUserUpdate as EventListener);
    };
  }, []);

  // Auto-connect to SSE when component mounts (only for admin pages)
  useEffect(() => {
    connect();
  }, [connect]);

  // Broadcast user operations to other admins
  const handleDataChange = useCallback(async () => {
    console.log("👤 User operation detected, broadcasting to other admins...");
    
    try {
      // Broadcast the change to all connected admins
      const response = await fetch('/api/admin/users/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'user-updated', // Generic update event
          userId: null, // Don't have specific user ID context here
          userData: null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to broadcast update');
      }
      
      console.log("📡 Update broadcasted successfully");
    } catch (error) {
      console.error("Failed to broadcast update:", error);
      // Fallback to local refresh if broadcast fails
      refreshUsers(false);
    }
  }, [refreshUsers]);

  // Manual refresh button
  const handleForceRefresh = useCallback(() => {
    console.log("🔄 Manual refresh requested...");
    refreshUsers(true); // Show toast for manual refresh
  }, [refreshUsers]);

  // Create columns with data change handler
  const columnsWithUpdate = createColumns(handleDataChange);

  return (
    <div className="space-y-2">
      <DataTable
        columns={columnsWithUpdate}
        data={users}
        title={`Total Users (${users.length})`}
        onDataChange={handleDataChange}
        onRefresh={handleForceRefresh}
        isLoading={isLoading}
      />
    </div>
  );
}