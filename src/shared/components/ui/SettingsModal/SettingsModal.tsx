import { getSolid } from '@shared/external/vendors';
import type { Component } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { languageService } from '@shared/services';

/**
 * @fileoverview SettingsModal.solid - Simplified Solid.js Settings Modal
 * @description Solid.js version of SettingsModal using ModalShell and primitives
 */
import { ModalShell } from '../ModalShell/ModalShell';
import styles from './SettingsModal.module.css';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'panel' | 'modal';
  position?: 'toolbar-below' | 'top-right' | 'center' | 'bottom-sheet';
  theme?: 'auto' | 'light' | 'dark';
  language?: 'auto' | 'ko' | 'en' | 'ja';
  onThemeChange?: (theme: 'auto' | 'light' | 'dark') => void;
  onLanguageChange?: (language: 'auto' | 'ko' | 'en' | 'ja') => void;
  className?: string;
  'data-testid'?: string;
  'aria-label'?: string;
}

/**
 * SettingsModal - Simplified settings modal using ModalShell
 *
 * Simplified version focusing on core functionality:
 * - Theme selection (auto, light, dark)
 * - Language selection (auto, ko, en, ja)
 * - ModalShell for portal rendering and accessibility
 * - Focus trap and scroll lock via primitives (future)
 *
 * @example
 * <SettingsModal
 *   isOpen={isOpen()}
 *   onClose={() => setIsOpen(false)}
 *   theme={theme()}
 *   language={language()}
 *   onThemeChange={handleThemeChange}
 *   onLanguageChange={handleLanguageChange}
 * />
 */
export const SettingsModal: Component<SettingsModalProps> = props => {
  // vendors getter를 컴포넌트 내부에서 호출
  const { mergeProps, splitProps, createSignal, createEffect } = getSolid();

  const merged = mergeProps(
    {
      mode: 'panel' as const,
      position: 'center' as const,
      theme: 'auto' as const,
      language: 'auto' as const,
      'aria-label': 'Settings',
    },
    props
  );

  const [local, handlers, ariaProps] = splitProps(
    merged,
    ['isOpen', 'onClose', 'mode', 'position', 'theme', 'language', 'className'],
    ['onThemeChange', 'onLanguageChange'],
    ['aria-label', 'data-testid']
  );

  // Internal state for controlled inputs (if external props not provided)
  const [internalTheme, setInternalTheme] = createSignal(local.theme);
  const [internalLanguage, setInternalLanguage] = createSignal(local.language);

  // 개발 모드에서 모달 상태 추적
  createEffect(() => {
    const isOpen = local.isOpen;
    if (isOpen) {
      logger.debug('[SettingsModal] 설정 모달 렌더링 시작', {
        timestamp: new Date().toISOString(),
        position: local.position,
        mode: local.mode,
      });
      // 다음 프레임에서 렌더링 완료 확인
      requestAnimationFrame(() => {
        logger.debug('[SettingsModal] 설정 모달 렌더링 완료 (DOM 업데이트됨)', {
          timestamp: new Date().toISOString(),
        });
      });
    } else {
      logger.debug('[SettingsModal] 설정 모달 숨김 처리됨', {
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle theme change
  const handleThemeChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as 'auto' | 'light' | 'dark';
    setInternalTheme(value);
    handlers.onThemeChange?.(value);
  };

  // Handle language change
  const handleLanguageChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as 'auto' | 'ko' | 'en' | 'ja';
    setInternalLanguage(value);
    handlers.onLanguageChange?.(value);
  };

  // Reactive class for panel/modal container
  const containerClass = () => {
    const classes = [styles['settings-modal']];
    if (local.mode === 'panel') {
      classes.push(styles['settings-panel']);
    }
    if (local.position) {
      classes.push(styles[`position-${local.position}`]);
    }
    if (local.className) {
      classes.push(local.className);
    }
    return classes.filter(Boolean).join(' ');
  };

  return (
    <ModalShell
      isOpen={local.isOpen}
      onClose={local.onClose}
      size='md'
      surfaceVariant='glass'
      closeOnBackdropClick={true}
      closeOnEscape={true}
      className={containerClass()}
      aria-label={ariaProps['aria-label']}
      {...(ariaProps['data-testid'] ? { 'data-testid': ariaProps['data-testid'] } : {})}
    >
      <div class={styles['settings-content']}>
        {/* Header */}
        <div class={styles['settings-header']}>
          <h2 class={styles['settings-title']}>{languageService.getString('settings.title')}</h2>
          <button
            onClick={local.onClose}
            class={styles['close-button']}
            type='button'
            aria-label={languageService.getString('settings.close')}
            data-testid='settings-close-button'
          >
            ×
          </button>
        </div>

        {/* Settings Form */}
        <form class={styles['settings-form']}>
          {/* Theme Selection */}
          <div class={styles['form-group']}>
            <label for='theme-select' class={styles['form-label']}>
              {languageService.getString('settings.theme')}
            </label>
            <select
              id='theme-select'
              class={styles['form-select']}
              value={local.theme || internalTheme()}
              onChange={handleThemeChange}
              data-testid='theme-select'
            >
              <option value='auto'>{languageService.getString('settings.themeAuto')}</option>
              <option value='light'>{languageService.getString('settings.themeLight')}</option>
              <option value='dark'>{languageService.getString('settings.themeDark')}</option>
            </select>
          </div>

          {/* Language Selection */}
          <div class={styles['form-group']}>
            <label for='language-select' class={styles['form-label']}>
              {languageService.getString('settings.language')}
            </label>
            <select
              id='language-select'
              class={styles['form-select']}
              value={local.language || internalLanguage()}
              onChange={handleLanguageChange}
              data-testid='language-select'
            >
              <option value='auto'>{languageService.getString('settings.languageAuto')}</option>
              <option value='ko'>{languageService.getString('settings.languageKo')}</option>
              <option value='en'>{languageService.getString('settings.languageEn')}</option>
              <option value='ja'>{languageService.getString('settings.languageJa')}</option>
            </select>
          </div>
        </form>
      </div>
    </ModalShell>
  );
};

export default SettingsModal;
