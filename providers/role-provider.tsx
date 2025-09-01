"use client";

// Why: Use client-side session management for reactive UI updates
// Better Auth provides built-in caching and session state management
// Citation: https://www.better-auth.com/docs/concepts/session-management#client-side-session-management
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import type { Session } from "@/lib/auth-helpers";

type RoleContextType = {
  session: Session | null;
  userRole: string;
  isLoading: boolean;
};

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [userRole, setUserRole] = useState<string>("user");

  useEffect(() => {
    if (session?.user) {
      setUserRole(session.user.role || "user");
    }
  }, [session]);

  const value = {
    session,
    userRole,
    isLoading: isPending,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
