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
| `pnpm check:biome`, `fmt`, `fmt:check`, `lint`, `knip`, `knip:full`, `knip:production`, `circular` | Canonical Biome format/lint/assist inspection, convenient format-only/lint-only commands, dependency/entry analysis, and source graph checks. | Read-only; Knip uses real CLI/workflow/test/runtime entries and reports orphan helpers, and `ignoreBinaries` includes external OpenSSL. `fmt:fix`, `lint:fix`, `quality:fix` write formatting fixes and must be reviewed separately. |
| `pnpm quality`, `verify`, `verify:full` | `quality` chains one read-only `biome ci` pass, all runtime type checks, the focused policy suite, circular, and Knip. `verify` adds production userscript/metadata and both extension targets; `verify:full` adds coverage, a retained development userscript build, and all E2E browser lanes. Its internal coverage command omits only the boundary suite already run by `quality`. | Build/test outputs and browser profiles are generated; `verify:full` leaves production and development userscripts together with production metadata. `verify` alone does not prove E2E. Read exact command outcomes and artifacts; no VM/publication inference. |
| `pnpm test`, `test:watch`, `test:cov`, `test:ci` | Vitest suites and direct Node CI policy tests in `scripts/ci/{deep-check-reuse,repository-authority}.test.ts` and `scripts/release/verify-source.test.ts`. | Watch persists; coverage writes reports. `test:ci` also runs real compiler/import boundary probes; run that part alone with `pnpm test test/unit/tooling/node-ambient-types.test.ts`. This focused suite checks cache, repository authority, tagged source and runtime types; it is not the complete unit suite. |
| `pnpm test:e2e`, `test:e2e:headed`, `test:e2e:extension`, `test:e2e:extension:firefox`, `test:e2e:all` | Playwright configs under `test/e2e/`; direct Firefox lane executes `test/e2e/firefox-extension-runtime.test.ts` with Node/Selenium. | Requires built artifacts, browser binaries and loopback fixtures; may create browser profiles/downloads. `test:e2e:all` chains the lanes; distinguish fixture browser evidence from authenticated Windows/live-site evidence. |
| `pnpm mut:prepare`, `mut`, `mut:fast` | Prepare a disposable checkout, then run the full or fast Stryker profile through `scripts/ci/mutation-workspace.ts`. | Preparation records the selected commit, core, and installed dependencies. Each analysis writes only in that checkout, including `reports/mutation/`, Stryker temporary files, and `.git/xeg-mutation/` records and logs. Use one fresh checkout per analysis; see the preparation steps below and the deep-check workflow receipts. |

### Mutation workspace

### Mutation runs

Mutation testing uses Stryker's `inPlace` mode. Even `dryRunOnly` can write source
and temporary files during instrumentation. Run either profile in a separate,
independent full clone on Linux or WSL; native Windows invocation is refused.
Directly invoking the Stryker binary in a maintainer checkout bypasses this
protection and is unsafe. A run record helps prevent accidental use of the wrong
checkout; it is not an OS sandbox for hostile code.

Select a committed revision explicitly. The example creates a new directory
outside the source checkout; replace both absolute paths before running it.

```bash
MUTATION_SOURCE=/absolute/path/to/xcom-enhanced-gallery
MUTATION_COMMIT=$(git -C "$MUTATION_SOURCE" rev-parse HEAD)
MUTATION_CLONE=/absolute/path/outside/source/xeg-mutation-1
git clone --no-local --no-hardlinks --no-checkout "$MUTATION_SOURCE" "$MUTATION_CLONE"
git -C "$MUTATION_CLONE" -c advice.detachedHead=false checkout --detach "$MUTATION_COMMIT"
git -C "$MUTATION_CLONE" submodule sync --recursive
git -C "$MUTATION_CLONE" submodule update --init --recursive
(
  cd "$MUTATION_CLONE"
  pnpm install --frozen-lockfile --package-import-method=copy
  pnpm mut:prepare "$MUTATION_SOURCE" "$MUTATION_COMMIT"
  pnpm mut:fast # or pnpm mut, using a new clone for the other profile
)
```

