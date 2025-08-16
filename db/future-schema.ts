// // Future-proof role and relationship architecture
// // This design accommodates 1:1, 1:many, many:many relationships

// import {
//   pgTable,
//   text,
//   timestamp,
//   boolean,
//   integer,
//   primaryKey,
// } from "drizzle-orm/pg-core";
// import { user } from "./schema";

// // Core principle: Better Auth user.role = primary role, everything else is metadata/relationships

// /**
//  * FUTURE ARCHITECTURE DESIGN
//  *
//  * 1. Better Auth user.role = Single source of truth for PRIMARY role
//  * 2. Profiles table = 1:1 user metadata (display preferences, bio, etc.)
//  * 3. User roles table = 1:many role assignments for complex permissions
//  * 4. Organization memberships = many:many relationships
//  */

// // Current: Enhanced profiles for 1:1 user metadata (not roles)
// export const profiles = pgTable("profiles", {
//   userId: text("user_id")
//     .primaryKey()
//     .references(() => user.id, { onDelete: "cascade" }),

//   // Personal metadata (not role-related)
//   displayName: text("display_name"),
//   fullName: text("full_name"),
//   bio: text("bio"),
//   phone: text("phone"),
//   avatarUrl: text("avatar_url"),

//   // Preferences
//   timezone: text("timezone"),
//   language: text("language").default("en"),

//   // Legacy: Keep role for transition period, but Better Auth user.role is source of truth
//   role: text("role").notNull().default("user"), // Will be synced from user.role

//   createdAt: timestamp("created_at")
//     .$defaultFn(() => new Date())
//     .notNull(),
//   updatedAt: timestamp("updated_at")
//     .$defaultFn(() => new Date())
//     .notNull(),
// });

// // Future: For complex role assignments (1:many)
// export const userRoles = pgTable("user_roles", {
//   id: text("id").primaryKey(),
//   userId: text("user_id")
//     .notNull()
//     .references(() => user.id, { onDelete: "cascade" }),
//   role: text("role").notNull(), // "admin", "manager", "technician", "viewer"
//   scope: text("scope"), // "global", "workshop:123", "department:456"
//   grantedBy: text("granted_by")
//     .references(() => user.id),
//   grantedAt: timestamp("granted_at")
//     .$defaultFn(() => new Date())
//     .notNull(),
//   expiresAt: timestamp("expires_at"), // Optional role expiration
//   isActive: boolean("is_active").default(true).notNull(),
// });

// // Future: For organization relationships (many:many)
// export const organizations = pgTable("organizations", {
//   id: text("id").primaryKey(),
//   name: text("name").notNull(),
//   slug: text("slug").unique().notNull(),
//   type: text("type").notNull(), // "workshop", "department", "client"
//   parentId: text("parent_id").references(() => organizations.id),
//   createdAt: timestamp("created_at")
//     .$defaultFn(() => new Date())
//     .notNull(),
// });

// export const organizationMemberships = pgTable("organization_memberships", {
//   userId: text("user_id")
//     .notNull()
//     .references(() => user.id, { onDelete: "cascade" }),
//   organizationId: text("organization_id")
//     .notNull()
//     .references(() => organizations.id, { onDelete: "cascade" }),
//   role: text("role").notNull(), // "owner", "admin", "member", "viewer"
//   joinedAt: timestamp("joined_at")
//     .$defaultFn(() => new Date())
//     .notNull(),
//   leftAt: timestamp("left_at"),
//   isActive: boolean("is_active").default(true).notNull(),
// }, (table) => ({
//   pk: primaryKey({ columns: [table.userId, table.organizationId] }),
// }));

// // Future: For complex permissions (many:many)
// export const permissions = pgTable("permissions", {
//   id: text("id").primaryKey(),
//   name: text("name").unique().notNull(), // "users.create", "inventory.read", "reports.export"
//   description: text("description"),
//   resource: text("resource").notNull(), // "users", "inventory", "reports"
//   action: text("action").notNull(), // "create", "read", "update", "delete"
//   scope: text("scope"), // "global", "own", "department"
// });

// export const rolePermissions = pgTable("role_permissions", {
//   role: text("role").notNull(), // Links to user.role or userRoles.role
//   permissionId: text("permission_id")
//     .notNull()
//     .references(() => permissions.id, { onDelete: "cascade" }),
//   scope: text("scope"), // Override default permission scope
//   isGranted: boolean("is_granted").default(true).notNull(),
// }, (table) => ({
//   pk: primaryKey({ columns: [table.role, table.permissionId] }),
// }));

// /**
//  * USAGE PATTERNS:
//  *
//  * Simple case (current): user.role = "admin" | "user"
//  *
//  * Complex case (future):
//  * - user.role = "user" (default, for Better Auth compatibility)
//  * - userRoles: [
//  *     { role: "admin", scope: "global" },
//  *     { role: "manager", scope: "workshop:123" },
//  *     { role: "technician", scope: "department:456" }
//  *   ]
//  * - organizationMemberships: [
//  *     { organizationId: "workshop:123", role: "manager" },
//  *     { organizationId: "client:789", role: "contact" }
//  *   ]
//  */

// // Export for future use
// export const futureSchema = {
//   // Current tables
//   profiles,

//   // Future complex relationship tables
//   userRoles,
//   organizations,
//   organizationMemberships,
//   permissions,
//   rolePermissions,
// };
