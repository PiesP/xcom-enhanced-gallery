# Changelog

All notable changes to **X.com Enhanced Gallery** are documented in this file.

The format follows the principles of
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project
roughly adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2025-12-24

### Added

- **Production Optimization**: Implemented conservative JSDoc pruning for production builds to reduce bundle size.
- **Userscript Metadata**: Added auto-detection for `@connect` hosts in userscript header.
- **Testing Support**: Added `data-testid` prop to IconButton component for improved testing capabilities.
- **Media Extraction**: Implemented comprehensive media extraction from tweets in twitter-parser module.
- **Utilities**: Added `extractVisualIndexFromUrl` function for media dimension handling.

### Changed

- **Service Architecture Modernization**: Removed singleton service exports and streamlined core service registration and initialization for better maintainability.
- **Internal API Cleanup**: Unified and streamlined selector usage across selectors, services, and utilities.
- **DOM Utilities**: Consolidated and enhanced DOM query helper functions with improved efficiency.
- **Event Handling**: Implemented AbortSignal cleanup utilities for better resource management.
- **Bundle Size Optimization**:
  - Removed lazy loading from gallery and optimized media rendering.
  - Implemented conditional logging based on `__DEV__` flag.
  - Optimized error reporting for reduced bundle size.
  - Replaced UI_ICONS with string literals for icons.
  - Simplified reactive dimensions and event handling.
  - Removed deprecated error handling and related utilities.
- **Code Quality**: Simplified boolean expressions across dev-tools, events, utils, dom-facts, and gallery components.
- **Logging**: Added production logging module for bundle size optimization with conditional logging in development mode.
- **Styles**: Simplified style registration and reduced bundle size through refactoring.
- **Type System**: Changed exported interfaces to type aliases for consistency.
- **Build System**: Updated entry file resolution based on production mode and removed slim alias.

### Removed

- **Legacy Code Cleanup**: Removed legacy event bus, context management, navigation state machine implementation, and deprecated production entry points.
- **Unused Components**: Deleted unused shared hooks layer, removed unnecessary files from filename, styles, media utilities.
- **Service Layer**: Removed warmup functions for critical and non-critical services.
- **Dead Code**: Cleaned up unused exports, functions, and types across toolbar, settings, i18n, logger, cookie utilities, download, twitter-auth, notification service, and singletons.
- **Performance Code**: Removed unused event listener management functions and redundant state accessors.

### Fixed

- **URL Handling**: Replaced `isSafeAndValidMediaUrl` with `isValidMediaUrl` for improved validation.
- **Documentation**: Updated security and contributing documentation for clarity.

### Performance

- **GM API Bindings**: Implemented cached GM_* bindings for improved performance.
- **Gallery Optimization**: Optimized ambient video guard and cleaned up keyboard handling.
- **Promise Utilities**: Enhanced single settler interface for better async handling.
- **CSS Features**: Optimized CSS feature detection logic.
- **Listener Management**: Improved listener manager with prefixed ID generation.
- **Lazy Loading**: Enhanced lazy loading with retry mechanisms.
- **Type Safety**: Optimized type safety helper functions.

### Build

- **Dependencies**: Updated knip to version 5.76.1 and @typescript/native-preview to 7.0.0-dev.20251219.1.
- **Vite**: Downgraded to version 7.3.0 for compatibility.
- **TypeScript**: Removed deprecated include and exclude options from tsconfig.

## [1.4.0] - 2025-12-22

### Added

- **Download Prefetching**: Added media prefetching to improve download responsiveness and reduce redundant network requests.
- **Production Entry Point**: Added a production-only bootstrap entry for a leaner, safer bundle.
- **License Build Tooling**: Added license management build tooling and emitted license files in the repository.
- **Meta Generation & Dist Cleanup**: Added build tooling to generate a meta-only file and to clean up production artifacts.
- **Icons**: Migrated UI icons to Lucide and introduced `UI_ICONS` for consistent icon usage across components.

### Changed

- **Runtime Imports**: Removed runtime dynamic imports to keep the userscript a single static bundle and improve tree-shaking.
- **Services**: Consolidated core services around singleton lifecycle patterns and reduced production logging.
- **Internationalization**: Simplified language registry definitions and removed lazy-loading for deterministic startup.
- **Build Output**: Optimized CSS class name hashing and improved production cleanup passes.

