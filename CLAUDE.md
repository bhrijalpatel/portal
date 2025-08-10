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
- **Authentication:** Better Auth with email/password authentication
- **Database:** PostgreSQL with Drizzle ORM
- **UI:** Tailwind CSS + shadcn/ui components
- **Forms:** React Hook Form with Zod validation
- **State:** React built-in state management

### Project Structure:

**Authentication Flow:**
- `/lib/auth.ts` - Better Auth server configuration with Drizzle adapter
- `/lib/auth-client.ts` - Client-side auth utilities (signIn, signUp, signOut, useSession)
- `/lib/auth-helpers.ts` - Server-side session helpers (`requireSession()`, `getSessionOrNull()`)
- `/lib/api-helpers.ts` - API route protection wrapper (`withAuth()`)
- `/app/api/auth/[...all]/route.ts` - Auth API routes handler
- `/app/(protected)/layout.tsx` - Route group layout with server-side protection
- `/middleware.ts` - Optional UX-only middleware for faster redirects

**Database Schema (`/db/schema.ts`):**
- `user` table - User accounts with email/password
- `session` table - User sessions with expiry and device info
- `account` table - External provider accounts (OAuth)
- `verification` table - Email verification tokens

**UI Components:**
- `/components/ui/` - shadcn/ui base components (Button, Card, Form, Input, etc.)
- `/components/forms/` - Auth forms (login-form.tsx, signup-form.tsx)
- `/components/logout.tsx` - Logout component

**Pages:**
- `/app/page.tsx` - Landing page
- `/app/sign-in/page.tsx` - Sign in page
- `/app/sign-up/page.tsx` - Sign up page  
- `/app/(protected)/dashboard/page.tsx` - Protected dashboard (requires auth)

### Authentication Implementation:

The app uses **Better Auth** with **server-side protection** following recommended patterns:

**Protection Strategy:**
- **Primary Security**: `app/(protected)/layout.tsx` uses `requireSession()` for real database session validation
- **Secondary UX**: `middleware.ts` provides optional fast redirects for better user experience
- **API Protection**: `withAuth()` helper wraps API routes with session validation

**Better Auth Configuration:**
- Email/password authentication enabled
- Drizzle adapter for PostgreSQL persistence  
- Next.js cookies plugin for session management
- Form-based sign-in/sign-up with React Hook Form + Zod validation

**IMPORTANT - Middleware Maintenance:**
When adding new protected pages under `app/(protected)/`, you must also update the middleware matcher in `/middleware.ts` to include the new routes. Example:
```ts
export const config = { matcher: ["/dashboard", "/settings", "/profile"] };
```

### Database Configuration:

Database connection configured in `/drizzle.config.ts` using `DATABASE_URL` environment variable. Schema exports are consolidated in `schema` object for Better Auth integration.

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
- Sonner for toast notifications
- TypeScript with strict mode enabled
- ESLint with Next.js configuration

**Project Documentation:**
- `CLAUDE.md` - Architecture guidance and development instructions
- `CHANGELOG.md` - All notable changes and project history
- `README.md` - Basic setup and getting started guide