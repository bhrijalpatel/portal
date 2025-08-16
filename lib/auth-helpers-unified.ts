// Enhanced auth helpers with unified role management
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { user as authUsers, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function getSessionOrNull() {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
    });
    return session;
  } catch {
    return null;
  }
}

/**
 * Get session with role from Better Auth user.role (single source of truth)
 */
export async function getSessionWithRole() {
  const session = await requireSession();
  
  // Role comes from Better Auth user.role field - our single source of truth
  const userRole = session.user.role || "user";
  
  return {
    ...session,
    userRole,
  };
}

/**
 * Require specific role using Better Auth's user.role
 */
export async function requireRole(requiredRole: string) {
  const { userRole } = await getSessionWithRole();
  
  if (userRole !== requiredRole) {
    redirect("/403");
  }
  
  return userRole;
}

/**
 * Check if any admin exists using Better Auth user.role
 */
export async function adminExists(): Promise<boolean> {
  const adminUser = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.role, "admin"))
    .limit(1);
    
  return adminUser.length > 0;
}

/**
 * Sync user role from Better Auth to profile (if profile exists)
 * This maintains consistency between systems
 */
export async function syncUserRoleToProfile(userId: string, role: string) {
  try {
    // Check if profile exists
    const existingProfile = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      // Update existing profile role to match Better Auth
      await db
        .update(profiles)
        .set({ 
          role,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId));
    }
  } catch (error) {
    console.error("Failed to sync role to profile:", error);
    // Don't throw - this is supplementary sync, not critical
  }
}

/**
 * Enhanced profile creation that uses Better Auth role as source of truth
 */
export async function ensureProfile(userId: string, userData?: {
  name?: string;
  email?: string;
}) {
  try {
    // Get user data from Better Auth (includes role)
    const authUser = await db
      .select({
        id: authUsers.id,
        name: authUsers.name,
        email: authUsers.email,
        role: authUsers.role,
      })
      .from(authUsers)
      .where(eq(authUsers.id, userId))
      .limit(1);

    if (authUser.length === 0) {
      throw new Error("User not found in auth system");
    }

    const user = authUser[0];
    const userRole = user.role || "user";

    // Check if profile already exists
    const existingProfile = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (existingProfile.length === 0) {
      // Create new profile with role from Better Auth
      await db.insert(profiles).values({
        userId,
        role: userRole, // Use Better Auth role as source
        displayName: userData?.name || user.name,
        fullName: user.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Update existing profile to sync with Better Auth role
      await db
        .update(profiles)
        .set({
          role: userRole, // Sync with Better Auth
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId));
    }

    return userRole;
  } catch (error) {
    console.error("Failed to ensure profile:", error);
    throw error;
  }
}
