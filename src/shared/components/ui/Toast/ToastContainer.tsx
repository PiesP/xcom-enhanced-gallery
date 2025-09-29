/**
 * @fileoverview Toast Container Component (SolidJS)
 * @version 4.0.0 - Stage D shared UI migration
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { ComponentStandards } from '../StandardProps';
import type { StandardToastContainerProps } from '../StandardProps';
import type { BaseComponentProps } from '../../base/BaseComponentProps';
import styles from './ToastContainer.module.css';
import { removeToast, toastManager, type ToastItem } from '@shared/services/UnifiedToastManager';
import { SolidToast } from './SolidToast.solid';

export interface ToastContainerProps extends Partial<StandardToastContainerProps> {
  className?: string;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

export const ToastContainer = (props: ToastContainerProps = {}): JSX.Element => {
  const { createMemo } = getSolidCore();

  const toastSignalAccessor = toastManager.signal.accessor;

  const position = createMemo(() => props.position ?? 'top-right');
  const maxToasts = createMemo(() => (typeof props.maxToasts === 'number' ? props.maxToasts : 5));

  const containerClass = createMemo(() =>
    ComponentStandards.createClassName(
      styles.container,
      styles[position()] ?? styles['top-right'],
      props.className ?? ''
    )
  );

  const ariaProps = createMemo(() => {
    const ariaData: Partial<BaseComponentProps> = {
      'aria-label': props['aria-label'] ?? 'Toast 알림 컨테이너',
      role: props.role ?? 'region',
    };

    if (props['aria-describedby']) {
      ariaData['aria-describedby'] = props['aria-describedby'];
    }

    if (typeof props.tabIndex === 'number') {
      ariaData.tabIndex = props.tabIndex;
    }

    return ComponentStandards.createAriaProps(ariaData);
  });

  const testProps = createMemo(() =>
    ComponentStandards.createTestProps(props['data-testid'] ?? 'toast-container')
  );

  const limitedToasts = createMemo<ToastItem[]>(() =>
    toastSignalAccessor().slice(0, Math.max(0, maxToasts()))
  );

  return (
    <div
      class={containerClass()}
      data-position={position()}
      data-max-toasts={maxToasts()}
      aria-live='polite'
      aria-atomic='false'
      onFocus={props.onFocus as JSX.EventHandlerUnion<HTMLDivElement, FocusEvent>}
      onBlur={props.onBlur as JSX.EventHandlerUnion<HTMLDivElement, FocusEvent>}
      onKeyDown={props.onKeyDown as JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent>}
      {...ariaProps()}
      {...testProps()}
    >
      {limitedToasts().map(toast => (
        <SolidToast toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
