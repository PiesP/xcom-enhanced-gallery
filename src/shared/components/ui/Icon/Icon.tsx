/**
 * Lightweight SVG wrapper shared by every icon in the gallery.
 * Applies the design-token defaults while keeping semantics explicit.
 */

import type { ComponentChildren, JSXElement } from '@shared/external/vendors';

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

export function Icon({
  size = 'var(--xeg-icon-size)',
  class: className = '',
  children,
  'aria-label': ariaLabel,
}: IconProps): JSXElement {
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
      {children}
    </svg>
  );
}
