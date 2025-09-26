/**
 * @fileoverview Barrel exports for icon registry APIs.
 * Implementation lives in registry.ts to keep architecture rules simple.
 */

import { XEG_ICON_COMPONENTS } from './registry';

export {
  XEG_ICON_COMPONENTS,
  getXegIconComponent,
  type IconComponent,
  type XegIconComponentName,
} from './registry';

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
} = XEG_ICON_COMPONENTS;
