// app/(auth)/layout.tsx
import { redirectIfAuthenticated } from "@/lib/auth-helpers";
import Link from "next/link";
import { ArrowLeft, Sparkle } from "lucide-react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user is already logged in, bounce them to the app
  await redirectIfAuthenticated("/dashboard");

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground group absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        <div className="flex items-center gap-1">
          <Sparkle className="size-4" />
          <span className="font-semibold">Portal</span>
        </div>
      </Link>

      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
