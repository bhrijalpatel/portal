import { adminExists, requireSession } from "@/lib/auth-helpers";
import ClaimAdmin from "./claim";
import { ButtonDashboard } from "@/components/buttons/button-dashboard";
import { validateBootstrapAccess } from "@/lib/admin-security";
import { headers } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldAlert, Lock } from "lucide-react";

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
      <main className="flex flex-col items-center justify-center max-w-md mx-auto gap-3 h-screen">
        <Card className="border-red-500/20 bg-red-50/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <CardTitle>Admin Setup Disabled</CardTitle>
            </div>
            <CardDescription className="text-red-600 dark:text-red-400">
              {accessCheck.reason}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              To enable admin setup:
            </p>
            <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
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
      <main className="flex flex-col items-center justify-center mx-auto gap-3 h-screen">
        <Card>
          <CardContent>
            <CardHeader>
              <Lock className="h-5 w-5 text-green-500" />
              <CardTitle>Setup Complete</CardTitle>
            </CardHeader>
            <CardDescription>
              An admin user already exists in the system.
            </CardDescription>
          </CardContent>
        </Card>
        <ButtonDashboard />
      </main>
    );
  }

  const { user } = await requireSession();

  return (
    <main className="flex flex-col items-center justify-center max-w-lg mx-auto gap-4 h-screen p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>🔐 Secure Admin Setup</CardTitle>
          <CardDescription>
            First-time admin role assignment with enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <p className="text-sm">
              Signed in as: <b>{user.email}</b>
            </p>
            <p className="text-sm text-muted-foreground">
              IP Address:{" "}
              <code className="bg-background px-1 rounded">{ipAddress}</code>
            </p>
          </div>

          <div className="border-l-4 border-amber-500 bg-amber-50/10 p-3 space-y-1">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              ⚠️ Security Notice
            </p>
            <p className="text-xs text-muted-foreground">
              You will need the admin setup secret from your environment
              configuration to proceed. This is a one-time operation that cannot
              be reversed.
            </p>
          </div>

          <ClaimAdmin />
        </CardContent>
      </Card>
    </main>
  );
}
