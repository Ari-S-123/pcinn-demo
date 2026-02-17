# Repository Guidelines

## Project Structure & Module Organization
- `apps/api/` contains the FastAPI backend and PyTorch inference pipeline.
- Backend code is organized under `apps/api/app/` by concern: `routers/`, `schemas/`, `models/`, and `middleware/`.
- Trained model bundles live in `apps/api/artifacts/*.pt`; backend tests are in `apps/api/tests/`.
- `apps/web/` contains the Next.js frontend. Routes are in `apps/web/src/app/`, reusable UI in `src/components/`, and shared helpers/types in `src/lib/` and `src/types/`.
- Root files (`package.json`, `.env.example`, `docker-compose.yml`, `railway.toml`) manage workspace scripts and deployment config.

## Build, Test, and Development Commands
- `bun run dev`: run backend (`:8000`) and frontend (`:3000`) together.
- `bun run dev:web`: run Next.js only.
- `bun run dev:api`: run FastAPI with hot reload.
- `bun run build:web`: create production frontend build (requires outbound network for `next/font/google` fetches).
- `bun run lint`: run ESLint + Prettier checks for the web app.
- `bun run format` / `bun run format:check`: format or validate frontend formatting.
- `bun run test:api`: run full backend pytest suite (requires `apps/api/requirements-dev.txt` installed in your venv).
- `cd apps/api && python -m pytest tests/test_predict.py -v`: run a single test file.
- `bun run docker:build` and `bun run docker:run`: build and run the API container.

## Coding Style & Naming Conventions
- Frontend formatting is enforced with Prettier (`tabWidth: 2`, `semi: true`, double quotes, trailing commas).
- Use kebab-case filenames for frontend components (example: `prediction-form.tsx`) and PascalCase component exports.
- Keep frontend route files in `src/app/` and shared logic in `src/lib/`.
- Python follows PEP 8 conventions: snake_case modules/functions and clear schema-based request/response models.

## Testing Guidelines
- Backend tests use `pytest`, `pytest-asyncio`, and `httpx` ASGI transport.
- Add tests under `apps/api/tests/` with `test_*.py` filenames and `test_*` function names.
- Reuse fixtures from `apps/api/tests/conftest.py` for model loading and async clients.
- Frontend automated tests are not configured yet; include test setup with major UI feature additions.
- CI currently runs lint checks via `.github/workflows/lint.yml`.

## Commit & Pull Request Guidelines
- Current history is minimal (`Initial commit`), so keep commits concise, imperative, and scoped (example: `api: validate model parameter`).
- Keep changes focused by app (`apps/api` or `apps/web`) where practical.
- PRs should include a clear summary, linked issue/task, commands run (`bun run lint`, `bun run test:api`), and UI screenshots when applicable.
- Call out config or model-artifact changes explicitly.

## Security & Configuration Tips
- Start from `.env.example`; never commit secrets.
- Lock down `ALLOWED_ORIGINS` outside local development.
- Treat `apps/api/artifacts/` model bundles as versioned production assets and coordinate updates.
