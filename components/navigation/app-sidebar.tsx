"use client";

// Why: Use React hooks for modern component patterns and client-side session access
// This provides reactive session updates and better performance
// Citation: https://react.dev/reference/react/hooks
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Logo } from "../icon/Logo";
import { NavUser } from "./nav-user";
import { NavMain } from "./nav-main";
import { useRole } from "@/providers/role-provider";
import { Loader2 } from "lucide-react";

export function AppSidebar() {
  const { session, userRole, isLoading } = useRole();

  if (isLoading) {
    return (
      <Sidebar variant="inset">
        <SidebarHeader className="py-4">
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="text-muted-foreground size-10 animate-spin" />
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="py-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain userRole={userRole} />
      </SidebarContent>
      <SidebarFooter className="flex gap-3">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
