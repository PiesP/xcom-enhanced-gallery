# Security policy

This policy covers the userscript and the Chrome and Firefox extension builds
of **X.com Enhanced Gallery**.

## Supported versions

Security support is provided for the latest release on
[GitHub Releases](https://github.com/PiesP/xcom-enhanced-gallery/releases).
Older releases and unpacked extension builds copied from older releases are not
maintained.

Userscript managers can update the userscript automatically. Unpacked Chromium
and temporary Firefox installations must be replaced manually when a new
release is published.

## Report a vulnerability

Do not disclose vulnerabilities in a public issue.

1. Prefer a [private GitHub Security Advisory](https://github.com/PiesP/xcom-enhanced-gallery/security/advisories/new).
2. If advisories are unavailable, open a minimal issue requesting a private
   contact channel without including technical details.

Include the impact, reproduction steps, distribution, release version, browser,
and OS when available. We aim to respond within seven business days and
coordinate disclosure after a fix is available.

## Security and privacy model

- Application logic runs in the browser on X.com pages.
- The project does not operate an analytics, telemetry, or media-processing
  server.
- Runtime requests use X/Twitter page, API, and media hosts required to discover
  and download media.
- Userscript installation and update metadata is distributed through GitHub
  Releases and the jsDelivr-hosted `release` branch artifacts.
- Extension permissions are declared in the versioned manifests.
- The application does not use `eval()` or equivalent dynamic code execution.

See [PRIVACY.md](../PRIVACY.md) for data, storage, and network details.

## Development security

CI combines strict TypeScript, Biome, dependency and circular-import checks,
unit coverage, userscript and extension Playwright tests, production builds,
duplication analysis, mutation testing, CodeQL, OSV Scanner, and Semgrep. The
workflow files and package scripts are authoritative for the exact checks.

Dependencies retain the repository's cooling window, trust policy, approved
build-script list, and registry-source restrictions. Do not weaken those
controls to accept an update.

Codex Security is an advisory, AI-assisted complement to these deterministic
gates. Local scans use `pnpm security:codex:dry-run`,
`pnpm security:codex:working-tree`, `pnpm security:codex:branch`, or
`pnpm security:codex:full`. CI scans same-repository pull request diffs and
manual full-repository requests only after the `CODEX_SECURITY_ENABLED` Actions
variable is set to `true` and the `CODEX_SECURITY_API_KEY` secret is configured.

Scan findings require human source-to-sink validation and severity review before
they are treated as vulnerabilities or made blocking. Reports, JSON, SARIF, and
coverage artifacts can contain private source excerpts or vulnerability details;
keep them access-controlled and retain them only as long as needed. The rollout
remains non-blocking and does not replace CodeQL, OSV, Semgrep, tests, or release
validation.

## Scope

In scope are vulnerabilities introduced by this repository, including
injection, unsafe URL or media handling, permission misuse, privacy leaks, and
supply-chain issues. Vulnerabilities in X.com, browsers, and userscript managers
should be reported to their respective vendors unless this project's
integration causes the issue.

## License

This project is licensed under the [MIT License](../LICENSE).
