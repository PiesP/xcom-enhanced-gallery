import { createSvgIcon, type SvgIconComponent } from '../SvgIcon';
import { XEG_ICON_DEFINITIONS } from '@assets/icons/xeg-icons';

const iconComponentMap = {
  Download: createSvgIcon('SvgDownload', XEG_ICON_DEFINITIONS.download),
  Settings: createSvgIcon('SvgSettings', XEG_ICON_DEFINITIONS.settings),
  Close: createSvgIcon('SvgClose', XEG_ICON_DEFINITIONS.close),
  ChevronLeft: createSvgIcon('SvgChevronLeft', XEG_ICON_DEFINITIONS['chevron-left']),
  ChevronRight: createSvgIcon('SvgChevronRight', XEG_ICON_DEFINITIONS['chevron-right']),
  ZoomIn: createSvgIcon('SvgZoomIn', XEG_ICON_DEFINITIONS['zoom-in']),
  ArrowAutofitWidth: createSvgIcon(
    'SvgArrowAutofitWidth',
    XEG_ICON_DEFINITIONS['arrow-autofit-width']
  ),
  ArrowAutofitHeight: createSvgIcon(
    'SvgArrowAutofitHeight',
    XEG_ICON_DEFINITIONS['arrow-autofit-height']
  ),
  ArrowsMaximize: createSvgIcon('SvgArrowsMaximize', XEG_ICON_DEFINITIONS['arrows-maximize']),
  FileZip: createSvgIcon('SvgFileZip', XEG_ICON_DEFINITIONS['file-zip']),
} as const satisfies Record<string, SvgIconComponent>;

export type XegIconComponentName = keyof typeof iconComponentMap;
export type IconComponent = SvgIconComponent;

export const XEG_ICON_COMPONENTS: Readonly<Record<XegIconComponentName, IconComponent>> =
  Object.freeze(iconComponentMap);

export function getXegIconComponent(name: XegIconComponentName): IconComponent {
  const component = XEG_ICON_COMPONENTS[name];
  if (!component) {
    throw new Error(`Icon component "${String(name)}" not found`);
  }
  return component;
}
