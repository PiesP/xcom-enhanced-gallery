# Contributing

Thanks for improving **X.com Enhanced Gallery**. Source, comments,
documentation, commit messages, and issue content should be written in English.

## Report an issue

Use the repository issue templates and include:

- Distribution: userscript, Chromium extension, or Firefox extension
- Release version, browser, OS, and userscript manager when applicable
- Exact reproduction steps and expected versus actual behavior
- Relevant console errors with private data removed

Do not report vulnerability details publicly. Follow the
[security policy](./.github/SECURITY.md).

## Development setup

Use the toolchain pinned in `package.json`, or versions that satisfy its
`engines` fields.

```bash
git clone --recurse-submodules https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery
git submodule sync --recursive
git submodule update --init --recursive
pnpm install
```

`packages/core` is a pinned Git submodule. Restore the recorded revision with
`git submodule update --init --recursive`; do not pull inside the detached
submodule. Shared changes belong in the `PiesP/browser-core` repository and must
be integrated here as a reviewed gitlink update.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm build` | Build the production userscript |
| `pnpm build:all:ci` | Build userscript, Chrome, and Firefox outputs |
| `pnpm test` | Run the Vitest suite |
| `pnpm test:cov` | Run tests with coverage thresholds |
| `pnpm test:e2e` | Run the userscript browser flow |
| `pnpm test:e2e:extension` | Run Chrome installed-extension and Firefox artifact/runtime Playwright checks |
| `pnpm test:e2e:extension:firefox` | Run the installed Firefox extension smoke test with Selenium |
| `pnpm test:e2e:all` | Run every userscript and extension browser lane |
| `pnpm quality` | Run formatting, lint, type, dependency, and source checks |
| `pnpm verify` | Run the quality gate and all production builds |
| `pnpm verify:full` | Add coverage and browser tests to `verify` |

Run `pnpm build:e2e` before invoking the browser lanes directly so their
generated userscript and extension inputs are current. `pnpm verify:full`
prepares those artifacts as part of its full gate.

Run the narrowest relevant check while working. Use `pnpm verify` before a
pull request and `pnpm verify:full` for publication-level or browser behavior
changes.

## Project constraints

- Keep the userscript as a single-file IIFE without runtime code splitting.
- Preserve behavior across the userscript and extension platform adapters.
- Access browser and userscript capabilities through established adapters; do
  not call `GM_*` directly from feature code.
- Use strict TypeScript, type-only imports, and alias-based leaf imports across
  folders. Same-folder relative imports are allowed.
- Avoid barrels, runtime dynamic imports, `eval`, unsafe `innerHTML`, string
  timers, and silently swallowed errors.
- Use CSS Modules and the existing `--xeg-*` tokens for themed or repeated
  values. Avoid unnecessary `!important` rules.
- Keep settings migrations, platform cleanup, and download cancellation
  behavior explicit.

## Browser validation

For user-visible changes, verify the affected distribution on X.com and check:

1. Gallery open and close behavior
2. Image and video navigation
3. Single and bulk downloads
4. Settings persistence
5. Console errors and cleanup after X.com navigation

Extension changes should also validate content-script injection and the
generated Chrome and Firefox artifacts. Explain any browser lane that could not
be run.

## Dependency updates

The repository intentionally follows current stable tools after a 24-hour
cooling window. Keep pnpm trust, build-script, and transitive-source controls
enabled. `package.json`, `pnpm-workspace.yaml`, the lockfile, and pinned workflow
references are authoritative.

## Pull requests

Keep changes focused and describe what changed, why it changed, and how it was
validated. Update README or CHANGELOG content when user-visible behavior or
release notes change.

By contributing, you agree that your changes are licensed under the
[project license](./LICENSE).
