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

- [Deno](https://deno.land/) **2.x** or later

### Local setup

```bash
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery
```

> **Note**: No `npm install` is required. Deno manages dependencies
> automatically.

### Common commands

```bash
# Production build (userscript bundle with quality checks)
deno task build

# Development build
deno task build:dev

# Quick build (skip quality checks)
deno task build:fast

# TypeScript typecheck
deno task check

# Lint source code
deno task lint

# Format check
deno task fmt:check

# Run all quality checks
deno task quality
```

These tasks are defined in `deno.json` and use the project configuration
(`tsconfig*.json`, build scripts).

---

## Editor setup (VSCode)

For the best development experience, configure VSCode to use the same
lint/format rules as the CLI (`deno task lint`, `deno task fmt`,
`deno task biome:check`).

### Recommended extensions

Install the extensions listed in `.vscode/extensions.json`:

- **biomejs.biome** - Biome linter and formatter
- **denoland.vscode-deno** - Deno language support

### Recommended settings

Add these settings to your `.vscode/settings.json`:

```json
{
  "deno.enable": true,
  "deno.enablePaths": ["src", "scripts"],
  "deno.disablePaths": ["test"],
  "biome.enabled": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
  "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[json]": { "editor.defaultFormatter": "biomejs.biome" },
  "[jsonc]": { "editor.defaultFormatter": "biomejs.biome" },
  "[markdown]": { "editor.defaultFormatter": "denoland.vscode-deno" }
}
```

This ensures:

- **Format on save** uses Biome (same as `deno task fmt` /
  `deno task biome:check`)
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
  - Follow the linting rules enforced by Deno lint (`deno task lint`).
  - Use the existing design tokens and CSS Modules patterns from `src/`.

---

## Before opening a pull request

Before you submit a PR, please:

1. **Sync with `master`** and rebase your branch if necessary.
2. Run at least a build and basic static checks locally:

```bash
deno task build
# or individual checks:
deno task quality
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
