"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function ClaimAdmin() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClaim() {
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/admin/bootstrap", { method: "POST" });
      if (!res.ok) {
        setErr(await res.text());
        setLoading(false);
        return;
      }
      // success — go to dashboard (or admin page)
      window.location.href = "/dashboard";
    } catch {
      setErr("Failed to claim admin role. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={onClaim} disabled={loading}>
        <ShieldCheck />
        {loading ? "Claiming…" : "Claim Admin Role"}
      </Button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
