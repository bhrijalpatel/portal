// lib/api-helpers.ts
import { requireSession, requireRole, Session } from "@/lib/auth-helpers";
import { profiles } from "@/db/schema";
import { NextRequest } from "next/server";

type Handler = (
  ctx: { session: Session },
  request: Request | NextRequest
) => Promise<Response>;

type ProfileType = typeof profiles.$inferSelect;

type AdminHandler = (
  ctx: { session: Session; profile: ProfileType },
  request: Request | NextRequest
) => Promise<Response>;

export function withAuth(handler: Handler) {
  return async (request: Request | NextRequest) => {
    const session = await requireSession();
    return handler({ session }, request);
  };
}

export function withAdminAuth(handler: AdminHandler) {
  return async (request: Request | NextRequest) => {
    const { session, profile } = await requireRole("admin");
    return handler({ session, profile }, request);
  };
}
