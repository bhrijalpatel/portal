import { adminExists } from "@/lib/auth-helpers";
import { withAuth } from "@/lib/api-helpers";
import { db } from "@/db/drizzle";
import { user as authUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = withAuth(async ({ session }) => {
  try {
    // If an admin already exists, do not allow claiming
    if (await adminExists()) {
      return Response.json({ error: "Admin already exists" }, { status: 409 });
    }

    // Promote the current user to admin in Better Auth user table (single source of truth)
    await db
      .update(authUsers)
      .set({ 
        role: "admin",
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, session.user.id));

    return Response.json({ 
      ok: true, 
      message: "Admin role assigned successfully",
      user: session.user.email,
      note: "Role updated in Better Auth user table as single source of truth"
    });
  } catch (error) {
    console.error("Bootstrap admin error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
