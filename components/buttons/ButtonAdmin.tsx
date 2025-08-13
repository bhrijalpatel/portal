import { ShieldUserIcon } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { getSessionOrNull } from "@/lib/auth-helpers";
import { profiles } from "@/db/schema";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";

export const ButtonAdmin = async () => {
  const session = await getSessionOrNull();

  if (!session) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  if (!profile || profile.role !== "admin") return null;

  return (
    <Button
      asChild
      className="bg-emerald-300 hover:bg-emerald-300/90 dark:bg-emerald-700 dark:hover:bg-emerald-700/90 text-foreground"
    >
      <Link href="/admin">
        <ShieldUserIcon />
        Admin
      </Link>
    </Button>
  );
};
