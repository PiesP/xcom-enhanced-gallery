/**
 * @fileoverview Phase 2: ModalShell 추상화 컴포넌트
 * @description 모달의 공통 레이아웃/스타일 Shell - semantic props 사용
 */

import { getPreact, type ComponentChildren } from '../../../external/vendors';

export interface ModalShellProps {
  /** 컨텐츠 */
  children: ComponentChildren;

  /** 모달 표시 여부 */
  isOpen: boolean;

  /** 닫기 핸들러 */
  onClose?: () => void;

  /** 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /** 표면 변형 */
  surfaceVariant?: 'glass' | 'solid' | 'elevated';

  /** 백드롭 클릭으로 닫기 */
  closeOnBackdropClick?: boolean;

  /** ESC 키로 닫기 */
  closeOnEscape?: boolean;

  /** 추가 클래스 */
  className?: string;

  /** 테스트 ID */
  'data-testid'?: string;

  /** ARIA 레이블 */
  'aria-label'?: string;
}

/**
 * 모달의 공통 껍데기 - 디자인 토큰 기반
 */
export function ModalShell({
  children,
  isOpen,
  onClose,
  size = 'md',
  surfaceVariant = 'glass',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  'data-testid': testId,
  'aria-label': ariaLabel,
  ...props
}: ModalShellProps) {
  const { h } = getPreact();
  const sizeClass = `modal-size-${size}`;
  const surfaceClass = `modal-surface-${surfaceVariant}`;

  // ESC 키 핸들러
  const handleKeyDown = (event: KeyboardEvent) => {
    if (closeOnEscape && event.key === 'Escape' && onClose) {
      onClose();
    }
  };

  // 백드롭 클릭 핸들러
  const handleBackdropClick = (event: Event) => {
    if (closeOnBackdropClick && event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return h(
    'div',
    {
      class: `modal-backdrop ${isOpen ? 'modal-open' : ''}`.trim(),
      onClick: handleBackdropClick,
      onKeyDown: handleKeyDown,
      'data-testid': testId ? `${testId}-backdrop` : undefined,
    },
    h(
      'div',
      {
        class: `modal-shell ${sizeClass} ${surfaceClass} ${className}`.trim(),
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': ariaLabel || 'Modal',
        'data-testid': testId,
        ...props,
      },
      children
    )
  );
}

export default ModalShell;
