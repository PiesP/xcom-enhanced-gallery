import { getPreactSignals, getPreactHooks } from '@shared/utils/external';
import styles from '@shared/components/ui/Toast/Toast.module.css';

const { signal } = getPreactSignals();
const { useEffect } = getPreactHooks();

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

interface ToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

export function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }

    // duration이 없거나 0일 때도 cleanup 함수 반환
    return () => {
      // 정리할 것이 없지만 일관성을 위해 빈 함수 반환
    };
  }, [toast.id, toast.duration, onRemove]);

  const handleClose = () => {
    onRemove(toast.id);
  };

  const handleAction = () => {
    if (toast.onAction) {
      toast.onAction();
    }
    onRemove(toast.id);
  };

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role='alert'>
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

// Global toast state
export const toasts = signal<ToastItem[]>([]);

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
