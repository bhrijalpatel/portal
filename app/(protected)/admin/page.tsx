import { Suspense } from "react";
import { UserTable } from "@/components/admin/UserTable";
import { UserTableSkeleton } from "@/components/admin/user-table-skeleton";

export default function AdminPage() {
  // No role check needed - already validated in layout
  return (
    <main className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            Manage users and application settings
          </p>
        </div>
      </div>

      {/* This renders immediately with skeleton, then streams in the real data */}
      <Suspense fallback={<UserTableSkeleton />}>
        <UserTable />
      </Suspense>
    </main>
  );
}
