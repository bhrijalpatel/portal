// lib/api-helpers.ts
import { requireSession, requireRole, Session } from "@/lib/auth-helpers";
import { profiles } from "@/db/schema";

type Handler = (
  ctx: { session: Session },
  request?: Request
) => Promise<Response>;

type ProfileType = typeof profiles.$inferSelect;

type AdminHandler = (
  ctx: { session: Session; profile: ProfileType },
  request?: Request
) => Promise<Response>;

export function withAuth(handler: Handler) {
  return async (request?: Request) => {
    const session = await requireSession();
    return handler({ session }, request);
  };
}

export function withAdminAuth(handler: AdminHandler) {
  return async (request?: Request) => {
    const { session, profile } = await requireRole("admin");
    return handler({ session, profile }, request);
  };
}
