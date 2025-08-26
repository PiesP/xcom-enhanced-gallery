/**
 * @fileoverview ToolbarWithSettings 컴포넌트 (일관된 glassmorphism 디자인)
 * @description TDD로 개선된 툴바와 설정 모달 통합 컴포넌트
 * @version 6.0.0 - Glassmorphism 일관성 적용
 */

import { getPreact, getPreactHooks, type VNode } from '@shared/external/vendors';
import { Toolbar, type ToolbarProps } from '../Toolbar/Toolbar';
import { SettingsModal } from '../SettingsModal/SettingsModal';

export interface ToolbarWithSettingsProps extends Omit<ToolbarProps, 'onOpenSettings'> {
  /** 설정 모달 위치 (기본: toolbar-below) */
  settingsPosition?: 'center' | 'toolbar-below' | 'bottom-sheet' | 'top-right';
  /** 설정 모달 테스트 ID */
  settingsTestId?: string;
}

/**
 * 툴바와 설정 모달을 통합한 컴포넌트
 * @description 동일한 glassmorphism 디자인 시스템 적용으로 시각적 일관성 보장
 */
export function ToolbarWithSettings({
  settingsPosition = 'toolbar-below',
  settingsTestId = 'toolbar-settings-modal',
  ...toolbarProps
}: ToolbarWithSettingsProps): VNode {
  const { h, Fragment } = getPreact();
  const { useState, useCallback } = getPreactHooks();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  return h(Fragment, null, [
    h(Toolbar, {
      ...toolbarProps,
      onOpenSettings: handleOpenSettings,
      key: 'unified-toolbar',
    }),
    isSettingsOpen &&
      h(SettingsModal, {
        isOpen: isSettingsOpen,
        onClose: handleCloseSettings,
        position: settingsPosition,
        'data-testid': settingsTestId,
        key: 'unified-settings-modal',
      }),
  ]);
}
