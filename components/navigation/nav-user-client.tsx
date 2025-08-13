"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Bell,
  EllipsisVertical,
  LogOut,
  Loader2,
  User2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useTheme } from "next-themes"; // added

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatar?: string | null; // in case your model uses avatar
};

type SessionShape = {
  user: SessionUser;
};

export function NavUserClient({ session }: { session: SessionShape | null }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, setTheme } = useTheme(); // added

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out");
            router.replace("/");
            setLoggingOut(false);
          },
          onError: () => {
            toast.error("Logout failed");
            setLoggingOut(false);
          },
        },
      });
    } catch {
      toast.error("Logout failed");
      setLoggingOut(false);
    }
  };

  const user: SessionUser = {
    name: session?.user?.name || "Guest",
    email: session?.user?.email || "",
    image: session?.user?.image,
    avatar: session?.user?.avatar,
  };

  const avatarSrc = user.avatar || user.image || "";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded">
                {avatarSrc && (
                  <AvatarImage src={avatarSrc} alt={user.name || "User"} />
                )}
                <AvatarFallback className="rounded">
                  {(user.name || "G").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {user.name && (
                  <span className="truncate font-medium">{user.name}</span>
                )}
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded">
                  {avatarSrc && (
                    <AvatarImage src={avatarSrc} alt={user.name || "User"} />
                  )}
                  <AvatarFallback className="rounded">
                    {(user.name || "G").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {user.name && (
                    <span className="truncate font-medium">{user.name}</span>
                  )}
                  {user.email && (
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <User2 />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Bell />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  aria-selected={theme === "light"}
                >
                  <Sun className="mr-2 size-4" />
                  Light
                  {theme === "light" && (
                    <span className="ml-auto text-xs font-medium">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  aria-selected={theme === "dark"}
                >
                  <Moon className="mr-2 size-4" />
                  Dark
                  {theme === "dark" && (
                    <span className="ml-auto text-xs font-medium">✓</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  aria-selected={theme === "system"}
                >
                  <Monitor className="mr-2 size-4" />
                  System
                  {theme === "system" && (
                    <span className="ml-auto text-xs font-medium">✓</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={loggingOut}
              onSelect={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
