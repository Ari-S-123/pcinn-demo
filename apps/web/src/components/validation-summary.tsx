"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { RowError } from "@/types/prediction";

interface ValidationSummaryProps {
  errors: RowError[];
  totalRows: number;
  validCount: number;
}

export function ValidationSummary({ errors, totalRows, validCount }: ValidationSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const invalidCount = totalRows - validCount;

  return (
    <div className="animate-fade-in-up panel-inset space-y-3 p-4">
      <div className="flex items-center gap-3 font-mono text-xs">
        <span className="text-muted-foreground">
          {totalRows} row{totalRows !== 1 ? "s" : ""} parsed
        </span>
        <span className="text-muted-foreground">|</span>
        <span className="flex items-center gap-1 text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          {validCount} valid
        </span>
        {invalidCount > 0 ? (
          <>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {invalidCount} invalid
            </span>
          </>
        ) : null}
      </div>

      {errors.length > 0 ? (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 font-mono text-[10px] tracking-wider text-red-400 uppercase transition-colors hover:text-red-300"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {errors.length} validation error{errors.length !== 1 ? "s" : ""}
          </button>

          {expanded ? (
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {errors.map((err, i) => (
                <div key={i} className="flex gap-2 font-mono text-[10px] text-red-400/80">
                  <span className="text-muted-foreground shrink-0">Row {err.rowIndex}</span>
                  <span className="shrink-0 text-red-400">{err.field}:</span>
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
