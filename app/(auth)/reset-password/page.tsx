import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <div className="from-background via-background to-secondary/5 relative flex min-h-svh flex-col items-center justify-center gap-6 bg-gradient-to-br p-6 md:p-10">
      {/* Back to Sign In Link */}
      <Link
        href="/sign-in"
        className="text-muted-foreground hover:text-foreground group absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        <div className="flex items-center gap-1">
          <Sparkles className="size-4" />
          <span className="font-semibold">Back to Sign In</span>
        </div>
      </Link>

      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/5 h-96 w-96 animate-pulse rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute right-1/5 bottom-1/4 h-80 w-80 animate-pulse rounded-full bg-amber-500/10 blur-3xl delay-1000" />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense
          fallback={
            <div className="from-primary/5 border-primary/10 w-full max-w-md rounded-2xl border bg-gradient-to-br via-blue-500/5 to-purple-500/5 p-8 shadow-lg backdrop-blur-sm">
              <div className="animate-pulse space-y-4">
                <div className="bg-muted mx-auto h-8 w-3/4 rounded"></div>
                <div className="bg-muted h-4 w-full rounded"></div>
                <div className="bg-muted h-10 rounded"></div>
                <div className="bg-muted h-10 rounded"></div>
              </div>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
