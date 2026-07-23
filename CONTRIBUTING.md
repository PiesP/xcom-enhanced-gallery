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

- [Node.js](https://nodejs.org/) **26.x** or later (recommended via [Volta](https://volta.sh/))
- [pnpm](https://pnpm.io/) **11.2.2** or later

### Local setup

```bash
git clone --recurse-submodules https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery
git submodule sync --recursive
git submodule update --init --recursive
pnpm install
```

### Git workflow and the `browser-core` submodule

This repository is the superproject for the shared `browser-core` package.
`packages/core` is a Git submodule, so the root repository records an exact
`browser-core` commit rather than a moving branch. The detached HEAD that is
normal for a pinned submodule must not be treated as a broken checkout.

For an existing clone, restore all submodules to the commits recorded by the
current root commit with:

```bash
git submodule sync --recursive
git submodule update --init --recursive
git submodule status --recursive
```

Before changing a submodule, check both repositories independently:

```bash
git status --short
git -C packages/core status --short --branch
git diff --submodule=log -- packages/core
```

The leading character in `git submodule status` is useful when diagnosing a
checkout: `-` means the submodule is not initialized, `+` means its checked-out
commit differs from the root pointer, and `U` means the gitlink has a merge
conflict.

#### Updating the pinned dependency

Do not run `git pull` inside `packages/core`; the submodule is intentionally
checked out detached. To test the latest upstream `master` locally, first make
sure the submodule has no uncommitted changes, then run:

```bash
git submodule update --remote --checkout packages/core
git -C packages/core rev-parse HEAD
```

This changes the root worktree's gitlink. Stage it only when the dependency
bump is intentional:

```bash
git add packages/core
git diff --cached --submodule=log -- packages/core
git commit -m "chore(deps): update browser-core to <short-sha>"
```

To pin a reviewed commit explicitly, fetch and detach at its full 40-character
SHA instead of following a branch:

```bash
CORE_SHA=<full-browser-core-commit-sha>
git -C packages/core fetch --no-tags origin "$CORE_SHA"
git -C packages/core switch --detach "$CORE_SHA"
git -C packages/core rev-parse --verify HEAD
git add packages/core
```

The `Update browser-core` workflow uses this exact-SHA approach, opens a root
repository pull request, and runs the normal root CI before the pointer is
merged. Avoid creating a second manual bump while that automation pull request
is open.

#### Working on `browser-core` itself

Changes to shared utilities belong in the `PiesP/browser-core` repository, not
as ordinary files in this superproject. From the root repository, create a
work branch in the submodule before editing it:

```bash
git -C packages/core fetch --no-tags origin master
git -C packages/core switch --create codex/<topic> --track origin/master
git -C packages/core config core.hooksPath .githooks
```

Run the core project's checks and submit its pull request there. After that
pull request is merged into `browser-core` `master`, update this repository to
the resulting full SHA and submit a separate root pull request containing only
the gitlink change. Do not commit or push `browser-core` changes from the root
repository.

Local experiments may leave `packages/core` on a topic branch or a different
detached commit. Keep those changes separate from the root dependency bump and
do not run a submodule update while the submodule has uncommitted work. To
return to the root commit's pinned version after the experiment, first preserve
or discard the local work deliberately, then run:

```bash
git submodule update --init --checkout packages/core
```

When a root merge or rebase produces a submodule conflict, choose the intended
`browser-core` commit, check that commit out detached in `packages/core`, and
run `git add packages/core` to resolve the gitlink. Never edit the internal
`.git/modules/packages/core` metadata to resolve a conflict.

#### Git hooks

The root repository and `browser-core` both version local Git hooks, but Git
does not enable a repository's hook path automatically after cloning. Enable
the guards separately when working in each repository:

```bash
git config core.hooksPath .githooks
git -C packages/core config core.hooksPath .githooks
```

The hooks are local safeguards; hosted branch protection and pull requests are
the authoritative policy. In particular, do not commit directly to either
project's default branch or push a default-branch update that bypasses its
required merge policy.

When enabled, the hooks enforce these local checks:

- `pre-commit` rejects commits from detached HEAD and direct commits on
  `master`/`main`. It only permits completing an in-progress merge on a default
  branch.
- `pre-push` rejects deletion of a default branch and requires a pushed
  default-branch update to be a two-parent `--no-ff` merge whose first parent is
  the current remote tip.

These hooks can be bypassed with Git options, so they complement rather than
replace the hosted branch protection rules.

#### Supply chain security controls

This repository enables pnpm client-side supply chain protections to reduce the risk
of npm ecosystem attacks that execute code during installation.

Key policies (configured in `pnpm-workspace.yaml`):

- **Reviewed install scripts**: `strictDepBuilds` + `allowBuilds` require explicit review
  of dependency install scripts. Entries in `allowBuilds` are either:
  - `true` (allowed to run), or
  - `false` (explicitly disallowed, but considered reviewed).
- **Current reviewed install scripts**: `esbuild` is the only dependency install
  script explicitly allowed in the root workspace today.
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
pnpm fmt

# Unused code/dependency checks
pnpm knip

# Run all quality checks
pnpm quality

# Full local verification (build + test workspace)
pnpm verify
```

These tasks are defined in `package.json` and use the project configuration
(`tsconfig*.json`, `biome.jsonc`, build scripts).

### Test workspace

The browser and mutation suites live in the separate `test/` workspace. You can
either use the root wrappers or work in `test/` directly:

```bash
# From the repository root
pnpm test:unit
pnpm test:e2e
pnpm test:mut:priority
pnpm test:all

# Or inside the isolated test workspace
cd test
pnpm test
pnpm e2e
pnpm mut:priority
```

---

## Editor setup (VSCode)

For the best development experience, configure VSCode to use the same
lint/format rules as the CLI (`pnpm lint`, `pnpm fmt`).

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

- **Format on save** uses Biome (same as `pnpm fmt`)
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
2. Run the relevant local checks for your change. A typical full pass is:

```bash
pnpm quality
pnpm build
pnpm test:all
```

If your change is docs-only or otherwise isolated, explain why a smaller check
set was sufficient.

3. Ensure the gallery still behaves correctly on X.com in a desktop browser
   (Chrome, Firefox, Safari, or Edge) when runtime behavior changed.
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
