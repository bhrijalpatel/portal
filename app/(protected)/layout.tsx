// app/(protected)/layout.tsx
import { ButtonAdmin } from "@/components/buttons/ButtonAdmin";
import { ButtonLogout } from "@/components/buttons/ButtonLogout";
import { ThemeToggle } from "@/components/context/ThemeToggle";
import { Logo } from "@/components/icon/Logo";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { requireSession } from "@/lib/auth-helpers";
import { getSessionOrNull } from "@/lib/auth-helpers";
import Link from "next/link";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // One server-side check here shields *all* pages below this layout.
  await requireSession();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <section className="w-full p-4">{children}</section>
      </SidebarInset>
    </SidebarProvider>
  );
}
