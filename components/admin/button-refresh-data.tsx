"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

export function RefreshButton({ onRefresh, isLoading = false }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing || isLoading) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshing = isRefreshing || isLoading;

  return (
    <Button
      variant="outline"
      onClick={handleRefresh}
      disabled={refreshing}
      className="gap-2"
    >
      {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      {refreshing ? "Refreshing..." : "Refresh Data"}
    </Button>
  );
}