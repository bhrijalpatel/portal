# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development Server:**

```bash
pnpm dev          # Alternative using pnpm (preferred based on pnpm-lock.yaml)
```

**Build & Production:**

```bash
pnpm build     # Build for production
pnpm start     # Start production server
pnpm lint      # Run ESLint
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
- **UI:** Tailwind CSS + shadcn/ui components (including data tables with TanStack Table)
- **Forms:** React Hook Form with Zod validation
- **State:** React built-in state management
- **Notifications:** Sonner for toast notifications
- **Data Tables:** SHADCN UI data tables with TanStack Table for sorting, filtering, pagination

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

_File Naming Convention: All components use kebab-case naming for consistency_

- `/components/ui/` - shadcn/ui base components (Button, Card, Form, Input, Checkbox, Table, Badge, Skeleton, etc.)
- `/components/forms/` - Auth forms using React Hook Form + Zod validation:
  - `form-signin.tsx` - Sign in form with "Remember me" functionality
  - `form-signup.tsx` - Sign up form
- `/components/buttons/` - Action button components:
  - `button-signout.tsx` - Sign out component with loading states
  - `button-admin.tsx` - Admin access button (role-restricted)
  - `button-dashboard.tsx` - Dashboard navigation button
- `/components/navigation/` - Navigation components:
  - `app-sidebar.tsx` - Main application sidebar
  - `nav-main.tsx` - Main navigation menu
  - `nav-user.tsx` - User navigation dropdown
  - `nav-user-client.tsx` - Client-side user navigation with theme toggle
- `/components/admin/` - Admin-specific components:
  - `UserTable.tsx` - Server component orchestrator for user management
  - `user-columns.tsx` - TanStack Table column definitions for user data
  - `user-data-table.tsx` - SHADCN UI data table component with search, filtering, pagination
  - `user-table-skeleton.tsx` - Loading skeleton matching data table structure
  - `button-refresh-user-cache.tsx` - Admin cache management button

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
- 30-day sessions with daily refresh cycles and cookie cache (5-minute duration)
- Rate limiting and secure cookies enabled
- Drizzle adapter for PostgreSQL persistence
- Client-side authentication using `authClient.signIn.email()` and `authClient.signUp.email()`
- Toast notifications for success/error feedback using Sonner

**Client-Side Authentication:**

- Uses Better Auth client API for reliable cookie handling
- "Remember me" creates persistent cookies vs session-only cookies
- Form-based sign-in/sign-up with React Hook Form + Zod validation
- Consistent "Sign In/Sign Out" terminology throughout application

### Data Table Architecture:

The application uses **SHADCN UI data tables** with **TanStack Table** for all data-heavy interfaces:

**Data Table Components:**

- **Column Definitions** (`*-columns.tsx`) - Define table structure, sorting, filtering, and cell rendering
- **Data Table Component** (`*-data-table.tsx`) - Reusable table with search, pagination, column visibility
- **Skeleton Component** (`*-table-skeleton.tsx`) - Loading states that match table structure
- **Orchestrator Component** (`*.tsx`) - Server component that fetches data and renders table

**Features:**

- **Global Search** - Search across all columns with search icon
- **Column Management** - Show/hide columns via dropdown
- **Sorting** - Click headers to sort data (asc/desc)
- **Pagination** - Previous/Next navigation with row counts
- **Row Selection** - Checkboxes for bulk operations
- **Row Actions** - Dropdown menus for individual row operations
- **Loading States** - Skeleton components with disabled controls
- **Responsive Design** - Mobile-friendly layout and interactions

**Implementation Pattern:**

```typescript
// Server component fetches data
export async function DataOrchestrator() {
  const data = await fetchData()
  return <DataTable columns={columns} data={data} />
}

// Column definitions with sorting, filtering, actions
export const columns: ColumnDef<DataType>[] = [
  // Select, sortable columns, actions, etc.
]

// Reusable data table component
export function DataTable<TData, TValue>({
  columns, data, isLoading?, title?
}: DataTableProps<TData, TValue>) {
  // TanStack Table logic with state management
}
```

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

### Design System & Color Convention:

**CRITICAL - Uniform Color Scheme:**
The application follows a strict color convention for all UI feedback, notifications, and status indicators:

- **Success**: `emerald` - Used for successful operations, positive feedback, active states
- **Error**: `rose` - Used for errors, failures, destructive actions, critical warnings
- **Warning**: `amber` - Used for warnings, caution states, pending actions
- **Info**: `sky` - Used for informational messages, neutral feedback, general notifications
- **Secondary**: `violet` - Used for secondary actions, supplementary information

**Implementation Guidelines:**

- **Toast Notifications**: Use Sonner with `richColors` enabled - automatically applies correct color variants
- **Badge Components**: Use standardized badge variants (`success`, `success-outline`, `warning`, `error`) from `/components/ui/badge.tsx`
- **Button States**: Apply consistent color classes across all interactive elements
- **Status Indicators**: Follow color convention for all status displays (user roles, connection states, etc.)
- **Form Validation**: Error states use `rose`, success states use `emerald`

**Example Usage:**

```typescript
// Toast notifications (handled by Sonner richColors)
toast.success("Operation successful") // emerald
toast.error("Operation failed")       // rose
toast.warning("Warning message")      // amber
toast.info("Information")             // sky

// Badge components
<Badge variant="success">Active</Badge>     // emerald
<Badge variant="error">Banned</Badge>       // rose
<Badge variant="warning">Pending</Badge>    // amber
```

**Color Consistency Rules:**

1. NEVER mix color schemes - always use the designated color for each semantic meaning
2. Ensure accessibility compliance with proper contrast ratios
3. Test color combinations in both light and dark themes
4. Maintain consistency across all components, pages, and features

**Component Organization Principles:**

- **App Directory**: Only contains `page.tsx` and `layout.tsx` files
- **Component Directory**: All components organized by feature/domain
- **Naming Convention**: kebab-case for all component files (e.g., `user-data-table.tsx`)
- **Feature Grouping**: Page-specific components go in `components/[feature]/` directories
- **Reusable Components**: Shared UI components in `components/ui/` and `components/buttons/`
- **Data Tables**: Follow `*-columns.tsx`, `*-data-table.tsx`, `*-table-skeleton.tsx` pattern

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
