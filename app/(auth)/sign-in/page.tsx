import { SignInForm } from "@/components/forms/form-signin";
import Link from "next/link";
import { ArrowLeft, Sparkles, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
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

      <div className="w-full max-w-xs">
        {params.message === "verify-email" && (
          <Alert className="border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/20">
            <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <AlertDescription className="text-sky-800 dark:text-sky-200">
              Please check your email to verify your account before signing in.
            </AlertDescription>
          </Alert>
        )}
        <SignInForm />
      </div>
    </div>
  );
}