Uncommitted source or core edits are not included in the selected commit and
must not be described as tested. `pnpm mut` and `pnpm mut:fast` refuse an ordinary
maintainer checkout before instrumentation. Do not build, probe, or run another
agent in the disposable checkout during mutation. Deep and Release jobs use
their own job checkout directly, bound to the selected commit; they keep the
same canonical `pnpm mut:fast` report location and threshold.

Local diagnostic arguments are `--dryRunOnly`, `--concurrency`/`-c` (1–32),
`--logLevel`, `--mutate`/`-m`, and `--testFiles`/`-t`. Pass paths as relative
comma-separated globs within the clone. Other configuration and output path
overrides are refused; hosted gates accept no overrides. The full command keeps
its progress reporter and the fast command keeps its configured reporters.

If a run fails or is interrupted, inspect `.git/xeg-mutation/`, reports, Stryker
backups, and the checkout's remaining processes before taking action. Preserve
logs and backups while deciding whether restoration completed. Compare any
modified content with its **before-run** state; `HEAD` cannot reconstruct dirty
before-run edits. A forced shutdown can prevent cleanup or final status writes.
Use a new disposable checkout for the next run, and discard the old one manually
only after confirming its ownership, process state, and retained evidence. Do
not reset or clean the maintainer checkout as a recovery step.

### Quality ownership

`check:biome` runs `biome ci .`: one read-only pass for formatting, lint and
assist/import checks. It neither writes fixes nor promotes trial warnings to
errors. `fmt`/`lint` remain read-only conveniences; their `:fix` variants and
`quality:fix` write reviewed safe fixes. No gate runs repository-wide unsafe fixes.

| Check | Local owner | Hosted owner |
| --- | --- | --- |
| Canonical Biome, every runtime type project, dpdm and full/production Knip | `quality` (also ordinary prebuild and `verify`) | CI/release quality |
| Focused direct Node policy tests | `test:ci`; retained within `quality` | CI quality when selected, otherwise CI unit for an explicitly unit-only decision; release quality |
| Runtime/import boundary probes | `test:ci`; retained within `quality` and `verify` | CI/release unit coverage when selected; CI quality when unit is explicitly unselected |
| Complete unit suite and unchanged coverage thresholds | `test` / `test:cov`; `verify:full` uses internal `test:cov:after-policy` after `quality` | CI/release unit |
| Production distributions / browser fixtures | `build:all:ci` / browser lane commands | CI/release build and E2E |
| Mutation thresholds and security scans | Separate commands/workflows | Existing deep/release and security owners |

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
| `.github/workflows/deep-checks.yaml` | `scripts/ci/deep-check-reuse.ts` owns bounded mutation reuse. A fresh run installs project dependencies, admits its job-owned checkout with `scripts/ci/mutation-workspace.ts`, and uploads mutation reports before recording success. | `scripts/ci/deep-check-reuse.test.ts`; invalid markers or unavailable history run fresh. |
| `.github/workflows/security.yaml` pinned tools and OSV | `scripts/ci/pinned-tools.json` owns tool versions and digests; trusted private copies of `pinned-tools.ts` and `check-pinned-tools.ts` supply image environment and freshness checks. The independently pinned browser-core `automation/actions/prepare-osv` supplies the private `consumer` OSV helper; `packages/core` remains the runtime gitlink. | `test/unit/config/pinned-tools-cli.test.ts`, `test/unit/config/osv-workflow-composition.test.ts`, and provider OSV fixtures; `docs/osv-workflow.md` records trust order and live-container limits. |
| `.github/workflows/release.yaml` | `scripts/release/verify-source.ts` checks protected tagged source before fan-out; `prepare.ts` creates local release files and `verify-publication.ts` checks the public write decision in the locked publish job. Runner `run:` blocks still select checkout, append short outputs, and launch artifacts/actions. | `scripts/release/verify-source.test.ts`, `test/unit/tooling/{release-runtime,release-publication}.test.ts`, and exact-source artifact inspection. Preparation does not publish. |
| `.github/dependabot.yaml`, `update-browser-core.yaml` | Dependabot opens npm and GitHub Actions update PRs for maintainer review; repository workflows do not approve or merge dependency updates. `scripts/ci/update-browser-core.ts` verifies remote SHA/impact and owns gitlink PR preparation/publication. Workflow shell supplies event inputs and bounded output/checkout glue. | `test/unit/config/dependency-review-policy.test.ts`, `test/unit/tooling/browser-core-automation.test.ts`, `scripts/ci/repository-authority.test.ts`; privileged results require exact-SHA hosted evidence. |
| `.githooks/pre-commit`, `.githooks/pre-push` | Small Git-invoked Bash guards before any Node setup: reject detached/default-branch commit and direct default-branch push; no network or write by the hooks. | `test/unit/tooling/git-hooks.test.ts`. Retained minimal pre-runtime Git transport exception; revisit if the hook execution contract guarantees pinned Node before invocation without weakening the branch guard. |
| Test subprocess callers | `test/unit/tooling/{command-adapters,workflow-change-classifier-git,node-script-boundaries,release-runtime,git-hooks}.test.ts` and `test/e2e/firefox-extension-runtime.test.ts` invoke CLI, Git, Node, or browser helpers with fixtures. `scripts/ci/repository-authority.test.ts` exercises privileged command policy; provider tests own OSV parser/scanner behavior. | Run the focused suite and NodeNext checks after an entrypoint change; fixtures do not prove live browser or publication behavior. |

