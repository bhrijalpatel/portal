import { ShieldUserIcon } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

type ButtonAdminProps = {
  userRole: string;
};

export const ButtonAdmin = ({ userRole }: ButtonAdminProps) => {
  if (userRole !== "admin") return null;

  return (
    <Button asChild variant="outline">
      <Link href="/admin">
        <ShieldUserIcon />
        Admin
      </Link>
    </Button>
  );
};
