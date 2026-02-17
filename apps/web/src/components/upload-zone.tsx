"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseUploadFile } from "@/lib/file-parser";
import { predictionSchema, defaultFormValues } from "@/lib/validation";
import type { ParsedRow, RowError } from "@/types/prediction";

interface UploadZoneProps {
  onFileParsed: (rows: ParsedRow[], errors: RowError[], valid: ParsedRow[]) => void;
  disabled?: boolean;
}

let xlsxModulePromise: Promise<typeof import("xlsx")> | null = null;

async function getXlsx() {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import("xlsx");
  }
  return xlsxModulePromise;
}

function validateRows(rows: ParsedRow[]): { valid: ParsedRow[]; errors: RowError[] } {
  const valid: ParsedRow[] = [];
  const errors: RowError[] = [];

  for (const row of rows) {
    const result = predictionSchema.safeParse({
      m_molar: row.m_molar,
      s_molar: row.s_molar,
      i_molar: row.i_molar,
      temperature_c: row.temperature_c,
      time_min: row.time_min,
    });

    if (result.success) {
      valid.push(row);
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          rowIndex: row.rowIndex,
          field: String(issue.path[0] ?? "unknown"),
          message: issue.message,
        });
      }
    }
  }

  return { valid, errors };
}

async function downloadTemplate() {
  const XLSX = await getXlsx();
  const ws = XLSX.utils.aoa_to_sheet([
    ["m_molar", "s_molar", "i_molar", "temperature", "time"],
    [
      defaultFormValues.m_molar,
      defaultFormValues.s_molar,
      defaultFormValues.i_molar,
      defaultFormValues.temperature_c,
      defaultFormValues.time_min,
    ],
    [2.0, 7.5, 0.05, 70, 240],
    [4.0, 6.0, 0.01, 80, 60],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, "pcinn-upload-template.xlsx");
}

export function UploadZone({ onFileParsed, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    setIsParsing(true);
    setParseError(null);

    const { rows, error, convertedTemperature, convertedTime } = await parseUploadFile(file);

    if (error) {
      setParseError(error);
      setIsParsing(false);
      return;
    }

    // Notify user about auto-detected unit conversions
    const conversions: string[] = [];
    if (convertedTemperature) conversions.push("K \u2192 \u00b0C");
    if (convertedTime) conversions.push("s \u2192 min");
    if (conversions.length > 0) {
      toast.info(`Auto-converted units: ${conversions.join(", ")}`);
    }

    const { valid, errors } = validateRows(rows);
    onFileParsed(rows, errors, valid);
    setIsParsing(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isParsing) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled && !isParsing) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isParsing && fileInputRef.current?.click()}
        className={`panel-inset flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-[var(--color-chrome)] bg-[var(--color-chrome)]/5"
            : "border-border hover:border-[var(--color-chrome)]/40"
        } ${disabled || isParsing ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          className="hidden"
        />

        {isParsing ? (
          <>
            <FileSpreadsheet className="text-muted-foreground h-10 w-10 animate-pulse" />
            <p className="text-muted-foreground font-mono text-sm">Parsing file...</p>
          </>
        ) : (
          <>
            <Upload className="text-muted-foreground h-10 w-10" />
            <div className="text-center">
              <p className="font-mono text-sm text-[var(--color-chrome)]">
                Drop a file here or click to browse
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Accepts .csv and .xlsx files (max 1,000 rows). Units auto-detected.
              </p>
            </div>
          </>
        )}
      </div>

      {parseError ? (
        <div className="panel-inset rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <p className="font-mono text-xs text-red-400">{parseError}</p>
        </div>
      ) : null}

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            void downloadTemplate();
          }}
          className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase"
        >
          <Download className="mr-1.5 h-3 w-3" />
          Download Template
        </Button>
      </div>
    </div>
  );
}
