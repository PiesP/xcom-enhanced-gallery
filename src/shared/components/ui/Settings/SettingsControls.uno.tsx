/**
 * @fileoverview UnoCSS Settings Controls Component
 * @version 1.0.0 - CSS Modules to UnoCSS Migration
 * @description Theme and language selection controls using UnoCSS atomic classes
 * @module @shared/components/ui/Settings
 *
 * Features:
 * - Theme selection (auto, light, dark)
 * - Language selection (auto, ko, en, ja)
 * - Compact mode for toolbar integration
 * - UnoCSS atomic classes for consistent styling
 * - Internationalization support
 *
 * @example
 * ```tsx
 * import { SettingsControls } from '@shared/components/ui/Settings/SettingsControls.uno';
 *
 * <SettingsControls
 *   currentTheme={() => 'auto'}
 *   currentLanguage={() => 'en'}
 *   onThemeChange={handleTheme}
 *   onLanguageChange={handleLanguage}
 *   compact
 * />
 * ```
 */

import { getLanguageService } from '@shared/container/service-accessors';
import type { JSXElement } from '@shared/external/vendors';
import { createMemo, createSignal, onCleanup, onMount } from '@shared/external/vendors/solid-hooks';
import { createClassName } from '@shared/utils/text/formatting';

// ============================================================================
// Type Definitions
// ============================================================================

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

export type ThemeOption = 'auto' | 'light' | 'dark';
export type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

const THEME_OPTIONS: readonly ThemeOption[] = ['auto', 'light', 'dark'];
const LANGUAGE_OPTIONS: readonly LanguageOption[] = ['auto', 'ko', 'en', 'ja'];

const resolveAccessorValue = <T,>(value: MaybeAccessor<T>): T =>
  typeof value === 'function' ? (value as Accessor<T>)() : value;

export interface SettingsControlsProps {
  currentTheme: MaybeAccessor<ThemeOption>;
  currentLanguage: MaybeAccessor<LanguageOption>;
  onThemeChange: (event: Event) => void;
  onLanguageChange: (event: Event) => void;
  compact?: boolean;
  'data-testid'?: string;
}

// ============================================================================
// Settings Controls Component
// ============================================================================

/**
 * UnoCSS Settings Controls Component
 *
 * Theme and language selection UI using atomic CSS classes.
 * Supports compact mode for toolbar integration.
 *
 * @param props - Settings controls configuration
 * @returns Solid.js JSXElement
 */
export function SettingsControls(props: SettingsControlsProps): JSXElement {
  const languageService = getLanguageService();

  const [revision, setRevision] = createSignal(0);

  onMount(() => {
    const unsubscribe = languageService.onLanguageChange(() => setRevision(v => v + 1));
    onCleanup(unsubscribe);
  });

  // Localized strings
  const strings = createMemo(() => {
    revision();
    return {
      theme: {
        title: languageService.translate('settings.theme'),
        labels: {
          auto: languageService.translate('settings.themeAuto'),
          light: languageService.translate('settings.themeLight'),
          dark: languageService.translate('settings.themeDark'),
        } as Record<ThemeOption, string>,
      },
      language: {
        title: languageService.translate('settings.language'),
        labels: {
          auto: languageService.translate('settings.languageAuto'),
          ko: languageService.translate('settings.languageKo'),
          en: languageService.translate('settings.languageEn'),
          ja: languageService.translate('settings.languageJa'),
        } as Record<LanguageOption, string>,
      },
    };
  });

  // UnoCSS class builders
  const containerClass = () =>
    createClassName('xeg-settings-body', props.compact ? 'xeg-settings-body-compact' : undefined);

  const settingClass = () =>
    createClassName('xeg-setting', props.compact ? 'xeg-setting-compact' : undefined);

  const labelClass = () =>
    createClassName('xeg-setting-label', props.compact ? 'xeg-setting-label-compact' : undefined);

  const selectClass = () => createClassName('xeg-setting-select-full', 'xeg-inline-center');

  // Reactive values
  const themeValue = createMemo(() => resolveAccessorValue(props.currentTheme));
  const languageValue = createMemo(() => resolveAccessorValue(props.currentLanguage));

  // Element IDs
  const themeSelectId = props['data-testid']
    ? `${props['data-testid']}-theme-select`
    : 'settings-theme-select';
  const languageSelectId = props['data-testid']
    ? `${props['data-testid']}-language-select`
    : 'settings-language-select';

  // String accessors
  const themeStrings = () => strings().theme;
  const languageStrings = () => strings().language;

  return (
    <div class={containerClass()} data-testid={props['data-testid']}>
      {/* Theme Selection */}
      <div class={settingClass()}>
        <label for={themeSelectId} class={labelClass()}>
          {themeStrings().title}
        </label>
        <select
          id={themeSelectId}
          class={selectClass()}
          onChange={props.onThemeChange}
          value={themeValue()}
          aria-label={themeStrings().title}
          title={themeStrings().title}
          data-testid={props['data-testid'] ? `${props['data-testid']}-theme` : undefined}
        >
          {THEME_OPTIONS.map(option => (
            <option value={option}>{themeStrings().labels[option]}</option>
          ))}
        </select>
      </div>

      {/* Language Selection */}
      <div class={settingClass()}>
        <label for={languageSelectId} class={labelClass()}>
          {languageStrings().title}
        </label>
        <select
          id={languageSelectId}
          class={selectClass()}
          onChange={props.onLanguageChange}
          value={languageValue()}
          aria-label={languageStrings().title}
          title={languageStrings().title}
          data-testid={props['data-testid'] ? `${props['data-testid']}-language` : undefined}
        >
          {LANGUAGE_OPTIONS.map(option => (
            <option value={option}>{languageStrings().labels[option]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SettingsControls;
