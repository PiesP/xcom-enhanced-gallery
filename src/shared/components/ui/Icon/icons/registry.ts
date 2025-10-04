import { createSvgIcon, type SvgIconComponent } from '../SvgIcon';
import { XEG_ICONS } from '@assets/icons/xeg-icons';

const iconComponentMap = {
  Download: createSvgIcon('SvgDownload', XEG_ICONS.Download),
  Settings: createSvgIcon('SvgSettings', XEG_ICONS.Settings),
  Close: createSvgIcon('SvgClose', XEG_ICONS.Close),
  ChevronLeft: createSvgIcon('SvgChevronLeft', XEG_ICONS.ChevronLeft),
  ChevronRight: createSvgIcon('SvgChevronRight', XEG_ICONS.ChevronRight),
  ZoomIn: createSvgIcon('SvgZoomIn', XEG_ICONS.ZoomIn),
  ArrowAutofitWidth: createSvgIcon('SvgArrowAutofitWidth', XEG_ICONS.ArrowAutofitWidth),
  ArrowAutofitHeight: createSvgIcon('SvgArrowAutofitHeight', XEG_ICONS.ArrowAutofitHeight),
  ArrowsMaximize: createSvgIcon('SvgArrowsMaximize', XEG_ICONS.ArrowsMaximize),
  FileZip: createSvgIcon('SvgFileZip', XEG_ICONS.FileZip),
  QuestionMark: createSvgIcon('SvgQuestionMark', XEG_ICONS.QuestionMark),
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
