import { db } from "@/db/drizzle";
import { user as authUsers } from "@/db/schema";

// Retry function for Neon database wake-up
export async function fetchUsersWithRetry(maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {

      const users = await db
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

      return users;
    } catch (error) {
      lastError = error;
      console.error(
        `Database attempt ${attempt} failed:`,
        error instanceof Error ? error.message : "Unknown error",
      );

      // If it's likely a connection timeout/wake-up issue, wait before retry
      if (
        attempt < maxRetries &&
        error instanceof Error &&
        (error.message?.includes("timeout") ||
          error.message?.includes("connection") ||
          error.message?.includes("ECONNRESET"))
      ) {
        const waitTime = attempt * 2000; // Progressive delay: 2s, 4s, 6s
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
