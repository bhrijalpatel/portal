# 🔒 Admin Sign-Up Control Security Roadmap

**Priority**: 🟡 MEDIUM - Feature Enhancement with Security Focus  
**Timeline**: 2-3 day implementation cycle  
**Risk Level**: MEDIUM - Registration control vulnerability if improperly implemented  
**Architecture**: Hybrid Approach (Environment + Database Control)

---

## 🎯 Feature Overview

Implement secure admin-controlled sign-up disabling with the following security requirements:

1. **Environment Variable Fallback** - Default behavior controlled via .env
2. **Database Dynamic Control** - Real-time admin toggle without restart
3. **Admin-Only Access** - Secured admin interface for control
4. **Audit Trail** - Complete logging of sign-up control changes
5. **Attack Prevention** - Rate limiting and validation

---

## 🚨 Security Considerations

### **Potential Vulnerabilities**

1. **Bypass Attacks** - Direct API calls to sign-up endpoints
2. **Race Conditions** - Multiple simultaneous sign-up attempts during toggle
3. **Admin Privilege Escalation** - Non-admin users accessing control
4. **DoS via Toggle Spam** - Rapid setting changes causing system stress
5. **Database Inconsistency** - Settings table corruption or missing entries

### **Security Requirements**

- ✅ Admin role validation on all control endpoints
- ✅ Atomic database operations for setting changes
- ✅ Rate limiting on toggle operations (max 5 changes/minute)
- ✅ Audit logging for all sign-up control modifications
- ✅ Graceful fallback to environment variables
- ✅ Input validation and sanitization
- ✅ CSRF protection on admin controls

---

## 🎯 Phase 1: Database Schema & Core Infrastructure (Day 1)

### 🔴 Priority 1: Secure Settings Table

**Security Impact**: Foundation for all admin controls - must be bulletproof

- [ ] **Database Migration: Application Settings**

  ```sql
  -- Target schema:
  CREATE TABLE IF NOT EXISTS application_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL DEFAULT 'string', -- 'string', 'boolean', 'json'
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false, -- Can non-admins read this?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT NOT NULL -- Admin user ID who made the change
  );

  -- Security indexes
  CREATE INDEX idx_settings_key ON application_settings(setting_key);
  CREATE INDEX idx_settings_public ON application_settings(is_public);
  ```

- [ ] **Schema Integration**
  - [ ] Add to `db/schema.ts` with proper Drizzle types
  - [ ] Create TypeScript interfaces for settings
  - [ ] Add database relations and constraints
  - [ ] Implement setting validation schemas

- [ ] **Initial Data Seeding**
  ```typescript
  // Default settings to insert:
  {
    setting_key: 'signup_enabled',
    setting_value: 'true',
    setting_type: 'boolean',
    description: 'Controls whether new user registration is allowed',
    is_public: false,
    updated_by: 'system'
  }
  ```

### 🟡 Priority 2: Settings Management Library

**Security Impact**: Core security functions - must validate all operations

- [ ] **Settings Service Layer** (`lib/settings.ts`)

  ```typescript
  // Target implementation:
  export class SettingsManager {
    // Get setting with fallback to environment
    static async getSetting(key: string): Promise<string | boolean | null>;

    // Admin-only setting updates with audit logging
    static async updateSetting(
      key: string,
      value: string | boolean,
      adminUserId: string,
    ): Promise<void>;

    // Validate setting changes before applying
    static validateSettingUpdate(key: string, value: any): boolean;

    // Get public settings (non-sensitive only)
    static async getPublicSettings(): Promise<Record<string, any>>;
  }
  ```

- [ ] **Security Validations**
  - [ ] Input sanitization for all setting values
  - [ ] Setting key whitelist (prevent arbitrary key creation)
  - [ ] Value type validation (boolean, string, JSON)
  - [ ] Admin user ID verification before updates
  - [ ] Atomic database transactions for consistency

---

## 🎯 Phase 2: Admin API & Control Endpoints (Day 1-2)

### 🔴 Priority 3: Secure Admin Settings API

**Security Impact**: HIGH - Direct admin control interface

- [ ] **Settings Management API** (`app/api/admin/settings/route.ts`)

  ```typescript
  // GET /api/admin/settings - List all settings (admin only)
  export const GET = withAdminAuth(async ({ adminSession }) => {
    // 1. Validate admin permissions
    // 2. Fetch all settings with metadata
    // 3. Return sanitized settings list
  });

  // PUT /api/admin/settings/[key] - Update specific setting
  export const PUT = withAdminAuth(
    async ({ adminSession, params, request }) => {
      // 1. Validate admin permissions
      // 2. Extract and validate setting key/value
      // 3. Apply rate limiting (max 5 changes/minute per admin)
      // 4. Update setting with audit logging
      // 5. Broadcast change to all admin sessions
      // 6. Return success with new value
    },
  );
  ```

- [ ] **API Security Hardening**
  - [ ] Rate limiting: 5 setting changes per minute per admin
  - [ ] Request size limits (prevent DoS via large payloads)
  - [ ] CSRF protection via SameSite cookies
  - [ ] Input validation with Zod schemas
  - [ ] Detailed error logging (admin attempts, failures)

