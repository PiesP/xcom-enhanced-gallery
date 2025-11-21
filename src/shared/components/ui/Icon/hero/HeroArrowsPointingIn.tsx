/**
 * @fileoverview Hero Icon - Arrows Pointing In Component
 * @description Heroicons ArrowsPointingIn SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Four arrows pointing toward center.
 * Used for: actual size, shrink to center actions.
 */

import type { JSXElement } from '@shared/external/vendors';
import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';

/**
 * ArrowsPointingIn Icon Component
 *
 * @param {IconProps} props - Icon component props.
 * @returns {JSXElement} Solid.js SVG icon element.
 */
export function HeroArrowsPointingIn(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d='M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15 3.75 20.25M15 9h4.5M15 9V4.5M15 9 20.25 3.75M15 15h4.5M15 15v4.5M15 15l5.25 5.25' />
    </Icon>
  );
}
