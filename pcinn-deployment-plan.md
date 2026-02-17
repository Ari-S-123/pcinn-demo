# PCINN Full-Stack Deployment: Implementation Plan & Spec Sheet

## Executive Summary

This document specifies a monorepo architecture for deploying the Polymer Chemistry Informed Neural Network (PCINN) model as a production REST API backed by FastAPI, Dockerized and deployed on Railway, with a Next.js + shadcn/ui frontend deployed on Vercel. The model artifact is ~40KB (CPU-only PyTorch), making it trivially hostable on any commodity instance.

---

## Implementation Status (Audited February 17, 2026)

This file started as a target-state spec. The repository now contains a concrete implementation. If any detailed section below conflicts with this matrix, treat this matrix as authoritative.

Status legend:
- `Implemented`: present in repo and aligned with behavior.
- `Implemented Variant`: implemented with a different but acceptable approach.
- `Not Implemented`: still a gap.

| Area | Status | Evidence | Notes |
|------|--------|----------|-------|
| Monorepo scaffold (`apps/api`, `apps/web`) | Implemented | `apps/api`, `apps/web`, `package.json` | Matches intended architecture. |
| FastAPI routes and schemas | Implemented | `apps/api/app/routers/predict.py`, `apps/api/app/schemas/prediction.py` | `/predict`, `/predict/batch`, `/predict/timeseries`, `/predict/compare`, `/models`, `/model/info`. |
| Startup model loading + inference pipeline | Implemented | `apps/api/app/main.py`, `apps/api/app/models/inference.py` | Lifespan startup + min-max scaling + output inversion are in place. |
| Next.js predict + compare UI | Implemented | `apps/web/src/app/predict/page.tsx`, `apps/web/src/app/compare/page.tsx` | Includes forms, charts, and model selector. |
| Frontend perf patterns (Vercel React best practices) | Implemented | `apps/web/src/lib/api-client.ts`, `apps/web/src/app/predict/page.tsx`, `apps/web/src/components/reaction-chart.tsx` | Uses `Promise.all` for independent requests and `next/dynamic` for heavy charts. |
| Dockerized backend and Railway config | Implemented Variant | `apps/api/Dockerfile`, `railway.toml`, `docker-compose.yml` | Build context is repo root with Dockerfile path, not `apps/api` context. |
| CI workflow | Implemented Variant | `.github/workflows/lint.yml` | Lint workflow exists; full multi-check CI from original spec is not yet present. |
| Training-range warning header (`X-Warning`) | Not Implemented | `apps/api/app/schemas/prediction.py` | Validation enforces domain bounds only. |
| Deployment runtime proof (Railway + Vercel) | Manual Verification Required | N/A (platform state) | Requires external evidence checklist in appendix. |

---

## 1. Technology Stack — Verified Versions (February 2026)

| Component | Technology | Version | Role |
|-----------|-----------|---------|------|
| Runtime (frontend) | Bun | 1.3.9 | Package manager, script runner, lockfile |
| Framework (frontend) | Next.js | 16.1.6 | React SSR/SSG framework |
| UI Library | shadcn/ui | latest (CLI-installed) | Component library (Tailwind + Radix) |
| Styling | Tailwind CSS | 4.1.x | Utility-first CSS (scaffolded by `create-next-app`, not shipped by Next.js) |
| Language (frontend) | TypeScript | 5.9.x (5.9.3 stable) | Type safety (6.0 is beta-only as of Feb 2026) |
| Framework (backend) | FastAPI | 0.129.0 | Python ASGI API framework |
| ML Runtime | PyTorch | 2.10.0 (CPU) | Model inference |
| Python | CPython | 3.13.x | Backend runtime (matches notebook environment: 3.13.9) |
| ASGI Server | Uvicorn | 0.40.0 | Production ASGI server |
| Containerization | Docker | multi-stage build | Isolate backend for deployment |
| Backend Hosting | Railway | current | Container deployment platform |
| Frontend Hosting | Vercel | current | Next.js-optimized hosting |
| Monorepo Tooling | Bun Workspaces | native | Workspace management |

---

## 2. Monorepo Structure

