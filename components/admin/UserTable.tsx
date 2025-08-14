import { db } from "@/db/drizzle";
import { user as authUsers, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

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
  ['admin-users'], // cache key
  {
    tags: ['admin-users'], // for revalidation
    revalidate: 3600, // 1 hour cache duration
  }
);

export async function UserTable() {
  // Use cached data instead of direct DB query
  console.log("📦 Loading users (cached)...");
  const users = await getCachedUsers();

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-6 py-3 border-b">
        <h2 className="text-lg font-semibold">Users ({users.length})</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Display Name</th>
              <th className="text-left p-4 font-medium">Role</th>
              <th className="text-left p-4 font-medium">Created</th>
              <th className="text-left p-4 font-medium">ID</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => (
              <tr
                key={u.id}
                className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
              >
                <td className="p-4">{u.email}</td>
                <td className="p-4">{u.name ?? "-"}</td>
                <td className="p-4">{u.displayName ?? "-"}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === "admin"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {u.role ?? "user"}
                  </span>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-sm font-mono text-muted-foreground">
                  {u.id.slice(0, 8)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}