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

### Changed
- **BREAKING**: Moved dashboard from `app/dashboard/page.tsx` to `app/(protected)/dashboard/page.tsx`
- Enhanced dashboard page to display user session information (name and email)
- Updated middleware to be UX-only (fast redirects) rather than primary security mechanism
- Refactored authentication architecture from middleware-based to server-side validation
- **BREAKING**: Homepage completely redesigned for automotive workshop internal use
  - Changed from generic SaaS landing page to workshop management portal
  - Updated branding from "Digital Portal" to "Workshop Management Portal"
  - Replaced generic features with automotive-specific functionality
  - Updated statistics to workshop-relevant metrics (vehicles serviced, system access, digital records)
  - Changed call-to-action buttons to focus on dashboard access rather than public signup
- Enhanced form styling with component-level glassmorphism design
- Updated application metadata and branding throughout

### Security
- Implemented defense-in-depth authentication strategy:
  - **Primary**: Server-side database session validation in protected layout
  - **Secondary**: Middleware for improved user experience
- All protected routes now validate sessions against database, not just cookies

### Documentation
- Updated `CLAUDE.md` with new authentication architecture details
- Added middleware maintenance requirements for future protected routes
- Created comprehensive testing guide for authentication system
- Updated project documentation to reflect automotive workshop focus

## Notes
- Authentication system now follows Better-Auth recommended patterns
- Server-side protection provides real security vs. cookie-only checks
- Middleware remains for UX optimization but is not relied upon for security