# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

**X.com Enhanced Gallery** is a PC-only userscript that enables high-quality
media downloads and provides an intuitive vertical scrolling gallery for X.com
(formerly Twitter). Built with modern web technologies:

- **UI Framework**: Solid.js 1.9.10 (fine-grained reactivity)
- **Bundle Size**: 730KB (dev), 328KB (prod, ~89KB gzipped)
- **Quality Assurance**: TypeScript strict, 1115+ passing tests, 0 lint warnings
- **Test Coverage**: Unit (Vitest + JSDOM), Browser (Vitest + Chromium), E2E
  (Playwright), Accessibility (axe-core WCAG 2.1)

## Essential Commands

### Development

```bash
# Install dependencies (always use npm ci, not npm install)
npm ci

# Build (with validation)
npm run build              # Full: build:only + validate-build.ts + e2e:smoke
npm run build:only         # Fast: dev + prod builds without validation
npm run build:dev          # Development mode only
npm run build:prod         # Production mode only

# Validation
npm run validate           # typecheck + lint + format
npm run validate:full      # typecheck + lint + deps + codeql + browser + e2e + a11y

# Type checking
npm run typecheck          # tsgo for main source (fast)
npm run typecheck:tests    # WIP: test directory type errors tracking
```

### Testing

```bash
# Primary test commands
npm test                   # Fast batched tests (default workflow)
npm run test:full          # All test projects (comprehensive)
npm run test:watch         # Fast project in watch mode
npm run test:ui            # Vitest UI

# Test projects (Vitest Projects feature)
npm run test:smoke         # Ultra-fast smoke tests (config/token guards)
npm run test:fast          # Fast unit tests (excludes RED/bench/perf)
npm run test:unit          # Full unit tests
npm run test:browser       # Browser tests (Vitest + Chromium, Solid.js reactivity)
npm run test:styles        # Style/token/policy tests
npm run test:perf          # Performance/benchmark tests
npm run test:phases        # Phase-specific tests
npm run test:refactor      # Refactoring guard tests

# E2E and Accessibility
npm run e2e:smoke          # Playwright smoke tests (Chromium)
npm run e2e:a11y           # Accessibility tests (Playwright + axe-core WCAG 2.1)
npm run e2e:all            # All E2E tests

# Coverage
npm run test:coverage      # Unit coverage with v8 (runs prod build first)

# Worker cleanup (automatic in npm scripts, manual when needed)
npm run test:cleanup       # Clean up Vitest worker processes
```

### Code Quality

```bash
# Linting
npm run lint               # ESLint on src/
npm run lint:fix           # Auto-fix ESLint issues
npm run lint:css           # stylelint on CSS
npm run lint:css:fix       # Auto-fix stylelint issues
npm run lint:md            # markdownlint on Markdown
npm run lint:all           # All linters
npm run lint:all:fix       # Fix all linters

# Formatting
npm run format             # Prettier write
npm run format:check       # Prettier check only

# Security
npm run codeql:check       # Local CodeQL analysis (optional, CI required)

# Dependencies
npm run deps:check         # dependency-cruiser validation (fast)
npm run deps:graph         # Generate JSON + DOT + SVG dependency graph
npm run deps:json          # JSON only (~1-2s, cached)
npm run deps:dot           # JSON + DOT (~2-3s)

# Maintenance
npm run maintenance:check  # Project health check (REQUIRED before commit)
```

## Architecture

### 3-Layer Structure

```
src/
├── main.ts                # Entry point
├── constants.ts           # Global constants (APP_CONFIG, TIMING, SELECTORS, SERVICE_KEYS)
├── bootstrap/             # Bootstrap logic
├── features/              # Feature Layer (business logic)
│   ├── gallery/           # Gallery feature
│   └── settings/          # Settings feature
├── shared/                # Shared Layer (infrastructure)
│   ├── services/          # Service layer (media, download, toast, etc.)
│   ├── components/        # Shared UI components
│   ├── utils/             # Utility functions
│   ├── state/             # Solid.js Signals state management
│   ├── hooks/             # Custom hooks
│   ├── constants/         # i18n system (languages: en, ko, ja)
│   ├── external/          # External integrations (vendors, userscript, browser)
│   └── types/             # Shared type definitions
└── styles/                # CSS & Design Tokens
```

### Dependency Rules

- **Features → Shared** ✅ Allowed
- **Shared → Features** ❌ Forbidden
- **External vendors** must be accessed via getters: `getSolid()`,
  `getUserscript()`

### Import Path Aliases

```typescript
import { ... } from '@/constants';          // Global constants
import { ... } from '@features/gallery';    // Features
import { ... } from '@shared/services';     // Shared services
import { ... } from '@shared/constants';    // i18n system
import { ... } from '@shared/utils';        // Utilities
import { ... } from '@shared/components';   // Components
```

