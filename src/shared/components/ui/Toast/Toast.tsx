import type { JSX } from 'solid-js';
import { createComponent } from 'solid-js/web';

import { addToast, removeToast, clearAllToasts } from '@shared/services/UnifiedToastManager';
import { SolidToast } from './SolidToast.solid';
import type { SolidToastProps } from './SolidToast.solid';

export type { ToastItem } from '@shared/services/UnifiedToastManager';

export interface ToastProps extends Omit<SolidToastProps, 'onClose'> {
  readonly onRemove: (id: string) => void;
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
  readonly role?: JSX.AriaRole;
}

export const Toast = (props: ToastProps): JSX.Element => {
  if (!props.toast) {
    throw new Error('Toast component requires a toast prop');
  }

  return createComponent(SolidToast, {
    toast: props.toast,
    onClose: props.onRemove,
  });
};

export { addToast, removeToast, clearAllToasts };

export default Toast;
