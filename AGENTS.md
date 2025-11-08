# X.com Enhanced Gallery • Developer Guide

Quick onboarding guide. See `docs/` for details.

---

## Project Overview

**X.com Enhanced Gallery**: PC-only userscript for X.com media viewing/downloads

- **v0.4.2** (2025-11-02) | Solid.js 1.9.10, Vite 7, TypeScript 5.9.3
- **Quality**: 2,809 tests, 0 lint warnings, WCAG 2.1 AA

## Setup

```bash
npm ci                    # Install (Node 22+, Linux/WSL)
npm run typecheck         # Verify TypeScript
npm test                  # Run tests
```

**Path Aliases**: `@/constants`, `@features/*`, `@shared/*`, `@assets/*`

## Language Policy

- **Code/Docs**: English only
- **User Responses**: Korean (한국어)
- **Details**: [LANGUAGE_POLICY_MIGRATION.md](docs/LANGUAGE_POLICY_MIGRATION.md)

## Repository Structure

**Git Tracked**: `src/`, `types/`, `.github/`, `LICENSES/`, configs, README
**Local Only**: `docs/`, `test/`, `scripts/`, coverage, logs

**Whitelist approach**: `.gitignore` blocks by default **Details**:
[REPOSITORY_STRUCTURE_IMPLEMENTATION_PLAN.md](docs/REPOSITORY_STRUCTURE_IMPLEMENTATION_PLAN.md)

## Commands

### Quality

```bash
npm run validate:pre      # Typecheck + lint + deps
npm run validate          # validate:pre + prettier
npm run check             # Full: validate + all tests
npm run build             # Build + validate + e2e:smoke
```

### Testing

```bash
npm test                  # Fast batch (unit + smoke)
npm run test:unit:batched # Unit tests (batched, EPIPE-safe)
npm run test:unit         # Unit tests (direct, may fail on Node 22)
npm run test:browser      # Vitest + Chromium
npm run e2e:smoke         # Playwright smoke
npm run e2e:a11y          # Accessibility (axe)
```

**Unit Test Strategy**: Use `test:unit:batched` as default (Phase 368)

