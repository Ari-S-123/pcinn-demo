"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TimeSeriesResult } from "@/types/prediction";

const conversionConfig = {
  conversion: { label: "Conversion", color: "var(--color-sa-pcinn)" },
} satisfies ChartConfig;

const mwConfig = {
  mw: { label: "Mw (Da)", color: "var(--color-sa-pcinn)" },
} satisfies ChartConfig;

interface ReactionChartInnerProps {
  data: TimeSeriesResult | null;
}

export function ReactionChartInner({ data }: ReactionChartInnerProps) {
  if (!data) return null;

  const chartData = data.times.map((timeValue, i) => ({
    time: +(timeValue / 60).toFixed(1),
    conversion: +data.conversion[i].toFixed(4),
    mw: +data.mw[i].toFixed(0),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm">Reaction Evolution</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="conversion">
          <TabsList className="mb-4">
            <TabsTrigger value="conversion" className="font-mono text-xs">
              Conversion vs Time
            </TabsTrigger>
            <TabsTrigger value="mw" className="font-mono text-xs">
              Mw vs Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversion">
            <ChartContainer config={conversionConfig} className="h-[300px] w-full">
              <LineChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="font-mono text-[10px]"
                  label={{
                    value: "Time (min)",
                    position: "insideBottom",
                    offset: -4,
                    fontSize: 10,
                  }}
                />
                <YAxis
                  domain={[0, 1]}
                  tickLine={false}
                  axisLine={false}
                  className="font-mono text-[10px]"
                  width={40}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line
                  dataKey="conversion"
                  type="monotone"
                  stroke="var(--color-conversion)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="mw">
            <ChartContainer config={mwConfig} className="h-[300px] w-full">
              <LineChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="font-mono text-[10px]"
                  label={{
                    value: "Time (min)",
                    position: "insideBottom",
                    offset: -4,
                    fontSize: 10,
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="font-mono text-[10px]"
                  width={60}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent formatter={(v) => `${Number(v).toLocaleString()} Da`} />
                  }
                />
                <Line
                  dataKey="mw"
                  type="monotone"
                  stroke="var(--color-mw)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
