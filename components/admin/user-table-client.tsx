"use client";

import { useTransition } from "react";
import { createColumns, User } from "@/components/admin/user-columns";
import { DataTable } from "@/components/admin/user-data-table";

interface ClientUserTableProps {
  initialUsers: User[];
  onRevalidate: () => Promise<void>;
}

export function UserTableClient({
  initialUsers,
  onRevalidate,
}: ClientUserTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleDataChange = () => {
    startTransition(async () => {
      await onRevalidate();
    });
  };

  // Create columns with data change handler
  const columnsWithUpdate = createColumns(handleDataChange);

  return (
    <DataTable
      columns={columnsWithUpdate}
      data={initialUsers}
      title={`Total Users (${initialUsers.length})`}
      onDataChange={handleDataChange}
      isLoading={isPending}
    />
  );
}
