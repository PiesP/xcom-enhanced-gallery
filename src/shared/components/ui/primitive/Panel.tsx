/**
 * @fileoverview Panel Primitive Component
 * @description 기본 패널/표면 컴포넌트
 */

import type { ComponentChildren } from '../../../external/vendors';
import './Panel.css';

export interface PanelProps {
  readonly children: ComponentChildren;
  readonly className?: string;
  readonly variant?: 'default' | 'elevated' | 'glass';
  readonly padding?: boolean;
}

export function Panel({
  children,
  className = '',
  variant = 'default',
  padding = true,
  ...props
}: PanelProps) {
  const paddingClass = padding ? 'xeg-panel--padded' : '';

  return (
    <div className={`xeg-panel xeg-panel--${variant} ${paddingClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
