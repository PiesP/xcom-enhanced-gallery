# Change classification

`classify-changes.ts` uses only Node.js built-ins, so CI sets up its pinned Node
runtime without installing project dependencies or initializing the submodule.
It writes the existing gate keys and a reason to `GITHUB_OUTPUT`; `--files`
accepts explicit paths for policy checks. Pushes compare `BASE_SHA..HEAD_SHA`,
while pull requests and merge groups compare `BASE_SHA...HEAD_SHA`. Git paths
are NUL-delimited, and renames include both removed and added paths.

For pull requests and merge groups, the workflows load this CLI from the base
revision. If that revision lacks the TypeScript CLI during the first rollout,
every gate is selected. Failed diffs, empty diffs, and unknown paths also select
every gate. The candidate revision never supplies executable classifier code
for its own pull request check.

# Deep check reuse

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
