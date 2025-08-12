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
    <Button asChild variant="outline">
      <Link href="/admin">
        <ShieldUserIcon />
        Admin
      </Link>
    </Button>
  );
};
