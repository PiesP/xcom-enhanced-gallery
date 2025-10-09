import { getSolid } from '@shared/external/vendors';
import type { Component } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { themeService, languageService } from '@shared/services';

/**
 * @fileoverview ToolbarWithSettings.solid - Toolbar + Settings Modal Integration
 * @description Solid.js implementation combining Toolbar and SettingsModal
 * @version 1.1.0 - Phase 9.22: ThemeService/LanguageService 연동
 *
 * Phase 9.22 수정:
 * - themeService, languageService import 추가
 * - handleThemeChange, handleLanguageChange 구현
 * - SettingsModal에 theme, language, onChange props 전달
 * - 현재 설정값을 reactive getter로 제공
 *
 * Phase 9.2 수정:
 * - Show 컴포넌트를 solid-js에서만 import (solid-js/web 중복 제거)
 * - Solid.js 반응성 시스템의 일관성 보장
 * - getSolidWeb() import 제거 (불필요)
 */

import { Toolbar, type ToolbarProps } from '../Toolbar/Toolbar';
import { SettingsModal } from '../SettingsModal/SettingsModal';

export interface ToolbarWithSettingsProps extends Omit<ToolbarProps, 'onOpenSettings'> {
  /** 설정 모달 위치 (기본: toolbar-below) */
  settingsPosition?: 'center' | 'toolbar-below' | 'bottom-sheet' | 'top-right';
  /** 설정 모달 테스트 ID */
  settingsTestId?: string;
}

/**
 * 툴바와 설정 모달을 통합한 컴포넌트 (Solid.js)
 *
 * @description
 * - Toolbar.solid와 SettingsModal.solid를 결합한 래퍼 컴포넌트
 * - createSignal로 설정 모달 open/close 상태 관리
 * - SettingsModal이 내부적으로 조건부 렌더링 처리 (Show 컴포넌트 사용)
 * - 모든 Toolbar props를 pass-through (onOpenSettings 제외)
 *
 * @version 1.0.2 - Phase 9.3: Show 중첩 제거
 * - ToolbarWithSettings에서 외부 Show 제거
 * - SettingsModal이 isOpen prop으로 자체 렌더링 제어
 * - 컴포넌트 책임 명확화 및 재사용성 향상
 *
 * @example
 * ```tsx
 * <ToolbarWithSettings
 *   currentIndex={0}
 *   totalCount={10}
 *   onPrevious={() => {}}
 *   onNext={() => {}}
 *   onDownloadCurrent={() => {}}
 *   onDownloadAll={() => {}}
 *   onClose={() => {}}
 *   settingsPosition="toolbar-below"
 *   settingsTestId="gallery-settings"
 * />
 * ```
 */
export const ToolbarWithSettings: Component<ToolbarWithSettingsProps> = props => {
  // vendors getter를 컴포넌트 내부에서 호출
  // Phase 9.3: Show는 SettingsModal 내부에서만 사용
  const { createSignal } = getSolid();

  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

  const handleOpenSettings = (): void => {
    const previousState = isSettingsOpen();
    logger.debug('[ToolbarWithSettings] 설정 버튼 클릭됨', {
      timestamp: new Date().toISOString(),
      previousState,
    });
    // Phase 9.15: 토글 로직으로 수정 (항상 true 설정 버그 수정)
    setIsSettingsOpen(prev => !prev);
    logger.debug('[ToolbarWithSettings] 설정 모달 상태 변경됨', {
      previousState,
      newState: !previousState,
    });
  };

  const handleCloseSettings = (): void => {
    logger.debug('[ToolbarWithSettings] 설정 모달 닫힘 요청', {
      timestamp: new Date().toISOString(),
    });
    setIsSettingsOpen(false);
  };

  // Phase 9.22: ThemeService 연동
  const handleThemeChange = (theme: 'auto' | 'light' | 'dark'): void => {
    logger.debug('[ToolbarWithSettings] 테마 변경 요청', { theme });
    themeService.setTheme(theme);
  };

  // Phase 9.22: LanguageService 연동
  const handleLanguageChange = (language: 'auto' | 'ko' | 'en' | 'ja'): void => {
    logger.debug('[ToolbarWithSettings] 언어 변경 요청', { language });
    languageService.setLanguage(language);
  };

  // Phase 9.22: 현재 설정값 가져오기 (reactive)
  const currentTheme = () => themeService.getCurrentTheme();
  const currentLanguage = () => languageService.getCurrentLanguage();

  // SettingsModal은 'toolbar-below' | 'top-right'만 지원
  const modalPosition = (): 'toolbar-below' | 'top-right' => {
    const pos = props.settingsPosition;
    return pos === 'top-right' ? 'top-right' : 'toolbar-below';
  };

  // ToolbarProps에서 onOpenSettings를 제외한 나머지 props 추출
  const toolbarProps = (): Omit<ToolbarProps, 'onOpenSettings'> & {
    onOpenSettings: () => void;
  } => {
    const { settingsPosition, settingsTestId, ...rest } = props;
    return {
      ...(rest as ToolbarProps),
      onOpenSettings: handleOpenSettings,
    };
  };

  return (
    <>
      <Toolbar {...toolbarProps()} />

      {/* Phase 9.3: Show 제거 - SettingsModal이 내부적으로 처리 */}
      {/* Phase 9.22: theme, language, onChange props 추가 */}
      <SettingsModal
        isOpen={isSettingsOpen()}
        onClose={handleCloseSettings}
        position={modalPosition()}
        theme={currentTheme()}
        language={currentLanguage()}
        onThemeChange={handleThemeChange}
        onLanguageChange={handleLanguageChange}
        data-testid={props.settingsTestId || 'toolbar-settings-modal'}
      />
    </>
  );
};
