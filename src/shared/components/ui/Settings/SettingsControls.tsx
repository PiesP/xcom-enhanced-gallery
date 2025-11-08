/**
 * @fileoverview Settings Controls Component
 * @version 2.1.0 - Phase 391: Full English documentation, comprehensive JSDoc
 * @description Theme and language selection UI controls with reactive i18n support
 * @module shared/components/ui/Settings/SettingsControls
 *
 * **Settings Controls Architecture**:
 * Pure UI component extracted from SettingsModal (Phase 45) providing:
 * - Theme selector (auto, light, dark) with browser preference detection
 * - Language selector (auto, ko, en, ja) with multiple locale support
 * - Real-time i18n updates via language service (Phase 118)
 * - Compact mode for toolbar integration (Phase 146)
 *
 * **Core Features**:
 * 1. **Theme Options**: auto (system), light, dark with CSS media preference
 * 2. **Language Options**: auto (browser), Korean, English, Japanese with i18n
 * 3. **Reactive i18n**: Automatic label updates when language changes (Phase 118)
 * 4. **Compact Mode**: Optional inline toolbar rendering with minimal styling
 * 5. **Accessibility**: ARIA labels, semantic select elements, focus management
 *
 * **Design System Integration**:
 * - Layout: Flexbox column with gap tokens (--xeg-settings-gap, --space-sm compact)
 * - Typography: --xeg-settings-label-font-size, --font-size-xs (compact)
 * - Colors: --xeg-color-text-primary, --xeg-color-text-secondary
 * - Inputs: --xeg-settings-select-* tokens for dropdown styling
 * - Focus: --xeg-focus-ring outline with --xeg-focus-ring-offset
 * - Transitions: Smooth border/bg transitions via --xeg-duration-fast
 *
 * **Responsive Behavior**:
 * - Default: Full-width controls, vertically stacked
 * - Compact (toolbar): Smaller font, reduced gaps, inline labels
 * - Mobile: Same layout, responsive font sizing via tokens
 *
 * **Usage Patterns**:
 * ```tsx
 * // Full settings panel
 * import { SettingsControls } from '@shared/components/ui/Settings';
 * import { createSignal } from 'solid-js';
 *
 * export function SettingsPanel() {
 *   const [theme, setTheme] = createSignal('auto');
 *   const [language, setLanguage] = createSignal('auto');
 *
 *   return (
 *     <SettingsControls
 *       currentTheme={theme()}
 *       currentLanguage={language()}
 *       onThemeChange={(e) => setTheme((e.target as HTMLSelectElement).value)}
 *       onLanguageChange={(e) => setLanguage((e.target as HTMLSelectElement).value)}
 *       data-testid='settings'
 *     />
 *   );
 * }
 *
 * // Toolbar compact mode
 * <SettingsControls
 *   currentTheme={theme()}
 *   currentLanguage={language()}
 *   onThemeChange={handleThemeChange}
 *   onLanguageChange={handleLanguageChange}
 *   compact={true}
 * />
 * ```
 *
 * **Language System** (Phase 118+):
 * - LanguageService: Singleton service with onLanguageChange event
 * - i18n: getString() method retrieves localized strings
 * - Reactive: createMemo subscribes to language changes
 * - Labels: Automatically update when user changes language
 *
 * **Theme System**:
 * - auto: Uses browser/OS preference (prefers-color-scheme media query)
 * - light: Forces light theme regardless of system preference
 * - dark: Forces dark theme regardless of system preference
 * - Storage: Persisted via ThemeService or SettingsService
 *
 * **Performance Optimization**:
 * - Lazy Loading: SettingsControlsLazy wraps with Suspense (Phase 308)
 * - Bundle Impact: 10-15 KB saved by lazy loading
 * - Memoization: Labels memoized, update only on language change
 * - Event Handling: Option order optimization avoids select thrashing
 *
 * **Accessibility** (WCAG 2.1 AA):
 * - Semantic: Native select elements (native accessibility)
 * - Labels: Associated via htmlFor + id (programmatic label)
 * - ARIA: aria-label duplicates label for clarity
 * - Focus: Outline managed via --xeg-focus-ring token
 * - Keyboard: Tab/Enter/Arrow keys work natively (select element)
 *
 * **Testing Considerations**:
 * - Option rendering order: Current value always first (test reliability)
 * - Selected attribute: Explicit marking (SSR/test compatibility)
 * - Option creation: Separate render for each theme/language variant
 * - Language trigger: Signal forces re-render when i18n updates
 *
 * **Integration Points**:
 * - Toolbar: Compact mode rendering in settings dropdown (Phase 146)
 * - SettingsPanel: Full-size control panel version
 * - LanguageService: Reactive i18n updates (Phase 118)
 * - ThemeService: Theme persistence and application (Phase 54)
 *
 * @see {@link ./SettingsControlsLazy.tsx} - Lazy wrapper with Suspense
 * @see {@link ../../../services/language-service} - i18n service
 * @see {@link ./SettingsControls.module.css} - Semantic styling
 */

