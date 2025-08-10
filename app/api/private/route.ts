// app/api/private/route.ts
import { withAuth } from "@/lib/api-helpers";

export const GET = withAuth(async ({ session }) => {
  return Response.json({ 
    ok: true, 
    user: session.user.email,
    message: "This is a protected API route",
    sessionId: session.id,
    timestamp: new Date().toISOString()
  });
});

export const POST = withAuth(async ({ session }) => {
  return Response.json({ 
    ok: true, 
    message: "Successfully accessed protected POST endpoint",
    userInfo: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name
    }
  });
});