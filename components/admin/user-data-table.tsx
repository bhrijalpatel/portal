"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Search, Plus, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { CacheRefreshButton } from "./button-refresh-user-cache";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  title?: string;
  onDataChange?: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  title,
  onDataChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [isStoppingImpersonation, setIsStoppingImpersonation] =
    React.useState(false);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
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

  // Check if we're currently impersonating
  const { data: session } = authClient.useSession();
  const isImpersonating = session?.session?.impersonatedBy;

  return (
    <div className="w-full">
      {/* Impersonation banner */}
      {isImpersonating && (
        <div className="mb-4 p-3 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-orange-600" />
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
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-8"
              disabled={isLoading}
            />
          </div>
          {title && (
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            disabled={isLoading}
          >
            <Plus />
            <span>Create User</span>
          </Button>
          <CacheRefreshButton />
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
                            header.getContext()
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
                    <Skeleton className="h-4 w-48" /> {/* Email */}
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" /> {/* Name */}
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" /> {/* Display Name */}
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
                    <Skeleton className="h-4 w-16" /> {/* ID */}
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" /> {/* Actions */}
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
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
