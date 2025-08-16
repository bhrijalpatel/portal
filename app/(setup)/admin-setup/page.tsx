import { adminExists, requireSession } from "@/lib/auth-helpers";
import ClaimAdmin from "./claim";
import { ButtonDashboard } from "@/components/buttons/button-dashboard";

export default async function AdminSetupPage() {
  // Only accessible when NO admin exists
  if (await adminExists()) {
    // An admin already exists — do not expose this UI anymore
    return (
      <main className="flex flex-col items-center justify-center max-w-md mx-auto gap-3 h-screen">
        <h1 className="text-2xl font-semibold">Setup Complete</h1>
        <p className="text-muted-foreground">
          An admin user already exists in the system.
        </p>
        <ButtonDashboard />
      </main>
    );
  }

  const { user } = await requireSession();
  // Note: No longer need ensureProfile since role is managed in Better Auth user.role

  return (
    <main className="flex flex-col items-center justify-center max-w-md mx-auto gap-3 h-screen">
      <h1 className="text-2xl font-semibold">Initial Admin Setup</h1>
      <p>
        Signed in as: <b>{user.email}</b>
      </p>
      <p>No admin exists. You can claim the admin role for this app.</p>
      <ClaimAdmin />
    </main>
  );
}
