"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PredictionForm } from "@/components/prediction-form";
import { ComparisonChart } from "@/components/comparison-chart";
import { Badge } from "@/components/ui/badge";
import { isAbortError, predictCompare } from "@/lib/api-client";
import type { CompareResult, TimeSeriesInput } from "@/types/prediction";

const MODEL_BADGES = [
  {
    key: "baseline_nn" as const,
    label: "Baseline NN",
    className:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  },
  {
    key: "pcinn" as const,
    label: "PCINN",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  },
  {
    key: "sa_pcinn" as const,
    label: "SA-PCINN",
    className:
      "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30",
  },
];

interface InFlightRequest {
  key: string;
  controller: AbortController;
}

function formatMW(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function CompareClient() {
  const [compareData, setCompareData] = useState<CompareResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inFlightRef = useRef<InFlightRequest | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      inFlightRef.current?.controller.abort();
    };
  }, []);

  async function handleCompare(input: TimeSeriesInput) {
    const key = JSON.stringify({ endpoint: "compare", input });

    // Skip exact duplicate submissions while the same request is still pending.
    if (inFlightRef.current?.key === key) {
      return;
    }

    inFlightRef.current?.controller.abort();

    const controller = new AbortController();
    inFlightRef.current = { key, controller };
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setCompareData(null);

    try {
      const result = await predictCompare(input, { signal: controller.signal });

      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setCompareData(result);
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      toast.error(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
      if (inFlightRef.current?.controller === controller) {
        inFlightRef.current = null;
      }
    }
  }

  const summaryRows = compareData
    ? MODEL_BADGES.map((modelBadge) => {
        const ts = compareData[modelBadge.key];
        const last = ts.conversion.length - 1;

        return {
          ...modelBadge,
          conversion: ts.conversion[last],
          mn: ts.mn[last],
          mw: ts.mw[last],
          dispersity: ts.dispersity[last],
        };
      })
    : null;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <h1
          className="font-mono text-2xl font-bold tracking-tighter text-[var(--color-chrome)]"
          style={{ textShadow: "0 0 12px oklch(0.82 0.08 85 / 15%)" }}
        >
          Compare Models
        </h1>
        <p className="text-muted-foreground text-sm">
          Side-by-side comparison of Baseline NN, PCINN, and SA-PCINN predictions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div>
          <PredictionForm onCompare={handleCompare} isLoading={isLoading} />
        </div>

        <div className="space-y-6">
          {isLoading || compareData ? <ComparisonChart data={compareData} /> : null}

          {summaryRows ? (
            <div className="animate-fade-in-up panel-inset p-5" style={{ animationDelay: "200ms" }}>
              <h3 className="section-label mb-4 text-[var(--color-chrome-muted)]">
                Final Predictions (at end time)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-border border-b text-[9px] tracking-[0.12em] text-[var(--color-chrome-muted)] uppercase">
                      <th className="pr-4 pb-2">Model</th>
                      <th className="pr-4 pb-2 text-right" title="Fraction of monomer converted">
                        Conversion
                      </th>
                      <th className="pr-4 pb-2 text-right" title="Number-average molecular weight">
                        <span>
                          M<sub>n</sub> (Da)
                        </span>
                      </th>
                      <th className="pr-4 pb-2 text-right" title="Weight-average molecular weight">
                        <span>
                          M<sub>w</sub> (Da)
                        </span>
                      </th>
                      <th className="pb-2 text-right" title="Distribution breadth (Mw/Mn)">
                        Dispersity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row, i) => (
                      <tr
                        key={row.key}
                        className="animate-readout border-border border-b last:border-0"
                        style={{ animationDelay: `${300 + i * 100}ms` }}
                      >
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className={row.className}>
                            {row.label}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {(row.conversion * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">{formatMW(row.mn)}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{formatMW(row.mw)}</td>
                        <td className="py-2 text-right tabular-nums">
                          {row.dispersity.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
