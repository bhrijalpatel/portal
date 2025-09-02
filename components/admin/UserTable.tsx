import { db } from "@/db/drizzle";
import { user as authUsers } from "@/db/schema";
import { UserTableClient } from "./user-table-client";

// Always fetch fresh data - no caching
async function fetchUsers() {
  return await db
    .select({
      id: authUsers.id,
      email: authUsers.email,
      name: authUsers.name,
      emailVerified: authUsers.emailVerified,
      createdAt: authUsers.createdAt,
      // Better Auth admin plugin fields (SINGLE SOURCE OF TRUTH)
      role: authUsers.role,
      banned: authUsers.banned,
      banReason: authUsers.banReason,
      banExpires: authUsers.banExpires,
    })
    .from(authUsers);
}

export async function UserTable() {
  const users = await fetchUsers();

  return <UserTableClient initialUsers={users} />;
}
