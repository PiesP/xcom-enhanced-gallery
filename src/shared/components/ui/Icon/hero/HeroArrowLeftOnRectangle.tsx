/**
 * @fileoverview Hero Icon - Arrow Left On Rectangle Component
 * @description Heroicons ArrowLeftOnRectangle SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Exit arrow icon.
 * Used for: close or exit actions.
 */

import type { JSXElement } from '@shared/external/vendors';
import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';

/**
 * ArrowLeftOnRectangle Icon Component
 *
 * @param {IconProps} props - Icon component props.
 * @returns {JSXElement} Solid.js SVG icon element.
 */
export function HeroArrowLeftOnRectangle(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3.75-6-3 3m0 0 3 3m-3-3H21.75" />
    </Icon>
  );
}
