# Security Policy

This document describes how security is handled for **X.com Enhanced Gallery** and how to responsibly report vulnerabilities.

---

## Supported Versions

We only provide security support for the **latest released version** of the userscript on [GitHub Releases](https://github.com/PiesP/xcom-enhanced-gallery/releases).

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| Older   | :x:                |

Userscript managers (Tampermonkey, Violentmonkey, etc.) can auto-update the script; we recommend keeping auto-update enabled.

---

## Reporting a Vulnerability

If you discover a security vulnerability, **do not** disclose it publicly.

1. **Preferred**: Use [GitHub Security Advisories](https://github.com/PiesP/xcom-enhanced-gallery/security/advisories/new).
2. If that is not available, open a minimal GitHub issue asking for a private channel **without** sharing technical details.

Please include, where possible:

- A short description and impact
- Steps to reproduce
- Browser, OS, and userscript manager versions
- Script version (from the userscript header)

We aim to respond within **7 business days** and coordinate disclosure once a fix is available.

---

## Security Model & Privacy

**X.com Enhanced Gallery** is a **PC-only, client-side userscript** that runs entirely in your browser on X.com.

- All logic executes locally in the browser.
- We do **not** collect, store, or transmit personal data or authentication tokens.
- Runtime network requests are limited to:
  - `api.twitter.com`
  - `pbs.twimg.com`
  - `video.twimg.com`
- Installation and update metadata are distributed through GitHub Releases and
  the jsDelivr-hosted `release` branch artifacts referenced by the userscript
  header.
- The script does not use `eval()` or similar dynamic code execution.

---

## Development Security

We use several mechanisms to keep the codebase secure:

- **GitHub Security Suite** (`.github/workflows/security.yaml`)
  - CodeQL for JavaScript/TypeScript and GitHub Actions
  - OSV Scanner for pull-request diff scans and daily full scans
  - Static analysis (Semgrep) on PR, daily, and manual runs
  - Daily freshness checks for pinned Nose, OSV Scanner, and Semgrep releases
- **Dependabot** (`.github/dependabot.yaml`)
  - Daily npm and GitHub Actions updates after a 24-hour cooling window
- **Quality & Testing**
  - pnpm enforces the same cooling window, recent trust-level non-downgrade,
    reviewed install scripts, and registry-only transitive dependencies
  - TypeScript strict mode, Biome, Knip, circular-dependency checks, duplication
    analysis, tracked unit tests, Playwright userscript/extension E2E, and mutation tests

These checks run through GitHub Actions and the same local `pnpm` workflows used
for development.

---

## Scope

In scope for this policy:

- Vulnerabilities in this userscript (XSS, injection, logic flaws, privacy leaks)
- Vulnerabilities introduced by this repository’s dependencies

Out of scope:

- Issues in X.com itself (report via https://hackerone.com/x)
- Bugs in userscript managers (Tampermonkey, Violentmonkey, etc.)

---

## License

This project is licensed under the [MIT License](../LICENSE).
