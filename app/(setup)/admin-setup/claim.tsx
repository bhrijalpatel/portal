"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function ClaimAdmin() {
  const [loading, setLoading] = useState(false);
  const [setupSecret, setSetupSecret] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onClaim() {
    if (!setupSecret.trim()) {
      setErr("Please enter the admin setup secret");
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ setupSecret }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Failed to claim admin role");
        if (data.reason) {
          toast.error(data.reason);
        }
        setLoading(false);
        return;
      }

      // Success - show toast and sign out to refresh session
      toast.success(
        "Admin role successfully claimed! Signing you out to refresh your session.",
      );

      // Small delay for user to see the success message, then sign out
      setTimeout(async () => {
        try {
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                toast.success("Please sign in again to access the admin panel");
                window.location.href = "/sign-in";
              },
              onError: () => {
                // If signOut fails, still redirect to sign-in
                toast.info("Please sign in again to access the admin panel");
                window.location.href = "/sign-in";
              },
            },
          });
        } catch {
          // Fallback - force redirect to sign-in
          toast.info("Please sign in again to access the admin panel");
          window.location.href = "/sign-in";
        }
      }, 1500);
    } catch (error) {
      console.error("Bootstrap error:", error);
      setErr("Failed to claim admin role. Please try again.");
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="setup-secret" className="flex items-center gap-2">
          <KeyRound className="size-4" />
          Admin Setup Secret
        </Label>
        <Input
          id="setup-secret"
          type="password"
          placeholder="Enter the secret from ADMIN_SETUP_SECRET"
          value={setupSecret}
          onChange={(e) => {
            setSetupSecret(e.target.value);
            setErr(null); // Clear error when user types
          }}
          disabled={loading}
          className="font-mono"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              onClaim();
            }
          }}
        />
        {err && (
          <p className="text-sm text-rose-600 dark:text-rose-400 flex items-start gap-1">
            <span className="text-xs">⚠️</span>
            <span>{err}</span>
          </p>
        )}
      </div>

      <Button
        onClick={onClaim}
        disabled={loading || !setupSecret.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            Claiming Admin Role
          </>
        ) : (
          <>
            <ShieldCheck />
            Claim Admin Role
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• This action will be logged with your IP address</p>
        <p>• You will become the system administrator</p>
        <p>• You will be signed out to refresh your session with admin role</p>
        <p>• This operation cannot be undone</p>
      </div>
    </div>
  );
}
