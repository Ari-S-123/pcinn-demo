from __future__ import annotations

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    m_molar: float = Field(..., ge=0.5, le=5.0, description="Monomer concentration [mol/L]")
    s_molar: float = Field(..., ge=5.0, le=9.5, description="Solvent concentration [mol/L]")
    i_molar: float = Field(
        ..., ge=0.005, le=0.1, description="Initiator concentration [mol/L]"
    )
    temperature_k: float = Field(..., ge=323.0, le=363.0, description="Temperature [K]")
    time_s: float = Field(..., ge=1.2, le=35854.0, description="Reaction time [s]")


class PredictionResponse(BaseModel):
    conversion: float
    mn: float
    mw: float
    mz: float
    mz_plus_1: float
    mv: float
    dispersity: float
    raw_outputs: list[float]


class BatchPredictionRequest(BaseModel):
    inputs: list[PredictionRequest] = Field(..., max_length=1000)


class BatchPredictionResponse(BaseModel):
    predictions: list[PredictionResponse]


class TimeSeriesRequest(BaseModel):
    m_molar: float = Field(..., ge=0.5, le=5.0)
    s_molar: float = Field(..., ge=5.0, le=9.5)
    i_molar: float = Field(..., ge=0.005, le=0.1)
    temperature_k: float = Field(..., ge=323.0, le=363.0)
    time_start_s: float = Field(default=0.0, ge=0.0)
    time_end_s: float = Field(..., ge=1.2, le=35854.0)
    time_steps: int = Field(default=100, ge=2, le=1000)


class TimeSeriesData(BaseModel):
    conversion: list[float]
    mn: list[float]
    mw: list[float]
    mz: list[float]
    mz_plus_1: list[float]
    mv: list[float]
    dispersity: list[float]


class TimeSeriesResponse(BaseModel):
    times: list[float]
    conversion: list[float]
    mn: list[float]
    mw: list[float]
    mz: list[float]
    mz_plus_1: list[float]
    mv: list[float]
    dispersity: list[float]


class CompareResponse(BaseModel):
    times: list[float]
    baseline_nn: TimeSeriesData
    pcinn: TimeSeriesData
    sa_pcinn: TimeSeriesData


class HealthResponse(BaseModel):
    status: str
    models_loaded: int
    available_models: list[str]
    default_model: str
    pytorch_version: str
    fold: int


class ModelInfo(BaseModel):
    name: str
    display_name: str
    description: str
    is_default: bool
    final_test_loss: float


class ModelsResponse(BaseModel):
    models: list[ModelInfo]