### Windows bundle and retained languages

The Windows profile uses `profile.mjs`; `validation/windows/profile.json` declares installation `install-profile.mjs`, `live-page.mjs`, and built extension/userscript assets. The controller ships portable Windows Node and `playwright-core`, then imports raw `.mjs` with `run({ browser, root, output })`; no TypeScript transpilation/loader or duplicate generated source is declared.

Retain these handwritten JavaScript modules with a concrete review trigger: revisit when the controller supports a source-bound TS build plus stale-output check, updates every profile asset/import, and completes focused prepared-VM smoke. `validation/windows/README.md` describes bundle inputs and targeted `node --check` commands; the Node boundary suite runs `node --check` over every `validation/windows/**/*.mjs` file, followed by the existing Windows-focused unit tests. A syntax check is not VM acceptance.

Small workflow shell blocks remain runner bootstrap, checkout, output, and action-launch adapters; revisit them when tested Node entrypoints can preserve trusted-source and write ordering. The Git hooks remain Bash because Git invokes them before pinned Node setup.
The external `zip`, Git, browser, and vendor installer are tools, not handwritten project languages.

Run `pnpm build:e2e` before direct browser lanes so generated fixtures are
current. Use the narrowest relevant check while working, `pnpm verify` before
a pull request, and `pnpm verify:full` for publication-level or browser
behavior changes. A local build or fixture run does not establish Windows,
live-site, hosted-CI, or public-release evidence.

## Project constraints

### Managed-file checks

Biome uses default inclusion for maintained JavaScript (including `.mjs`),
TypeScript/TSX, CSS, JSON and HTML. HTML formatting is explicitly enabled;
embedded JavaScript is also checked. The root configuration keeps two-space
indentation, a 100-column target, LF, single JavaScript quotes, semicolons,
ES5 trailing commas and parenthesized arrow parameters. Its 1 MiB file limit
is checked against every tracked supported file by the executable coverage suite.
New files in these families select CI quality, including dot-directory helpers
and new root configurations. Unknown changed paths still select every gate.

