/**
 * @fileoverview Button Primitive Component
 * @description 기본 버튼 컴포넌트 - 디자인 토큰 사용
 */

import type { ComponentChildren } from 'preact';
import './Button.css';

export interface ButtonProps {
  readonly children: ComponentChildren;
  readonly className?: string;
  readonly variant?: 'primary' | 'secondary';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly onClick?: (event: MouseEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
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
  ...props
}: ButtonProps) {
  const handleKeyDown = (event: KeyboardEvent) => {
    // 키보드 접근성: Enter, Space 키 지원
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled && onClick) {
        onClick(event as unknown as MouseEvent);
      }
    }
    onKeyDown?.(event);
  };

  const handleClick = (event: MouseEvent) => {
    if (!disabled) {
      onClick?.(event);
    }
  };

  return (
    <button
      type={type}
      className={`xeg-button xeg-button--${variant} xeg-button--${size} ${className}`}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {children}
    </button>
  );
}
