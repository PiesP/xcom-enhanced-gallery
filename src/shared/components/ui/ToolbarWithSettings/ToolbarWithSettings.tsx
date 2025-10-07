import { getSolid } from '@shared/external/vendors';
import type { Component } from '@shared/external/vendors';

/**
 * @fileoverview ToolbarWithSettings.solid - Toolbar + Settings Modal Integration
 * @description Solid.js implementation combining Toolbar and SettingsModal
 * @version 1.0.1 - Phase 9.2: Show 컴포넌트 통일
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
 * - Show 컴포넌트로 조건부 렌더링
 * - 모든 Toolbar props를 pass-through (onOpenSettings 제외)
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
  // Show는 solid-js에서만 가져와야 함 (solid-js/web의 Show와 중복 방지)
  const { createSignal, Show } = getSolid();

  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

  const handleOpenSettings = (): void => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = (): void => {
    setIsSettingsOpen(false);
  };

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

      <Show when={isSettingsOpen()}>
        <SettingsModal
          isOpen={isSettingsOpen()}
          onClose={handleCloseSettings}
          position={modalPosition()}
          data-testid={props.settingsTestId || 'toolbar-settings-modal'}
        />
      </Show>
    </>
  );
};
