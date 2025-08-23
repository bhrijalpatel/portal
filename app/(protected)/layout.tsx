// app/(protected)/layout.tsx
import { getSessionWithRoleOrNull } from "@/lib/auth-helpers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { RoleProvider } from "@/providers/role-provider";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for session without causing redirect loop
  const sessionData = await getSessionWithRoleOrNull();

  // If no session, redirect to sign-in (this is the real protection)
  if (!sessionData) {
    redirect("/sign-in");
  }

  const { session, userRole } = sessionData;

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
