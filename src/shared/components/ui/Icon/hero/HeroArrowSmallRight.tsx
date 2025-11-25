/**
 * @fileoverview Hero Icon - Arrow Small Right Component
 * @description Heroicons ArrowSmallRight SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Compact right arrow icon.
 * Used for: next navigation, forward actions.
 */

import type { JSXElement } from '@shared/external/vendors';
import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';

/**
 * ArrowSmallRight Icon Component
 * Renders a compact right arrow (SVG path).
 *
 * @param {IconProps} props - Icon component props.
 * @returns {JSXElement} Solid.js SVG icon element.
 */
export function HeroArrowSmallRight(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15m0 0-6.75-6.75M19.5 12l-6.75 6.75" />
    </Icon>
  );
}
