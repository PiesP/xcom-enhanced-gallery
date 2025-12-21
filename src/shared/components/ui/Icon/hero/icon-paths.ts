/**
 * @fileoverview Compatibility layer for the legacy HeroIcon API
 *
 * The project migrated to Lucide icons, but some modules may still import
 * types from the old `Icon/hero` path.
 *
 * This file intentionally does NOT embed any Heroicons SVG path data.
 */

import type { LucideIconName } from '@shared/components/ui/Icon/lucide/icon-nodes';

/**
 * Legacy-to-Lucide name mapping.
 *
 * @deprecated Prefer using `LucideIcon` directly and passing Lucide icon names.
 */
export const HERO_TO_LUCIDE_ICON_NAME = {
  download: 'download',
  arrowSmallLeft: 'chevron-left',
  arrowSmallRight: 'chevron-right',

  arrowsPointingOut: 'maximize-2',
  arrowsPointingIn: 'minimize-2',
  arrowsRightLeft: 'move-horizontal',
  arrowsUpDown: 'move-vertical',

  arrowDownOnSquareStack: 'folder-down',
  cog6Tooth: 'settings-2',
  chatBubbleLeftRight: 'messages-square',
  arrowLeftOnRectangle: 'x',
} as const satisfies Record<string, LucideIconName>;

export type HeroIconName = keyof typeof HERO_TO_LUCIDE_ICON_NAME;

// Legacy exported names (kept to avoid churn in type-only imports)
export type IconName = HeroIconName;
export type MultiPathIconName = never;
export type AllIconNames = HeroIconName;

// Legacy constants (no longer used)
export const ICON_PATHS = {} as const;
export const MULTI_PATH_ICONS = {} as const;