```
pcinn-demo/
├── .github/
│   └── workflows/
│       └── lint.yml                  # GitHub Actions lint workflow
├── apps/
│   ├── api/                          # FastAPI backend (Python)
│   │   ├── Dockerfile
│   │   ├── .dockerignore
│   │   ├── pyproject.toml
│   │   ├── requirements.txt          # Pinned production deps
│   │   ├── requirements-dev.txt      # Dev/test deps
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py               # FastAPI app entrypoint
│   │   │   ├── config.py             # Settings via pydantic-settings
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── nn_model.py       # NNmodel class definition
│   │   │   │   └── inference.py      # Model loading & prediction logic
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   └── prediction.py     # Pydantic request/response schemas
│   │   │   ├── routers/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── health.py         # Health check endpoints
│   │   │   │   └── predict.py        # Prediction endpoints
│   │   │   └── middleware/
│   │   │       ├── __init__.py
│   │   │       └── cors.py           # CORS configuration
│   │   ├── artifacts/
│   │   │   ├── baseline_nn_fold8_bundle.pt
│   │   │   ├── pcinn_fold8_bundle.pt
│   │   │   └── sa_pcinn_fold8_bundle.pt
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── conftest.py
│   │       ├── test_health.py
│   │       ├── test_predict.py
│   │       └── test_model.py
│   └── web/                          # Next.js frontend
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── postcss.config.mjs
│       ├── components.json           # shadcn/ui config
│       ├── public/
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx          # Landing / main prediction UI
│       │   │   ├── globals.css
│       │   │   ├── predict/
│       │   │   │   └── page.tsx      # Single-model prediction form page
│       │   │   └── compare/
│       │   │       └── page.tsx      # Side-by-side 3-model comparison page
│       │   ├── components/
│       │   │   ├── ui/               # shadcn/ui components (auto-installed)
│       │   │   ├── prediction-form.tsx
│       │   │   ├── results-display.tsx
│       │   │   ├── reaction-chart.tsx
│       │   │   ├── comparison-chart.tsx
│       │   │   ├── model-selector.tsx
│       │   │   └── header.tsx
│       │   ├── lib/
│       │   │   ├── api-client.ts     # Typed fetch wrapper for backend
│       │   │   ├── utils.ts          # shadcn/ui cn() utility
│       │   │   └── validation.ts     # Zod schemas for form validation
│       │   └── types/
│       │       └── prediction.ts     # Shared TS types
├── packages/                         # Reserved for future shared packages
├── package.json                      # Root workspace config
├── bun.lock                          # Bun lockfile
├── .gitignore
├── .env.example
├── railway.toml                      # Railway service config
└── README.md
```

---

## 3. Backend — FastAPI REST API

### 3.1 Model Artifact Format

The exported bundle files (`.pt`, ~40KB each) are standard PyTorch `torch.save()` archives containing:

| Key | Type | Description |
|-----|------|-------------|
| `model_class` | `str` | Always `"NNmodel"` |
| `model_name` | `str` | One of `"baseline_nn"`, `"pcinn"`, `"sa_pcinn"` |
| `model_state_dict` | `OrderedDict` | PyTorch state dict for `NNmodel` |
| `scalerx_min` | `np.ndarray` shape `(5,)` | Per-feature minimum for min-max scaling |
| `scalerx_max` | `np.ndarray` shape `(5,)` | Per-feature maximum for min-max scaling |
| `y_log10_applied_to_columns_1_to_end` | `bool` | Whether outputs 1–5 are log10-transformed |
| `fold` | `int` | Cross-validation fold index |
| `final_test_loss` | `float` | Test loss at end of training |
| `is_best` | `bool` | Whether this was the best of the three models |
| `pytorch_version` | `str` | PyTorch version used during training |

### 3.2 `NNmodel` Architecture (Reproduced Exactly)

```
Input(5) → Linear(5, 128) → tanh → Linear(128, 64) → tanh → Linear(64, 6)
```

**Inputs** (all min-max scaled to [0, 1] using bundle scaler ranges):

| Index | Feature | Unit | Scaler Min | Scaler Max | Description |
|-------|---------|------|-----------|-----------|-------------|
| 0 | [M] | mol/L | 0.5 | 5.0 | Monomer concentration |
| 1 | [S] | mol/L | 5.0 | 9.5 | Solvent concentration (dataset enforces [M]+[S]=10) |
| 2 | [I] | mol/L | 0.005 | 0.1 | Initiator concentration |
| 3 | T | K | 323.0 | 363.0 | Reaction temperature (50–90°C) |
| 4 | t | s | 1.2 | 35854.0 | Reaction time (~0–600 min) |

**Important:** The training data and domain model both use Kelvin for temperature and seconds for time. The Excel dataset (`PMMAordered.xlsx`) confirms this via formulas like `=273+60` (Kelvin) and `=30*60` (seconds). The scaler min/max values above are extracted directly from the bundle artifacts and define the domain bounds for valid inference.

**Outputs** (raw network output):

| Index | Output | Transform | Description |
|-------|--------|-----------|-------------|
| 0 | X | none (direct) | Conversion (0–1) |
| 1 | log₁₀(Mₙ) | 10^x to get Da | Number-average molecular weight |
| 2 | log₁₀(Mw) | 10^x to get Da | Weight-average molecular weight |
| 3 | log₁₀(Mz) | 10^x to get Da | Z-average molecular weight |
| 4 | log₁₀(Mz₊₁) | 10^x to get Da | (Z+1)-average molecular weight |
| 5 | log₁₀(Mv) | 10^x to get Da | Viscosity-average molecular weight |

### 3.3 API Endpoints

**Base URL:** `https://<railway-domain>/api/v1`

#### `GET /health`
Returns server health and model load status.

**Response `200 OK`:**
```json
{
  "status": "healthy",
  "models_loaded": 3,
  "available_models": ["baseline_nn", "pcinn", "sa_pcinn"],
  "default_model": "sa_pcinn",
  "pytorch_version": "2.10.0",
  "fold": 8
}
```

