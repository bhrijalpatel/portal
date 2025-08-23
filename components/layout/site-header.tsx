"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { SSEStatusIndicator } from "./sse-status-indicator";

function usePageTitle() {
  const pathname = usePathname();
  return useMemo(() => {
    if (!pathname) return "";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";

    const last = segments[segments.length - 1];

    const map: Record<string, string> = {
      dashboard: "Dashboard",
      settings: "Settings",
      profile: "Profile",
      billing: "Billing",
    };

    const raw = map[last] || last.replace(/[-_]/g, " ");
    return raw
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, [pathname]);
}

export function SiteHeader() {
  const pageTitle = usePageTitle();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center p-4 gap-4">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <SSEStatusIndicator />
        </div>
      </div>
    </header>
  );
}
