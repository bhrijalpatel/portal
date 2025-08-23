import { db } from "@/db/drizzle";
import { sql } from "drizzle-orm";

export type AdminAction = 
  | 'ADMIN_BOOTSTRAP_ATTEMPT'
  | 'ADMIN_BOOTSTRAP_SUCCESS'
  | 'ADMIN_BOOTSTRAP_FAILED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'PASSWORD_RESET'
  | 'ROLE_CHANGED'
  | 'IMPERSONATION_START'
  | 'IMPERSONATION_END';

export interface AuditLogEntry {
  adminUserId: string;
  adminEmail: string;
  action: AdminAction;
  targetUserId?: string;
  targetEmail?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Create an audit log entry for admin actions
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // For now, we'll use a simple JSON log in the database
    // In production, this should be a dedicated audit_logs table
    await db.execute(sql`
      INSERT INTO admin_audit_logs (
        id,
        admin_user_id,
        admin_email,
        action,
        target_user_id,
        target_email,
        details,
        ip_address,
        user_agent,
        success,
        error_message,
        created_at
      ) VALUES (
        ${crypto.randomUUID()},
        ${entry.adminUserId},
        ${entry.adminEmail},
        ${entry.action},
        ${entry.targetUserId || null},
        ${entry.targetEmail || null},
        ${JSON.stringify(entry.details || {})},
        ${entry.ipAddress || null},
        ${entry.userAgent || null},
        ${entry.success},
        ${entry.errorMessage || null},
        NOW()
      )
    `);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Admin Audit Log:', {
        timestamp: new Date().toISOString(),
        ...entry,
      });
    }
  } catch (error) {
    // Don't throw errors from audit logging - log to console instead
    console.error('Failed to create audit log:', error);
    
    // In production, you might want to send this to an external logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to external service like Sentry, LogRocket, etc.
    }
  }
}

/**
 * Log admin bootstrap attempts
 */
export async function logBootstrapAttempt(
  userId: string,
  userEmail: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  errorReason?: string
): Promise<void> {
  await createAuditLog({
    adminUserId: userId,
    adminEmail: userEmail,
    action: success ? 'ADMIN_BOOTSTRAP_SUCCESS' : 'ADMIN_BOOTSTRAP_FAILED',
    details: {
      attemptTime: new Date().toISOString(),
      errorReason,
    },
    ipAddress,
    userAgent,
    success,
    errorMessage: errorReason,
  });
}