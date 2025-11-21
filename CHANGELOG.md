# Changelog

All notable changes to **X.com Enhanced Gallery** are documented in this file.

The format follows the principles of
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project
roughly adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- No user-facing changes have been recorded yet.

## [0.4.14]

### Added

- Additional automated security and quality checks in GitHub Actions, including
  hardened code scanning and dependency scanning with SARIF uploads to the
  Security tab.
- New internal guards that block unsafe relative imports and invalid style
  import patterns, helping enforce the path-alias-only policy across the
  source tree.
- Automatic pausing of ambient X.com videos when the gallery opens so their
  audio does not compete with the overlay.
- More robust media extraction for quote tweets, long tweets (Notes), and
  video/image URLs while keeping filenames predictable and human-readable.

### Changed

- Reworked focus styles and toolbar visuals into a flatter, token-driven
  design: gradients, drop shadows, and ad-hoc `!important` rules were removed
  in favor of shared design tokens and CSS custom properties.
- Updated toolbar behavior so pointer navigation and keyboard navigation follow
  the same wrap-around rules when browsing multiple media items.
- Simplified core result types and service contracts, removing redundant
  aliases and type cycles while keeping public APIs stable.
- Refined username extraction and filename generation so downloads avoid
  `unknown` placeholders even when X.com markup changes.

### Fixed

- Resolved a regression where toolbar buttons that started disabled (for
  example, the **Previous** button on the first item) could remain stuck even
  after navigation.
- Fixed cases where toolbar navigation did not wrap around correctly at the
  beginning or end of a gallery, especially for pointer users.
- Hardened URL sanitization in the HTML sanitizer and media pipeline to reject
  malformed or encoded `javascript:`-style schemes and other unsafe protocols
  before they reach the DOM.
- Improved error reporting when style injection fails so diagnostics can be
  collected without depending on `console` output.

### Removed

- Deprecated high-contrast shims, unused configuration toggles, and legacy
  compression helpers that no longer had any runtime callers.
- Older toolbar wrapper components and related styling that became obsolete
  after the focus and toolbar refactors.
- A bespoke command-line security gate in favor of leaner, GitHub-native
  security features and centralized scanning inside GitHub Actions.

## [0.4.2]

### Added

- Extended filename handling so downloaded media follow a consistent naming
  pattern of `{username}_{tweetId}_{YYYYMMDD}_{index}.{ext}`.
- Improved gallery event initialization to support explicit gallery root
  scoping and reliable cleanup.

### Changed

- Adjusted scroll restoration logic around threshold comparisons to avoid
  jitter and handle boundary values correctly when returning to a tweet.

### Fixed

- Resolved the remaining failing tests from earlier phases and confirmed a
  100% pass rate for the main unit test suite.

### Quality

- Verified TypeScript, ESLint, and style checks all pass with strict settings
  and maintained existing production bundle size targets.

## [0.4.1]

### Added

- Parallel validation commands for local development to better use multicore
  CPUs during build validation and test runs.

### Changed

- Reduced local build validation time by reorganizing quality checks and
  aligning memory limits across scripts.
- Cleaned up deprecated infrastructure utilities that were superseded by newer
  testing and service harness patterns.

### Performance

- Improved build validation throughput and stability on typical development
  machines without changing the shipped userscript bundle size.

## [0.4.0]

### 🎉 Project Stabilization Milestone

- Upgraded the baseline Node.js version to 22 and refreshed the CI matrix to
  verify the project on modern runtimes.
- Tightened code quality by reducing unsafe type assertions, decomposing large
  utilities into smaller modules, and documenting development principles.
- Confirmed that TypeScript strict mode, ESLint, and GitHub code scanning all
  pass, marking the transition into long-term maintenance mode for the
  userscript.
