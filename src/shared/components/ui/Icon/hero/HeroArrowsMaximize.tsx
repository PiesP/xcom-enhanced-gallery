/**
 * @fileoverview Hero Icon - Arrows Maximize Component
 * @description Heroicons ArrowsPointingOut SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Bidirectional expand arrows indicator (diagonal directions)
 * Used for: maximize/fullscreen controls, expansion buttons
 */

import type { JSXElement } from '../../../../external/vendors';
import { Icon, type IconProps } from '../Icon';

/**
 * Arrows Maximize Icon Component
 * Renders diagonal expand arrows (SVG path)
 *
 * @param {IconProps} props - Icon component props (size, color, class, etc.)
 * @returns {JSXElement} Solid.js SVG icon element
 *
 * @example
 * ```tsx
 * <HeroArrowsMaximize size='md' />
 * <HeroArrowsMaximize size='lg' class='text-primary' />
 * ```
 */
export function HeroArrowsMaximize(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d='M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15' />
    </Icon>
  );
}