#### `GET /health/ready`
Kubernetes-style readiness probe. Returns `200` only if all models are loaded, `503` otherwise.

#### `POST /predict`
Run a single prediction.

**Request Body:**
```json
{
  "m_molar": 3.326,
  "s_molar": 6.674,
  "i_molar": 0.0246,
  "temperature_k": 333.0,
  "time_s": 7200.0
}
```

All fields are required floats in the native units the model was trained on: concentrations in mol/L, temperature in Kelvin, time in seconds. The API validates that inputs fall within the domain bounds (the scaler min/max from the bundle). An optional convenience endpoint `POST /predict/friendly` could accept temperature in °C and time in minutes with automatic conversion, but the primary `/predict` endpoint uses the exact same units as the training data to avoid any silent conversion errors.

**Response `200 OK`:**
```json
{
  "conversion": 0.45,
  "mn": 52481.3,
  "mw": 105420.7,
  "mz": 158120.4,
  "mz_plus_1": 210830.1,
  "mv": 92310.5,
  "dispersity": 2.009,
  "raw_outputs": [0.45, 4.72, 5.02, 5.20, 5.32, 4.97]
}
```

`conversion` is a unitless fraction (0–1). `mn`, `mw`, `mz`, `mz_plus_1`, `mv` are in g/mol (Daltons), obtained by exponentiating the raw log10 network outputs. `dispersity` is computed as `mw / mn`. The `raw_outputs` array contains the direct 6-dimensional network output (conversion + log10 molecular weight values) for advanced users.

**Error `422 Unprocessable Entity`:**
```json
{
  "detail": [
    {
      "loc": ["body", "temperature_k"],
      "msg": "Value must be between 323.0 and 363.0 (domain bounds in Kelvin)",
      "type": "value_error"
    }
  ]
}
```

#### `POST /predict/batch`
Run predictions for multiple input sets in one request.

**Request Body:**
```json
{
  "inputs": [
    {
      "m_molar": 3.326,
      "s_molar": 6.674,
      "i_molar": 0.0246,
      "temperature_k": 333.0,
      "time_s": 7200.0
    },
    {
      "m_molar": 3.330,
      "s_molar": 6.670,
      "i_molar": 0.0123,
      "temperature_k": 343.0,
      "time_s": 10800.0
    }
  ]
}
```

Maximum batch size: 1000 inputs per request.

**Response `200 OK`:**
```json
{
  "predictions": [
    { "conversion": 0.45, "mn": 52481.3, "mw": 105420.7, "...": "..." },
    { "conversion": 0.62, "mn": 48210.1, "mw": 98430.2, "...": "..." }
  ]
}
```

#### `POST /predict/timeseries`
Given fixed reaction conditions, predict the evolution of all outputs over a time range. This is the primary endpoint the frontend chart uses.

**Request Body:**
```json
{
  "m_molar": 3.326,
  "s_molar": 6.674,
  "i_molar": 0.0246,
  "temperature_k": 333.0,
  "time_start_s": 0.0,
  "time_end_s": 18000.0,
  "time_steps": 100
}
```

**Response `200 OK`:**
```json
{
  "times": [0.0, 3.03, 6.06, "...", 300.0],
  "conversion": [0.0, 0.01, 0.03, "...", 0.85],
  "mn": [0.0, 45000.1, 46200.3, "...", 53000.0],
  "mw": [0.0, 91000.2, 93100.5, "...", 106000.0],
  "mz": ["..."],
  "mz_plus_1": ["..."],
  "mv": ["..."],
  "dispersity": ["..."]
}
```

#### `GET /model/info`
Returns metadata about the currently loaded model.

**Response `200 OK`:**
```json
{
  "model_name": "sa_pcinn",
  "model_class": "NNmodel",
  "fold": 8,
  "final_test_loss": 1.183,
  "is_best": true,
  "architecture": "5 → 128 (tanh) → 64 (tanh) → 6 (linear)",
  "input_features": ["[M] mol/L", "[S] mol/L", "[I] mol/L", "T K", "t s"],
  "output_features": ["X", "log10(Mn)", "log10(Mw)", "log10(Mz)", "log10(Mz+1)", "log10(Mv)"],
  "scaler_ranges": {
    "M": {"min": 0.5, "max": 5.0, "unit": "mol/L"},
    "S": {"min": 5.0, "max": 9.5, "unit": "mol/L"},
    "I": {"min": 0.005, "max": 0.1, "unit": "mol/L"},
    "T": {"min": 323.0, "max": 363.0, "unit": "K"},
    "t": {"min": 1.2, "max": 35854.0, "unit": "s"}
  }
}
```

#### `GET /models`
Lists all available models loaded at startup.

**Response `200 OK`:**
```json
{
  "models": [
    {
      "name": "baseline_nn",
      "display_name": "Baseline NN",
      "description": "Data-only MSE training, no Jacobian guidance",
      "is_default": false,
      "final_test_loss": 1.447
    },
    {
      "name": "pcinn",
      "display_name": "PCINN",
      "description": "Data + Jacobian matching to kinetic model",
      "is_default": false,
      "final_test_loss": 1.393
    },
    {
      "name": "sa_pcinn",
      "display_name": "SA-PCINN",
      "description": "Data + Jacobian matching + soft-anchor to theory predictions",
      "is_default": true,
      "final_test_loss": 1.183
    }
  ]
}
```

