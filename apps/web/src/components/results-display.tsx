"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PredictionResult, ModelName } from "@/types/prediction";

const MODEL_BADGES: Record<ModelName, { label: string; className: string }> = {
  baseline_nn: {
    label: "Baseline NN",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  pcinn: {
    label: "PCINN",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  sa_pcinn: {
    label: "SA-PCINN",
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
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
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );
}

function ResultCard({
  label,
  value,
  unit,
  delay,
}: {
  label: string;
  value: string;
  unit?: string;
  delay: number;
}) {
  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="p-3">
        <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
          {label}
        </p>
        <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
          {value}
          {unit ? (
            <span className="text-muted-foreground ml-1 text-xs font-normal">{unit}</span>
          ) : null}
        </p>
      </CardContent>
    </Card>
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
          value={`${(result.conversion * 100).toFixed(1)}%`}
          delay={0}
        />
        <ResultCard label="Mn" value={formatMW(result.mn)} unit="Da" delay={50} />
        <ResultCard label="Mw" value={formatMW(result.mw)} unit="Da" delay={100} />
        <ResultCard label="Mz" value={formatMW(result.mz)} unit="Da" delay={150} />
        <ResultCard label="Mz+1" value={formatMW(result.mz_plus_1)} unit="Da" delay={200} />
        <ResultCard label="Mv" value={formatMW(result.mv)} unit="Da" delay={250} />
        <ResultCard label="Dispersity" value={result.dispersity.toFixed(3)} delay={300} />
      </div>
    </div>
  ) : null;
}
