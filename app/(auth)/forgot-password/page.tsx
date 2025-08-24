import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="relative min-h-svh flex flex-col items-center justify-center gap-6 p-6 md:p-10 bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Back to Sign In Link */}
      <Link
        href="/sign-in"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
        <div className="flex items-center gap-1">
          <Sparkles className="size-4" />
          <span className="font-semibold">Back to Sign In</span>
        </div>
      </Link>

      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/5 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/5 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
