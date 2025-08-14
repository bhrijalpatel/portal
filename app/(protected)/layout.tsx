// app/(protected)/layout.tsx
import { getSessionWithRole } from "@/lib/auth-helpers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { RoleProvider } from "@/lib/role-context";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single DB query gets both session and user role
  const { session, userRole } = await getSessionWithRole();

  return (
    <RoleProvider session={session} userRole={userRole}>
      <SidebarProvider>
        <AppSidebar session={session} userRole={userRole} />
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
