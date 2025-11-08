# Test Comprehensive Review — Final Edition

## Landscape Snapshot
- **Unit (Vitest, JSDOM)** — Batched runner (`npm run test:unit:batched`) completes 23/23 batches; residual failing suites documented for Phase 361 repair.
- **Browser (Vitest + Chromium harness)** — `npm run test:browser` verifies Solid integration points and gallery scaffolding.
- **E2E (Playwright smoke)** — Bundled with `npm run build`; harness bootstrap validated post service consolidation.
- **Static analysis** — `npm run validate:pre` gate (TypeScript + ESLint + dependency audit) remains green after each phase merge.

## Batched Runner Insights
1. Batch size defaults to 20 files; execution time ≈ 2m30s on Node 22.
2. `scripts/run-unit-tests-batched.ts`, `scripts/cleanup-vitest-workers.ts`, and `scripts/run-vitest-project.ts` remain the canonical local tooling stack.
3. Known flaky groups: settings persistence mocks (Phase 361) and download orchestration edge cases; both isolated for dedicated follow-up.

## Remediation Checklist
- [ ] Patch the Phase 361 flaky suites and re-run `npm run test:unit:batched -- --fail-fast`.
- [ ] Extend coverage for PersistentStorage-backed services after StorageAdapter deletion.
- [ ] Regenerate dependency graph via `npm run deps:json` once remediation lands.

## Reference Commands
| Purpose | Command |
| --- | --- |
| Quick validation | `npm run validate:pre` |
| Batched unit tests (default) | `npm run test:unit:batched` |
| Batched unit tests (verbose) | `npm run test:unit:batched -- --verbose` |
| Browser regression | `npm run test:browser` |
| Build + smoke | `npm run build` |

Report owner: Solo dev + AI pairing · Last updated: 2025-11-07
