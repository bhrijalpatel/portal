import { withAdminAuth } from "@/helpers/api-helpers";
import { db } from "@/db/drizzle";
import { user as authUsers } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { revalidateTag } from "next/cache";

// Validation schema for bulk ban
const bulkBanSchema = z.object({
  userIds: z
    .array(z.string().min(1))
    .min(1, "At least one user ID is required"),
  banReason: z.string().min(1, "Ban reason is required").optional(),
});

export const POST = withAdminAuth(async ({ session }, request) => {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = bulkBanSchema.parse(body);

    // Update users in database
    const result = await db
      .update(authUsers)
      .set({
        banned: true,
        banReason: validatedData.banReason || "Bulk ban action",
        updatedAt: new Date(),
      })
      .where(inArray(authUsers.id, validatedData.userIds))
      .returning({
        id: authUsers.id,
        name: authUsers.name,
        email: authUsers.email,
        banned: authUsers.banned,
        banReason: authUsers.banReason,
        updatedAt: authUsers.updatedAt,
      });

    if (result.length === 0) {
      return Response.json({ error: "No users found" }, { status: 404 });
    }

    // Invalidate cache to refresh user list
    revalidateTag("admin-users-unified");

    return Response.json({
      success: true,
      message: `Banned ${result.length} user(s) successfully`,
      users: result,
      updatedBy: session.user.email,
    });
  } catch (error: unknown) {
    console.error("Bulk ban users error:", error);

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
