from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import torch

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(request: Request):
    predictors = request.app.state.predictors
    first_predictor = next(iter(predictors.values()))
    return {
        "status": "healthy",
        "models_loaded": len(predictors),
        "available_models": list(predictors.keys()),
        "default_model": request.app.state.default_model,
        "pytorch_version": torch.__version__,
        "fold": first_predictor.fold,
    }


@router.get("/health/ready")
async def ready(request: Request):
    predictors = getattr(request.app.state, "predictors", None)
    if not predictors or len(predictors) < 3:
        return JSONResponse(status_code=503, content={"status": "not ready"})
    return {"status": "ready"}
