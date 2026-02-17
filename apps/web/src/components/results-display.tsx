"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PredictionResult, ModelName } from "@/types/prediction";

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

function formatMW(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

interface ResultsDisplayProps {
  result: PredictionResult | null;
  model: ModelName;
  isLoading: boolean;
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

function ResultCard({
  label,
  description,
  value,
  unit,
  delay,
}: {
  label: string;
  description: string;
  value: string;
  unit?: string;
  delay: number;
}) {
  return (
    <div className="animate-readout panel-inset p-3" style={{ animationDelay: `${delay}ms` }}>
      <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--color-chrome-muted)] uppercase">
        {label}
      </p>
      <p className="text-muted-foreground text-[9px] leading-tight">{description}</p>
      <p className="mt-1.5 font-mono text-xl font-light tabular-nums">
        {value}
        {unit ? (
          <span className="ml-1 text-[10px] font-normal text-[var(--color-chrome-muted)]">
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function ResultsDisplay({ result, model, isLoading }: ResultsDisplayProps) {
  return isLoading ? (
    <ResultsSkeleton />
  ) : result ? (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={MODEL_BADGES[model].className}>
          {MODEL_BADGES[model].label}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ResultCard
          label="Conversion"
          description="Fraction of monomer reacted"
          value={`${(result.conversion * 100).toFixed(1)}%`}
          delay={0}
        />
        <ResultCard
          label="Mn"
          description="Number-avg mol. weight"
          value={formatMW(result.mn)}
          unit="Da"
          delay={50}
        />
        <ResultCard
          label="Mw"
          description="Weight-avg mol. weight"
          value={formatMW(result.mw)}
          unit="Da"
          delay={100}
        />
        <ResultCard
          label="Mz"
          description="Z-average mol. weight"
          value={formatMW(result.mz)}
          unit="Da"
          delay={150}
        />
        <ResultCard
          label="Mz+1"
          description="Z+1 average mol. weight"
          value={formatMW(result.mz_plus_1)}
          unit="Da"
          delay={200}
        />
        <ResultCard
          label="Mv"
          description="Viscosity-avg mol. weight"
          value={formatMW(result.mv)}
          unit="Da"
          delay={250}
        />
        <ResultCard
          label="Dispersity"
          description="Distribution breadth (Mw/Mn)"
          value={result.dispersity.toFixed(3)}
          delay={300}
        />
      </div>
    </div>
  ) : null;
}
