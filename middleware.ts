// middleware.ts (optional UX only)
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(req: NextRequest) {
  // Match the custom cookie configuration from auth.ts
  const cookie = getSessionCookie(req, {
    cookiePrefix: "Portal", // Match our auth config
  });

  if (!cookie && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(protected)/(.*)", "/dashboard", "/admin"],
};
