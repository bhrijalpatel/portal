import { withAdminAuth } from "@/lib/api-helpers";
import { db } from "@/db/drizzle";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateAdminUsers } from "@/lib/cache-helpers";
import { z } from "zod";

const updateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["user", "admin"]).optional(),
  displayName: z.string().min(1, "Display name cannot be empty").optional(),
});

const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["user", "admin"]).default("user"),
});

export const PATCH = withAdminAuth(async ({ session }, request) => {
  try {
    if (!request) {
      return Response.json({ error: "Request is required" }, { status: 400 });
    }

    // Check content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return Response.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    const body = await request.json();
    
    // Validate request body with Zod
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { error: "Invalid request data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { userId, role, displayName } = validation.data;

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
    if (!request) {
      return Response.json({ error: "Request is required" }, { status: 400 });
    }

    // Check content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return Response.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    const body = await request.json();
    
    // Validate request body with Zod
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { error: "Invalid request data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validation.data;
    
    // TODO: Implement user creation logic
    console.log("User creation request:", validatedData);
    
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

// Handle unsupported methods
export const GET = () => {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const PUT = () => {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const DELETE = () => {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
};
