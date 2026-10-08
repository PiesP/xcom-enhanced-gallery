# Contributing

Thanks for improving **X.com Enhanced Gallery**. Source, comments, commit
messages, and issue content should be written in English. Supported root README
translations may be written in Korean or Japanese when they remain aligned with
`README.md`.

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

## Command catalog

Run package commands from the repository root with manifest-pinned Node and
pnpm after restoring the recorded `packages/core` gitlink. The dependency-free
`preinstall` check can run before dependencies exist. `packages/core` provides
product runtime code; automation helpers are consumer-owned or separately pinned.
The table gives each command family, execution stage, side effects, and checks.

### Package commands

| Public command or family | Purpose; owner and execution stage | Inputs, outputs, side effects; verification |
| --- | --- | --- |
| `pnpm install` (`preinstall`) | Before dependencies, Node built-ins in `scripts/check/bootstrap.ts` check the `packages/core` manifest. | Reads the submodule path; no writes by the check; missing core prints recovery steps and fails. `test/unit/tooling/command-adapters.test.ts`, `pnpm check:scripts`; frozen install is a separate package-manager operation. |
| `pnpm quality:nose` | Optional local duplication query through `scripts/check/nose.ts`; installed Nose is external. | Reads `src` and `.nose-baseline.json`; inherits cwd/environment, forwards status and signal; absent binary prints a skip, installed failure fails. `test/unit/tooling/command-adapters.test.ts`; CI Nose installation/check remains mandatory. |
| `pnpm build`, `build:fast`, `build:dev`, `build:ci` | Vite userscript builds; `build:dev` selects development mode. Ordinary `build` has the `prebuild` quality/version gate (`check:prebuild` runs versions then quality); `:ci` is the explicit gate-free build step. | Reads `src`, Vite configs, core; writes `dist/`. Check `pnpm verify` and the relevant userscript Playwright lane. |
| `pnpm build:extension`, `build:extension:firefox`, their `:ci` variants | Vite background/content builds plus `scripts/check/extension-build.ts`; ordinary names trigger `prebuild:extension` or `prebuild:extension:firefox`, both delegating to `check:prebuild`. | Writes `dist-extension*`; checker verifies classic content script and assets and fails on a bad bundle. `pnpm verify`, `test/unit/extension`, `test:e2e:extension`, and Firefox runtime lane as applicable. |
| `pnpm build:all`, `build:all:ci`, `build:e2e` | Chain userscript and both extension targets; `build:e2e` first calls `clean` then produces development and extension fixtures. `build:all:ci` checks versions before the three CI builds; `prebuild:all` delegates to `check:prebuild` for the ordinary lifecycle command. | Mutates generated `dist*`; `build:e2e` removes generated outputs first. Validate with `verify`, artifact tests, and affected browser lanes; `:ci` is not a replacement for quality when invoked alone. |
| `pnpm clean` | `scripts/build/clean.ts` removes generated build directories. | Destructive only for the declared generated outputs; test CLI/import boundary in `test/unit/tooling/node-script-boundaries.test.ts`. |
| `pnpm check:versions`, `sync:versions` | `scripts/release/version.ts` checks or synchronizes package/extension versions. | `check` reads and fails on mismatch; `sync` writes manifests. `test/unit/tooling/release-runtime.test.ts` plus version check. |
| `pnpm package:extension`, `package:all`, `release:prepare` | `scripts/release/package-extension.ts` archives built Chrome/Firefox extensions; `package:all` builds first. `scripts/release/prepare.ts` prepares a version- and commit-bound release bundle after builds. | Reads `RELEASE_VERSION` and optional commit identity, `dist*`, package metadata; writes ZIPs, release bundle and metadata, with external `zip` required. `test/unit/tooling/release-runtime.test.ts`, release/publication tests and actual artifact inspection. These commands prepare files; they do not publish a release. |
| `pnpm check:src`, `check:test`, `check:scripts`, `check:e2e`, `check`, `typecheck` | TypeScript checks in browser, Vitest, NodeNext/erasable (`tsconfig.scripts.json` uses ECMAScript-only libraries; `tsconfig.node-tests.json` inherits them for the direct Firefox `node:test`), and Playwright projects respectively. `check` chains source/test/scripts. | Read-only; `tsconfig.e2e.json` excludes the direct Firefox test so it is checked in the Node project instead. `pnpm quality` includes all four boundaries. |
| `pnpm fmt`, `fmt:check`, `lint`, `knip`, `knip:full`, `knip:production`, `circular` | Biome formatting/lint, dependency/entry analysis, and source graph checks. | Read-only; Knip's `scripts/**/*.ts` entry/project patterns cover CLI modules, and `ignoreBinaries` includes external Nose/OpenSSL. `fmt:fix`, `lint:fix`, `quality:fix` write formatting fixes and must be reviewed separately. |
| `pnpm quality`, `verify`, `verify:full` | `quality` chains format, lint, type/E2E type, Node CI tests, circular, Knip and optional local Nose. `verify` adds production targets; `verify:full` adds coverage, development build, and all E2E browser lanes. | Build/test outputs and browser profiles are generated; `verify` alone does not prove E2E. Read exact command outcomes and artifacts; no VM/publication inference. |
| `pnpm test`, `test:watch`, `test:cov`, `test:ci` | Vitest suites and direct Node CI policy tests in `scripts/ci/{deep-check-reuse,repository-authority}.test.ts` and `scripts/release/verify-source.test.ts`. | Watch persists; coverage writes reports. `test:ci` also compiles a negative browser-global probe through the real script project; run it alone with `pnpm test test/unit/tooling/node-ambient-types.test.ts`. It checks cache, repository authority, tagged source and tooling types, not browser behavior. |
| `pnpm test:e2e`, `test:e2e:headed`, `test:e2e:extension`, `test:e2e:extension:firefox`, `test:e2e:all` | Playwright configs under `test/e2e/`; direct Firefox lane executes `test/e2e/firefox-extension-runtime.test.ts` with Node/Selenium. | Requires built artifacts, browser binaries and loopback fixtures; may create browser profiles/downloads. `test:e2e:all` chains the lanes; distinguish fixture browser evidence from authenticated Windows/live-site evidence. |
| `pnpm mut`, `mut:fast` | Stryker full/fast mutation profiles. | Writes reports/temp work; use mutation/deep-check workflow receipts, not a passing unit suite as substitute. |

