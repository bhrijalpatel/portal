import { db } from "@/db/drizzle";
import { user as authUsers, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache, revalidateTag } from "next/cache";
import { UserTableClient } from "./user-table-client";

// Cached user data fetching function using Better Auth user.role as source of truth
const getCachedUsers = unstable_cache(
  async () => {
    console.log(
      "🔍 Fetching users with Better Auth roles as source of truth..."
    );
    return await db
      .select({
        id: authUsers.id,
        email: authUsers.email,
        name: authUsers.name,
        createdAt: authUsers.createdAt,
        // Better Auth admin plugin fields (SINGLE SOURCE OF TRUTH)
        role: authUsers.role,
        banned: authUsers.banned,
        banReason: authUsers.banReason,
        banExpires: authUsers.banExpires,
        // Custom profile fields (supplementary metadata)
        displayName: profiles.displayName,
        fullName: profiles.fullName,
        phone: profiles.phone,
        avatarUrl: profiles.avatarUrl,
      })
      .from(authUsers)
      .leftJoin(profiles, eq(authUsers.id, profiles.userId));
  },
  ["admin-users-unified"], // new cache key
  {
    tags: ["admin-users-unified"], // for revalidation
    revalidate: 3600, // 1 hour cache duration
  }
);

// Server action to invalidate cache
async function revalidateUsers() {
  "use server";
  revalidateTag("admin-users-unified");
}

export async function UserTable() {
  // Use cached data with Better Auth role as source of truth
  console.log(
    "📦 Loading users with Better Auth unified role system (cached)..."
  );
  const users = await getCachedUsers();

  return (
    <UserTableClient initialUsers={users} onRevalidate={revalidateUsers} />
  );
}
