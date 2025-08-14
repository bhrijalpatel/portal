// Server component wrapper (no "use client")
import { NAV_MAIN_ITEMS, NavItem } from "@/constants/nav-main";
import { NavMainClient } from "./nav-main-client";

type NavMainProps = {
  userRole: string;
  items?: NavItem[]; // optional override; defaults to NAV_MAIN_ITEMS
};

export function NavMain({ userRole, items = NAV_MAIN_ITEMS }: NavMainProps) {
  // Add admin item if user is admin (using string icon identifier)
  const adminItem: NavItem = {
    title: "Admin",
    url: "/admin",
    icon: "ShieldUserIcon", // Use string identifier
  };

  const allItems = userRole === "admin" ? [...items, adminItem] : items;

  return <NavMainClient items={allItems} />;
}
