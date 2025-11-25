/**
 * @fileoverview Hero Icon - Document Text Component
 * @description Heroicons DocumentText SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Document/file with text content indicator
 * Used for: document icons, text files, help/info buttons
 */

import type { JSXElement } from '@shared/external/vendors';
import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';

/**
 * Document Text Icon Component
 * Renders document page with text lines (SVG path)
 *
 * @param {IconProps} props - Icon component props (size, color, class, etc.)
 * @returns {JSXElement} Solid.js SVG icon element
 *
 * @example
 * ```tsx
 * <HeroDocumentText size='md' />
 * <HeroDocumentText size='lg' class='text-primary' />
 * ```
 */
export function HeroDocumentText(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h4.5m0 0h3.375a3.375 3.375 0 0 0 3.375-3.375v-1.5a1.125 1.125 0 0 1 1.125-1.125h1.5a3.375 3.375 0 0 1 3.375 3.375v2.625m-13.5 0a3.375 3.375 0 0 1-3.375 3.375m0-3.375a3.375 3.375 0 0 0-3.375 3.375m0-3.375h.375a1.125 1.125 0 0 1 1.125 1.125v1.5a3.375 3.375 0 0 1-3.375 3.375M9 16.5v.75m0 0v.75m0-.75h.75m-.75 0H9m0 0h-.75m.75 0v-.75m3 .75v.75m0 0v.75m0-.75h.75m-.75 0H12m0 0h-.75m.75 0v-.75" />
    </Icon>
  );
}
