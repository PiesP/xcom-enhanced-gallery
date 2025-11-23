/**
 * @fileoverview Hero Icon - Arrows Pointing Out Component
 * @description Heroicons ArrowsPointingOut SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Four arrows pointing outward.
 * Used for: expand to container, fullscreen actions.
 */

import type { JSXElement } from "@shared/external/vendors";
import { Icon, type IconProps } from "@shared/components/ui/Icon/Icon";

/**
 * ArrowsPointingOut Icon Component
 *
 * @param {IconProps} props - Icon component props.
 * @returns {JSXElement} Solid.js SVG icon element.
 */
export function HeroArrowsPointingOut(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M3.75 3.75v4.5m0-4.5h4.5M3.75 3.75 9 9m-5.25 11.25v-4.5m0 4.5h4.5M3.75 20.25 9 15m11.25-11.25h-4.5m4.5 0v4.5M20.25 3.75 15 9m5.25 11.25h-4.5m4.5 0v-4.5M20.25 20.25 15 15" />
    </Icon>
  );
}
