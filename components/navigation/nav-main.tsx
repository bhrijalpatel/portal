"use client";

import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NAV_MAIN_ITEMS, NavItem } from "@/constants/nav-main";
import { usePathname } from "next/navigation";

type NavMainProps = {
  items?: NavItem[]; // optional override; defaults to NAV_MAIN_ITEMS
};

export function NavMain({ items = NAV_MAIN_ITEMS }: NavMainProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
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
                  {item.icon && <item.icon className="mr-2 size-4" />}
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

// TODO: RBAC: Accept current user / roles and filter items by a roles / permissions field.
