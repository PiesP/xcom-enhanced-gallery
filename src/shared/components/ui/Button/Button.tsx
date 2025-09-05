/**
 * @fileoverview Button - 통합 버튼 컴포넌트
 * @description 모든 버튼 요구사항을 만족하는 통합 컴포넌트
 *
 * @features
 * - 다중 variant 지원 (primary, secondary, icon, danger, ghost)
 * - 완전한 접근성 (ARIA 속성, 키보드 네비게이션)
 * - Loading 상태 및 disabled 상태
 * - 타입 안전성 (TypeScript strict mode)
 * - CSS 모듈 기반 스타일링
 * - Icon-only 모드 지원
 */

import type { ComponentChildren, VNode } from '@shared/external/vendors';
import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import styles from './Button.module.css';

// 간단한 clsx 대체 함수
function classnames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonIntent = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

// Base HTML Button Attributes
interface ButtonHTMLAttributes {
  readonly id?: string;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly form?: string;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly autoFocus?: boolean;
  readonly tabIndex?: number;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-pressed'?: boolean | 'true' | 'false';
  readonly 'aria-expanded'?: boolean | 'true' | 'false';
  readonly 'aria-controls'?: string;
  readonly 'aria-haspopup'?: boolean | 'true' | 'false';
  readonly 'aria-busy'?: boolean | 'true' | 'false';
  readonly 'data-testid'?: string;
  readonly title?: string;
  readonly role?: string;
  readonly onClick?: (event: MouseEvent) => void;
  readonly onFocus?: (event: FocusEvent) => void;
  readonly onBlur?: (event: FocusEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
  readonly onMouseEnter?: (event: MouseEvent) => void;
  readonly onMouseLeave?: (event: MouseEvent) => void;
}

export interface ButtonProps extends ButtonHTMLAttributes {
  readonly children?: ComponentChildren;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly intent?: ButtonIntent;
  readonly iconOnly?: boolean;
  readonly loading?: boolean;
  readonly ref?: (element: HTMLButtonElement | null) => void;
  readonly className?: string;
  readonly 'data-testid'?: string;
  /** @deprecated Use intent instead */
  readonly iconVariant?: ButtonIntent;
}

// 직접 컴포넌트 구현 (forwardRef 없이)
function ButtonComponent(props: ButtonProps): VNode {
  const {
    children,
    variant = 'primary',
    size = 'md',
    intent,
    iconVariant, // 하위 호환성
    iconOnly = false,
    type = 'button',
    form,
    autoFocus,
    disabled = false,
    loading = false,
    className,
    id,
    tabIndex,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-pressed': ariaPressed,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-haspopup': ariaHaspopup,
    'aria-busy': ariaBusy,
    'data-testid': dataTestId,
    title,
    role,
    onClick,
    onFocus,
    onBlur,
    onKeyDown,
    onMouseEnter,
    onMouseLeave,
    ref,
    ...restProps
  } = props;

  const { useRef, useEffect } = getPreactHooks();
  const { h } = getPreact();

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // ref 처리
  useEffect(() => {
    if (ref && buttonRef.current) {
      ref(buttonRef.current);
    }
    return () => {
      if (ref) {
        ref(null);
      }
    };
  }, [ref]);

  // 하위 호환성: iconVariant를 intent로 변환
  const resolvedIntent = intent || iconVariant;

  // 접근성 검증
  useEffect(() => {
    if (iconOnly && !ariaLabel && !ariaLabelledBy) {
      logger.warn('Icon-only buttons must have accessible labels', {
        component: 'UnifiedButton',
        variant,
        iconOnly,
      });
    }
  }, [iconOnly, ariaLabel, ariaLabelledBy, variant]);

  // 클릭 핸들러
  const handleClick = (event: MouseEvent) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  // 키보드 핸들러
  const handleKeyDown = (event: KeyboardEvent) => {
    if (disabled || loading) {
      return;
    }
    onKeyDown?.(event);
  };

  // 클래스 조합
  const buttonClasses = classnames(
    styles.unifiedButton,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    resolvedIntent && styles[`intent-${resolvedIntent}`],
    iconOnly && styles['iconOnly'],
    // 하위 호환성을 위한 추가 클래스명
    variant === 'icon' && styles['icon'],
    resolvedIntent && styles[resolvedIntent],
    styles[size],
    loading && styles.loading,
    disabled && styles.disabled,
    className
  );

  // tabIndex 처리
  const resolvedTabIndex = disabled ? -1 : tabIndex;

  return h(
    'button',
    {
      ref: buttonRef,
      type,
      form,
      autoFocus,
      disabled: disabled || loading,
      className: buttonClasses,
      id,
      role: role || 'button', // 기본적으로 명시적 role="button" 설정
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-pressed': ariaPressed,
      'aria-expanded': ariaExpanded,
      'aria-controls': ariaControls,
      'aria-haspopup': ariaHaspopup,
      'aria-busy': ariaBusy || loading,
      'aria-disabled': disabled || loading, // 명시적 aria-disabled 설정
      tabIndex: resolvedTabIndex,
      'data-testid': dataTestId,
      onClick: handleClick,
      onFocus,
      onBlur,
      onKeyDown: handleKeyDown,
      onMouseEnter,
      onMouseLeave,
      ...restProps,
    },
    // loading 상태에서 스피너와 children 렌더링
    loading
      ? [
          h('span', {
            className: styles.spinner,
            'aria-hidden': 'true',
          }),
          children,
        ]
      : children
  ) as VNode;
}

ButtonComponent.displayName = 'Button';

// Memoization with custom comparison for performance
const areEqual = (prevProps: ButtonProps, nextProps: ButtonProps): boolean => {
  // High-impact props that should trigger re-render
  if (prevProps.disabled !== nextProps.disabled) return false;
  if (prevProps.loading !== nextProps.loading) return false;
  if (prevProps.variant !== nextProps.variant) return false;
  if (prevProps.size !== nextProps.size) return false; // size 비교 추가!
  if (prevProps.intent !== nextProps.intent) return false; // intent 비교 추가!
  if (prevProps.children !== nextProps.children) return false;
  if (prevProps.onClick !== nextProps.onClick) return false;
  if (prevProps['aria-pressed'] !== nextProps['aria-pressed']) return false;
  if (prevProps['aria-label'] !== nextProps['aria-label']) return false; // aria-label 비교 추가!

  return true;
};

// 간단한 memo 구현 (외부 의존성 없이)
function memo<P>(component: (props: P) => VNode, compare?: (prev: P, next: P) => boolean) {
  let lastProps: P | undefined;
  let lastResult: VNode | undefined;

  return (props: P): VNode => {
    if (lastProps === undefined || !compare?.(lastProps, props)) {
      lastProps = props;
      lastResult = component(props);
    }
    return lastResult!;
  };
}

export const Button = memo(ButtonComponent, areEqual);

export default Button;
