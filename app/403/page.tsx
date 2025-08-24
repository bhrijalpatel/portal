import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 p-6 text-center">
        <div className="space-y-2">
          <h1 className="text-muted-foreground text-6xl font-bold">403</h1>
          <h2 className="text-2xl font-semibold">Access Forbidden</h2>
          <p className="text-muted-foreground max-w-md">
            You do not have permission to access this resource. Please contact
            an administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