## Critical Development Principles

### 1. Vendor Getter Pattern (MANDATORY)

**Always use getters, NEVER direct imports:**

```typescript
// ✅ CORRECT
import { getSolid, getSolidStore } from '@shared/external/vendors';
const { createSignal, createMemo } = getSolid();

// ❌ FORBIDDEN
import { createSignal } from 'solid-js';
```

**Reason**: TDZ (Temporal Dead Zone) safety, test mocking, dependency injection.

### 2. PC-Only Events (MANDATORY)

**Allowed**: `click`, `keydown`, `keyup`, `wheel`, `contextmenu`, `mouse*`

**Forbidden**: `touchstart`, `touchmove`, `touchend`, `pointerdown`,
`pointerup`, `pointermove`

**Pointer Event Policy** (Phase 242-243):

- Touch events: Globally blocked (all targets)
- Pointer events:
  - Outside gallery: Logging only (preserves native behavior)
  - Inside gallery: Blocked (mouse events only)
  - Exception: Form controls (`select`, `input`, `textarea`, `button`) always
    allowed

### 3. Design Tokens (MANDATORY)

**Always use design tokens, NEVER hardcode:**

```css
/* ✅ CORRECT: Use tokens */
padding: var(--space-md); /* 1rem = 16px */
font-size: var(--font-size-base); /* 0.9375rem = 15px */
border-radius: var(--radius-md); /* 0.375em */
color: var(--xeg-color-primary);
background: oklch(0 0 0 / var(--opacity-overlay-light));

/* ❌ FORBIDDEN: Hardcoded values */
padding: 16px;
color: #1da1f2;
```

**Design Token Hierarchy**:

1. **Primitive** (`design-tokens.primitive.css`): Base values
2. **Semantic** (`design-tokens.semantic.css`): Role-based (`--xeg-*`)
3. **Component** (`design-tokens.component.css`): Component-specific

**Units**:

- **rem**: Absolute sizing (padding, margin)
- **em**: Relative sizing (border-radius, font-dependent)
- **oklch**: Perceptually uniform colors
- **%**: Opacity only

## Testing Strategy

### Test Pyramid (Testing Trophy Model)

1. **Static Analysis** (most): TypeScript, ESLint, stylelint, CodeQL
2. **Unit Tests** (many): Pure functions, services, components (JSDOM, 1-2 min)
3. **Browser Tests** (medium): Solid.js reactivity, real DOM (Vitest + Chromium,
   1-2 min)
4. **Integration Tests** (medium): Multi-service collaboration (JSDOM, 2-5 min)
5. **E2E Tests** (few): Critical user scenarios (Playwright, 5-15 min)
6. **Accessibility Tests** (few): WCAG 2.1 Level AA (axe-core, 1-3 min)

### When to Use Each Test Type

**JSDOM (Vitest)**: Fast unit/integration tests, service logic, pure functions

- ⚠️ **Limitations**: Solid.js reactivity constraints, no CSS layout, partial
  IntersectionObserver

**Browser (Vitest + Chromium)**: Solid.js reactive updates, real DOM behavior

- Use for: Signal/Store updates, fine-grained reactivity, actual rendering

**E2E (Playwright)**: Full user flows, browser-specific APIs, complex
interactions

- Use for: Gallery opening, media navigation, download flows, keyboard shortcuts

**Harness Pattern** (Playwright): Component testing in real browser

- Files: `playwright/harness/index.ts`, `playwright/global-setup.ts`
- API: `window.__XEG_HARNESS__` with mount/dispose functions
- ⚠️ Solid.js reactivity limited in Playwright - prefer remount pattern over
  reactive updates

### TDD Workflow

1. **RED**: Write failing test
2. **GREEN**: Minimal implementation to pass
3. **REFACTOR**: Clean up while maintaining green tests

### Vitest Worker Cleanup (Phase 241)

**Automatic cleanup** via npm scripts (success/failure):

```bash
# Automatic pattern in package.json
"test:unit": "vitest run && npm run test:cleanup || (npm run test:cleanup && exit 1)"
```

**Manual cleanup** (if needed):

```bash
npm run test:cleanup
# or
node ./scripts/cleanup-vitest-workers.js
```

## Common Patterns

### Result<T> Error Handling

```typescript
import { Result } from '@shared/types/result.types';

function processData(input: string): Result<ProcessedData> {
  if (!input) {
    return Result.err('Input is empty');
  }
  return Result.ok({ processed: input });
}

// Usage
const result = processData(input);
if (result.ok) {
  console.log(result.value); // ProcessedData
} else {
  console.error(result.error); // string
}
```

### Logging

