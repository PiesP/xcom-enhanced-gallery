/**
 * Toolbar Hooks Layer - Settings management and controls
 *
 * **Purpose**: Provide Solid.js hooks for toolbar container component
 * **Pattern**: Barrel exports only, forbid direct imports of implementation files
 * **Architecture**: State management + event handling for settings panel
 *
 * **Public API**:
 * - `useToolbarSettingsController`: Main hook for settings panel + theme/language
 *
 * **Features**:
 * - Settings panel toggling with outside-click detection
 * - Theme selection (auto/light/dark) with persistence
 * - Language selection (auto/ko/en/ja) with persistence
 * - High-contrast detection for accessibility
 * - Select element guard (prevent premature panel closure)
 * - Focus management (auto-focus, restore on close)
 *
 * **Usage Pattern**:
 * ```typescript
 * // ✅ Correct: Use barrel export
 * import {
 *   useToolbarSettingsController,
 *   type UseToolbarSettingsControllerOptions,
 *   type ToolbarSettingsControllerResult,
 * } from '@shared/hooks/toolbar';
 *
 * // ❌ Forbidden: Direct import of implementation
 * import { useToolbarSettingsController } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
 * ```
 *
 * **Event Handlers Provided**:
 * - `handleSettingsClick`: Toggle settings panel (button click)
 * - `handleToolbarKeyDown`: Escape key to close panel
 * - `handleThemeChange`: Theme select change
 * - `handleLanguageChange`: Language select change
 * - `handlePanelClick`: Prevent panel click propagation
 * - `handleSettingsMouseDown`: Prevent button mousedown propagation
 *
 * **Ref Assigners** (JSX ref callbacks):
 * - `assignToolbarRef`: Container (for high-contrast checks)
 * - `assignSettingsPanelRef`: Settings panel (for outside-click detection)
 * - `assignSettingsButtonRef`: Settings button (for focus restoration)
 *
 * **Signal Accessors** (Solid.js getters):
 * - `isSettingsExpanded()`: Current panel state
 * - `currentTheme()`: Current theme ('auto' | 'light' | 'dark')
 * - `currentLanguage()`: Current language ('auto' | 'ko' | 'en' | 'ja')
 *
 * **Service Integration**:
 * - ThemeService: Theme persistence (auto/light/dark)
 * - LanguageService: Language persistence (auto/ko/en/ja)
 * - EventManager (Phase 329): Centralized event listener tracking
 * - globalTimerManager: Timer management for focus delays
 *
 * **Performance**:
 * - Scroll detection throttled via requestAnimationFrame
 * - Select guard prevents rapid panel close/open cycles
 * - Proper cleanup via onCleanup (no memory leaks)
 *
 * **Accessibility**:
 * - High-contrast mode for low-background scenarios
 * - Escape key to close panel
 * - Focus management for keyboard navigation
 * - ARIA labels expected from component
 *
 * **Related Documentation**:
 * - {@link ../../services/theme-service.ts} - Theme persistence
 * - {@link ../../services/language-service.ts} - Language persistence
 * - {@link ../../services/event-manager.ts} - Event listener tracking
 * - {@link ../../../features/gallery/components} - Toolbar container (consumer)
 *
 * @fileoverview Toolbar hooks layer - barrel export (Phase 375)
 * @version 11.0.0 - Phase 375: Optimization + comprehensive documentation
 * @internal Implementation details in individual files, not here
 */

/**
 * Toolbar Settings Controller Hook
 *
 * **Manages**:
 * - Settings panel open/close state
 * - Theme selection and persistence
 * - Language selection and persistence
 * - High-contrast mode activation
 *
 * **Provides**:
 * - Event handlers (click, keydown, change)
 * - Ref assigners (toolbar, panel, button)
 * - Signal accessors (isExpanded, currentTheme, currentLanguage)
 *
 * @example
 * ```typescript
 * import {
 *   useToolbarSettingsController,
 *   type UseToolbarSettingsControllerOptions,
 * } from '@shared/hooks/toolbar';
 *
 * const controller = useToolbarSettingsController({
 *   setNeedsHighContrast: setHighContrast,
 *   isSettingsExpanded: () => expanded(),
 *   setSettingsExpanded: setExpanded,
 *   toggleSettingsExpanded: () => setExpanded(e => !e),
 * });
 *
 * // Attach handlers to JSX elements
 * <button onClick={controller.handleSettingsClick}>Settings</button>
 * ```
 *
 * @see UseToolbarSettingsControllerOptions - Input configuration
 * @see ToolbarSettingsControllerResult - Returned controller
 */
export {
  useToolbarSettingsController,
  type UseToolbarSettingsControllerOptions,
  type ToolbarSettingsControllerResult,
} from './use-toolbar-settings-controller';
