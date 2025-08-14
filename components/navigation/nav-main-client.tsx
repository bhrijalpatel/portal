"use client";

import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavItem } from "@/constants/nav-main";
import { usePathname } from "next/navigation";
import { ShieldUserIcon, LayoutDashboard, Package } from "lucide-react";

// Icon mapping for string identifiers
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldUserIcon: ShieldUserIcon,
  DashboardIcon: LayoutDashboard,
  InventoryIcon: Package,
};

type NavMainClientProps = {
  items: NavItem[];
};

export function NavMainClient({ items }: NavMainClientProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            // Get icon component from string identifier
            const IconComponent = item.icon ? iconMap[item.icon] : null;

            // Active logic: exact match OR current path is within the item's segment (excluding root to avoid false positives)
            const isActive =
              item.url === "/"
                ? pathname === "/"
                : pathname === item.url || pathname.startsWith(item.url + "/");
            const Content = (
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                disabled={item.disabled}
                isActive={isActive}
                className={
                  item.disabled ? "opacity-60 pointer-events-none" : ""
                }
              >
                <Link href={item.url}>
                  {IconComponent && <IconComponent className="mr-2 size-4" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            );
            return <SidebarMenuItem key={item.url}>{Content}</SidebarMenuItem>;
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
