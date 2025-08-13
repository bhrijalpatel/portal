// app/(protected)/layout.tsx
import { ButtonAdmin } from "@/components/buttons/ButtonAdmin";
import { ButtonLogout } from "@/components/buttons/ButtonLogout";
import { ThemeToggle } from "@/components/context/ThemeToggle";
import { Logo } from "@/components/icon/Logo";
import { requireSession } from "@/lib/auth-helpers";
import { getSessionOrNull } from "@/lib/auth-helpers";
import Link from "next/link";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // One server-side check here shields *all* pages below this layout.
  await requireSession();
  const session = await getSessionOrNull();
  return (
    <section>
      <div className="w-full flex items-center justify-between p-4 border-b">
        <Logo />
        <div className="flex gap-3">
          {session && <span>{session.user.name}</span>}
          {session && <span>{session.user.email}</span>}
        </div>
        <div className="flex gap-3">
          <ButtonAdmin />
          <ButtonLogout />
          <ThemeToggle />
        </div>
      </div>
      <div className="flex gap-3 items-center p-4 sticky top-0 bg-background border-b">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/inventory">Inventory</Link>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
