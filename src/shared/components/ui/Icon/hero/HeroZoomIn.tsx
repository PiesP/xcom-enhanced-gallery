/**
 * @fileoverview Hero Icon - Zoom In Component
 * @description Heroicons MagnifyingGlassPlus SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Magnifying glass with plus indicator for zoom in
 * Used for: zoom in buttons, search enhancement, magnification UI
 */

import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';
import type { JSXElement } from '@shared/external/vendors';

/**
 * Zoom In Icon Component
 * Renders magnifying glass with plus sign (SVG path)
 *
 * @param {IconProps} props - Icon component props (size, color, class, etc.)
 * @returns {JSXElement} Solid.js SVG icon element
 *
 * @example
 * ```tsx
 * <HeroZoomIn size='md' />
 * <HeroZoomIn size='lg' class='text-primary' />
 * ```
 */
export function HeroZoomIn(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
    </Icon>
  );
}
