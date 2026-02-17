"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TimeSeriesResult } from "@/types/prediction";

const conversionConfig = {
  conversion: { label: "Conversion", color: "#fb923c" },
} satisfies ChartConfig;

const mwConfig = {
  mw: { label: "Mw (Da)", color: "#fb923c" },
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
    <div className="panel-inset p-5">
      <h3 className="section-label mb-4 text-[var(--color-chrome-muted)]">Reaction Evolution</h3>
      <Tabs defaultValue="conversion">
        <TabsList className="mb-4 gap-2 bg-transparent p-0">
          <TabsTrigger
            value="conversion"
            className="text-muted-foreground border-border data-[state=active]:bg-accent rounded border px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase data-[state=active]:border-[var(--color-chrome)]/50 data-[state=active]:text-[var(--color-chrome)] dark:data-[state=active]:bg-[oklch(0.18_0.01_260)]"
          >
            Conversion vs Time
          </TabsTrigger>
          <TabsTrigger
            value="mw"
            className="text-muted-foreground border-border data-[state=active]:bg-accent rounded border px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase data-[state=active]:border-[var(--color-chrome)]/50 data-[state=active]:text-[var(--color-chrome)] dark:data-[state=active]:bg-[oklch(0.18_0.01_260)]"
          >
            Mw vs Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversion">
          <ChartContainer
            config={conversionConfig}
            className="border-border bg-muted h-[300px] w-full rounded border p-2 dark:bg-[oklch(0.10_0.012_260)]"
          >
            <LineChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid vertical={true} strokeDasharray="2 6" stroke="var(--border)" />
              <XAxis
                dataKey="time"
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickMargin={8}
                tick={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fill: "var(--muted-foreground)",
                }}
                label={{
                  value: "Time (min)",
                  position: "insideBottom",
                  offset: -4,
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fill: "var(--muted-foreground)",
                }}
              />
              <YAxis
                domain={[0, 1]}
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                tick={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fill: "var(--muted-foreground)",
                }}
                width={40}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                content={<ChartTooltipContent labelFormatter={(v) => `t = ${v} min`} />}
              />
              <Line
                dataKey="conversion"
                type="monotone"
                stroke="var(--color-conversion)"
                strokeWidth={1.5}
                dot={false}
                strokeLinecap="round"
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </LineChart>
          </ChartContainer>
        </TabsContent>

        <TabsContent value="mw">
          <ChartContainer
            config={mwConfig}
            className="border-border bg-muted h-[300px] w-full rounded border p-2 dark:bg-[oklch(0.10_0.012_260)]"
          >
            <LineChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid vertical={true} strokeDasharray="2 6" stroke="var(--border)" />
              <XAxis
                dataKey="time"
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickMargin={8}
                tick={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fill: "var(--muted-foreground)",
                }}
                label={{
                  value: "Time (min)",
                  position: "insideBottom",
                  offset: -4,
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fill: "var(--muted-foreground)",
                }}
              />
              <YAxis
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                tick={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fill: "var(--muted-foreground)",
                }}
                width={60}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => `t = ${v} min`}
                    formatter={(v) => `${Number(v).toLocaleString()} Da`}
                  />
                }
              />
              <Line
                dataKey="mw"
                type="monotone"
                stroke="var(--color-mw)"
                strokeWidth={1.5}
                dot={false}
                strokeLinecap="round"
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </LineChart>
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
