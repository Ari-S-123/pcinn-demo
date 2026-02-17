"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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

const COLUMNS = [
  { key: "rowIndex", label: "Row", width: "w-12" },
  { key: "m_molar", label: "[M]", width: "w-16" },
  { key: "s_molar", label: "[S]", width: "w-16" },
  { key: "i_molar", label: "[I]", width: "w-16" },
  { key: "temperature_c", label: "Temp (°C)", width: "w-20" },
  { key: "time_min", label: "Time (min)", width: "w-20" },
  { key: "conversion", label: "Conv.", width: "w-16" },
  { key: "mn", label: "Mn (Da)", width: "w-20" },
  { key: "mw", label: "Mw (Da)", width: "w-20" },
  { key: "mz", label: "Mz (Da)", width: "w-20" },
  { key: "mz_plus_1", label: "Mz+1 (Da)", width: "w-20" },
  { key: "mv", label: "Mv (Da)", width: "w-20" },
  { key: "dispersity", label: "Dispersity", width: "w-20" },
] as const;

function formatCell(key: string, value: number): string {
  switch (key) {
    case "rowIndex":
      return String(value);
    case "conversion":
      return `${(value * 100).toFixed(1)}%`;
    case "mn":
    case "mw":
    case "mz":
    case "mz_plus_1":
    case "mv":
      return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
    case "dispersity":
      return value.toFixed(3);
    case "i_molar":
      return value.toFixed(4);
    default:
      return value.toFixed(2);
  }
}

function BatchTable({ rows }: { rows: EnrichedRow[] }) {
  return (
    <div className="h-[400px] overflow-auto">
      <table className="w-full font-mono text-xs">
        <thead className="sticky top-0 z-10 bg-[oklch(0.97_0.002_250)] dark:bg-[oklch(0.13_0.01_260)]">
          <tr className="border-border border-b text-[9px] tracking-[0.12em] text-[var(--color-chrome-muted)] uppercase">
            {COLUMNS.map((col) => (
              <th key={col.key} className={`${col.width} px-2 py-2 text-right first:text-left`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.rowIndex}-${idx}`} className="border-border border-b last:border-0">
              {COLUMNS.map((col) => (
                <td
                  key={col.key}
                  className={`${col.width} px-2 py-1 text-right tabular-nums first:text-left`}
                >
                  {formatCell(col.key, row[col.key as keyof EnrichedRow] as number)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface BatchResultsTableProps {
  results: ModelBatchResult[];
}

export function BatchResultsTable({ results }: BatchResultsTableProps) {
  const isCompare = results.length > 1;

  return (
    <div className="animate-fade-in-up panel-inset p-5">
      <h3 className="section-label mb-4 text-[var(--color-chrome-muted)]">
        Results ({results[0].rows.length} row{results[0].rows.length !== 1 ? "s" : ""})
      </h3>

      {isCompare ? (
        <Tabs defaultValue={results[0].model}>
          <TabsList className="mb-4 gap-2 bg-transparent p-0">
            {results.map((r) => (
              <TabsTrigger
                key={r.model}
                value={r.model}
                className="text-muted-foreground border-border data-[state=active]:bg-accent rounded border px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase data-[state=active]:border-[var(--color-chrome)]/50 data-[state=active]:text-[var(--color-chrome)] dark:data-[state=active]:bg-[oklch(0.18_0.01_260)]"
              >
                <Badge
                  variant="outline"
                  className={`text-[10px] ${MODEL_BADGES[r.model].className}`}
                >
                  {MODEL_BADGES[r.model].label}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {results.map((r) => (
            <TabsContent key={r.model} value={r.model}>
              <BatchTable rows={r.rows} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <BatchTable rows={results[0].rows} />
      )}
    </div>
  );
}
