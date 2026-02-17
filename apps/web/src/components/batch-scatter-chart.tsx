import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const BatchScatterChartInner = dynamic(
  () =>
    import("@/components/charts/batch-scatter-chart-inner").then(
      (mod) => mod.BatchScatterChartInner,
    ),
  {
    loading: () => <Skeleton className="h-[420px] w-full rounded-lg" />,
    ssr: false,
  },
);

export { BatchScatterChartInner as BatchScatterChart };
