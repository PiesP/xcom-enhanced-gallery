/**
 * @fileoverview Hero Icon - Arrow Autofit Height Component
 * @description Heroicons ArrowAutofitHeight SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Vertical expand/collapse arrow indicator (top-bottom directions)
 * Used for: height adjustment controls, vertical sizing indicators
 */

import type { JSXElement } from '../../../../external/vendors';
import { Icon, type IconProps } from '../Icon';

/**
 * Arrow Autofit Height Icon Component
 * Renders vertical expand/collapse arrow (SVG path)
 *
 * @param {IconProps} props - Icon component props (size, color, class, etc.)
 * @returns {JSXElement} Solid.js SVG icon element
 *
 * @example
 * ```tsx
 * <HeroArrowAutofitHeight size='md' />
 * <HeroArrowAutofitHeight size='lg' class='text-primary' />
 * ```
 */
export function HeroArrowAutofitHeight(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d='M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5' />
    </Icon>
  );
}
