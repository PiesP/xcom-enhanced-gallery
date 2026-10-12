// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Settings Controls Component
 * @module shared/components/ui/Settings/SettingsControls
 * @description Theme, language, and video click controls for application settings
 *
 * **Features**:
 * - Theme selection (auto, light, dark)
 * - Language selection (auto and six languages)
 * - Video click routing selection
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

import { isVideoClickMode, THEME_OPTIONS, VIDEO_CLICK_MODES } from '@constants/setting-options';
import { DEFAULT_SETTINGS } from '@constants/settings';
import { getNotificationAdapter, notifySafely } from '@platform/index';
import { Tooltip } from '@shared/components/ui/Tooltip/Tooltip';
import { tryGetSettings } from '@shared/container/settings-registry';
import { getLanguageService } from '@shared/services/language-service';
import type { VideoClickMode } from '@shared/types/settings.types';
import { withTrustedEvent } from '@shared/utils/events/trusted-event';
import { resolve } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import type { JSXElement } from 'solid-js';
import { createMemo, createSignal, onCleanup, onMount, splitProps } from 'solid-js';
import styles from './SettingsControls.module.css';
import type { LanguageOption, SettingsControlsProps, ThemeOption } from './SettingsControls.types';

/**
 * Available language options
 */
const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  'auto',
  'en',
  'ko',
  'ja',
  'zh-CN',
  'es',
  'ar',
] as const;

/**
 * Native-language display labels for each language option.
 * Each language is shown in its own script, regardless of the current UI language.
 */
const LANGUAGE_NATIVE_LABELS: Record<LanguageOption, string> = {
  auto: 'Auto',
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  'zh-CN': '简体中文',
  es: 'Español',
  ar: 'العربية',
};

function readVideoClickMode(): VideoClickMode {
  const current = tryGetSettings()?.get('gallery.videoClickMode');
  return isVideoClickMode(current) ? current : DEFAULT_SETTINGS.gallery.videoClickMode;
}

/**
 * Settings Controls Component
 *
 * Renders theme, language, and video click controls with reactive translations.
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
  const [videoClickMode, setVideoClickMode] = createSignal<VideoClickMode>(readVideoClickMode());
  const [savingVideoClickMode, setSavingVideoClickMode] = createSignal(false);

  // Subscribe to language changes
  onMount(() => {
    const unsubscribe = languageService.onLanguageChange(() => setRevision((v) => v + 1));
    onCleanup(unsubscribe);

    const settings = tryGetSettings();
    setVideoClickMode(readVideoClickMode());
    const unsubscribeSettings = settings?.subscribe?.((event) => {
      if (event.key === 'gallery.videoClickMode') setVideoClickMode(readVideoClickMode());
    });
    if (unsubscribeSettings) onCleanup(unsubscribeSettings);
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
          'zh-CN': languageService.translate('st.langZhCn'),
          es: languageService.translate('st.langEs'),
          ar: languageService.translate('st.langAr'),
        } as Record<LanguageOption, string>,
      },
      video: {
        title: languageService.translate('st.videoClickMode'),
        labels: {
          'block-all': languageService.translate('st.videoClickNative'),
          'block-controls-only': languageService.translate('st.videoClickSurfaces'),
          'allow-all': languageService.translate('st.videoClickUnmarked'),
        } as Record<VideoClickMode, string>,
        help: languageService.translate('st.videoClickHelp'),
        saveError: languageService.translate('st.videoClickSaveError'),
      },
      errorTitle: languageService.translate('msg.err.t'),
    };
  });

  // Reactive prop values
  const themeValue = () => resolve(local.currentTheme);
  const languageValue = () => resolve(local.currentLanguage);

  const saveVideoClickMode = async (event: Event): Promise<void> => {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;
    const next = select.value;
    if (!isVideoClickMode(next)) {
      select.value = videoClickMode();
      return;
    }

    const settings = tryGetSettings();
    if (!settings) {
      select.value = videoClickMode();
      notifySafely(getNotificationAdapter(), strings().errorTitle, strings().video.saveError);
      return;
    }

    setSavingVideoClickMode(true);
    try {
      await settings.set('gallery.videoClickMode', next);
      setVideoClickMode(readVideoClickMode());
    } catch {
      setVideoClickMode(readVideoClickMode());
      notifySafely(getNotificationAdapter(), strings().errorTitle, strings().video.saveError);
    } finally {
      select.value = readVideoClickMode();
      setSavingVideoClickMode(false);
    }
  };

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
            required
            data-testid={
              __DEV__ && local['data-testid'] ? `${local['data-testid']}-language` : undefined
            }
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option value={option}>{LANGUAGE_NATIVE_LABELS[option] ?? option}</option>
            ))}
          </select>
        </Tooltip>
      </div>

      <div class={cx(styles.setting, local.compact && styles.settingCompact)}>
        <label
          id={
            local['data-testid']
              ? `${local['data-testid']}-video-click-label`
              : 'settings-video-click-label'
          }
          for={
            local['data-testid']
              ? `${local['data-testid']}-video-click-select`
              : 'settings-video-click-select'
          }
          class={cx(styles.label, local.compact && styles.compactLabel)}
        >
          {strings().video.title}
        </label>
        <select
          id={
            local['data-testid']
              ? `${local['data-testid']}-video-click-select`
              : 'settings-video-click-select'
          }
          autocomplete="off"
          class={cx('xeg-inline-center', styles.select)}
          onChange={withTrustedEvent((event: Event) => {
            void saveVideoClickMode(event);
          })}
          value={videoClickMode()}
          disabled={savingVideoClickMode()}
          aria-label={strings().video.title}
          aria-labelledby={
            local['data-testid']
              ? `${local['data-testid']}-video-click-label`
              : 'settings-video-click-label'
          }
          aria-describedby={
            local['data-testid']
              ? `${local['data-testid']}-video-click-help`
              : 'settings-video-click-help'
          }
          required
          data-testid={
            __DEV__ && local['data-testid'] ? `${local['data-testid']}-video-click` : undefined
          }
        >
          {VIDEO_CLICK_MODES.map((mode) => (
            <option value={mode}>{strings().video.labels[mode]}</option>
          ))}
        </select>
        <p
          id={
            local['data-testid']
              ? `${local['data-testid']}-video-click-help`
              : 'settings-video-click-help'
          }
          class={styles.help}
        >
          {strings().video.help}
        </p>
      </div>
    </div>
  );
}
