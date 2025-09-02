import { SignInForm } from "@/components/forms/form-signin";
import { Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params.message === "verify-email" && (
        <Alert className="mb-4 border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/20">
          <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <AlertDescription className="text-sky-800 dark:text-sky-200">
            Please check your email to verify your account before signing in.
          </AlertDescription>
        </Alert>
      )}
      <SignInForm />
    </>
  );
}
