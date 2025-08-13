import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ButtonAdmin } from "../buttons/ButtonAdmin";
import { ButtonLogout } from "../buttons/ButtonLogout";
import { ButtonDashboard } from "../buttons/ButtonDashboard";
import { Logo } from "../icon/Logo";
import { NavUser } from "./nav-user";
import { NavMain } from "./nav-main";
import { Separator } from "../ui/separator";

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="py-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter className="flex gap-3">
        <ButtonAdmin />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
