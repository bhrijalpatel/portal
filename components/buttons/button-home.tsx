import { FuelIcon, Home } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export const ButtonHome = () => {
  return (
    <Button asChild variant="outline">
      <Link href="/">
        <Home />
        Home
      </Link>
    </Button>
  );
};
