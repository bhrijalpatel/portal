// app/(auth)/layout.tsx
import { redirectIfAuthenticated } from "@/lib/auth-helpers";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user is already logged in, bounce them to the app
  await redirectIfAuthenticated("/dashboard");
  return <>{children}</>;
}
