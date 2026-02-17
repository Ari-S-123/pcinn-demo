import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ComparisonChartInner = dynamic(
  () =>
    import("@/components/charts/comparison-chart-inner").then((mod) => mod.ComparisonChartInner),
  {
    loading: () => <Skeleton className="h-[440px] w-full rounded-lg" />,
    ssr: false,
  },
);

export { ComparisonChartInner as ComparisonChart };
