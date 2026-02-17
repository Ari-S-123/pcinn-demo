import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-xl">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            The page you requested does not exist or may have been moved.
          </p>
          <Button asChild className="font-mono text-xs">
            <Link href="/">Go to homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
