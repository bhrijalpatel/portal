// app/(protected)/layout.tsx
import { requireSession } from "@/lib/auth-helpers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
