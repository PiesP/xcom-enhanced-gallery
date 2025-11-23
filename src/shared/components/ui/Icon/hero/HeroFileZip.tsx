/**
 * @fileoverview Hero Icon - File Zip Component
 * @description Heroicons ArchiveBoxArrowDown SVG adapter for Solid.js
 * @version 1.0.0
 * @module shared/components/ui/Icon/hero
 *
 * ZIP file/archive document with download indicator
 * Used for: archive icons, compressed file indicators, bulk download UI
 */

import type { JSXElement } from "@shared/external/vendors";
import { Icon, type IconProps } from "@shared/components/ui/Icon/Icon";

/**
 * File ZIP Icon Component
 * Renders archive/ZIP file with download arrow (SVG path)
 *
 * @param {IconProps} props - Icon component props (size, color, class, etc.)
 * @returns {JSXElement} Solid.js SVG icon element
 *
 * @example
 * ```tsx
 * <HeroFileZip size='md' />
 * <HeroFileZip size='lg' class='text-primary' />
 * ```
 */
export function HeroFileZip(props: IconProps): JSXElement {
  return (
    <Icon {...props}>
      <path d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </Icon>
  );
}
