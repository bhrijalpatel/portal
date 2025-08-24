"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Copy,
  Shield,
  Ban,
  Key,
  UserX,
  Eye,
  User as UserIcon,
  Edit,
  X,
  Loader2,
  Dot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserActionsDialog } from "./user-actions-dialog";
import { useState, useEffect } from "react";
import { useSSE } from "@/components/providers/sse-provider";
import { DialogPortal } from "@/components/ui/dialog-portal";
import { useSession } from "@/lib/auth-client";
// import { useDialogState } from "./dialog-state-provider";

// Helper function to capitalize roles - exported for use in other components
export function capitalizeRole(role: string | null): string {
  const roleStr = role || "user";
  return roleStr.charAt(0).toUpperCase() + roleStr.slice(1);
}

// User type based on Better Auth user table only (single source of truth)
export type User = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean; // Better Auth: NOT NULL with default false
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
};

// Actions cell component with dialog state management
function ActionsCell({
  user,
  onUserUpdate,
}: {
  user: User;
  onUserUpdate: () => void;
}) {
  const [isLockPending, setIsLockPending] = useState(false); // Track lock creation state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<
    | "create"
    | "update"
    | "setPassword"
    | "ban"
    | "unban"
    | "delete"
    | "impersonate"
  >("update");
  const {
    lockRow,
    unlockRow,
    getRowLockInfo,
    startEditingSession,
    endEditingSession,
    isUserBeingEditedByMe,
  } = useSSE();
  const { data: session, isPending } = useSession();

  // Start editing mode - lock the user for this admin
  const handleStartEdit = async () => {
    const currentUserEmail = session?.user?.email;
    const isCurrentlyEditing = currentUserEmail
      ? isUserBeingEditedByMe(user.id, currentUserEmail)
      : false;

    console.log(
      `🔓 Starting edit mode for user ${user.id}, currently editing: ${isCurrentlyEditing}`
    );

    // Don't proceed if session is still loading or already editing
    if (isPending || !currentUserEmail || isCurrentlyEditing) {
      console.log(
        `⏳ Cannot start edit mode. isPending=${isPending}, email=${currentUserEmail}, isCurrentlyEditing=${isCurrentlyEditing}`
      );
      return;
    }

    // Set lock pending state immediately to show loading
    setIsLockPending(true);
    console.log(`🔄 Lock pending state set for user ${user.id}`);

    try {
      const lockSuccess = await lockRow(user.id);
      console.log(`🔐 Lock result for edit mode: ${lockSuccess}`);

      if (lockSuccess) {
        // IMMEDIATELY start editing session in SSE provider
        startEditingSession(user.id, currentUserEmail);
        setIsLockPending(false);
        console.log(
          `✅ Edit session started in SSE provider for user ${user.id}`
        );
      } else {
        console.log(`❌ Failed to enter edit mode for user ${user.id}`);
        setIsLockPending(false); // Reset pending state on failure
      }
    } catch (error) {
      console.error(`❌ Error creating lock for user ${user.id}:`, error);
      setIsLockPending(false); // Reset pending state on error
    }
  };

  // End editing mode - unlock the user
  const handleEndEdit = () => {
    console.log(`🔒 Ending edit mode for user ${user.id}`);
    unlockRow(user.id);
    endEditingSession(user.id);
    setIsLockPending(false); // Reset pending state
    console.log(`✅ Edit session ended for user ${user.id}`);
  };

  const handleAction = async (action: typeof dialogAction) => {
    console.log(
      `🎯 HandleAction called: ${action} for user ${user.id} (edit mode active)`
    );

    // Since we're in edit mode, user is already locked - directly open dialog
    console.log(`📝 Opening dialog for action: ${action}`);
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    console.log(`🔒 Dialog close requested for user ${user.id}`);
    setDialogOpen(false);
  };

  // Handle successful user update - stay in edit mode (don't unlock)
  const handleUserUpdateSuccess = () => {
    console.log(
      `🎉 User update successful for ${user.id}, staying in edit mode`
    );
    // Keep isEditing=true and lock in place - admin can continue editing
    // The table refresh will happen but our local state should persist
  };

  // Get actual lock info from SSE provider
  const lockInfo = getRowLockInfo(user.id);
  const currentUserEmail = session?.user?.email;
  const isLockedByCurrentUser =
    lockInfo.isLocked && lockInfo.lockedBy === currentUserEmail;
  const isLockedByOtherAdmin =
    lockInfo.isLocked && lockInfo.lockedBy !== currentUserEmail;

  // Get editing state from SSE provider (persists across re-renders)
  const isEditing = currentUserEmail
    ? isUserBeingEditedByMe(user.id, currentUserEmail)
    : false;

  // Only watch for when OTHER admins lock this user (for conflict detection)
  useEffect(() => {
    const currentUserEmail = session?.user?.email;
    if (
      !isEditing &&
      lockInfo.isLocked &&
      lockInfo.lockedBy !== currentUserEmail
    ) {
      console.log(
        `👥 Another admin (${lockInfo.lockedBy}) has locked user ${user.id}`
      );
      // Don't change our edit state - just let the UI show the conflict
    }
  }, [
    isEditing,
    lockInfo.isLocked,
    lockInfo.lockedBy,
    session?.user?.email,
    user.id,
  ]);

  // Debug dialog state changes - only log when dialog actually changes
  useEffect(() => {
    if (dialogOpen) {
      console.log(
        `📊 Dialog OPENED for user ${user.id}: action=${dialogAction}`
      );
    }
  }, [dialogOpen, dialogAction, user.id]);

  // Debug session loading
  console.log(
    `🔑 Session debug for user ${user.id}: isPending=${isPending}, session=`,
    session,
    `email=${currentUserEmail}`
  );

  // Don't show loading spinner, just disable functionality until session loads

  // Debug rendering state
  console.log(
    `🎨 Rendering user ${user.id}: isEditing=${isEditing}, isLockPending=${isLockPending}, isLocked=${lockInfo.isLocked}, lockedBy=${lockInfo.lockedBy}, currentUser=${currentUserEmail}`
  );
  console.log(
    `🎨 Lock analysis: isLockedByCurrentUser=${isLockedByCurrentUser}, isLockedByOtherAdmin=${isLockedByOtherAdmin}`
  );

  // Debug button rendering decision
  if (!isEditing && !isLockPending) {
    if (isLockedByOtherAdmin) {
      console.log(
        `🔒 User ${user.id}: Showing LOCKED indicator (locked by ${lockInfo.lockedBy})`
      );
    } else {
      console.log(`📝 User ${user.id}: Showing EDIT button (ready for click)`);
    }
  } else if (isLockPending) {
    console.log(`⏳ User ${user.id}: Showing LOADING spinner (creating lock)`);
  } else {
    console.log(
      `⚙️ User ${user.id}: Showing DROPDOWN + CLOSE buttons (edit mode active)`
    );
  }

  return (
    <div className="flex flex-row gap-2">
      {/* Show different UI based on editing state */}
      {!isEditing ? (
        /* Default state: Edit button OR locked indicator */
        isLockedByOtherAdmin ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-amber-500/50"
                  disabled
                >
                  <span className="sr-only">User locked</span>
                  <Edit className="size-4 text-amber-500/75" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{lockInfo.lockedBy} is editing this user</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="outline"
            size="icon"
            disabled={isPending || !session?.user?.email || isLockPending}
            onClick={(e) => {
              console.log(`🖱️ Edit button CLICKED for user ${user.id}`, e);
              handleStartEdit();
            }}
            onMouseDown={() =>
              console.log(`🖱️ Edit button MOUSE DOWN for user ${user.id}`)
            }
          >
            <span className="sr-only">Edit user</span>
            {isLockPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Edit
                className={`size-4 ${
                  isPending || !session?.user?.email ? "opacity-50" : ""
                }`}
              />
            )}
          </Button>
        )
      ) : (
        /* Editing state: Dropdown menu + Close button */
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <span className="sr-only">User actions</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
              >
                <Copy />
                Copy user ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction("update")}>
                <UserIcon />
                Edit user{" "}
                {isLockedByOtherAdmin ? "(⚠️ Another admin editing)" : ""}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("setPassword")}>
                <Key />
                Set password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("impersonate")}>
                <Shield />
                Impersonate user
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.banned ? (
                <DropdownMenuItem onClick={() => handleAction("unban")}>
                  <Eye />
                  Unban user
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleAction("ban")}>
                  <Ban />
                  Ban user
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleAction("delete")}
              >
                <UserX />
                Delete user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close edit mode button */}
          <Button
            variant="outline"
            size="icon"
            className="text-rose-500 hover:text-rose-700 border-rose-500 hover:border-rose-700"
            onClick={handleEndEdit}
          >
            <span className="sr-only">Close edit mode</span>
            <X className="size-4" />
          </Button>
        </>
      )}

      {/* Show lock indicator only when locked by another admin and we're not editing */}
      {isLockedByOtherAdmin && !isEditing && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="text-amber-500">
                <Dot className="size-16 animate-pulse" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{lockInfo.lockedBy} is editing</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Show edit mode indicator when we're editing */}
      {isEditing && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="text-emerald-500"
              >
                <Dot className="size-16 animate-pulse" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>You are editing</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <DialogPortal>
        <UserActionsDialog
          isOpen={dialogOpen}
          onClose={handleDialogClose}
          action={dialogAction}
          user={user}
          onSuccess={() => {
            console.log(`🎉 Dialog success callback for user ${user.id}`);
            handleUserUpdateSuccess();
            onUserUpdate();
          }}
        />
      </DialogPortal>
    </div>
  );
}

