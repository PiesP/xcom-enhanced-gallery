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
| `pnpm build`, `build:fast`, `build:dev`, `build:ci` | Vite userscript builds; `build:dev` selects development mode. Ordinary `build` has the `prebuild` quality/version gate (`check:prebuild` runs versions then quality); `:ci` is the explicit gate-free build step. | Reads `src`, Vite configs, core; writes `dist/`. Production writes the public `.user.js` and `.meta.js`; development writes the retained `.dev.user.js` without writing production metadata. Check `pnpm verify` and the relevant userscript Playwright lane. |
| `pnpm build:extension`, `build:extension:firefox`, their `:ci` variants | Vite background/content builds plus `scripts/check/extension-build.ts`; ordinary names trigger `prebuild:extension` or `prebuild:extension:firefox`, both delegating to `check:prebuild`. | Writes `dist-extension*`; checker verifies classic content script and assets and fails on a bad bundle. `pnpm verify`, `test/unit/extension`, `test:e2e:extension`, and Firefox runtime lane as applicable. |
| `pnpm build:all`, `build:all:ci`, `build:e2e` | Chain userscript and both extension targets; `build:e2e` first calls `clean` then produces development and extension fixtures. `build:all:ci` checks versions before the three CI builds; `prebuild:all` delegates to `check:prebuild` for the ordinary lifecycle command. | Mutates generated `dist*`; `build:all:ci` prepares production userscript/metadata and both extension inputs, while a retained development userscript may coexist in `dist/`. `build:e2e` removes generated outputs first. Validate with `verify`, artifact tests, and affected browser lanes; `:ci` is not a replacement for quality when invoked alone. |
| `pnpm clean` | `scripts/build/clean.ts` removes generated build directories. | Destructive only for the declared generated outputs; test CLI/import boundary in `test/unit/tooling/node-script-boundaries.test.ts`. |
| `pnpm check:versions`, `sync:versions` | `scripts/release/version.ts` checks or synchronizes package/extension versions. | `check` reads and fails on mismatch; `sync` writes manifests. `test/unit/tooling/release-runtime.test.ts` plus version check. |
| `pnpm package:extension`, `package:all`, `release:prepare` | `scripts/release/package-extension.ts` archives built Chrome/Firefox extensions; `package:all` builds first. `scripts/release/prepare.ts` checks production artifact metadata, built extension versions and the changelog before preparing a release bundle. | `release:prepare` reads `RELEASE_VERSION`, optional `RELEASE_SHA`, package metadata and existing `dist*`; it replaces `release-bundle/`, creates ZIPs/checksums/source-runtime metadata, and requires external `zip`. The public asset allowlist is the production userscript, production metadata, two extension ZIPs, `checksums.txt` and `metadata.json`; retained development files are internal deploy/build outputs. Run `build:all:ci` first from eligible clean source. Version agreement does not prove that existing dist bytes came from the recorded commit. These commands do not publish a release. |
| `pnpm check:src`, `check:tooling`, `check:test`, `check:scripts`, `check:e2e`, `check`, `typecheck` | Separate browser, build/config, Vitest, NodeNext/erasable script/direct Firefox, and Playwright TypeScript projects. `check` chains source/tooling/test/scripts; `check:e2e` checks Playwright separately. | Read-only; `tsconfig.e2e.json` excludes the direct Firefox test so it is checked in the Node project instead. `pnpm quality` includes every project boundary. |
| `pnpm fmt`, `fmt:check`, `lint`, `knip`, `knip:full`, `knip:production`, `circular` | Vite+ Oxfmt and Oxlint with scoped Biome residual lint, dependency/entry analysis, and source graph checks. | Read-only; `lint` denies warnings in both lint owners. `fmt:fix`, `lint:fix`, `quality:fix` write fixes for review. Knip and dpdm retain separate responsibilities. |
| `pnpm quality`, `verify`, `verify:full` | `quality` chains Vite+ formatting, Vite+ lint with scoped Biome residual rules, all runtime type checks, the focused policy suite, circular, and Knip. `verify` adds production userscript/metadata and both extension targets; `verify:full` adds coverage, a retained development userscript build, and all E2E browser lanes. Its internal coverage command omits only the boundary suite already run by `quality`. | Build/test outputs and browser profiles are generated; `verify:full` leaves production and development userscripts together with production metadata. `verify` alone does not prove E2E. Read exact command outcomes and artifacts; no VM/publication inference. |
| `pnpm test`, `test:watch`, `test:cov`, `test:ci` | Vite+ Vitest suites and direct Node CI policy tests in `scripts/ci/repository-authority.test.ts` and `scripts/release/verify-source.test.ts`. | Watch persists; coverage writes reports. `test:ci` also runs real compiler/import boundary probes; run that part alone with `pnpm test test/unit/tooling/node-ambient-types.test.ts`. This focused suite checks repository authority, tagged source and runtime types; it is not the complete unit suite. |
| `pnpm test:e2e`, `test:e2e:headed`, `test:e2e:extension`, `test:e2e:extension:firefox`, `test:e2e:all` | Playwright configs under `test/e2e/`; direct Firefox lane executes `test/e2e/firefox-extension-runtime.test.ts` with Node/Selenium. | Requires built artifacts, browser binaries and loopback fixtures; may create browser profiles/downloads. `test:e2e:all` chains the lanes; distinguish fixture browser evidence from authenticated Windows/live-site evidence. |

