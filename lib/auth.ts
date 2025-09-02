import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/audit-log";

export const auth = betterAuth({
  appName: "Portal",
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true, // Always require email verification (new user cannot immediately sign in)
    minPasswordLength: 12,
    maxPasswordLength: 128,
    // Send password reset email using Resend
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendPasswordResetEmail({
          to: user.email,
          url,
        });

        // Log password reset request
        await createAuditLog({
          adminUserId: user.id,
          adminEmail: user.email,
          action: "PASSWORD_RESET",
          details: {
            timestamp: new Date().toISOString(),
            emailSent: true,
          },
          success: true,
        });
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        throw error;
      }
    },
    // Callback when password is successfully reset
    onPasswordReset: async ({ user }) => {
      // Log successful password reset
      await createAuditLog({
        adminUserId: user.id,
        adminEmail: user.email,
        action: "PASSWORD_RESET",
        details: {
          timestamp: new Date().toISOString(),
          completed: true,
        },
        success: true,
      });
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  // Email verification configuration
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await sendVerificationEmail({
          to: user.email,
          url,
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw error;
      }
    },
    sendOnSignUp: true, // Automatically send verification email on sign up
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh cookie once/day on activity
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  rateLimit: { enabled: true },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "Portal",
  },
  database: drizzleAdapter(db, { provider: "pg", schema }),
  plugins: [
    nextCookies(),
    admin({
      adminRoles: ["admin"],
      defaultRole: "user",
    }),
  ],
});
