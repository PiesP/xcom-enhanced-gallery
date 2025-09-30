/**
 * @fileoverview SolidJS Toast component
 * @description FRAME-ALT-001 Stage D Phase 2 — shared Toast UI Solid port
 */

import toastStyles from './Toast.module.css';
import { getSolidCore } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import type { ToastItem } from '@shared/services/UnifiedToastManager';

export interface SolidToastProps {
  readonly toast: ToastItem;
  readonly onClose: (id: string) => void;
}

const ICON_FALLBACK = '🔔';

const TYPE_TO_ICON: Partial<Record<ToastItem['type'], string>> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

const resolveIcon = (type: ToastItem['type']): string => {
  return TYPE_TO_ICON[type] ?? ICON_FALLBACK;
};

export const SolidToast = (props: SolidToastProps) => {
  const solid = getSolidCore();
  const { createEffect, createMemo, onCleanup, Show } = solid;

  createEffect(() => {
    const { duration, id } = props.toast;
    if (!duration || duration <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      try {
        props.onClose(id);
      } catch (error) {
        logger.warn('[SolidToast] auto-close failed', error);
      }
    }, duration);

    onCleanup(() => {
      window.clearTimeout(timerId);
    });
  });

  const handleClose = () => {
    props.onClose(props.toast.id);
  };

  const handleAction = () => {
    try {
      props.toast.onAction?.();
    } catch (error) {
      logger.warn('[SolidToast] action handler failed', error);
    } finally {
      props.onClose(props.toast.id);
    }
  };

  const toastClass = createMemo(() =>
    [toastStyles.toast, toastStyles[props.toast.type] || ''].filter(Boolean).join(' ')
  );

  const icon = createMemo(() => resolveIcon(props.toast.type));

  const hasAction = createMemo(() => props.toast.actionText && props.toast.onAction);

  return (
    <div
      data-xeg-solid-toast=''
      data-toast-id={props.toast.id}
      class={toastClass()}
      role='alert'
      aria-label={`${props.toast.type} 알림: ${props.toast.title}`}
    >
      <div class={toastStyles.content}>
        <div class={toastStyles.header}>
          <span aria-hidden='true'>{icon()}</span>
          <h4 class={toastStyles.title}>{props.toast.title}</h4>
          <button
            type='button'
            class={toastStyles.closeButton}
            aria-label='알림 닫기'
            onClick={handleClose}
          >
            ×
          </button>
        </div>
        <p class={toastStyles.message}>{props.toast.message}</p>
        <Show when={hasAction()}>
          <div class={toastStyles.actions}>
            <button type='button' class={toastStyles.actionButton} onClick={handleAction}>
              {props.toast.actionText}
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default SolidToast;
