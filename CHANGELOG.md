# Changelog

All notable changes to **X.com Enhanced Gallery** are documented in this file.

The format follows the principles of
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project
roughly adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Gallery auto-focus**: Adopted a multi-signal scoring model (viewport coverage, element visibility, focus-band overlap, and center-line hysteresis) so the gallery now consistently highlights the media a user is actually looking at after scroll stops. The new heuristics were informed by community Scrollspy implementations and MDN guidance on `IntersectionObserver` usage.
- **Tests**: Expanded `FocusCoordinator` coverage with focus-band and sticky-score scenarios while sharing helper utilities to keep the suite concise.
- **Refactor**: Modernized focus selection code for conciseness:
  - Extracted `clamp01` utility to shared module, eliminating duplication across `focus-coordinator` and `focus-score`.
  - Simplified calculation chains (viewport bounds, center proximity, hysteresis logic).
  - Reduced variable verbosity while preserving readability.
- **Prefetching**: Collapsed media prefetch scheduling down to `immediate` vs `idle`, inlining the idle helper and removing RAF/microtask pathways to shrink the bundle and surface-level API.
- **Performance utils**: Promoted the `schedulers` module from a stub into the canonical export surface for idle helpers so consumers import from `@shared/utils/performance` without orphan keep-alive files.
- **Services**: Removed the deprecated `getMediaServiceFromContainer` accessor and updated warmup helpers plus `GalleryApp` to rely on the strictly typed `getMediaService`, eliminating duplicate exposure of the same singleton.
- **Container**: Tightened the `registerGalleryRenderer` contract and co-located the `MediaService` accessor imports so dependency-cruiser only sees one exposure path for SERVICE_KEYS.
- **Media pipeline**: Dropped the unused `metadata.performance` payload and wrapped deduplication logging in a `__DEV__` guard so production builds exclude instrumentation-only code.
- **Styles**: Replaced outline-based focus rings in toolbar tweet links and shared utilities with flat background/border treatments, preventing stray outlines while preserving accessible focus cues.
- **Bootstrap**: Omitted the developer-tooling stage and dev-namespace wiring when building for production so diagnostics never execute or attach outside development.

### Removed

- Eliminated the legacy `GalleryHOC` compatibility shim and the `useGalleryInitialScroll` placeholder so no unused modules remain under `src/`. Dependency-cruiser no longer requires exceptions for these files, keeping the orphan check authoritative.
- Removed the standalone performance schedulers module (RAF/microtask helpers) and the associated tests now that idle scheduling is the only supported strategy.

## [0.4.16] - 2025-11-23

### Added

- **Feature**: Implemented "Instant Download" via media prefetching when gallery opens.
- **Optimization**: ZIP downloads now utilize prefetched memory cache (Blobs) to eliminate redundant network requests, significantly speeding up bulk downloads.

### Changed

- **Refactor**: Modernized `MediaService` and `DownloadService` architecture.
  - Integrated prefetch cache directly into download pipeline.
  - Removed legacy loading state management (`mediaLoadingStates`) and unused DOM helpers.
  - Consolidated error handling logic.
- **Cleanup**: Removed orphaned modules and simplified service interfaces.

## [0.4.15] - 2025-11-22

### Fixed

- **Critical**: Fixed `GM_xmlhttpRequest` detection in Tampermonkey/Greasemonkey environments (resolved "GM_xmlhttpRequest not available" error).
- **Critical**: Fixed Twitter API extraction failures by adding missing `Referer`/`Origin` headers and enforcing `responseType: 'json'`.
- Fixed TypeScript type definitions in `PersistentStorage` and `TwitterAPIClient`.

### Changed

- **Performance**: Removed performance measurement code (`logger.time`/`timeEnd`) from production builds to reduce bundle size and overhead.
- **Maintenance**: Removed orphaned modules (`zip-creator.ts`, `store-zip-writer.ts`) and unused scripts (`validate-build.ts`).
- **Refactor**: Improved code conciseness and removed unused internal logic.

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

### Security

- **Fix**: Enhanced XSS protection in `TweetTextPanel` by implementing double-sanitization of HTML content before rendering.
