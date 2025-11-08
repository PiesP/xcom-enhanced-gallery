import type { JSXElement } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import type { BaseComponentProps } from '@shared/types/app.types';
import type { ToastItem as ServiceToastItem } from '@/shared/services/unified-toast-manager';

export type ToastItem = ServiceToastItem;

type DeprecatedToastProps = Pick<BaseComponentProps, 'className' | 'data-testid' | 'aria-label'>;

export interface ToastProps extends DeprecatedToastProps {
  toast: ToastItem;
  onRemove?: (id: string) => void;
  role?: 'alert' | 'status' | 'log';
}

/**
 * @deprecated Phase 420: Toast UI removed. Notifications are now handled by Tampermonkey.
 * The component renders nothing and only triggers an optional onRemove callback immediately.
 */
export function Toast({ toast, onRemove }: ToastProps): JSXElement | null {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('[Toast] Deprecated component rendered; returning null.');
  }

  if (typeof onRemove === 'function') {
    onRemove(toast.id);
  }

  return null;
}
