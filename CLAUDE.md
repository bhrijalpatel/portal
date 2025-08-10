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
- `/app/api/auth/[...all]/route.ts` - Auth API routes handler
- `/middleware.ts` - Route protection middleware (protects `/dashboard`)

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
- `/app/dashboard/page.tsx` - Protected dashboard (requires auth)

### Authentication Implementation:

The app uses Better Auth with:
- Email/password authentication enabled
- Drizzle adapter for PostgreSQL persistence  
- Next.js cookies plugin for session management
- Middleware protection for `/dashboard` route
- Form-based sign-in/sign-up with React Hook Form + Zod validation

### Database Configuration:

Database connection configured in `/drizzle.config.ts` using `DATABASE_URL` environment variable. Schema exports are consolidated in `schema` object for Better Auth integration.

### Development Notes:

- Uses absolute imports with `@/*` path mapping
- TailwindCSS 4.0 with PostCSS configuration
- Sonner for toast notifications
- TypeScript with strict mode enabled
- ESLint with Next.js configuration