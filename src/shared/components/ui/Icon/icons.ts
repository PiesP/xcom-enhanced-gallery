/**
 * @fileoverview Factory-generated icon components using the lightweight SvgIcon system.
 * This replaces the Heroicons dependency with static SVG path definitions.
 */

import { createSvgIcon, type SvgIconComponent } from './SvgIcon';
import { XEG_ICONS } from '@assets/icons/xeg-icons';

/**
 * Pre-built icon components using the SvgIcon factory
 */
export const XEG_ICON_COMPONENTS: Record<string, SvgIconComponent> = {
  Download: createSvgIcon('XegDownload', XEG_ICONS.Download!),
  Settings: createSvgIcon('XegSettings', XEG_ICONS.Settings!),
  X: createSvgIcon('XegX', XEG_ICONS.X!),
  ChevronLeft: createSvgIcon('XegChevronLeft', XEG_ICONS.ChevronLeft!),
  ChevronRight: createSvgIcon('XegChevronRight', XEG_ICONS.ChevronRight!),
  ZoomIn: createSvgIcon('XegZoomIn', XEG_ICONS.ZoomIn!),
  ArrowAutofitWidth: createSvgIcon('XegArrowAutofitWidth', XEG_ICONS.ArrowAutofitWidth!),
  ArrowAutofitHeight: createSvgIcon('XegArrowAutofitHeight', XEG_ICONS.ArrowAutofitHeight!),
  ArrowsMaximize: createSvgIcon('XegArrowsMaximize', XEG_ICONS.ArrowsMaximize!),
  FileZip: createSvgIcon('XegFileZip', XEG_ICONS.FileZip!),
};

/**
 * Get an icon component by name
 * @param name - Icon name (must match keys in XEG_ICON_COMPONENTS)
 * @returns Icon component or undefined if not found
 */
export function getXegIconComponent(name: string): SvgIconComponent | undefined {
  return XEG_ICON_COMPONENTS[name];
}

/**
 * Check if an icon component exists
 * @param name - Icon name to check
 * @returns True if icon component exists, false otherwise
 */
export function hasXegIconComponent(name: string): boolean {
  return name in XEG_ICON_COMPONENTS;
}

/**
 * Get all available icon component names
 * @returns Array of all icon component names
 */
export function getAvailableXegIconNames(): string[] {
  return Object.keys(XEG_ICON_COMPONENTS);
}
