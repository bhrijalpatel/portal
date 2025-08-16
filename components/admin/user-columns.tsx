"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Shield, Ban, Key, UserX, Eye, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserActionsDialog } from "./user-actions-dialog"
import { useState } from "react"

// User type based on current database schema with admin plugin fields
export type User = {
  id: string
  email: string
  name: string | null
  displayName: string | null
  role: string | null
  banned: boolean | null
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
}

// Actions cell component with dialog state management
function ActionsCell({ user, onUserUpdate }: { user: User; onUserUpdate: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"create" | "update" | "setPassword" | "ban" | "unban" | "delete" | "impersonate">("update");

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
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(user.id)}
          >
            Copy user ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction("update")}>
            <UserIcon className="mr-2 h-4 w-4" />
            Edit user
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("setPassword")}>
            <Key className="mr-2 h-4 w-4" />
            Set password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("impersonate")}>
            <Shield className="mr-2 h-4 w-4" />
            Impersonate user
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.banned ? (
            <DropdownMenuItem onClick={() => handleAction("unban")}>
              <Eye className="mr-2 h-4 w-4" />
              Unban user
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleAction("ban")}>
              <Ban className="mr-2 h-4 w-4" />
              Ban user
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => handleAction("delete")}
          >
            <UserX className="mr-2 h-4 w-4" />
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
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
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
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("name") || "-"}</div>,
    },
    {
      accessorKey: "displayName",
      header: "Display Name",
      cell: ({ row }) => <div>{row.getValue("displayName") || "-"}</div>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = (row.getValue("role") as string) || "user"
        return (
          <Badge variant={role === "admin" ? "destructive" : "secondary"}>
            {role}
          </Badge>
        )
      },
    },
    {
      accessorKey: "banned",
      header: "Status",
      cell: ({ row }) => {
        const banned = row.getValue("banned") as boolean
        const banExpires = row.original.banExpires
        
        if (banned) {
          const isExpired = banExpires && new Date(banExpires) < new Date()
          return (
            <Badge variant="destructive">
              {isExpired ? "Ban Expired" : "Banned"}
            </Badge>
          )
        }
        
        return <Badge variant="outline">Active</Badge>
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
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const dateValue = row.getValue("createdAt")
        const date = new Date(dateValue as string | Date)
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        )
      },
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        const id = row.getValue("id") as string
        return <div className="font-mono text-sm text-muted-foreground">{id.slice(0, 8)}...</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        return <ActionsCell user={row.original} onUserUpdate={onUserUpdate} />
      },
    },
  ];
}

// Export the columns for backward compatibility
export const columns = createColumns(() => {});
