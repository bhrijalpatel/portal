import { adminExists } from "@/lib/auth-helpers";
import { withAuth } from "@/helpers/api-helpers";
import { db } from "@/db/drizzle";
import { user as authUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateBootstrapAccess, validateSetupSecret } from "@/helpers/admin-security";
import { logBootstrapAttempt } from "@/lib/audit-log";
import { headers } from "next/headers";

export const POST = withAuth(async ({ session }, request) => {
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  
  try {
    // Step 1: Check if bootstrap is allowed
    const accessCheck = validateBootstrapAccess(ipAddress);
    if (!accessCheck.allowed) {
      await logBootstrapAttempt(
        session.user.id,
        session.user.email,
        false,
        ipAddress,
        userAgent,
        accessCheck.reason
      );
      return Response.json({ 
        error: "Admin setup is not available",
        reason: accessCheck.reason 
      }, { status: 403 });
    }

    // Step 2: Validate the setup secret
    if (!request) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    
    const body = await request.json();
    const { setupSecret } = body;
    
    if (!setupSecret || !validateSetupSecret(setupSecret)) {
      await logBootstrapAttempt(
        session.user.id,
        session.user.email,
        false,
        ipAddress,
        userAgent,
        "Invalid setup secret"
      );
      return Response.json({ 
        error: "Invalid setup secret" 
      }, { status: 401 });
    }

    // Step 3: Check if an admin already exists
    if (await adminExists()) {
      await logBootstrapAttempt(
        session.user.id,
        session.user.email,
        false,
        ipAddress,
        userAgent,
        "Admin already exists"
      );
      return Response.json({ 
        error: "Admin already exists" 
      }, { status: 409 });
    }

    // Step 4: Promote the current user to admin in Better Auth user table
    await db
      .update(authUsers)
      .set({ 
        role: "admin",
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, session.user.id));

    // Step 5: Log successful bootstrap
    await logBootstrapAttempt(
      session.user.id,
      session.user.email,
      true,
      ipAddress,
      userAgent
    );

    console.log(`🔒 SECURITY: Admin role successfully claimed by ${session.user.email} from IP ${ipAddress}`);

    return Response.json({ 
      ok: true, 
      message: "Admin role assigned successfully",
      user: session.user.email,
      note: "Role updated with enhanced security controls"
    });
  } catch (error) {
    console.error("Bootstrap admin error:", error);
    
    await logBootstrapAttempt(
      session.user.id,
      session.user.email,
      false,
      ipAddress,
      userAgent,
      "Internal server error"
    );
    
    return Response.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
});
