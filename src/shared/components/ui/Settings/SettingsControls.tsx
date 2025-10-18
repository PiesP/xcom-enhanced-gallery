/**
 * @fileoverview SettingsControls - Extracted settings UI component (Phase 45)
 * @description Reusable theme and language selection controls extracted from SettingsModal
 */
import { type JSXElement } from '../../../external/vendors';
import { LanguageService } from '../../../services/language-service';
import toolbarStyles from '../Toolbar/Toolbar.module.css';
import styles from './SettingsControls.module.css';

export type ThemeOption = 'auto' | 'light' | 'dark';
export type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

export interface SettingsControlsProps {
  currentTheme: ThemeOption;
  currentLanguage: LanguageOption;
  onThemeChange: (event: Event) => void;
  onLanguageChange: (event: Event) => void;
  compact?: boolean;
  'data-testid'?: string;
}

/**
 * SettingsControls - Pure UI component for theme and language selection
 *
 * @param props - Component properties
 * @param props.currentTheme - Current theme value ('auto' | 'light' | 'dark')
 * @param props.currentLanguage - Current language value ('auto' | 'ko' | 'en' | 'ja')
 * @param props.onThemeChange - Handler for theme selection changes
 * @param props.onLanguageChange - Handler for language selection changes
 * @param props.compact - If true, renders in compact mode (labels hidden for toolbar)
 * @returns JSX element containing theme and language controls
 */
export function SettingsControls(props: SettingsControlsProps): JSXElement {
  const languageService = new LanguageService();
  const containerClass = [styles.body, props.compact ? styles.bodyCompact : '']
    .filter(Boolean)
    .join(' ');
  const settingClass = [styles.setting, props.compact ? styles.settingCompact : '']
    .filter(Boolean)
    .join(' ');
  const labelClass = [styles.label, props.compact ? styles.compactLabel : '']
    .filter(Boolean)
    .join(' ');
  const themeTitle = languageService.getString('settings.theme');
  const languageTitle = languageService.getString('settings.language');

  return (
    <div class={containerClass} data-testid={props['data-testid']}>
      <div class={settingClass}>
        <label for='theme-select' class={labelClass}>
          {themeTitle}
        </label>
        <select
          id='theme-select'
          class={`${toolbarStyles.toolbarButton} ${styles.select}`}
          onChange={props.onThemeChange}
          aria-label={themeTitle}
          title={themeTitle}
          data-testid={props['data-testid'] ? `${props['data-testid']}-theme` : undefined}
        >
          <option value='auto' selected={props.currentTheme === 'auto'}>
            {languageService.getString('settings.themeAuto')}
          </option>
          <option value='light' selected={props.currentTheme === 'light'}>
            {languageService.getString('settings.themeLight')}
          </option>
          <option value='dark' selected={props.currentTheme === 'dark'}>
            {languageService.getString('settings.themeDark')}
          </option>
        </select>
      </div>
      <div class={settingClass}>
        <label for='language-select' class={labelClass}>
          {languageTitle}
        </label>
        <select
          id='language-select'
          class={`${toolbarStyles.toolbarButton} ${styles.select}`}
          onChange={props.onLanguageChange}
          aria-label={languageTitle}
          title={languageTitle}
          data-testid={props['data-testid'] ? `${props['data-testid']}-language` : undefined}
        >
          <option value='auto' selected={props.currentLanguage === 'auto'}>
            {languageService.getString('settings.languageAuto')}
          </option>
          <option value='ko' selected={props.currentLanguage === 'ko'}>
            {languageService.getString('settings.languageKo')}
          </option>
          <option value='en' selected={props.currentLanguage === 'en'}>
            {languageService.getString('settings.languageEn')}
          </option>
          <option value='ja' selected={props.currentLanguage === 'ja'}>
            {languageService.getString('settings.languageJa')}
          </option>
        </select>
      </div>
    </div>
  );
}
