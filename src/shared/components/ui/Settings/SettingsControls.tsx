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
 * @see {@link SettingsControlsProps} - Type definitions
 * Component styles: `SettingsControls.module.css`
 */

import { getLanguageService } from '@shared/container/service-accessors';
import type { JSXElement } from '@shared/external/vendors';
import { resolve } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import { createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import styles from './SettingsControls.module.css';
import type { LanguageOption, SettingsControlsProps, ThemeOption } from './SettingsControls.types';

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

  // Reactive prop values
  const themeValue = () => resolve(props.currentTheme);
  const languageValue = () => resolve(props.currentLanguage);

  // JSX return
  return (
    <div
      class={cx(styles.body, props.compact && styles.bodyCompact)}
      data-testid={__DEV__ ? props['data-testid'] : undefined}
    >
      <div class={cx(styles.setting, props.compact && styles.settingCompact)}>
        <label
          for={
            props['data-testid'] ? `${props['data-testid']}-theme-select` : 'settings-theme-select'
          }
          class={cx(styles.label, props.compact && styles.compactLabel)}
        >
          {strings().theme.title}
        </label>
        <select
          id={
            props['data-testid'] ? `${props['data-testid']}-theme-select` : 'settings-theme-select'
          }
          class={cx('xeg-inline-center', styles.select)}
          onChange={props.onThemeChange}
          value={themeValue()}
          aria-label={strings().theme.title}
          title={strings().theme.title}
          data-testid={
            __DEV__ && props['data-testid'] ? `${props['data-testid']}-theme` : undefined
          }
        >
          {THEME_OPTIONS.map((option) => (
            <option value={option}>{strings().theme.labels[option]}</option>
          ))}
        </select>
      </div>

      <div class={cx(styles.setting, props.compact && styles.settingCompact)}>
        <label
          for={
            props['data-testid']
              ? `${props['data-testid']}-language-select`
              : 'settings-language-select'
          }
          class={cx(styles.label, props.compact && styles.compactLabel)}
        >
          {strings().language.title}
        </label>
        <select
          id={
            props['data-testid']
              ? `${props['data-testid']}-language-select`
              : 'settings-language-select'
          }
          class={cx('xeg-inline-center', styles.select)}
          onChange={props.onLanguageChange}
          value={languageValue()}
          aria-label={strings().language.title}
          title={strings().language.title}
          data-testid={
            __DEV__ && props['data-testid'] ? `${props['data-testid']}-language` : undefined
          }
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option value={option}>{strings().language.labels[option]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
