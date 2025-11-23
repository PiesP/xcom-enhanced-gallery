/**
 * Entry point for gallery icons. Keep exports lean so consumers only grab what they use.
 */

export { Icon } from "./Icon";
export type { IconProps } from "./Icon";

export { LazyIcon, useIconPreload, useCommonIconPreload } from "./lazy-icon";
export type { LazyIconProps } from "./lazy-icon";

// Navigation
export { HeroArrowSmallLeft as ArrowSmallLeft } from "./hero/HeroArrowSmallLeft";
export { HeroArrowSmallRight as ArrowSmallRight } from "./hero/HeroArrowSmallRight";
export { HeroChevronLeft as ChevronLeft } from "./hero/HeroChevronLeft";
export { HeroChevronRight as ChevronRight } from "./hero/HeroChevronRight";

// Actions
export { HeroDownload as Download } from "./hero/HeroDownload";
export { HeroDownload as ArrowDownTray } from "./hero/HeroDownload";
export { HeroArrowDownOnSquareStack as ArrowDownOnSquareStack } from "./hero/HeroArrowDownOnSquareStack";
export { HeroSettings as Settings } from "./hero/HeroSettings";
export { HeroCog6Tooth as Cog6Tooth } from "./hero/HeroCog6Tooth";
export { HeroX as X } from "./hero/HeroX";
export { HeroArrowLeftOnRectangle as ArrowLeftOnRectangle } from "./hero/HeroArrowLeftOnRectangle";
export { HeroZoomIn as ZoomIn } from "./hero/HeroZoomIn";

// Communication
export { HeroChatBubbleLeftRight as ChatBubbleLeftRight } from "./hero/HeroChatBubbleLeftRight";
export { HeroDocumentText as DocumentText } from "./hero/HeroDocumentText";

// Files
export { HeroFileZip as FileZip } from "./hero/HeroFileZip";

// Sizing
export { HeroArrowsPointingIn as ArrowsPointingIn } from "./hero/HeroArrowsPointingIn";
export { HeroArrowsRightLeft as ArrowsRightLeft } from "./hero/HeroArrowsRightLeft";
export { HeroArrowsUpDown as ArrowsUpDown } from "./hero/HeroArrowsUpDown";
export { HeroArrowsPointingOut as ArrowsPointingOut } from "./hero/HeroArrowsPointingOut";
