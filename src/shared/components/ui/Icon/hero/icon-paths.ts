/**
 * @fileoverview Consolidated icon SVG paths (optimized)
 * @description Single source of truth for all Heroicon SVG paths
 * @version 2.0.0 - Removed unused icons, optimized path precision
 * @module shared/components/ui/Icon/hero
 */

/**
 * SVG path data for essential icons only
 * Unused icons removed to reduce bundle size
 */
export const ICON_PATHS = {
  // Actions - Download
  download:
    'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',

  // Navigation arrows (compact)
  arrowSmallLeft: 'M19.5 12H4.5m0 0l6.75 6.75M4.5 12l6.75-6.75',
  arrowSmallRight: 'M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75',

  // Sizing - Fit modes
  arrowsPointingIn:
    'M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25',
  arrowsPointingOut:
    'M3.75 3.75v4.5m0-4.5h4.5M3.75 3.75L9 9m-5.25 11.25v-4.5m0 4.5h4.5M3.75 20.25L9 15m11.25-11.25h-4.5m4.5 0v4.5M20.25 3.75L15 9m5.25 11.25h-4.5m4.5 0v-4.5M20.25 20.25L15 15',
  arrowsRightLeft:
    'M7.5 21L3 16.5M3 16.5l4.5-4.5M3 16.5h13.5M16.5 3l4.5 4.5M21 7.5l-4.5 4.5M21 7.5H7.5',
  arrowsUpDown:
    'M3 7.5l4.5-4.5M7.5 3l4.5 4.5M7.5 3v13.5M21 16.5l-4.5 4.5M16.5 21l-4.5-4.5M16.5 21V7.5',

  // Download variants
  arrowDownOnSquareStack:
    'M7.5 7.5h-.75a2.25 2.25 0 00-2.25 2.25v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m-6 3.75l3 3m0 0l3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75',

  // Exit/Close
  arrowLeftOnRectangle:
    'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3.75-6l-3 3m0 0l3 3m-3-3H21.75',

  // Communication (single path icons only)
} as const;

/**
 * Multi-path icons that require multiple <path> elements
 */
export const MULTI_PATH_ICONS = {
  chatBubbleLeftRight: ['M4 6h16v10H9l-5 5V6z', 'M8 10h8'],
  cog6Tooth: [
    'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z',
    'M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M4.2 19.8l2.1-2.1',
  ],
} as const;

export type IconName = keyof typeof ICON_PATHS;
export type MultiPathIconName = keyof typeof MULTI_PATH_ICONS;
export type AllIconNames = IconName | MultiPathIconName;
