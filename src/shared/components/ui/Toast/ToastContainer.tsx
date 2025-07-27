/**
 * @fileoverview Toast Container Component
 * @version 3.0.0 - Phase 3 StandardProps 시스템 적용
 */

import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { toasts, removeToast, Toast } from './Toast';
import { ComponentStandards } from '../StandardProps';
import type { StandardToastContainerProps } from '../StandardProps';
import styles from './ToastContainer.module.css';
import type { VNode } from '@shared/external/vendors';

// 통합된 ToastContainer Props (표준 우선, 레거시 fallback)
export interface ToastContainerProps extends Partial<StandardToastContainerProps> {
  // 레거시 호환성을 위한 추가 속성들
  className?: string;
  // 표준 이벤트 핸들러들
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

/**
 * Toast 컨테이너 컴포넌트
 *
 * 화면에 고정되어 모든 토스트 알림을 표시합니다.
 * Phase 3: StandardProps 시스템 적용으로 일관된 인터페이스 제공
 */
export function ToastContainer({
  className = '',
  position = 'top-right',
  maxToasts = 5,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role,
  tabIndex,
  onFocus,
  onBlur,
  onKeyDown,
}: ToastContainerProps = {}): VNode {
  const { h } = getPreact();
  const { useEffect, useState } = getPreactHooks();
  const [currentToasts, setCurrentToasts] = useState(toasts.value);

  // 표준화된 클래스명 생성
  const containerClass = ComponentStandards.createClassName(
    styles.container,
    styles[position] || styles['top-right'], // position에 따른 스타일
    className
  );

  useEffect(() => {
    // 토스트 상태 변경 구독
    const unsubscribe = toasts.subscribe(setCurrentToasts);
    return unsubscribe;
  }, []);

  // maxToasts 제한 적용
  const limitedToasts = currentToasts.slice(0, maxToasts);

  return h(
    'div',
    {
      className: containerClass,
      'data-testid': testId || 'toast-container',
      'data-position': position,
      'data-max-toasts': maxToasts,
      'aria-label': ariaLabel || 'Toast 알림 컨테이너',
      'aria-describedby': ariaDescribedBy,
      'aria-live': 'polite',
      'aria-atomic': 'false',
      role: role || 'region',
      tabIndex,
      onFocus,
      onBlur,
      onKeyDown,
    } as Record<string, unknown>,
    limitedToasts.map(toast =>
      h(Toast, {
        key: toast.id,
        toast,
        onRemove: removeToast,
      })
    )
  );
}
