import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle"; // Adjust the import path as necessary
import { nextCookies } from "better-auth/next-js";
import { schema } from "@/db/schema";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true, // Define your email and password authentication logic here
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  plugins: [nextCookies()],
});
