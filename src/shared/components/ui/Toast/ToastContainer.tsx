/**
 * @fileoverview Toast Container Component (Solid.js)
 */

import { getSolid, type JSXElement } from '@shared/external/vendors';
import { useSelector } from '@shared/utils/signal-selector';
import { toastManager } from '@/shared/services/unified-toast-manager';
import { ComponentStandards } from '../StandardProps';
import type { StandardToastContainerProps } from '../StandardProps';
import type { BaseComponentProps } from '../../base/BaseComponentProps';
import { Toast } from './Toast';
import styles from './ToastContainer.module.css';

export interface ToastContainerProps extends Partial<StandardToastContainerProps> {
  className?: string;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

const solid = getSolid();
const { mergeProps, splitProps, For } = solid;

const defaults: Required<Pick<ToastContainerProps, 'position' | 'maxToasts'>> = {
  position: 'top-right',
  maxToasts: 5,
};

export function ToastContainer(rawProps: ToastContainerProps = {}): JSXElement {
  const props = mergeProps(defaults, rawProps);
  const [local, rest] = splitProps(props, [
    'className',
    'position',
    'maxToasts',
    'data-testid',
    'aria-label',
    'aria-describedby',
    'role',
    'tabIndex',
    'onFocus',
    'onBlur',
    'onKeyDown',
  ]);

  // Phase A5.3 Step 3: signalSelector 최적화로 파생값 메모이제이션
  // createMemo 대신 useSelector 적용 (의존성 기반 캐싱)
  const limitedToasts = useSelector(toastManager.signal, state => state.slice(0, local.maxToasts), {
    dependencies: state => [state.length, local.maxToasts],
    name: 'limitedToasts',
  });

  const containerClass = () =>
    ComponentStandards.createClassName(
      styles.container,
      styles[local.position] || styles['top-right'],
      local.className
    );

  const ariaData: Partial<BaseComponentProps> = {
    'aria-label': local['aria-label'] ?? 'Toast 알림 컨테이너',
    role: local.role ?? 'region',
  };

  if (local['aria-describedby']) {
    ariaData['aria-describedby'] = local['aria-describedby'];
  }

  if (typeof local.tabIndex === 'number') {
    ariaData.tabIndex = local.tabIndex;
  }

  const ariaProps = ComponentStandards.createAriaProps(ariaData);
  const testProps = ComponentStandards.createTestProps(local['data-testid'] ?? 'toast-container');

  return (
    <div
      {...rest}
      class={containerClass()}
      data-position={local.position}
      data-max-toasts={local.maxToasts}
      aria-live='polite'
      aria-atomic='false'
      {...ariaProps}
      {...testProps}
      onFocus={local.onFocus}
      onBlur={local.onBlur}
      onKeyDown={local.onKeyDown}
    >
      <For each={limitedToasts()}>
        {toast => <Toast toast={toast} onRemove={id => toastManager.remove(id)} />}
      </For>
    </div>
  );
}
