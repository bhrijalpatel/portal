// app/(protected)/dashboard/page.tsx
import { getSessionOrNull } from "@/lib/auth-helpers";
import { ButtonLogout } from "@/components/buttons/ButtonLogout";
import { ThemeToggle } from "@/components/context/ThemeToggle";
import { ButtonAdmin } from "@/components/buttons/ButtonAdmin";

export default async function DashboardPage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen p-6 gap-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
    </section>
  );
}