### Quality ownership

`fmt` runs read-only `vp fmt --check` and `lint` runs `vp lint . --deny-warnings`
followed by `biome lint --error-on-warnings .`. The latter is restricted to CSS,
HTML/accessibility, accumulating-spread and Solid-component rules listed below;
it does not format or run its former general JavaScript/TypeScript preset.
`quality:fix` runs reviewed formatter/linter fixes. CI and ordinary prebuild
invoke `quality` without task-result caching.

| Check | Local owner | Hosted owner |
| --- | --- | --- |
| Vite+ format/lint, scoped Biome residual lint, every runtime type project, dpdm and full/production Knip | `quality` (also ordinary prebuild and `verify`) | CI/release quality |
| Focused direct Node policy tests | `test:ci`; retained within `quality` | CI quality when selected, otherwise CI unit for an explicitly unit-only decision; release quality |
| Runtime/import boundary probes | `test:ci`; retained within `quality` and `verify` | CI/release unit coverage when selected; CI quality when unit is explicitly unselected |
| Complete unit suite and unchanged coverage thresholds | `test` / `test:cov`; `verify:full` uses internal `test:cov:after-policy` after `quality` | CI/release unit |
| Production distributions / browser fixtures | `build:all:ci` / browser lane commands | CI/release build and E2E |
| Security scans | Separate workflows | Existing security owners |

CI quality uses the internal `quality:coverage-owned` command when unit is
selected or classification fails; this runs the direct Node policy tests and
leaves the boundary suite to unit coverage. If unit is explicitly unselected,
CI quality runs standalone `quality`, which includes the boundary suite. CI
unit runs its explicit `test:policy` step only when classification succeeded,
unit is selected and quality is explicitly false. README, workflow or
captured-host HTML changes can take this route. Documentation-only changes
that select neither job retain the explicit no-op checks. A failed owner keeps
its required check unsuccessful. Release quality uses `quality:coverage-owned`
because release unit runs full coverage. Standalone `test:ci`, `test`,
`test:cov`, `quality`, and `verify` retain their full boundary protection;
`verify:full` runs it once in `verify` and excludes only that suite from its
internal coverage invocation. Ordinary prebuild and deep/security contracts
remain intact.

Distinguish scheduled reuse, explicit no-op routing and actual executed checks in receipts.

