import { withAdminAuth } from "@/helpers/api-helpers";
import { db } from "@/db/drizzle";
import { user as authUsers } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { revalidateTag } from "next/cache";

// Validation schema for bulk user updates
const bulkUpdateSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, "At least one user ID is required"),
  emailVerified: z.boolean().optional(),
});

export const PATCH = withAdminAuth(async ({ session }, request) => {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = bulkUpdateSchema.parse(body);

    // Build update object with only provided fields
    const updateData: Partial<typeof authUsers.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (validatedData.emailVerified !== undefined) {
      updateData.emailVerified = validatedData.emailVerified;
    }

    // Update users in database
    const result = await db
      .update(authUsers)
      .set(updateData)
      .where(inArray(authUsers.id, validatedData.userIds))
      .returning({
        id: authUsers.id,
        name: authUsers.name,
        email: authUsers.email,
        emailVerified: authUsers.emailVerified,
        role: authUsers.role,
        updatedAt: authUsers.updatedAt,
      });

    if (result.length === 0) {
      return Response.json({ error: "No users found" }, { status: 404 });
    }

    // Invalidate cache to refresh user list
    revalidateTag("admin-users-unified");

    return Response.json({
      success: true,
      message: `Updated ${result.length} user(s) successfully`,
      users: result,
      updatedBy: session.user.email,
    });
  } catch (error: unknown) {
    console.error("Bulk update users error:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
