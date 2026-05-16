Developer: # GitHub Copilot Instruction

> **Note**: Maintained separately from the main project repository and not tracked by main project version control.

## Purpose

These instructions configure GitHub Copilot Chat for Visual Studio Code. Requirements cover Copilot's intent parsing, change proposals, code operations, and feature use in VS Code (including chat-based edits, agent workflows, and project context awareness).

## Language Requirements

- Source code, comments, and documentation: **English** only.
- Copilot Chat explanations, summaries, and user interactions (outside code/comments/doc): **Korean**.
- Code and documentation: provide code, comments, and doc in English; related explanations in Korean.
- Commit messages: **English**, follow conventional commit standard.

## Atomic Reasoning Framework

When taking action, decompose tasks into atomic steps:

1. **Decompose**: Split the problem into smallest independent units.
2. For each unit:
   - State the component (in Korean unless for code comments/doc, which are in English).
   - Confirm independence and validate correctness individually.
3. **Synthesize**: Combine validated units as final output.

## General Behavior

1. At the start of each chat response, restate user intent in 1–2 Korean sentences (unless needed for code/docs, then use English).
2. For complex requests, apply atomic reasoning first.
3. Propose specifications and a brief test plan before making changes. Use Korean except in code/comments (then use English).
4. Prefer minimal, targeted edits; refactor widely only if requested.
5. Ensure changes are observable, reversible, and testable.
6. Follow all project rules, style, and architectural boundaries.

## VS Code Copilot Chat Workflow

### Chat-Based Editing

- Structure edits for diff-friendliness.
- Group and localize edits by purpose.
- For multi-file changes, explain dependencies and runtime effects.

### Agent Sessions

For long or multi-step tasks:

- Decompose, execute, and verify each step.
- Show intermediate analyses, draft plans, risks, and follow-ups.
- Steps must be testable or loggable.

## Project Context Usage

- Follow repository conventions, lint, imports, and directory structures.
- Match coding language and style to project context.
- Prefer context file/convention over generic best practices.
- Add external dependencies only with explicit project approval.

## Code Generation Rules

1. Source code, comments, docs: English only.
2. Output must meet TypeScript, Solid.js, CSS, and semantic token standards; require approval before new dependencies.
3. Ensure code compiles under strict TypeScript.
4. For UI, follow architectural standards for components/tokens/styling.
5. Use accessors, DI containers, and services rather than direct imports.

## Testing Requirements

For each feature or fix:

- Provide minimal, complete unit tests.
- Default verification order: unit → end-to-end (E2E) → mutation tests.
- There is no active Playwright component-test lane in this workspace; cover UI behavior with focused unit tests and E2E where appropriate.
- Use the existing workspace mocks and test helpers instead of introducing ad-hoc test infrastructure.
- Add accessibility-oriented assertions where practical and keep snapshot/visual naming consistent with repository conventions.

## Safety & Constraints

- No barrel imports (`index.*`); use direct imports. If not possible, contact maintainers.
- No relative parent imports.
- No runtime dynamic imports. Must bundle to a single-file userscript.
- If import restrictions block direct imports, escalate for review.
- Do not generate extra build assets (e.g., JS chunks, CSS, or embedded files) for userscript.
- Avoid Vite/Rollup-triggering asset patterns (e.g., `?url`, `new URL(...)`, `url(...)` in CSS). Use TS strings, small inlined data URLs, or metadata-led remote sources.
- No hardcoded colors or `!important` in styles.
- No touch/pointer events; PC-only.
- All actions must respect platform and performance limits.

## Update Procedure

When changing behavior:

1. Update related documentation.
2. Update relevant tests.
3. Add a brief changelog summary of Copilot's changes and reasons.

## Build, Test, and Lint Commands

### Root workspace (/)
```bash
pnpm install
pnpm build        # prod userscript bundle (runs quality via prebuild)
pnpm build:dev    # dev userscript bundle
pnpm build:fast   # build without quality checks
pnpm check        # tsc (src + tooling)
pnpm lint         # biome lint
pnpm fmt          # biome format check
pnpm quality      # tsc + biome + tsdoc + knip
pnpm verify       # build + test:all
```

### Test workspace (/test)
```bash
cd test
pnpm install
pnpm test         # unit (Vitest)
pnpm test:cov     # unit coverage
pnpm e2e          # Playwright E2E
pnpm mut          # mutation tests (Stryker)
pnpm test:all     # deps:check + unit + e2e + mut:priority
```

### Run a single unit test
```bash
cd test
pnpm test unit/path/to/file.test.ts
pnpm test -- -t "test name"
```

## High-level Architecture

- Entry point: src/main.ts orchestrates staged bootstrap (environment -> developer tooling -> critical systems -> gallery services -> base services -> global events -> gallery init) using modules in src/bootstrap/.
- Feature modules live under src/features/ (gallery, settings) and are wired by bootstrap/gallery-init into the gallery app.
- Shared infrastructure in src/shared/ provides DI helpers, service accessors, components, error handling, events, services, utilities, and styling helpers consumed by features.
- Project-wide constants and environment typings live in src/constants/ and src/types/; global styles are imported in src/main.ts from src/styles/; build tooling lives under tooling/node and tooling/vite/.
- Vite builds a single-file userscript to dist/xcom-enhanced-gallery.user.js (prod) and dist/xcom-enhanced-gallery.dev.user.js (dev).

## Key Conventions

- Two workspaces: root is source/build; test/ is isolated tests. Never import ../src in tests; use test/src mirrored via `pnpm run prepare`.
- Imports: path aliases only, no relative parent imports, no barrel imports (index.*), and no runtime dynamic imports.
- Services and DI: prefer accessor functions from @shared/container/container (getThemeService, getLanguageService, getMediaService, getDownloadOrchestrator) and the canonical singleton/getInstance entry points for shared services; do not use CoreServiceRegistry.
- Events: use EventManager from @shared/services/event-manager; do not use @shared/utils/events/core/listener-manager.
- Solid.js patterns: use splitProps for props, createMemo for derived state, createEffect/onCleanup for side effects, and JSX.EventHandlerUnion for handlers.
- Styling: CSS Modules only; use design tokens (--xeg-*), oklch(), rem/em units; no hardcoded colors or !important.
- Userscript constraints: single-file IIFE output, no code splitting, no GM_* direct calls (use adapters/services), and avoid Vite URL asset patterns (?url, new URL(), url() in CSS).
