# Contributing to X.com Enhanced Gallery

Thank you for your interest in contributing to **X.com Enhanced Gallery**. This
document describes a minimal, practical workflow for reporting issues and
submitting pull requests.

> **Language policy**: All source code, comments, commit messages and
> documentation in this repository must be written in **English**.

---

## How to report issues

- Use the **Bug report** or **Feature request** issue templates if available.
- Include:
  - A clear description of the problem or idea
  - Steps to reproduce (for bugs)
  - Your browser, OS, and userscript manager
  - The script version (from the userscript header or GitHub release tag)

Security-sensitive issues should follow the dedicated process described in:

- [Security Policy](.github/SECURITY.md)

---

## Development basics

### Prerequisites

- [Node.js](https://nodejs.org/) **24.x** or later (recommended via [Volta](https://volta.sh/))
- [pnpm](https://pnpm.io/) **10.x** or later

### Local setup

```bash
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery
pnpm install
```

#### Supply chain security controls

This repository enables pnpm client-side supply chain protections to reduce the risk
of npm ecosystem attacks that execute code during installation.

Key policies (configured in `pnpm-workspace.yaml`):

- **Release cooldown**: `minimumReleaseAge` delays newly published versions.
- **Reviewed install scripts**: `strictDepBuilds` + `allowBuilds` require explicit review
  of dependency install scripts. Entries in `allowBuilds` are either:
  - `true` (allowed to run), or
  - `false` (explicitly disallowed, but considered reviewed).
- **Trust downgrade protection**: `trustPolicy: no-downgrade` blocks versions whose
  publish trust evidence is weaker than prior releases.
- **No exotic transitive sources**: `blockExoticSubdeps` prevents transitive
  dependencies from using git/tarball URLs.

If installation fails due to these controls, do not disable them globally.
Instead, update `allowBuilds` (and, if needed, the `*Exclude` settings) with a
documented exception after reviewing the package and the specific version.

### Common commands

```bash
# Production build (userscript bundle with quality checks)
pnpm build

# Development build
pnpm build:dev

# Quick build (skip quality checks)
pnpm build:fast

# TypeScript typecheck
pnpm check

# Lint source code
pnpm lint

# Format check
pnpm fmt:check

# Unused code/dependency checks
pnpm knip

# Run all quality checks
pnpm quality
```

These tasks are defined in `package.json` and use the project configuration
(`tsconfig*.json`, `biome.jsonc`, build scripts).

---

## Editor setup (VSCode)

For the best development experience, configure VSCode to use the same
lint/format rules as the CLI (`pnpm lint`, `pnpm fmt`,
`pnpm biome:check`).

### Recommended extensions

- **biomejs.biome** - Biome linter and formatter
- **esbenp.prettier-vscode** - Prettier for Markdown/YAML

### Recommended settings

Add these settings to your `.vscode/settings.json`:

```json
{
  "biome.enabled": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "always",
    "source.organizeImports.biome": "always"
  },
  "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
  "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[json]": { "editor.defaultFormatter": "biomejs.biome" },
  "[jsonc]": { "editor.defaultFormatter": "biomejs.biome" },
  "[markdown]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }
}
```

This ensures:

- **Format on save** uses Biome (same as `pnpm fmt` /
  `pnpm biome:check`)
- **Lint rules** match the CLI (`biome.jsonc` configuration)
- **Auto-fix** applies safe fixes on save

---

## Coding guidelines

Please keep changes small, focused, and consistent with the existing codebase.

- **TypeScript & Solid.js**

  - Use modern TypeScript and Solid.js patterns already present in `src/`.
  - Prefer functional components and hooks/utilities consistent with existing
    files.

- **Path imports**

  - Use configured **path aliases** (e.g. `@shared/...`, `@features/...`) for
    internal imports instead of long relative paths.

- **GM / userscript APIs**

  - Do **not** call Greasemonkey/Tampermonkey APIs (e.g. `GM_*`) directly from
    feature code.
  - Use the existing service singletons (e.g. storage, notification, download,
    HTTP services) where applicable.

- **Security & safety**

  - Do not introduce dynamic code execution (`eval`, `new Function`,
    `setTimeout`/`setInterval` with string arguments, etc.).
  - Avoid unsafe DOM patterns such as unsanitized `innerHTML`.
  - Follow the practices described in the
    [Security Policy](.github/SECURITY.md).

- **Style & formatting**
  - Follow the linting rules enforced by Biome (`pnpm lint`).
  - Use the existing design tokens and CSS Modules patterns from `src/`.

---

## Before opening a pull request

Before you submit a PR, please:

1. **Sync with `master`** and rebase your branch if necessary.
2. Run at least a build and basic static checks locally:

```bash
pnpm build
# or individual checks:
pnpm quality
```

3. Ensure the gallery still behaves correctly on X.com in a desktop browser
   (Chrome, Firefox, Safari, or Edge).
4. Update documentation if behavior visible to end users has changed:
   - `README.md` for user-facing changes
   - `CHANGELOG.md` for notable changes between releases

---

## Pull request expectations

A good pull request usually includes:

- A clear title and short description of **what** is changing and **why**
- Small, focused commits with descriptive messages
- Tests where it makes sense (unit, browser, or E2E) and/or a short note
  explaining why tests are not required

Thank you for helping improve **X.com Enhanced Gallery**!
