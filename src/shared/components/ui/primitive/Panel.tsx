/**
 * @fileoverview Panel Primitive Component
 * @description 기본 패널/표면 컴포넌트
 */

import type { JSX } from 'solid-js';
import { getSolid } from '@shared/external/vendors';
import './Panel.css';

const { createMemo, splitProps } = getSolid();

export interface PanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'class'> {
  readonly children?: JSX.Element;
  readonly className?: string;
  readonly class?: string;
  readonly variant?: 'default' | 'elevated' | 'glass';
  readonly padding?: boolean;
}

export function Panel(props: PanelProps): JSX.Element {
  const [local, others] = splitProps(props, [
    'children',
    'className',
    'class',
    'variant',
    'padding',
  ]);

  const resolvedClass = createMemo(() => {
    const variantClass = `xeg-panel--${local.variant ?? 'default'}`;
    const paddingClass = (local.padding ?? true) ? 'xeg-panel--padded' : '';
    return ['xeg-panel', variantClass, paddingClass, local.class, local.className]
      .filter(Boolean)
      .join(' ');
  });

  return (
    <div class={resolvedClass()} {...others}>
      {local.children}
    </div>
  );
}
