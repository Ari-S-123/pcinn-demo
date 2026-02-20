# PCINN Demo

Full-stack demo application for **Polymer Chemistry Informed Neural Networks (PCINN)** — three trained PyTorch models that predict polymer properties from reaction conditions.

## Architecture

```
pcinn-demo/
├── apps/
│   ├── api/          # FastAPI backend (Python 3.13, PyTorch 2.10)
│   └── web/          # Next.js 16 frontend (React 19, shadcn/ui)
├── .github/
│   └── workflows/
│       └── lint_test.yml  # GitHub Actions lint + test workflow
├── docker-compose.yml
├── railway.toml
└── package.json      # Bun workspaces root
```

### Frontend Architecture (Next.js best-practices)

- App Router pages in `apps/web/src/app/**/page.tsx` are Server Components by default.
- Interactive stateful logic lives in colocated client islands (`*-client.tsx`) with `'use client'`.
- Browser requests call FastAPI directly through `apps/web/src/lib/api-client.ts`.
- Prediction requests run in parallel where possible and support cancellation to avoid stale UI state.
- Route-level resilience/metadata files are enabled (`loading.tsx`, `error.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`).
- Frontend canonical units are Kelvin (`temperature_k`) and seconds (`time_s`), with legacy upload files in °C/min auto-normalized to K/s.

## Models

Three neural network architectures trained on polymer reaction data (fold 8):

| Model | Description | Color |
|-------|-------------|-------|
| **Baseline NN** | Standard feedforward neural network | Green |
| **PCINN** | Physics-Chemistry Informed Neural Network | Blue |
| **SA-PCINN** | Self-Adaptive PCINN with learnable loss weights | Orange |

All models share the same architecture: `Input(5) → Linear(128) → tanh → Linear(64) → tanh → Linear(6)` and predict 6 polymer properties from 5 reaction conditions.

### Inputs

| Parameter | Unit | Range |
|-----------|------|-------|
| [M] Monomer concentration | mol/L | 0.5 – 5.0 |
| [S] Solvent concentration | mol/L | 5.0 – 9.5 |
| [I] Initiator concentration | mol/L | 0.005 – 0.1 |
| Temperature | K | 323 – 363 |
| Time | s | 1.2 – 35,854 |

### Outputs

Conversion, Mn, Mw, Mz, Mz+1, Mv (molecular weight averages in Da), and Dispersity.

Serving semantics:
- The deployed `NNmodel` uses a linear 6-output head (`X_raw`, `log10(Mn)`, `log10(Mw)`, `log10(Mz)`, `log10(Mz+1)`, `log10(Mv)`).
- API `conversion` is post-processed and clipped to the physical range `[0, 1]`.
- API `dispersity` is computed as `Mw/Mn` and clamped to a minimum of `1.0` (physical invariant).
- API `raw_outputs` remain unclipped raw model outputs for diagnostics and reproducibility checks.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- Python 3.13+
- Docker (optional, for containerized backend)

### Backend

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate    # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
# Optional for running tests:
pip install -r requirements-dev.txt
python dev_server.py
```

The API tries to start on `http://localhost:8000` by default. If that port is blocked
or already in use, `dev_server.py` automatically picks the next available port and logs it.
Health check: `GET /api/v1/health`.

### Frontend

```bash
bun install
bun run dev:web
```

The frontend serves at `http://localhost:3000`.

`bun run build:web` requires outbound network access to fetch Google Fonts used by `next/font/google`.

### Run Both Services

Use two terminals:

```bash
# Terminal 1
bun run dev:api

# Terminal 2
bun run dev:web
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev:web` | Start Next.js dev server |
| `bun run dev:api` | Start FastAPI with hot reload and automatic port fallback |
| `bun run build:web` | Production build of frontend |
| `bun run lint` | ESLint + Prettier check (frontend) |
| `bun run format` | Format frontend code with Prettier |
| `bun run format:check` | Check formatting without writing |
| `bun run test:api` | Run backend pytest suite |
| `bun run docker:build` | Build API Docker image |
| `bun run docker:run` | Run API container on port 8000 |

## API Endpoints

All endpoints are prefixed with `/api/v1`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check with model status |
| `GET` | `/health/ready` | Readiness probe |
| `GET` | `/models` | List available models |
| `GET` | `/model/info` | Model details |
| `POST` | `/predict` | Single-point prediction (`conversion` clipped to `[0,1]`, `dispersity` clamped to `>= 1.0`) |
| `POST` | `/predict/batch` | Batch predictions (`conversion` clipped to `[0,1]`, `dispersity` clamped to `>= 1.0`) |
| `POST` | `/predict/timeseries` | Time-series predictions (`conversion` clipped to `[0,1]`, `dispersity` clamped to `>= 1.0`) |
| `POST` | `/predict/compare` | Compare all 3 models (`conversion` clipped to `[0,1]`, `dispersity` clamped to `>= 1.0`) |

## Environment Variables

See `.env.example` for all variables. Key settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | API base URL for frontend |
| `PORT` | `8000` | Backend server port |
| `ARTIFACTS_DIR` | `artifacts` | Path to model `.pt` files |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins (comma-separated) |

## CI

GitHub Actions currently runs `bun run lint` and `bun run test:api` for pushes and pull requests via `.github/workflows/lint_test.yml`.

## Tech Stack

**Backend:** FastAPI 0.129, PyTorch 2.10 (CPU), Pydantic 2.12, Uvicorn 0.40

**Frontend:** Next.js 16.1, React 19.2 (with React Compiler), shadcn/ui, Recharts, Tailwind CSS 4, Zod 4, React Hook Form 7

**Tooling:** Bun workspaces, Prettier, ESLint, Docker
