import { withAdminAuth } from "@/lib/api-helpers";
import { db } from "@/db/drizzle";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateAdminUsers } from "@/lib/cache-helpers";

export const PATCH = withAdminAuth(async ({ session }, request) => {
  try {
    if (!request) throw new Error("Request is required");
    const body = await request.json();
    const { userId, role, displayName } = body;

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // Update user profile
    await db
      .update(profiles)
      .set({
        ...(role && { role }),
        ...(displayName && { displayName }),
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    // 🎯 IMPORTANT: Revalidate cache after user data changes
    await revalidateAdminUsers();

    return Response.json({
      success: true,
      message: "User updated and cache refreshed",
      adminUser: session.user.email,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
});

export const POST = withAdminAuth(async ({ session }, request) => {
  try {
    if (!request) throw new Error("Request is required");
    const body = await request.json();
    
    // TODO: Implement user creation logic
    console.log("User creation request:", body);
    
    // 🎯 IMPORTANT: Revalidate cache after creating new user
    await revalidateAdminUsers();

    return Response.json({
      success: true,
      message: "User created and cache refreshed",
      adminUser: session.user.email,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
});
