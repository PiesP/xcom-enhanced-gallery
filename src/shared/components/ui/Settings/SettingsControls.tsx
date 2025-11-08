import { getSolid } from '../../../external/vendors';
import type { JSXElement } from '../../../external/vendors';
import { languageService } from '../../../services/language-service';
import toolbarStyles from '../Toolbar/Toolbar.module.css';
import styles from './SettingsControls.module.css';

export type ThemeOption = 'auto' | 'light' | 'dark';
export type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

const THEME_OPTIONS: readonly ThemeOption[] = ['auto', 'light', 'dark'];
const LANGUAGE_OPTIONS: readonly LanguageOption[] = ['auto', 'ko', 'en', 'ja'];

export interface SettingsControlsProps {
  currentTheme: ThemeOption;
  currentLanguage: LanguageOption;
  onThemeChange: (event: Event) => void;
  onLanguageChange: (event: Event) => void;
  compact?: boolean;
  'data-testid'?: string;
}
export function SettingsControls(props: SettingsControlsProps): JSXElement {
  const { createMemo, createSignal, onCleanup, onMount } = getSolid();

  const [revision, setRevision] = createSignal(0);

  onMount(() => {
    const unsubscribe = languageService.onLanguageChange(() => setRevision(v => v + 1));
    onCleanup(unsubscribe);
  });

  const strings = createMemo(() => {
    revision();
    return {
      theme: {
        title: languageService.getString('settings.theme'),
        labels: {
          auto: languageService.getString('settings.themeAuto'),
          light: languageService.getString('settings.themeLight'),
          dark: languageService.getString('settings.themeDark'),
        } as Record<ThemeOption, string>,
      },
      language: {
        title: languageService.getString('settings.language'),
        labels: {
          auto: languageService.getString('settings.languageAuto'),
          ko: languageService.getString('settings.languageKo'),
          en: languageService.getString('settings.languageEn'),
          ja: languageService.getString('settings.languageJa'),
        } as Record<LanguageOption, string>,
      },
    };
  });

  const selectClass = `${toolbarStyles.toolbarButton} ${styles.select}`;
  const containerClass = props.compact ? `${styles.body} ${styles.bodyCompact}` : styles.body;
  const settingClass = props.compact
    ? `${styles.setting} ${styles.settingCompact}`
    : styles.setting;
  const labelClass = props.compact ? `${styles.label} ${styles.compactLabel}` : styles.label;

  const withCurrentFirst = <T extends string>(options: readonly T[], current: T): T[] => [
    current,
    ...options.filter(option => option !== current),
  ];

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
          aria-label={themeStrings().title}
          title={themeStrings().title}
          data-testid={props['data-testid'] ? `${props['data-testid']}-theme` : undefined}
        >
          {withCurrentFirst(THEME_OPTIONS, props.currentTheme).map(option => (
            <option value={option} selected={option === props.currentTheme}>
              {themeStrings().labels[option]}
            </option>
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
          aria-label={languageStrings().title}
          title={languageStrings().title}
          data-testid={props['data-testid'] ? `${props['data-testid']}-language` : undefined}
        >
          {withCurrentFirst(LANGUAGE_OPTIONS, props.currentLanguage).map(option => (
            <option value={option} selected={option === props.currentLanguage}>
              {languageStrings().labels[option]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
