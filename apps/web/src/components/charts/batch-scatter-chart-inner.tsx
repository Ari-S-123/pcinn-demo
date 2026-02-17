"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InfoTooltip } from "@/components/info-tooltip";
import { inputFieldDescriptions, outputFieldDescriptions } from "@/lib/field-descriptions";
import type { EnrichedRow, ModelBatchResult, ModelName } from "@/types/prediction";

const MODEL_COLORS: Record<ModelName, string> = {
  baseline_nn: "#34d399",
  pcinn: "#60a5fa",
  sa_pcinn: "#fb923c",
};

const MODEL_LABELS: Record<ModelName, string> = {
  baseline_nn: "Baseline NN",
  pcinn: "PCINN",
  sa_pcinn: "SA-PCINN",
};

function buildChartConfig(results: ModelBatchResult[]): ChartConfig {
  const config: ChartConfig = {};
  for (const r of results) {
    config[r.model] = { label: MODEL_LABELS[r.model], color: MODEL_COLORS[r.model] };
  }
  return config;
}

const TAB_TRIGGER_CLASS =
  "text-muted-foreground border-border data-[state=active]:bg-accent rounded border px-2 py-1.5 font-mono text-[10px] tracking-wider uppercase data-[state=active]:border-[var(--color-chrome)]/50 data-[state=active]:text-[var(--color-chrome)] dark:data-[state=active]:bg-[oklch(0.18_0.01_260)]";

const CHART_CONTAINER_CLASS =
  "border-border bg-muted h-[320px] w-full rounded border p-2 dark:bg-[oklch(0.10_0.012_260)]";

const AXIS_TICK = {
  fontSize: 10,
  fontFamily: "var(--font-mono)",
  fill: "var(--muted-foreground)",
};

interface BatchScatterChartInnerProps {
  results: ModelBatchResult[];
}

type ScatterAxisKey = keyof EnrichedRow;
type MwMetric = "mn" | "mw" | "mz" | "mz_plus_1" | "mv";

const formatMwAxisTick = (v: number) => `${(v / 1000).toFixed(0)}k`;
const formatMwTooltipValue = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 0 });

const MW_METRICS: { key: MwMetric; tabLabel: string; yLabel: string; tooltip: string }[] = [
  {
    key: "mn",
    tabLabel: "Mn vs Conv.",
    yLabel: "Mn (Da)",
    tooltip: outputFieldDescriptions.mn,
  },
  {
    key: "mw",
    tabLabel: "Mw vs Conv.",
    yLabel: "Mw (Da)",
    tooltip: outputFieldDescriptions.mw,
  },
  {
    key: "mz",
    tabLabel: "Mz vs Conv.",
    yLabel: "Mz (Da)",
    tooltip: outputFieldDescriptions.mz,
  },
  {
    key: "mz_plus_1",
    tabLabel: "Mz+1 vs Conv.",
    yLabel: "Mz+1 (Da)",
    tooltip: outputFieldDescriptions.mz_plus_1,
  },
  {
    key: "mv",
    tabLabel: "Mv vs Conv.",
    yLabel: "Mv (Da)",
    tooltip: outputFieldDescriptions.mv,
  },
];

