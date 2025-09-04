/**
 * @fileoverview IconButton Primitive Component
 * @description 아이콘 전용 버튼 - 접근성 필수 aria-label
 */

import type { ComponentChildren } from 'preact';
import './IconButton.css';

export interface IconButtonProps {
  readonly children: ComponentChildren;
  readonly 'aria-label': string; // 필수 접근성 속성
  readonly className?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly onClick?: (event: MouseEvent) => void;
}

export function IconButton({
  children,
  'aria-label': ariaLabel,
  className = '',
  size = 'md',
  disabled = false,
  onClick,
  ...props
}: IconButtonProps) {
  const handleClick = (event: MouseEvent) => {
    if (!disabled) {
      onClick?.(event);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled && onClick) {
        onClick(event as unknown as MouseEvent);
      }
    }
  };

  return (
    <button
      type='button'
      className={`xeg-icon-button xeg-icon-button--${size} ${className}`}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      role='button'
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {children}
    </button>
  );
}
