import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ButtonAdmin } from "../buttons/ButtonAdmin";
import { Logo } from "../icon/Logo";
import { NavUser } from "./nav-user";
import { NavMain } from "./nav-main";

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
