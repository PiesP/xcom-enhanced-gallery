/**
 * @fileoverview Hero Icon - Arrow Small Left Component
 * @description Heroicons ArrowSmallLeft SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Compact left arrow icon.
 * Used for: previous navigation, backward actions.
 */

import type { JSXElement } from '@shared/external/vendors';
import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';

/**
 * ArrowSmallLeft Icon Component
 * Renders a compact left arrow (SVG path).
 *
 * @param {IconProps} props - Icon component props.
 * @returns {JSXElement} Solid.js SVG icon element.
 */
export function HeroArrowSmallLeft(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M19.5 12H4.5m0 0L11.25 18.75M4.5 12 11.25 5.25" />
    </Icon>
  );
}
