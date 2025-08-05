/**
 * Button Component for X.com Gallery
 * @version 4.0.0 - Phase 2 표준화된 Button Component
 */

import { getPreactCompat } from '@shared/external/vendors';
import styles from './Button.module.css';
import { ComponentStandards } from '../standard-props';
import type { StandardButtonProps } from '../standard-props';
import type { BaseComponentProps } from '../../base/BaseComponentProps';

// 통합된 Button Props
export interface ButtonProps extends StandardButtonProps {
  // onClick 이벤트 핸들러 (구체적 타입)
  onClick?: (event?: Event) => void;
}

export const Button = (() => {
  const { forwardRef, memo } = getPreactCompat();

  const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
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
      } as Partial<BaseComponentProps>);

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

  // Props 비교 함수 - shallow comparison에 최적화
  const areEqual = (prevProps: ButtonProps, nextProps: ButtonProps): boolean => {
    // 자주 변경되는 props들을 우선적으로 체크
    if (prevProps.loading !== nextProps.loading) return false;
    if (prevProps.disabled !== nextProps.disabled) return false;
    if (prevProps.variant !== nextProps.variant) return false;
    if (prevProps.children !== nextProps.children) return false;
    if (prevProps.onClick !== nextProps.onClick) return false;

    // 나머지 props는 shallow comparison
    const keys = Object.keys(nextProps) as (keyof ButtonProps)[];
    for (const key of keys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }

    return true;
  };

  // memo로 컴포넌트를 감싸서 최적화
  const MemoizedButton = memo(ButtonComponent, areEqual);

  // displayName 설정으로 디버깅 용이성 제공
  MemoizedButton.displayName = 'memo(Button)';

  return MemoizedButton;
})();

export default Button;
