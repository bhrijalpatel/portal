import { withAdminAuth } from "@/lib/api-helpers";
import { revalidateAdminUsers } from "@/lib/cache-helpers";

export const POST = withAdminAuth(async ({ session }) => {
  try {
    // Revalidate the admin users cache
    await revalidateAdminUsers();

    return Response.json({
      success: true,
      message: "Admin cache refreshed successfully",
      refreshedBy: session.user.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error refreshing admin cache:", error);
    return Response.json({ error: "Failed to refresh cache" }, { status: 500 });
  }
});
