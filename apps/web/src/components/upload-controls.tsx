"use client";

import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/model-selector";
import type { ModelInfo, ModelName } from "@/types/prediction";

interface UploadControlsProps {
  models: Array<ModelInfo & { name: ModelName }>;
  model: ModelName;
  onModelChange: (m: ModelName) => void;
  mode: "single" | "compare";
  onModeChange: (m: "single" | "compare") => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  validCount: number;
}

export function UploadControls({
  models,
  model,
  onModelChange,
  mode,
  onModeChange,
  onRun,
  onReset,
  isRunning,
  validCount,
}: UploadControlsProps) {
  return (
    <div
      className="animate-fade-in-up panel-inset space-y-4 p-4"
      style={{ animationDelay: "100ms" }}
    >
      <h3 className="section-label text-[var(--color-chrome-muted)]">Prediction Settings</h3>

      <div className="flex flex-wrap items-center gap-3">
        <div className="border-border flex rounded-md border">
          <button
            onClick={() => onModeChange("single")}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase transition-colors ${
              mode === "single"
                ? "bg-[var(--color-chrome)]/15 text-[var(--color-chrome)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Single Model
          </button>
          <button
            onClick={() => onModeChange("compare")}
            className={`border-border border-l px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase transition-colors ${
              mode === "compare"
                ? "bg-[var(--color-chrome)]/15 text-[var(--color-chrome)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Compare All
          </button>
        </div>

        {mode === "single" ? (
          <div className="w-56">
            <ModelSelector value={model} onChange={onModelChange} models={models} />
          </div>
        ) : (
          <span className="text-muted-foreground font-mono text-[10px]">
            All 3 models will be run
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onRun}
          disabled={isRunning || validCount === 0}
          className="font-mono text-xs tracking-wider uppercase"
        >
          {isRunning ? "Running..." : `Run ${validCount} Prediction${validCount !== 1 ? "s" : ""}`}
        </Button>
        <Button
          variant="ghost"
          onClick={onReset}
          disabled={isRunning}
          className="font-mono text-xs tracking-wider uppercase"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
