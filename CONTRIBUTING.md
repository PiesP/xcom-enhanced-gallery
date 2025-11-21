# Contributing to X.com Enhanced Gallery

Thank you for your interest in contributing to **X.com Enhanced Gallery**.
This document describes a minimal, practical workflow for reporting issues and
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

- Node.js **22+**
- npm **10+**

### Local setup

```bash
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery

npm install
```

### Common commands

```bash
# Production build (userscript bundle)
npm run build

# TypeScript typecheck (no emit)
npm run typecheck

# Lint TypeScript sources
npm run lint

# Lint CSS
npm run lint:css
```

These commands are defined in `package.json` and use the existing project
configuration (`tsconfig*.json`, `vite.config.ts`, lint configs, and CI
workflows under `.github/`).

---

## Coding guidelines

Please keep changes small, focused, and consistent with the existing codebase.

- **TypeScript & Solid.js**
  - Use modern TypeScript and Solid.js patterns already present in `src/`.
  - Prefer functional components and hooks/utilities consistent with
    existing files.

- **Path imports**
  - Use configured **path aliases** (e.g. `@shared/...`, `@features/...`) for
    internal imports instead of long relative paths.

- **GM / userscript APIs**
  - Do **not** call Greasemonkey/Tampermonkey APIs (e.g. `GM_*`) directly from
    feature code.
  - Use the existing service singletons (e.g. storage, notification,
    download, HTTP services) where applicable.

- **Security & safety**
  - Do not introduce dynamic code execution (`eval`, `new Function`,
    `setTimeout`/`setInterval` with string arguments, etc.).
  - Avoid unsafe DOM patterns such as unsanitized `innerHTML`.
  - Follow the practices described in the [Security Policy](.github/SECURITY.md).

- **Style & formatting**
  - Follow the linting rules enforced by ESLint and Stylelint.
  - Use the existing design tokens and CSS Modules patterns from `src/`.

---

## Before opening a pull request

Before you submit a PR, please:

1. **Sync with `master`** and rebase your branch if necessary.
2. Run at least a build and basic static checks locally:

  ```bash
  npm run build
  npm run typecheck
  npm run lint
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
