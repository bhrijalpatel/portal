"use client";

import { createContext, useContext } from "react";
import type { Session } from "@/lib/auth-helpers";

type RoleContextType = {
  session: Session;
  userRole: string;
};

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({
  children,
  session,
  userRole,
}: {
  children: React.ReactNode;
  session: Session;
  userRole: string;
}) {
  return (
    <RoleContext.Provider value={{ session, userRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
