import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[oklch(0.97_0.002_250)] dark:bg-[oklch(0.15_0.01_260)]">
      <div className="container mx-auto flex h-12 max-w-6xl items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="font-mono text-sm font-semibold tracking-tight text-[var(--color-chrome)]"
            style={{ textShadow: "0 0 8px oklch(0.82 0.08 85 / 25%)" }}
          >
            PCINN
          </span>
          <span className="text-[var(--color-chrome)]/30">|</span>
          <span className="text-muted-foreground hidden text-[10px] tracking-wider uppercase sm:inline">
            Polymer Chemistry Neural Network
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-4">
          <Link
            href="/predict"
            className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase transition-colors hover:text-[var(--color-chrome)]"
          >
            Predict
          </Link>
          <Link
            href="/compare"
            className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase transition-colors hover:text-[var(--color-chrome)]"
          >
            Compare
          </Link>
          <Link
            href="/upload"
            className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase transition-colors hover:text-[var(--color-chrome)]"
          >
            Upload
          </Link>
          <ThemeToggle />
        </nav>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-chrome)]/30 to-transparent" />
    </header>
  );
}
