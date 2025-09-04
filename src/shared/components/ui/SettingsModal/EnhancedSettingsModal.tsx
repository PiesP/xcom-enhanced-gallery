/**
 * @fileoverview EnhancedSettingsModal Component (TDD Phase T4)
 * @description Focus trap과 scroll lock이 적용된 설정 모달
 */

import { h, type ComponentChildren } from '@shared/external/vendors';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';
import { useScrollLock } from '@shared/hooks/useScrollLock';

interface EnhancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ComponentChildren;
}

export function EnhancedSettingsModal(props: EnhancedSettingsModalProps) {
  const { containerRef } = useFocusTrap({
    enabled: props.isOpen,
    autoFocus: true,
    restoreFocus: true,
  });

  useScrollLock({
    enabled: props.isOpen,
    reserveScrollBarGap: true,
  });

  if (!props.isOpen) {
    return null;
  }

  const handleBackdropClick = (event: Event) => {
    if (event.target === event.currentTarget) {
      props.onClose();
    }
  };

  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      props.onClose();
    }
  };

  return h(
    'div',
    {
      class: 'enhanced-settings-modal-backdrop',
      onClick: handleBackdropClick,
      onKeyDown: handleEscapeKey,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Settings dialog',
    },
    h(
      'div',
      {
        ref: containerRef,
        class: 'enhanced-settings-modal-content',
        role: 'document',
      },
      props.children
    )
  );
}
