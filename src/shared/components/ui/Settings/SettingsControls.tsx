import { getLanguageService } from '@shared/container/service-accessors';
import type { JSXElement } from '@shared/external/vendors';
import { resolve } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import type { Accessor } from 'solid-js';
import { createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import styles from './SettingsControls.module.css';

type MaybeAccessor<T> = T | Accessor<T>;

export type ThemeOption = 'auto' | 'light' | 'dark';
export type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

const THEME_OPTIONS: readonly ThemeOption[] = ['auto', 'light', 'dark'];
const LANGUAGE_OPTIONS: readonly LanguageOption[] = ['auto', 'ko', 'en', 'ja'];

export interface SettingsControlsProps {
  currentTheme: MaybeAccessor<ThemeOption>;
  currentLanguage: MaybeAccessor<LanguageOption>;
  onThemeChange: (event: Event) => void;
  onLanguageChange: (event: Event) => void;
  compact?: boolean;
  'data-testid'?: string | undefined;
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

  const selectClass = cx('xeg-inline-center', styles.select);
  const containerClass = cx(styles.body, props.compact && styles.bodyCompact);
  const settingClass = cx(styles.setting, props.compact && styles.settingCompact);
  const labelClass = cx(styles.label, props.compact && styles.compactLabel);

  const themeValue = createMemo(() => resolve(props.currentTheme));
  const languageValue = createMemo(() => resolve(props.currentLanguage));

  const themeSelectId = props['data-testid']
    ? `${props['data-testid']}-theme-select`
    : 'settings-theme-select';
  const languageSelectId = props['data-testid']
    ? `${props['data-testid']}-language-select`
    : 'settings-language-select';

  const themeStrings = () => strings().theme;
  const languageStrings = () => strings().language;

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
