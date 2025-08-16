import { db } from "@/db/drizzle";
import { user as authUsers, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { columns } from "@/components/admin/user-columns";
import { DataTable } from "@/components/admin/user-data-table";

// Cached user data fetching function
const getCachedUsers = unstable_cache(
  async () => {
    console.log("🔍 Fetching users from database...");
    return await db
      .select({
        id: authUsers.id,
        email: authUsers.email,
        name: authUsers.name,
        createdAt: authUsers.createdAt,
        role: profiles.role,
        displayName: profiles.displayName,
      })
      .from(authUsers)
      .leftJoin(profiles, eq(authUsers.id, profiles.userId));
  },
  ["admin-users"], // cache key
  {
    tags: ["admin-users"], // for revalidation
    revalidate: 3600, // 1 hour cache duration
  }
);

export async function UserTable() {
  // Use cached data instead of direct DB query
  console.log("📦 Loading users (cached)...");
  const users = await getCachedUsers();

  return (
    <DataTable 
      columns={columns} 
      data={users} 
      title={`Total Users (${users.length})`}
    />
  );
}
