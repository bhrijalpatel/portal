import { NextResponse } from "next/server";
import { adminExists, requireSession } from "@/lib/auth-helpers";
import { db } from "@/db/drizzle";
import { profiles } from "@/db/schema";

export async function POST() {
  try {
    // If an admin already exists, do not allow claiming
    if (await adminExists()) {
      return new NextResponse("Admin already exists", { status: 409 });
    }

    // Must be signed in to claim
    const { user } = await requireSession();

    // Promote the current user to admin
    await db
      .insert(profiles)
      .values({ userId: user.id, role: "admin" })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { role: "admin" },
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bootstrap admin error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
