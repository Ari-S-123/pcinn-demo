"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadZone } from "@/components/upload-zone";
import { ValidationSummary } from "@/components/validation-summary";
import { UploadControls } from "@/components/upload-controls";
import { BatchResultsTable } from "@/components/batch-results-table";
import { BatchScatterChart } from "@/components/batch-scatter-chart";
import { BatchStatsPanel } from "@/components/batch-stats-panel";
import { isAbortError, predictBatch } from "@/lib/api-client";
import { toApiUnits } from "@/lib/validation";
import { exportResultsAsCsv, exportResultsAsXlsx } from "@/lib/batch-export";
import type {
  EnrichedRow,
  ModelBatchResult,
  ModelInfo,
  ModelName,
  ParsedRow,
  RowError,
} from "@/types/prediction";

type UploadPhase = "idle" | "parsed" | "running" | "done";

interface UploadClientProps {
  models: ModelInfo[];
}

export function UploadClient({ models }: UploadClientProps) {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [validRows, setValidRows] = useState<ParsedRow[]>([]);
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [model, setModel] = useState<ModelName>("sa_pcinn");
  const [results, setResults] = useState<ModelBatchResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  function handleFileParsed(rows: ParsedRow[], errors: RowError[], valid: ParsedRow[]) {
    setParsedRows(rows);
    setRowErrors(errors);
    setValidRows(valid);
    setResults([]);
    setPhase("parsed");

    if (errors.length > 0) {
      toast.warning(`${errors.length} validation error${errors.length !== 1 ? "s" : ""} found`);
    }
  }

  async function handleRun() {
    if (validRows.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("running");
    setIsRunning(true);

    const apiInputs = validRows.map((r) =>
      toApiUnits({
        m_molar: r.m_molar,
        s_molar: r.s_molar,
        i_molar: r.i_molar,
        temperature_c: r.temperature_c,
        time_min: r.time_min,
      }),
    );

    const modelsToRun: ModelName[] =
      mode === "compare" ? ["baseline_nn", "pcinn", "sa_pcinn"] : [model];

    try {
      const responses = await Promise.all(
        modelsToRun.map((m) => predictBatch(apiInputs, m, { signal: controller.signal })),
      );

      if (controller.signal.aborted) return;

      const batchResults: ModelBatchResult[] = modelsToRun.map((m, i) => ({
        model: m,
        rows: validRows.map(
          (row, j): EnrichedRow => ({
            rowIndex: row.rowIndex,
            m_molar: row.m_molar,
            s_molar: row.s_molar,
            i_molar: row.i_molar,
            temperature_c: row.temperature_c,
            time_min: row.time_min,
            conversion: responses[i].predictions[j].conversion,
            mn: responses[i].predictions[j].mn,
            mw: responses[i].predictions[j].mw,
            mz: responses[i].predictions[j].mz,
            mz_plus_1: responses[i].predictions[j].mz_plus_1,
            mv: responses[i].predictions[j].mv,
            dispersity: responses[i].predictions[j].dispersity,
          }),
        ),
      }));

      setResults(batchResults);
      setPhase("done");
      toast.success(
        `Predicted ${validRows.length} row${validRows.length !== 1 ? "s" : ""} with ${modelsToRun.length} model${modelsToRun.length !== 1 ? "s" : ""}`,
      );
    } catch (err) {
      if (isAbortError(err)) return;
      toast.error(err instanceof Error ? err.message : "Batch prediction failed");
      setPhase("parsed");
    } finally {
      setIsRunning(false);
    }
  }

  function handleReset() {
    abortRef.current?.abort();
    abortRef.current = null;
    setParsedRows([]);
    setRowErrors([]);
    setValidRows([]);
    setResults([]);
    setPhase("idle");
  }

  const selectableModels = models.map((m) => ({ ...m, name: m.name as ModelName }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <h1
          className="font-mono text-2xl font-bold tracking-tighter text-[var(--color-chrome)]"
          style={{ textShadow: "0 0 12px oklch(0.82 0.08 85 / 15%)" }}
        >
          Batch Upload
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload a CSV or XLSX file with reaction conditions to run batch predictions
        </p>
      </div>

      <div className="space-y-6">
        {/* Upload zone — visible in idle and parsed phases */}
        {phase !== "done" && phase !== "running" ? (
          <UploadZone onFileParsed={handleFileParsed} disabled={isRunning} />
        ) : null}

        {/* Validation summary and controls — visible in parsed and running phases */}
        {phase === "parsed" || phase === "running" ? (
          <>
            <ValidationSummary
              errors={rowErrors}
              totalRows={parsedRows.length}
              validCount={validRows.length}
            />
            <UploadControls
              models={selectableModels}
              model={model}
              onModelChange={setModel}
              mode={mode}
              onModeChange={setMode}
              onRun={handleRun}
              onReset={handleReset}
              isRunning={isRunning}
              validCount={validRows.length}
            />
          </>
        ) : null}

        {/* Running skeleton */}
        {phase === "running" ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full rounded-lg" />
            <Skeleton className="h-[320px] w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : null}

        {/* Results — visible in done phase */}
        {phase === "done" && results.length > 0 ? (
          <div className="space-y-6">
            {/* Results header with export + reset */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportResultsAsCsv(results)}
                className="font-mono text-[10px] tracking-wider uppercase"
              >
                <FileDown className="mr-1.5 h-3 w-3" />
                Export CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportResultsAsXlsx(results)}
                className="font-mono text-[10px] tracking-wider uppercase"
              >
                <FileDown className="mr-1.5 h-3 w-3" />
                Export XLSX
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="font-mono text-[10px] tracking-wider uppercase"
              >
                New Upload
              </Button>
            </div>

            <BatchResultsTable results={results} />
            <BatchScatterChart results={results} />
            <BatchStatsPanel results={results} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