All prediction endpoints (`/predict`, `/predict/batch`, `/predict/timeseries`) accept an optional `model` query parameter (one of `baseline_nn`, `pcinn`, `sa_pcinn`). Defaults to `sa_pcinn` if omitted.

**Example:** `POST /predict?model=sa_pcinn`

#### `POST /predict/compare`
Runs the same input through all three models and returns side-by-side results. This is the primary endpoint powering the comparison chart in the frontend.

**Request Body:** Same as `/predict/timeseries`.

**Response `200 OK`:**
```json
{
  "times": [0.0, 3.03, "...", 300.0],
  "baseline_nn": {
    "conversion": [0.0, 0.02, "...", 0.91],
    "mw": [0.0, 88000.1, "...", 112000.0]
  },
  "pcinn": {
    "conversion": [0.0, 0.01, "...", 0.85],
    "mw": [0.0, 91000.2, "...", 106000.0]
  },
  "sa_pcinn": {
    "conversion": [0.0, 0.01, "...", 0.84],
    "mw": [0.0, 90500.8, "...", 105200.0]
  }
}
```

### 3.4 `requirements.txt` (Pinned Versions)

```
torch==2.10.0+cpu
fastapi==0.129.0
uvicorn[standard]==0.40.0
pydantic==2.12.5
pydantic-settings==2.13.0
numpy==2.4.2
```

The `+cpu` suffix for PyTorch is critical — it avoids pulling in ~2GB of CUDA libraries. Install via:
```bash
pip install torch==2.10.0+cpu --index-url https://download.pytorch.org/whl/cpu
```

### 3.5 Dockerfile (Multi-Stage, CPU-Only)

```dockerfile
# ── Stage 1: Builder ──────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /build

COPY apps/api/requirements.txt .

RUN pip install --no-cache-dir --prefix=/install \
    torch==2.10.0+cpu --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir --prefix=/install \
    -r requirements.txt

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM python:3.13-slim AS runtime

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code and model artifacts
COPY apps/api/app/ ./app/
COPY apps/api/artifacts/ ./artifacts/

# Non-root user for security
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/api/v1/health')"

# Railway injects $PORT at runtime; default to 8000 for local dev
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

**Expected image size:** ~450–550MB (PyTorch CPU-only is ~180MB, Python slim is ~150MB, rest is deps).

### 3.6 `.dockerignore`

```
__pycache__/
*.pyc
.venv/
.git/
tests/
*.ipynb
*.md
.env
```

### 3.7 Key Implementation Details

**Startup model loading:** Use FastAPI's `lifespan` context manager to load all three model bundles once at startup and keep them in `app.state`. This avoids per-request deserialization overhead and enables the `/predict/compare` endpoint.

```python
from contextlib import asynccontextmanager

MODELS = {
    "baseline_nn": "artifacts/baseline_nn_fold8_bundle.pt",
    "pcinn": "artifacts/pcinn_fold8_bundle.pt",
    "sa_pcinn": "artifacts/sa_pcinn_fold8_bundle.pt",
}
DEFAULT_MODEL = "sa_pcinn"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load all three models at startup
    app.state.predictors = {
        name: load_model(path) for name, path in MODELS.items()
    }
    app.state.default_model = DEFAULT_MODEL
    yield
    del app.state.predictors
