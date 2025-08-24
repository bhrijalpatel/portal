import { DataTable } from "@/components/admin/user-data-table";

export function UserTableSkeleton() {
  return (
    <DataTable
      columns={[]}
      data={[]}
      isLoading={true}
      title="Total Users (0)"
    />
  );
}
