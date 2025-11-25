/**
 * @fileoverview Hero Icon - Chevron Left Component
 * @description Heroicons ChevronLeft SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Left-pointing chevron navigation indicator
 * Used for: previous/back buttons, carousel navigation
 */

import type { JSXElement } from '@shared/external/vendors';
import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';

/**
 * Chevron Left Icon Component
 * Renders left-pointing arrow/chevron (SVG path)
 *
 * @param {IconProps} props - Icon component props (size, color, class, etc.)
 * @returns {JSXElement} Solid.js SVG icon element
 *
 * @example
 * ```tsx
 * <HeroChevronLeft size='md' />
 * <HeroChevronLeft size='lg' class='text-primary' />
 * ```
 */
export function HeroChevronLeft(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M15.75 19.5 8.25 12l7.5-7.5" />
    </Icon>
  );
}
