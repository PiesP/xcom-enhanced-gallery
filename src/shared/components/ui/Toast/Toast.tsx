import styles from './Toast.module.css';
import { getPreactHooks, getPreactSignals } from '@shared/external/vendors';
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

// 레거시 Props 인터페이스 (하위 호환성)
interface LegacyToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

// 통합된 Toast Props
export interface ToastProps extends Partial<StandardToastProps>, Partial<LegacyToastProps> {
  // 필수 props
  toast?: ToastItem;
  onRemove?: (id: string) => void;
}

export function Toast({
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

// Global toast state - lazy initialization
let _toasts: ReturnType<typeof import('@preact/signals').signal<ToastItem[]>> | null = null;
export const toasts = {
  get value(): ToastItem[] {
    if (!_toasts) {
      const { signal } = getPreactSignals();
      _toasts = signal<ToastItem[]>([]);
    }
    return _toasts.value || [];
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
    return _toasts.subscribe?.(value => callback(value || [])) || (() => {});
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
