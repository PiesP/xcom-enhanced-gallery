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

`pinned-tools.json` records the OSV scanner image version and digest, and
Semgrep version and image digest. The dependency-free `check-pinned-tools.ts`
reads that file, checks the newest stable GitHub releases older than 24 hours,
and compares the OSV tag's GHCR manifest digest. Version drift is a warning;
missing/malformed metadata, API failure, or digest drift fails.
`pinned-tools.ts env` appends validated OSV and Semgrep image references to
`GITHUB_ENV`; it accepts no arbitrary metadata path. Both CLIs are inert
when imported.

The security workflow resolves both scanner images in a separate job from the
reviewed `d5fdf58387e43dec380331a1ab6577c0a2cb8f6a` revision, then passes
the validated values to the OSV and Semgrep jobs. Its scheduled freshness job
uses the same revision. Each job sets up Node before running a private copy of
the dependency-free helpers. PR candidate code cannot replace these pinned
tools for its own privileged check. Update the immutable revision only after
the replacement helper closure lands and passes review. Run the focused CLI fixture test with
`pnpm test test/unit/config/pinned-tools-cli.test.ts`.
