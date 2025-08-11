# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Server-side authentication protection system following Better-Auth recommendations
- `lib/auth-helpers.ts` - Server-side session validation helpers
  - `requireSession()` - Strict authentication guard with redirect to `/sign-in`
  - `getSessionOrNull()` - Non-throwing session retrieval for optional auth scenarios
- `lib/api-helpers.ts` - API route protection wrapper
  - `withAuth()` - Higher-order function to protect API routes with session validation
- Protected route group `app/(protected)/` with layout-level authentication
- Test API route `app/api/private/route.ts` demonstrating protected endpoint usage
- Enhanced homepage with automotive workshop theming and modern visual design
- Back-to-home navigation links on sign-in and sign-up pages
- Premium glassmorphism styling for authentication forms
- Auth route group `app/(auth)/` with reverse authentication guard
- `redirectIfAuthenticated()` helper function to prevent authenticated users from accessing auth pages
- Company attribution footer with Patel Trading Company branding
- Dark mode support with next-themes integration
- Theme toggle component with cycling light/dark/system modes
- Hydration-safe theme provider with proper SSR support
- Enhanced authentication route group structure with `app/(auth)/` grouping
- Reverse authentication guard preventing authenticated users from accessing auth pages
- **Role-Based Access Control (RBAC) system** with bootstrap admin flow
- `db/schema.profiles.ts` - Custom profiles table for user roles and metadata
- Extended auth helpers with role management:
  - `requireRole()` - Role-based access control guard with 403 redirect
  - `adminExists()` - Check if any admin user exists in the system  
  - `ensureProfile()` - Automatic profile creation with default role assignment
- Bootstrap admin setup flow at `app/(setup)/admin-setup/`
  - One-time admin claim process for first user
  - Automatic lockdown after admin exists
  - Client-side claim component with error handling
- Admin panel at `app/(protected)/admin/` with comprehensive user management
  - User list with role badges and metadata display
  - Responsive table design with alternating row colors
  - Role-based styling (red badges for admin, gray for users)
  - Navigation integration with logout and theme toggle
- Secure admin bootstrap API endpoint at `/api/admin/bootstrap`
  - POST endpoint for claiming admin role
  - Conflict prevention when admin already exists
  - Session validation and error handling
- Custom 403 Forbidden error page with navigation options

### Changed
- **BREAKING**: Moved dashboard from `app/dashboard/page.tsx` to `app/(protected)/dashboard/page.tsx`
- **BREAKING**: Moved authentication pages to route group structure:
  - `app/sign-in/page.tsx` → `app/(auth)/sign-in/page.tsx`
  - `app/sign-up/page.tsx` → `app/(auth)/sign-up/page.tsx`
- Enhanced dashboard page to display user session information (name and email)
- Updated middleware to be UX-only (fast redirects) rather than primary security mechanism
- Refactored authentication architecture from middleware-based to server-side validation
- Simplified auth client configuration by removing hardcoded baseURL
- **BREAKING**: Homepage completely redesigned for automotive workshop internal use
  - Changed from generic SaaS landing page to workshop management portal
  - Updated branding from "Digital Portal" to "Workshop Management Portal"
  - Replaced generic features with automotive-specific functionality
  - Updated statistics to workshop-relevant metrics (vehicles serviced, system access, digital records)
  - Changed call-to-action buttons to focus on dashboard access rather than public signup
  - Updated header navigation from "Sign In" to "Sign Up" button
  - Enhanced CTA section styling with bordered container and hover effects
- Enhanced form styling with component-level glassmorphism design
- Updated application metadata and branding throughout
- Added company attribution to footer with external link to Patel Trading Company
- Integrated theme toggle in homepage header navigation
- Added `suppressHydrationWarning` to HTML element for theme compatibility
- Updated dashboard access button styling to outline variant for improved visibility
- Enhanced authentication flow with proper route group structure and reverse authentication
- Improved form validation and error handling in sign-in/sign-up components
- **Database schema updates** for RBAC implementation:
  - Added `profiles` table with user roles, display names, and metadata
  - Extended schema exports to include profiles table
  - Added foreign key relationship between profiles and users with cascade delete
