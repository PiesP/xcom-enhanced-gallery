/**
 * @fileoverview Hero Icon - Arrows Right Left Component
 * @description Heroicons ArrowsRightLeft SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Horizontal opposing arrows.
 * Used for: fit to width, horizontal adjust actions.
 */

import type { JSXElement } from '@shared/external/vendors';
import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';

/**
 * ArrowsRightLeft Icon Component
 *
 * @param {IconProps} props - Icon component props.
 * @returns {JSXElement} Solid.js SVG icon element.
 */
export function HeroArrowsRightLeft(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M7.5 21 3 16.5M3 16.5 7.5 12M3 16.5h13.5M16.5 3 21 7.5M21 7.5 16.5 12M21 7.5H7.5" />
    </Icon>
  );
}
