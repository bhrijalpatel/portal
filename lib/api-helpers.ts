// lib/api-helpers.ts
import { requireSession, Session } from "@/lib/auth-helpers";

type Handler = (ctx: { session: Session }) => Promise<Response>;

export function withAuth(handler: Handler) {
  return async () => {
    const session = await requireSession();
    return handler({ session });
  };
}