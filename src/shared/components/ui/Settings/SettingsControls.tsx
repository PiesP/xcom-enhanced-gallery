/**
 * @fileoverview SettingsControls - Extracted settings UI component (Phase 45)
 * @description Reusable theme and language selection controls extracted from SettingsModal
 */
import { getSolid, type JSXElement } from '../../../external/vendors';
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
  const { Show } = getSolid();
  const languageService = new LanguageService();

  return (
    <div class={styles.body} data-testid={props['data-testid']}>
      <div class={styles.setting}>
        <Show when={!props.compact}>
          <label for='theme-select' class={styles.label}>
            {languageService.getString('settings.theme')}
          </label>
        </Show>
        <select
          id='theme-select'
          class={`${toolbarStyles.toolbarButton} ${styles.select}`}
          onChange={props.onThemeChange}
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
      <div class={styles.setting}>
        <Show when={!props.compact}>
          <label for='language-select' class={styles.label}>
            {languageService.getString('settings.language')}
          </label>
        </Show>
        <select
          id='language-select'
          class={`${toolbarStyles.toolbarButton} ${styles.select}`}
          onChange={props.onLanguageChange}
          data-testid={props['data-testid'] ? `${props['data-testid']}-language` : undefined}
        >
          <option value='auto' selected={props.currentLanguage === 'auto'}>
            자동 / Auto / 自動
          </option>
          <option value='ko' selected={props.currentLanguage === 'ko'}>
            한국어
          </option>
          <option value='en' selected={props.currentLanguage === 'en'}>
            English
          </option>
          <option value='ja' selected={props.currentLanguage === 'ja'}>
            日本語
          </option>
        </select>
      </div>
    </div>
  );
}
