import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Logo } from "../icon/Logo";
import { NavUser } from "./nav-user";
import { NavMain } from "./nav-main";
import type { Session } from "@/lib/auth-helpers";

type AppSidebarProps = {
  session: Session;
  userRole: string;
};

export function AppSidebar({ session, userRole }: AppSidebarProps) {
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="py-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain userRole={userRole} />
      </SidebarContent>
      <SidebarFooter className="flex gap-3">
        <NavUser session={session} />
      </SidebarFooter>
    </Sidebar>
  );
}
