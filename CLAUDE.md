# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development Server:**
```bash
npm run dev        # Start development server with Turbopack
pnpm dev          # Alternative using pnpm (preferred based on pnpm-lock.yaml)
```

**Build & Production:**
```bash
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

**Database Operations:**
```bash
npx drizzle-kit generate    # Generate database migrations
npx drizzle-kit migrate     # Apply database migrations
npx drizzle-kit studio      # Open Drizzle Studio for database management
```

## Architecture Overview

This is a **Next.js 15 App Router** application with **Better Auth** for authentication and **Drizzle ORM** with **PostgreSQL** for data persistence.

### Key Technologies:
- **Framework:** Next.js 15 with App Router
- **Authentication:** Better Auth with email/password authentication and "Remember me" functionality
- **Database:** PostgreSQL with Drizzle ORM
- **UI:** Tailwind CSS + shadcn/ui components
- **Forms:** React Hook Form with Zod validation
- **State:** React built-in state management
- **Notifications:** Sonner for toast notifications

### Project Structure:

**Authentication Flow:**
- `/lib/auth.ts` - Better Auth server configuration with Drizzle adapter, security settings, and session management
- `/lib/auth-client.ts` - Client-side auth utilities (signIn, signUp, signOut, useSession)
- `/lib/auth-helpers.ts` - Server-side session helpers (`requireSession()`, `getSessionOrNull()`, `requireRole()`)
- `/lib/api-helpers.ts` - API route protection wrappers (`withAuth()`, `withAdminAuth()`)
- `/app/api/auth/[...all]/route.ts` - Auth API routes handler
- `/app/(protected)/layout.tsx` - Route group layout with server-side protection
- `/app/(auth)/layout.tsx` - Auth pages layout with redirect guard for authenticated users
- `/middleware.ts` - Optional UX-only middleware for faster redirects

**Database Schema (`/db/schema.ts`):**
- `user` table - User accounts with email/password
- `session` table - User sessions with expiry and device info
- `account` table - External provider accounts (OAuth)
- `verification` table - Email verification tokens
- `profiles` table - User profiles with roles and display names

**UI Components:**
- `/components/ui/` - shadcn/ui base components (Button, Card, Form, Input, Checkbox, etc.)
- `/components/forms/` - Auth forms using React Hook Form + Zod validation:
  - `signin-form.tsx` - Sign in form with "Remember me" functionality
  - `signup-form.tsx` - Sign up form
- `/components/buttons/` - Action button components:
  - `ButtonSignOut.tsx` - Sign out component with loading states
  - `ButtonAdmin.tsx` - Admin access button (role-restricted)
  - `ButtonDashboard.tsx` - Dashboard navigation button
- `/components/navigation/` - Navigation components:
  - `app-sidebar.tsx` - Main application sidebar
  - `nav-main.tsx` - Main navigation menu
  - `nav-user.tsx` - User navigation dropdown
  - `nav-user-client.tsx` - Client-side user navigation with theme toggle
- `/components/admin/` - Admin-specific components:
  - `UserTable.tsx` - Admin user management table
  - `CacheRefreshButton.tsx` - Admin cache management

**Pages:**
- `/app/page.tsx` - Landing page
- `/app/(auth)/sign-in/page.tsx` - Sign in page
- `/app/(auth)/sign-up/page.tsx` - Sign up page  
- `/app/(protected)/dashboard/page.tsx` - Protected dashboard (requires auth)
- `/app/(protected)/admin/page.tsx` - Admin panel (requires admin role)
- `/app/(protected)/inventory/page.tsx` - Inventory management page
- `/app/(setup)/admin-setup/page.tsx` - Admin bootstrap/claim page

**API Routes:**
- `/app/api/admin/users/route.ts` - Admin user management with Zod validation
- `/app/api/admin/bootstrap/route.ts` - Admin role claiming
- `/app/api/admin/cache/refresh/route.ts` - Cache management

### Authentication Implementation:

The app uses **Better Auth** with **client-side authentication** and **server-side protection** following recommended patterns:

**Protection Strategy:**
- **Primary Security**: `app/(protected)/layout.tsx` uses `requireSession()` for real database session validation
- **Role-Based Access**: `requireRole()` helper for admin-only routes
- **Secondary UX**: `middleware.ts` provides optional fast redirects for better user experience
- **API Protection**: `withAuth()` and `withAdminAuth()` helpers wrap API routes with session validation

**Better Auth Configuration:**
- Email/password authentication enabled with "Remember me" functionality
- 30-day sessions with daily refresh cycles
- Rate limiting and secure cookies enabled
- Drizzle adapter for PostgreSQL persistence
- Client-side authentication using `authClient.signIn.email()` and `authClient.signUp.email()`
- Toast notifications for success/error feedback using Sonner

**Client-Side Authentication:**
- Uses Better Auth client API for reliable cookie handling
- "Remember me" creates persistent cookies vs session-only cookies
- Form-based sign-in/sign-up with React Hook Form + Zod validation
- Consistent "Sign In/Sign Out" terminology throughout application

**IMPORTANT - Middleware Maintenance:**
When adding new protected pages under `app/(protected)/`, the middleware matcher in `/middleware.ts` already includes the pattern. Current matcher:
```ts
export const config = {
  matcher: ["/(protected)/(.*)", "/dashboard", "/admin"],
};
```

### Database Configuration:

Database connection configured in `/drizzle.config.ts` using `DATABASE_URL` environment variable. Schema exports are consolidated in `schema` object for Better Auth integration.

### API Security:

**Input Validation:**
- All admin API routes use Zod schemas for request validation
- Content-type validation (415 errors for invalid content types)
- Method validation (405 errors for unsupported HTTP methods)
- Detailed error responses with validation details

**Security Headers:**
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Permissions-Policy for enhanced security
- Configured in `next.config.ts`

### Development Workflow:

**IMPORTANT - Post-Implementation Steps:**
After completing any code changes or new features, you MUST immediately update the `CHANGELOG.md` file with:
- What was added/changed/removed
- Any breaking changes
- Security implications
- Documentation updates

**Development Notes:**
- Uses absolute imports with `@/*` path mapping
- TailwindCSS 4.0 with PostCSS configuration
- Sonner for toast notifications (success/error feedback)
- TypeScript with strict mode enabled
- ESLint with Next.js configuration
- Language consistency: "Sign In/Sign Out" terminology throughout codebase

**Authentication Best Practices:**
- Use `authClient.signIn.email()` and `authClient.signUp.email()` for client-side auth
- Avoid server actions for authentication (potential cookie timing issues)
- Always include "Remember me" functionality in sign-in forms
- Use `requireSession()` for protected server components
- Use `withAuth()` and `withAdminAuth()` for API route protection

**Project Documentation:**
- `CLAUDE.md` - Architecture guidance and development instructions
- `CHANGELOG.md` - All notable changes and project history
- `README.md` - Basic setup and getting started guide