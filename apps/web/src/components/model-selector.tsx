"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ModelInfo, ModelName } from "@/types/prediction";

const MODEL_COLORS: Record<string, string> = {
  baseline_nn:
    "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  pcinn:
    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  sa_pcinn:
    "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30",
};

interface ModelSelectorProps {
  value: ModelName;
  onChange: (model: ModelName) => void;
  models: Array<ModelInfo & { name: ModelName }>;
}

export function ModelSelector({ value, onChange, models }: ModelSelectorProps) {
  const hasModels = models.length > 0;

  return (
    <Select
      value={hasModels ? value : undefined}
      onValueChange={(v) => {
        const model = v as ModelName;
        if (models.some((item) => item.name === model)) {
          onChange(model);
        }
      }}
    >
      <SelectTrigger
        disabled={!hasModels}
        className="border-border bg-muted w-full font-mono text-xs dark:border-[oklch(0.28_0.012_260)] dark:bg-[oklch(0.14_0.01_260)]"
      >
        <SelectValue placeholder={hasModels ? "Select model..." : "No models available"} />
      </SelectTrigger>
      <SelectContent>
        {hasModels
          ? models.map((m) => (
              <SelectItem key={m.name} value={m.name} className="font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${MODEL_COLORS[m.name]}`}>
                    {m.display_name}
                  </Badge>
                  <span className="text-muted-foreground hidden text-[10px] sm:inline">
                    {m.description}
                  </span>
                </div>
              </SelectItem>
            ))
          : null}
      </SelectContent>
    </Select>
  );
}