### Fixed

- **HTTP Requests**: Hardened abort/timeout handling and simplified error normalization in the HTTP request service.
- **Tooling**: Improved test helper reset safety and resolved Node typings mismatches.

### Dependencies

- Updated `@types/node` to version 25.0.3.
- Updated `@biomejs/biome` and `@typescript/native-preview`.

## [1.3.0] - 2025-12-18

### Added

- **Command Runtime**: Implemented command runtime infrastructure with HTTP request and navigation commands.
- **Download Pipeline**: Added a functional download planning core, a single execution flow, and fallback timers with runtime timeout handling.
- **Config Discovery (Node)**: Added Node-only config discovery utilities and aligned browser-safe helpers.
- **Wheel Scroll Guard**: Added utilities for managing wheel event propagation to prevent unintended page/gallery scrolling.
- **Events**: Added handling and logging for `DomFactsFailed` event flows.

### Changed

- **Userscript API Adapter**: Improved GM\_\* API resolution, environment detection, and safer fallbacks across userscript managers.
- **Event Handling**: Migrated DOM event management patterns to `EventManager`-backed cleanup and context handling.
- **Error Handling**: Centralized error normalization and improved cancellation/timeout detection and messaging.
- **UI/Toolbar**: Updated toolbar button styling for an icon-only design and improved accessibility/filename cleaning in the vertical gallery.
- **Build System**: Enhanced version retrieval and introduced production bundle cleanup passes.
- **Tree-shaking**: Refined selector exports and component imports for better dead-code elimination.

### Fixed

- **Licensing**: Updated license URLs to use the `master` branch.
- **Tooling/CI**: Improved tsconfig alias resolution error handling and updated CI formatting checks.
- **Networking**: Hardened abort/timeout signal handling in HTTP requests and retry logic.

### Dependencies

- Updated `@types/node` to version 25.0.2.
- Updated `pnpm` to version 10.26.0.

## [1.2.2] - 2025-12-15

### Changed

- **Build System**: Simplified version resolution and removed beta channel support for cleaner release process.
- **Service Architecture**: Consolidated accessor utilities and improved service registration patterns.
- **Type Safety**: Enhanced type safety and validation across gallery, settings, and service components.
- **Code Quality**: Replaced logger calls with no-op functions to maintain control flow without side effects.
- **Event Handling**: Improved event handling consistency and error propagation in bootstrap stages.
- **Media Utilities**: Reorganized media utilities with improved import structure.

### Removed

- **Legacy Code**: Removed deprecated scope references, legacy patterns, and unused code across components and services.
- **Beta Channel**: Removed beta channel support from build configuration.

### CI/CD

- **CDN Cache**: Added jsDelivr CDN cache purge step in release workflow for faster update propagation.
- **Release Process**: Added verification for backed up files and included meta.js in release artifacts.

### Dependencies

- Updated `cross-env` to version 10.1.0.

## [1.2.1] - 2025-12-14

### Fixed

- **Gallery Open Race Condition**: Fixed a critical bug where clicking an image would not open the gallery on the first attempt. The issue was caused by signal update ordering within `batch()` operations - `isOpen` was being set before `mediaItems`, causing `GalleryRenderer` subscribers to see an empty media array and skip rendering.

### Changed

- **Signal Update Order Documentation**: Added explicit documentation and helper function (`applyGalleryStateUpdate`) to enforce correct signal update order. The `GALLERY_SIGNAL_UPDATE_ORDER` constant now clearly defines that `isOpen` must always be updated last to prevent race conditions with subscribers.

## [1.2.0] - 2025-12-14

### Added

- **Deploy Channel System**: Implemented multi-channel deployment architecture supporting Release, Beta, and Development builds.
  - Release channel: Stable production builds (`xcom-enhanced-gallery.user.js`)
  - Beta channel: Pre-release testing builds (`xcom-enhanced-gallery.beta.user.js`)
  - Development channel: Debug builds with full source maps (`xcom-enhanced-gallery.dev.user.js`)
- **Meta-Only File Generation**: Added `xcom-enhanced-gallery.meta.js` for optimized update checking.
- **Build Scripts**: Added new npm scripts for channel-specific builds:
  - `build:beta` / `build:beta:fast` for beta channel
  - `build:release` for explicit release channel
