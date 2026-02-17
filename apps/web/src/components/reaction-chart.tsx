import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ReactionChartInner = dynamic(
  () => import("@/components/charts/reaction-chart-inner").then((mod) => mod.ReactionChartInner),
  {
    loading: () => <Skeleton className="h-[380px] w-full rounded-lg" />,
    ssr: false,
  },
);

export { ReactionChartInner as ReactionChart };
