import { getSolid } from '@shared/external/vendors';
const { mergeProps, splitProps } = getSolid();
import { getSolidWeb } from '@shared/external/vendors';
const { Portal } = getSolidWeb();
import type { Component, JSX } from '@shared/external/vendors';

/**
 * @fileoverview ModalShell Solid Component
 * @description Solid.js implementation of modal shell with Portal
 * @version 1.0.4 - Phase 9.6: Show 제거 및 CSS 기반 가시성 제어
 *
 * Phase 9.6 수정:
 * - Show 컴포넌트 제거 (설정 모달 미표시 버그 수정)
 * - CSS 기반 가시성 제어로 전환 (isOpen prop → CSS class)
 * - Portal은 항상 렌더링되고, CSS transition으로 fade-in/out
 */

import styles from './ModalShell.module.css';

export interface ModalShellProps {
  /** Content */
  children: JSX.Element;

  /** Modal visibility */
  isOpen: boolean;

  /** Close handler */
  onClose?: () => void;

  /** Size */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /** Surface variant */
  surfaceVariant?: 'glass' | 'solid' | 'elevated';

  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;

  /** Close on ESC key */
  closeOnEscape?: boolean;

  /** Additional class */
  className?: string;

  /** Test ID */
  'data-testid'?: string;

  /** ARIA label */
  'aria-label'?: string;
}

/**
 * Modal shell component - design token based
 *
 * Phase 9.6: CSS 기반 가시성 제어
 * - Show 제거: 이제 Portal은 항상 렌더링됨
 * - isOpen prop에 따라 modal-open 클래스 토글
 * - CSS transition으로 부드러운 fade-in/out 효과
 */
export const ModalShell: Component<ModalShellProps> = props => {
  const merged = mergeProps(
    {
      size: 'md' as const,
      surfaceVariant: 'glass' as const,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      'aria-label': 'Modal',
    },
    props
  );

  const [local, ariaProps, rest] = splitProps(
    merged,
    [
      'children',
      'isOpen',
      'onClose',
      'size',
      'surfaceVariant',
      'closeOnBackdropClick',
      'closeOnEscape',
      'className',
    ],
    ['aria-label', 'data-testid']
  );

  // ESC key handler
  const handleKeyDown = (event: KeyboardEvent) => {
    if (local.closeOnEscape && event.key === 'Escape' && local.onClose) {
      event.preventDefault();
      local.onClose();
    }
  };

  // Backdrop click handler
  const handleBackdropClick = (event: MouseEvent) => {
    if (local.closeOnBackdropClick && event.target === event.currentTarget && local.onClose) {
      event.preventDefault();
      local.onClose();
    }
  };

  // Phase 9.6: CSS 클래스 기반 가시성 제어
  const backdropClass = () => {
    const classes = [styles['modal-backdrop']];
    if (local.isOpen) {
      classes.push(styles['modal-open']);
    }
    return classes.filter(Boolean).join(' ');
  };

  const shellClass = () => {
    const classes = [
      styles['modal-shell'],
      styles[`modal-size-${local.size}`],
      styles[`modal-surface-${local.surfaceVariant}`],
    ];
    if (local.className) {
      classes.push(local.className);
    }
    return classes.filter(Boolean).join(' ');
  };

  // Phase 9.6: Show 제거 - Portal은 항상 렌더링, CSS로 가시성 제어
  return (
    <Portal>
      <div
        class={backdropClass()}
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        data-testid={ariaProps['data-testid'] ? `${ariaProps['data-testid']}-backdrop` : undefined}
      >
        <div
          class={shellClass()}
          role='dialog'
          aria-modal='true'
          aria-label={ariaProps['aria-label']}
          data-testid={ariaProps['data-testid']}
          {...rest}
        >
          {local.children}
        </div>
      </div>
    </Portal>
  );
};