```typescript
import { logger } from '@shared/external/logger';

const myLogger = logger.child({ module: 'MyModule' });
myLogger.info('Operation completed', { result: data });
myLogger.error('Operation failed', { error });
```

**Levels**: `trace` (verbose debug) → `debug` (dev) → `info` (normal) → `warn`
(recoverable) → `error` (critical)

### Flow Tracer (Dev-Only Tracing)

**Purpose**: Track event timing during development (completely removed in
production)

**Rules**:

- Dev builds only (`__DEV__` conditional)
- Tree-shaken in production (zero runtime cost)
- PC-only events (click, contextmenu, mousedown/up, keydown/up, wheel throttled)
- Browser API: `window.__XEG_TRACE_START/STOP/POINT/STATUS` (dev only)
- No JSDOM auto-start (UA guard)

**Usage**: Bootstrap and major boundaries (app:init/ready, service init, feature
mount)

## Git Workflow

### Pre-commit Hook

- Runs `lint-staged` on staged files
- Auto-format and lint fixes
- Skips in CI

### Pre-push Hook

- Default: `smoke` tests (~20-30s)
- Configurable scope via env or git config

```bash
# One-time scope override (env var)
export XEG_PREPUSH_SCOPE='full'
git push

# Persistent scope (git config)
git config xeg.prepushScope fast
git push

# Check/unset config
git config --get xeg.prepushScope
git config --unset xeg.prepushScope
```

**Scopes**: `smoke` (default, 20-30s) → `fast` (30-60s) → `unit` (1-2min) →
`full`/`all` (5-10min)

### Work Completion Checklist

**ALWAYS run before committing:**

1. **Code Quality**

   ```bash
   npm run validate    # typecheck + lint + format
   npm test            # All tests with automatic worker cleanup
   ```

2. **Build Validation**

   ```bash
   npm run build       # Full build with validation + E2E smoke
   ```

3. **Maintenance Check** ⭐ REQUIRED

   ```bash
   npm run maintenance:check
   ```

   - Reports: ✅ healthy / ⚠️ action needed (backups, large docs, build size)
   - **AI must report results to user** with recommended actions

4. **Security** (Optional - CI required)

   ```bash
   npm run codeql:check  # Local security analysis (optional)
   ```

## CI/CD Workflows

### CI (`.github/workflows/ci.yml`)

- **Responsibility**: Comprehensive validation for all code changes
- **Node**: 22 (single environment, optimized from Node 22/24 matrix)
- **Steps**: Type check, Lint (JS/CSS/MD), Format, Dependencies, CodeQL, Unit
  tests (coverage), Browser tests (2 shards), E2E, Accessibility, Build
  validation
- **Optimizations**: Browser test sharding (2 shards), Playwright browser
  caching, Node 24 removed
- **Expected CI time**: ~8-10min (40-50% faster than before)

### Release (`.github/workflows/release.yml`)

- **Trigger**: Version change in master or manual
- **Assumes**: CI validation passed
- **Steps**: Smoke tests, Production build, validate-build.js, GitHub Release
  creation
- **Artifacts**: `xcom-enhanced-gallery.user.js`, `checksums.txt`,
  `metadata.json`

### Security (`.github/workflows/security.yml`)

- **Schedule**: Weekly + on-demand
- **Purpose**: Security-only monitoring (npm audit, license reports)
- **Non-blocking**: Does not block PRs

### Maintenance (`.github/workflows/maintenance.yml`)

- **Schedule**: Monthly (1st day, 09:00 UTC)
- **Purpose**: Auto-create maintenance issue
- **Local**: `npm run maintenance:check` (recommended after work)

### CodeQL Analysis

- **CI**: `github/codeql-action@v3` (GitHub Advanced Security) - REQUIRED
- **Local**: `node scripts/check-codeql.js` (optional, fast feedback)
- **Queries**: `security-extended` (XSS, injection, prototype pollution)
- **Results**: GitHub Security tab (Code scanning alerts)

## Important File Locations

### Documentation

- `AGENTS.md` - Development guide, environment setup, scripts
- `docs/DOCUMENTATION.md` - Documentation hub
- `docs/CODING_GUIDELINES.md` - Coding rules, design tokens, PC-only events
- `docs/ARCHITECTURE.md` - 3-layer structure, dependency governance
- `docs/TESTING_STRATEGY.md` - Testing Trophy, JSDOM constraints, test selection
- `docs/DEPENDENCY-GOVERNANCE.md` - dependency-cruiser rules
- `docs/MAINTENANCE.md` - Maintenance checklist
- `docs/TDD_REFACTORING_PLAN.md` - Active refactoring plan
- `.github/copilot-instructions.md` - AI collaboration guidelines

### Configuration

