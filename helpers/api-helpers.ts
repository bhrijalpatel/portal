// helpers/api-helpers.ts
import { requireSession, requireRole, Session } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

type Handler = (
  ctx: { session: Session },
  request: Request | NextRequest,
) => Promise<Response>;

type AdminHandler = (
  ctx: { session: Session; userRole: string },
  request: Request | NextRequest,
) => Promise<Response>;

export function withAuth(handler: Handler) {
  return async (request: Request | NextRequest) => {
    const session = await requireSession();
    return handler({ session }, request);
  };
}

export function withAdminAuth(handler: AdminHandler) {
  return async (request: Request | NextRequest) => {
    const { session, userRole } = await requireRole("admin");
    return handler({ session, userRole }, request);
  };
}
