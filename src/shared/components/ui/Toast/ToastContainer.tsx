import type { JSXElement } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import type { BaseComponentProps } from '@shared/types/app.types';

// ============================================================================
// Types
// ============================================================================

type ContainerBaseProps = Pick<
  BaseComponentProps,
  | 'className'
  | 'data-testid'
  | 'aria-label'
  | 'aria-describedby'
  | 'tabIndex'
  | 'onFocus'
  | 'onBlur'
  | 'onKeyDown'
>;

type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ToastContainerProps extends ContainerBaseProps {
  position?: ToastPosition;
  maxToasts?: number;
  role?: 'region' | 'status' | 'alert' | 'log';
}

/**
 * @deprecated Phase 420: Toast UI removed. Notifications are handled via Tampermonkey.
 * The container renders nothing.
 */
export function ToastContainer(_: ToastContainerProps = {}): JSXElement | null {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('[ToastContainer] Deprecated component rendered; returning null.');
  }
  return null;
}
