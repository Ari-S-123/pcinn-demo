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
import { TooltipProvider } from "@/components/ui/tooltip";
import { InfoTooltip } from "@/components/info-tooltip";
import { outputFieldDescriptions } from "@/lib/field-descriptions";
import type { CompareResult } from "@/types/prediction";

type ModelKey = "baseline_nn" | "pcinn" | "sa_pcinn";
type MwMetric = "mn" | "mw" | "mz" | "mz_plus_1" | "mv";

const models: { key: ModelKey; label: string; color: string }[] = [
  { key: "baseline_nn", label: "Baseline NN", color: "#34d399" },
  { key: "pcinn", label: "PCINN", color: "#60a5fa" },
  { key: "sa_pcinn", label: "SA-PCINN", color: "#fb923c" },
];

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
  baseline_nn: { label: "Baseline NN", color: "#34d399" },
  pcinn: { label: "PCINN", color: "#60a5fa" },
  sa_pcinn: { label: "SA-PCINN", color: "#fb923c" },
} satisfies ChartConfig;

const metricConfigs: Record<MwMetric, ChartConfig> = {
  mn: {
    baseline_nn_mn: { label: "Baseline NN", color: "#34d399" },
    pcinn_mn: { label: "PCINN", color: "#60a5fa" },
    sa_pcinn_mn: { label: "SA-PCINN", color: "#fb923c" },
  },
  mw: {
    baseline_nn_mw: { label: "Baseline NN", color: "#34d399" },
    pcinn_mw: { label: "PCINN", color: "#60a5fa" },
    sa_pcinn_mw: { label: "SA-PCINN", color: "#fb923c" },
  },
  mz: {
    baseline_nn_mz: { label: "Baseline NN", color: "#34d399" },
    pcinn_mz: { label: "PCINN", color: "#60a5fa" },
    sa_pcinn_mz: { label: "SA-PCINN", color: "#fb923c" },
  },
  mz_plus_1: {
    baseline_nn_mz_plus_1: { label: "Baseline NN", color: "#34d399" },
    pcinn_mz_plus_1: { label: "PCINN", color: "#60a5fa" },
    sa_pcinn_mz_plus_1: { label: "SA-PCINN", color: "#fb923c" },
  },
  mv: {
    baseline_nn_mv: { label: "Baseline NN", color: "#34d399" },
    pcinn_mv: { label: "PCINN", color: "#60a5fa" },
    sa_pcinn_mv: { label: "SA-PCINN", color: "#fb923c" },
  },
};

interface ComparisonChartInnerProps {
  data: CompareResult | null;
}

export function ComparisonChartInner({ data }: ComparisonChartInnerProps) {
  if (!data) return null;

  const chartData = data.times.map((timeValue, i) => ({
    // Keep time numeric so Recharts can use a true number axis with sparse ticks.
    time: timeValue,
    baseline_nn: +data.baseline_nn.conversion[i].toFixed(4),
    pcinn: +data.pcinn.conversion[i].toFixed(4),
    sa_pcinn: +data.sa_pcinn.conversion[i].toFixed(4),
    baseline_nn_mn: +data.baseline_nn.mn[i].toFixed(0),
    pcinn_mn: +data.pcinn.mn[i].toFixed(0),
    sa_pcinn_mn: +data.sa_pcinn.mn[i].toFixed(0),
    baseline_nn_mw: +data.baseline_nn.mw[i].toFixed(0),
    pcinn_mw: +data.pcinn.mw[i].toFixed(0),
    sa_pcinn_mw: +data.sa_pcinn.mw[i].toFixed(0),
    baseline_nn_mz: +data.baseline_nn.mz[i].toFixed(0),
    pcinn_mz: +data.pcinn.mz[i].toFixed(0),
    sa_pcinn_mz: +data.sa_pcinn.mz[i].toFixed(0),
    baseline_nn_mz_plus_1: +data.baseline_nn.mz_plus_1[i].toFixed(0),
    pcinn_mz_plus_1: +data.pcinn.mz_plus_1[i].toFixed(0),
    sa_pcinn_mz_plus_1: +data.sa_pcinn.mz_plus_1[i].toFixed(0),
    baseline_nn_mv: +data.baseline_nn.mv[i].toFixed(0),
    pcinn_mv: +data.pcinn.mv[i].toFixed(0),
    sa_pcinn_mv: +data.sa_pcinn.mv[i].toFixed(0),
  }));

  return (
    <div className="panel-inset p-5">
      <h3 className="section-label mb-4 text-[var(--color-chrome-muted)]">Model Comparison</h3>
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
              className="border-border bg-muted h-[320px] w-full rounded border p-2 dark:bg-[oklch(0.10_0.012_260)]"
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
                    <ChartTooltipContent
                      labelFormatter={(v) => `t = ${Number(v).toFixed(0)} s`}
                    />
                  }
                />
                <ChartLegend
                  verticalAlign="top"
                  content={<ChartLegendContent className="font-mono text-[10px]" />}
                />
                {models.map((model, idx) => (
                  <Line
                    key={model.key}
                    dataKey={model.key}
                    name={model.label}
                    type="monotone"
                    stroke={`var(--color-${model.key})`}
                    strokeWidth={2}
                    dot={false}
                    strokeLinecap="round"
                    animationDuration={1200}
                    animationEasing="ease-out"
                    animationBegin={idx * 200}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </TabsContent>

          {mwMetrics.map((metric) => (
            <TabsContent key={metric.key} value={metric.key}>
              <ChartContainer
                config={metricConfigs[metric.key]}
                className="border-border bg-muted h-[320px] w-full rounded border p-2 dark:bg-[oklch(0.10_0.012_260)]"
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
                  <ChartLegend
                    verticalAlign="top"
                    content={<ChartLegendContent className="font-mono text-[10px]" />}
                  />
                  {models.map((model, idx) => (
                    <Line
                      key={`${model.key}_${metric.key}`}
                      dataKey={`${model.key}_${metric.key}`}
                      name={model.label}
                      type="monotone"
                      stroke={`var(--color-${model.key}_${metric.key})`}
                      strokeWidth={2}
                      dot={false}
                      strokeLinecap="round"
                      animationDuration={1200}
                      animationEasing="ease-out"
                      animationBegin={idx * 200}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            </TabsContent>
          ))}
        </Tabs>
      </TooltipProvider>
    </div>
  );
}
