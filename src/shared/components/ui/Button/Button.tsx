/**
 * Button Component for X.com Enhanced Gallery
 *
 * Reusable button component used throughout X.com Enhanced Gallery.
 * Improved version with unified design system in mind.
 *
 * @fileoverview
 * This file defines the universal Button component used across the gallery UI.
 *
 * @module Button
 * @since 1.0.0
 * @updated 2.0.0 - Enhanced type safety and accessibility
 */

import type { ComponentChildren } from '@shared/types/global.types';
import { getPreact, getPreactHooks } from '@infrastructure/external/vendors';
import {
  DesignSystem,
  type ButtonVariant,
  type ButtonSize,
} from '@shared/design-system/DesignSystem';
import { StyleStateManager } from '@shared/styling/StyleStateManager';

const { h } = getPreact();
const { useRef, useEffect } = getPreactHooks();
const styleStateManager = StyleStateManager.getInstance();

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
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 상태 변경 시 CSS 클래스 업데이트
  useEffect(() => {
    if (buttonRef.current) {
      styleStateManager.updateComponentState(buttonRef.current, 'button', {
        loading,
        disabled,
        active: false, // 필요시 추가 상태
      });
    }
  }, [loading, disabled]);

  /**
   * 버튼 클릭 이벤트 핸들러
   */
  const handleClick = (event: Event): void => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event as MouseEvent);
  };

  // 디자인 시스템을 사용한 클래스 생성
  const buttonClasses = DesignSystem.createClassName(
    DesignSystem.components.button.base,
    {
      variant,
      size,
      iconOnly,
    },
    className ? [className] : []
  );

  return h(
    'button',
    {
      ref: buttonRef,
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
