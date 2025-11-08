/**
 * @fileoverview Toolbar Component Barrel Export
 * @description Complete export of toolbar component with types and interfaces
 *
 * @architecture
 * ## Component Architecture
 * The Toolbar component uses a **container/presentational split** pattern:
 *
 * ### Container Component (ToolbarContainer)
 * - Manages all state (current index, downloading, fit mode, etc.)
 * - Handles event callbacks and business logic
 * - Creates memoized props for performant rendering
 * - Orchestrates settings and tweet panel expansion
 *
 * ### Presentational Component (ToolbarView)
 * - Pure function with no internal state
 * - Renders 5 sections: navigation, counter, actions, settings panel, tweet panel
 * - All behavior controlled via injected props from container
 * - Optimized for Solid.js fine-grain reactivity (Phase 87)
 *
 * ## Usage Patterns
 *
 * ### Basic Usage
 * ```typescript
 * import { Toolbar, type ToolbarProps } from '@shared/components/ui/Toolbar';
 *
 * // Minimal toolbar with required props
 * <Toolbar
 *   currentIndex={0}
 *   totalCount={5}
 *   onClose={() => gallery.close()}
 * />
 * ```
 *
 * ### Full-Featured Toolbar
 * ```typescript
 * <Toolbar
 *   currentIndex={focusedIndex()}
 *   totalCount={mediaList().length}
 *   disabled={isLoading()}
 *   isDownloading={downloadInProgress()}
 *   onPrevious={() => goToPreviousMedia()}
 *   onNext={() => goToNextMedia()}
 *   onDownloadCurrent={() => downloadSingleFile()}
 *   onDownloadAll={() => downloadBulkZip()}
 *   onFitModeChange={(mode) => setFitMode(mode)}
 *   onOpenSettings={() => openSettingsPanel()}
 *   onClose={() => closeGallery()}
 *   tweetContent={{
 *     text: 'Tweet text here',
 *     html: '<p>Formatted tweet</p>'
 *   }}
 *   autoHide={true}
 *   highContrast={userPrefersHighContrast()}
 * />
 * ```
 *
 * ### With Settings and Panels
 * ```typescript
 * <Toolbar
 *   {...baseProps}
 *   onOpenSettings={() => {
 *     showSettingsPanel(true);
 *     // Settings control theme/language via SettingsControlsLazy
 *   }}
 *   tweetContent={extractedTweet}
 *   // Settings and tweet panels are mutually exclusive (managed by container)
 * />
 * ```
 *
 * ### Responsive Behavior
 * ```typescript
 * <Toolbar
 *   {...baseProps}
 *   autoHide={true}  // Hides on inactivity (mobile UX)
 *   compact={true}   // Compact sizing for small screens (Phase X)
 *   // CSS media queries handle responsive layout adjustments at 48em/30em breakpoints
 * />
 * ```
 *
 * ## Props Interface
 * See {@link ToolbarProps} for complete prop documentation with 40+ properties:
 * - **Navigation**: onPrevious, onNext, currentIndex, totalCount
 * - **Download**: onDownloadCurrent, onDownloadAll, isDownloading
 * - **Fit Modes**: onFitModeChange, available fit modes (original, fitWidth, etc.)
 * - **Panels**: onOpenSettings, tweetContent expansion
 * - **State**: disabled, highContrast, theme preference
 * - **Accessibility**: Full ARIA support (aria-label, aria-expanded, etc.)
 * - **Events**: onClose, onFocus, onBlur keyboard navigation
 *
 * ## Accessibility Features
 * - **ARIA Live Region**: Media counter updates announced (aria-live='polite')
 * - **Keyboard Navigation**: Full keyboard control via arrow keys, Enter, Escape
 * - **Focus Management**: Focus trap in settings panel (Phase X: Focus Restoration)
 * - **Screen Readers**: Descriptive labels for all buttons and icons
 * - **High Contrast Mode**: Support for users with vision impairment
 * - **Reduced Motion**: Respects prefers-reduced-motion media query
 * - **Focus Indicators**: 2px outline for WCAG 2.1 AA compliance
 *
 * ## Styling System
 * - **CSS Modules**: Scoped styles prevent global pollution
 * - **Design Tokens**: oklch() colors, rem/em sizing, --xeg-* variables
 * - **Glassmorphism**: Backdrop filter effect for modern appearance
 * - **State-Based CSS**: data-* attributes control visual states
 * - **Responsive Design**: Breakpoints at 48em (768px) and 30em (480px)
 * - **Dark Mode**: Automatic color switching via data-theme attribute
 * - **High Contrast**: Enhanced colors for accessibility
 *
 * ## Keyboard Shortcuts
 * - **←/→**: Navigate previous/next media
 * - **Ctrl+D**: Download current file
 * - **Ctrl+Shift+D**: Download all files (ZIP)
 * - **M**: Toggle fit modes
 * - **S**: Open settings
 * - **T**: Toggle tweet panel
 * - **Esc**: Close gallery or collapse panels
 *
 * ## State Management
 * The toolbar coordinates multiple pieces of state:
 * - **Navigation State**: Previous/next button disable states
 * - **Download State**: Loading spinner, error messages
 * - **Panel State**: Settings and tweet panels (mutually exclusive)
 * - **Fit Mode State**: Selected view mode with icon highlighting
 * - **Settings State**: Theme and language preferences
 *
 * ## Performance Optimizations
 * - **Phase 87 Reactivity**: Props accessed directly (not destructured) for fine-grain updates
 * - **Memoized Props**: Container creates memoized callbacks and values
 * - **Lazy Loading**: SettingsControlsLazy only loaded when settings expanded
 * - **CSS Optimization**: Minimal reflow via transform/opacity animations
 * - **GPU Acceleration**: Will-change hints on animated elements
 *
 * ## Known Limitations and TODOs
 * - **i18n Localization**: Currently Korean hardcoded (Phase X: i18n service integration)
 * - **Custom Themes**: No user-defined color themes (Phase X: Theme customization)
 * - **Compact Mode**: Proposed for mobile screens (Phase X: Mobile optimization)
 * - **Keyboard Customization**: Shortcuts not user-customizable (Phase X: Input preferences)
 * - **Touch Support**: PC-only implementation (by design, Phase 242-243)
 *
 * ## Testing
 * - **Unit Tests**: 20+ test cases for ToolbarView, ToolbarContainer
 * - **Browser Tests**: Solid.js reactivity tests with Vitest + Chromium
 * - **A11y Tests**: Playwright + axe-core for WCAG 2.1 AA compliance
 * - **E2E Tests**: Full workflow tests via Playwright smoke tests
 * - **Smoke Tests**: Baseline: 101/105 tests passing
 *
 * @dependencies
 * - Solid.js: Component framework with fine-grain reactivity
 * - Icons: HeroIcon set (SVG icons from heroicons)
 * - Services: languageService for i18n, SettingsControlsLazy for settings
 * - Hooks: useToolbarState, useToolbarSettingsController
 * - Utils: formatTweetText for tweet formatting, event utilities
 *
 * @changelog
 * - **Phase 395**: Complete documentation update (100% English)
 * - **Phase 87**: Event handler memoization pattern introduced
 * - **Phase 342**: Quote tweet media extraction support
 * - **Phase 310**: HttpRequestService for cross-origin requests
 * - **Phase 309**: Service layer consolidation (Tampermonkey APIs)
 */

export { Toolbar } from './Toolbar.tsx';
export type { ToolbarProps } from './Toolbar.types';
