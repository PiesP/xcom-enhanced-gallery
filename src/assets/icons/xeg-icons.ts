/**
 * @fileoverview Lightweight SVG icon definitions for XEG (X.com Enhanced Gallery)
 * Replaces Heroicons dependency with minimal, tree-shakeable icon data.
 *
 * Icons are derived from Heroicons outline set but stored as static path data
 * to eliminate React dependency and reduce bundle size.
 */

export interface SvgPathDefinition {
  /** SVG path data (d attribute) */
  d: string;
  /** Optional fill color (defaults to 'none' if not specified) */
  fill?: string;
  /** Optional stroke-linecap value */
  strokeLinecap?: 'round' | 'square' | 'butt';
  /** Optional stroke-linejoin value */
  strokeLinejoin?: 'round' | 'bevel' | 'miter';
  /** Optional stroke-miterlimit value */
  strokeMiterlimit?: number;
}

export interface XegIconDefinition {
  /** SVG viewBox attribute */
  viewBox: string;
  /** Array of path definitions */
  paths: SvgPathDefinition[];
  /** Metadata/identifier for the icon */
  metadata: string;
}

/**
 * Icon definitions for core UI components
 * Based on Heroicons outline 24x24 with manual optimization
 */
export const XEG_ICONS: Record<string, XegIconDefinition> = {
  Download: {
    viewBox: '0 0 24 24',
    metadata: 'download',
    paths: [
      {
        d: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  Settings: {
    viewBox: '0 0 24 24',
    metadata: 'settings',
    paths: [
      {
        d: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      {
        d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  X: {
    viewBox: '0 0 24 24',
    metadata: 'close',
    paths: [
      {
        d: 'M6 18L18 6M6 6l12 12',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  ChevronLeft: {
    viewBox: '0 0 24 24',
    metadata: 'chevron-left',
    paths: [
      {
        d: 'M15.75 19.5L8.25 12l7.5-7.5',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  ChevronRight: {
    viewBox: '0 0 24 24',
    metadata: 'chevron-right',
    paths: [
      {
        d: 'M8.25 4.5l7.5 7.5-7.5 7.5',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  ZoomIn: {
    viewBox: '0 0 24 24',
    metadata: 'zoom-in',
    paths: [
      {
        d: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  ArrowAutofitWidth: {
    viewBox: '0 0 24 24',
    metadata: 'arrows-pointing-out',
    paths: [
      {
        d: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  ArrowAutofitHeight: {
    viewBox: '0 0 24 24',
    metadata: 'arrows-pointing-in',
    paths: [
      {
        d: 'M9 9l6-6m0 0h-4.5m4.5 0v4.5M9 15l6 6m0 0v-4.5m0 4.5h-4.5M9 9v6m6-6v6',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  ArrowsMaximize: {
    viewBox: '0 0 24 24',
    metadata: 'arrows-maximize',
    paths: [
      {
        d: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
  FileZip: {
    viewBox: '0 0 24 24',
    metadata: 'file-zip',
    paths: [
      {
        d: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    ],
  },
};

/**
 * Get icon definition by name
 * @param name - Icon name (must match keys in XEG_ICONS)
 * @returns Icon definition or undefined if not found
 */
export function getIconDefinition(name: string): XegIconDefinition | undefined {
  return XEG_ICONS[name];
}

/**
 * Check if an icon exists in the definitions
 * @param name - Icon name to check
 * @returns True if icon exists, false otherwise
 */
export function hasIconDefinition(name: string): boolean {
  return name in XEG_ICONS;
}

/**
 * Get all available icon names
 * @returns Array of all icon names
 */
export function getAvailableIconNames(): string[] {
  return Object.keys(XEG_ICONS);
}

/**
 * Alias for XEG_ICONS with lowercase keys for legacy compatibility
 */
export const XEG_ICON_DEFINITIONS: Record<string, XegIconDefinition> = {
  download: XEG_ICONS.Download!,
  settings: XEG_ICONS.Settings!,
  x: XEG_ICONS.X!,
  'chevron-left': XEG_ICONS.ChevronLeft!,
  'chevron-right': XEG_ICONS.ChevronRight!,
  'zoom-in': XEG_ICONS.ZoomIn!,
  'arrow-autofit-width': XEG_ICONS.ArrowAutofitWidth!,
  'arrow-autofit-height': XEG_ICONS.ArrowAutofitHeight!,
  'arrows-maximize': XEG_ICONS.ArrowsMaximize!,
  'file-zip': XEG_ICONS.FileZip!,
};
