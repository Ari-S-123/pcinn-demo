"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred while rendering this route.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} className="font-mono text-xs">
              Try again
            </Button>
            <Button asChild variant="outline" className="font-mono text-xs">
              <Link href="/">Return home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
