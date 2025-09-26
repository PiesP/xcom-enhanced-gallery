/**
 * @fileoverview Icon component factory and registry
 * Creates SVG icon components from static definitions
 */

import { createSvgIcon, type SvgIconComponent } from '../SvgIcon';
import { XEG_ICONS, type XegIconName } from '@assets/icons/xeg-icons';

export type XegIconComponentName = XegIconName;

export type IconComponent = SvgIconComponent;

// Create all icon components dynamically from definitions
const iconComponents: Record<XegIconComponentName, IconComponent> = {} as Record<
  XegIconComponentName,
  IconComponent
>;

// Initialize all icon components
for (const [iconName, definition] of Object.entries(XEG_ICONS)) {
  const componentName = iconName as XegIconComponentName;
  iconComponents[componentName] = createSvgIcon(componentName, definition);
}

export function getXegIconComponent(name: XegIconComponentName): IconComponent {
  const component = iconComponents[name];
  if (!component) {
    throw new Error(`Icon component "${name}" not found`);
  }
  return component;
}

// Export individual icon components for direct use
export const {
  Download,
  Settings,
  Close,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ArrowAutofitWidth,
  ArrowAutofitHeight,
  ArrowsMaximize,
  FileZip,
} = iconComponents;
