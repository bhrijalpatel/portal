// lib/auth-helpers.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

// Reusable Session type from your Better-Auth instance
export type Session = typeof auth.$Infer.Session;

/**
 * Strict guard for server components / server actions.
 * Redirects to /sign-in if there's no valid session in the DB.
 */
export async function requireSession(): Promise<Session> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return session;
}

/**
 * Opposite guard for public auth pages (sign-in/up)
 * Redirects authenticated users away from auth pages.
 */
export async function redirectIfAuthenticated(to: string = "/dashboard") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(to);
}

/**
 * Non-throwing variant. Returns null instead of redirecting.
 * Useful when a page can render for both authed and guest users.
 */
export async function getSessionOrNull(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Role-based access control guard
 * Requires both session and specific role(s)
 */
export async function requireRole(role: string | string[]) {
  const session = await requireSession();
  const roles = Array.isArray(role) ? role : [role];

  const [p] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  if (!p || !roles.includes(p.role)) redirect("/403");
  return { session, profile: p };
}

// --- Bootstrap admin helpers ---

/**
 * Check if any admin profile exists in the system
 */
export async function adminExists(): Promise<boolean> {
  // True if any admin profile exists
  const rows = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.role, "admin"))
    .limit(1);
  return rows.length > 0;
}

/**
 * Ensure a profile exists for a user, create if missing
 */
export async function ensureProfile(userId: string, defaults?: { role?: string; displayName?: string }) {
  const [found] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (found) return found;
  const [created] = await db.insert(profiles).values({
    userId,
    role: defaults?.role ?? "user",
    displayName: defaults?.displayName,
  }).returning();
  return created;
}
