/**
 * @fileoverview Hero Icon - Arrow Autofit Width Component
 * @description Heroicons ArrowAutofitWidth SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Horizontal expand/collapse arrow indicator (left-right directions)
 * Used for: width adjustment controls, horizontal sizing indicators
 */

import type { JSXElement } from '../../../../external/vendors';
import { Icon, type IconProps } from '../Icon';

/**
 * Arrow Autofit Width Icon Component
 * Renders horizontal expand/collapse arrow (SVG path)
 *
 * @param {IconProps} props - Icon component props (size, color, class, etc.)
 * @returns {JSXElement} Solid.js SVG icon element
 *
 * @example
 * ```tsx
 * <HeroArrowAutofitWidth size='md' />
 * <HeroArrowAutofitWidth size='lg' class='text-primary' />
 * ```
 */
export function HeroArrowAutofitWidth(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d='M16.5 3 21 7.5m0 0L16.5 12M21 7.5H7.5m0 13.5L3 16.5m0 0L7.5 12m-4.5 4.5h13.5' />
    </Icon>
  );
}