- **Enhanced admin panel UI** with improved navigation and user experience:
  - Added dashboard navigation button and logout functionality
  - Integrated theme toggle in admin interface
  - Improved responsive design with container layout

### Security
- Implemented defense-in-depth authentication strategy:
  - **Primary**: Server-side database session validation in protected layout
  - **Secondary**: Middleware for improved user experience
- All protected routes now validate sessions against database, not just cookies
- Added reverse authentication protection: authenticated users are redirected away from auth pages
- **Enhanced RBAC security measures**:
  - Role validation occurs server-side with database queries
  - Admin bootstrap API prevents multiple admin creation attempts
  - Proper error handling and 403 redirects for unauthorized access
  - Profile creation ensures every user has appropriate role assignment
  - Secure role-based route protection following Better-Auth patterns

### Documentation
- Updated `CLAUDE.md` with new authentication architecture details
- Added middleware maintenance requirements for future protected routes
- Created comprehensive testing guide for authentication system
- Updated project documentation to reflect automotive workshop focus
- **RBAC system documentation**:
  - Comprehensive step-by-step testing guide for admin bootstrap flow
  - Role-based access control implementation details
  - Admin panel functionality and user management documentation
  - Database schema changes and migration information

### Dependencies
- Added `next-themes@0.4.6` for dark mode functionality

### Fixed
- **Theme Toggle Hydration Issues**: Resolved hydration mismatch errors in ThemeToggle component
- **ESLint Compliance**: Fixed all linting errors across codebase:
  - Removed unused variables and parameters
  - Escaped special characters in JSX text
  - Replaced `any` types with proper TypeScript types (`React.ElementType`)
  - Cleaned up import statements and unused dependencies
- **Database Migration Conflicts**: Resolved migration generation issues for profiles table
- **Component Import Consistency**: Standardized ThemeToggle imports across pages

### Technical Improvements
- **RBAC System Testing**: Comprehensive testing completed for all admin bootstrap and role-based access scenarios
- **Code Quality**: Achieved full ESLint compliance with zero warnings/errors
- **Database Schema Validation**: Verified profiles table structure with role, displayName, and metadata fields
- **Hydration-Safe Components**: Restored standard ShadCN theme toggle pattern for optimal hydration handling
- **Component Architecture**: Refined theme toggle implementation for better maintainability

## Notes
- Authentication system now follows Better-Auth recommended patterns
- Server-side protection provides real security vs. cookie-only checks
- Middleware remains for UX optimization but is not relied upon for security
- **RBAC System Fully Operational**: Complete role-based access control with bootstrap admin flow successfully implemented and tested

### RBAC Implementation Notes
- **Bootstrap Admin Flow**: First user to visit `/admin-setup` can claim admin role
- **Role Management**: Roles stored in separate `profiles` table, not in Better-Auth schema
- **Extensible Design**: Role system can easily be extended to support additional roles (manager, technician, etc.)
- **Database Separation**: Better-Auth tables remain untouched; all custom data in `profiles` table
- **Security-First**: All role checks happen server-side with database validation
- **One-Time Setup**: Admin bootstrap automatically locks after first admin is created
- **Future Expansion**: System designed to support complex role hierarchies and permissions
- **Better-Auth Compliance**: Implementation follows Better-Auth Next.js best practices throughout

### Theme Toggle Evolution
- **Multiple Approaches Tested**: Evaluated cycling button, skeleton loading, and CSS-only approaches
- **Hydration Safety**: Prioritized proper SSR/hydration handling over immediate rendering
- **Final Implementation**: Reverted to standard ShadCN dropdown pattern for reliability and maintainability
- **Performance Optimized**: Uses CSS transitions and proper React patterns for smooth theme switching