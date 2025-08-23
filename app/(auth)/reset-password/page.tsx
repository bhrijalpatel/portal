import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-svh flex flex-col items-center justify-center gap-6 p-6 md:p-10 bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Back to Sign In Link */}
      <Link
        href="/sign-in"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <div className="flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          <span className="font-semibold">Back to Sign In</span>
        </div>
      </Link>

      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/5 h-96 w-96 rounded-full bg-red-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/5 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense fallback={
          <div className="w-full max-w-md p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-blue-500/5 to-purple-500/5 border border-primary/10 backdrop-blur-sm shadow-lg">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}