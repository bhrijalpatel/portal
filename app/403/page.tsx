import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">403</h1>
          <h2 className="text-2xl font-semibold">Access Forbidden</h2>
          <p className="text-muted-foreground max-w-md">
            You do not have permission to access this resource. Please contact
            an administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
