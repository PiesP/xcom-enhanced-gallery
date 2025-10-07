/**
 * @fileoverview Toast Solid Component
 * @description Solid.js implementation of Toast notification
 */

import { mergeProps, splitProps, onCleanup, type Component } from 'solid-js';
import { globalTimerManager } from '@/shared/utils/timer-management';
import styles from './Toast.module.css';

export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

export interface ToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
  className?: string;
  role?: 'alert' | 'status';
  'aria-label'?: string;
  'data-testid'?: string;
}

/**
 * Toast component - displays a notification message
 */
export const Toast: Component<ToastProps> = props => {
  const merged = mergeProps({ role: 'alert' as const }, props);
  const [local, ariaProps, rest] = splitProps(
    merged,
    ['toast', 'onRemove', 'className', 'role'],
    ['aria-label', 'data-testid']
  );

  // Auto-dismiss timer with cleanup
  if (local.toast?.duration && local.toast.duration > 0) {
    const timer = globalTimerManager.setTimeout(() => {
      local.onRemove?.(local.toast?.id ?? '');
    }, local.toast.duration);

    onCleanup(() => {
      globalTimerManager.clearTimeout(timer);
    });
  }

  const handleClose = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    local.onRemove?.(local.toast?.id ?? '');
  };

  const handleAction = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    if (local.toast?.onAction) {
      local.toast.onAction();
    }
    local.onRemove?.(local.toast?.id ?? '');
  };

  const toastClass = () => {
    const classes = [styles.toast, styles[`toast--${local.toast.type}`]];
    if (local.className) {
      classes.push(local.className);
    }
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div class={toastClass()} role={local.role} {...ariaProps} {...rest}>
      <div class={styles['toast__content']}>
        <div class={styles['toast__header']}>
          <span class={styles['toast__title']}>{local.toast.title}</span>
          <button
            type='button'
            class={styles['toast__close']}
            onClick={handleClose}
            aria-label='Close notification'
          >
            ×
          </button>
        </div>
        <div class={styles['toast__message']}>{local.toast.message}</div>
        {local.toast.actionText && (
          <div class={styles['toast__actions']}>
            <button
              type='button'
              class={styles['toast__action']}
              onClick={handleAction}
              aria-label={local.toast.actionText}
            >
              {local.toast.actionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