### Workflow and subprocess entrypoints

| Surface | Contract; stage and side effects | Verification / status |
| --- | --- | --- |
| `.github/workflows/ci.yaml`, `security.yaml` changed-path jobs | Node is set up without dependencies; `scripts/ci/classify-changes.ts` is selected from the trusted base for PR/merge-group or checked-out protected revision for push. It reads the Git event and NUL-safe Git diff, conservatively emits fixed `GITHUB_OUTPUT` gates. | `test/unit/tooling/workflow-change-classifier-git.test.ts`, `workflow-change-policy.test.ts`; verify exact-SHA hosted gates execute real work, not only no-change routes. |
| `.github/workflows/deep-checks.yaml` | `scripts/ci/deep-check-reuse.ts` owns bounded duplication/mutation reuse. The workflow copies `scripts/ci/{pinned-tools.json,pinned-tools.ts,install-nose.ts}` from the reviewed tool revision before required Nose installation. | `scripts/ci/deep-check-reuse.test.ts` and pinned-tools CLI tests; installer digest or network failure is fatal. |
| `.github/workflows/security.yaml` pinned tools and OSV | `scripts/ci/pinned-tools.json` owns tool versions and digests; trusted private copies of `pinned-tools.ts` and `check-pinned-tools.ts` supply image environment and freshness checks. The independently pinned browser-core `automation/actions/prepare-osv` supplies the private `consumer` OSV helper; `packages/core` remains the runtime gitlink. | `test/unit/config/pinned-tools-cli.test.ts`, `test/unit/config/osv-workflow-composition.test.ts`, and provider OSV fixtures; `docs/osv-workflow.md` records trust order and live-container limits. |
| `.github/workflows/release.yaml` | `scripts/release/verify-source.ts` checks protected tagged source before fan-out; `prepare.ts` creates local release files and `verify-publication.ts` checks the public write decision in the locked publish job. Runner `run:` blocks still select checkout, append short outputs, and launch artifacts/actions. | `scripts/release/verify-source.test.ts`, `test/unit/tooling/{release-runtime,release-publication}.test.ts`, and exact-source artifact inspection. Preparation does not publish. |
| `.github/workflows/dependabot-auto-merge*.yaml`, `update-browser-core.yaml` | The read-only Dependabot gate passes an artifact; `scripts/ci/dependabot-apply.ts` rejects old or positive decisions and rechecks PR/commit identity before reporting required manual review. `scripts/ci/update-browser-core.ts` verifies remote SHA/impact and owns gitlink PR preparation/publication. Workflow shell supplies event inputs and bounded output/checkout glue. | `test/unit/config/dependabot-auto-merge.test.ts`, `test/unit/tooling/browser-core-automation.test.ts`, `scripts/ci/repository-authority.test.ts`; privileged results require exact-SHA hosted evidence. |
| `.githooks/pre-commit`, `.githooks/pre-push` | Small Git-invoked Bash guards before any Node setup: reject detached/default-branch commit and direct default-branch push; no network or write by the hooks. | `test/unit/tooling/git-hooks.test.ts`. Retained minimal pre-runtime Git transport exception; revisit if the hook execution contract guarantees pinned Node before invocation without weakening the branch guard. |
| Test subprocess callers | `test/unit/tooling/{command-adapters,workflow-change-classifier-git,node-script-boundaries,release-runtime,git-hooks}.test.ts` and `test/e2e/firefox-extension-runtime.test.ts` invoke CLI, Git, Node, or browser helpers with fixtures. `scripts/ci/repository-authority.test.ts` exercises privileged command policy; provider tests own OSV parser/scanner behavior. | Run the focused suite and NodeNext checks after an entrypoint change; fixtures do not prove live browser or publication behavior. |