- **Userscript Metadata Enhancements**:
  - Added `@homepageURL` for project homepage link
  - Added `@icon` with Twitter favicon
  - Added `@compatible` tags for browser compatibility (Chrome 117+, Firefox 119+, Edge 117+, Safari 17+)
- **Version Naming**: Implemented semantic versioning with channel suffixes:
  - Release: `1.2.0`
  - Beta: `1.2.0-beta.{commit}`
  - Development: `1.2.0-dev.{commit}`
- **Quoted Tweet Parsing**: Added support for extracting media from quoted tweets.
- **Config Discovery**: Added `findConfigAny` function for flexible configuration file discovery.
- **Coverage Utilities**: Added `coverageSmoke` function for v8 coverage mapping verification.

### Changed

- **Build System**: Migrated back to pnpm/Vite from Deno for improved ecosystem compatibility.
- **Dependencies**: Updated to latest versions:
  - `@types/node` to 25.0.1
  - `vite` to 8.0.0-beta.2
  - `esbuild` to 0.27.1
  - Added `cross-env` for cross-platform environment variables
- **Video Playback**: Improved video playback state update logic with better error handling.
- **Logging**: Replaced console.log calls with structured logger for consistent logging.
- **Object Path Utilities**: Simplified validation in `resolveNestedPath` and `assignNestedPath`.
- **Text Formatting**: Improved URL trailing punctuation handling in `formatTweetText`.
- **API Error Handling**: Enhanced error handling for API extraction failures with metadata integration.
- **Build Output**: Updated `@updateURL` to point to meta-only file for faster version checks.

### Fixed

- **Configuration Discovery**: Fixed default base path handling in `findConfig` function.
- **gitignore**: Cleaned up and improved comments in `.gitignore` file.

### Documentation

- **Deploy Structure Guide**: Added comprehensive `docs/DEPLOY_STRUCTURE.md` documenting the deployment architecture.

## [1.1.0] - 2025-12-08

### Changed

- **Build System**: Migrated from npm/Node.js to Deno for build tooling and quality checks.
- **TypeScript Configuration**: Enhanced strictness settings and improved Deno compatibility.
- **License Aggregation**: Improved license handling with consolidated MIT license block in userscript header.
- **Documentation**: Updated all MD files to reflect current project state (build commands, output size, API references).

### Added

- **CSS Optimization**: Added CSS comment removal utility for production builds.
- **Toolbar**: Added scroll detection to properly ignore gallery scroll state.
- **CI/CD**: Implemented Deno environment setup action for GitHub workflows.

### Removed

- **Unused Tampermonkey APIs**: Removed unused type definitions and detection logic for:
  - `GM_registerMenuCommand` / `GM_unregisterMenuCommand`
  - `GM_openInTab`
  - `GM_setClipboard`
  - `GM_getResourceText` / `GM_getResourceURL`
  - `@resource` metadata field
- **Legacy Configuration**: Removed `package.json`, `vite.config.ts`, and npm-based tooling.

### Fixed

- **Userscript URLs**: Updated download/update URLs to use master branch for stability.

## [1.0.0] - 2025-12-07

### Breaking Changes

- **Service Architecture**: Removed all legacy class-based service wrappers (`CoreServiceRegistry`, deprecated `getSetting`/`setSetting`, etc.) in favor of functional APIs and ES Module singletons with typed accessors.
- **Event System**: Unified `DomEventManager` into `EventManager` with centralized management and automatic cleanup.
- **State Management**: Removed `solid-js/store` dependency and selector abstractions for simpler signal-based state.
- **Type System**: Consolidated result types and removed unused runtime helpers from type files.
- **Import Patterns**: Deprecated `export * from` pattern; all exports now explicit for better tree-shaking.
- **Component APIs**: Removed legacy `GalleryHOC` compatibility shim and `useGalleryInitialScroll` placeholder.

### Added

- **Error Handling**: Implemented Higher-Order Functions (HOF) with `Result<T>` pattern for functional error handling.
- **Utilities**: Added `LazyLoader` utility for dynamic imports and `cx()` for CSS module class composition.
- **Gallery Features**: Added video volume and muted state settings; ambient video pause functionality with scope resolution.
- **Download System**: Enhanced download capabilities with fallback methods and CSS feature detection.
- **Service Pattern**: Implemented `createSingleton` helper for ES Module singleton pattern across services.
- **Tooling**: Migrated to Biome for linting and formatting (replacing ESLint/Prettier).

