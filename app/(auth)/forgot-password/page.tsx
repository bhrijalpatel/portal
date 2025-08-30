import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
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

      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
