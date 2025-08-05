import styles from './Toast.module.css';
import { getPreactHooks, getPreactCompat } from '@shared/external/vendors';
import type { VNode } from '@shared/external/vendors';
import { ComponentStandards } from '../standard-props';
import type { StandardToastProps } from '../standard-props';
import type { ToastItem } from '@shared/services/ToastService';

// Constants - 사용하지 않는 상수 제거
// const DEFAULT_TOAST_DURATION = 5000; // ToastService에서 관리

// ToastItem 인터페이스는 ToastService에서 import

// 통합된 Toast Props - Legacy Props 제거됨
export interface ToastProps extends Partial<StandardToastProps> {
  // 필수 props
  toast?: ToastItem;
  onRemove?: (id: string) => void;
}

function ToastComponent({
  toast,
  onRemove,
  className,
  'data-testid': testId,
  'aria-label': ariaLabel,
  role = 'alert',
}: ToastProps): VNode {
  const { useEffect } = getPreactHooks();

  // 안전성 체크
  if (!toast || !onRemove) {
    throw new Error('Toast component requires both toast and onRemove props');
  }

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);

      return (): void => clearTimeout(timer);
    }

    // duration이 없거나 0일 때도 cleanup 함수 반환
    return (): void => {
      // 정리할 것이 없지만 일관성을 위해 빈 함수 반환
    };
  }, [toast.id, toast.duration, onRemove]);

  const handleClose = (event: Event): void => {
    event.stopPropagation();
    onRemove(toast.id);
  };

  const handleAction = (event: Event): void => {
    event.stopPropagation();
    if (toast.onAction) {
      toast.onAction();
    }
    onRemove(toast.id);
  };

  // 표준화된 클래스명 생성
  const toastClass = ComponentStandards.createClassName(
    styles.toast,
    styles[toast.type],
    className
  );

  // 표준화된 테스트 속성 생성
  const testProps = ComponentStandards.createTestProps(testId);

  return (
    <div
      className={toastClass}
      role={role as 'alert' | 'status' | 'log'}
      aria-label={ariaLabel || `${toast.type} 알림: ${toast.title}`}
      {...testProps}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <h4 className={styles.title}>{toast.title}</h4>
          <button className={styles.closeButton} onClick={handleClose} aria-label='알림 닫기'>
            ×
          </button>
        </div>
        <p className={styles.message}>{toast.message}</p>
        {toast.actionText && toast.onAction && (
          <div className={styles.actions}>
            <button className={styles.actionButton} onClick={handleAction}>
              {toast.actionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Toast props 비교 함수 - 효율적인 메모이제이션을 위함
const areToastPropsEqual = (prevProps: ToastProps, nextProps: ToastProps): boolean => {
  // toast 객체가 변경되었는지 확인
  if (prevProps.toast?.id !== nextProps.toast?.id) return false;
  if (prevProps.toast?.type !== nextProps.toast?.type) return false;
  if (prevProps.toast?.title !== nextProps.toast?.title) return false;
  if (prevProps.toast?.message !== nextProps.toast?.message) return false;
  if (prevProps.toast?.duration !== nextProps.toast?.duration) return false;
  if (prevProps.toast?.actionText !== nextProps.toast?.actionText) return false;

  // onRemove 함수 비교 (참조 비교)
  if (prevProps.onRemove !== nextProps.onRemove) return false;

  // 기타 props 비교
  if (prevProps.className !== nextProps.className) return false;
  if (prevProps['data-testid'] !== nextProps['data-testid']) return false;
  if (prevProps['aria-label'] !== nextProps['aria-label']) return false;
  if (prevProps.role !== nextProps.role) return false;

  return true;
};

// memo를 적용한 최적화된 Toast 컴포넌트
const { memo } = getPreactCompat();
const MemoizedToast = memo(ToastComponent, areToastPropsEqual);

// displayName 설정
Object.defineProperty(MemoizedToast, 'displayName', {
  value: 'Toast',
  writable: false,
  configurable: true,
});

// 메모이제이션된 컴포넌트를 Toast로 export
export const Toast = MemoizedToast;

// Global toast state - 통합 레이어 사용
export { toasts, addToast, removeToast, clearAllToasts } from '@shared/services/toast-integration';
