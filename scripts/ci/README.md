# CI automation

## Change classification

`classify-changes.ts` uses only Node.js built-ins, so CI sets up the `.node-version`-pinned
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

`pinned-tools.json` records the OSV scanner and Semgrep image versions and digests.
The reviewed `browser-core/automation/actions/prepare-scanner-pins` Action
copies its dependency-free CLI into private runner storage. The security
workflow separately copies this repository's reviewed JSON to a private file
and passes its absolute path to both `env` and `check`. `env` writes validated
image references to `GITHUB_ENV`; `check` checks stable GitHub releases older
than 24 hours and the OSV tag's GHCR manifest digest. Version drift warns;
invalid metadata, API failure, or digest drift fails.

The workflow pins provider code and consumer data independently by full SHA.
Both paths run after the selected Node setup, and no scanner code or pin data
comes from a candidate PR checkout. The provider snapshots in
`test/fixtures/scanner-provider/` are test-only copies from the reviewed Action
revision. `test/unit/config/pinned-tools-cli.test.ts` checks their byte hashes
and tests the Action closure with this repository's metadata. Its workflow
contract test verifies the trusted checkout and caller paths. Keep the JSON
revision fixed until a replacement lands and passes review.
