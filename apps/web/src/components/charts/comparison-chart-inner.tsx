"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CompareResult } from "@/types/prediction";

const conversionConfig = {
  baseline_nn: { label: "Baseline NN", color: "#34d399" },
  pcinn: { label: "PCINN", color: "#60a5fa" },
  sa_pcinn: { label: "SA-PCINN", color: "#fb923c" },
} satisfies ChartConfig;

const mwConfig = {
  baseline_nn_mw: { label: "Baseline NN", color: "#34d399" },
  pcinn_mw: { label: "PCINN", color: "#60a5fa" },
  sa_pcinn_mw: { label: "SA-PCINN", color: "#fb923c" },
} satisfies ChartConfig;

interface ComparisonChartInnerProps {
  data: CompareResult | null;
}

export function ComparisonChartInner({ data }: ComparisonChartInnerProps) {
  if (!data) return null;

  const chartData = data.times.map((timeValue, i) => ({
    time: +(timeValue / 60).toFixed(1),
    baseline_nn: +data.baseline_nn.conversion[i].toFixed(4),
    pcinn: +data.pcinn.conversion[i].toFixed(4),
    sa_pcinn: +data.sa_pcinn.conversion[i].toFixed(4),
    baseline_nn_mw: +data.baseline_nn.mw[i].toFixed(0),
    pcinn_mw: +data.pcinn.mw[i].toFixed(0),
    sa_pcinn_mw: +data.sa_pcinn.mw[i].toFixed(0),
  }));

  return (
    <div className="panel-inset p-5">
      <h3 className="section-label mb-4 text-[var(--color-chrome-muted)]">Model Comparison</h3>
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
            className="border-border bg-muted h-[320px] w-full rounded border p-2 dark:bg-[oklch(0.10_0.012_260)]"
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
              <ChartLegend
                verticalAlign="top"
                content={<ChartLegendContent className="font-mono text-[10px]" />}
              />
              <Line
                dataKey="baseline_nn"
                name="Baseline NN"
                type="monotone"
                stroke="var(--color-baseline_nn)"
                strokeWidth={2}
                dot={false}
                strokeLinecap="round"
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Line
                dataKey="pcinn"
                name="PCINN"
                type="monotone"
                stroke="var(--color-pcinn)"
                strokeWidth={2}
                dot={false}
                strokeLinecap="round"
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={200}
              />
              <Line
                dataKey="sa_pcinn"
                name="SA-PCINN"
                type="monotone"
                stroke="var(--color-sa_pcinn)"
                strokeWidth={2}
                dot={false}
                strokeLinecap="round"
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={400}
              />
            </LineChart>
          </ChartContainer>
        </TabsContent>

        <TabsContent value="mw">
          <ChartContainer
            config={mwConfig}
            className="border-border bg-muted h-[320px] w-full rounded border p-2 dark:bg-[oklch(0.10_0.012_260)]"
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
              <ChartLegend
                verticalAlign="top"
                content={<ChartLegendContent className="font-mono text-[10px]" />}
              />
              <Line
                dataKey="baseline_nn_mw"
                name="Baseline NN"
                type="monotone"
                stroke="var(--color-baseline_nn_mw)"
                strokeWidth={2}
                dot={false}
                strokeLinecap="round"
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Line
                dataKey="pcinn_mw"
                name="PCINN"
                type="monotone"
                stroke="var(--color-pcinn_mw)"
                strokeWidth={2}
                dot={false}
                strokeLinecap="round"
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={200}
              />
              <Line
                dataKey="sa_pcinn_mw"
                name="SA-PCINN"
                type="monotone"
                stroke="var(--color-sa_pcinn_mw)"
                strokeWidth={2}
                dot={false}
                strokeLinecap="round"
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={400}
              />
            </LineChart>
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
