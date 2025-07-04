/**
 * Button Component for X.com Gallery
 *
 * Reusable button component used throughout X.com Gallery.
 * Improved version with unified design system in mind.
 *
 * @fileoverview
 * This file defines the universal Button component used across the gallery UI.
 *
 * @module Button
 * @since 1.0.0
 * @updated 2.0.0 - Enhanced type safety and accessibility
 */

import type { ComponentChildren } from '../../../types/global.types';
import { getPreact } from '../../../../infrastructure/external/vendors';
import { type ButtonVariant, type ButtonSize } from '@shared/types/ui.types';
import styles from './Button.module.css';

const { h } = getPreact();

/**
 * Button component Props interface
 */
export interface ButtonProps {
  /** Button content (text, icons, etc.) */
  children: ComponentChildren;
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** 버튼 비활성화 여부 */
  disabled?: boolean;
  /** 로딩 상태 여부 */
  loading?: boolean;
  /** 클릭 이벤트 핸들러 */
  onClick?: ((event: MouseEvent) => void) | undefined;
  /** 버튼 타입 */
  type?: 'button' | 'submit' | 'reset' | undefined;
  /** 추가 CSS 클래스 */
  className?: string | undefined;
  /** 접근성 레이블 */
  'aria-label'?: string | undefined;
  /** 텍스트 앞에 표시할 아이콘 */
  icon?: ComponentChildren | undefined;
  /** 아이콘만 표시 여부 (텍스트 숨김) */
  iconOnly?: boolean | undefined;
}

/**
 * Button 컴포넌트
 * 통합 디자인 시스템과 스타일 상태 관리자를 사용하는 현대적 버튼 컴포넌트
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
  icon,
  iconOnly = false,
  onClick,
  ...props
}: ButtonProps): ComponentChildren {
  /**
   * 버튼 클릭 이벤트 핸들러
   */
  const handleClick = (event: Event): void => {
    event.stopPropagation(); // 이벤트 전파 방지
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event as MouseEvent);
  };

  // CSS Modules를 사용한 클래스 생성
  const buttonClasses = [
    styles.primary, // 기본 버튼 스타일은 primary로 설정
    styles[variant], // variant에 따른 스타일
    size === 'sm' ? styles.small : size === 'lg' ? styles.large : styles.medium, // size에 따른 스타일
    iconOnly && styles.iconOnly,
    loading && styles.loading,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return h(
    'button',
    {
      type,
      className: buttonClasses,
      disabled: disabled || loading,
      onClick: handleClick,
      'aria-label': ariaLabel,
      'aria-busy': loading,
      ...props,
    },
    loading
      ? h('span', {
          className: 'xeg-button__spinner',
          'aria-hidden': 'true',
          role: 'status',
        })
      : [
          icon && h('span', { className: 'xeg-button__icon' }, icon),
          !iconOnly && h('span', { className: 'xeg-button__text' }, children),
        ].filter(Boolean)
  );
}

export default Button;