```

**Input scaling:** The bundle includes `scalerx_min` and `scalerx_max` arrays. The scaling formula is:
```
x_scaled = (x_raw - scalerx_min) / (scalerx_max - scalerx_min)
```

**Output inversion:** Output index 0 (conversion) is used directly. Outputs 1–5 are log10-transformed during training, so they must be exponentiated: `value = 10 ** raw_output`.

**Thread safety:** PyTorch CPU inference is thread-safe for `model.eval()` with `torch.no_grad()`. No mutex needed for concurrent requests on a single model instance.

---

## 4. Frontend — Next.js + shadcn/ui

### 4.1 Project Initialization

```bash
cd apps/web
bunx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
bunx shadcn@latest init
```

When prompted by `shadcn init`, select: New York style, Zinc base color, CSS variables for colors.

### 4.2 Required shadcn/ui Components

Install these components via the shadcn CLI:

```bash
bunx shadcn@latest add button card input label form select slider tabs toast chart separator skeleton badge
```

### 4.3 Pages & Components

**`/` (Landing Page):** Hero section explaining what the PCINN is, with a "Try Prediction" CTA button. Brief description of the Ballard (2024) paper and model capabilities.

**`/predict` (Prediction Page):** The primary interactive page. Contains:

1. **`<ModelSelector />`** — A shadcn `<Select>` dropdown at the top of the form that lets the user choose which model to run: Baseline NN, PCINN, or SA-PCINN (default). Each option shows the model name plus a one-line description (e.g., "SA-PCINN — Data + Jacobian matching + soft-anchor to theory predictions"). The selected model name is passed as a `?model=` query parameter to all API calls. On page load, the component fetches `GET /models` to populate the list dynamically.

2. **`<PredictionForm />`** — A form with five labeled inputs corresponding to the reaction conditions. Each input has a slider (for visual range selection) and a text input (for precise values) side by side. Validation via Zod ensures values stay within physically meaningful ranges. A "Predict" button submits to the API. A separate "Compare All Models" button triggers the comparison view.

3. **`<ResultsDisplay />`** — Shows the prediction results in a card grid: conversion (as a percentage with a progress bar), Mn, Mw, Mz, Mz+1, Mv (formatted with thousands separators), and dispersity (Mw/Mn). Only visible after a successful prediction. Shows a `<Badge>` with the model name used.

4. **`<ReactionChart />`** — Uses Recharts (via shadcn chart component) to plot conversion and Mw vs. time for the currently selected model. When the user submits a prediction, the frontend also fires a `/predict/timeseries` request to get the full evolution curve. The chart has toggle tabs for "Conversion vs Time" and "Mw vs Time".

5. **`<ComparisonChart />`** — Activated when the user clicks "Compare All Models". Calls `POST /predict/compare` with the current form inputs and renders all three model predictions overlaid on the same chart with distinct colors and a legend (Baseline NN = green, PCINN = blue, SA-PCINN = orange, matching the paper's color scheme). The chart uses tabs to switch between "Conversion vs Time" and "Mw vs Time" comparisons. This directly replicates the key visualization from Figures 3 and 4 of the Ballard (2024) paper, making it immediately useful for researchers evaluating model performance.

### 4.4 API Client

The `api-client.ts` module provides a typed wrapper around `fetch`. It reads the backend URL from `NEXT_PUBLIC_API_URL` (set to `http://localhost:8000` in dev, and the Railway production URL in Vercel env vars).

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
```

All API calls are client-side (no server actions needed for this use case) since the model inference is stateless and the backend is a separate service. The current client exposes typed functions: `predict(input, model?)`, `predictTimeseries(input, model?)`, `predictCompare(input)`, `getModels()`, and `checkHealth()`.

### 4.5 Environment Variables

| Variable | Where Set | Example Value |
|----------|-----------|---------------|
| `NEXT_PUBLIC_API_URL` | Vercel env vars | `https://pcinn-api.up.railway.app` |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` (dev) | `http://localhost:8000` |

### 4.6 ESLint + Prettier Configuration

Next.js 16 removed the built-in `next lint` command in favor of the standard ESLint CLI with flat config (`eslint.config.mjs`). The `create-next-app` scaffolding generates an initial config, but it needs to be extended with Prettier integration and TypeScript rules for a production setup.

**Install dev dependencies:**

```bash
bun add -d eslint eslint-config-next eslint-config-prettier prettier
```

**`eslint.config.mjs`** (flat config, Next.js 16 style):

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier, // Must come LAST to override formatting rules
  {
    rules: {
      // Project-specific overrides
      "@next/next/no-img-element": "off", // We use next/image but allow <img> in docs
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

The `eslint-config-next/core-web-vitals` config includes the base Next.js rules plus React and React Hooks plugins, and upgrades rules that impact Core Web Vitals from warnings to errors. The `eslint-config-next/typescript` config layers on TypeScript-specific rules from `typescript-eslint`. The `eslint-config-prettier/flat` config must be spread **last** to disable all ESLint formatting rules that would conflict with Prettier.

**`.prettierrc`:**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Install the Tailwind plugin for automatic class sorting: `bun add -d prettier-plugin-tailwindcss`.

**`apps/web/package.json` scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "bunx eslint .",
    "lint:fix": "bunx eslint . --fix",
    "format": "bunx prettier --write \"src/**/*.{ts,tsx,css,json}\"",
    "format:check": "bunx prettier --check \"src/**/*.{ts,tsx,css,json}\""
  }
}
```

Note that `next lint` no longer exists in Next.js 16. All linting runs through the standard ESLint CLI (`bunx eslint .`), which reads the flat config from `eslint.config.mjs`. The root `package.json` scripts in Section 7.1 should reference these commands accordingly.

---

## 5. Railway Deployment (Backend)

### 5.1 Service Configuration

Railway's "Root Directory" feature can cause issues in monorepos because it changes the build context, potentially breaking access to shared files and making config-as-code paths confusing. The safer approach for monorepos is to keep the build context at the repo root and point Railway at the Dockerfile via environment variable.

Set the following **Service Variable** in Railway's dashboard:

```
RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile
```

This tells Railway to use the specified Dockerfile while keeping the full repo as the build context. The `railway.toml` at the repo root configures deploy settings:

```toml
[deploy]
healthcheckPath = "/api/v1/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

Note: `railway.toml` paths are relative to the repo root, not the Dockerfile location, which is another reason to avoid setting a Root Directory.

### 5.2 Railway Setup Steps

