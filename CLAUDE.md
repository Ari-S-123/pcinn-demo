# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (concurrent backend + frontend)
bun run dev

# Frontend only
bun run dev:web              # Next.js dev server on :3000
bun run build:web            # Production build
bun run lint                 # ESLint + Prettier check
bun run format               # Prettier write
bun run format:check         # Prettier dry-run

# Backend only
bun run dev:api              # FastAPI with hot reload on :8000
bun run test:api             # All backend tests

# Run a single test file or test
cd apps/api && python -m pytest tests/test_predict.py -v
cd apps/api && python -m pytest tests/test_predict.py::test_predict_valid -v

# Docker
bun run docker:build         # Build API image
bun run docker:run           # Run API container on :8000
```

The backend requires a Python 3.13+ venv at `apps/api/.venv` with `requirements.txt` installed. For tests, also install `apps/api/requirements-dev.txt`. The frontend uses Bun as the package manager.

`bun run build:web` fetches Google Fonts at build time (`next/font/google`), so outbound network access is required in CI/sandbox environments.

## Architecture

Bun workspaces monorepo with two apps:

- **`apps/api/`** — FastAPI backend serving PyTorch model inference
- **`apps/web/`** — Next.js 16 frontend with React 19 and React Compiler

### Backend: Inference Pipeline

Three trained PyTorch models (`apps/api/artifacts/*.pt`) share the same architecture: `Input(5) → Linear(128) → tanh → Linear(64) → tanh → Linear(6)`. The inference pipeline in `app/models/inference.py`:

1. **Min-max scale** inputs using per-model scaler ranges stored in the `.pt` bundle
2. **Forward pass** through `NNmodel` (defined in `app/models/nn_model.py`)
3. **Post-process outputs**:
   - conversion head is linear in the model (`X_raw`) and is clipped to `[0,1]` for the served `conversion` field
   - molecular weights are `10^(raw_output)` (log10 reversal)
   - dispersity is computed as `Mw/Mn`
4. **Expose diagnostics**: `raw_outputs` returns unclipped raw model head values

Models are loaded once at startup via FastAPI's lifespan context manager (`app/main.py`) into `app.state.predictors`.

### Backend: API Surface

All endpoints under `/api/v1`. Key routes in `app/routers/predict.py`:

- `POST /predict` — single-point prediction
- `POST /predict/timeseries` — predictions across a time range (builds batch with `np.linspace`)
- `POST /predict/compare` — runs timeseries on all 3 models simultaneously
- `GET /models` — list available models with metadata
- `GET /model/info` — model architecture + served output constraints (`conversion` clipped, `raw_outputs[0]` raw)

Request validation uses Pydantic with domain bounds (e.g., `m_molar: 0.5-5.0`, `temperature_k: 323-363`). Schemas are in `app/schemas/prediction.py`.

### Frontend: Unit Conversion

The form displays user-friendly units (°C, minutes) while the API expects scientific units (K, seconds). `src/lib/validation.ts` defines the Zod schema with display-unit ranges and `toApiUnits()` handles conversion before API calls.

### Frontend: Key Patterns

- **React Compiler** is enabled (`next.config.ts`). In app feature code, avoid manual `React.memo()`, `useMemo()`, and `useCallback()` unless there is a measured need.
- **Charts** (Recharts) are lazy-loaded via `next/dynamic` with `ssr: false`. The wrapper components (`reaction-chart.tsx`, `comparison-chart.tsx`) import from `charts/*-inner.tsx`.
- **Time-series chart axes** use numeric x-axes (`type=\"number\"`) with sparse ticks to avoid cramped labels; conversion y-axes are fixed to `[0,1]`.
- **Parallel fetching**: The predict page uses `Promise.all([predict(), predictTimeseries()])`. The API client (`src/lib/api-client.ts`) also uses `Promise.all` in `getInitialData()`.
- **Conditional rendering** in app components should prefer ternary operators over `&&` for clarity.
- **Landing page** (`src/app/page.tsx`) is a Server Component — no `"use client"`.
- **Model colors**: baseline_nn = green (`#22c55e`), pcinn = blue (`#3b82f6`), sa_pcinn = orange (`#f97316`). CSS vars defined in `globals.css`.
- **Fonts**: JetBrains Mono (data/numbers) + IBM Plex Sans (body text), loaded via `next/font/google`.
- **Toast notifications** use Sonner (not the deprecated shadcn toast).
- **Zod v4** is installed — imports use `from "zod/v4"`.

### Testing

Backend tests use pytest with `asyncio_mode = "auto"`. The `conftest.py` fixture manually loads models into `app.state` because httpx's `ASGITransport` does not trigger FastAPI's lifespan handler.

## CI

GitHub Actions workflow lives at `.github/workflows/lint_test.yml` and runs both `bun run lint` and `bun run test:api` on push and pull request.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | API base URL for frontend |
| `PORT` | `8000` | Backend server port |
| `ARTIFACTS_DIR` | `artifacts` | Path to model `.pt` files |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS origins (comma-separated) |
