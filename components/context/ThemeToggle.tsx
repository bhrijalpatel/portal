// components/context/ThemeToggle.tsx
"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";

type ThemeType = "light" | "dark" | "system";

export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}): React.ReactElement | null {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!theme) setTheme("system" as ThemeType);
  }, [theme, setTheme]);

  if (!mounted) return null;

  const activeTheme = theme === "system" ? resolvedTheme : theme;

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const themeLabel =
    theme === "system" ? "System" : activeTheme === "dark" ? "Dark" : "Light";

  const Icon =
    theme === "system" ? Monitor : activeTheme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`inline-flex size-8 items-center justify-center rounded-md border bg-background/25 p-1.5 text-xs font-medium transition-colors hover:bg-background/40 ${className}`}
      aria-label={`Toggle theme (current: ${themeLabel})`}
      title={`Theme: ${themeLabel} (click to change)`}
    >
      <Icon size={16} className="text-foreground" />
    </button>
  );
}
