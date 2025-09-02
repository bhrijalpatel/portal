"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Search,
  Plus,
  Shield,
  Check,
  Users,
  Ban,
  Eye,
  X,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
// import { DialogStateProvider } from "./dialog-state-provider";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserActionsDialog } from "./user-actions-dialog";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { RefreshButton } from "./button-refresh-data";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  title?: string;
  onDataChange?: () => void;
  onRefresh?: () => Promise<void>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  title,
  onDataChange,
  onRefresh,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "name",
      desc: false, // ascending order (A-Z)
    },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [isStoppingImpersonation, setIsStoppingImpersonation] =
    React.useState(false);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [isBulkActionLoading, setIsBulkActionLoading] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
    },
  });

  const handleStopImpersonation = async () => {
    setIsStoppingImpersonation(true);
    try {
      await authClient.admin.stopImpersonating();
      toast.success("Stopped impersonation");
      // Refresh the page to return to admin session
      window.location.reload();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to stop impersonation";
      toast.error(message);
      setIsStoppingImpersonation(false);
    }
  };

  // Bulk actions
  const handleBulkVerifyEmails = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const userIds = selectedRows.map(
      (row) => (row.original as { id: string }).id,
    );

    if (userIds.length === 0) {
      toast.error("No users selected");
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const response = await fetch("/api/admin/bulk-update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds,
          emailVerified: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify emails");
      }

      toast.success(`Verified emails for ${userIds.length} user(s)`, {
        id: "bulk-verify",
      });
      setRowSelection({});
      onDataChange?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to verify emails";
      toast.error(message);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkUnverifyEmails = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const userIds = selectedRows.map(
      (row) => (row.original as { id: string }).id,
    );

    if (userIds.length === 0) {
      toast.error("No users selected");
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const response = await fetch("/api/admin/bulk-update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds,
          emailVerified: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unverify emails");
      }

      toast.success(`Unverified emails for ${userIds.length} user(s)`, {
        id: "bulk-unverify",
      });
      setRowSelection({});
      onDataChange?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to unverify emails";
      toast.error(message);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkBanUsers = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const userIds = selectedRows.map(
      (row) => (row.original as { id: string }).id,
    );

    if (userIds.length === 0) {
      toast.error("No users selected");
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const response = await fetch("/api/admin/bulk-ban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds,
          banReason: "Bulk ban action",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to ban users");
      }

      toast.success(`Banned ${userIds.length} user(s)`, {
        id: "bulk-ban",
      });
      setRowSelection({});
      onDataChange?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to ban users";
      toast.error(message);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkUnbanUsers = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const userIds = selectedRows.map(
      (row) => (row.original as { id: string }).id,
    );

    if (userIds.length === 0) {
      toast.error("No users selected");
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const response = await fetch("/api/admin/bulk-unban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unban users");
      }

      toast.success(`Unbanned ${userIds.length} user(s)`, {
        id: "bulk-unban",
      });
      setRowSelection({});
      onDataChange?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to unban users";
      toast.error(message);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Check if we're currently impersonating
  const { data: session } = authClient.useSession();
  const isImpersonating = session?.session?.impersonatedBy;

  return (
    <div className="w-full">
      {/* Impersonation banner */}
      {isImpersonating && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-100 p-3 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="size-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                You are currently impersonating a user
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStopImpersonation}
              disabled={isStoppingImpersonation}
            >
              {isStoppingImpersonation ? "Stopping..." : "Stop Impersonation"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-8"
              disabled={isLoading}
            />
          </div>
          {title && (
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          {Object.keys(rowSelection).length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {Object.keys(rowSelection).length} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isBulkActionLoading}>
                    {isBulkActionLoading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Users className="mr-2 size-4" />
                    )}
                    Bulk Actions
                    <ChevronDown className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleBulkVerifyEmails}>
                    <Check className="mr-2 size-4" />
                    Verify Emails
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkUnverifyEmails}>
                    <X className="mr-2 size-4" />
                    Unverify Emails
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleBulkBanUsers}>
                    <Ban className="mr-2 size-4" />
                    Ban Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkUnbanUsers}>
                    <Eye className="mr-2 size-4" />
                    Unban Users
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <Button
            onClick={() => setCreateDialogOpen(true)}
            disabled={isLoading}
          >
            <Plus />
            <span>Create User</span>
          </Button>
          {onRefresh && (
            <RefreshButton onRefresh={onRefresh} isLoading={isLoading} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                Columns
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              [...Array(8)].map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" /> {/* Checkbox */}
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" /> {/* Name */}
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" /> {/* Email */}
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />{" "}
                    {/* Verified Badge */}
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />{" "}
                    {/* Role Badge */}
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />{" "}
                    {/* Status Badge */}
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" /> {/* Created Date */}
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" /> {/* Actions */}
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1"></div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create User Dialog */}
      <UserActionsDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        action="create"
        onSuccess={() => {
          onDataChange?.();
        }}
      />
    </div>
  );
}
