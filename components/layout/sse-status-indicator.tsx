"use client";

import { useSSE } from "@/components/providers/sse-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
          <div className="flex items-center justify-center gap-3 px-3 py-1.5 rounded-lg cursor-default border">
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
              <span className="text-xs text-muted-foreground">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isConnected
              ? `Real-time updates active (${
                  userRole
                    ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
                    : "User"
                })`
              : "Real-time updates reconnecting..."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
