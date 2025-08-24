import { withAdminAuth } from "@/helpers/api-helpers";
import { fetchUsersWithRetry } from "@/utils/db-utils";

export const GET = withAdminAuth(async () => {
  try {
    const users = await fetchUsersWithRetry();

    return Response.json({
      users,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching users after retries:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to fetch users";
    if (error instanceof Error) {
      if (error.message?.includes("timeout")) {
        errorMessage = "Database connection timed out. Please try again.";
      } else if (error.message?.includes("connection")) {
        errorMessage =
          "Database connection failed. The database may be starting up.";
      }
    }

    return Response.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});
