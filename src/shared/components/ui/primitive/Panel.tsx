/**
 * @fileoverview Panel Primitive Solid Component
 * @description 기본 패널/표면 컴포넌트 - Solid.js 기반
 */

import { mergeProps, splitProps, type Component, type JSX } from 'solid-js';
import './Panel.css';

export interface PanelProps {
  readonly children: JSX.Element;
  readonly className?: string;
  readonly variant?: 'default' | 'elevated' | 'glass';
  readonly padding?: boolean;
}

export const Panel: Component<PanelProps> = props => {
  // Solid.js의 mergeProps로 기본값 설정
  const merged = mergeProps(
    {
      className: '',
      variant: 'default' as const,
      padding: true,
    },
    props
  );

  // splitProps로 컴포넌트 props와 나머지 분리
  const [local, rest] = splitProps(merged, ['children', 'className', 'variant', 'padding']);

  // 클래스 조합 (Solid.js reactive)
  const classes = () => {
    const paddingClass = local.padding ? 'xeg-panel--padded' : '';
    return `xeg-panel xeg-panel--${local.variant} ${paddingClass} ${local.className}`.trim();
  };

  return (
    <div class={classes()} {...rest}>
      {local.children}
    </div>
  );
};
