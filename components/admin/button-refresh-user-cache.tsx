"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CacheRefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      const response = await fetch("/api/admin/cache/refresh", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Cache refreshed successfully");
        // Reload the page to show fresh data
        window.location.reload();
      } else {
        throw new Error("Failed to refresh cache");
      }
    } catch (error) {
      toast.error("Failed to refresh cache");
      console.error("Cache refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Refreshing" : "Refresh Data"}
    </Button>
  );
}
