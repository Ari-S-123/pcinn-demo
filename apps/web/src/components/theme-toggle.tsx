"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme ? resolvedTheme === "dark" : true;
  const icon = resolvedTheme ? (isDark ? "\u2600" : "\u263E") : "\u2600";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase transition-colors hover:text-[var(--color-chrome)]"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span suppressHydrationWarning>{icon}</span>
    </button>
  );
}
