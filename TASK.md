# PCINN Demo — Bug Fix Task

This document describes two bugs in the PCINN demo webapp that need to be fixed. Read the repository's `AGENTS.md` thoroughly before making any changes — it contains critical architectural context, coding conventions, file locations, and testing instructions.

---

## Table of Contents

1. [Background Context](#1-background-context)
2. [Bug 1: Dispersity Not Clamped to Physical Minimum](#2-bug-1-dispersity-not-clamped-to-physical-minimum)
3. [Bug 2: Missing Model Outputs in Frontend Comparison Table](#3-bug-2-missing-model-outputs-in-frontend-comparison-table)
4. [Testing Requirements](#4-testing-requirements)
5. [Documentation Updates](#5-documentation-updates)
6. [Files You Must Not Modify](#6-files-you-must-not-modify)

---

## 1. Background Context

### What the Model Produces

The deployed `NNmodel` (defined in `apps/api/app/models/nn_model.py`) has a 6-neuron linear output head with no activation function. The 6 raw outputs are:

| Column | Raw Output    | Post-Processing Applied in `inference.py`      |
| ------ | ------------- | ---------------------------------------------- |
| 0      | `X_raw`       | Clipped to `[0, 1]` → served as `conversion`   |
| 1      | `log10(Mn)`   | `10^(value)` → served as `mn` (Daltons)        |
| 2      | `log10(Mw)`   | `10^(value)` → served as `mw` (Daltons)        |
| 3      | `log10(Mz)`   | `10^(value)` → served as `mz` (Daltons)        |
| 4      | `log10(Mz+1)` | `10^(value)` → served as `mz_plus_1` (Daltons) |
| 5      | `log10(Mv)`   | `10^(value)` → served as `mv` (Daltons)        |
| —      | (derived)     | `mw / mn` → served as `dispersity`             |

### The Physical Constraints

These are non-negotiable physical laws from polymer chemistry:

- **Conversion** must be in `[0, 1]`. Already enforced via clipping in `inference.py`.
- **Dispersity (Đ = Mw / Mn)** must be `≥ 1.0`. This is a mathematical identity — by definition, the weight-average molecular weight is always ≥ the number-average molecular weight. A perfectly monodisperse polymer (all chains identical length) has Đ = 1.0 exactly. Values below 1.0 are physically impossible.
- **Molecular weight ordering**: `Mn ≤ Mw ≤ Mz ≤ Mz+1` always holds by definition. This is noted here for context but does **not** need to be enforced in this task — only dispersity clamping is required.

### Why Dispersity Can Violate the Constraint

The model predicts `log10(Mn)` and `log10(Mw)` via two **independent output neurons** with no structural coupling. There is nothing in the architecture preventing a prediction where `log10(Mw) < log10(Mn)`, which yields `Mw < Mn` and therefore `Đ < 1`. The PCINN and SA-PCINN models are less likely to produce this violation (their Jacobian regularization from the theory model implicitly encodes the correct ordering), but the baseline NN has no such guardrail and can produce `Đ < 1` on edge-case or out-of-distribution inputs.

### What the Frontend Currently Displays

The API returns **8 fields** per prediction point: `conversion`, `mn`, `mw`, `mz`, `mz_plus_1`, `mv`, `dispersity`, and `raw_outputs`. However, the frontend's "Final Predictions (At End Time)" comparison table currently only displays **4 of these**: Conversion, Mn, Mw, and Dispersity. The remaining three molecular weight averages — **Mz, Mz+1, and Mv** — are silently dropped by the frontend rendering code. They should be displayed.

---

## 2. Bug 1: Dispersity Not Clamped to Physical Minimum

### Problem

The inference pipeline in `apps/api/app/models/inference.py` computes dispersity as `Mw / Mn` after reversing the log10 transformation. If the model predicts `log10(Mw) < log10(Mn)` (which is physically impossible but architecturally unconstrained), the resulting dispersity will be less than 1.0. The API currently returns this invalid value without any clamping.

### Required Fix

**File:** `apps/api/app/models/inference.py`

Locate the line where `dispersity` is computed (it will be something like `dispersity = mw / mn` or equivalent). After this computation, clamp the result to a minimum of `1.0`:

```python
dispersity = max(dispersity, 1.0)
```

Or, if dispersity is computed in a vectorized/batch context (e.g., over a NumPy array):

```python
dispersity = np.maximum(dispersity, 1.0)
```

This must apply to **all code paths** that produce dispersity — verify that single-point predictions (`/predict`), batch predictions (`/predict/batch`), timeseries predictions (`/predict/timeseries`), and compare predictions (`/predict/compare`) all flow through the same post-processing function in `inference.py`. If they do, a single fix at the point of computation is sufficient. If any endpoint computes dispersity independently, that code path must also be patched.

### Pydantic Schema Update

**File:** `apps/api/app/schemas/prediction.py`

The `PredictionResponse` model currently defines:

```python
dispersity: float = Field(..., description="Molecular weight dispersity (Mw/Mn).")
```

Update this to add a minimum constraint and clarify the description:

```python
dispersity: float = Field(
    ...,
    ge=1.0,
    description="Molecular weight dispersity (Mw/Mn), clamped to a minimum of 1.0.",
)
```

Also update the `dispersity` field in the `TimeSeriesData` model in the same file:

```python
dispersity: list[float] = Field(
    ...,
    description="Dispersity series (Mw/Mn), each point clamped to a minimum of 1.0.",
)
```

And update the `dispersity` field in `TimeSeriesResponse` similarly:

```python
dispersity: list[float] = Field(
    ...,
    description="Dispersity series (Mw/Mn), each point clamped to a minimum of 1.0.",
)
```

### Why This Fix Is Correct

The clipping happens at **serving time**, not during training. The model's weights are frozen — this is a pure post-processing step that enforces a physical invariant on the derived quantity. This is exactly the same pattern already used for conversion clipping (column 0 is clamped to `[0, 1]` in `inference.py`). The `raw_outputs` field continues to expose the unclipped raw model head values for diagnostics.

---

## 3. Bug 2: Missing Model Outputs in Frontend Comparison Table

### Problem

The API's `/predict/compare` endpoint (and all prediction endpoints) returns all 7 polymer properties: `conversion`, `mn`, `mw`, `mz`, `mz_plus_1`, `mv`, and `dispersity`. However, the frontend's "Final Predictions (At End Time)" table — visible on the compare/predict page — only renders 4 columns: **Conversion**, **Mn (Da)**, **Mw (Da)**, and **Dispersity**. The three remaining outputs are missing from the UI:

- **Mz** — Z-average molecular weight (Da)
- **Mz+1** — (Z+1)-average molecular weight (Da)
- **Mv** — Viscosity-average molecular weight (Da)

These are legitimate, scientifically meaningful outputs that the model predicts and the API serves. They should be visible to users.

### Where to Find the Relevant Frontend Code

The frontend is in `apps/web/`. Based on the repository's CLAUDE.md:

- Pages are in `apps/web/src/app/**/page.tsx` (Server Components).
- Interactive client logic is in colocated `*-client.tsx` files with `'use client'`.
- The API client is at `apps/web/src/lib/api-client.ts`.
- Chart wrappers are in `reaction-chart.tsx` and `comparison-chart.tsx`, importing from `charts/*-inner.tsx`.

You need to find the component that renders the "FINAL PREDICTIONS (AT END TIME)" table. This is likely in one of the client components on the predict or compare page. Search for strings like `"FINAL PREDICTIONS"`, `"AT END TIME"`, `"Mn"`, or `"Dispersity"` to locate it.

### Required Fix

Once you locate the component rendering the final predictions table, add the three missing columns. The data is already available in the API response — the frontend just needs to render it.

#### Column Definitions for the Missing Outputs

| Field Key   | Column Header | Unit | Format                                     | Description                        |
| ----------- | ------------- | ---- | ------------------------------------------ | ---------------------------------- |
| `mz`        | Mz (Da)       | Da   | Locale-formatted integer (e.g., `123,456`) | Z-average molecular weight         |
| `mz_plus_1` | Mz+1 (Da)     | Da   | Locale-formatted integer (e.g., `123,456`) | (Z+1)-average molecular weight     |
| `mv`        | Mv (Da)       | Da   | Locale-formatted integer (e.g., `123,456`) | Viscosity-average molecular weight |

#### Column Ordering

The table should display columns in this order, which matches the physical meaning (conversion first, then molecular weight averages in increasing order of their sensitivity to high-MW chains, then the derived dispersity last):

1. **Conversion** — fraction, displayed as percentage
2. **Mn (Da)** — number-average molecular weight
3. **Mw (Da)** — weight-average molecular weight
4. **Mz (Da)** — z-average molecular weight ← NEW
5. **Mz+1 (Da)** — (z+1)-average molecular weight ← NEW
6. **Mv (Da)** — viscosity-average molecular weight ← NEW
7. **Dispersity** — Mw/Mn ratio

#### Formatting

Match the existing formatting conventions used for `mn` and `mw`:

- Molecular weights (Mn, Mw, Mz, Mz+1, Mv) should all use the same locale-formatted integer display (e.g., `47,164`).
- Dispersity should remain formatted as a decimal to 3 places (e.g., `1.782`).
- Conversion should remain formatted as a percentage (e.g., `34.9%`).

#### Responsive Design Consideration

Adding 3 new columns makes the table 7 columns wide, which may be too wide for small screens. Evaluate whether the table needs horizontal scrolling or a responsive layout adjustment after adding the columns. If the existing table already handles overflow gracefully (e.g., via `overflow-x-auto` on a parent container), this may already be handled. If not, add horizontal scroll support.

### Also Check: Charts and Timeseries Views

The same missing-outputs issue may extend beyond the comparison table. Check whether the timeseries charts and single-prediction result cards also omit Mz, Mz+1, and Mv. If they do, add them there too:

- **Single prediction result card** (the result shown after a single-point `/predict` call): Check if it displays all 7 properties or only a subset.
- **Timeseries charts** (the charts shown for `/predict/timeseries` and `/predict/compare`): These currently plot conversion and possibly molecular weight curves. Check whether Mz, Mz+1, and Mv timeseries are plotted or omitted. If omitted, they should be added as additional chart series or as separate sub-charts, following the existing chart patterns for Mn and Mw.

This is secondary to fixing the comparison table — fix the table first, then audit the rest of the UI.

---

## 4. Testing Requirements

### Backend Tests for Dispersity Clamping

**File:** `apps/api/tests/test_predict.py` (or create a new test file if appropriate)

Add test cases that verify dispersity is never returned below 1.0. The approach:

1. **Direct unit test of `inference.py`**: If possible, construct a mock predictor whose model weights are rigged to produce `log10(Mw) < log10(Mn)` for a known input, then verify the returned dispersity is exactly `1.0`. This may be complex to set up.

2. **Schema validation test**: Since the Pydantic schema now has `ge=1.0` on the `dispersity` field, any response with dispersity < 1.0 would fail Pydantic validation. Add a test that directly constructs a `PredictionResponse` with `dispersity=0.9` and asserts that Pydantic raises a `ValidationError`.

3. **Integration test via the API**: If existing test fixtures produce predictions, assert that `response.json()["dispersity"] >= 1.0` in all prediction endpoint tests. This should be added as an assertion to all existing prediction tests.

Run tests with:

```bash
cd apps/api && python -m pytest tests/ -v
```

### Frontend: Manual Verification

After making frontend changes:

1. Run `bun run dev` (both web and api) and navigate to the compare page (Using the Chrome Developer Tools MCP).
2. Verify the "Final Predictions (At End Time)" table now shows all 7 columns.
3. Verify column ordering matches: Conversion, Mn, Mw, Mz, Mz+1, Mv, Dispersity.
4. Verify number formatting is consistent across all molecular weight columns.
5. Test on a narrow viewport to ensure the table remains usable (horizontal scroll if needed).
6. Run `bun run lint` and `bun run build:web` to ensure no regressions.

---

## 5. Documentation Updates

### CLAUDE.md

In the **Backend: Inference Pipeline** section, step 3 ("Post-process outputs"), update the dispersity bullet from:

> - dispersity is computed as `Mw/Mn`

to:

> - dispersity is computed as `Mw/Mn` and clamped to a minimum of `1.0`

### README.md

In the **Outputs** section, update the line about serving semantics. Add a new bullet:

> - API `dispersity` is computed as `Mw/Mn` and clamped to a minimum of `1.0` (physical invariant: dispersity ≥ 1 by definition).

In the **API Endpoints** table, update the descriptions for `/predict`, `/predict/batch`, `/predict/timeseries`, and `/predict/compare` to note that both conversion and dispersity are clamped:

> Single-point prediction (`conversion` clipped to `[0,1]`, `dispersity` clamped to `≥ 1.0`)

---

## 6. Files You Must Not Modify

- **`apps/api/app/models/nn_model.py`** — The model architecture is defined by the research paper and must not be altered.
- **`apps/api/artifacts/*.pt`** — The trained model weights are frozen artifacts exported from the research notebook. Do not retrain, re-export, or modify these files.
- **`apps/api/app/routers/predict.py`** — The routing logic should not need changes for either bug. The dispersity fix belongs in `inference.py` (post-processing), not in the router. The frontend fix is purely in `apps/web/`. Only modify this file if you discover that some endpoint computes dispersity independently outside of `inference.py`, which would indicate a deeper structural issue that should be noted.