1. Create a new project on Railway (`railway.com/new`).
2. Connect the GitHub monorepo.
3. In the service's **Variables** tab, set `RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile` so Railway finds the Dockerfile without needing a Root Directory override.
4. Railway will detect the `Dockerfile` and build automatically with the full repo as build context.
5. Under **Networking**, generate a Railway-provided domain (e.g., `pcinn-api-production.up.railway.app`).
6. Set the following additional **Service Variables**:
   - `ARTIFACTS_DIR=artifacts`
   - `ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app` (CORS)
   - Note: `PORT` is automatically injected by Railway; do not set it manually.
7. Deploy. The healthcheck endpoint will confirm the service is ready.

### 5.3 Railway Resource Estimation

The PCINN model is ~40KB, and PyTorch CPU inference for a 5→128→64→6 network takes <1ms per forward pass. The primary resource cost is the PyTorch CPU runtime itself (~180MB RAM at idle).

**Recommended plan:** Railway Hobby or Pro. The Hobby plan ($5/month, 8GB RAM, 8 vCPU shared) is more than sufficient for this workload. Even under load, a single instance can handle thousands of requests per second for this model size.

### 5.4 Railway Deployment Workflow

Every push to the configured branch (e.g., `main`) triggers an automatic rebuild and redeploy via Railway's GitHub integration. You can also deploy manually via the Railway CLI:

```bash
cd apps/api
railway up
```

---

## 6. Vercel Deployment (Frontend)

### 6.1 Vercel Project Setup

Vercel auto-detects Bun as the package manager when it finds a `bun.lock` (text format) or `bun.lockb` (binary format) in the project. Both formats are supported with zero configuration. The lockfile must be committed to the repository.

1. Import the monorepo to Vercel (`vercel.com/new`).
2. Set the **Root Directory** to `apps/web`.
3. Set the **Framework Preset** to Next.js (auto-detected).
4. Vercel will auto-detect Bun via the lockfile and use `bun install` + `bun run build` by default. Override only if needed.
5. Add the environment variable `NEXT_PUBLIC_API_URL` pointing to the Railway backend domain.

### 6.2 `vercel.json` (Optional, in `apps/web/`)

```json
{
  "framework": "nextjs",
  "installCommand": "bun install",
  "buildCommand": "bun run build"
}
```

### 6.3 Vercel Deployment Workflow

Vercel auto-deploys on push to `main`. Preview deployments are created for PRs. Each preview deployment gets its own URL, but `NEXT_PUBLIC_API_URL` should point to the same Railway backend (or a Railway preview environment if you set one up).

---

## 7. Monorepo Configuration

### 7.1 Root `package.json`

```json
{
  "name": "pcinn-stack",
  "private": true,
  "workspaces": ["apps/web", "packages/*"],
  "scripts": {
    "dev:web": "bun run --cwd apps/web dev",
    "dev:api": "cd apps/api && uvicorn app.main:app --reload --port 8000",
    "dev": "bun run dev:api & bun run dev:web",
    "build:web": "bun run --cwd apps/web build",
    "lint": "bun run --cwd apps/web lint",
    "lint:web": "bun run --cwd apps/web lint",
    "format": "bun run --cwd apps/web format",
    "format:check": "bun run --cwd apps/web format:check",
    "test:api": "cd apps/api && python -m pytest tests/ -v",
    "docker:build": "docker build -t pcinn-api -f apps/api/Dockerfile .",
    "docker:run": "docker run -p 8000:8000 pcinn-api"
  }
}
```

### 7.2 Root `.gitignore`

```gitignore
# Dependencies
node_modules/
.venv/
__pycache__/
*.pyc

# Build outputs
.next/
out/
dist/

# Environment
.env
.env.local
!.env.example

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Python
*.egg-info/
```

### 7.3 `.env.example`

