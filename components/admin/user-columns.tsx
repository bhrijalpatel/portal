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
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserActionsDialog } from "./user-actions-dialog";
import { useState } from "react";

// User type based on Better Auth user table only (single source of truth)
export type User = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;  // Better Auth: NOT NULL with default false
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

  const handleAction = (action: typeof dialogAction) => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
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
            Edit user
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

      <UserActionsDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        action={dialogAction}
        user={user}
        onSuccess={onUserUpdate}
      />
    </>
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
      header: "Verified",
      cell: ({ row }) => {
        const verified = row.getValue("emailVerified") as boolean;
        
        // Better Auth uses boolean with default false (never null)
        if (verified === true) {
          return (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Verified</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600">Unverified</span>
            </div>
          );
        }
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = (row.getValue("role") as string) || "user";
        return (
          <Badge variant={role === "admin" ? "destructive" : "secondary"}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "banned",
      header: "Status",
      cell: ({ row }) => {
        const banned = row.getValue("banned") as boolean;
        const banExpires = row.original.banExpires;

        if (banned) {
          const isExpired = banExpires && new Date(banExpires) < new Date();
          return (
            <Badge variant="destructive">
              {isExpired ? "Ban Expired" : "Banned"}
            </Badge>
          );
        }

        return <Badge variant="outline">Active</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dateValue = row.getValue("createdAt");
        const date = new Date(dateValue as string | Date);
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return (
          <div className="font-mono text-sm text-muted-foreground">
            {id.slice(0, 8)}...
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        return <ActionsCell user={row.original} onUserUpdate={onUserUpdate} />;
      },
    },
  ];
}

// Export the columns for backward compatibility
export const columns = createColumns(() => {});
