import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
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
  );
}
