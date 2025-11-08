# GitHub Copilot Guidelines

AI assistant quick reference. See `docs/` for details.

---

## Project Context

**Solo dev + AI**: 1 developer, AI assistant, no team **Optimization**: Minimal
context (3-7 files), TDD, explicit patterns **Collaboration**: Stateless
sessions, docs-driven

**AI Rules**:

- Complete context required
- Reference docs/patterns
- Include acceptance criteria
- Validate locally

## Language Policy

- **Code/Docs**: English only
- **User Responses**: Korean (한국어)
- **Reference**:
  [LANGUAGE_POLICY_MIGRATION.md](../docs/LANGUAGE_POLICY_MIGRATION.md)

---

## Core Principles

1. **Vendor Getters**: `getSolid()`, `getUserscript()`
2. **PC-Only Events**: No touch/pointer (Phase 242-243)
3. **Design Tokens**: `oklch()` colors, `rem`/`em` sizes, `--xeg-*` vars
4. **Service Layer**: Use Tampermonkey APIs via services (not direct GM calls)

## Service Layer (Phase 309+)

**Pattern**: Singleton services wrap GM APIs

```typescript
// ✅ Use services
import { PersistentStorage, NotificationService } from '@shared/services';
const storage = PersistentStorage.getInstance();

// ❌ No direct GM calls
GM_setValue('key', value);
```

| Service               | Purpose     | Impact    |
| --------------------- | ----------- | --------- |
| `PersistentStorage`   | Storage     | -73%      |
| `NotificationService` | Alerts      | -90%      |
| `DownloadService`     | Downloads   | -75%      |
| `HttpRequestService`  | Fetch (MV3) | Phase 318 |

**Reference**: [ARCHITECTURE.md](../docs/ARCHITECTURE.md)

## Diagnostics (Phase 285-286)

- **Logger**: `@shared/logging` (scoped, timers, correlation)
- **Tracer**: `window.__XEG_TRACE_*` (dev only)
- **Zero prod overhead**: Tree-shaken via `__DEV__`

## Forbidden Patterns

- ❌ Direct vendor imports (use getters)
- ❌ Touch/pointer events
- ❌ Hardcoded colors/sizes
- ❌ Relative imports (use `@shared`, `@features`)
- ❌ Non-English code/docs
- ❌ `require()` in ES modules
- ❌ Direct GM APIs (use services)

## Web Search

**Brave**: API docs, code patterns (`brave_web_search`) **Perplexity**: Current
docs, versions (`perplexity_search`)

## Context Template

- **Files**: 3-7 paths
- **Types**: Signatures (2-4 lines)
- **Constraints**: Getters, PC-only, tokens, services
- **Tests**: What should pass

## Architecture

**3 Layers**: `features/` → `shared/` (services, components, state) → `styles/`
**Rules**: Features can use Shared, not vice versa

## Testing (Trophy)

1. **Static**: TypeScript, ESLint, stylelint
2. **Unit**: JSDOM (fast)
3. **Browser**: Vitest + Chromium (Solid.js)
4. **E2E**: Playwright (flows)
5. **A11y**: axe-core (WCAG 2.1)

**TDD**: RED → GREEN → REFACTOR

**Unit Test Default**: Use `test:unit:batched` (Phase 368)

- Batched execution prevents EPIPE errors on Node 22
- Script: `scripts/run-unit-tests-batched.js` (local only, not in Git)
- 332 test files split into batches (default: 20/batch)
- Options: `--batch-size=N`, `--fail-fast`, `--verbose`

## File Lifecycle

**Temp**: `docs/temp/`, `scripts/temp/`, `test/archive/` only **Forbidden**:
Root-level temp files **Flow**: Draft (`*/temp/`) → Stable (Git) → Archive
(`*/archive/`)

## Validation Checklist

1. `npm run validate:pre` - Quick check (typecheck, lint, deps)
2. `npm test` - Fast tests (unit + smoke)
3. `npm run check` - Full validation (all tests)
4. `npm run build` - Build + e2e:smoke

**Report**: ✅ Passed (script name) or ⚠️ Failed (command + summary)

## Commands

**Quality**: `validate:pre`, `validate`, `check`, `build` **Tests**: `test`,
`test:unit:batched` (default), `test:browser`, `e2e:smoke`, `e2e:a11y` **CI**:
Production build only, validation local

**Note**: Use `test:unit:batched` for unit tests (EPIPE-safe on Node 22)

## Tech Stack

- **v0.4.2** (2025-11-02)
- Solid.js 1.9.10, Vite 7, TypeScript 5.9.3
- 2,809 tests, 0 warnings, WCAG 2.1 AA