| Maintained family | Formatting/lint owner | Types or other validation | Changed-path CI owner |
| --- | --- | --- | --- |
| `src` TS/TSX/CSS | Root Biome | `check:src`; behavior suites | Quality, unit, E2E, build; existing security gates |
| Tests, fixtures and visual JS/TS/TSX/HTML | Root Biome | Test/Playwright/Node projects; unit and applicable browser suites | Quality plus existing unit/E2E selections |
| `scripts`, `tooling`, root TS/JSON configs | Root Biome | Runtime-specific projects, command/config regression suites | Quality plus existing unit/build/browser/security selections |
| Windows validation `.mjs` and profile JSON | Root Biome | `node --check` through the Node-boundary suite; Windows profile tests | Quality, unit, E2E; existing JavaScript security gate |
| Executable `.github/actions` helpers | Root Biome | Runtime-resolution and workflow trust/order tests | Quality, unit; existing Actions security gate |
| Extension manifests | Root Biome | Version and built-package checks | Quality, unit, E2E, build |
| YAML/workflow embedded shell, Markdown, TOML, PowerShell and Git hooks | Not Biome languages in this gate | Existing configuration/command tests, Bash hook execution, GitHub workflow validation and Windows runner where applicable; no general prose/TOML/PowerShell linter is claimed | Existing workflow, documentation and conservative unknown-path routing |

VCS ignores keep dependencies and generated outputs outside the managed scope.
The reviewed `packages/core` provider gitlink and generated `pnpm-lock.yaml`
are explicitly excluded. Captured host markup in
`test/fixtures/authenticated-x-layouts/*.html` preserves its original bytes and
structure; the routing suites consume these fragments unchanged. Other files in
that directory are not excluded.

Installed-page HTML fixtures deliberately reproduce X's native markup. Only
their host-only `noNoninteractiveTabindex`, `useSemanticElements`,
`useFocusableInteractive`, `noRedundantAlt` and `useAnchorContent` diagnostics
are exempted; changing native markup would change the extraction scenarios.
Product accessibility and the remaining fixture checks stay enforced. Local
acceptance cleanup exceptions retain the primary error with cleanup errors;
the hostile thenable and deadline-controlled polling fixtures state their reasons
beside the exceptional statements.

`test/unit/tooling/biome-coverage.test.ts` executes the installed tool with the
root configuration. It checks valid and violating examples in every maintained
family, embedded HTML JavaScript, excluded generated/captured inputs, VCS ignore
behavior and the actual processed-file inventory. Classifier tests exercise both
direct paths and real Git-event diffs, including additions, deletions, renames
and invalid/missing history. Passing TypeScript alone is not formatting or lint
coverage; syntax/fixture success is not Windows runtime acceptance.

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

The five repository-wide compiler/Biome/Knip probe suites run in a serial
Vitest project after the ordinary parallel unit project. They temporarily create
source files that another repository-wide tool could otherwise observe; both
project ordering and one-file-at-a-time execution are required. Setup, aliases
and coverage remain inherited, with all coverage thresholds unchanged.

Knip's project globs include maintained Windows and Action `.mjs` helpers, but
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

The installed Biome schema and `biome explain <rule>` establish supported keys,
defaults, domains and fix safety. Start from its recommended preset; explicit
error levels below remain necessary where that preset is only warning/info.
`test/unit/tooling/biome-policy.test.ts` exercises the selected scopes with real
positive, negative and restored controls. Warnings are visible advice and are
not promoted indirectly with an error-on-warnings flag.

