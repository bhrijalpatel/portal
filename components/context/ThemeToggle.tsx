// components/context/ThemeToggle.tsx
"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";
import { Button } from "../ui/button";

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
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Toggle theme (current: ${themeLabel})`}
      title={`Theme: ${themeLabel} (click to change)`}
    >
      <Icon />
    </Button>
  );
}
