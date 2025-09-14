/**
 * @fileoverview Toast Container Component
 * @version 3.0.0 - Phase 3 StandardProps 시스템 적용
 */

import { getPreact, getPreactHooks, getPreactCompat } from '../../../external/vendors';
import { Toast } from './Toast';
import { UnifiedToastManager } from '@/shared/services/UnifiedToastManager';
import { ComponentStandards } from '../StandardProps';
import type { StandardToastContainerProps } from '../StandardProps';
import type { BaseComponentProps } from '../../base/BaseComponentProps';
import styles from './ToastContainer.module.css';
import type { VNode } from '../../../external/vendors';

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
function ToastContainerCore({
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
  const manager = UnifiedToastManager.getInstance();
  const [currentToasts, setCurrentToasts] = useState(manager.getToasts());

  // 표준화된 클래스명 생성
  const containerClass = ComponentStandards.createClassName(
    styles.container,
    styles[position] || styles['top-right'], // position에 따른 스타일
    className
  );

  // 표준화된 ARIA 속성 생성
  const ariaPropsData: Partial<BaseComponentProps> = {
    'aria-label': ariaLabel || 'Toast 알림 컨테이너',
    role: role || 'region',
  };

  if (ariaDescribedBy) {
    ariaPropsData['aria-describedby'] = ariaDescribedBy;
  }

  if (typeof tabIndex === 'number') {
    ariaPropsData.tabIndex = tabIndex;
  }

  const ariaProps = ComponentStandards.createAriaProps(ariaPropsData);

  // 표준화된 테스트 속성 생성
  const testProps = ComponentStandards.createTestProps(testId || 'toast-container');

  useEffect(() => {
    // 토스트 상태 변경 구독 (UnifiedToastManager)
    const unsubscribe = manager.subscribe(setCurrentToasts);
    return unsubscribe;
  }, [manager]);

  // maxToasts 제한 적용
  const limitedToasts = currentToasts.slice(0, maxToasts);

  return h(
    'div',
    {
      className: containerClass,
      'data-position': position,
      'data-max-toasts': maxToasts,
      'aria-live': 'polite',
      'aria-atomic': 'false',
      ...ariaProps,
      ...testProps,
      onFocus,
      onBlur,
      onKeyDown,
    } as Record<string, unknown>,
    limitedToasts.map(toast =>
      h(Toast, {
        key: toast.id,
        toast,
        onRemove: id => manager.remove(id),
      })
    )
  );
}

// ToastContainer props 비교 함수
const areToastContainerPropsEqual = (
  prevProps: ToastContainerProps,
  nextProps: ToastContainerProps
): boolean => {
  // 구조적 변경이 적은 props들 우선 체크
  if (prevProps.position !== nextProps.position) return false;
  if (prevProps.maxToasts !== nextProps.maxToasts) return false;
  if (prevProps.className !== nextProps.className) return false;

  // 이벤트 핸들러들 (참조 비교)
  if (prevProps.onFocus !== nextProps.onFocus) return false;
  if (prevProps.onBlur !== nextProps.onBlur) return false;
  if (prevProps.onKeyDown !== nextProps.onKeyDown) return false;

  // 기타 props
  if (prevProps['data-testid'] !== nextProps['data-testid']) return false;
  if (prevProps['aria-label'] !== nextProps['aria-label']) return false;
  if (prevProps['aria-describedby'] !== nextProps['aria-describedby']) return false;
  if (prevProps.role !== nextProps.role) return false;
  if (prevProps.tabIndex !== nextProps.tabIndex) return false;

  return true;
};

// memo로 최적화된 ToastContainer
const { memo } = getPreactCompat();
const MemoizedToastContainer = memo(ToastContainerCore, areToastContainerPropsEqual);

// displayName 설정
Object.defineProperty(MemoizedToastContainer, 'displayName', {
  value: 'ToastContainer',
  writable: false,
  configurable: true,
});

// 메모이제이션된 컴포넌트를 export
export const ToastContainer = MemoizedToastContainer;