### Windows bundle and retained languages

The Windows profile uses `profile.mjs`; `validation/windows/profile.json` declares installation `install-profile.mjs`, `live-page.mjs`, and built extension/userscript assets. The controller ships portable Windows Node and `playwright-core`, then imports raw `.mjs` with `run({ browser, root, output })`; no TypeScript transpilation/loader or duplicate generated source is declared.

Retain these handwritten JavaScript modules with a concrete review trigger: revisit when the controller supports a source-bound TS build plus stale-output check, updates every profile asset/import, and completes focused prepared-VM smoke. `validation/windows/README.md` describes bundle inputs and targeted `node --check` commands; the Node boundary suite runs `node --check` over every `validation/windows/**/*.mjs` file, followed by the existing Windows-focused unit tests. A syntax check is not VM acceptance.

Small workflow shell blocks remain runner bootstrap, checkout, output, and action-launch adapters; revisit them when tested Node entrypoints can preserve trusted-source and write ordering. The Git hooks remain Bash because Git invokes them before pinned Node setup.
The external `zip`, Git, Nose, browser, and vendor installer are tools, not handwritten project languages.

Run `pnpm build:e2e` before direct browser lanes so generated fixtures are
current. Use the narrowest relevant check while working, `pnpm verify` before
a pull request, and `pnpm verify:full` for publication-level or browser
behavior changes. A local build or fixture run does not establish Windows,
live-site, hosted-CI, or public-release evidence.

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

Every dependency update requires explicit maintainer review, including Action,
executable npm, patch/minor, major and security updates. No auto-eligible
category remains; missing, mixed or unsupported metadata cannot grant admission.

Review the exact dependency/Action diff and its upstream source, release notes,
security advisory and changed executable/install behavior. Verify the selected
version or immutable Action SHA, frozen-lock installation and applicable CI at
the current PR head, then use the ordinary protected merge path. Re-review if
that head changes; never bypass protection or cooling/trust controls. Security
updates follow the same admission boundary with higher review priority. The
read-only gate records a policy-bound negative decision, and trusted apply
rejects old or positive decisions without approval or merge authority.

The browser-core updater computes impact and previews publication in a read-only
job. A separate writer checks out trusted current source, installs no project
dependencies, reprepares the update and requires the classified base/target to
match before publishing only the gitlink PR. Its pinned runtime setup and
publication code still require maintainer trust. Release build/test jobs remain
read-only; existing protected-source, integrity and locked publication checks
remain required. Manual review, pins, checksums and attestations do not prove
that an upstream compiler, Action or resulting build is free of malicious code.

## Release publication

The ordinary release workflow publishes existing protected-source stable tags
in increasing semantic-version order. Validation can run in parallel, but all
tags share a publication lock. After acquiring it, the workflow rechecks the tag,
source manifest, bundle metadata, public release history and Latest selection
before writing. Historical targets and unavailable or conflicting state stop
publication; this workflow has no archive or rollback mode.

New releases explicitly become Latest. A complete same-version retry verifies
the published source metadata and skips publication, preserving existing assets
and Latest. Incomplete releases, drafts and archive retries require maintainer
review; the workflow does not overwrite assets or move tags to repair them.

## Pull requests

Keep changes focused and describe what changed, why it changed, and how it was
validated. Update README or CHANGELOG content when user-visible behavior or
release notes change.

By contributing, you agree that your changes are licensed under the
[project license](./LICENSE).
