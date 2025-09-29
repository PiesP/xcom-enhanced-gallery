/**
 * @fileoverview SolidJS 기반 Settings Panel
 * @description FRAME-ALT-001 Stage B - Settings UI Solid 마이그레이션 1단계
 */

import { getSolidCore } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { LanguageService } from '@shared/services/LanguageService';
import { ThemeService } from '@shared/services/ThemeService';
import { getSetting, setSetting } from '@shared/container/settings-access';
import primitiveStyles from '@shared/styles/primitives.module.css';
import styles from '@shared/components/ui/SettingsModal/SettingsModal.module.css';

export interface SolidSettingsPanelProps {
  readonly isOpen: () => boolean;
  readonly onClose: () => void;
  readonly position?: 'center' | 'toolbar-below' | 'bottom-sheet' | 'top-right';
  readonly testId?: string;
}

type ThemeOption = 'auto' | 'light' | 'dark';
type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

const THEME_OPTIONS: ThemeOption[] = ['auto', 'light', 'dark'];
const LANGUAGE_OPTIONS: LanguageOption[] = ['auto', 'ko', 'en', 'ja'];

const SolidSettingsPanel = (props: SolidSettingsPanelProps) => {
  const solid = getSolidCore();
  const { createSignal, createEffect, onCleanup, createMemo } = solid;

  const languageService = new LanguageService();
  const themeService = new ThemeService();

  const getInitialTheme = (): ThemeOption => {
    try {
      const value = themeService.getCurrentTheme?.();
      if (value === 'auto' || value === 'light' || value === 'dark') {
        return value;
      }
    } catch (error) {
      logger.warn('[SolidSettingsPanel] Failed to resolve current theme:', error);
    }
    return 'auto';
  };

  const getInitialLanguage = (): LanguageOption => {
    try {
      const value = languageService.getCurrentLanguage?.();
      if (value === 'auto' || value === 'ko' || value === 'en' || value === 'ja') {
        return value;
      }
    } catch (error) {
      logger.warn('[SolidSettingsPanel] Failed to resolve current language:', error);
    }
    return 'auto';
  };

  const getInitialToastPreference = (): boolean => {
    try {
      const value = getSetting<boolean>('download.showProgressToast', false);
      return Boolean(value);
    } catch (error) {
      logger.warn('[SolidSettingsPanel] Failed to read persisted toast preference:', error);
    }
    return false;
  };

  const [currentTheme, setCurrentTheme] = createSignal<ThemeOption>(getInitialTheme());
  const [currentLanguage, setCurrentLanguage] = createSignal<LanguageOption>(getInitialLanguage());
  const [showProgressToast, setShowProgressToast] = createSignal<boolean>(
    getInitialToastPreference()
  );

  const localizedStrings = createMemo(() => {
    currentLanguage();
    return {
      title: languageService.getString('settings.title'),
      closeAria: languageService.getString('settings.close'),
      closeButton: languageService.getString('settings.close'),
      theme: languageService.getString('settings.theme'),
      language: languageService.getString('settings.language'),
      downloadToast: languageService.getString('settings.downloadProgressToast'),
      themeOptions: [
        { value: 'auto' as const, label: languageService.getString('settings.themeAuto') },
        { value: 'light' as const, label: languageService.getString('settings.themeLight') },
        { value: 'dark' as const, label: languageService.getString('settings.themeDark') },
      ],
      languageOptions: [
        { value: 'auto' as const, label: '자동 / Auto / 自動' },
        { value: 'ko' as const, label: '한국어' },
        { value: 'en' as const, label: 'English' },
        { value: 'ja' as const, label: '日本語' },
      ],
    };
  });

  createEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (props.isOpen()) {
      document.body.setAttribute('data-xeg-settings-open', 'true');
    } else {
      document.body.removeAttribute('data-xeg-settings-open');
    }
  });

  onCleanup(() => {
    if (typeof document !== 'undefined') {
      document.body.removeAttribute('data-xeg-settings-open');
    }
  });

  const getPositionClass = (): string => {
    switch (props.position) {
      case 'center':
        return styles.center || '';
      case 'bottom-sheet':
        return styles.bottomSheet || '';
      case 'top-right':
        return styles.topRight || '';
      case 'toolbar-below':
      default:
        return styles.toolbarBelow || '';
    }
  };

  const handleThemeChange = (event: Event) => {
    const target = event.target as HTMLSelectElement | null;
    if (!target) return;
    const value = target.value as ThemeOption;
    if (!THEME_OPTIONS.includes(value)) return;
    setCurrentTheme(value);
    try {
      themeService.setTheme?.(value);
    } catch (error) {
      logger.warn('[SolidSettingsPanel] Failed to apply theme change:', error);
    }
  };

  const handleLanguageChange = (event: Event) => {
    const target = event.target as HTMLSelectElement | null;
    if (!target) return;
    const value = target.value as LanguageOption;
    if (!LANGUAGE_OPTIONS.includes(value)) return;
    try {
      languageService.setLanguage(value);
    } catch (error) {
      logger.warn('[SolidSettingsPanel] Failed to apply language change:', error);
    }
    setCurrentLanguage(value);
  };

  const handleToastToggle = (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const checked = Boolean(target.checked);
    setShowProgressToast(checked);
    setSetting('download.showProgressToast', checked).catch(error => {
      logger.warn('[SolidSettingsPanel] Failed to persist toast preference:', error);
    });
  };

  const handleClose = () => {
    props.onClose();
  };

  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const testProps = props.testId ? ({ 'data-testid': props.testId } as const) : ({} as const);
  const selectClass = [primitiveStyles.controlSurface, styles.formControl, styles.select]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      data-xeg-solid-settings=''
      data-position={props.position ?? 'toolbar-below'}
      data-open={props.isOpen() ? 'true' : 'false'}
      role='dialog'
      aria-modal='true'
      aria-hidden={props.isOpen() ? 'false' : 'true'}
      aria-labelledby='xeg-solid-settings-title'
      class={[styles.panel, getPositionClass()].filter(Boolean).join(' ')}
      hidden={!props.isOpen()}
      onClick={handleBackdropClick}
      {...testProps}
    >
      <div
        class={[styles.modal, styles.inner].filter(Boolean).join(' ')}
        id='xeg-solid-settings-content'
      >
        <header class={styles.header}>
          <h2 id='xeg-solid-settings-title' class={styles.title}>
            {localizedStrings().title}
          </h2>
          <button
            type='button'
            class={styles.closeButton}
            data-action='close-settings'
            aria-label={localizedStrings().closeAria}
            onClick={handleClose}
          >
            {localizedStrings().closeButton}
          </button>
        </header>
        <div class={styles.body}>
          <div class={styles.setting}>
            <label for='xeg-solid-settings-theme' class={styles.label}>
              {localizedStrings().theme}
            </label>
            <select
              id='xeg-solid-settings-theme'
              class={selectClass}
              value={currentTheme()}
              onChange={handleThemeChange}
              onInput={handleThemeChange}
            >
              {localizedStrings().themeOptions.map(option => (
                <option value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div class={styles.setting}>
            <label for='xeg-solid-settings-language' class={styles.label}>
              {localizedStrings().language}
            </label>
            <select
              id='xeg-solid-settings-language'
              class={selectClass}
              value={currentLanguage()}
              onChange={handleLanguageChange}
              onInput={handleLanguageChange}
            >
              {localizedStrings().languageOptions.map(option => (
                <option value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div class={styles.setting}>
            <label for='xeg-solid-settings-progress-toast' class={styles.label}>
              {localizedStrings().downloadToast}
            </label>
            <input
              id='xeg-solid-settings-progress-toast'
              type='checkbox'
              class={styles.formControlToggle}
              checked={showProgressToast()}
              onChange={handleToastToggle}
              onInput={handleToastToggle}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolidSettingsPanel;
