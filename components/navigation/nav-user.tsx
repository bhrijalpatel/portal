"use client";

// Why: Convert to client component using hooks for consistent session access
// This eliminates prop drilling and provides reactive session updates
import { NavUserClient } from "./nav-user-client";
import { useRole } from "@/providers/role-provider";

export function NavUser() {
  const { session, isLoading } = useRole();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
      </div>
    );
  }

  return <NavUserClient session={session} />;
}
