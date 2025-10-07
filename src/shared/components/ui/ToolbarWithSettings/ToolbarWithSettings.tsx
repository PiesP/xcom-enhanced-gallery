import { getSolid } from '@shared/external/vendors';
import { getSolidWeb } from '@shared/external/vendors';
import type { Component } from '@shared/external/vendors';

/**
 * @fileoverview ToolbarWithSettings.solid - Toolbar + Settings Modal Integration
 * @description Solid.js implementation combining Toolbar and SettingsModal
 * @version 1.0.0 - Solid.js Migration
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
  const { createSignal } = getSolid();
  const { Show } = getSolidWeb();

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
