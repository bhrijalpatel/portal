// middleware.ts - Comprehensive route protection with Better Auth
// Why: Middleware provides the fastest protection by running before page rendering
// Citation: https://www.better-auth.com/docs/concepts/middleware
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // SECURITY: CVE-2025-29927 Protection
  // Filter out x-middleware-subrequest header to prevent bypass attacks
  const headers = new Headers(req.headers);
  headers.delete("x-middleware-subrequest");

  // Skip middleware for auth API routes (handled by Better Auth internally)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Get session using Better Auth's secure method
  const session = await auth.api.getSession({ headers });

  // Public routes - always allow access
  const publicRoutes = [
    "/",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/admin-setup", // Allow admin setup for initial configuration
  ];

  if (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  ) {
    // Redirect authenticated users away from auth pages
    if (session && (pathname === "/sign-in" || pathname === "/sign-up")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  const protectedRoutes = [
    "/dashboard",
    "/inventory",
    "/admin",
    "/api/private",
    "/api/realtime",
    "/api/admin",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute) {
    if (!session) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Admin-only routes - require admin role
    const adminRoutes = ["/admin", "/api/admin"];
    const isAdminRoute = adminRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

    if (isAdminRoute) {
      const userRole = session.user.role || "user";
      if (userRole !== "admin") {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }
  }

  return NextResponse.next();
}

// Use Node.js runtime for Better Auth compatibility
export const runtime = "nodejs";

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (handled by Better Auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
