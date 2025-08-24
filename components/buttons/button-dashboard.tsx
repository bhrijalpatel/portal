import { LayoutDashboard } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { getSessionOrNull } from "@/lib/auth-helpers";

export const ButtonDashboard = async () => {
  const session = await getSessionOrNull();

  if (!session) return null;

  return (
    <Button asChild variant="outline">
      <Link href="/dashboard">
        <LayoutDashboard /> Dashboard
      </Link>
    </Button>
  );
};
