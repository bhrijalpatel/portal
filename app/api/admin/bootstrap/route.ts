import { adminExists } from "@/lib/auth-helpers";
import { withAuth } from "@/lib/api-helpers";
import { db } from "@/db/drizzle";
import { profiles } from "@/db/schema";

export const POST = withAuth(async ({ session }) => {
  try {
    // If an admin already exists, do not allow claiming
    if (await adminExists()) {
      return Response.json({ error: "Admin already exists" }, { status: 409 });
    }

    // Promote the current user to admin
    await db
      .insert(profiles)
      .values({ userId: session.user.id, role: "admin" })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { role: "admin" },
      });

    return Response.json({ 
      ok: true, 
      message: "Admin role assigned successfully",
      user: session.user.email 
    });
  } catch (error) {
    console.error("Bootstrap admin error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