- `vitest.config.ts` - Test configuration (projects, pooling, coverage)
- `tsconfig.json` - TypeScript configuration (strict mode, path aliases)
- `package.json` - Scripts, dependencies, engines (Node >=22)
- `.dependency-cruiser.cjs` - Dependency validation rules
- `vite.config.ts` - Build configuration

### Scripts (`scripts/`)

All scripts are Node.js-based (no shell scripts):

- `validate-build.js` - UserScript validation (CI + Local)
- `check-codeql.js` - CodeQL security analysis (Local only, CI uses GitHub
  Action)
- `maintenance-check.js` - Project health check (Local only)
- `generate-dep-graph.js` - Dependency graph (Local only, JSON/DOT/SVG)
- `cleanup-vitest-workers.js` - Worker cleanup (auto in test scripts)
- `run-all-tests.js` - Full test suite orchestration
- `run-fast-batched.js` - Fast batched test execution

## Build & Bundle

### UserScript Output

- **Dev**: `dist/xcom-enhanced-gallery.dev.user.js` (~730KB)
- **Prod**: `dist/xcom-enhanced-gallery.user.js` (~328KB, ~89KB gzipped)

### Build Validation (`scripts/validate-build.js`)

Checks:

- UserScript headers (@name, @version, @match, @grant)
- Metadata integrity
- PC-only event policy (no touch/pointer events)
- Source maps (dev only)
- No legacy APIs
- Bundle size thresholds

## Key Technologies

- **UI**: Solid.js 1.9.10 (fine-grained reactivity)
- **State**: Solid.js Signals, Stores
- **Build**: Vite 7, esbuild
- **CSS**: CSS Modules, Design Tokens (oklch colors, rem/em sizing)
- **Testing**: Vitest 4 (JSDOM), Playwright (E2E), axe-core (a11y)
- **Types**: TypeScript 5.9.3 (strict mode)
- **Compression**: fflate (high-performance ZIP)
- **Icons**: Heroicons (via vendor getter pattern)

## Common Issues & Solutions

### Vitest Worker Memory

- **Symptom**: Worker processes accumulate, memory leaks, port conflicts
- **Solution**: `npm run test:cleanup` (automatic in npm scripts)

### Git Hooks Not Working

- **Solution**: `npm ci` sets up Husky hooks (requires local Git)

### Path Alias Errors

- **Check**: TS/Vite/Vitest `resolve.alias` consistency
- **Aliases**: `@`, `@features`, `@shared`, `@assets`

### JSDOM Limitations

- **No**: Solid.js fine-grained reactivity, CSS layout, full
  IntersectionObserver
- **Use**: Browser tests (Vitest + Chromium) or E2E (Playwright)

## Development Patterns

### File Naming

- **Components**: PascalCase `.tsx` (e.g., `GalleryApp.tsx`)
- **Utilities**: kebab-case `.ts` (e.g., `media-url.util.ts`)
- **Services**: kebab-case `.service.ts` (e.g., `media-service.ts`)
- **Tests**: kebab-case `.test.ts` (e.g., `media-service.test.ts`)

### Temporary Files Policy

**Allowed locations**:

- `docs/temp/` - Document drafts
- `scripts/temp/` - Experimental scripts
- `test/temp/` - Test experiments
- `test/archive/` - Completed test archives

**Forbidden**: Root-level temp files (`*.log`, `*-output.txt`, `.tsbuildinfo`)

**Lifecycle**:

- Draft → `*/temp/` directory
- Stable → Root directory (Git tracked)
- Complete → `docs/archive/` or `test/archive/` (Git ignored)

## AI Collaboration Tips

### Minimal Context Pattern

When requesting changes, provide:

1. **Files** (3-7 paths)
2. **Types/Signatures** (2-4 lines input/output/error modes)
3. **Constraints** (vendor getter, PC-only, design tokens, TDD)
4. **Acceptance** (3-5 lines: which tests added/modified, what should be GREEN)

### One-Line Refactoring Template

**Services/Logic**:

```
Refactor <feature> behavior with Strategy, creation with Factory, move to `shared/services/<domain>/**`.
External deps via `@shared/external/*` getters. Add/update Vitest. Maintain strict TS/aliases.
```

**UI/Features**:

```
Split <component> into container (wiring) and presentational (view).
State to `shared/state/**` Signals via `@shared/utils/signalSelector`.
PC-only events, CSS Modules + design tokens only.
```

### Quick Checklist

- [ ] Minimal diff proposed?
- [ ] Vendor/Userscript getters used?
- [ ] PC-only events + design tokens?
- [ ] Tests added/modified and GREEN?
- [ ] Completion protocol (Validate/Build/Maintenance)?

---

**For detailed guidelines, always refer to documentation in `docs/` directory,
especially `CODING_GUIDELINES.md` and `ARCHITECTURE.md`.**
