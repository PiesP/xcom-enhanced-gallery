/**
 * Entry point for gallery icons.
 *
 * Exports consolidated hero-icons.tsx components and icon path data.
 * Keep exports lean so consumers only grab what they use.
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
} from './hero/hero-icons';

export type { IconProps } from './Icon';
export { Icon } from './Icon';
