/**
 * @fileoverview Hero Icon - Arrows Up Down Component
 * @description Heroicons ArrowsUpDown SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Vertical opposing arrows.
 * Used for: fit to height, vertical adjust actions.
 */

import type { JSXElement } from '../../../../external/vendors';
import { Icon, type IconProps } from '../Icon';

/**
 * ArrowsUpDown Icon Component
 *
 * @param {IconProps} props - Icon component props.
 * @returns {JSXElement} Solid.js SVG icon element.
 */
export function HeroArrowsUpDown(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d='M3 7.5 7.5 3M7.5 3 12 7.5M7.5 3v13.5M21 16.5 16.5 21M16.5 21 12 16.5M16.5 21V7.5' />
    </Icon>
  );
}
