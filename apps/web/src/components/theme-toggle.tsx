"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme ? resolvedTheme === "dark" : true;
  const icon = resolvedTheme ? (isDark ? "☀" : "☾") : "☀";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="font-mono text-xs"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span suppressHydrationWarning>{icon}</span>
    </Button>
  );
}
