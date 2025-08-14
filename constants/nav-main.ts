// Central navigation constants
// TODO: Add RBAC: attach roles or permission keys per item and filter in NavMain.

export type NavItem = {
  title: string;
  url: string;
  icon?: string; // Changed to string to make it serializable
  disabled?: boolean;
};

export const NAV_MAIN_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: "DashboardIcon" },
  { title: "Inventory", url: "/inventory", icon: "InventoryIcon" },
];
