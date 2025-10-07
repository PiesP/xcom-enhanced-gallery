import { getSolid } from '@shared/external/vendors';
const { mergeProps, splitProps, createEffect } = getSolid();
import type { Component, JSX } from '@shared/external/vendors';

/**
 * @fileoverview Button.solid - Solid.js 통합 버튼 컴포넌트
 * @description 모든 버튼 요구사항을 만족하는 통합 컴포넌트 (Solid.js)
 *
 * @features
 * - 다중 variant 지원 (primary, secondary, icon, danger, ghost, toolbar, navigation, action)
 * - 완전한 접근성 (ARIA 속성, 키보드 네비게이션)
 * - Loading 상태 및 disabled 상태
 * - 타입 안전성 (TypeScript strict mode)
 * - CSS 모듈 기반 스타일링
 * - Icon-only 모드 지원
 * - Intent 시스템 (색상 오버레이)
 */

import { logger } from '@shared/logging';
import styles from './Button.module.css';

// 간단한 clsx 대체 함수
function classnames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'icon'
  | 'danger'
  | 'ghost'
  | 'toolbar'
  | 'navigation'
  | 'action';

type ButtonSize = 'sm' | 'md' | 'lg' | 'toolbar';
type ButtonIntent = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export interface ButtonProps {
  readonly children?: JSX.Element;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly intent?: ButtonIntent;
  readonly iconOnly?: boolean;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly form?: string;
  readonly autoFocus?: boolean;
  readonly className?: string;
  readonly id?: string;
  readonly title?: string;
  readonly role?: 'button' | 'tab' | 'link' | 'menuitem' | 'switch' | 'checkbox';
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
  readonly 'data-gallery-element'?: string;
  readonly 'data-disabled'?: boolean | string;
  readonly 'data-selected'?: boolean | string;
  readonly 'data-loading'?: boolean | string;
  readonly onClick?: (event: MouseEvent) => void;
  readonly onMouseDown?: (event: MouseEvent) => void;
  readonly onMouseUp?: (event: MouseEvent) => void;
  readonly onFocus?: (event: FocusEvent) => void;
  readonly onBlur?: (event: FocusEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
  readonly onMouseEnter?: (event: MouseEvent) => void;
  readonly onMouseLeave?: (event: MouseEvent) => void;
  readonly ref?: (element: HTMLButtonElement | null) => void;
  /** @deprecated Use intent instead */
  readonly iconVariant?: ButtonIntent;
}

export const Button: Component<ButtonProps> = props => {
  const merged = mergeProps(
    {
      variant: 'primary' as const,
      size: 'md' as const,
      type: 'button' as const,
      disabled: false,
      loading: false,
      iconOnly: false,
    },
    props
  );

  const [local, handlers, aria, data, rest] = splitProps(
    merged,
    [
      'variant',
      'size',
      'intent',
      'iconOnly',
      'loading',
      'disabled',
      'children',
      'className',
      'ref',
      'type',
      'iconVariant',
      'form',
      'autoFocus',
      'id',
      'title',
      'role',
      'tabIndex',
    ],
    [
      'onClick',
      'onMouseDown',
      'onMouseUp',
      'onFocus',
      'onBlur',
      'onKeyDown',
      'onMouseEnter',
      'onMouseLeave',
    ],
    [
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'aria-pressed',
      'aria-expanded',
      'aria-controls',
      'aria-haspopup',
      'aria-busy',
    ],
    ['data-testid', 'data-gallery-element', 'data-disabled', 'data-selected', 'data-loading']
  );

  let buttonRef: HTMLButtonElement | undefined;

  // Ref 처리
  createEffect(() => {
    if (local.ref) {
      local.ref(buttonRef || null);
    }
  });

  // 접근성 검증 (iconOnly 모드)
  createEffect(() => {
    if (local.iconOnly) {
      const derived = aria['aria-label'] || aria['aria-labelledby'] || local.title;
      if (!derived) {
        logger.warn(
          'Icon-only buttons must have accessible labels (aria-label or aria-labelledby).',
          { component: 'Button', variant: local.variant, iconOnly: local.iconOnly }
        );
      }
    }
  });

  // 하위 호환성: iconVariant → intent
  const resolvedIntent = () => local.intent || local.iconVariant;

  // 이벤트 핸들러 (disabled/loading 체크)
  const handleClick = (event: MouseEvent) => {
    if (local.disabled || local.loading) {
      event.preventDefault();
      return;
    }
    handlers.onClick?.(event);
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (local.disabled || local.loading) {
      event.preventDefault();
      return;
    }
    handlers.onMouseDown?.(event);
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (local.disabled || local.loading) return;
    handlers.onMouseUp?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (local.disabled || local.loading) return;
    handlers.onKeyDown?.(event);
  };

  // 클래스 조합 (함수로 만들어 반응성 확보)
  const buttonClasses = () =>
    classnames(
      styles.unifiedButton,
      styles[`variant-${local.variant}`],
      styles[`size-${local.size}`],
      resolvedIntent() && styles[`intent-${resolvedIntent()}`],
      local.iconOnly && styles['iconOnly'],
      // 하위 호환성을 위한 추가 클래스명
      local.variant === 'icon' && styles['icon'],
      resolvedIntent() && styles[resolvedIntent()!],
      styles[local.size],
      local.loading && styles.loading,
      local.disabled && styles.disabled,
      local.className
    );

  // tabIndex 처리
  const resolvedTabIndex = () => (local.disabled ? -1 : local.tabIndex);

  return (
    <button
      ref={buttonRef}
      type={local.type}
      form={local.form}
      autofocus={local.autoFocus}
      disabled={local.disabled || local.loading}
      class={buttonClasses()}
      id={local.id}
      role={local.role || 'button'}
      aria-label={aria['aria-label']}
      aria-labelledby={aria['aria-labelledby']}
      aria-describedby={aria['aria-describedby']}
      aria-pressed={aria['aria-pressed']}
      aria-expanded={aria['aria-expanded']}
      aria-controls={aria['aria-controls']}
      aria-haspopup={aria['aria-haspopup']}
      aria-busy={aria['aria-busy'] || local.loading}
      aria-disabled={local.disabled || local.loading}
      tabIndex={resolvedTabIndex()}
      data-testid={data['data-testid']}
      data-gallery-element={data['data-gallery-element']}
      data-disabled={data['data-disabled']}
      data-selected={data['data-selected']}
      data-loading={data['data-loading']}
      title={local.title}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={handlers.onFocus}
      onBlur={handlers.onBlur}
      onKeyDown={handleKeyDown}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      {...rest}
    >
      {local.loading && <span class={styles.spinner} aria-hidden='true' />}
      {local.children}
    </button>
  );
};

export default Button;
