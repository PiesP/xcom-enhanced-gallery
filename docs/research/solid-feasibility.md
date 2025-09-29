# SolidJS Foundation Feasibility Notes

**Last updated:** 2025-09-27

## 1. Goals

- Validate that the existing Vite + Vitest pipeline can compile SolidJS sources
  alongside the current Preact stack without breaking userscript packaging.
- Design a minimal bridge so Solid components can interact with the existing
  Preact signal store during Stage B migrations.

## 2. Tooling Outcomes

| Item             | Result                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Vite build       | Added `vite-plugin-solid` (scoped to `.solid.*` extensions) and verified `npm run build:dev` succeeds with userscript wrapper intact. |
| Vitest           | Registered the same plugin to guarantee Solid JSX transforms during unit tests. Targeted Solid foundation test suite passes.          |
| TypeScript       | Included `solid-js` ambient types so Solid JSX files resolve without per-file overrides.                                              |
| Dependency graph | `solid-js` installed as runtime dependency; no direct imports outside vendor getters.                                                 |

## 3. Signal Compatibility Adapter

- Introduced `@shared/state/solid-adapter.ts` exposing
  `createSolidSignalAdapter`.
- Adapter behaviour:
  - Mirrors Preact signal updates into Solid accessors via `solid-js` reactive
    primitives.
  - Propagates Solid setter writes back to the originating Preact signal inside
    a batched update.
  - Provides manual disposal and hooks into `onCleanup` when executed inside a
    Solid root.
- Guarded by `test/research/solid-foundation.test.ts`, covering bidirectional
  sync and subscription teardown.

## 4. Verification Summary

- `npx vitest run test/research/solid-foundation.test.ts`
- `npm run typecheck`
- `npm run build:dev`

All checks passed. No regressions observed in existing Preact entry points.

## 5. Next Steps

1. Stage B: begin porting gallery/settings shells to Solid using the adapter and
   `.solid.tsx` entry points.
2. Extend vendor getters with Solid store render helpers across feature services
   as they migrate.
3. Track bundle-size deltas once the first Solid-driven UI is compiled (see
   `metrics/bundle-metrics.json`).
