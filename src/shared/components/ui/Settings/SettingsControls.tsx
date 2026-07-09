// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

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
 * - Custom tooltip on hover/focus via Tooltip component
 *
 * **Design Pattern**:
 * - Reactive: Uses createMemo for derived state
 * - Effect cleanup: Language change subscription properly cleaned up
 * - Accessibility: Native select elements with proper labels
 *
 * @see {@link SettingsControlsProps} - Type definitions
 * Component styles: `SettingsControls.module.css`
 */

import { Tooltip } from '@shared/components/ui/Tooltip/Tooltip';
import { getLanguageService } from '@shared/services/language-service';
import { resolve } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import type { JSXElement } from 'solid-js';
import { createMemo, createSignal, onCleanup, onMount, splitProps } from 'solid-js';
import styles from './SettingsControls.module.css';
import type { LanguageOption, SettingsControlsProps, ThemeOption } from './SettingsControls.types';

/**
 * Available theme options
 */
const THEME_OPTIONS: readonly ThemeOption[] = ['auto', 'light', 'dark'] as const;

/**
 * Available language options
 */
const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  'auto',
  'en',
  'ko',
  'ja',
  'zh-cn',
  'es',
  'ar',
] as const;

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
  const [local] = splitProps(props, [
    'currentTheme',
    'currentLanguage',
    'onThemeChange',
    'onLanguageChange',
    'compact',
    'data-testid',
  ]);
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
          'zh-cn': languageService.translate('st.langZhCn'),
          es: languageService.translate('st.langEs'),
          ar: languageService.translate('st.langAr'),
        } as Record<LanguageOption, string>,
      },
    };
  });

  // Reactive prop values
  const themeValue = () => resolve(local.currentTheme);
  const languageValue = () => resolve(local.currentLanguage);

  // JSX return
  return (
    <div
      class={cx(styles.body, local.compact && styles.bodyCompact)}
      data-testid={__DEV__ ? local['data-testid'] : undefined}
    >
      <div class={cx(styles.setting, local.compact && styles.settingCompact)}>
        <label
          id={local['data-testid'] ? `${local['data-testid']}-theme-label` : 'settings-theme-label'}
          for={
            local['data-testid'] ? `${local['data-testid']}-theme-select` : 'settings-theme-select'
          }
          class={cx(styles.label, local.compact && styles.compactLabel)}
        >
          {strings().theme.title}
        </label>
        <Tooltip content={strings().theme.title}>
          <select
            id={
              local['data-testid']
                ? `${local['data-testid']}-theme-select`
                : 'settings-theme-select'
            }
            autocomplete="off"
            class={cx('xeg-inline-center', styles.select)}
            onChange={local.onThemeChange}
            value={themeValue()}
            aria-label={strings().theme.title}
            aria-labelledby={
              local['data-testid'] ? `${local['data-testid']}-theme-label` : 'settings-theme-label'
            }
            aria-invalid="false"
            aria-errormessage={
              local['data-testid'] ? `${local['data-testid']}-theme-error` : 'settings-theme-error'
            }
            required
            data-testid={
              __DEV__ && local['data-testid'] ? `${local['data-testid']}-theme` : undefined
            }
          >
            {THEME_OPTIONS.map((option) => (
              <option value={option}>{strings().theme.labels[option]}</option>
            ))}
          </select>
        </Tooltip>
      </div>

      <div class={cx(styles.setting, local.compact && styles.settingCompact)}>
        <label
          id={
            local['data-testid']
              ? `${local['data-testid']}-language-label`
              : 'settings-language-label'
          }
          for={
            local['data-testid']
              ? `${local['data-testid']}-language-select`
              : 'settings-language-select'
          }
          class={cx(styles.label, local.compact && styles.compactLabel)}
        >
          {strings().language.title}
        </label>
        <Tooltip content={strings().language.title}>
          <select
            id={
              local['data-testid']
                ? `${local['data-testid']}-language-select`
                : 'settings-language-select'
            }
            autocomplete="off"
            class={cx('xeg-inline-center', styles.select)}
            onChange={local.onLanguageChange}
            value={languageValue()}
            aria-label={strings().language.title}
            aria-labelledby={
              local['data-testid']
                ? `${local['data-testid']}-language-label`
                : 'settings-language-label'
            }
            aria-invalid="false"
            aria-errormessage={
              local['data-testid']
                ? `${local['data-testid']}-language-error`
                : 'settings-language-error'
            }
            required
            data-testid={
              __DEV__ && local['data-testid'] ? `${local['data-testid']}-language` : undefined
            }
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option value={option}>{strings().language.labels[option]}</option>
            ))}
          </select>
        </Tooltip>
      </div>
    </div>
  );
}
