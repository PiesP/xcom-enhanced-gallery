/**
 * @fileoverview Button Primitive Component
 * @description 기본 버튼 컴포넌트 - 디자인 토큰 사용
 */

import type { ComponentChildren } from '@shared/external/vendors';
import './Button.css';

export interface ButtonProps {
  readonly children: ComponentChildren;
  readonly className?: string;
  readonly variant?: 'primary' | 'secondary' | 'outline';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly onClick?: (event: MouseEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;

  // Accessibility
  readonly 'aria-label'?: string;
  readonly 'data-action'?: string;

  // T1 확장: Intent, Selected, Loading 상태
  readonly intent?: 'primary' | 'success' | 'danger' | 'neutral';
  readonly selected?: boolean;
  readonly loading?: boolean;
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  onKeyDown,

  // T1 확장 props
  intent,
  selected,
  loading = false,
  ...props
}: ButtonProps) {
  const handleKeyDown = (event: KeyboardEvent) => {
    // 키보드 접근성: Enter, Space 키 지원
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled && !loading && onClick) {
        onClick(event as unknown as MouseEvent);
      }
    }
    onKeyDown?.(event);
  };

  const handleClick = (event: MouseEvent) => {
    if (!disabled && !loading) {
      onClick?.(event);
    }
  };

  // 클래스 조합
  const classes = [
    'xeg-button',
    `xeg-button--${variant}`,
    `xeg-button--${size}`,
    intent && `xeg-button--${intent}`,
    selected && 'xeg-button--selected',
    loading && 'xeg-button--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // 접근성 속성
  const accessibilityProps: Record<string, unknown> = {
    role: 'button',
    tabIndex: disabled || loading ? -1 : 0,
  };

  // selected 상태 aria 속성
  if (selected !== undefined) {
    accessibilityProps['aria-pressed'] = String(selected);
  }

  // loading 상태 aria 속성
  if (loading) {
    accessibilityProps['aria-busy'] = 'true';
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </button>
  );
}
