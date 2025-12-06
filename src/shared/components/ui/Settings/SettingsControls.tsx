import { getLanguageService } from '@shared/container/service-accessors';
import type { JSXElement } from '@shared/external/vendors';
import { createClassName } from '@shared/utils/text/formatting';
import { createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import styles from './SettingsControls.module.css';

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
export function SettingsControls(props: SettingsControlsProps): JSXElement {
  const languageService = getLanguageService();

  const [revision, setRevision] = createSignal(0);

  onMount(() => {
    const unsubscribe = languageService.onLanguageChange(() => setRevision((v) => v + 1));
    onCleanup(unsubscribe);
  });

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

  const selectClass = createClassName('xeg-inline-center', styles.select);
  const containerClass = props.compact ? `${styles.body} ${styles.bodyCompact}` : styles.body;
  const settingClass = props.compact
    ? `${styles.setting} ${styles.settingCompact}`
    : styles.setting;
  const labelClass = props.compact ? `${styles.label} ${styles.compactLabel}` : styles.label;

  const themeValue = createMemo(() => resolveAccessorValue(props.currentTheme));
  const languageValue = createMemo(() => resolveAccessorValue(props.currentLanguage));

  const themeSelectId = props['data-testid']
    ? `${props['data-testid']}-theme-select`
    : 'settings-theme-select';
  const languageSelectId = props['data-testid']
    ? `${props['data-testid']}-language-select`
    : 'settings-language-select';

  const themeStrings = () => strings().theme;
  const languageStrings = () => strings().language;

  return (
    <div class={containerClass} data-testid={props['data-testid']}>
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
          data-testid={props['data-testid'] ? `${props['data-testid']}-theme` : undefined}
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
          data-testid={props['data-testid'] ? `${props['data-testid']}-language` : undefined}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option value={option}>{languageStrings().labels[option]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
