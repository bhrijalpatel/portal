// lib/auth-helpers.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
 * Non-throwing variant. Returns null instead of redirecting.
 * Useful when a page can render for both authed and guest users.
 */
export async function getSessionOrNull(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}