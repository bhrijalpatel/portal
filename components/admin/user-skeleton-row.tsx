"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface UserSkeletonRowProps {
  creatingAdmin: string;
}

export function UserSkeletonRow({ creatingAdmin }: UserSkeletonRowProps) {
  return (
    <TableRow className="animate-pulse bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800">
      {/* Select checkbox */}
      <TableCell>
        <Skeleton className="h-4 w-4 rounded-sm" />
      </TableCell>
      
      {/* Name */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Badge variant="secondary" className="text-xs">
            Creating...
          </Badge>
        </div>
      </TableCell>
      
      {/* Email */}
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      
      {/* Email Verified */}
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      
      {/* Role */}
      <TableCell>
        <Skeleton className="h-5 w-14 rounded-full" />
      </TableCell>
      
      {/* Status */}
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      
      {/* Created */}
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      
      {/* Actions */}
      <TableCell>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
            {creatingAdmin} is creating...
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}