// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Lightweight SVG wrapper shared by every icon in the gallery.
 * Applies the design-token defaults while keeping semantics explicit.
 */

import type { ComponentChildren } from '@shared/types/component.types';
import type { JSXElement } from 'solid-js';
import { splitProps } from 'solid-js';

export interface IconProps {
  /**
   * Icon size: supports CSS variables, em/px units, or numeric pixels.
   * @default "var(--xeg-icon-size)" (1.5em)
   * @example size=16 maps to "16px"; size="2em" stays "2em"
   */
  readonly size?: number | string | undefined;

  /**
   * CSS class applied to SVG root element.
   * @default ""
   */
  readonly class?: string | undefined;

  /**
   * SVG path elements and shapes.
   * @example render with SVG path children (see LucideIcon for examples)
   */
  readonly children?: ComponentChildren;

  /**
   * Accessibility label. If provided: role="img" + aria-label.
   * If omitted: aria-hidden="true" (decorative).
   * @default undefined
   */
  readonly 'aria-label'?: string | undefined;
}

export function Icon(props: IconProps): JSXElement {
  const [local] = splitProps(props, ['size', 'class', 'children', 'aria-label']);
  const size = local.size ?? 'var(--xeg-icon-size)';
  const className = local.class ?? '';
  const ariaLabel = local['aria-label'];
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={sizeValue}
      height={sizeValue}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--xeg-icon-color, currentColor)"
      stroke-width="var(--xeg-icon-stroke-width)"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={className}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      {local.children}
    </svg>
  );
}
