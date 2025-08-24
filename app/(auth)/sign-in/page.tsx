import { SignInForm } from "@/components/forms/form-signin";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      {/* Back to Home Link */}
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground group absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        <div className="flex items-center gap-1">
          <Sparkles className="size-4" />
          <span className="font-semibold">Portal</span>
        </div>
      </Link>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <SignInForm />
      </div>
    </div>
  );
}
