/**
 * Admin Security Configuration
 * Critical security controls for admin operations
 */

// Admin bootstrap security configuration
export const adminBootstrapConfig = {
  // Check if admin setup is enabled (must be explicitly set to 'true')
  isEnabled: process.env.ADMIN_SETUP_ENABLED === 'true',
  
  // Secret token required for admin bootstrap
  setupSecret: process.env.ADMIN_SETUP_SECRET,
  
  // Check if we're in production environment
  isProduction: process.env.NODE_ENV === 'production',
  
  // IP whitelist for admin setup (comma-separated)
  ipWhitelist: process.env.ADMIN_SETUP_IP_WHITELIST?.split(',').map(ip => ip.trim()),
  
  // Maximum bootstrap attempts before lockout
  maxAttempts: parseInt(process.env.ADMIN_SETUP_MAX_ATTEMPTS || '3'),
  
  // Lockout duration in hours
  lockoutDuration: parseInt(process.env.ADMIN_SETUP_LOCKOUT_HOURS || '24'),
};

/**
 * Validate admin bootstrap access
 */
export function validateBootstrapAccess(requestIp?: string): { 
  allowed: boolean; 
  reason?: string;
} {
  // Check if bootstrap is enabled
  if (!adminBootstrapConfig.isEnabled) {
    return { 
      allowed: false, 
      reason: 'Admin setup is disabled. Set ADMIN_SETUP_ENABLED=true to enable.' 
    };
  }

  // Prevent bootstrap in production unless explicitly allowed
  if (adminBootstrapConfig.isProduction && !process.env.ADMIN_SETUP_ALLOW_PRODUCTION) {
    return { 
      allowed: false, 
      reason: 'Admin setup is disabled in production for security.' 
    };
  }

  // Check IP whitelist if configured
  if (adminBootstrapConfig.ipWhitelist && requestIp) {
    if (!adminBootstrapConfig.ipWhitelist.includes(requestIp)) {
      return { 
        allowed: false, 
        reason: `IP address ${requestIp} is not whitelisted for admin setup.` 
      };
    }
  }

  // Check if setup secret is configured
  if (!adminBootstrapConfig.setupSecret) {
    return { 
      allowed: false, 
      reason: 'ADMIN_SETUP_SECRET environment variable is not configured.' 
    };
  }

  return { allowed: true };
}

/**
 * Validate setup secret token
 */
export function validateSetupSecret(providedSecret: string): boolean {
  if (!adminBootstrapConfig.setupSecret) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (providedSecret.length !== adminBootstrapConfig.setupSecret.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < providedSecret.length; i++) {
    result |= providedSecret.charCodeAt(i) ^ adminBootstrapConfig.setupSecret.charCodeAt(i);
  }
  
  return result === 0;
}