```bash
# Frontend (set in Vercel dashboard for production)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend (set in Railway dashboard for production)
PORT=8000
ARTIFACTS_DIR=artifacts
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 8. Step-by-Step Implementation Order

This is the recommended order of implementation, designed to get a working end-to-end system as quickly as possible, then iterate.

### Phase 1: Backend Core (Estimated: 3–4 hours)

1. **Initialize the monorepo.** Create the root directory, `package.json` with workspaces, and the directory structure outlined in Section 2.

2. **Set up the Python backend.** Create `apps/api/`, set up a virtual environment (`python -m venv .venv`), install deps from `requirements.txt`. Copy all three model bundle files (`baseline_nn_fold8_bundle.pt`, `pcinn_fold8_bundle.pt`, `sa_pcinn_fold8_bundle.pt`) into `apps/api/artifacts/`. The baseline NN bundle must be exported from the notebook first if it was not already saved — re-run the export cell with all three models.

3. **Reproduce the `NNmodel` class.** In `app/models/nn_model.py`, rewrite the `NNmodel` class exactly as defined in the notebook (5→128→64→6 with tanh activations). This must match the saved state dict architecture byte-for-byte.

4. **Write the inference module.** In `app/models/inference.py`, implement `load_model(path: str)` which loads a bundle, instantiates `NNmodel`, loads the state dict, sets `model.eval()`, and extracts scaler parameters. Implement `predict(predictor, inputs: np.ndarray) -> np.ndarray` which applies min-max scaling, runs the forward pass under `torch.no_grad()`, and inverts the log10 transform on outputs 1–5. Implement `load_all_models(artifacts_dir: str) -> dict` that loads all three bundles and returns a name→predictor mapping. Implement `predict_compare(predictors: dict, inputs: np.ndarray) -> dict` that runs the same input through all three models and returns a dict of results keyed by model name.

5. **Define Pydantic schemas.** In `app/schemas/prediction.py`, define `PredictionRequest`, `PredictionResponse`, `BatchPredictionRequest`, `TimeSeriesRequest`, `TimeSeriesResponse`, and `HealthResponse` with proper field validators. Validators enforce domain bounds from the bundle's scaler min/max (e.g., `temperature_k` between 323.0 and 363.0, `m_molar` between 0.5 and 5.0). Inputs within domain bounds but outside the training data range should trigger a warning, not a rejection.

6. **Build the API routers.** Implement `health.py` and `predict.py` as FastAPI `APIRouter` instances. Wire them into `main.py` under the `/api/v1` prefix.

7. **Add CORS middleware.** Configure `CORSMiddleware` in `app/middleware/cors.py` to allow requests from `localhost:3000` (dev) and the Vercel production domain (read from `ALLOWED_ORIGINS` env var).

8. **Test locally.** Run `uvicorn app.main:app --reload` and verify all endpoints with `curl` or the auto-generated Swagger UI at `/docs`.

### Phase 2: Docker & Railway (Estimated: 1–2 hours)

9. **Write the Dockerfile.** Use the multi-stage build from Section 3.5. Build locally with `docker build -t pcinn-api -f apps/api/Dockerfile .` and verify with `docker run -p 8000:8000 pcinn-api`.

10. **Deploy to Railway.** Create a Railway project, connect the GitHub repo, keep build context at repo root, set `RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile`, configure environment variables, and trigger a deploy. Verify the healthcheck passes and endpoints are reachable at the Railway-provided domain.

11. **Verify CORS.** From a browser console on any page, run a `fetch()` against the Railway endpoint and confirm no CORS errors. This validates the `ALLOWED_ORIGINS` configuration before the frontend is deployed.

### Phase 3: Frontend (Estimated: 4–6 hours)

12. **Scaffold the Next.js app.** Run `bunx create-next-app@latest` in `apps/web/` with TypeScript, Tailwind, App Router, and `src/` directory.

13. **Initialize shadcn/ui.** Run `bunx shadcn@latest init`, then install the required components listed in Section 4.2.

14. **Build the API client.** Write `src/lib/api-client.ts` with typed functions: `predict(input, model?)`, `predictTimeseries(input, model?)`, `predictCompare(input)`, `getModels()`, and `checkHealth()`. Each function constructs the request, calls `fetch`, and parses the response with proper error handling. The `model` parameter defaults to `"sa_pcinn"` and is appended as a query string.

15. **Build the model selector and prediction form.** Create `<ModelSelector />` as a shadcn `<Select>` that fetches available models from `GET /models` on mount and stores the selection in React state. Create `<PredictionForm />` using shadcn `<Form>`, `<Input>`, `<Slider>`, `<Label>`, and `<Button>` components. Wire up React Hook Form + Zod validation. The form accepts the selected model name as a prop. Include both a "Predict" button (single model) and a "Compare All Models" button.

16. **Build the results display.** Create `<ResultsDisplay />` using shadcn `<Card>` and `<Badge>` components. Show conversion as a percentage, molecular weights with SI formatting, dispersity, and a badge indicating which model produced the results.

17. **Build the reaction and comparison charts.** Create `<ReactionChart />` using the shadcn `<Chart>` component (Recharts under the hood) for single-model timeseries plots with dual Y-axes (conversion on left 0–1 scale, Mw on right log scale). Create `<ComparisonChart />` that overlays all three model outputs on the same axes with distinct line colors and a legend. Both charts use `<Tabs>` to switch between "Conversion vs Time" and "Mw vs Time" views.

18. **Compose the pages.** Wire the components into `src/app/page.tsx` (landing) and `src/app/predict/page.tsx` (prediction UI). Add a `<Header />` with navigation.

19. **Set up dark mode.** Follow the shadcn/ui Next.js dark mode guide using `next-themes`. Add a theme toggle button to the header.

20. **Test locally with the Railway backend.** Set `NEXT_PUBLIC_API_URL` in `.env.local` to the Railway domain and run `bun dev`. Verify end-to-end flow: fill form → submit → see results and charts.

### Phase 4: Vercel Deployment & Polish (Estimated: 1–2 hours)

21. **Deploy to Vercel.** Import the monorepo, set root directory to `apps/web`, configure `NEXT_PUBLIC_API_URL` as an environment variable pointing to Railway, and deploy.

22. **Update Railway CORS.** Add the Vercel production domain to `ALLOWED_ORIGINS` in Railway.

23. **Smoke test production.** Visit the Vercel URL, run a prediction, verify the charts render, and confirm no console errors.

24. **CI status (current repo).** A GitHub Actions lint workflow exists at `.github/workflows/lint.yml` and runs `bun run lint` on push/PR. Additional CI checks (`format:check`, `build:web`, `test:api`) are recommended future work.

---

## 9. Input Validation Ranges

The current API implementation enforces a single validation tier: **domain bounds** from schema constraints (scaler-aligned limits). Inputs outside these ranges are rejected by Pydantic with `422 Unprocessable Entity`. Training-range warning headers are not currently implemented.

All values below are in the native model units (mol/L, Kelvin, seconds):

| Feature | Training Data Min | Training Data Max | Domain Bound Min | Domain Bound Max | Unit |
|---------|------------------|------------------|-----------------|-----------------|------|
| [M] | 0.94 | 3.33 | 0.5 | 5.0 | mol/L |
| [S] | 6.67 | 9.06 | 5.0 | 9.5 | mol/L |
| [I] | 0.012 | 0.056 | 0.005 | 0.1 | mol/L |
| T | 333.0 | 353.0 | 323.0 | 363.0 | K |
| t | 1200.0 | 18000.0 | 1.2 | 35854.0 | s |

The training data ranges are included here as scientific context for expected interpolation quality. The enforced limits are the domain bounds reflected in `app/schemas/prediction.py`.

For the frontend, the form displays user-friendly units (°C, minutes) with clear labels showing the conversion being applied. The conversion from the frontend's display units to the API's native units happens client-side in the API client layer:

```
temperature_k = temperature_c + 273.15
time_s = time_min * 60
```

Concentration conversions from grams to mol/L are not implemented in V1 because the dataset uses a non-trivial `[M]+[S]=10` constraint that cannot be naively derived from molecular weights alone. Users must supply molar concentrations directly.

---

## 10. Error Handling Strategy

| Error Scenario | HTTP Code | Behavior |
|----------------|-----------|----------|
| Models failed to load at startup | 503 | `/health/ready` returns 503; all predict endpoints return 503 |
| Invalid `model` query parameter | 400 | `"Unknown model 'foo'. Available: baseline_nn, pcinn, sa_pcinn"` |
| Invalid input values | 422 | Pydantic validation error with field-level details |
| Input outside domain model range | 422 | Pydantic field constraint errors (e.g. `ge`/`le` bounds) |
| Batch exceeds max size | 422 | Pydantic list length validation (`max_length=1000`) |
| Internal inference error | 500 | Logged server-side; generic message to client |
| CORS preflight failure | 403 | Handled by CORSMiddleware |

---

## 11. Security Considerations

1. **CORS:** Restrict `ALLOWED_ORIGINS` to the exact Vercel domain(s). Do not use `*` in production.
2. **Rate limiting:** Consider adding `slowapi` or Railway's built-in rate limiting to prevent abuse. A reasonable default: 100 requests per minute per IP.
3. **Input size limits:** The batch endpoint caps at 1000 inputs. The timeseries endpoint caps at 1000 time steps. These prevent memory exhaustion attacks.
4. **No auth required (initially):** This is a public demo tool. If auth is needed later, add API key validation via a `Depends()` guard.
5. **Non-root Docker user:** The Dockerfile creates and switches to `appuser` to avoid running as root.
6. **No secrets in the image:** All configuration is injected via environment variables at runtime.

---

## 12. Performance Characteristics

| Metric | Expected Value | Notes |
|--------|---------------|-------|
| Model load time | <100ms | 40KB file, CPU tensor deserialization |
| Single prediction latency | <2ms | 5→128→64→6 forward pass on CPU |
| Batch prediction (100 inputs) | <5ms | Vectorized tensor operation |
| Timeseries (100 steps) | <5ms | Same as batch |
| Docker image size | ~450–550MB | PyTorch CPU ~180MB dominates |
| Container cold start | ~3–5s | Python + PyTorch import time |
| Memory at idle | ~220MB | PyTorch runtime + 3 models in memory (~40KB each, negligible) |
| Memory under load | ~250MB | Negligible per-request overhead |

---

## 13. Manual Verification Evidence Checklist

Railway and Vercel runtime state cannot be fully verified from this repository alone. Use this checklist for release sign-off:

- [ ] Railway service URL recorded (example: `https://<service>.up.railway.app`).
- [ ] `GET /api/v1/health` response captured with timestamp.
- [ ] `GET /api/v1/health/ready` returns `200` in production.
- [ ] Railway environment variables confirmed: `ALLOWED_ORIGINS`, `ARTIFACTS_DIR` (and platform-injected `PORT`).
- [ ] Vercel production URL recorded.
- [ ] Vercel env var `NEXT_PUBLIC_API_URL` points to Railway backend URL.
- [ ] Browser CORS verification captured from Vercel frontend to Railway API.
- [ ] End-to-end smoke test captured: predict flow and compare flow.
- [ ] Deployment evidence stored (PR comment, release notes, or internal runbook) with links/screenshots/log excerpts.

---
