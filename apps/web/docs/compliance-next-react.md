# Next + React Best Practices Compliance

This document tracks alignment for:

- `vercel-react-best-practices`
- `next-best-practices`

Status values:

- `Compliant`: implemented and verified in this codebase.
- `N/A`: not applicable to current architecture or feature set.

## Vercel React Best Practices

| Rule                                      | Status    | Notes                                                                                                                                                         |
| ----------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `async-parallel`                          | Compliant | Independent requests use `Promise.all` in `apps/web/src/app/predict/predict-client.tsx` and `apps/web/src/lib/api-client.ts`.                                 |
| `async-defer-await`                       | Compliant | Await is deferred to points of use in client request handlers.                                                                                                |
| `async-api-routes`                        | N/A       | No Next.js route handlers currently in `apps/web/src/app/**/route.ts`.                                                                                        |
| `async-suspense-boundaries`               | N/A       | No streaming server fragments yet; routes are primarily client-interactive surfaces.                                                                          |
| `bundle-dynamic-imports`                  | Compliant | Heavy chart components are lazy-loaded via `next/dynamic` in `apps/web/src/components/comparison-chart.tsx` and `apps/web/src/components/reaction-chart.tsx`. |
| `bundle-barrel-imports`                   | Compliant | `experimental.optimizePackageImports` enabled for heavy packages in `apps/web/next.config.ts`.                                                                |
| `bundle-defer-third-party`                | Compliant | No analytics SDKs are loaded on first render.                                                                                                                 |
| `bundle-conditional`                      | Compliant | Charts are loaded conditionally through dynamic imports and route-level usage.                                                                                |
| `server-serialization`                    | Compliant | Server-provided model metadata is serialized plain JSON (`ModelInfo[]`) from `apps/web/src/app/predict/page.tsx` to client components.                        |
| `server-parallel-fetching`                | N/A       | No multi-source server data dependencies currently require restructuring.                                                                                     |
| `server-cache-react` / `server-cache-lru` | N/A       | No repeated expensive server reads in a single request path yet.                                                                                              |
| `client-swr-dedup`                        | N/A       | SWR is not used; dedupe/cancel is handled explicitly by in-flight request guards.                                                                             |
| `rerender-memo`                           | Compliant | Manual `useMemo`/`useCallback` removed where used previously; React Compiler is enabled.                                                                      |
| `rerender-dependencies`                   | Compliant | Effects use narrowed dependencies and avoid object-wide dependencies where avoidable.                                                                         |
| `rerender-functional-setstate`            | Compliant | No state updates depend on previous values in current flows.                                                                                                  |
| `rerender-lazy-state-init`                | Compliant | Non-trivial initial model selection uses lazy state init in `apps/web/src/app/predict/predict-client.tsx`.                                                    |
| `rendering-conditional-render`            | Compliant | Ternary/null rendering patterns used consistently, not ambiguous `&&` branches.                                                                               |
| `js-*` micro-optimizations                | N/A       | No hot-path loop bottlenecks identified in current app size/profile.                                                                                          |
| `advanced-*` handler-ref patterns         | N/A       | No long-lived global listener/ref callback scenarios requiring these patterns.                                                                                |

## Next.js Best Practices

| Area                         | Status    | Notes                                                                                                                                         |
| ---------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| File conventions             | Compliant | App router structure and special files are correctly placed (`layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`).                      |
| RSC boundaries               | Compliant | No async client components; server-to-client props are serializable.                                                                          |
| Async patterns (Next 15+)    | Compliant | No invalid sync usage of async `params`/`searchParams` APIs.                                                                                  |
| Runtime selection            | Compliant | Defaults to Node runtime; no unnecessary edge declarations.                                                                                   |
| Directives                   | Compliant | `'use client'` applied only where client hooks/browser APIs are needed.                                                                       |
| Data patterns                | Compliant | Model read moved to Server Component fetch in `apps/web/src/app/predict/page.tsx`; mutations/reads against FastAPI remain external API calls. |
| Route handlers               | N/A       | No Next route handlers in this app.                                                                                                           |
| Error handling               | Compliant | Route-level `error.tsx` and `not-found.tsx` are present.                                                                                      |
| Metadata & OG images         | Compliant | Metadata, OG image, sitemap, and robots are implemented under `apps/web/src/app`.                                                             |
| Image optimization           | N/A       | No runtime images are rendered by this UI currently.                                                                                          |
| Font optimization            | Compliant | `next/font/google` is used in `apps/web/src/app/layout.tsx`.                                                                                  |
| Scripts / third-parties      | Compliant | No raw script tags or unsupported script loading patterns.                                                                                    |
| Hydration error prevention   | Compliant | Theme icon rendering uses `suppressHydrationWarning`; theme provider is client-boundary isolated.                                             |
| Suspense boundaries          | N/A       | No `useSearchParams`/`usePathname` CSR bailout patterns requiring explicit Suspense wrappers.                                                 |
| Parallel/intercepting routes | N/A       | App does not use `@slot` or intercepting route patterns.                                                                                      |
| Self-hosting settings        | N/A       | Current deployment target does not require standalone/self-hosting overrides in this pass.                                                    |
