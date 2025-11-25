/**
 * @fileoverview Hero Icon - Arrow Down On Square Stack Component
 * @description Heroicons ArrowDownOnSquareStack SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Down arrow over stacked squares.
 * Used for: bulk download actions.
 */

import type { JSXElement } from '@shared/external/vendors';
import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';

/**
 * ArrowDownOnSquareStack Icon Component
 *
 * @param {IconProps} props - Icon component props.
 * @returns {JSXElement} Solid.js SVG icon element.
 */
export function HeroArrowDownOnSquareStack(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M7.5 7.5h-.75a2.25 2.25 0 0 0-2.25 2.25v7.5A2.25 2.25 0 0 0 6.75 19.5h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5A2.25 2.25 0 0 0 14.25 7.5h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 17.25 22.5h-7.5A2.25 2.25 0 0 1 7.5 20.25v-.75" />
    </Icon>
  );
}
