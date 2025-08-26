"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ButtonSignOut() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out");
            router.push("/");
            // Keep loading state until redirect completes
          },
        },
      });
    } catch (error) {
      toast.error("Sign out failed");
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={loading}
      className="cursor-pointer"
    >
      {loading ? <Loader2 className="animate-spin" /> : <LogOut />}
      Sign Out
    </Button>
  );
}
