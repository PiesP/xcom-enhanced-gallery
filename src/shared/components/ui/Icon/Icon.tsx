/**
 * @fileoverview Icon Component (SolidJS)
 * @version 3.0.0 - Solid 기반 공통 아이콘 컨테이너
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';

export interface IconProps {
  readonly size?: number | string;
  readonly className?: string;
  readonly children?: JSX.Element | JSX.Element[] | string;
  readonly 'aria-label'?: string;
  readonly style?: Record<string, unknown> | string;
  readonly [key: string]: unknown;
}

export const Icon = (props: IconProps): JSX.Element => {
  const { createMemo } = getSolidCore();

  const sizeValue = createMemo(() => {
    const value = props.size ?? 'var(--xeg-icon-size)';
    return typeof value === 'number' ? `${value}px` : value;
  });

  const isNumericSize = createMemo(() => typeof props.size === 'number');

  const computedStyle = createMemo(() => {
    if (isNumericSize()) {
      return props.style;
    }

    const desiredSize = sizeValue();
    const style = props.style;

    if (typeof style === 'string') {
      const trimmed = style.trim();
      const needsSemicolon = trimmed.length > 0 && !trimmed.endsWith(';');
      return `${trimmed}${needsSemicolon ? ';' : ''}width:${desiredSize};height:${desiredSize};`;
    }

    if (style && typeof style === 'object') {
      return {
        ...(style as Record<string, unknown>),
        width: desiredSize,
        height: desiredSize,
      } as Record<string, unknown>;
    }

    return {
      width: desiredSize,
      height: desiredSize,
    } as Record<string, unknown>;
  });

  const widthProp = createMemo(() => (isNumericSize() ? sizeValue() : undefined));
  const heightProp = createMemo(() => (isNumericSize() ? sizeValue() : undefined));

  const accessibilityProps = createMemo(() => {
    const ariaLabel = props['aria-label'];
    return ariaLabel
      ? ({ role: 'img', 'aria-label': ariaLabel } as const)
      : ({
          'aria-hidden': 'true',
        } as const);
  });

  const restProps = createMemo(() => {
    const {
      size: _size,
      className: _className,
      children: _children,
      style: _style,
      'aria-label': _ariaLabel,
      ...rest
    } = props as IconProps & Record<string, unknown>;
    return rest;
  });

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='var(--xeg-icon-color, currentColor)'
      stroke-width='var(--xeg-icon-stroke-width)'
      stroke-linecap='round'
      stroke-linejoin='round'
      class={props.className ?? ''}
      width={widthProp()}
      height={heightProp()}
      style={computedStyle() as JSX.CSSProperties | string | undefined}
      {...accessibilityProps()}
      {...restProps()}
    >
      {props.children}
    </svg>
  );
};

export default Icon;
