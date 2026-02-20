export interface PredictionInput {
  m_molar: number;
  s_molar: number;
  i_molar: number;
  temperature_k: number;
  time_s: number;
}

export interface PredictionResult {
  conversion: number;
  mn: number;
  mw: number;
  mz: number;
  mz_plus_1: number;
  mv: number;
  dispersity: number;
  raw_outputs: number[];
}

export interface TimeSeriesInput {
  m_molar: number;
  s_molar: number;
  i_molar: number;
  temperature_k: number;
  time_start_s: number;
  time_end_s: number;
  time_steps: number;
}

export interface TimeSeriesResult {
  times: number[];
  conversion: number[];
  mn: number[];
  mw: number[];
  mz: number[];
  mz_plus_1: number[];
  mv: number[];
  dispersity: number[];
}

export interface CompareResult {
  times: number[];
  baseline_nn: TimeSeriesResult;
  pcinn: TimeSeriesResult;
  sa_pcinn: TimeSeriesResult;
}

export interface ModelInfo {
  name: string;
  display_name: string;
  description: string;
  is_default: boolean;
  final_test_loss: number;
}

export interface HealthStatus {
  status: string;
  models_loaded: number;
  available_models: string[];
  default_model: string;
  pytorch_version: string;
  fold: number;
}

export type ModelName = "baseline_nn" | "pcinn" | "sa_pcinn";

// --- Batch upload types ---

export interface ParsedRow {
  rowIndex: number;
  m_molar: number;
  s_molar: number;
  i_molar: number;
  temperature_k: number;
  time_s: number;
}

export interface RowError {
  rowIndex: number;
  field: string;
  message: string;
}

export interface EnrichedRow {
  rowIndex: number;
  m_molar: number;
  s_molar: number;
  i_molar: number;
  temperature_k: number;
  time_s: number;
  conversion: number;
  mn: number;
  mw: number;
  mz: number;
  mz_plus_1: number;
  mv: number;
  dispersity: number;
}

export interface ModelBatchResult {
  model: ModelName;
  rows: EnrichedRow[];
}
