/**
 * @fileoverview Hero Icon - X (Close) Component
 * @description Heroicons XMark SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * X-mark close/dismiss indicator
 * Used for: close buttons, dismiss actions, exit UI elements
 */

import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';
import type { JSXElement } from '@shared/external/vendors';

/**
 * X (Close) Icon Component
 * Renders X-mark for closing/dismissing (SVG path)
 *
 * @param {IconProps} props - Icon component props (size, color, class, etc.)
 * @returns {JSXElement} Solid.js SVG icon element
 *
 * @example
 * ```tsx
 * <HeroX size='md' />
 * <HeroX size='lg' class='text-primary' />
 * ```
 */
export function HeroX(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M6 18 18 6M6 6l12 12" />
    </Icon>
  );
}
