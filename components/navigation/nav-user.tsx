// Server component wrapper (no "use client")
import { getSessionOrNull } from "@/lib/auth-helpers";
import { NavUserClient } from "./nav-user-client";

export async function NavUser() {
  const session = await getSessionOrNull();
  return <NavUserClient session={session} />;
}