export function createColumns(onUserUpdate: () => void): ColumnDef<User>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("name") || "-"}</div>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "emailVerified",
      header: () => <div className="text-center">Verified</div>,
      cell: ({ row }) => {
        const verified = row.getValue("emailVerified") as boolean;

        // Better Auth uses boolean with default false (never null)
        return (
          <div className="flex justify-center">
            {verified === true ? (
              <Badge variant="success-outline">Verified</Badge>
            ) : (
              <Badge variant="warning">Unverified</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: () => <div className="text-center">Role</div>,
      cell: ({ row }) => {
        const role = (row.getValue("role") as string) || "user";
        return (
          <div className="flex justify-center">
            <Badge variant={role === "admin" ? "success" : "outline"}>
              {capitalizeRole(role)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "banned",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const banned = row.getValue("banned") as boolean;
        const banExpires = row.original.banExpires;
        const banReason = row.original.banReason;

        if (banned) {
          const isExpired = banExpires && new Date(banExpires) < new Date();
          const formattedExpiry = banExpires
            ? new Date(banExpires).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Indefinite Ban";

          return (
            <div className="flex justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="error">
                      {isExpired ? "Ban Expired" : "Banned"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      {banReason && (
                        <div>
                          <span className="font-semibold">Reason:</span>{" "}
                          {banReason}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">Expires:</span>{" "}
                        {formattedExpiry}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        }

        return (
          <div className="flex justify-center">
            <Badge variant="success-outline">Active</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Created
              <ArrowUpDown />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const dateValue = row.getValue("createdAt");
        const date = new Date(dateValue as string | Date);
        return (
          <div className="flex justify-center">
            <div className="text-sm text-muted-foreground">
              {date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "id",
      header: () => <div className="text-center">ID</div>,
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return (
          <div className="flex justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="font-mono text-sm text-muted-foreground hover:text-foreground cursor-default transition-colors">
                    {id.slice(0, 8)}...
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{id}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-center">
            <ActionsCell user={row.original} onUserUpdate={onUserUpdate} />
          </div>
        );
      },
    },
  ];
}

// Export the columns for backward compatibility
export const columns = createColumns(() => {});
