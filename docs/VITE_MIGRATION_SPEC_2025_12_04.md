# Vite 8 Migration Spec (2025-12-04)

> Source reference: [Vite main branch migration guide](https://main.vite.dev/guide/migration)

## Goals

1. Align the build pipeline with the Rolldown + Oxc stack introduced in Vite 8.
2. Remove deprecated configuration fields to avoid runtime warnings and future breakages.
3. Preserve the existing userscript build semantics (single IIFE bundle, custom header + style injector) while adopting the new APIs.
4. Ensure our automation scripts (`scripts/verify-pipeline.ts`) remain compatible with the updated configuration surface.

## Scope & Non-goals

- **In scope**: `vite.config.ts`, build-time scripts referencing Vite APIs, dependency declarations in `package.json`, and any polyfills or helpers impacted by the migration.
- **Out of scope**: Runtime feature changes inside `src/` unless a regression is detected during the migration.

## Specifications

### 1. Oxc Transformer Adoption
- Replace the deprecated `esbuild` configuration block with the new `oxc` options.
- Mirror the previous behavior by:
  - Preserving JSX control (`jsx: 'preserve'`, `jsxImportSource: 'solid-js'`).
  - Transferring `tsconfigRaw.compilerOptions.useDefineForClassFields = false`.
- Ensure the fallback path gracefully handles decorators if we later add the optional Babel/SWC workaround hooks.

### 2. Rolldown Build Options
- Rename `build.rollupOptions` to `build.rolldownOptions`.
- Preserve all nested properties (`input`, `output`, `treeshake`, `maxParallelFileOps`) and ensure type compatibility.
- Verify that IIFE output configuration stays intact and that the userscript wrapper still receives a single chunk.

### 3. Future-proof Dep Optimization
- Audit the `optimizeDeps` block for `esbuild`-only options. None exist today, but we must document that the compatibility shim will disappear and add a regression test that fails if someone reintroduces `esbuildOptions`.

### 4. Dependency Surface Cleanup
- Remove the direct `esbuild` devDependency unless another tool in the repo still requires it (verify with `depcheck`).
- Document that optional fallbacks (e.g., `build.minify: 'esbuild'`) are intentionally unavailable so future contributors know to install `esbuild` manually if needed.

### 5. Documentation Updates
- Capture the behavior changes and manual verification steps in a new spec so QA can trace why the pipeline changed.

## Acceptance Criteria

1. `npm run build` completes without warnings about deprecated Vite configuration keys.
2. Userscript bundles (`dist/xcom-enhanced-gallery*.user.js`) are byte-for-byte deterministic relative to the previous build except for timestamped metadata.
3. The config does not rely on `esbuild` when the mainline Vite build is detected (the legacy shim is isolated to the `rolldown-vite` preview fallback).
4. TypeScript type checks succeed without casting away new `vite` typedefs.

## Implementation Notes (2025-12-04)

- Added feature detection that checks the installed `vite` package name or an override via `XEG_FORCE_VITE_FLAVOR`. When the compatibility build (`rolldown-vite`) is active we retain the legacy `esbuild` shim; otherwise we emit the forward-looking `oxc` options.
- Introduced conditional wiring for `build.rollupOptions` vs. `build.rolldownOptions` so that the config remains valid on both the preview toolchain and the future Vite 8 releases.
- Added regression tests under `test/unit/config/vite-config.test.ts` to ensure the config toggles the correct transformer/bundler knobs and to block reintroducing `optimizeDeps.esbuildOptions`.

## Test Plan

| Test | Purpose |
| --- | --- |
| `npm run typecheck` | Ensure Vite config type inference is still sound after switching APIs. |
| `npm run lint` | Catch any newly introduced style or import violations. |
| `npm run test:fast` | Quick regression net to ensure Solid components still mount under the new build assumptions. |
| `npm run build` | Full pipeline verification (required by Definition of Done). |

## Manual Verification Scenarios

1. Load the dev userscript build via `npm run build:dev` and confirm the gallery still injects styles without console errors.
2. Toggle the `XEG_ENABLE_BUNDLE_ANALYSIS` flag to ensure optional plugins do not crash under Rolldown.
3. Confirm that the generated metadata header still embeds the correct semantic version.
