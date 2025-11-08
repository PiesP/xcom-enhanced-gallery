/**
 * @fileoverview Settings UI Components Barrel Export
 * @version 1.0.0 - Phase 391: Public API for settings controls
 * @description Central export point for theme and language selection controls
 * @module shared/components/ui/Settings
 *
 * **Component System** (Phase 45+):
 * Settings UI components provide theme and language selection controls
 * extracted from SettingsModal to support reusable, testable components.
 *
 * **Public Components**:
 * 1. **SettingsControls** (Default)
 *    - Core component for theme/language selection
 *    - Reactive i18n integration (Phase 118)
 *    - Compact mode for toolbar integration
 *    - Full accessibility support (WCAG 2.1 AA)
 *    - Use: Settings panel, toolbar dropdown, modal dialogs
 *
 * 2. **SettingsControlsLazy** (Code-Split)
 *    - Lazy-loaded wrapper with Suspense boundary
 *    - Reduces initial bundle by 10-15 KB (Phase 308)
 *    - Separate Vite chunk generated at build time
 *    - Use: On-demand settings loading, non-critical path
 *
 * **Type Exports**:
 * - `SettingsControlsProps`: Component configuration interface
 * - `ThemeOption`: Theme selection type ('auto' | 'light' | 'dark')
 * - `LanguageOption`: Language selection type ('auto' | 'ko' | 'en' | 'ja')
 *
 * **Styling**:
 * - CSS Modules: SettingsControls.module.css (semantic scoping)
 * - Design tokens: Full integration with --xeg-* variables
 * - Responsive: Compact mode for toolbar, standard for panels
 * - Accessibility: Focus ring, ARIA labels, semantic HTML
 *
 * **Import Patterns**:
 * ```tsx
 * // Lazy-loaded (recommended for non-critical paths)
 * import { SettingsControlsLazy, type SettingsControlsProps } from '@shared/components/ui/Settings';
 *
 * <SettingsControlsLazy
 *   currentTheme={theme()}
 *   currentLanguage={language()}
 *   onThemeChange={handleThemeChange}
 *   onLanguageChange={handleLanguageChange}
 *   compact={false}
 * />
 *
 * // Direct import (for critical paths)
 * import { SettingsControls, type ThemeOption, type LanguageOption } from '@shared/components/ui/Settings';
 *
 * <SettingsControls {...props} />
 * ```
 *
 * **Integration Points**:
 * - Toolbar: SettingsControlsLazy in compact mode (dropdown menu)
 * - SettingsPanel: SettingsControls in standard mode (full panel)
 * - Dialogs: Either variant depending on urgency (lazy for non-critical)
 * - GalleryApp: Settings initialization and persistence (Phase 49)
 *
 * **Responsive Behavior**:
 * - Desktop: Standard size with clear labels
 * - Tablet: Same layout, responsive font sizing via tokens
 * - Mobile: Compact mode (if space-constrained), touch-friendly sizing
 * - Toolbar: Always compact mode (inline, minimal space)
 *
 * **Performance Considerations**:
 * - Lazy loading: Saves 10-15 KB initial bundle (Phase 308)
 * - Memoization: Labels update only on language change (Phase 118)
 * - CSS Modules: No global stylesheet conflicts
 * - Transitions: Only on user interaction (hover/focus), no animations
 *
 * **Accessibility** (WCAG 2.1 AA):
 * - Semantic: Native select elements (screen reader friendly)
 * - Labels: Associated via htmlFor + id (programmatic)
 * - Focus: Visible outline (--xeg-focus-ring)
 * - Keyboard: Tab/Enter/Arrow keys work natively
 * - Color: 4.5:1 minimum contrast via design tokens
 *
 * **Testing**:
 * - Unit tests: SettingsControls behavior and i18n updates
 * - Integration tests: Theme/language changes in parent components
 * - E2E tests: Full settings flow with persistence
 * - Accessibility: axe-core scan for WCAG violations
 *
 * **Browser Compatibility**:
 * - All modern browsers: Full support
 * - Chrome/Edge: 88+
 * - Firefox: 85+
 * - Safari: 14+
 * - No polyfills needed: CSS custom properties + ES2020
 *
 * **Design System**:
 * - Colors: Dynamic via --xeg-color-* tokens (light/dark aware)
 * - Typography: Responsive via --font-size-* tokens (rem-based)
 * - Spacing: Consistent via --space-* and --xeg-settings-* tokens
 * - Interactions: Smooth transitions via --xeg-duration-fast
 * - Focus: Standardized via --xeg-focus-ring and --xeg-focus-ring-offset
 *
 * **Related Documentation**:
 * - {@link ./SettingsControls.tsx} - Component implementation
 * - {@link ./SettingsControlsLazy.tsx} - Lazy wrapper with Suspense
 * - {@link ./SettingsControls.module.css} - Semantic styling
 * - {@link ../../../services/language-service} - i18n service
 * - {@link ../../../../docs/ARCHITECTURE.md} - System architecture
 * - {@link ../../../../docs/CODING_GUIDELINES.md} - Code standards
 *
 * @example
 * ```tsx
 * // Full settings panel with lazy loading
 * import { SettingsControlsLazy } from '@shared/components/ui/Settings';
 * import { createSignal } from 'solid-js';
 *
 * export function SettingsPanel() {
 *   const [theme, setTheme] = createSignal('auto');
 *   const [language, setLanguage] = createSignal('auto');
 *
 *   return (
 *     <div class="settings-panel">
 *       <h2>Settings</h2>
 *       <Suspense fallback={<div>Loading settings...</div>}>
 *         <SettingsControlsLazy
 *           currentTheme={theme()}
 *           currentLanguage={language()}
 *           onThemeChange={(e) => setTheme((e.target as HTMLSelectElement).value)}
 *           onLanguageChange={(e) => setLanguage((e.target as HTMLSelectElement).value)}
 *           data-testid="settings"
 *         />
 *       </Suspense>
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link ../../../services/language-service} - Language service for i18n
 * @see {@link ../../../services/theme-service} - Theme service for persistence
 * @see {@link ../../../../styles} - Design token definitions
 * @see https://docs.solidjs.com/guides/how-to-guides/how-to-use-lazy - Lazy loading guide
 */

/**
 * Core Settings Controls Component
 * @description Main component for theme and language selection
 * Use directly for critical paths, wrap with SettingsControlsLazy for non-critical
 */
export { SettingsControls } from './SettingsControls';

/**
 * Lazy-Loaded Settings Controls Wrapper
 * @description Deferred component with Suspense boundary
 * Saves 10-15 KB initial bundle (Phase 308)
 */
export { SettingsControlsLazy } from './SettingsControlsLazy';

/**
 * Component Props Interface
 * @description Configuration for SettingsControls component
 * Includes theme, language, event handlers, and optional compact mode
 */
export type { SettingsControlsProps } from './SettingsControls';

/**
 * Theme Selection Options
 * @description Valid theme values with semantic meanings
 * - 'auto': System preference (prefers-color-scheme)
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 */
export type { ThemeOption } from './SettingsControls';

/**
 * Language Selection Options
 * @description Valid language codes with auto-detection support
 * - 'auto': Browser language preference
 * - 'ko': Korean (한국어)
 * - 'en': English
 * - 'ja': Japanese (日本語)
 */
export type { LanguageOption } from './SettingsControls';
