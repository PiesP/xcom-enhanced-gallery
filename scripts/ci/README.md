# CI automation

## Change classification

`classify-changes.ts` uses only Node.js built-ins, so CI sets up the manifest-pinned
Node runtime through the shared action without installing project dependencies
or initializing the submodule.
It writes the existing gate keys and a reason to `GITHUB_OUTPUT`; `--files`
accepts explicit paths for policy checks. Pushes compare `BASE_SHA..HEAD_SHA`,
while pull requests and merge groups compare `BASE_SHA...HEAD_SHA`. Git paths
are NUL-delimited, and renames include both removed and added paths.

For pull requests and merge groups, the workflows load this CLI from the base
revision. If that revision lacks the TypeScript CLI during the first rollout,
every gate is selected. Failed diffs, empty diffs, and unknown paths also select
every gate. The candidate revision never supplies executable classifier code
for its own pull request check.

## Pinned security tools

`pinned-tools.json` records the Nose installer version and SHA-256, OSV scanner
image version and digest, and Semgrep version and image digest. The
dependency-free `check-pinned-tools.ts` reads that file, checks the newest stable
GitHub release older than 24 hours, verifies the Nose release asset digest, and
compares the OSV tag's GHCR manifest digest. Version drift is a warning;
missing/malformed metadata, API failure, or digest drift fails. The
dependency-free `install-nose.ts` downloads over HTTPS, verifies the installer
bytes before invoking `sh` without GitHub tokens, and adds Nose to `GITHUB_PATH`
only after installation succeeds, preserving child exit codes and signals.
`pinned-tools.ts env` appends validated OSV and Semgrep image references to
`GITHUB_ENV`; it accepts no arbitrary metadata path. All three CLIs are inert
when imported.

The security workflow resolves both scanner images in a separate job from the
reviewed `a1fd01821cab105c6a6430ee81e18030532843e8` revision, then passes
the validated values to the OSV and Semgrep jobs. Its scheduled freshness job
uses the same revision. Deep verification and release duplication read the
installer and metadata from that revision with `git show`, even when the
checkout changes to a release commit. Each job sets up Node before running a
private copy of the dependency-free helpers. PR candidate code cannot replace
these pinned tools for its own privileged check. Update the immutable revision
only with a reviewed pin change, and keep the scanner images and installer
source together. Run the focused CLI fixture test with
`pnpm test test/unit/config/pinned-tools-cli.test.ts`.

## Deep check reuse

`deep-check-reuse.ts` fingerprints tracked input bytes, pinned tool versions, the
selected gate, and the runner platform. A valid marker records a successful run
of that fingerprint. The weekly Deep Verification workflow may reuse it; a
manual run needs the `reuse_success` option. Changes to `ImageVersion` alone do
not invalidate a marker, but the version is recorded for provenance.

Check the script with the repository's pinned toolchain:

```sh
pnpm test:ci
pnpm check:scripts
```

The workflow invokes the TypeScript CLI using `node --experimental-strip-types`
and provides its required runner metadata and `GITHUB_OUTPUT` path. It installs
the pinned runtime before reading a fingerprint, then installs project
dependencies only when a fresh mutation analysis is needed.

Successful version 3 markers record the originating run ID, attempt, SHA, and
analysis time. Before reuse, bounded paginated Actions history must confirm the
original gate and every later selected gate. New failures, cancellations,
unfinished checks, changed attempts, and unavailable history run fresh. Eligible
successful default-branch runs attempt to publish a new immutable run-specific
key so recovery after failure can be reused later. Publication is best-effort.
The workflow records decision reasons and estimates avoided analysis seconds
from the original successful analysis step. Missing or invalid timing leaves
the estimate unavailable; it excludes restore/API overhead and net billing.

Reruns (`GITHUB_RUN_ATTEMPT > 1`) always analyze selected gates afresh, including
scheduled runs and manual reuse opt-ins. Actions run listings expose only the
latest attempt, so excluding the current attempt can hide its prior failures.
A successful fresh rerun may still publish its own marker for a later run's
first-attempt reuse.
