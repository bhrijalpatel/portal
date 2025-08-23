"use client";

import { useSSE } from "@/components/providers/sse-provider";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff } from "lucide-react";
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
  
  // Always call hooks first - this is required by Rules of Hooks
  let sseContext = null;
  let hasSSEError = false;
  
  try {
    sseContext = useSSE();
  } catch (error) {
    hasSSEError = true;
  }
  
  // Only show SSE indicator for admin users on admin pages
  const isAdminPage = pathname?.startsWith('/admin');
  const isAdminUser = session?.user?.role === 'admin';
  
  // Early return after all hooks have been called
  if (!isAdminPage || !isAdminUser || hasSSEError || !sseContext) {
    return null;
  }

  const { isConnected, connect, disconnect } = sseContext;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={isConnected ? disconnect : connect}
            className="h-8 w-8 p-0"
          >
            <div className="flex items-center gap-1.5">
              <div 
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} 
              />
              {isConnected ? (
                <Wifi className="h-3 w-3 text-green-600" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-600" />
              )}
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isConnected 
              ? 'Real-time updates active - Click to disconnect' 
              : 'Real-time updates disconnected - Click to connect'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}