The CI E2E job keys its Playwright browser cache to the installed `@playwright/test`
version, Ubuntu 24.04 runner architecture, and Chromium/Firefox/WebKit set. It
always runs `playwright install --with-deps chromium firefox webkit` after cache
restoration and then `test:e2e:all`. The separate Selenium cache supports the
Firefox extension runtime lane. [Issue #304](https://github.com/PiesP/xcom-enhanced-gallery/issues/304)
records the comparison behind retaining this cache. Re-evaluate if the runner
image or Playwright provisioning changes, or if exact-hit restoration and save
time reaches the uncached browser download time.

Before adding an implementation, inspect related existing responsibilities.
Consolidate duplication when behavior, ownership, lifecycle, and reasons to
change align; tests establish that preserved behavior still works.

### Workflow and subprocess entrypoints

| Surface | Contract; stage and side effects | Verification / status |
| --- | --- | --- |
| `.github/workflows/ci.yaml`, `security.yaml` changed-path jobs | Node is set up without dependencies; `scripts/ci/classify-changes.ts` is selected from the trusted base for PR/merge-group or checked-out protected revision for push. It reads the Git event and NUL-safe Git diff, conservatively emits fixed `GITHUB_OUTPUT` gates. | `test/unit/tooling/workflow-change-classifier-git.test.ts`, `workflow-change-policy.test.ts`; verify exact-SHA hosted gates execute real work, not only no-change routes. |
| `.github/workflows/security.yaml` pinned tools and OSV | `scripts/ci/pinned-tools.json` owns tool versions and digests; trusted private copies of `pinned-tools.ts` and `check-pinned-tools.ts` supply image environment and freshness checks. The independently pinned browser-core `automation/actions/prepare-osv` supplies the private `consumer` OSV helper; `packages/core` remains the runtime gitlink. | `test/unit/config/pinned-tools-cli.test.ts`, `test/unit/config/osv-workflow-composition.test.ts`, and provider OSV fixtures; `docs/osv-workflow.md` records trust order and live-container limits. |
| `.github/workflows/release.yaml` | `scripts/release/verify-source.ts` checks protected tagged source before fan-out; `prepare.ts` creates local release files and `verify-publication.ts` checks the public write decision in the locked publish job. Runner `run:` blocks still select checkout, append short outputs, and launch artifacts/actions. | `scripts/release/verify-source.test.ts`, `test/unit/tooling/{release-runtime,release-publication}.test.ts`, and exact-source artifact inspection. Preparation does not publish. |
| `.github/dependabot.yaml`, `update-browser-core.yaml` | Dependabot opens npm and GitHub Actions update PRs for maintainer review; repository workflows do not approve or merge dependency updates. `scripts/ci/update-browser-core.ts` verifies remote SHA/impact and owns gitlink PR preparation/publication. Workflow shell supplies event inputs and bounded output/checkout glue. | `test/unit/config/dependency-review-policy.test.ts`, `test/unit/config/browser-core-automation.test.ts`, `scripts/ci/repository-authority.test.ts`; privileged results require exact-SHA hosted evidence. |
| `.githooks/pre-commit`, `.githooks/pre-push` | Small Git-invoked Bash guards before any Node setup: reject detached/default-branch commit and direct default-branch push; no network or write by the hooks. | `test/unit/tooling/git-hooks.test.ts`. Retained minimal pre-runtime Git transport exception; revisit if the hook execution contract guarantees pinned Node before invocation without weakening the branch guard. |
| Test subprocess callers | `test/unit/tooling/{command-adapters,workflow-change-classifier-git,node-script-boundaries,release-runtime,git-hooks}.test.ts` and `test/e2e/firefox-extension-runtime.test.ts` invoke CLI, Git, Node, or browser helpers with fixtures. `scripts/ci/repository-authority.test.ts` exercises privileged command policy; provider tests own OSV parser/scanner behavior. | Run the focused suite and NodeNext checks after an entrypoint change; fixtures do not prove live browser or publication behavior. |

### Windows bundle and retained languages

The Windows profile uses `profile.ts`; `validation/windows/profile.json` declares installation `install-profile.ts`, `live-page.ts`, and built extension/userscript assets. The controller ships portable Windows Node and `playwright-core`, then imports the declared entries with `run({ browser, root, output })`. The pinned Node runtime directly strips erasable TypeScript in imported helpers and fixtures; no project transpilation/loader or duplicate generated source is declared.

The Windows profile entries, installation flows, and scenario modules are maintained directly as TypeScript under [issue #329](https://github.com/PiesP/xcom-enhanced-gallery/issues/329). `validation/windows/README.md` describes bundle inputs and targeted native Node syntax checks; the Node boundary suite checks maintained Windows modules, followed by the Windows-focused unit tests. A syntax check is not VM acceptance.

Small workflow shell blocks remain runner bootstrap, checkout, output, and action-launch adapters; revisit them when tested Node entrypoints can preserve trusted-source and write ordering. The Git hooks remain Bash because Git invokes them before pinned Node setup.
The external `zip`, Git, browser, and vendor installer are tools, not handwritten project languages.

Run `pnpm build:e2e` before direct browser lanes so generated fixtures are
current. Use the narrowest relevant check while working, `pnpm verify` before
a pull request, and `pnpm verify:full` for publication-level or browser
behavior changes. A local build or fixture run does not establish Windows,
live-site, hosted-CI, or public-release evidence.

## Project constraints

### Managed-file checks

Oxfmt owns maintained TS/TSX, JS/MJS, CSS, JSON and HTML formatting using
two-space indentation, 100-column width, LF, single JavaScript quotes,
semicolons, ES5 trailing commas and parenthesized arrow parameters. Oxlint
owns supported JS/TS lint. Biome's `biome.json` has its
formatter and assist disabled and its linter preset set to `none`; it retains
only the residual rules below. `test/unit/tooling/toolchain-policy.test.ts`
checks representative real-tool failures. The quality classifier includes
these maintained file families and executable dot-directory helpers.

| Maintained family | Format and lint owner | Type or runtime validation |
| --- | --- | --- |
| `src` TS/TSX/CSS | Oxfmt; Oxlint for TS/TSX; Biome for residual CSS, accessibility and performance rules | `check:src`; unit and browser suites |
| Tests and fixtures JS/TS/TSX/HTML | Oxfmt; Oxlint for JS/TS/TSX; Biome for residual HTML/accessibility | Test, Playwright and Node projects |
| `scripts`, `tooling`, root TS/JSON configs | Oxfmt; Oxlint for JS/TS | Node-specific TypeScript projects and command tests |
| Windows validation TS and profile JSON, executable `.github/actions` helpers, extension manifests | Oxfmt; Oxlint for TS/JS/MJS; Biome residual rules where applicable | Windows TypeScript check, native Node syntax check, Windows profile, version and built-package checks |
| YAML/workflow shell, Markdown, TOML, PowerShell and Git hooks | Existing workflow/command checks; no general prose/TOML/PowerShell linter is claimed | Relevant CI and Windows runtime lanes |

VCS ignores exclude dependencies and generated outputs. Both formatter and
linters exclude the detached `packages/core` gitlink and exact-byte captured
HTML in `test/fixtures/authenticated-x-layouts/*.html`; the formatter also
excludes `pnpm-lock.yaml` and Markdown/YAML. Installed-page HTML fixtures
reproduce X markup; their specific native-host accessibility exceptions stay
local. TypeScript alone is not formatting or lint coverage, and fixture checks
are not Windows runtime acceptance.

- Keep the userscript as a single-file IIFE without runtime code splitting.
- Preserve behavior across the userscript and extension platform adapters.
- Access browser and userscript capabilities through established adapters; do
  not call `GM_*` directly from feature code.
- Use strict TypeScript, type-only imports, and alias-based leaf imports across
  folders. Same-folder relative imports are allowed.
- Use the existing `@platform/index` public adapter boundary and the shared
  provider's public entries. Use leaf imports elsewhere; do not add convenience
  barrels that hide ownership or cycles. Keep browser bundles free of runtime
  dynamic imports, `eval`, unsafe `innerHTML`, string timers and silently
  swallowed errors. Direct Node runtime/test imports remain separate contracts.
- Use CSS Modules and the existing `--xeg-*` tokens for themed or repeated
  values. Avoid unnecessary `!important` rules.
- Keep settings migrations, platform cleanup, and download cancellation
  behavior explicit.

### Runtime and import boundaries

`tsconfig.base.json` shares runtime-neutral strict/no-emit options only. The
browser `tsconfig.json` owns the seven alias definitions and checks only `src`
with DOM libraries, bundler resolution and `types: []`. Direct Node scripts
and the direct Firefox test use NodeNext, real Node types, erasable syntax and
explicit relative `.ts` imports. `tsconfig.tooling.json` checks Vite helpers,
all Vite configs and `vitest.config.ts` with Node types and ECMAScript libraries.
Each incremental project has its own build-info file.

Vitest and Playwright execute in Node while their fixtures and serialized
`page.evaluate` callbacks use browser APIs; their type projects intentionally
include both Node and DOM. `tsconfig.test.json` forwards to `test/tsconfig.json`.
That discoverable test config has explicit local includes so Vite's native
`resolve.tsconfigPaths` matches test importers. Vite, Vitest and Knip consume the
browser TypeScript paths directly; no synchronized alias map is maintained.
Short relative imports remain valid within a cohesive module. Ordered CSS and
other side-effect imports retain their cascade/order contracts.

Browser source also has an error-level `noRestrictedImports` boundary for
`node:*` and the pinned runtime's public bare builtin specifiers. It covers value
imports, type-only imports/re-exports and dynamic imports. The installed
`noNodejsModules` rule ignores type-only imports, so it cannot own this complete
boundary alone. The builtin coverage test requires deliberate review when Node
adds a public bare specifier. No browser `process` convenience ambient remains.
`node-ambient-types.test.ts` invokes the real compiler projects and checks their
loaded roots/declarations, valid inputs, intended errors and restored controls;
`import-aliases.test.ts` resolves all seven alias families with Vite and executes
a public-platform import under Vitest.

The repository-wide toolchain-policy, node-ambient-types and knip-boundaries
probe suites listed in `vitest.config.ts` run in a serial Vitest project after
the ordinary parallel unit project. They temporarily create
source files that another repository-wide tool could otherwise observe; both
project ordering and one-file-at-a-time execution are required. Setup, aliases
and coverage remain inherited, with all coverage thresholds unchanged.

Knip's project globs include maintained Windows TypeScript and Action `.mjs` helpers, but
only actual package/workflow/direct-test and profile entrypoints are roots.
Node and Playwright integrations are enabled; externally installed OpenSSL
remains an explicit binary exception. Full analysis covers Node/Windows tooling;
production analysis deliberately excludes those nonproduct paths. Real probes
reject full-mode script/MJS orphans and unnecessary product exports in both
modes, and distinguish tagged test-only exports from accidental production APIs.

`ignoreExportsUsedInFile: true` remains a reviewed limitation: exports used only
inside their declaring file are not reported. Turning it off produced 103 full
and 54 production findings, including Windows helpers exercised through computed
test imports that static Knip cannot follow. Eight proven same-file-only export
modifiers were removed without changing their bodies. This is not a claim that
every remaining export is externally necessary. Keep genuine `@testOnly` tags
on test-only seams; do not use them to hide product APIs or orphan helpers.

dpdm remains the single cycle gate. Installed Knip can reject runtime TS/TSX and
dynamic cycles with explicit error severity and dynamic-edge settings, but it
drops type-only edges and passed a pure `import type` cycle that current dpdm
rejects. Replacing dpdm would therefore change the current failing policy; no
second permanent cycle gate is added.

### Rule policy and source conventions

`vite.config.ts` owns Oxlint rules. `biome.json`
owns only residual rules that the selected Vite+ 1.2.0/Oxlint 1.88.0 toolchain
does not cover at equivalent scope. The two lint commands both fail on warnings.
Review this split when Vite+/Oxlint adds native CSS or equivalent accessibility,
Solid-component and accumulating-spread rules; move a rule only with a passing
negative probe and a clean repository-wide check.

| Existing rule or responsibility | Current owner, files and rationale |
| --- | --- |
| Solid destructured props | Biome `noSolidDestructuredProps` error on maintained TSX; a real component probe fails. `solid/no-destructure` was evaluated but its plugin has an unsupported TypeScript 7 peer dependency, and `solid/reactivity` is not an exact substitute. |
| Solid list rendering | `solid/prefer-for` was evaluated but fixed option arrays intentionally use maps; Biome `useSolidForComponent` remains a warning for JSX component list sites. Revisit with keyed identity/disposal tests and a peer-compatible plugin. |
| CSS unknown media features and pseudo-elements | Biome `noUnknownMediaFeatureName` and `noUnknownPseudoElement` errors in maintained CSS. |
| Accessibility | Biome's explicit `noStaticElementInteractions`, `useKeyWithClickEvents`, `useMediaCaption`, `noSvgWithoutTitle`, `useAriaPropsSupportedByRole` and `useSemanticElements` errors for maintained TSX/HTML. Native host/video exceptions remain adjacent to fixtures. |
| Browser Node imports, ambient types, non-null assertions | Oxlint `no-restricted-imports` bans `node:*` and public bare Node builtins in `src/**`; `typescript/no-non-null-assertion` errors only in `src/**`. Separate `tsc -p` projects preserve browser and Node ambient scopes. A bounded CRC byte loop has an inline exception. |
| Cookie writes, accumulating spread | Oxlint `unicorn/no-document-cookie` errors in product code; controlled test/VM writes are exempt. Biome `noAccumulatingSpread` remains an error. |
| Explicit `any`, focused tests, braces | Oxlint `typescript/no-explicit-any`, `vitest/no-focused-tests` and `curly` errors; real-tool probes reject each. |
| Unused template literals and SVG titles | Biome `noUnusedTemplateLiteral` and `noSvgWithoutTitle` errors remain because the selected Oxlint release does not provide equivalent enforced rules; negative probes reject both. |
| Other supported JS/TS rules | Oxlint errors cover unused variables/imports, `prefer-const`, exponentiation, callback returns, ternaries, lone blocks, empty exports, parameter reassignment, self-comparison and control-character regexes. Existing delayed-assignment and host-mock blocks have local reasons. |
| Unsupported explicit JS/TS rules | Biome retains `noAssignInExpressions`, `noImplicitAnyLet`, `noUselessSwitchCase` errors and `noConfusingVoidType` warning for maintained JS/TS. These have no exact enforced equivalents in Oxlint 1.88.0; review with the same trigger as CSS/Solid residual rules. |
| Semantic and graph checks | Explicit TypeScript projects remain for semantic boundaries; Knip checks unused files/dependencies and dpdm checks import cycles. |

The residual command is exactly `biome lint --error-on-warnings .` after
`vp lint . --deny-warnings`; its file scope is declared in `biome.json`.
No general Biome formatting or import-assist pass remains. Oxfmt's ignore
patterns are in `vite.config.ts`. The root `tsc` commands remain explicit
because one Vite+ type-check invocation does not cover the browser, tooling,
unit, E2E and direct-Node projects together. The supply-chain and prebuild
scripts retain their existing lifecycle order.

The Vite alias reports Vite+ `1.2.0` and bundles Vite `8.3.4`. Strict peer
validation stays enabled. `pnpm-workspace.yaml` permits only that exact alias
for the reviewed Vitest, mocker, Solid plugin and vitefu versions, whose declared
Vite ranges include 8.3.4. Recheck callers, their original ranges and both
versions together on updates; never widen this to `allowAny`. Validate a fresh
dependency resolution as well as the frozen install, since a migration lockfile
can otherwise hide peer metadata conflicts.

Name functions for their returned result and important side effects. Give public
contracts clear types without annotating every small internal callback. Choose
interfaces/types, functions/classes/factories and local mutation for their
responsibility; prefer readonly shared inputs without forced deep cloning.
Omit redundant `public` in new/touched code and keep explicit `private` or
`protected`. New lifecycle fields use descriptive camelCase resource names with
`Controller`, `Id` or `Promise` where applicable; preserve existing names unless
the touched lifecycle needs clarification.

A Promise has a result/failure owner: await it, return it to a responsible caller,
or handle rejection intentionally. `void task()` alone does not handle errors.
Keep cancellation, user-visible failure, queue continuity and best-effort cleanup
distinct. Comments explain current invariants and reasons; retain safety/license
notices and remove obsolete suppressions or historical phase descriptions when
touching their contracts. Keep native semantics, CSS Modules, scoped tokens and
reduced motion; no arbitrary CSS property ordering or all-values-must-be-tokens
rule is imposed.

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

Vite+ owns the Vite, Vitest, coverage, and core-tool versions. Dependabot keeps
`vite-plus` update PRs visible while omitting ordinary component-version PRs for
`vite`, `vitest`, `@vitest/*`, and `@voidzero-dev/vite-plus-core`. Security updates
and alerts remain visible. For a Vite+ update, select an exact stable release
published at least 24 hours earlier and set `VERSION` to that release. Follow the
[project upgrade guide](https://viteplus.dev/guide/upgrade-project): run
`pnpm dlx --package="vite-plus@$VERSION" vp help migrate`, then
`pnpm dlx --package="vite-plus@$VERSION" vp migrate --no-interactive --no-agent --no-editor --no-hooks`.
Review the managed Vite alias, Vitest and coverage catalog entries, and exact
peer-compatibility selectors against the bundled versions. Confirm fresh
dependency resolution, a frozen install, and `pnpm verify:full` before merging.
Upgrading a global `vp` installation does not update this project's package graph.

Every dependency update requires explicit maintainer review, including Action,
executable npm, patch/minor, major and security updates. No auto-eligible
category remains; missing, mixed or unsupported metadata cannot grant admission.

Review the exact dependency/Action diff and its upstream source, release notes,
security advisory and changed executable/install behavior. Verify the selected
version or immutable Action SHA, frozen-lock installation and applicable CI at
the current PR head, then use the ordinary protected merge path. Re-review if
that head changes; never bypass protection or cooling/trust controls. Security
updates follow the same admission boundary with higher review priority.
Dependabot opens the update PR and requests PiesP's review; the ordinary CI and
security checks run on that PR before its protected merge.

The GitHub Actions updater also watches `.github/actions/setup-release/action.yaml`;
CodeQL, `pnpm/setup`, and other Actions have independent groups. For each Action
SHA update, verify the full commit against the official upstream release and
wait at least 24 hours from that release. Review the changed executable behavior,
then update independent allowed-SHA assertions in
`test/unit/tooling/toolchain-action.test.ts` and affected workflow tests in the
same PR. Never derive a trusted expected SHA from the workflow or action under
test. Preserve the release action's manifest runtime, v2-compatible inputs,
disabled cache, `install: false`, frozen install and no-publish boundary; a
major action upgrade needs an explicit compatibility review. Run the focused
toolchain and dependency-policy tests, `pnpm verify`, and exact-head CI before
merging. Resolve a stale fixture for its specific update without closing all
independent Actions updates. Automation-only pin maintenance does not change the
`packages/core` runtime gitlink.

The browser-core updater computes impact and previews publication in a read-only
job. A separate writer checks out trusted current source, installs no project
dependencies, reprepares the update and requires the classified base/target to
match before publishing only the gitlink PR. Its pinned runtime setup and
publication code still require maintainer trust. Release build/test jobs remain
read-only; existing protected-source, integrity and locked publication checks
remain required. Manual review, pins, checksums and attestations do not prove
that an upstream compiler, Action or resulting build is free of malicious code.

## Release publication

Chrome Web Store preparation has a separate
[submission reference](./docs/chrome-web-store.md) with reusable English listing,
permission and reviewer text. Keep its declarations aligned with
[the privacy policy](./PRIVACY.md) and the actual submitted ZIP. GitHub releases
do not submit to the store or prove approval/public availability. Verify a
public store listing before documenting store installation or updates; do not
assume settings migrate from an unpacked copy to a store-installed copy.

The ordinary release workflow publishes existing protected-source stable tags
in increasing semantic-version order. Validation can run in parallel, but all
tags share a publication lock. After acquiring it, the workflow rechecks the tag,
source manifest, bundle metadata, public release history and Latest selection
before writing. Historical targets and unavailable or conflicting state stop
publication; this workflow has no archive or rollback mode.

Provenance first verifies that the tagged source declares every command the
current release jobs invoke (`quality:coverage-owned`, `test:cov`, `build:e2e`,
`test:e2e:all`, `build:all:ci` and `release:prepare`). Older tags without one
of these public entrypoints fail before checkout jobs, with the missing names
reported. Compatible tags retain their own pinned Node runtime and scripts.

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
