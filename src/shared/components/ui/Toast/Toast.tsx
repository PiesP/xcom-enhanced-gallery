import styles from './Toast.module.css';
import { getPreactHooks, getPreactSignals, getPreactCompat } from '@shared/external/vendors';
import type { VNode } from '@shared/external/vendors';
import { ComponentStandards } from '../StandardProps';
import type { StandardToastProps } from '../StandardProps';

// Constants
const DEFAULT_TOAST_DURATION = 5000; // 5 seconds

export interface ToastItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

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

// Global toast state - lazy initialization
let _toasts: {
  value: ToastItem[];
  subscribe?: (callback: (value: ToastItem[]) => void) => () => void;
} | null = null;
export const toasts = {
  get value(): ToastItem[] {
    if (!_toasts) {
      const { signal } = getPreactSignals();
      _toasts = signal<ToastItem[]>([]);
    }
    return _toasts.value;
  },
  set value(newValue: ToastItem[]) {
    if (!_toasts) {
      const { signal } = getPreactSignals();
      _toasts = signal<ToastItem[]>([]);
    }
    _toasts.value = newValue;
  },
  subscribe(callback: (value: ToastItem[]) => void) {
    if (!_toasts) {
      const { signal } = getPreactSignals();
      _toasts = signal<ToastItem[]>([]);
    }
    return _toasts.subscribe?.((value: ToastItem[]) => callback(value || [])) || (() => {});
  },
};

let toastIdCounter = 0;

export function addToast(toast: Omit<ToastItem, 'id'>): string {
  const id = `toast_${++toastIdCounter}_${Date.now()}`;
  const newToast: ToastItem = {
    ...toast,
    id,
    duration: toast.duration ?? DEFAULT_TOAST_DURATION,
  };

  toasts.value = [...toasts.value, newToast];
  return id;
}

export function removeToast(id: string): void {
  toasts.value = toasts.value.filter(toast => toast.id !== id);
}

export function clearAllToasts(): void {
  toasts.value = [];
}
