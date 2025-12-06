/**
 * Entry point for gallery icons. Keep exports lean so consumers only grab what they use.
 *
 * Phase: Icon Consolidation v2.0
 * - Individual icon files deprecated in favor of consolidated hero-icons.tsx
 * - Unused icons removed: X, ChevronLeft/Right, DocumentText, FileZip, ZoomIn, Settings
 * - ~400 lines saved, ~2KB bundle reduction
 */

// Consolidated icon exports (new factory-based approach)
export {
  HeroArrowDownOnSquareStack as ArrowDownOnSquareStack,
  HeroArrowLeftOnRectangle as ArrowLeftOnRectangle,
  // Navigation
  HeroArrowSmallLeft as ArrowSmallLeft,
  HeroArrowSmallRight as ArrowSmallRight,
  // Sizing
  HeroArrowsPointingIn as ArrowsPointingIn,
  HeroArrowsPointingOut as ArrowsPointingOut,
  HeroArrowsRightLeft as ArrowsRightLeft,
  HeroArrowsUpDown as ArrowsUpDown,
  // Communication
  HeroChatBubbleLeftRight as ChatBubbleLeftRight,
  HeroCog6Tooth as Cog6Tooth,
  // Actions
  HeroDownload as ArrowDownTray,
  HeroDownload as Download,
} from './hero/hero-icons';

// Icon path data exports for advanced use cases
export { type AllIconNames, ICON_PATHS, type IconName, MULTI_PATH_ICONS } from './hero/icon-paths';

export type { IconProps } from './Icon';
export { Icon } from './Icon';
