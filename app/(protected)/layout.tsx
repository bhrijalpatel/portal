// app/(protected)/layout.tsx
import { requireSession } from "@/lib/auth-helpers";

export default async function ProtectedLayout({
  children,
}: { children: React.ReactNode }) {
  // One server-side check here shields *all* pages below this layout.
  await requireSession();
  return <section>{children}</section>;
}