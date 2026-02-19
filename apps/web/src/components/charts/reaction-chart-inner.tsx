"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InfoTooltip } from "@/components/info-tooltip";
import { outputFieldDescriptions } from "@/lib/field-descriptions";
import type { TimeSeriesResult } from "@/types/prediction";

type MwMetric = "mn" | "mw" | "mz" | "mz_plus_1" | "mv";

const mwMetrics: { key: MwMetric; tabLabel: string; axisLabel: string; tooltip: string }[] = [
  { key: "mn", tabLabel: "Mn vs Time", axisLabel: "Mn (Da)", tooltip: outputFieldDescriptions.mn },
  { key: "mw", tabLabel: "Mw vs Time", axisLabel: "Mw (Da)", tooltip: outputFieldDescriptions.mw },
  { key: "mz", tabLabel: "Mz vs Time", axisLabel: "Mz (Da)", tooltip: outputFieldDescriptions.mz },
  {
    key: "mz_plus_1",
    tabLabel: "Mz+1 vs Time",
    axisLabel: "Mz+1 (Da)",
    tooltip: outputFieldDescriptions.mz_plus_1,
  },
  { key: "mv", tabLabel: "Mv vs Time", axisLabel: "Mv (Da)", tooltip: outputFieldDescriptions.mv },
];

const conversionConfig = {
  conversion: { label: "Conversion", color: "#fb923c" },
} satisfies ChartConfig;

const mwConfigs: Record<MwMetric, ChartConfig> = {
  mn: { mn: { label: "Mn (Da)", color: "#fb923c" } },
  mw: { mw: { label: "Mw (Da)", color: "#fb923c" } },
  mz: { mz: { label: "Mz (Da)", color: "#fb923c" } },
  mz_plus_1: { mz_plus_1: { label: "Mz+1 (Da)", color: "#fb923c" } },
  mv: { mv: { label: "Mv (Da)", color: "#fb923c" } },
};

interface ReactionChartInnerProps {
  data: TimeSeriesResult | null;
}

export function ReactionChartInner({ data }: ReactionChartInnerProps) {
  if (!data) return null;

  const chartData = data.times.map((timeValue, i) => ({
    // Keep time numeric so Recharts can use a true number axis with sparse ticks.
    time: timeValue,
    conversion: +data.conversion[i].toFixed(4),
    mn: +data.mn[i].toFixed(0),
    mw: +data.mw[i].toFixed(0),
    mz: +data.mz[i].toFixed(0),
    mz_plus_1: +data.mz_plus_1[i].toFixed(0),
    mv: +data.mv[i].toFixed(0),
  }));

  return (
    <div className="panel-inset p-5">
      <h3 className="section-label mb-4 text-[var(--color-chrome-muted)]">Reaction Evolution</h3>
      <TooltipProvider>
        <Tabs defaultValue="conversion">
          <TabsList className="mb-4 gap-2 bg-transparent p-0">
            <TabsTrigger
              value="conversion"
              className="text-muted-foreground border-border data-[state=active]:bg-accent rounded border px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase data-[state=active]:border-[var(--color-chrome)]/50 data-[state=active]:text-[var(--color-chrome)] dark:data-[state=active]:bg-[oklch(0.18_0.01_260)]"
            >
              <span className="inline-flex items-center gap-1.5">
                <span>Conversion vs Time</span>
                <InfoTooltip content={outputFieldDescriptions.conversion} />
              </span>
            </TabsTrigger>
            {mwMetrics.map((metric) => (
              <TabsTrigger
                key={metric.key}
                value={metric.key}
                className="text-muted-foreground border-border data-[state=active]:bg-accent rounded border px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase data-[state=active]:border-[var(--color-chrome)]/50 data-[state=active]:text-[var(--color-chrome)] dark:data-[state=active]:bg-[oklch(0.18_0.01_260)]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>{metric.tabLabel}</span>
                  <InfoTooltip content={metric.tooltip} />
                </span>
              </TabsTrigger>
            ))}
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
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickCount={6}
                  allowDecimals={false}
                  tickLine={{ stroke: "var(--border)" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickMargin={8}
                  tickFormatter={(v: number) => Number(v).toFixed(0)}
                  tick={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    fill: "var(--muted-foreground)",
                  }}
                  label={{
                    value: "Time (s)",
                    position: "insideBottom",
                    offset: -4,
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    fill: "var(--muted-foreground)",
                  }}
                />
                <YAxis
                  domain={[0, 1]}
                  allowDataOverflow={true}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
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
                  content={
                    <ChartTooltipContent labelFormatter={(v) => `t = ${Number(v).toFixed(0)} s`} />
                  }
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

          {mwMetrics.map((metric) => (
            <TabsContent key={metric.key} value={metric.key}>
              <ChartContainer
                config={mwConfigs[metric.key]}
                className="border-border bg-muted h-[300px] w-full rounded border p-2 dark:bg-[oklch(0.10_0.012_260)]"
              >
                <LineChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid vertical={true} strokeDasharray="2 6" stroke="var(--border)" />
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickCount={6}
                    allowDecimals={false}
                    tickLine={{ stroke: "var(--border)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickMargin={8}
                    tickFormatter={(v: number) => Number(v).toFixed(0)}
                    tick={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      fill: "var(--muted-foreground)",
                    }}
                    label={{
                      value: "Time (s)",
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
                        labelFormatter={(v) => `t = ${Number(v).toFixed(0)} s`}
                        formatter={(v) => `${Number(v).toLocaleString()} Da`}
                      />
                    }
                  />
                  <Line
                    dataKey={metric.key}
                    name={metric.axisLabel}
                    type="monotone"
                    stroke={`var(--color-${metric.key})`}
                    strokeWidth={1.5}
                    dot={false}
                    strokeLinecap="round"
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ChartContainer>
            </TabsContent>
          ))}
        </Tabs>
      </TooltipProvider>
    </div>
  );
}