function ScatterTab({
  results,
  config,
  xKey,
  yKey,
  xLabel,
  yLabel,
  yDomain,
  yTickFormatter,
  yValueFormatter,
}: {
  results: ModelBatchResult[];
  config: ChartConfig;
  xKey: ScatterAxisKey;
  yKey: ScatterAxisKey;
  xLabel: string;
  yLabel: string;
  yDomain?: [number, number];
  yTickFormatter?: (v: number) => string;
  yValueFormatter?: (v: number) => string;
}) {
  const scatterData = results.map((r) => ({
    model: r.model,
    data: r.rows.map((row) => ({
      x: row[xKey],
      y: row[yKey],
    })),
  }));

  return (
    <ChartContainer config={config} className={CHART_CONTAINER_CLASS}>
      <ScatterChart margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="var(--border)" />
        <XAxis
          dataKey="x"
          type="number"
          name={xLabel}
          tickLine={{ stroke: "var(--border)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickMargin={8}
          tick={AXIS_TICK}
          label={{
            value: xLabel,
            position: "insideBottom",
            offset: -4,
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            fill: "var(--muted-foreground)",
          }}
        />
        <YAxis
          dataKey="y"
          type="number"
          name={yLabel}
          domain={yDomain}
          tickLine={{ stroke: "var(--border)" }}
          axisLine={{ stroke: "var(--border)" }}
          tick={AXIS_TICK}
          width={50}
          tickFormatter={yTickFormatter}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
          contentStyle={{
            backgroundColor: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
          }}
          labelStyle={{ color: "var(--popover-foreground)" }}
          itemStyle={{ color: "var(--popover-foreground)" }}
          formatter={(value: number, name: string) => {
            const label = yValueFormatter
              ? yValueFormatter(value)
              : yTickFormatter
                ? yTickFormatter(value)
                : value.toFixed(4);
            return [label, name];
          }}
          labelFormatter={(label: number) => `${xLabel}: ${label}`}
        />
        {results.length > 1 ? (
          <Legend
            verticalAlign="top"
            wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}
          />
        ) : null}
        {scatterData.map((series, i) => (
          <Scatter
            key={series.model}
            name={MODEL_LABELS[series.model]}
            data={series.data}
            fill={MODEL_COLORS[series.model]}
            fillOpacity={0.7}
            r={3}
            animationDuration={800}
            animationBegin={i * 200}
          />
        ))}
      </ScatterChart>
    </ChartContainer>
  );
}

export function BatchScatterChartInner({ results }: BatchScatterChartInnerProps) {
  if (results.length === 0) return null;

  const config = buildChartConfig(results);

  return (
    <div className="panel-inset p-5">
      <h3 className="section-label mb-4 text-[var(--color-chrome-muted)]">Scatter Plots</h3>
      <TooltipProvider>
        <Tabs defaultValue="conv-time">
          <TabsList className="scrollbar-none mb-4 w-full gap-1.5 overflow-x-auto bg-transparent p-0">
            <TabsTrigger value="conv-time" className={TAB_TRIGGER_CLASS}>
              <span className="inline-flex items-center gap-1.5">
                <span>Conversion vs Time</span>
                <InfoTooltip
                  content={`${outputFieldDescriptions.conversion} X-axis: ${inputFieldDescriptions.time_min}`}
                />
              </span>
            </TabsTrigger>
            <TabsTrigger value="disp-conv" className={TAB_TRIGGER_CLASS}>
              <span className="inline-flex items-center gap-1.5">
                <span>Disp. vs Conv.</span>
                <InfoTooltip
                  content={`${outputFieldDescriptions.dispersity} X-axis: ${outputFieldDescriptions.conversion}`}
                />
              </span>
            </TabsTrigger>
            {MW_METRICS.map((metric) => (
              <TabsTrigger
                key={metric.key}
                value={`${metric.key}-conv`}
                className={TAB_TRIGGER_CLASS}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>{metric.tabLabel}</span>
                  <InfoTooltip
                    content={`${metric.tooltip} X-axis: ${outputFieldDescriptions.conversion}`}
                  />
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="conv-time">
            <ScatterTab
              results={results}
              config={config}
              xKey="time_min"
              yKey="conversion"
              xLabel="Time (min)"
              yLabel="Conversion"
              yDomain={[0, 1]}
            />
          </TabsContent>

          <TabsContent value="disp-conv">
            <ScatterTab
              results={results}
              config={config}
              xKey="conversion"
              yKey="dispersity"
              xLabel="Conversion"
              yLabel="Dispersity"
              yTickFormatter={(v: number) => v.toFixed(3)}
              yValueFormatter={(v: number) => v.toFixed(3)}
            />
          </TabsContent>

          {MW_METRICS.map((metric) => (
            <TabsContent key={metric.key} value={`${metric.key}-conv`}>
              <ScatterTab
                results={results}
                config={config}
                xKey="conversion"
                yKey={metric.key}
                xLabel="Conversion"
                yLabel={metric.yLabel}
                yTickFormatter={formatMwAxisTick}
                yValueFormatter={formatMwTooltipValue}
              />
            </TabsContent>
          ))}
        </Tabs>
      </TooltipProvider>
    </div>
  );
}
