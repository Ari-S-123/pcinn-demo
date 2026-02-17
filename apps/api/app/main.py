from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.middleware.cors import add_cors_middleware
from app.models.inference import load_all_models
from app.routers import health, predict

DEFAULT_MODEL = "sa_pcinn"


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.predictors = load_all_models()
    app.state.default_model = DEFAULT_MODEL
    yield
    del app.state.predictors


app = FastAPI(
    title="PCINN Prediction API",
    version="1.0.0",
    description="Polymer Chemistry Informed Neural Network predictions",
    lifespan=lifespan,
)

add_cors_middleware(app)

app.include_router(health.router, prefix="/api/v1")
app.include_router(predict.router, prefix="/api/v1")