import { getSolid } from '../../../external/vendors';
import type { JSXElement } from '../../../external/vendors';
import { languageService } from '../../../services/language-service';
import toolbarStyles from '../Toolbar/Toolbar.module.css';
import styles from './SettingsControls.module.css';

/**
 * Theme option type
 * @description Valid theme values with semantic meanings
 * - 'auto': System preference (prefers-color-scheme media query)
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 */
export type ThemeOption = 'auto' | 'light' | 'dark';

/**
 * Language option type
 * @description Valid language codes with auto-detection support
 * - 'auto': Browser language preference
 * - 'ko': Korean (한국어)
 * - 'en': English
 * - 'ja': Japanese (日本語)
 */
export type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

/**
 * Settings Controls Component Props
 *
 * @description Configuration for theme and language selection controls
 *
 * **Selection State**:
 * - currentTheme: Currently selected theme (auto, light, or dark)
 * - currentLanguage: Currently selected language (auto, ko, en, or ja)
 * - Event handlers receive change events from select elements
 *
 * **Interaction**:
 * - onThemeChange: Called when user selects different theme
 * - onLanguageChange: Called when user selects different language
 * - Both handlers receive Event with target: HTMLSelectElement
 *
 * **Styling**:
 * - compact: Optional flag for toolbar inline rendering
 *   - true: Smaller font, reduced gaps, abbreviated labels
 *   - false (default): Standard size for settings panel
 *
 * **Testing**:
 * - data-testid: Base ID for test selectors
 *   - Appended as: {base}-theme, {base}-language
 *
 * @example
 * ```tsx
 * const props: SettingsControlsProps = {
 *   currentTheme: 'auto',
 *   currentLanguage: 'en',
 *   onThemeChange: (e) => handleThemeChange(e),
 *   onLanguageChange: (e) => handleLanguageChange(e),
 *   compact: false,
 *   'data-testid': 'settings-controls',
 * };
 * ```
 */
export interface SettingsControlsProps {
  /**
   * Current theme selection
   * @description Theme to display as selected in dropdown
   * @default 'auto'
   */
  currentTheme: ThemeOption;

  /**
   * Current language selection
   * @description Language to display as selected in dropdown
   * @default 'auto'
   */
  currentLanguage: LanguageOption;

  /**
   * Theme change event handler
   * @description Called when user selects different theme
   * Receives change event with HTMLSelectElement as target
   * Extract value: (event.target as HTMLSelectElement).value
   */
  onThemeChange: (event: Event) => void;

  /**
   * Language change event handler
   * @description Called when user selects different language
   * Receives change event with HTMLSelectElement as target
   * Extract value: (event.target as HTMLSelectElement).value
   */
  onLanguageChange: (event: Event) => void;

