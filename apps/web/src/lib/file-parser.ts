import type { ParsedRow } from "@/types/prediction";

const MAX_ROWS = 1000;

type CanonicalField = keyof Omit<ParsedRow, "rowIndex">;

const HEADER_MAP: Record<string, CanonicalField> = {
  m_molar: "m_molar",
  "[m]": "m_molar",
  m: "m_molar",
  monomer: "m_molar",
  s_molar: "s_molar",
  "[s]": "s_molar",
  s: "s_molar",
  solvent: "s_molar",
  i_molar: "i_molar",
  "[i]": "i_molar",
  i: "i_molar",
  initiator: "i_molar",
  temperature_k: "temperature_k",
  time_s: "time_s",
};

const REQUIRED_FIELDS: CanonicalField[] = [
  "m_molar",
  "s_molar",
  "i_molar",
  "temperature_k",
  "time_s",
];

export interface FileParseResult {
  rows: ParsedRow[];
  error: string | null;
}

let xlsxModulePromise: Promise<typeof import("xlsx")> | null = null;

async function getXlsx() {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import("xlsx");
  }
  return xlsxModulePromise;
}

function normalizeHeader(raw: unknown): string {
  return String(raw).trim().toLowerCase();
}

export async function parseUploadFile(file: File): Promise<FileParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "csv" && ext !== "xlsx") {
    return {
      rows: [],
      error: "Unsupported file type. Please upload a .csv or .xlsx file.",
    };
  }

  const XLSX = await getXlsx();
  let workbook: import("xlsx").WorkBook;
  try {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return {
      rows: [],
      error: "Could not read file. Make sure it is a valid .csv or .xlsx file.",
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      rows: [],
      error: "File contains no sheets.",
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (rawData.length < 2) {
    return {
      rows: [],
      error: "File must contain a header row and at least one data row.",
    };
  }

  // Map header row to canonical field names
  const headerRow = rawData[0] as unknown[];
  const normalizedHeaders = headerRow.map(normalizeHeader);
  const columnMap: (CanonicalField | null)[] = normalizedHeaders.map((h) => HEADER_MAP[h] ?? null);

  // Check that all required fields are present
  const foundFields = new Set(columnMap.filter((f): f is CanonicalField => f !== null));
  const missingFields = REQUIRED_FIELDS.filter((f) => !foundFields.has(f));

  if (missingFields.length > 0) {
    return {
      rows: [],
      error: `Missing required columns: ${missingFields.join(", ")}. Required headers are: m_molar, s_molar, i_molar, temperature_k, time_s. Temperature and time headers must be exactly temperature_k and time_s.`,
    };
  }

  // Parse data rows
  const dataRows = rawData.slice(1);

  if (dataRows.length > MAX_ROWS) {
    return {
      rows: [],
      error: `File contains ${dataRows.length} data rows. Maximum allowed is ${MAX_ROWS}.`,
    };
  }

  const rows: ParsedRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const rawRow = dataRows[i] as unknown[];
    const row: Partial<Omit<ParsedRow, "rowIndex">> = {};
    let hasAnyValue = false;

    for (let col = 0; col < columnMap.length; col++) {
      const field = columnMap[col];
      if (!field) continue;

      const val = Number(rawRow[col]);
      if (!isNaN(val)) {
        row[field] = val;
        hasAnyValue = true;
      }
    }

    // Skip completely empty rows
    if (!hasAnyValue) continue;

    // Only include rows that have all 5 fields as numbers
    if (
      row.m_molar !== undefined &&
      row.s_molar !== undefined &&
      row.i_molar !== undefined &&
      row.temperature_k !== undefined &&
      row.time_s !== undefined
    ) {
      rows.push({
        rowIndex: i + 2, // 1-based, +1 for header row
        m_molar: row.m_molar,
        s_molar: row.s_molar,
        i_molar: row.i_molar,
        temperature_k: row.temperature_k,
        time_s: row.time_s,
      });
    }
  }

  if (rows.length === 0) {
    return {
      rows: [],
      error: "No valid data rows found. Ensure rows have numeric values for all 5 input fields.",
    };
  }

  return {
    rows,
    error: null,
  };
}
