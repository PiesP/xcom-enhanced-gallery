/**
 * Lightweight SVG wrapper shared by every icon in the gallery.
 * Applies the design-token defaults while keeping semantics explicit.
 */

import type { ComponentChildren, JSXElement } from "@shared/external/vendors";

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
  "aria-label"?: string;

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

export function Icon({
  size = "var(--xeg-icon-size)",
  className = "",
  children,
  "aria-label": ariaLabel,
  ...otherProps
}: IconProps): JSXElement {
  const accessibilityProps: Record<string, string> = {};
  if (ariaLabel) {
    accessibilityProps.role = "img";
    accessibilityProps["aria-label"] = ariaLabel;
  } else {
    accessibilityProps["aria-hidden"] = "true";
  }

  const sizeValue = typeof size === "number" ? `${size}px` : size;

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
      {...accessibilityProps}
      {...otherProps}
    >
      {children}
    </svg>
  );
}
