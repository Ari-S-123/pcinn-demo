import * as XLSX from "xlsx";
import type { ModelBatchResult } from "@/types/prediction";

const DISPLAY_NAMES: Record<string, string> = {
  baseline_nn: "Baseline NN",
  pcinn: "PCINN",
  sa_pcinn: "SA-PCINN",
};

function buildSheetData(result: ModelBatchResult) {
  const headers = [
    "Row",
    "[M] (mol/L)",
    "[S] (mol/L)",
    "[I] (mol/L)",
    "Temp (°C)",
    "Time (min)",
    "Conversion",
    "Mn (Da)",
    "Mw (Da)",
    "Mz (Da)",
    "Mz+1 (Da)",
    "Mv (Da)",
    "Dispersity",
  ];

  const data = result.rows.map((r) => [
    r.rowIndex,
    r.m_molar,
    r.s_molar,
    r.i_molar,
    r.temperature_c,
    r.time_min,
    r.conversion,
    r.mn,
    r.mw,
    r.mz,
    r.mz_plus_1,
    r.mv,
    r.dispersity,
  ]);

  return [headers, ...data];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildFilename(results: ModelBatchResult[], extension: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = results.length === 1 ? results[0].model : "compare";
  return `pcinn-results-${suffix}-${date}.${extension}`;
}

export function exportResultsAsCsv(results: ModelBatchResult[]) {
  // For CSV, use the first model's results (or the only model)
  const result = results[0];
  const sheetData = buildSheetData(result);
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, buildFilename(results, "csv"));
}

export function exportResultsAsXlsx(results: ModelBatchResult[]) {
  const wb = XLSX.utils.book_new();

  for (const result of results) {
    const sheetData = buildSheetData(result);
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const sheetName = DISPLAY_NAMES[result.model] ?? result.model;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, buildFilename(results, "xlsx"));
}
