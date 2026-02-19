"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InfoTooltip } from "@/components/info-tooltip";
import {
  predictionSchema,
  defaultFormValues,
  toApiUnits,
  type PredictionFormValues,
} from "@/lib/validation";
import { inputFieldDescriptions } from "@/lib/field-descriptions";
import type { PredictionInput, TimeSeriesInput } from "@/types/prediction";

const FIELDS = [
  {
    name: "m_molar" as const,
    label: "[M] Monomer",
    unit: "mol/L",
    min: 0.5,
    max: 5.0,
    step: 0.01,
  },
  {
    name: "s_molar" as const,
    label: "[S] Solvent",
    unit: "mol/L",
    min: 5.0,
    max: 9.5,
    step: 0.01,
  },
  {
    name: "i_molar" as const,
    label: "[I] Initiator",
    unit: "mol/L",
    min: 0.005,
    max: 0.1,
    step: 0.001,
  },
  {
    name: "temperature_k" as const,
    label: "Temperature",
    unit: "K",
    min: 323,
    max: 363,
    step: 1,
  },
  {
    name: "time_s" as const,
    label: "Time",
    unit: "s",
    min: 1.2,
    max: 35854,
    step: 1,
  },
];

interface PredictionFormProps {
  onPredict?: (input: PredictionInput) => void;
  onCompare?: (input: TimeSeriesInput) => void;
  isLoading: boolean;
}

export function PredictionForm({ onPredict, onCompare, isLoading }: PredictionFormProps) {
  const { control, handleSubmit } = useForm<PredictionFormValues>({
    resolver: zodResolver(predictionSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmitPredict = (values: PredictionFormValues) => {
    onPredict?.(toApiUnits(values));
  };

  const onSubmitCompare = (values: PredictionFormValues) => {
    const api = toApiUnits(values);
    onCompare?.({
      m_molar: api.m_molar,
      s_molar: api.s_molar,
      i_molar: api.i_molar,
      temperature_k: api.temperature_k,
      time_start_s: 60,
      time_end_s: api.time_s,
      time_steps: 100,
    });
  };

  return (
    <div className="panel-inset p-5">
      <h2 className="section-label mb-5 text-[var(--color-chrome-muted)]">Reaction Conditions</h2>
      <TooltipProvider>
        <form className="space-y-5">
          {FIELDS.map((field) => (
            <Controller
              key={field.name}
              name={field.name}
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label className="font-mono text-[11px] tracking-wide">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{field.label}</span>
                        <InfoTooltip content={inputFieldDescriptions[field.name]} />
                        <span className="text-[var(--color-chrome-muted)]">({field.unit})</span>
                      </span>
                    </Label>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) onChange(v);
                      }}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      className="bg-muted h-7 w-24 text-right font-mono text-xs tabular-nums dark:bg-[oklch(0.10_0.012_260)]"
                    />
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([v]) => onChange(v)}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                  />
                  {error ? <p className="text-xs text-red-400">{error.message}</p> : null}
                </div>
              )}
            />
          ))}

          <div className="rule-line my-4" />

          <div className="flex flex-col gap-2 pt-1">
            {onPredict ? (
              <Button
                type="button"
                onClick={handleSubmit(onSubmitPredict)}
                disabled={isLoading}
                className="font-mono text-xs tracking-wider uppercase"
              >
                {isLoading ? "Predicting..." : "Predict"}
              </Button>
            ) : null}
            {onCompare ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit(onSubmitCompare)}
                disabled={isLoading}
                className="border-[var(--color-chrome)]/40 font-mono text-xs tracking-wider text-[var(--color-chrome)] uppercase hover:bg-[var(--color-chrome)]/10"
              >
                {isLoading ? "Comparing..." : "Compare All Models"}
              </Button>
            ) : null}
          </div>
        </form>
      </TooltipProvider>
    </div>
  );
}
