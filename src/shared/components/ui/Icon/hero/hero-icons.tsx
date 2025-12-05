/**
 * @fileoverview Consolidated Hero Icons using factory pattern
 * @description Reduces ~18 individual icon files to one factory module
 * @version 2.0.0 - Removed unused icons for bundle optimization
 * @module shared/components/ui/Icon/hero
 *
 * Consolidation benefits:
 * - ~400 lines saved
 * - ~2KB bundle reduction
 * - Single point of maintenance
 * - Tree-shakable exports
 */

import { Icon, type IconProps } from '@shared/components/ui/Icon/Icon';
import type { JSXElement } from '@shared/external/vendors';

import {
  ICON_PATHS,
  MULTI_PATH_ICONS,
  type AllIconNames,
  type IconName,
  type MultiPathIconName,
} from './icon-paths';

// Re-export types and paths for advanced use cases
export { ICON_PATHS, MULTI_PATH_ICONS, type AllIconNames, type IconName, type MultiPathIconName };

/**
 * Create a single-path icon component
 * @param name - Icon name from ICON_PATHS
 * @returns Icon component function
 */
function createSinglePathIcon(name: IconName): (props: IconProps) => JSXElement {
  return function IconComponent(props: IconProps): JSXElement {
    return (
      <Icon {...props}>
        <path d={ICON_PATHS[name]} />
      </Icon>
    );
  };
}

/**
 * Create a multi-path icon component
 * @param name - Icon name from MULTI_PATH_ICONS
 * @returns Icon component function
 */
function createMultiPathIcon(name: MultiPathIconName): (props: IconProps) => JSXElement {
  return function IconComponent(props: IconProps): JSXElement {
    return (
      <Icon {...props}>
        {MULTI_PATH_ICONS[name].map(pathData => (
          <path d={pathData} />
        ))}
      </Icon>
    );
  };
}

// ============================================================================
// Essential Icons (actively used in the application)
// ============================================================================

/** Download arrow pointing downward with tray */
export const HeroDownload = createSinglePathIcon('download');

/** Compact left arrow for navigation */
export const HeroArrowSmallLeft = createSinglePathIcon('arrowSmallLeft');

/** Compact right arrow for navigation */
export const HeroArrowSmallRight = createSinglePathIcon('arrowSmallRight');

/** Arrows pointing inward for shrink/actual-size */
export const HeroArrowsPointingIn = createSinglePathIcon('arrowsPointingIn');

/** Arrows pointing outward for expand/fullscreen */
export const HeroArrowsPointingOut = createSinglePathIcon('arrowsPointingOut');

/** Horizontal arrows for fit-width */
export const HeroArrowsRightLeft = createSinglePathIcon('arrowsRightLeft');

/** Vertical arrows for fit-height */
export const HeroArrowsUpDown = createSinglePathIcon('arrowsUpDown');

/** Down arrow on stacked squares for bulk download */
export const HeroArrowDownOnSquareStack = createSinglePathIcon('arrowDownOnSquareStack');

/** Arrow exiting rectangle for close/exit */
export const HeroArrowLeftOnRectangle = createSinglePathIcon('arrowLeftOnRectangle');

/** Dual speech bubbles for comments/conversations */
export const HeroChatBubbleLeftRight = createSinglePathIcon('chatBubbleLeftRight');

// ============================================================================
// Multi-path Icons
// ============================================================================

/** Detailed gear icon for settings/configuration */
export const HeroCog6Tooth = createMultiPathIcon('cog6Tooth');
