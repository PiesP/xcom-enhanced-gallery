/**
 * Entry point for gallery icons. Keep exports lean so consumers only grab what they use.
 *
 * Phase: Icon Consolidation
 * - Individual icon files deprecated in favor of consolidated hero-icons.tsx
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
  HeroChevronLeft as ChevronLeft,
  HeroChevronRight as ChevronRight,
  HeroCog6Tooth as Cog6Tooth,
  HeroDocumentText as DocumentText,
  // Actions
  HeroDownload as ArrowDownTray,
  HeroDownload as Download,
  // Files
  HeroFileZip as FileZip,
  HeroSettings as Settings,
  HeroX as X,
  HeroZoomIn as ZoomIn,
} from './hero/hero-icons';

// Icon path data exports for advanced use cases
export { ICON_PATHS, MULTI_PATH_ICONS, type AllIconNames, type IconName } from './hero/icon-paths';

export type { IconProps } from './Icon';
export { Icon } from './Icon';
