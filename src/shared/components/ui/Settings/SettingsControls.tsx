/**
 * @fileoverview Settings Controls Component
 * @module shared/components/ui/Settings/SettingsControls
 * @description Theme and language selection controls for application settings
 *
 * **Features**:
 * - Theme selection (auto, light, dark)
 * - Language selection (auto, Korean, English, Japanese)
 * - Compact mode for toolbar integration
 * - Reactive translations via language service
 * - Fully accessible with proper ARIA labels
 *
 * **Design Pattern**:
 * - Reactive: Uses createMemo for derived state
 * - Effect cleanup: Language change subscription properly cleaned up
 * - Accessibility: Native select elements with proper labels
 *
 * @see {@link ./settings-controls.types.ts} - Type definitions
 * @see {@link ./SettingsControls.module.css} - Component styles
 */

import { getLanguageService } from '@shared/container/service-accessors';
import type { JSXElement } from '@shared/external/vendors';
import { resolve } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import { createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import styles from './SettingsControls.module.css';
import type { LanguageOption, SettingsControlsProps, ThemeOption } from './settings-controls.types';

/**
 * Available theme options
 */
const THEME_OPTIONS: readonly ThemeOption[] = ['auto', 'light', 'dark'] as const;

/**
 * Available language options
 */
const LANGUAGE_OPTIONS: readonly LanguageOption[] = ['auto', 'ko', 'en', 'ja'] as const;

/**
 * Settings Controls Component
 *
 * Renders theme and language selection controls with reactive translations.
 * Supports compact mode for toolbar integration.
 *
 * @param props - Component props
 * @returns Settings controls JSX element
 *
 * @example
 * ```tsx
 * <SettingsControls
 *   currentTheme="auto"
 *   currentLanguage="ko"
 *   onThemeChange={(e) => handleThemeChange(e)}
 *   onLanguageChange={(e) => handleLanguageChange(e)}
 *   compact={false}
 *   data-testid="settings-controls"
 * />
 * ```
 */
export function SettingsControls(props: SettingsControlsProps): JSXElement {
  // Service instance
  const languageService = getLanguageService();

  // Revision signal for reactive translation updates
  const [revision, setRevision] = createSignal(0);

  // Subscribe to language changes
  onMount(() => {
    const unsubscribe = languageService.onLanguageChange(() => setRevision((v) => v + 1));
    onCleanup(unsubscribe);
  });

  // Reactive translation strings
  const strings = createMemo(() => {
    revision();
    return {
      theme: {
        title: languageService.translate('st.th'),
        labels: {
          auto: languageService.translate('st.thAuto'),
          light: languageService.translate('st.thLt'),
          dark: languageService.translate('st.thDk'),
        } as Record<ThemeOption, string>,
      },
      language: {
        title: languageService.translate('st.lang'),
        labels: {
          auto: languageService.translate('st.langAuto'),
          ko: languageService.translate('st.langKo'),
          en: languageService.translate('st.langEn'),
          ja: languageService.translate('st.langJa'),
        } as Record<LanguageOption, string>,
      },
    };
  });

  // Derived styles
  const selectClass = cx('xeg-inline-center', styles.select);
  const containerClass = cx(styles.body, props.compact && styles.bodyCompact);
  const settingClass = cx(styles.setting, props.compact && styles.settingCompact);
  const labelClass = cx(styles.label, props.compact && styles.compactLabel);

  // Reactive prop values
  const themeValue = createMemo(() => resolve(props.currentTheme));
  const languageValue = createMemo(() => resolve(props.currentLanguage));

  // Element IDs for accessibility
  const themeSelectId = props['data-testid']
    ? `${props['data-testid']}-theme-select`
    : 'settings-theme-select';
  const languageSelectId = props['data-testid']
    ? `${props['data-testid']}-language-select`
    : 'settings-language-select';

  // Memoized string accessors
  const themeStrings = () => strings().theme;
  const languageStrings = () => strings().language;

  // JSX return
  return (
    <div class={containerClass} data-testid={__DEV__ ? props['data-testid'] : undefined}>
      <div class={settingClass}>
        <label for={themeSelectId} class={labelClass}>
          {themeStrings().title}
        </label>
        <select
          id={themeSelectId}
          class={selectClass}
          onChange={props.onThemeChange}
          value={themeValue()}
          aria-label={themeStrings().title}
          title={themeStrings().title}
          data-testid={
            __DEV__ && props['data-testid'] ? `${props['data-testid']}-theme` : undefined
          }
        >
          {THEME_OPTIONS.map((option) => (
            <option value={option}>{themeStrings().labels[option]}</option>
          ))}
        </select>
      </div>

      <div class={settingClass}>
        <label for={languageSelectId} class={labelClass}>
          {languageStrings().title}
        </label>
        <select
          id={languageSelectId}
          class={selectClass}
          onChange={props.onLanguageChange}
          value={languageValue()}
          aria-label={languageStrings().title}
          title={languageStrings().title}
          data-testid={
            __DEV__ && props['data-testid'] ? `${props['data-testid']}-language` : undefined
          }
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option value={option}>{languageStrings().labels[option]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
