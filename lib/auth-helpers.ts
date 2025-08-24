// lib/auth-helpers.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
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
 * Get session with user role - uses Better Auth user.role as single source of truth
 * Used in layouts to get both session and role at once
 */
export async function getSessionWithRole(): Promise<{
  session: Session;
  userRole: string;
}> {
  const session = await requireSession();

  // Use Better Auth user.role as single source of truth (no additional DB query needed)
  const userRole = session.user.role || "user";
  return { session, userRole };
}

/**
 * Safe version for layouts - returns null if no session
 * Use this in layouts to avoid redirect loops
 */
export async function getSessionWithRoleOrNull(): Promise<{
  session: Session;
  userRole: string;
} | null> {
  const session = await getSessionOrNull();
  if (!session) return null;

  // Use Better Auth user.role as single source of truth (no additional DB query needed)
  const userRole = session.user.role || "user";
  return { session, userRole };
}

/**
 * Role-based access control guard
 * Uses Better Auth user.role as single source of truth
 */
export async function requireRole(role: string | string[]) {
  const session = await requireSession();
  const roles = Array.isArray(role) ? role : [role];

  // Use Better Auth user.role as single source of truth (no additional DB query needed)
  const userRole = session.user.role || "user";

  if (!roles.includes(userRole)) redirect("/403");
  return { session, userRole };
}

// --- Bootstrap admin helpers ---

/**
 * Check if any admin exists in the system using Better Auth user.role
 */
export async function adminExists(): Promise<boolean> {
  // Check Better Auth user table for admin role (single source of truth)
  const adminUser = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "admin"))
    .limit(1);
  return adminUser.length > 0;
}

// Note: ensureProfile function temporarily removed as we migrate to user.role as single source of truth
// Profile table will become supplementary data only (displayName, avatarUrl, etc.)
// All role management now handled through Better Auth user.role field
