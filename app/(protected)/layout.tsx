// app/(protected)/layout.tsx
// Why: Add defense-in-depth with server-side validation as backup to middleware
// Security: Provides Layer 2 protection against CVE-2025-29927 and other bypasses
// Citation: https://nextjs.org/docs/app/building-your-application/routing/middleware#performance
import { requireSession } from "@/lib/auth-helpers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { RoleProvider } from "@/providers/role-provider";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SECURITY: Layer 2 - Server-side session validation (defense-in-depth)
  // This provides backup protection if middleware is bypassed (CVE-2025-29927)
  const session = await requireSession();

  // Session data is managed client-side by RoleProvider for UI purposes
  return (
    <RoleProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RoleProvider>
  );
}
