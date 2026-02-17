from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import torch

from app.models.nn_model import NNmodel


@dataclass
class ModelPredictor:
    model: NNmodel
    scalerx_min: np.ndarray  # shape (5,)
    scalerx_max: np.ndarray  # shape (5,)
    model_name: str
    fold: int
    final_test_loss: float
    is_best: bool


def load_model(path: str) -> ModelPredictor:
    bundle = torch.load(path, map_location="cpu", weights_only=False)
    model = NNmodel()
    model.load_state_dict(bundle["model_state_dict"])
    model.eval()
    return ModelPredictor(
        model=model,
        scalerx_min=np.array(bundle["scalerx_min"], dtype=np.float64),
        scalerx_max=np.array(bundle["scalerx_max"], dtype=np.float64),
        model_name=bundle["model_name"],
        fold=bundle["fold"],
        final_test_loss=float(bundle["final_test_loss"]),
        is_best=bool(bundle["is_best"]),
    )


def predict(predictor: ModelPredictor, raw_inputs: np.ndarray) -> dict | list[dict]:
    """Run inference. raw_inputs shape: (5,) for single or (N, 5) for batch."""
    single = raw_inputs.ndim == 1
    if single:
        raw_inputs = raw_inputs.reshape(1, -1)

    # Min-max scale to [0, 1]
    x_scaled = (raw_inputs - predictor.scalerx_min) / (
        predictor.scalerx_max - predictor.scalerx_min
    )

    with torch.no_grad():
        x_tensor = torch.tensor(x_scaled, dtype=torch.float32)
        raw_output = predictor.model(x_tensor).numpy()

    results = []
    for row in raw_output:
        conversion = float(row[0])
        mn = float(10 ** row[1])
        mw = float(10 ** row[2])
        mz = float(10 ** row[3])
        mz_plus_1 = float(10 ** row[4])
        mv = float(10 ** row[5])
        dispersity = mw / mn if mn > 0 else 0.0
        results.append(
            {
                "conversion": conversion,
                "mn": mn,
                "mw": mw,
                "mz": mz,
                "mz_plus_1": mz_plus_1,
                "mv": mv,
                "dispersity": dispersity,
                "raw_outputs": [float(v) for v in row],
            }
        )

    return results[0] if single else results


def load_all_models(artifacts_dir: str = "artifacts") -> dict[str, ModelPredictor]:
    models = {
        "baseline_nn": f"{artifacts_dir}/baseline_nn_fold8_bundle.pt",
        "pcinn": f"{artifacts_dir}/pcinn_fold8_bundle.pt",
        "sa_pcinn": f"{artifacts_dir}/sa_pcinn_fold8_bundle.pt",
    }
    return {name: load_model(path) for name, path in models.items()}
