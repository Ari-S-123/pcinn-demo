import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold tracking-tight">PCINN</span>
          <span className="text-muted-foreground/50">|</span>
          <span className="text-muted-foreground hidden text-xs sm:inline">
            Polymer Chemistry Neural Network
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/predict" className="font-mono text-xs">
              Predict
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/compare" className="font-mono text-xs">
              Compare
            </Link>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
