/** @jsxImportSource solid-js */
/**
 * @fileoverview Button Primitive Component (Solid)
 * @description 기본 버튼 컴포넌트 - 디자인 토큰 사용 (SolidJS)
 */

import type { JSX } from 'solid-js';
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

export function Button(props: ButtonProps): JSX.Element {
  const handleKeyDown = (event: KeyboardEvent) => {
    // 키보드 접근성: Enter, Space 키 지원
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!props.disabled && !props.loading && props.onClick) {
        props.onClick(event as unknown as MouseEvent);
      }
    }
    props.onKeyDown?.(event);
  };

  const handleClick = (event: MouseEvent) => {
    if (!props.disabled && !props.loading) {
      props.onClick?.(event);
    }
  };

  // 클래스 조합 (반응형)
  const classes = () => {
    const variant = props.variant ?? 'primary';
    const size = props.size ?? 'md';

    return [
      'xeg-button',
      `xeg-button--${variant}`,
      `xeg-button--${size}`,
      props.intent && `xeg-button--${props.intent}`,
      props.selected && 'xeg-button--selected',
      props.loading && 'xeg-button--loading',
      props.className,
    ]
      .filter(Boolean)
      .join(' ');
  };

  // 접근성 속성 (반응형)
  const accessibilityProps = () => {
    const attrs: Record<string, unknown> = {
      role: 'button',
      tabIndex: props.disabled || props.loading ? -1 : 0,
    };

    // selected 상태 aria 속성
    if (props.selected !== undefined) {
      attrs['aria-pressed'] = String(props.selected);
    }

    // loading 상태 aria 속성
    if (props.loading) {
      attrs['aria-busy'] = 'true';
    }

    return attrs;
  };

  const attrs = accessibilityProps();

  return (
    <button
      type={props.type ?? 'button'}
      class={classes()}
      disabled={props.disabled || props.loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={(attrs.tabIndex as number) ?? undefined}
      aria-pressed={props.selected}
      aria-busy={props.loading || undefined}
      aria-label={props['aria-label']}
      data-action={props['data-action']}
    >
      {props.children}
    </button>
  );
}
