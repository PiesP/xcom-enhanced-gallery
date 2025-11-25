/**
 * @fileoverview Hero Icon - Download Component
 * @description Heroicons ArrowDownTray SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * Download arrow indicator pointing downward with tray
 * Used for: download buttons, save actions, file operations
 */

import type { JSXElement } from '@shared/external/vendors';
import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';

/**
 * Download Icon Component
 * Renders download arrow pointing to tray (SVG path)
 *
 * @param {IconProps} props - Icon component props (size, color, class, etc.)
 * @returns {JSXElement} Solid.js SVG icon element
 *
 * @example
 * ```tsx
 * <HeroDownload size='md' />
 * <HeroDownload size='lg' class='text-primary' />
 * ```
 */
export function HeroDownload(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </Icon>
  );
}