| Rule or family | Selected disposition and evidence |
| --- | --- |
| `noUnusedImports`, `useConst`, `noUnusedTemplateLiteral`, `useExponentiationOperator` | Retain errors; supported-file coverage probes reject explicit violations. |
| `noExplicitAny`, `noImplicitAnyLet`, `useIterableCallbackReturn` | Retain errors. Typed sparse/invalid test fixtures preserve their original values; callback side effects do not return ignored values. |
| `noUselessTernary`, `noUselessSwitchCase`, `noUselessEmptyExport`, `noUselessLoneBlockStatements`, `noAccumulatingSpread` | Retain errors. The module-only global augmentation has its existing local empty-export exception. |
| `noStaticElementInteractions`, `useKeyWithClickEvents`, `noSvgWithoutTitle`, `useAriaPropsSupportedByRole`, `useSemanticElements` | Retain errors. Existing backdrop/native-control delegation exceptions keep native keyboard behavior; semantic-control and SVG probes reject violations. Host-markup fixture exceptions remain limited to the documented rules. |
| `useExhaustiveDependencies` | Off. React dependency arrays do not validate Solid's tracked property reads. |
| `noSolidDestructuredProps` | Explicit error. A reactive-props negative probe fails; direct access, accessors and `splitProps` controls pass. Intentional non-reactive snapshots belong outside component prop destructuring. |
| `noUnusedVariables` | Error in TS and unchecked JS/MJS. Retain compiler unused checks as complementary evidence: the Biome trial detected an unused catch binding and an unchecked Vitest config variable. No equivalence-based removal is claimed. |
| `noNonNullAssertion` | Error for product `src`; typed nonproduct fixtures are outside that scope. Product code narrows captured values and reports broken internal ownership rather than silently skipping work. The bounded CRC byte kernel has one reviewed local exception: adding a branch to every byte only to repeat the proven loop bound would change its cost. Solid refs use typed callbacks. |
| `noParameterAssign`, `noSelfCompare`, `noAssignInExpressions` | Errors. Rebinding parameters fails; property mutation passes. Namespace initialization uses statements, preserving ownership and avoiding an assignment inside another expression. |
| `noControlCharactersInRegex` | Error with local exceptions only for explicit URL/message sanitizers and validation of external manager labels. The rule probe rejects unrelated control-character regexes. |
| `noDocumentCookie` | Error. Product reads remain valid; controlled test/VM cookie setup/reset carries local reasons. Direct product assignment is rejected. |
| `noUnknownMediaFeatureName`, `noUnknownPseudoElement` | Errors; installed-version checks accept the project's required modern/vendor CSS without a global exception. Negative unknown-feature/pseudo-element probes fail. |
| `useMediaCaption` | Error. Only externally sourced X video and native-host fixture videos without supplied tracks have local exceptions; ordinary missing-caption probes fail. Do not fabricate tracks. |
| `noForEach`, `noStaticOnlyClass`, `noArrayIndexKey` | Keep off. Choose constructs by responsibility; Solid list identity is a behavior contract, and asynchronous callbacks still need a failure owner. |
| `noFocusedTests` | Explicit error. A real-tool `.only` probe is rejected without running that fixture. A fit-mode accessor is named `fitMode` to avoid the tool's Jasmine `fit()` detection. |
| `useBlockStatements` | Error after the separately reviewed braces conversion. The transformation only wrapped statement bodies and preserved their syntax/ownership; normal checks never run its unsafe autofix. The installed-tool probe rejects missing braces and accepts the restored control. |
| `useSolidForComponent` | Adopt warning. The trial finds five JSX list sites; retain current identity/disposal behavior until a conversion has observable keyed/index/reuse tests. Ordinary data transformations are outside the rule's purpose. |
| `noConfusingVoidType` | Adopt warning. The trial accepts the current callback/cleanup contracts; do not replace valid `void` contracts with `undefined` automatically. |
| `noFloatingPromises`, `noMisusedPromises` | Leave these experimental typed nursery rules off after trial. The former accepts `void task()` and found no current violations; the latter reported eleven sites including valid Promise/function existence checks. Same-scope warm medians were about 297/302 ms versus 90 ms for unused-variable analysis. This partial inference does not replace a Promise's actual result/failure owner. |

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