- [ ] **Sign-Up Control Endpoint** (`app/api/admin/settings/signup-control/route.ts`)
  ```typescript
  // POST /api/admin/settings/signup-control - Toggle sign-up enable/disable
  export const POST = withAdminAuth(async ({ adminSession, request }) => {
    const { enabled } = await request.json();

    // 1. Validate boolean input
    // 2. Check rate limiting
    // 3. Update signup_enabled setting
    // 4. Create audit log entry
    // 5. Return new state
  });
  ```

### 🟡 Priority 4: Enhanced Audit Logging

**Security Impact**: MEDIUM - Critical for compliance and security monitoring

- [ ] **Settings Audit Trail**

  ```typescript
  // Add to existing audit log system:
  await createAuditLog({
    adminUserId: session.user.id,
    adminEmail: session.user.email,
    action: "SETTINGS_UPDATE",
    details: {
      settingKey: "signup_enabled",
      oldValue: "true",
      newValue: "false",
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    },
    success: true,
  });
  ```

- [ ] **Security Event Categories**
  - [ ] `SIGNUP_DISABLED` - Sign-up functionality disabled
  - [ ] `SIGNUP_ENABLED` - Sign-up functionality re-enabled
  - [ ] `SETTINGS_ACCESS` - Admin accessed settings panel
  - [ ] `SETTINGS_UPDATE_FAILED` - Setting update validation failure

---

## 🎯 Phase 3: Frontend Admin Controls (Day 2)

### 🟡 Priority 5: Secure Admin Dashboard Integration

**Security Impact**: MEDIUM - User interface for critical system controls

- [ ] **Admin Settings Panel Component** (`components/admin/settings-panel.tsx`)

  ```typescript
  // Target features:
  - Real-time settings display with current values
  - Toggle switches for boolean settings
  - Form validation before API calls
  - Loading states and error handling
  - Confirmation dialogs for critical changes
  - Success/failure toast notifications
  ```

- [ ] **Sign-Up Control Widget** (`components/admin/signup-control.tsx`)

  ```typescript
  // Secure implementation:
  export function SignUpControlWidget() {
    const [enabled, setEnabled] = useState<boolean>(true);
    const [loading, setLoading] = useState(false);

    const handleToggle = async (newState: boolean) => {
      // 1. Show confirmation dialog
      // 2. Call API with loading state
      // 3. Handle success/error responses
      // 4. Update local state
      // 5. Show appropriate notifications
    };

    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3>User Registration</h3>
            <p>Control whether new users can sign up</p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </Card>
    );
  }
  ```

- [ ] **Admin Page Integration** (`app/(protected)/admin/page.tsx`)
  - [ ] Add settings section to existing admin page
  - [ ] Organize controls in logical groups
  - [ ] Implement proper loading states
  - [ ] Add help text and security warnings

### 🟡 Priority 6: User Experience & Visual Feedback

**Security Impact**: LOW - Prevents accidental changes, improves admin UX

- [ ] **Confirmation Dialogs**

  ```typescript
  // Critical action confirmation:
  <AlertDialog>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Disable User Registration?</AlertDialogTitle>
        <AlertDialogDescription>
          This will prevent new users from signing up.
          Existing users will not be affected.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={handleConfirm}>
          Disable Registration
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  ```

- [ ] **Status Indicators**
  - [ ] Badge showing current sign-up status
  - [ ] Last updated timestamp and admin info
  - [ ] Visual warnings when sign-up is disabled
  - [ ] Success/error toast notifications

---

## 🎯 Phase 4: Sign-Up Flow Protection (Day 2-3)

### 🔴 Priority 7: Sign-Up Route Security

**Security Impact**: HIGH - Primary enforcement point

- [ ] **Sign-Up Page Protection** (`app/(auth)/sign-up/page.tsx`)

  ```typescript
  // Server-side check before rendering:
  export default async function SignUpPage() {
    const isSignUpEnabled = await SettingsManager.getSetting('signup_enabled');

    if (!isSignUpEnabled) {
      return (
        <div className="text-center">
          <h2>Registration Temporarily Disabled</h2>
          <p>New user registration is currently not available.</p>
          <Link href="/sign-in">Sign In Instead</Link>
        </div>
      );
    }

    return <SignUpForm />;
  }
  ```

- [ ] **API Route Protection** (Better Auth handles this, but add validation)
  ```typescript
  // Add to sign-up form submit:
  async function onSubmit(values: SignUpFormValues) {
    // 1. Check if sign-up is enabled before API call
    const response = await fetch("/api/signup-status");
    const { enabled } = await response.json();

    if (!enabled) {
      toast.error("Registration is currently disabled");
      return;
    }

    // 2. Proceed with normal sign-up flow
    await authClient.signUp.email(values, callbacks);
  }
  ```

### 🟡 Priority 8: Better Auth Integration

**Security Impact**: MEDIUM - Ensure consistent behavior across auth system

