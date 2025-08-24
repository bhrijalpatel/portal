import { ButtonDashboard } from "@/components/buttons/button-dashboard";
import { Button } from "@/components/ui/button";
import { getSessionOrNull } from "@/lib/auth-helpers";
import Link from "next/link";
import { Home } from "lucide-react";

export default async function NotFound() {
  const session = await getSessionOrNull();

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 p-6 text-center">
        <div className="space-y-2">
          <h1 className="text-muted-foreground text-6xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">Not Found</h2>
          <p className="text-muted-foreground max-w-md">
            The requested resource could not be found.
          </p>
        </div>

        {session ? (
          <ButtonDashboard />
        ) : (
          <Button asChild variant="outline">
            <Link href="/">
              <Home />
              Homepage
            </Link>
          </Button>
        )}
      </div>
    </main>
  );
}
