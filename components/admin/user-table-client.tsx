"use client";

import { useState, useCallback, useEffect } from "react";
import { createColumns, User } from "@/components/admin/user-columns";
import { DataTable } from "@/components/admin/user-data-table";
import { toast } from "sonner";

interface ClientUserTableProps {
  initialUsers: User[];
}

export function UserTableClient({ initialUsers }: ClientUserTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);

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
          toast.success("User data refreshed successfully", { id: 'manual-refresh' });
        } else if (dataChanged) {
          console.log("🔄 Data changed, showing update notification");
          // Use a unique ID to prevent multiple identical table update toasts
          const toastId = 'user-data-updated';
          toast.info(`User data updated (${newUsers.length} users)`, { 
            id: toastId,
            duration: 2000 
          });
        }
        
        return newUsers;
      });

    } catch (error) {
      console.error("Error refreshing users:", error);

      // Show more helpful error messages
      if (
        error instanceof Error && (
          error.message?.includes("timeout") ||
          error.message?.includes("starting up")
        )
      ) {
        toast.error("Database is waking up, please try again in a moment", {
          duration: 5000,
        });
      } else if (showToast) {
        toast.error(error instanceof Error ? error.message : "Failed to refresh user data");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for universal real-time user updates
  useEffect(() => {
    const handleRealtimeUserUpdate = () => {
      console.log("📡 Received real-time user update, refreshing data");
      // Refresh user data when any user management event occurs
      refreshUsers(false);
    };

    // Listen for the new universal real-time events
    window.addEventListener('realtime-user-update', handleRealtimeUserUpdate as EventListener);

    return () => {
      window.removeEventListener('realtime-user-update', handleRealtimeUserUpdate as EventListener);
    };
  }, [refreshUsers]);

  // SSE connection is now automatically managed by SSEProvider based on authentication state

  // Broadcast user operations to all eligible users
  const handleDataChange = useCallback(async () => {
    console.log("👤 User operation detected, broadcasting to all eligible users...");
    
    try {
      // Use the new universal broadcast endpoint
      const response = await fetch('/api/realtime/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'user-updated',
          data: {
            message: 'User data has been updated'
          },
          targetEntity: {
            type: 'user',
            name: 'User Management'
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to broadcast update');
      }
      
      console.log("📡 Update broadcasted successfully to all eligible users");
    } catch (error) {
      console.error("Failed to broadcast update:", error);
      // Fallback to local refresh if broadcast fails
      refreshUsers(false);
    }
  }, [refreshUsers]);

  // Manual refresh button
  const handleForceRefresh = useCallback(async () => {
    console.log("🔄 Manual refresh requested...");
    await refreshUsers(true); // Show toast for manual refresh
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