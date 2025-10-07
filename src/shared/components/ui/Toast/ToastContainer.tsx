/**
 * @fileoverview ToastContainer Solid Component
 * @description Container for Toast notifications with position management
 */

import { mergeProps, splitProps, createMemo, For, type Component, type JSX } from 'solid-js';
import { Toast, type ToastItem } from './Toast';
import { UnifiedToastManager } from '@/shared/services/UnifiedToastManager';
import styles from './ToastContainer.module.css';

export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxToasts?: number;
  className?: string;
  role?: 'region' | 'alert' | 'status';
  'aria-label'?: string;
  'data-testid'?: string;
  onFocus?: JSX.EventHandlerUnion<HTMLDivElement, FocusEvent>;
  onBlur?: JSX.EventHandlerUnion<HTMLDivElement, FocusEvent>;
  onKeyDown?: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent>;
}

/**
 * ToastContainer component - manages multiple toast notifications
 */
export const ToastContainer: Component<ToastContainerProps> = props => {
  const merged = mergeProps(
    {
      position: 'top-right' as const,
      maxToasts: 5,
      role: 'region',
      'aria-label': 'Notifications',
    },
    props
  );

  const [local, handlers, ariaProps, rest] = splitProps(
    merged,
    ['position', 'maxToasts', 'className', 'role'],
    ['onFocus', 'onBlur', 'onKeyDown'],
    ['aria-label', 'data-testid']
  );

  const manager = UnifiedToastManager.getInstance();

  // Get limited toasts with reactive slicing
  const limitedToasts = createMemo(() => {
    const toasts = manager.signal.value || [];
    return toasts.slice(0, local.maxToasts);
  });

  const containerClass = () => {
    const classes = [styles.container, styles[`container--${local.position}`]];
    if (local.className) {
      classes.push(local.className);
    }
    return classes.filter(Boolean).join(' ');
  };

  const handleRemove = (id: string) => {
    manager.remove(id);
  };

  return (
    <div
      class={containerClass()}
      role={local.role as 'region'}
      aria-live='polite'
      {...ariaProps}
      {...handlers}
      {...rest}
    >
      <For each={limitedToasts()}>
        {(toast: ToastItem) => <Toast toast={toast} onRemove={handleRemove} />}
      </For>
    </div>
  );
};
