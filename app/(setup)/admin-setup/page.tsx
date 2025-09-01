import { adminExists, requireSession } from "@/lib/auth-helpers";
import ClaimAdmin from "./claim";
import { ButtonDashboard } from "@/components/buttons/button-dashboard";
import { validateBootstrapAccess } from "@/helpers/admin-security";
import { headers } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldAlert, Lock, LockKeyhole, TriangleAlert } from "lucide-react";

export default async function AdminSetupPage() {
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for") ||
    headersList.get("x-real-ip") ||
    "unknown";

  // Check if bootstrap is allowed
  const accessCheck = validateBootstrapAccess(ipAddress);

  // If bootstrap is not allowed, show error
  if (!accessCheck.allowed) {
    return (
      <main className="mx-auto flex h-screen max-w-md flex-col items-center justify-center gap-3">
        <Card className="border-rose-500/20 bg-rose-50/10 dark:bg-rose-950/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-rose-500 dark:text-rose-400" />
              <CardTitle>Admin Setup Disabled</CardTitle>
            </div>
            <CardDescription className="text-rose-600 dark:text-rose-400">
              {accessCheck.reason}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">
              To enable admin setup:
            </p>
            <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
              <li>
                Set{" "}
                <code className="bg-muted px-1">ADMIN_SETUP_ENABLED=true</code>{" "}
                in environment
              </li>
              <li>
                Set <code className="bg-muted px-1">ADMIN_SETUP_SECRET</code> to
                a secure value
              </li>
              <li>Restart the application</li>
            </ol>
          </CardContent>
        </Card>
        <ButtonDashboard />
      </main>
    );
  }

  // Check if admin already exists
  if (await adminExists()) {
    return (
      <main className="mx-auto flex h-screen flex-col items-center justify-center gap-3">
        <div className="w-full max-w-sm">
          <Card className="from-primary/5 bg-gradient-to-br via-emerald-500/5 to-blue-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="size-5 text-emerald-500 dark:text-emerald-400" />
                <CardTitle>Setup Complete</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              An admin user already exists in the system.
            </CardContent>
          </Card>
          <ButtonDashboard />
        </div>
      </main>
    );
  }

  const { user } = await requireSession();

  return (
    <main className="mx-auto flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
      <div className="w-full max-w-sm">
        <Card className="from-primary/5 bg-gradient-to-br via-blue-500/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="size-5" />
              <span>Secure Admin Setup</span>
            </CardTitle>
            <CardDescription>
              First-time admin role assignment with enhanced security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted space-y-2 rounded-lg p-3">
              <p className="text-sm">
                Signed in as: <b>{user.email}</b>
              </p>
              <p className="text-muted-foreground text-sm">
                IP Address:{" "}
                <code className="bg-background rounded px-1">{ipAddress}</code>
              </p>
            </div>
            <Card className="border-amber-500/50 bg-amber-500/25">
              <CardHeader className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                <TriangleAlert className="size-5" />
                <span>Security Notice</span>
              </CardHeader>
              <CardContent>
                <p className="text-xs">
                  You will need the admin setup secret from your environment
                  configuration to proceed. This is a one-time operation that
                  cannot be reversed.
                </p>
              </CardContent>
            </Card>
            <ClaimAdmin />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
