# Contributing to xcom-enhanced-gallery

Thanks for your interest in contributing!

This project follows a modern, test-driven workflow with clear separation of
responsibilities. Please skim this short guide before opening a PR.

## TL;DR

- Use feature branches: `feat/…` or `fix/…`
- Conventional Commits: `type(scope): message`
- TDD: add a failing test, make it pass, refactor
- PC-only input: never use Touch/Pointer events
- Vendors/Userscript: access via getters/adapters only
- Run the quality gate before pushing:
  `npm run validate && npm test && npm run build:prod`

## Development Setup

```pwsh
npm ci
```

Useful scripts (PowerShell friendly):

```pwsh
npm run typecheck
npm run lint:fix
npm test
npm run build:dev
npm run build:prod
```

See AGENTS for full scripts/CI/release details: [AGENTS.md](AGENTS.md)

## Architecture and Rules

- Architecture and layer boundaries:
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Coding guidelines (imports, tokens, PC-only input, TDD):
  [docs/CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md)
- Vendors/Userscript safe API:
  [docs/vendors-safe-api.md](docs/vendors-safe-api.md)

## Commit and PR

- Conventional Commits (examples):
  - `feat(gallery): add vertical view hotkeys`
  - `fix(zip): avoid duplicate names during bulk download`
  - `refactor(state): memoize selectors with computed`
  - `test(userscript): contract for xhr fallback`
- Ensure Husky hooks are installed; do not bypass hooks.
- Open PRs with a clear scope; link any related issue.

## Tests and TDD

- Environment: Vitest + JSDOM; vendors and userscript are injected via
  getters/adapters and can be mocked.
- Add tests under `test/**/*.{test,spec}.{ts,tsx}`.
- Follow the RED → GREEN → REFACTOR loop. Avoid mixing large refactors with
  behavior changes.

## PC-only input and Accessibility

- Allowed: `click`, `keydown/keyup` (ArrowLeft/Right, Home/End, Escape, Space),
  `wheel`, `contextmenu`, mouse events.
- Forbidden: all `Touch*` and `Pointer*` event families.
- Manage scroll/key conflicts via dedicated utilities and `preventDefault()`
  only for intentional actions.

## Build and Userscript

- One-file output principle. Assets are inlined as data URIs; `dist/assets` must
  not be required for runtime.
- Source map comment policy is validated by `scripts/validate-build.js`.
- Userscript header metadata must be consistent with permissions and `@connect`
  domains.

Happy hacking! 🚀
