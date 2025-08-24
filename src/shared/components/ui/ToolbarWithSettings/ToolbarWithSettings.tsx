/**
 * @fileoverview ToolbarWithSettings 컴포넌트
 * @description Toolbar와 SettingsModal을 통합한 컴포넌트
 */

import { getPreact, getPreactHooks, type VNode } from '@shared/external/vendors';
import { Toolbar, type ToolbarProps } from '../Toolbar/Toolbar';
import { SettingsModal } from '../SettingsModal/SettingsModal';

export interface ToolbarWithSettingsProps extends Omit<ToolbarProps, 'onOpenSettings'> {
  // ToolbarProps에서 onOpenSettings를 제거하고 내부에서 관리
}

export function ToolbarWithSettings(props: ToolbarWithSettingsProps): VNode {
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
      ...props,
      onOpenSettings: handleOpenSettings,
      key: 'toolbar',
    }),
    isSettingsOpen &&
      h(SettingsModal, {
        isOpen: isSettingsOpen,
        onClose: handleCloseSettings,
        key: 'settings-modal',
      }),
  ]);
}
