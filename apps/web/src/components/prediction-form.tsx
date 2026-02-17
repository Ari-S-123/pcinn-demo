"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  predictionSchema,
  defaultFormValues,
  toApiUnits,
  type PredictionFormValues,
} from "@/lib/validation";
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
    name: "temperature_c" as const,
    label: "Temperature",
    unit: "°C",
    min: 50,
    max: 90,
    step: 1,
  },
  {
    name: "time_min" as const,
    label: "Time",
    unit: "min",
    min: 0.02,
    max: 597.57,
    step: 0.5,
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
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-mono text-sm">Reaction Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5">
          {FIELDS.map((field) => (
            <Controller
              key={field.name}
              name={field.name}
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label className="font-mono text-xs">
                      {field.label} <span className="text-muted-foreground">({field.unit})</span>
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
                      className="h-7 w-24 font-mono text-xs"
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

          <Separator />

          <div className="flex flex-col gap-2 pt-1">
            {onPredict ? (
              <Button
                type="button"
                onClick={handleSubmit(onSubmitPredict)}
                disabled={isLoading}
                className="font-mono text-xs"
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
                className="font-mono text-xs"
              >
                {isLoading ? "Comparing..." : "Compare All Models"}
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
