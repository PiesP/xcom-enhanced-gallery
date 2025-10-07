/**
 * @fileoverview Button Primitive Solid Component
 * @description 기본 버튼 컴포넌트 - Solid.js 기반, 디자인 토큰 사용
 */

import { mergeProps, splitProps, type Component, type JSX } from 'solid-js';
import './Button.css';

export interface ButtonProps {
  readonly children: JSX.Element;
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

export const Button: Component<ButtonProps> = props => {
  // Solid.js의 mergeProps로 기본값 설정
  const merged = mergeProps(
    {
      className: '',
      variant: 'primary' as const,
      size: 'md' as const,
      disabled: false,
      type: 'button' as const,
      loading: false,
    },
    props
  );

  // splitProps로 이벤트 핸들러와 나머지 props 분리
  const [local, handlers, accessibilityProps, rest] = splitProps(
    merged,
    [
      'children',
      'className',
      'variant',
      'size',
      'disabled',
      'type',
      'intent',
      'selected',
      'loading',
    ],
    ['onClick', 'onKeyDown'],
    ['aria-label', 'data-action']
  );

  const handleKeyDown = (event: KeyboardEvent) => {
    // 키보드 접근성: Enter, Space 키 지원
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!local.disabled && !local.loading && handlers.onClick) {
        handlers.onClick(event as unknown as MouseEvent);
      }
    }
    handlers.onKeyDown?.(event);
  };

  const handleClick = (event: MouseEvent) => {
    if (!local.disabled && !local.loading) {
      handlers.onClick?.(event);
    }
  };

  // 클래스 조합 (Solid.js reactive derived value)
  const classes = () =>
    [
      'xeg-button',
      `xeg-button--${local.variant}`,
      `xeg-button--${local.size}`,
      local.intent && `xeg-button--${local.intent}`,
      local.selected && 'xeg-button--selected',
      local.loading && 'xeg-button--loading',
      local.className,
    ]
      .filter(Boolean)
      .join(' ');

  // 접근성 속성 (reactive)
  const a11yProps = () => {
    const props: Record<string, unknown> = {
      role: 'button',
      tabIndex: local.disabled || local.loading ? -1 : 0,
    };

    // selected 상태 aria 속성
    if (local.selected !== undefined) {
      props['aria-pressed'] = String(local.selected);
    }

    // loading 상태 aria 속성
    if (local.loading) {
      props['aria-busy'] = 'true';
    }

    return props;
  };

  return (
    <button
      type={local.type}
      class={classes()}
      disabled={local.disabled || local.loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...a11yProps()}
      {...accessibilityProps}
      {...rest}
    >
      {local.children}
    </button>
  );
};