- [ ] **Sign-Up Status API** (`app/api/signup-status/route.ts`)

  ```typescript
  // Public endpoint for checking sign-up availability:
  export async function GET() {
    const enabled = await SettingsManager.getSetting("signup_enabled");
    return NextResponse.json({
      enabled: enabled ?? process.env.SIGNUP_ENABLED !== "false",
    });
  }
  ```

- [ ] **Environment Variable Setup**
  ```bash
  # Add to .env:
  SIGNUP_ENABLED=true  # Default fallback value
  ```

---

## 🎯 Phase 5: Testing & Security Validation (Day 3)

### 🔴 Priority 9: Security Testing

**Security Impact**: CRITICAL - Validate all security assumptions

- [ ] **Attack Simulation Tests**

  ```typescript
  // Test scenarios:
  1. Non-admin user trying to access /api/admin/settings
  2. Direct API calls to sign-up when disabled
  3. Rate limiting on settings changes (>5/minute)
  4. Race condition handling (simultaneous toggles)
  5. Invalid setting values (SQL injection, XSS)
  6. Database corruption recovery (missing settings)
  7. Environment variable fallback behavior
  ```

- [ ] **Integration Testing**
  - [ ] Sign-up form behavior when disabled
  - [ ] Admin panel real-time updates
  - [ ] Audit log creation and accuracy
  - [ ] Settings persistence across server restarts
  - [ ] Error handling and user feedback

### 🟡 Priority 10: Performance & Monitoring

**Security Impact**: MEDIUM - Prevent DoS and ensure system stability

- [ ] **Performance Optimizations**
  - [ ] Cache settings values (5-minute TTL)
  - [ ] Optimize database queries with indexes
  - [ ] Rate limit all settings-related endpoints
  - [ ] Implement circuit breaker for database failures

- [ ] **Monitoring & Alerts**
  - [ ] Log all critical setting changes
  - [ ] Monitor failed admin access attempts
  - [ ] Alert on rapid setting changes (potential abuse)
  - [ ] Track sign-up attempt rates when disabled

---

## 📊 Implementation Timeline

| Phase       | Priority    | Tasks                              | Duration          | Security Impact     |
| ----------- | ----------- | ---------------------------------- | ----------------- | ------------------- |
| **Phase 1** | 🔴 CRITICAL | Database schema, settings library  | Day 1 (6 hours)   | Foundation Security |
| **Phase 2** | 🔴 HIGH     | Admin API endpoints, audit logging | Day 1-2 (8 hours) | Access Control      |
| **Phase 3** | 🟡 MEDIUM   | Frontend controls, admin UI        | Day 2 (6 hours)   | User Interface      |
| **Phase 4** | 🔴 HIGH     | Sign-up flow protection            | Day 2-3 (4 hours) | Primary Enforcement |
| **Phase 5** | 🔴 CRITICAL | Security testing, validation       | Day 3 (6 hours)   | Security Validation |

**Total Estimated Time**: 30 hours (3-4 development days)

---

## 🔧 Security Checklist

### Pre-Implementation

- [ ] Review existing admin security patterns
- [ ] Validate database schema design
- [ ] Plan rollback strategy for failed deployments
- [ ] Set up monitoring for new endpoints

### During Implementation

- [ ] Test each component in isolation
- [ ] Validate admin-only access controls
- [ ] Check rate limiting effectiveness
- [ ] Verify audit logging accuracy

### Post-Implementation

- [ ] Conduct penetration testing
- [ ] Monitor for unusual activity patterns
- [ ] Verify settings persistence
- [ ] Document admin procedures

### Production Deployment

- [ ] Test environment variable fallbacks
- [ ] Validate database migration success
- [ ] Confirm admin access works correctly
- [ ] Monitor sign-up blocking effectiveness

---

## 🚨 Security Alerts & Monitoring

### Critical Events to Monitor

1. **Multiple failed admin access attempts**
2. **Rapid settings changes (>5/minute)**
3. **Sign-up attempts when disabled**
4. **Database setting corruption or missing values**
5. **API endpoint abuse or DoS attempts**

### Success Metrics

- ✅ Zero unauthorized access to settings controls
- ✅ 100% audit trail coverage for setting changes
- ✅ <100ms response time for settings API calls
- ✅ Zero sign-up bypasses when disabled
- ✅ Successful fallback to environment variables

---

## 🔒 Post-Implementation Security Notes

### Environment Configuration

```bash
# Production settings:
SIGNUP_ENABLED=false  # Default to disabled in production
DATABASE_SETTINGS_CACHE_TTL=300  # 5 minute cache
ADMIN_SETTINGS_RATE_LIMIT=5  # Changes per minute
```

### Database Maintenance

- Regular backup of application_settings table
- Monitor for orphaned or corrupted setting entries
- Periodic audit of setting change frequency

### Admin Training

- Document proper setting change procedures
- Explain security implications of each control
- Establish approval process for critical changes

---

**🔒 Security Contact**: Implement this roadmap in phases, testing thoroughly at each stage. The hybrid approach provides maximum flexibility while maintaining strong security controls.

**⚠️ Critical Warning**: Never disable audit logging for settings changes - this is essential for security compliance and incident response.