- Splits 332 test files into batches (default: 20 files/batch)
- Auto-cleanup between batches (prevents EPIPE errors)
- Node 22 IPC bug workaround (known issue: nodejs/node#32106)

```bash
# Recommended: Batched execution
npm run test:unit:batched

# Options
npm run test:unit:batched -- --batch-size=10  # Smaller batches
npm run test:unit:batched -- --fail-fast      # Stop on first failure
npm run test:unit:batched -- --verbose        # Detailed output

# Legacy: Direct execution (may encounter EPIPE on Node 22)
npm run test:unit
```

### Code Quality

```bash
npm run lint              # ESLint
npm run lint:css          # stylelint
npm run format            # Prettier write
```

**Flow**: Minor edits → `validate:pre` | Logic changes → `test` | Release →
`check`

## Testing Strategy

**Trophy**: Static → Unit (many) → Browser (medium) → E2E (few) → A11y

- **JSDOM**: Fast unit, services, pure functions
- **Browser**: Solid.js reactivity, real DOM
- **E2E**: Full flows, complex interactions

**Vitest Cleanup**: `npm run test:cleanup` (auto in scripts) **Details**:
[TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)

## E2E Testing

**Playwright Configuration**: `playwright.config.ts` (fully documented)

### Harness Pattern

**Structure**: Bundle Solid.js components to be executable in test pages

```typescript
// playwright/harness/index.ts - Test component definition
// playwright/global-setup.ts - Build and injection
// playwright/smoke/utils.ts - ensureHarness() call

// Test usage
test.beforeEach(async ({ page }) => {
  await page.goto('about:blank');
  await ensureHarness(page); // Load harness.js
});

test('setup gallery', async ({ page }) => {
  const harness = page.evaluate(() => window.__XEG_HARNESS__);
  const result = await harness.setupGalleryApp();
  expect(result.initialized).toBe(true);
});
```

### Available APIs

| API                         | Purpose                 | Returns                    |
| --------------------------- | ----------------------- | -------------------------- |
| `setupGalleryApp()`         | Initialize gallery      | `GalleryAppSetupResult`    |
| `setupGalleryApp.dispose()` | Cleanup gallery         | `void`                     |
| `mountToolbar(props?)`      | Mount toolbar component | `ToolbarMountResult`       |
| `disposeToolbar()`          | Cleanup toolbar         | `void`                     |
| `mountErrorBoundary()`      | Mount error boundary    | `ErrorBoundaryResult`      |
| `mountToast()`              | Mount toast manager     | `ToastMountResult`         |
| `evaluateGalleryEvents()`   | Emit keyboard/click     | `GalleryEventsResult`      |
| `simulateKeyboard()`        | Simulate key events     | `KeyboardSimulationResult` |
| `getPerformanceMetrics()`   | Measure performance     | `PerformanceMetrics`       |

### Remount Pattern

**Problem**: Solid.js signals are immutable after render (component cannot
update)

```typescript
// ❌ Doesn't work - component won't re-render
await harness.updateToolbar({ currentIndex: 1 });

// ✅ Use remount - create new with props applied
await harness.disposeToolbar();
await harness.mountToolbar({ currentIndex: 1 });
```

### Environment Variables

| Variable               | Default     | Purpose                                      |
| ---------------------- | ----------- | -------------------------------------------- |
| `PLAYWRIGHT_TEST_DIR`  | `smoke`     | Test directory (smoke/accessibility)         |
| `PLAYWRIGHT_BROWSERS`  | `chromium`  | Browser choice (chromium/firefox/webkit/all) |
| `CI`                   | (undefined) | CI/CD environment detection                  |
| `VERBOSE`              | (undefined) | global-setup detailed logging                |
| `XEG_E2E_HARNESS_PATH` | (auto-set)  | Built harness.js path                        |

### Test Execution

```bash
# Smoke tests (default, fast)
npm run e2e:smoke

# Accessibility tests (axe-core)
npm run e2e:a11y

# All E2E tests
npm run e2e:all

# Cross-browser testing (locally only)
PLAYWRIGHT_BROWSERS=all npm run e2e:smoke

# With detailed logging
VERBOSE=true npm run e2e:smoke
```

### Build & Test Flow

```
npm run build
├─ Build app (vite build)
├─ Validate build (scripts/validate-build.ts)
└─ E2E smoke tests
   ├─ globalSetup: build harness.js (global-setup.ts)
   ├─ Test execution (playwright/smoke/*.spec.ts)
   └─ Report results
```

### Performance Tuning

| Setting        | Local | CI   | Purpose                |
| -------------- | ----- | ---- | ---------------------- |
| workers        | 10    | 4    | Parallel workers       |
| retries        | 0     | 2    | Failed test retries    |
| timeout        | 60s   | 60s  | Max time per test      |
| expect.timeout | 5s    | 5s   | Assertion wait time    |
| actionTimeout  | 10s   | 10s  | DOM interaction wait   |
| fullyParallel  | true  | true | Worker-independent run |

### Debugging

```bash
# Generate HTML report
npm run e2e:smoke -- --reporter=html

# Debug mode (headed browser)
npm run e2e:smoke -- --debug

# Single test
npm run e2e:smoke -- --grep "test name"

# View traces
npm show-trace ./test-results/
```

## Git Hooks

**Pre-commit**: Lint/format staged files (`lint-staged`) **Pre-push**:
Typecheck + tests (configurable)

```bash
# Default: smoke (~20-30s)
git push

# Override
export XEG_PREPUSH_SCOPE='fast'
git config xeg.prepushScope full
```

**Scopes**: `smoke` (default) → `fast` → `unit` → `full`

## CI/CD

- **CI**: Prod build only (validation local)
- **Release**: `validate:pre` → `build` → GitHub Release (auto on version
  change)
- **Security**: Weekly npm audit + license snapshot (non-blocking)

## CodeQL

**CI**: `security-extended` queries (XSS, injection, prototype pollution)
**Local** (optional):

```bash
npm run codeql:check              # Basic
npm run codeql:check -- --report  # + markdown report
```

**Setup**: `gh extension install github/gh-codeql`

## Validation Checklist

1. `npm run validate:pre` - Quick (typecheck, lint, deps)
2. `npm test` - Fast tests
3. `npm run check` - Full validation
4. `npm run build` - Build + e2e
5. `npm run maintenance:check` - Pre-release

**Report**: ✅ Passed (script) or ⚠️ Failed (command + error)

## Architecture

**3 Layers**: `features/` (business) → `shared/` (infra) → `styles/` (tokens)
**Rules**: Features use Shared, not reverse

### Core Principles

1. **Vendor Getters**: `getSolid()`, `getUserscript()`
2. **PC-Only**: No touch/pointer events
3. **Design Tokens**: `oklch()`, `rem`/`em`, `--xeg-*`

### Services (Phase 309+)

| Service               | GM API            | Impact    |
| --------------------- | ----------------- | --------- |
| `PersistentStorage`   | setValue/getValue | -73%      |
| `NotificationService` | notification      | -90%      |
| `DownloadService`     | download          | -75%      |
| `HttpRequestService`  | fetch (MV3)       | Phase 318 |

```typescript
// ✅ Use services
const storage = PersistentStorage.getInstance();

// ❌ No direct GM calls
GM_setValue('key', value);
```

**Details**: [ARCHITECTURE.md](docs/ARCHITECTURE.md),
[CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md)

## Diagnostics

- **Logger**: `@shared/logging` (scoped, timers, correlation)
- **Tracer**: `window.__XEG_TRACE_*` (dev only, tree-shaken)

## File Lifecycle

**Temp**: `docs/temp/`, `scripts/temp/`, `test/archive/` **Forbidden**:
Root-level temp files **Flow**: Draft → `*/temp/` → Stable (Git) → `*/archive/`

## Scripts

- **Node.js only**: No shell scripts (OS compat)
- **ES modules**: `import`, not `require()`
- **Local only**: `scripts/*.js` not in CI
- **CI**: GitHub Actions + npm scripts

## AI Collaboration

**Context**: 3-7 files, signatures, constraints, acceptance tests

**Refactoring Templates**:

- Services: Strategy pattern, Factory, `shared/services/<domain>/**`, getters,
  Vitest
- UI: Container/presentational split, `shared/state/**` Signals, PC-only, CSS
  Modules

## Documentation

- [DOCUMENTATION.md](docs/DOCUMENTATION.md) - Hub
- [CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md) - Patterns
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Structure
- [TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) - Tests
- [SOLID_REACTIVITY_LESSONS.md](docs/SOLID_REACTIVITY_LESSONS.md) - Solid.js

## Troubleshooting

- **Workers**: `npm run test:cleanup`
- **Hooks**: `npm ci` (requires Git)
- **Path aliases**: Check TS/Vite/Vitest `resolve.alias`
- **JSDOM limits**: Use Browser tests or E2E

---

For detailed guidelines, see `docs/CODING_GUIDELINES.md`.