### Changed

- **Service Access**: Migrated to typed service accessors backed by ES Module singletons (see `docs/SERVICE_PATTERN_GUIDE.md`).
- **Lifecycle Management**: Implemented composition-based lifecycle management across services.
- **State Management**: Simplified and modularized navigation and UI states; removed selector abstraction layer.
- **Async Utilities**: Modernized with `AbortSignal` support.
- **Toolbar**: Grouped callback props into `handlers` object; removed close button hover-specific styling.
- **Event Handling**: Unified event system with centralized management and automatic cleanup.
- **Bootstrap**: Data-driven pipeline with `shouldRun` predicates; omitted developer-tooling stage in production.
- **Icons**: Consolidated 18 hero icons into single factory module.
- **CSS**: Optimized design tokens, consolidated duplicate styles, shortened class names, removed `!important` usage.
- **Build Target**: Optimized for `esnext` (Chrome 117+, Edge 117+, Firefox 119+, Safari 17+).
- **Dependencies**: Updated Playwright to 1.57.0, Vitest to 4.0.15, TypeScript to 5.9, and other dependencies.

### Fixed

- **Bootstrap**: Restored missing `shouldRun` condition in `executeStage`.
- **Object Path**: Added prototype pollution protection in `assignNestedPath`.
- **Gallery**: Improved click detection to use data attributes; fixed viewport focus logic and synchronization.
- **Media**: Optimized media element detection and ancestor traversal logic.
- **ErrorBoundary**: Improved error handling and retry mechanism with remounting.
- **Scroll**: Removed scroll snap behavior and disabled flex item shrinking in original fit mode.

### Removed

- **Legacy Services**: Removed `FilenameService` class, deprecated service wrapper classes, and obsolete type guards.
- **Unused Modules**: Eliminated legacy `GalleryHOC`, `useGalleryInitialScroll`, standalone performance schedulers.
- **Dependencies**: Removed `solid-js/store`, unnecessary npm options, and unused dependencies.
- **Configuration**: Removed Prettier plugin/rules, `tsconfig.base.json`, unused Stryker configs, and outdated GitHub Actions.
- **Dev Tools**: Removed notification service and related download notifications.

### Documentation

- **Guides**: Added comprehensive local validation guide, mutation testing analysis, and service pattern guide.
- **Cleanup**: Removed outdated Phase annotations from constants and hooks; cleaned up documentation breadcrumbs.

### Performance

- **Bundle Optimization**: Optimized for tree-shaking with explicit exports and ES Module singletons.
- **CSS**: Reduced bundle size through variable optimization and duplicate style consolidation.
- **Icons**: Reduced SVG path precision and removed unused icons.
- **ZIP**: Optimized `StreamingZipWriter` for runtime performance.

### Testing

- **Coverage**: Added mutation coverage tests for high-survived-mutant files.
- **Component Tests**: Expanded `FocusCoordinator` coverage with focus-band and sticky-score scenarios.
- **Visual Tests**: Maintained comprehensive visual regression testing.

### Analysis

- **Build Status**: All tests passing (221 total: 201 unit + 20 component tests) ✅
- **CSS Guidelines**: Zero `!important` usage maintained ✅
- **Code Cleanliness**: No orphaned modules or duplicate exposures ✅
- **Bundle Size**: ~275KB production build ✅

**Acceptance Criteria**

1. The four targeted files contain zero mentions of "Phase" or obsolete migration breadcrumbs.
2. The shared hooks barrel no longer publishes the "Deprecated/Removed Hooks" section.
3. The toolbar hook's file header is updated to a Phase-free description.
4. Repository builds successfully after the cleanup (implicitly exercising lint, typecheck, tests, bundle checks, and mutation tests via `pnpm build`).

**Test Plan**

1. `pnpm build` – execute the full verify-pipeline script (deps check, type check, lint, styles, security, clean, dev/prod builds, bundle-size gate, unit, component, visual, accessibility, E2E, and mutation tests).
2. Manual inspection of the four edited files to ensure the wording no longer references historical Phases.

## [0.5.0] - 2025-11-26

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
- **Toolbar**: Removed the close button hover-specific styling that hid the icon so the exit affordance always remains visible.

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
