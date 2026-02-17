"use client";

import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InfoTooltip } from "@/components/info-tooltip";
import { outputFieldDescriptions } from "@/lib/field-descriptions";
import type { EnrichedRow, ModelBatchResult, ModelName } from "@/types/prediction";

const MODEL_BADGES: Record<ModelName, { label: string; className: string }> = {
  baseline_nn: {
    label: "Baseline NN",
    className:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  },
  pcinn: {
    label: "PCINN",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  },
  sa_pcinn: {
    label: "SA-PCINN",
    className:
      "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30",
  },
};

interface Stats {
  min: number;
  max: number;
  mean: number;
}

type StatField = "conversion" | "mn" | "mw" | "mz" | "mz_plus_1" | "mv" | "dispersity";

const STAT_FIELDS: {
  key: StatField;
  label: string;
  tooltip: string;
  format: (v: number) => string;
}[] = [
  {
    key: "conversion",
    label: "Conversion",
    tooltip: outputFieldDescriptions.conversion,
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  {
    key: "mn",
    label: "Mn (Da)",
    tooltip: outputFieldDescriptions.mn,
    format: (v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 }),
  },
  {
    key: "mw",
    label: "Mw (Da)",
    tooltip: outputFieldDescriptions.mw,
    format: (v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 }),
  },
  {
    key: "mz",
    label: "Mz (Da)",
    tooltip: outputFieldDescriptions.mz,
    format: (v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 }),
  },
  {
    key: "mz_plus_1",
    label: "Mz+1 (Da)",
    tooltip: outputFieldDescriptions.mz_plus_1,
    format: (v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 }),
  },
  {
    key: "mv",
    label: "Mv (Da)",
    tooltip: outputFieldDescriptions.mv,
    format: (v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 }),
  },
  {
    key: "dispersity",
    label: "Dispersity",
    tooltip: outputFieldDescriptions.dispersity,
    format: (v) => v.toFixed(3),
  },
];

function computeStats(rows: EnrichedRow[]): Record<StatField, Stats> {
  const result = {} as Record<StatField, Stats>;
  for (const { key } of STAT_FIELDS) {
    const vals = rows.map((r) => r[key]);
    result[key] = {
      min: Math.min(...vals),
      max: Math.max(...vals),
      mean: vals.reduce((a, b) => a + b, 0) / vals.length,
    };
  }
  return result;
}

interface BatchStatsPanelProps {
  results: ModelBatchResult[];
}

export function BatchStatsPanel({ results }: BatchStatsPanelProps) {
  const isCompare = results.length > 1;

  if (isCompare) {
    const allStats = results.map((r) => ({
      model: r.model,
      stats: computeStats(r.rows),
    }));

    return (
      <div className="animate-fade-in-up panel-inset p-5" style={{ animationDelay: "200ms" }}>
        <h3 className="section-label mb-4 text-[var(--color-chrome-muted)]">Summary Statistics</h3>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-border border-b text-[9px] tracking-[0.12em] text-[var(--color-chrome-muted)] uppercase">
                  <th className="pr-4 pb-2">Metric</th>
                  <th className="pr-4 pb-2">Stat</th>
                  {allStats.map((s) => (
                    <th key={s.model} className="pr-4 pb-2 text-right">
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${MODEL_BADGES[s.model].className}`}
                      >
                        {MODEL_BADGES[s.model].label}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STAT_FIELDS.map((field) =>
                  (["min", "max", "mean"] as const).map((stat, si) => (
                    <tr
                      key={`${field.key}-${stat}`}
                      className={`animate-readout border-border ${si === 2 ? "border-b" : ""}`}
                      style={{ animationDelay: `${300 + si * 50}ms` }}
                    >
                      {si === 0 ? (
                        <td className="py-1 pr-4 font-medium" rowSpan={3}>
                          <span className="inline-flex items-center gap-1.5">
                            <span>{field.label}</span>
                            <InfoTooltip content={field.tooltip} />
                          </span>
                        </td>
                      ) : null}
                      <td className="text-muted-foreground py-1 pr-4 text-[10px] uppercase">
                        {stat}
                      </td>
                      {allStats.map((s) => (
                        <td key={s.model} className="py-1 pr-4 text-right tabular-nums">
                          {field.format(s.stats[field.key][stat])}
                        </td>
                      ))}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
      </div>
    );
  }

  // Single-model: grid of stat cards
  const stats = computeStats(results[0].rows);

  return (
    <div className="animate-fade-in-up panel-inset p-5" style={{ animationDelay: "200ms" }}>
      <h3 className="section-label mb-4 text-[var(--color-chrome-muted)]">Summary Statistics</h3>
      <TooltipProvider>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {STAT_FIELDS.map((field, i) => (
            <div
              key={field.key}
              className="animate-readout panel-inset p-3"
              style={{ animationDelay: `${300 + i * 80}ms` }}
            >
              <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--color-chrome-muted)] uppercase">
                <span className="inline-flex items-center gap-1.5">
                  <span>{field.label}</span>
                  <InfoTooltip content={field.tooltip} />
                </span>
              </p>
              <div className="mt-2 space-y-1">
                {(["min", "max", "mean"] as const).map((stat) => (
                  <div key={stat} className="flex items-baseline justify-between">
                    <span className="text-muted-foreground text-[10px] uppercase">{stat}</span>
                    <span className="font-mono text-sm tabular-nums">
                      {field.format(stats[field.key][stat])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
