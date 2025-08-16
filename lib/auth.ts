import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";

export const auth = betterAuth({
  appName: "Portal",
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false, // Set to true in production
    minPasswordLength: 12,
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
    useSecureCookies: true,
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
