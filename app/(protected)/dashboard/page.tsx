// app/(protected)/dashboard/page.tsx
import { getSessionOrNull } from "@/lib/auth-helpers";
import { Logout } from "@/components/logout";
import Link from "next/link";

export default async function DashboardPage() {
  // Not strictly necessary—layout already enforces auth.
  // But handy if you want user info to render (email, name, etc.).
  const session = await getSessionOrNull();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 gap-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {session && <p>Signed in as {session.user.name}</p>}
      {session && <p>Email: {session.user.email}</p>}
      <Logout />
    </main>
  );
}
