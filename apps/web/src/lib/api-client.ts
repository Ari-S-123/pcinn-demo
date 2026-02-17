import type {
  CompareResult,
  HealthStatus,
  ModelInfo,
  ModelName,
  PredictionInput,
  PredictionResult,
  TimeSeriesInput,
  TimeSeriesResult,
} from "@/types/prediction";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public responseBody?: string,
  ) {
    super(message);
  }
}

function readErrorMessage(status: number, body: string): string {
  if (!body) {
    return `Request failed with status ${status}`;
  }

  try {
    const parsed = JSON.parse(body) as { detail?: string; message?: string };
    if (typeof parsed.detail === "string" && parsed.detail.trim().length > 0) {
      return parsed.detail;
    }
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return parsed.message;
    }
  } catch {
    // Fall through to plain text response body.
  }

  return body;
}

function mergeJsonHeaders(headers?: HeadersInit): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...Object.fromEntries(new Headers(headers).entries()),
  };
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...options,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new ApiError(res.status, readErrorMessage(res.status, body), body);
    }

    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof ApiError || isAbortError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Network request failed";
    throw new ApiError(0, message);
  }
}

export async function predict(
  input: PredictionInput,
  model?: ModelName,
  options?: RequestInit,
): Promise<PredictionResult> {
  const params = model ? `?model=${model}` : "";
  return fetchJson<PredictionResult>(`${API_V1}/predict${params}`, {
    ...options,
    method: "POST",
    headers: mergeJsonHeaders(options?.headers),
    body: JSON.stringify(input),
  });
}

export async function predictTimeseries(
  input: TimeSeriesInput,
  model?: ModelName,
  options?: RequestInit,
): Promise<TimeSeriesResult> {
  const params = model ? `?model=${model}` : "";
  return fetchJson<TimeSeriesResult>(`${API_V1}/predict/timeseries${params}`, {
    ...options,
    method: "POST",
    headers: mergeJsonHeaders(options?.headers),
    body: JSON.stringify(input),
  });
}

export async function predictCompare(
  input: TimeSeriesInput,
  options?: RequestInit,
): Promise<CompareResult> {
  return fetchJson<CompareResult>(`${API_V1}/predict/compare`, {
    ...options,
    method: "POST",
    headers: mergeJsonHeaders(options?.headers),
    body: JSON.stringify(input),
  });
}

export async function getModels(options?: RequestInit): Promise<{ models: ModelInfo[] }> {
  return fetchJson<{ models: ModelInfo[] }>(`${API_V1}/models`, options);
}

export async function checkHealth(options?: RequestInit): Promise<HealthStatus> {
  return fetchJson<HealthStatus>(`${API_V1}/health`, options);
}

// [async-parallel] Fetch independent data simultaneously
export async function getInitialData() {
  const [health, models] = await Promise.all([checkHealth(), getModels()]);
  return { health, models };
}

export { ApiError };
