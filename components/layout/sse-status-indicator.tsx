"use client";

import { useSSE } from "@/components/providers/sse-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { Check, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export function SSEStatusIndicator() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Always call hooks unconditionally - required by Rules of Hooks
  const { isConnected, userRole } = useSSE();

  // Show for all authenticated users on protected pages
  const isProtectedPage =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/inventory") ||
    pathname?.startsWith("/jobs") ||
    pathname?.startsWith("/orders") ||
    pathname?.startsWith("/tasks");
  const isAuthenticated = !!session?.user;

  // Early return after all hooks have been called
  if (!isProtectedPage || !isAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="outline">
            {/* Animated pulsing status indicator */}
            <span className="relative flex size-3">
              {isConnected ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex size-3 rounded-full bg-emerald-500"></span>
                </>
              ) : (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex size-3 rounded-full bg-rose-500"></span>
                </>
              )}
            </span>

            {userRole && (
              <span className="text-muted-foreground text-xs">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isConnected ? (
            <div className="flex flex-row items-center justify-center gap-1">
              <span>Real-time updates connected</span>
              <Check className="size-4" />
            </div>
          ) : (
            <div className="flex flex-row items-center justify-center gap-1">
              <span>Real-time updates reconnecting</span>
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