  /**
   * Compact mode flag
   * @description If true, renders in toolbar compact mode
   * - Smaller font size (--font-size-xs)
   * - Reduced gaps (--space-xs/sm vs --xeg-settings-gap)
   * - Uppercase labels with letter-spacing
   * @default false
   */
  compact?: boolean;

  /**
   * Test identifier
   * @description Base ID for test selectors
   * Appended as: {base}-theme, {base}-language
   * @example 'data-testid'='settings'
   */
  'data-testid'?: string;
}

/**
 * Settings Controls Component
 *
 * Renders theme and language selection controls with reactive i18n support.
 * Integrates with LanguageService for real-time label updates (Phase 118).
 *
 * **Rendering Flow**:
 * 1. Initialize i18n labels via createMemo (memoized on language change)
 * 2. Build option lists with current value first (test reliability)
 * 3. Render select elements with options in semantic order
 * 4. Apply compact styling if compact=true
 *
 * **Reactivity** (Phase 118):
 * - Language trigger signal forces label re-render
 * - createMemo subscribes to language changes via service
 * - All labels (theme/language options) update automatically
 * - No manual refresh needed when language changes
 *
 * **Option Ordering**:
 * - Current value always rendered first in select
 * - Ensures initial selection displays correctly (test fix)
 * - Remaining options rendered in standard order
 * - Prevents select "thrashing" on render
 *
 * **Accessibility Features**:
 * - Native select elements (screen reader friendly)
 * - Label elements with htmlFor (programmatic association)
 * - aria-label on select (duplicate accessibility label)
 * - title attribute (hover tooltips)
 * - Focus visible outline via CSS (--xeg-focus-ring)
 * - Keyboard navigation via native select (Tab/Enter/Arrows)
 *
 * **CSS Integration**:
 * - base styles: .body, .setting (layout)
 * - compact styles: .bodyCompact, .settingCompact (spacing)
 * - label styles: .label, .compactLabel (typography)
 * - select styles: .select (input styling)
 * - toolbar integration: Shares .toolbarButton class
 *
 * **Performance**:
 * - Memoized labels: Update only when language changes
 * - Stable option arrays: Defined outside render
 * - No unnecessary re-renders: createSignal for language trigger only
 * - Lazy loading: Wrapped by SettingsControlsLazy (Phase 308)
 *
 * @param props - SettingsControlsProps configuration
 * @returns JSXElement (control UI)
 *
 * @example
 * ```tsx
 * // Basic settings controls
 * import { SettingsControls } from '@shared/components/ui/Settings';
 * import { createSignal } from 'solid-js';
 *
 * export function SettingsPanel() {
 *   const [theme, setTheme] = createSignal('auto');
 *   const [language, setLanguage] = createSignal('auto');
 *
 *   const handleThemeChange = (e: Event) => {
 *     const value = (e.target as HTMLSelectElement).value as ThemeOption;
 *     setTheme(value);
 *   };
 *
 *   const handleLanguageChange = (e: Event) => {
 *     const value = (e.target as HTMLSelectElement).value as LanguageOption;
 *     setLanguage(value);
 *   };
 *
 *   return (
 *     <SettingsControls
 *       currentTheme={theme()}
 *       currentLanguage={language()}
 *       onThemeChange={handleThemeChange}
 *       onLanguageChange={handleLanguageChange}
 *       data-testid='settings'
 *     />
 *   );
 * }
 * ```
 */
