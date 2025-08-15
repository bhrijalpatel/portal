import { SignInForm } from "@/components/forms/signin-form";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="relative min-h-svh flex flex-col items-center justify-center gap-6 p-6 md:p-10">
      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <div className="flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          <span className="font-semibold">Portal</span>
        </div>
      </Link>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <SignInForm />
      </div>
    </div>
  );
}
