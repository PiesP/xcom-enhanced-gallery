/**
 * @fileoverview Icon Component - Base SVG Icon Container
 * @description Core SVG icon wrapper component using design tokens (Phase 309+)
 * @version 2.1.0 - Phase 387: Enhanced documentation, design system alignment
 * @module shared/components/ui/Icon
 *
 * **Design System Integration**:
 * - Size: CSS variable --xeg-icon-size (default: 1.5em)
 * - Color: CSS variable --xeg-icon-color (fallback: currentColor)
 * - Stroke: CSS variable --xeg-icon-stroke-width
 * - Responsive: Uses em units for relative sizing
 *
 * **Accessibility**:
 * - If aria-label provided: role="img" with ARIA label
 * - If aria-label omitted: aria-hidden="true" (decorative)
 * - SVG accessibility: Proper ARIA attributes for screen readers
 *
 * **SVG Properties**:
 * - ViewBox: Fixed 24x24 (Heroicons standard)
 * - Stroke-based: Uses stroke, not fill (design system standard)
 * - Responsive: width/height use CSS variables or em units
 * - Stroke caps: round (design tokens: --xeg-icon-stroke-linecap)
 *
 * @example
 * ```tsx
 * // Basic icon (CSS variable sizing)
 * <Icon aria-label="Close">
 *   <path stroke="none" d="M0 0h24v24H0z" fill="none" />
 *   <path d="M18 6l-12 12" />
 *   <path d="M6 6l12 12" />
 * </Icon>
 *
 * // Custom size (numeric or CSS)
 * <Icon size={16}>
 *   <path d="M7 4v16l13-8z" />
 * </Icon>
 *
 * // CSS variable sizing
 * <Icon size="var(--xeg-icon-size-lg)">
 *   <path d="M7 4v16l13-8z" />
 * </Icon>
 * ```
 */

import type { ComponentChildren, JSXElement } from '../../../external/vendors';

/**
 * Icon Component Props Interface
 *
 * @description Props for SVG icon components
 */
export interface IconProps {
  /**
   * Icon size (width, height)
   * Supports: CSS variables, em/px units, or numeric pixels
   *
   * @default CSS variable --xeg-icon-size (1.5em)
   * @example size={16} => "16px"
   * @example size="2em" => "2em"
   * @example size="var(--xeg-icon-size-lg)" => "2rem"
   */
  size?: number | string;

  /**
   * CSS class name(s)
   * Applied to SVG root element
   *
   * @default ""
   * @example className="text-primary"
   * @example className="icon-hover-effect"
   */
  className?: string;

  /**
   * SVG path elements and shapes
   * Contains <path>, <line>, <circle>, etc.
   *
   * @example
   * ```tsx
   * <Icon>
   *   <path d="M18 6l-12 12" />
   *   <path d="M6 6l12 12" />
   * </Icon>
   * ```
   */
  children?: ComponentChildren;

  /**
   * Accessibility label for icon
   * If provided: sets role="img" with aria-label
   * If omitted: sets aria-hidden="true" (decorative)
   *
   * @default undefined
   * @example 'aria-label'="Close button"
   */
  'aria-label'?: string;

  /**
   * Additional SVG attributes (stroke-width, fill, etc.)
   * Spread onto SVG element
   *
   * @example
   * ```tsx
   * <Icon stroke-width={1.5} fill="none">
   *   ...
   * </Icon>
   * ```
   */
  [key: string]: unknown;
}

/**
 * Icon Component - SVG Icon Wrapper
 *
 * Base component for all SVG icons. Provides:
 * - Design system integration (CSS variables)
 * - Accessibility (ARIA attributes)
 * - Responsive sizing (em units)
 * - Type safety (TypeScript)
 *
 * **Responsibilities**:
 * - Normalize size to px/em/CSS values
 * - Apply accessibility attributes
 * - Handle ARIA labels for screen readers
 * - Pass through custom SVG attributes
 *
 * @param {IconProps} props - Icon component props
 * @returns {JSXElement} SVG element with icon content
 *
 * @example
 * ```tsx
 * // Decorative icon (no label)
 * <Icon>
 *   <path d="M7 4v16l13-8z" />
 * </Icon>
 *
 * // Semantic icon (with label)
 * <Icon aria-label="Play">
 *   <path d="M7 4v16l13-8z" />
 * </Icon>
 *
 * // Custom sizing
 * <Icon size={32} className="custom-icon">
 *   <path d="M7 4v16l13-8z" />
 * </Icon>
 * ```
 */
export function Icon({
  size = 'var(--xeg-icon-size)',
  className = '',
  children,
  'aria-label': ariaLabel,
  ...otherProps
}: IconProps): JSXElement {
  // Accessibility: Setup ARIA attributes
  const accessibilityProps: Record<string, string> = {};
  if (ariaLabel) {
    // Icon has semantic meaning: expose to screen readers
    accessibilityProps.role = 'img';
    accessibilityProps['aria-label'] = ariaLabel;
  } else {
    // Icon is decorative: hide from screen readers
    accessibilityProps['aria-hidden'] = 'true';
  }

  // Size normalization: convert number to px, keep strings as-is
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={sizeValue}
      height={sizeValue}
      viewBox='0 0 24 24'
      fill='none'
      stroke='var(--xeg-icon-color, currentColor)'
      stroke-width='var(--xeg-icon-stroke-width)'
      stroke-linecap='round'
      stroke-linejoin='round'
      class={className}
      {...accessibilityProps}
      {...otherProps}
    >
      {children}
    </svg>
  );
}
