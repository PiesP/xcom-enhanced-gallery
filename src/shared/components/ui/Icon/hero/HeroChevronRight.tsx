/**
 * @fileoverview Hero Icon - Chevron Right Component
 * @description Heroicons ChevronRight SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Right-pointing chevron navigation indicator
 * Used for: next/forward buttons, carousel navigation
 */

import type { JSXElement } from '@shared/external/vendors';
import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';

/**
 * Chevron Right Icon Component
 * Renders right-pointing arrow/chevron (SVG path)
 *
 * @param {IconProps} props - Icon component props (size, color, class, etc.)
 * @returns {JSXElement} Solid.js SVG icon element
 *
 * @example
 * ```tsx
 * <HeroChevronRight size='md' />
 * <HeroChevronRight size='lg' class='text-primary' />
 * ```
 */
export function HeroChevronRight(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </Icon>
  );
}
