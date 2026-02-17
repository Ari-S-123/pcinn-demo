import type { ParsedRow } from "@/types/prediction";

const MAX_ROWS = 1000;

type CanonicalField = keyof Omit<ParsedRow, "rowIndex">;

// Headers that explicitly indicate Kelvin or seconds
const KELVIN_HEADERS = new Set(["temperature_k", "temp_k", "temp (k)", "temperature (k)"]);

const SECONDS_HEADERS = new Set(["time_s", "time (s)", "time (sec)", "time (seconds)"]);

const HEADER_MAP: Record<string, CanonicalField> = {
  // Concentration fields (no unit ambiguity)
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
  // Temperature — could be °C or K
  temperature: "temperature_c",
  temperature_c: "temperature_c",
  temp: "temperature_c",
  "temp (°c)": "temperature_c",
  "temperature (°c)": "temperature_c",
  "temperature (c)": "temperature_c",
  temperature_k: "temperature_c",
  temp_k: "temperature_c",
  "temp (k)": "temperature_c",
  "temperature (k)": "temperature_c",
  // Time — could be minutes or seconds
  time: "time_min",
  time_min: "time_min",
  "time (min)": "time_min",
  "time (minutes)": "time_min",
  time_s: "time_min",
  "time (s)": "time_min",
  "time (sec)": "time_min",
  "time (seconds)": "time_min",
};

const REQUIRED_FIELDS: CanonicalField[] = [
  "m_molar",
  "s_molar",
  "i_molar",
  "temperature_c",
  "time_min",
];

export interface FileParseResult {
  rows: ParsedRow[];
  error: string | null;
  /** Whether temperature was auto-detected as Kelvin and converted */
  convertedTemperature: boolean;
  /** Whether time was auto-detected as seconds and converted */
  convertedTime: boolean;
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
      convertedTemperature: false,
      convertedTime: false,
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
      convertedTemperature: false,
      convertedTime: false,
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      rows: [],
      error: "File contains no sheets.",
      convertedTemperature: false,
      convertedTime: false,
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (rawData.length < 2) {
    return {
      rows: [],
      error: "File must contain a header row and at least one data row.",
      convertedTemperature: false,
      convertedTime: false,
    };
  }

  // Map header row to canonical field names
  const headerRow = rawData[0] as unknown[];
  const normalizedHeaders = headerRow.map(normalizeHeader);
  const columnMap: (CanonicalField | null)[] = normalizedHeaders.map((h) => HEADER_MAP[h] ?? null);

  // Detect if the header explicitly indicates Kelvin or seconds
  const hasExplicitKelvin = normalizedHeaders.some((h) => KELVIN_HEADERS.has(h));
  const hasExplicitSeconds = normalizedHeaders.some((h) => SECONDS_HEADERS.has(h));

  // Check that all required fields are present
  const foundFields = new Set(columnMap.filter((f): f is CanonicalField => f !== null));
  const missingFields = REQUIRED_FIELDS.filter((f) => !foundFields.has(f));

  if (missingFields.length > 0) {
    return {
      rows: [],
      error: `Missing required columns: ${missingFields.join(", ")}. Expected headers like: m_molar (or [M]), s_molar (or [S]), i_molar (or [I]), temperature (°C or K), time (min or s).`,
      convertedTemperature: false,
      convertedTime: false,
    };
  }

  // Parse data rows
  const dataRows = rawData.slice(1);

  if (dataRows.length > MAX_ROWS) {
    return {
      rows: [],
      error: `File contains ${dataRows.length} data rows. Maximum allowed is ${MAX_ROWS}.`,
      convertedTemperature: false,
      convertedTime: false,
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
      row.temperature_c !== undefined &&
      row.time_min !== undefined
    ) {
      rows.push({
        rowIndex: i + 2, // 1-based, +1 for header row
        m_molar: row.m_molar,
        s_molar: row.s_molar,
        i_molar: row.i_molar,
        temperature_c: row.temperature_c,
        time_min: row.time_min,
      });
    }
  }

  if (rows.length === 0) {
    return {
      rows: [],
      error: "No valid data rows found. Ensure rows have numeric values for all 5 input fields.",
      convertedTemperature: false,
      convertedTime: false,
    };
  }

  // Auto-detect and convert units
  // Temperature: if header explicitly says K, or all values > 200, treat as Kelvin
  const tempValues = rows.map((r) => r.temperature_c);
  const isKelvin = hasExplicitKelvin || tempValues.every((t) => t > 200);
  if (isKelvin) {
    for (const row of rows) {
      row.temperature_c = row.temperature_c - 273.15;
    }
  }

  // Time: if header explicitly says seconds, or max value exceeds the minutes max (597.57), treat as seconds
  const timeValues = rows.map((r) => r.time_min);
  const maxTime = Math.max(...timeValues);
  const isSeconds = hasExplicitSeconds || maxTime > 597.57;
  if (isSeconds) {
    for (const row of rows) {
      row.time_min = row.time_min / 60;
    }
  }

  return { rows, error: null, convertedTemperature: isKelvin, convertedTime: isSeconds };
}
