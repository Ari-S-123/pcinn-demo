from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request
import numpy as np

from app.models.inference import predict
from app.schemas.prediction import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    CompareResponse,
    ModelInfo,
    ModelsResponse,
    PredictionRequest,
    PredictionResponse,
    TimeSeriesRequest,
    TimeSeriesResponse,
)

router = APIRouter(tags=["prediction"])

VALID_MODELS = {"baseline_nn", "pcinn", "sa_pcinn"}

MODEL_DISPLAY: dict[str, tuple[str, str]] = {
    "baseline_nn": ("Baseline NN", "Data-only MSE training, no Jacobian guidance"),
    "pcinn": ("PCINN", "Data + Jacobian matching to kinetic model"),
    "sa_pcinn": (
        "SA-PCINN",
        "Data + Jacobian matching + soft-anchor to theory predictions",
    ),
}


def _get_predictor(request: Request, model: str | None = None):
    model = model or request.app.state.default_model
    if model not in VALID_MODELS:
        raise HTTPException(
            400,
            f"Unknown model '{model}'. Available: {', '.join(sorted(VALID_MODELS))}",
        )
    return request.app.state.predictors[model]


def _request_to_array(body: PredictionRequest) -> np.ndarray:
    return np.array(
        [body.m_molar, body.s_molar, body.i_molar, body.temperature_k, body.time_s]
    )


def _build_timeseries_inputs(body: TimeSeriesRequest, times: np.ndarray) -> np.ndarray:
    base = np.array([body.m_molar, body.s_molar, body.i_molar, body.temperature_k, 0.0])
    inputs = np.tile(base, (len(times), 1))
    inputs[:, 4] = times
    return inputs


def _extract_timeseries(results: list[dict]) -> dict:
    return {
        "conversion": [r["conversion"] for r in results],
        "mn": [r["mn"] for r in results],
        "mw": [r["mw"] for r in results],
        "mz": [r["mz"] for r in results],
        "mz_plus_1": [r["mz_plus_1"] for r in results],
        "mv": [r["mv"] for r in results],
        "dispersity": [r["dispersity"] for r in results],
    }


@router.post("/predict", response_model=PredictionResponse)
async def predict_single(
    body: PredictionRequest,
    request: Request,
    model: str | None = Query(None),
):
    predictor = _get_predictor(request, model)
    inputs = _request_to_array(body)
    return predict(predictor, inputs)


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    body: BatchPredictionRequest,
    request: Request,
    model: str | None = Query(None),
):
    predictor = _get_predictor(request, model)
    inputs = np.array(
        [
            [r.m_molar, r.s_molar, r.i_molar, r.temperature_k, r.time_s]
            for r in body.inputs
        ]
    )
    results = predict(predictor, inputs)
    return {"predictions": results}


@router.post("/predict/timeseries", response_model=TimeSeriesResponse)
async def predict_timeseries(
    body: TimeSeriesRequest,
    request: Request,
    model: str | None = Query(None),
):
    predictor = _get_predictor(request, model)
    times = np.linspace(body.time_start_s, body.time_end_s, body.time_steps)
    inputs = _build_timeseries_inputs(body, times)
    results = predict(predictor, inputs)
    return {"times": times.tolist(), **_extract_timeseries(results)}


@router.post("/predict/compare", response_model=CompareResponse)
async def predict_compare(body: TimeSeriesRequest, request: Request):
    times = np.linspace(body.time_start_s, body.time_end_s, body.time_steps)
    inputs = _build_timeseries_inputs(body, times)
    response: dict = {"times": times.tolist()}
    for name, predictor in request.app.state.predictors.items():
        results = predict(predictor, inputs)
        response[name] = _extract_timeseries(results)
    return response


@router.get("/models", response_model=ModelsResponse)
async def list_models(request: Request):
    models = []
    for name, predictor in request.app.state.predictors.items():
        display_name, description = MODEL_DISPLAY[name]
        models.append(
            ModelInfo(
                name=name,
                display_name=display_name,
                description=description,
                is_default=(name == request.app.state.default_model),
                final_test_loss=predictor.final_test_loss,
            )
        )
    return {"models": models}


@router.get("/model/info")
async def model_info(request: Request, model: str | None = Query(None)):
    predictor = _get_predictor(request, model)
    display_name, description = MODEL_DISPLAY[predictor.model_name]
    return {
        "model_name": predictor.model_name,
        "model_class": "NNmodel",
        "fold": predictor.fold,
        "final_test_loss": predictor.final_test_loss,
        "is_best": predictor.is_best,
        "architecture": "5 -> 128 (tanh) -> 64 (tanh) -> 6 (linear)",
        "input_features": ["[M] mol/L", "[S] mol/L", "[I] mol/L", "T K", "t s"],
        "output_features": [
            "X_raw",
            "log10(Mn)",
            "log10(Mw)",
            "log10(Mz)",
            "log10(Mz+1)",
            "log10(Mv)",
        ],
        "served_output_constraints": {
            "conversion": "clipped to [0, 1]",
            "raw_outputs[0]": "unclipped X_raw",
        },
        "scaler_ranges": {
            "M": {
                "min": float(predictor.scalerx_min[0]),
                "max": float(predictor.scalerx_max[0]),
                "unit": "mol/L",
            },
            "S": {
                "min": float(predictor.scalerx_min[1]),
                "max": float(predictor.scalerx_max[1]),
                "unit": "mol/L",
            },
            "I": {
                "min": float(predictor.scalerx_min[2]),
                "max": float(predictor.scalerx_max[2]),
                "unit": "mol/L",
            },
            "T": {
                "min": float(predictor.scalerx_min[3]),
                "max": float(predictor.scalerx_max[3]),
                "unit": "K",
            },
            "t": {
                "min": float(predictor.scalerx_min[4]),
                "max": float(predictor.scalerx_max[4]),
                "unit": "s",
            },
        },
    }
