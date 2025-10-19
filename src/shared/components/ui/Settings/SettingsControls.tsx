/**
 * @fileoverview SettingsControls - Extracted settings UI component (Phase 45)
 * @description Reusable theme and language selection controls extracted from SettingsModal
 * @updated Phase 118: 언어 변경 실시간 반영 - createEffect + createMemo로 반응형 구현
 */
import { getSolid } from '../../../external/vendors';
import type { JSXElement } from '../../../external/vendors';
import { languageService } from '../../../services/language-service';
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
  const solid = getSolid();
  const { createSignal, createEffect, createMemo, onCleanup } = solid;

  // Phase 118: 언어 변경 추적을 위한 signal
  const [_, setLanguageTrigger] = createSignal(0);

  // Phase 118: 언어 변경 이벤트 구독
  createEffect(() => {
    const unsubscribe = languageService.onLanguageChange(() => {
      setLanguageTrigger(prev => prev + 1);
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  const i18n = languageService;
  const containerClass = [styles.body, props.compact ? styles.bodyCompact : '']
    .filter(Boolean)
    .join(' ');
  const settingClass = [styles.setting, props.compact ? styles.settingCompact : '']
    .filter(Boolean)
    .join(' ');
  const labelClass = [styles.label, props.compact ? styles.compactLabel : '']
    .filter(Boolean)
    .join(' ');

  // Phase 118: createMemo로 문자열을 동적 생성 (언어 변경 시 자동 업데이트)
  const themeTitle = createMemo(() => {
    _(); // 언어 트리거 구독
    return i18n.getString('settings.theme');
  });
  const languageTitle = createMemo(() => {
    _(); // 언어 트리거 구독
    return i18n.getString('settings.language');
  });

  // 테마 옵션 텍스트
  const themeAutoText = createMemo(() => {
    _();
    return i18n.getString('settings.themeAuto');
  });
  const themeLightText = createMemo(() => {
    _();
    return i18n.getString('settings.themeLight');
  });
  const themeDarkText = createMemo(() => {
    _();
    return i18n.getString('settings.themeDark');
  });

  // 언어 옵션 텍스트
  const languageAutoText = createMemo(() => {
    _();
    return i18n.getString('settings.languageAuto');
  });
  const languageKoText = createMemo(() => {
    _();
    return i18n.getString('settings.languageKo');
  });
  const languageEnText = createMemo(() => {
    _();
    return i18n.getString('settings.languageEn');
  });
  const languageJaText = createMemo(() => {
    _();
    return i18n.getString('settings.languageJa');
  });

  return (
    <div class={containerClass} data-testid={props['data-testid']}>
      <div class={settingClass}>
        <label for='theme-select' class={labelClass}>
          {themeTitle()}
        </label>
        <select
          id='theme-select'
          class={`${toolbarStyles.toolbarButton} ${styles.select}`}
          onChange={props.onThemeChange}
          aria-label={themeTitle()}
          title={themeTitle()}
          data-testid={props['data-testid'] ? `${props['data-testid']}-theme` : undefined}
        >
          <option value='auto' selected={props.currentTheme === 'auto'}>
            {themeAutoText()}
          </option>
          <option value='light' selected={props.currentTheme === 'light'}>
            {themeLightText()}
          </option>
          <option value='dark' selected={props.currentTheme === 'dark'}>
            {themeDarkText()}
          </option>
        </select>
      </div>
      <div class={settingClass}>
        <label for='language-select' class={labelClass}>
          {languageTitle()}
        </label>
        <select
          id='language-select'
          class={`${toolbarStyles.toolbarButton} ${styles.select}`}
          onChange={props.onLanguageChange}
          aria-label={languageTitle()}
          title={languageTitle()}
          data-testid={props['data-testid'] ? `${props['data-testid']}-language` : undefined}
        >
          <option value='auto' selected={props.currentLanguage === 'auto'}>
            {languageAutoText()}
          </option>
          <option value='ko' selected={props.currentLanguage === 'ko'}>
            {languageKoText()}
          </option>
          <option value='en' selected={props.currentLanguage === 'en'}>
            {languageEnText()}
          </option>
          <option value='ja' selected={props.currentLanguage === 'ja'}>
            {languageJaText()}
          </option>
        </select>
      </div>
    </div>
  );
}
