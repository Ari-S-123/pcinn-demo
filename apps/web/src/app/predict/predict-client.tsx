"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ModelSelector } from "@/components/model-selector";
import { PredictionForm } from "@/components/prediction-form";
import { ResultsDisplay } from "@/components/results-display";
import { ReactionChart } from "@/components/reaction-chart";
import { isAbortError, predict, predictTimeseries } from "@/lib/api-client";
import type {
  ModelName,
  PredictionInput,
  PredictionResult,
  TimeSeriesInput,
  TimeSeriesResult,
} from "@/types/prediction";

interface InFlightRequest {
  key: string;
  controller: AbortController;
}

export function PredictClient() {
  const [model, setModel] = useState<ModelName>("sa_pcinn");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [timeseries, setTimeseries] = useState<TimeSeriesResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inFlightRef = useRef<InFlightRequest | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      inFlightRef.current?.controller.abort();
    };
  }, []);

  // Clear stale results when the selected model changes.
  useEffect(() => {
    setResult(null);
    setTimeseries(null);
  }, [model]);

  const handlePredict = useCallback(
    async (input: PredictionInput) => {
      const tsInput: TimeSeriesInput = {
        m_molar: input.m_molar,
        s_molar: input.s_molar,
        i_molar: input.i_molar,
        temperature_k: input.temperature_k,
        time_start_s: 60,
        time_end_s: input.time_s,
        time_steps: 100,
      };
      const key = JSON.stringify({ endpoint: "predict", model, input });

      // Skip exact duplicate submissions while the same request is still pending.
      if (inFlightRef.current?.key === key) {
        return;
      }

      inFlightRef.current?.controller.abort();

      const controller = new AbortController();
      inFlightRef.current = { key, controller };
      const requestId = ++requestIdRef.current;

      setIsLoading(true);
      setResult(null);
      setTimeseries(null);

      try {
        // [async-parallel] Fetch point prediction and timeseries simultaneously.
        const [pointResult, tsResult] = await Promise.all([
          predict(input, model, { signal: controller.signal }),
          predictTimeseries(tsInput, model, { signal: controller.signal }),
        ]);

        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        setResult(pointResult);
        setTimeseries(tsResult);
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }
        toast.error(err instanceof Error ? err.message : "Prediction failed");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
        if (inFlightRef.current?.controller === controller) {
          inFlightRef.current = null;
        }
      }
    },
    [model],
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <h1
          className="font-mono text-2xl font-bold tracking-tighter text-[var(--color-chrome)]"
          style={{ textShadow: "0 0 12px oklch(0.82 0.08 85 / 15%)" }}
        >
          Predict
        </h1>
        <p className="text-muted-foreground text-sm">
          Single-model prediction of polymer properties from reaction conditions
        </p>
      </div>

      <div className="mb-6 max-w-xs">
        <ModelSelector value={model} onChange={setModel} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div>
          <PredictionForm onPredict={handlePredict} isLoading={isLoading} />
        </div>

        <div className="space-y-6">
          <ResultsDisplay result={result} model={model} isLoading={isLoading} />
          {isLoading || timeseries ? <ReactionChart data={timeseries} /> : null}
        </div>
      </div>
    </div>
  );
}
