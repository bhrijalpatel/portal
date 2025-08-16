import { withAdminAuth } from "@/lib/api-helpers";
import { db } from "@/db/drizzle";
import { user as authUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidateTag } from "next/cache";

// Validation schema for user updates
const updateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
});

export const PATCH = withAdminAuth(async ({ session }, request) => {
  try {
    const body = await request.json();
    console.log("🔍 Update user request:", body);
    
    // Validate request body
    const validatedData = updateUserSchema.parse(body);
    
    // Prevent admin from updating their own email to avoid lockout
    if (validatedData.email && validatedData.userId === session.user.id) {
      return Response.json(
        { error: "Cannot update your own email address" },
        { status: 400 }
      );
    }
    
    // Build update object with only provided fields
    const updateData: Partial<typeof authUsers.$inferInsert> = {
      updatedAt: new Date(),
    };
    
    if (validatedData.name) {
      updateData.name = validatedData.name;
    }
    
    if (validatedData.email) {
      updateData.email = validatedData.email;
    }
    
    console.log("📝 Updating user with data:", updateData);
    
    // Update user in database
    const result = await db
      .update(authUsers)
      .set(updateData)
      .where(eq(authUsers.id, validatedData.userId))
      .returning({
        id: authUsers.id,
        name: authUsers.name,
        email: authUsers.email,
        role: authUsers.role,
        updatedAt: authUsers.updatedAt,
      });
    
    if (result.length === 0) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Invalidate cache to refresh user list
    revalidateTag("admin-users-unified");
    
    console.log("✅ User updated successfully:", result[0]);
    
    return Response.json({
      success: true,
      message: "User updated successfully",
      user: result[0],
      updatedBy: session.user.email,
    });
    
  } catch (error: unknown) {
    console.error("❌ Update user error:", error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          error: "Validation error", 
          details: error.issues 
        },
        { status: 400 }
      );
    }
    
    // Check for unique constraint violation (duplicate email)
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return Response.json(
        { error: "Email address already exists" },
        { status: 409 }
      );
    }
    
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
