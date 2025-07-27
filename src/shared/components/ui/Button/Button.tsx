/**
 * Button Component for X.com Gallery
 * @version 4.0.0 - Phase 2 표준화된 Button Component
 */

import { getPreactCompat } from '@shared/external/vendors';
import styles from './Button.module.css';
import { ComponentStandards } from '../StandardProps';
import type { StandardButtonProps, BaseUIComponentProps } from '../StandardProps';

// 통합된 Button Props (표준 우선, 레거시 fallback)
export interface ButtonProps extends Omit<StandardButtonProps, 'onClick'> {
  // onClick은 레거시 호환성을 위해 별도 정의
  onClick?: (event?: Event) => void;
  // 레거시 호환성을 위한 추가 속성들
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Button = (() => {
  const { forwardRef } = getPreactCompat();
  return forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        children,
        variant = 'primary',
        size = 'md',
        disabled,
        loading,
        onClick,
        className,
        type = 'button',
        autoFocus,
        form,
        'data-testid': testId,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,
        role,
        tabIndex,
        onFocus,
        onBlur,
        onKeyDown,
        ...props
      },
      ref
    ) => {
      // 표준화된 클래스명 생성
      const buttonClass = ComponentStandards.createClassName(
        styles.button,
        styles[variant],
        styles[size],
        loading ? styles.loading : undefined,
        disabled ? styles.disabled : undefined,
        className
      );

      // 표준화된 ARIA 속성 생성 (타입 안전성 보장)
      const ariaProps = ComponentStandards.createAriaProps({
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,
        role: role || 'button',
        tabIndex,
      } as Partial<BaseUIComponentProps>);

      // 표준화된 테스트 속성 생성
      const testProps = ComponentStandards.createTestProps(testId);

      // 로딩 상태 처리
      const isDisabled = ComponentStandards.handleLoadingState(loading, disabled);

      return (
        <button
          ref={ref}
          type={type}
          form={form}
          autoFocus={autoFocus}
          className={buttonClass}
          disabled={isDisabled}
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          {...ariaProps}
          {...testProps}
          {...props}
        >
          {loading && <span className={styles.spinner} aria-hidden='true' />}
          {children}
        </button>
      );
    }
  );
})();

export default Button;
