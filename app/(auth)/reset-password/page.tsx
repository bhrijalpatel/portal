import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
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

      <div className="w-full max-w-xs">
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
