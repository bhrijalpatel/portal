// Central navigation constants
// TODO: Add RBAC: attach roles or permission keys per item and filter in NavMain.

export type NavItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export const NAV_MAIN_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/dashboard" },
  { title: "Inventory", url: "/inventory" },
];
