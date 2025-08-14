// Server component wrapper (no "use client")
import { NavUserClient } from "./nav-user-client";
import type { Session } from "@/lib/auth-helpers";

type NavUserProps = {
  session: Session;
};

export function NavUser({ session }: NavUserProps) {
  return <NavUserClient session={session} />;
}
