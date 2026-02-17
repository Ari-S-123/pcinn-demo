import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Skeleton className="h-[500px]" />
        <div className="space-y-6">
          <Skeleton className="h-[180px]" />
          <Skeleton className="h-[380px]" />
        </div>
      </div>
    </div>
  );
}