export function SettingsControls(props: SettingsControlsProps): JSXElement {
  const solid = getSolid();
  const { createSignal, createEffect, createMemo, onCleanup } = solid;

  // Phase 118: Language change trigger signal
  const [_, setLanguageTrigger] = createSignal(0);

  // Phase 118: Subscribe to language service changes
  createEffect(() => {
    const unsubscribe = languageService.onLanguageChange(() => {
      setLanguageTrigger(prev => prev + 1);
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  const i18n = languageService;

  // Build CSS classes with optional compact variants
  const containerClass = [styles.body, props.compact ? styles.bodyCompact : '']
    .filter(Boolean)
    .join(' ');
  const settingClass = [styles.setting, props.compact ? styles.settingCompact : '']
    .filter(Boolean)
    .join(' ');
  const labelClass = [styles.label, props.compact ? styles.compactLabel : '']
    .filter(Boolean)
    .join(' ');

  // Phase 118: Memoized labels that update on language change
  const themeTitle = createMemo(() => {
    _(); // Subscribe to language trigger
    return i18n.getString('settings.theme');
  });

  const languageTitle = createMemo(() => {
    _(); // Subscribe to language trigger
    return i18n.getString('settings.language');
  });

  // Theme option labels (memoized on language change)
  const themeAutoText = createMemo(() => {
    _();
    return i18n.getString('settings.themeAuto');
  });

  const themeLightText = createMemo(() => {
    _();
    return i18n.getString('settings.themeLight');
  });

  const themeDarkText = createMemo(() => {
    _();
    return i18n.getString('settings.themeDark');
  });

  // Language option labels (memoized on language change)
  const languageAutoText = createMemo(() => {
    _();
    return i18n.getString('settings.languageAuto');
  });

  const languageKoText = createMemo(() => {
    _();
    return i18n.getString('settings.languageKo');
  });

  const languageEnText = createMemo(() => {
    _();
    return i18n.getString('settings.languageEn');
  });

  const languageJaText = createMemo(() => {
    _();
    return i18n.getString('settings.languageJa');
  });

  // Standard option arrays
  const themeOptions: ThemeOption[] = ['auto', 'light', 'dark'];
  const languageOptions: LanguageOption[] = ['auto', 'ko', 'en', 'ja'];

  // Reorder options with current value first (for reliable test selection)
  const orderedThemeOptions = () => {
    const cur = props.currentTheme;
    return [cur, ...themeOptions.filter(v => v !== cur)];
  };

  const orderedLanguageOptions = () => {
    const cur = props.currentLanguage;
    return [cur, ...languageOptions.filter(v => v !== cur)];
  };

  // Render theme select
  const getThemeLabel = (opt: ThemeOption): string => {
    switch (opt) {
      case 'auto':
        return themeAutoText();
      case 'light':
        return themeLightText();
      case 'dark':
        return themeDarkText();
    }
  };

  // Render language select
  const getLanguageLabel = (opt: LanguageOption): string => {
    switch (opt) {
      case 'auto':
        return languageAutoText();
      case 'ko':
        return languageKoText();
      case 'en':
        return languageEnText();
      case 'ja':
        return languageJaText();
    }
  };

  return (
    <div class={containerClass} data-testid={props['data-testid']}>
      {/* Theme Selection */}
      <div class={settingClass}>
        <label for='theme-select' class={labelClass}>
          {themeTitle()}
        </label>
        <select
          id='theme-select'
          class={`${toolbarStyles.toolbarButton} ${styles.select}`}
          onChange={props.onThemeChange}
          aria-label={themeTitle()}
          title={themeTitle()}
          data-testid={props['data-testid'] ? `${props['data-testid']}-theme` : undefined}
        >
          {orderedThemeOptions().map(opt => (
            <option value={opt} selected={opt === props.currentTheme}>
              {getThemeLabel(opt)}
            </option>
          ))}
        </select>
      </div>

      {/* Language Selection */}
      <div class={settingClass}>
        <label for='language-select' class={labelClass}>
          {languageTitle()}
        </label>
        <select
          id='language-select'
          class={`${toolbarStyles.toolbarButton} ${styles.select}`}
          onChange={props.onLanguageChange}
          aria-label={languageTitle()}
          title={languageTitle()}
          data-testid={props['data-testid'] ? `${props['data-testid']}-language` : undefined}
        >
          {orderedLanguageOptions().map(opt => (
            <option value={opt} selected={opt === props.currentLanguage}>
              {getLanguageLabel(opt)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
