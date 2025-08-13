"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ButtonLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out");
            router.replace("/");
            setLoading(false);
          },
          onError: () => {
            toast.error("Logout failed");
            setLoading(false);
          },
        },
      });
    } catch {
      toast.error("Logout failed");
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={loading}
      className="cursor-pointer"
    >
      {loading ? <Loader2 className="animate-spin" /> : <LogOut />}
      Logout
    </Button>
  );
}
