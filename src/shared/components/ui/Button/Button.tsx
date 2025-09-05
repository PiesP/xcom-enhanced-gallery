/**
 * Button Component for X.com Gallery
 * @version 4.0.0 - Phase 2 표준화된 Button Component
 */

import { getPreactCompat } from '@shared/external/vendors';
import type { ComponentChildren } from '@shared/external/vendors';
import styles from './Button.module.css';
import { ComponentStandards } from '../StandardProps';

// 통합된 Button Props - 독립적으로 정의
export interface ButtonProps {
  // 기본 HTML 버튼 속성들
  children?: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  autoFocus?: boolean;
  form?: string;
  className?: string;

  // 이벤트 핸들러들
  onClick?: (event?: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;

  // 커스텀 속성들
  variant?: 'primary' | 'secondary' | 'outline' | 'icon' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  iconVariant?: 'primary' | 'success' | 'danger';
  loading?: boolean;

  // 테스트 속성
  testId?: string;
  'data-testid'?: string;

  // ARIA 접근성 속성들
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-pressed'?: boolean | 'true' | 'false' | 'mixed';
  'aria-expanded'?: boolean | 'true' | 'false';
  'aria-haspopup'?: boolean | 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-busy'?: boolean;
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
        iconVariant,
        'data-testid': testId,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,
        'aria-pressed': ariaPressed,
        'aria-expanded': ariaExpanded,
        'aria-haspopup': ariaHaspopup,
        'aria-busy': ariaBusy,
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
        variant === 'icon' && iconVariant ? styles[iconVariant] : undefined,
        loading ? styles.loading : undefined,
        disabled ? styles.disabled : undefined,
        className
      );

      // 로딩 상태 처리 (ARIA 속성 생성 전에 계산)
      const isDisabled = ComponentStandards.handleLoadingState(loading, disabled);

      // 표준화된 테스트 속성 생성
      const testProps = ComponentStandards.createTestProps(testId);

      // icon variant는 명시적으로 role="button"을 부여 (테스트 및 접근성 명확화)
      const resolvedRole = role || (variant === 'icon' ? 'button' : undefined);

      return (
        <button
          ref={ref}
          type={type}
          form={form}
          autoFocus={autoFocus}
          className={buttonClass}
          disabled={isDisabled}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-pressed={
            ariaPressed === true || ariaPressed === 'true'
              ? 'true'
              : ariaPressed === false || ariaPressed === 'false'
                ? 'false'
                : ariaPressed === 'mixed'
                  ? 'mixed'
                  : undefined
          }
          aria-expanded={
            ariaExpanded === true || ariaExpanded === 'true'
              ? 'true'
              : ariaExpanded === false || ariaExpanded === 'false'
                ? 'false'
                : undefined
          }
          aria-haspopup={
            ariaHaspopup === true ? true : ariaHaspopup === false ? false : ariaHaspopup
          }
          aria-busy={ariaBusy ? 'true' : loading ? 'true' : undefined}
          aria-disabled={isDisabled ? 'true' : undefined}
          // TS Signalish role compatibility (string acceptable)
          role={resolvedRole as unknown as never}
          tabIndex={tabIndex}
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
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
