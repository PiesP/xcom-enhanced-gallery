/**
 * @fileoverview SolidJS toast host that mirrors UnifiedToastManager state
 * @description FRAME-ALT-001 Stage C bridge: renders toast notifications using Solid components
 */

import containerStyles from '@shared/components/ui/Toast/ToastContainer.module.css';
import { SolidToast } from '@shared/components/ui/Toast/SolidToast.solid';
import { logger } from '@shared/logging';
import { getSolidCore } from '@shared/external/vendors';
import {
  toastManager,
  type ToastItem as ManagedToastItem,
} from '@shared/services/UnifiedToastManager';

export type SolidToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface SolidToastHostProps {
  readonly position?: SolidToastPosition;
  readonly maxToasts?: number;
  readonly testId?: string;
}

const POSITION_CLASS_MAP: Record<SolidToastPosition, string> = {
  'top-right': containerStyles.topRight || '',
  'top-left': containerStyles.topLeft || '',
  'bottom-right': containerStyles.bottomRight || '',
  'bottom-left': containerStyles.bottomLeft || '',
};

export const SolidToastHost = (props: SolidToastHostProps) => {
  const solid = getSolidCore();
  const { createSignal, createMemo, onCleanup, For } = solid;

  const position = props.position ?? 'top-right';
  const maxToasts = (() => {
    const value = props.maxToasts;
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 5;
    }
    return Math.max(1, Math.trunc(value));
  })();

  const limitToasts = (list: readonly ManagedToastItem[]): ManagedToastItem[] => {
    if (list.length <= maxToasts) {
      return list.slice();
    }
    return list.slice(-maxToasts);
  };

  const [managedToasts, setManagedToasts] = createSignal(limitToasts(toastManager.getToasts()));

  const unsubscribe = toastManager.subscribe(next => {
    setManagedToasts(limitToasts(next));
  });

  onCleanup(() => {
    try {
      unsubscribe?.();
    } catch (error) {
      logger.warn('[SolidToastHost] 구독 해제 실패:', error);
    }
  });

  const closeToast = (id: string) => {
    toastManager.remove(id);
  };

  const containerClass = createMemo(() =>
    [containerStyles.container, POSITION_CLASS_MAP[position] || containerStyles.topRight]
      .filter(Boolean)
      .join(' ')
  );

  return (
    <div
      data-xeg-solid-toast-host=''
      class={containerClass()}
      data-position={position}
      data-max-toasts={maxToasts}
      aria-live='polite'
      aria-atomic='false'
      data-testid={props.testId}
      role='region'
    >
      <For each={managedToasts()}>{toast => <SolidToast toast={toast} onClose={closeToast} />}</For>
    </div>
  );
};

export default SolidToastHost;
