/**
 * @fileoverview Public exports for gallery UI components and hooks.
 */

export { VerticalGalleryView } from './vertical-gallery-view/VerticalGalleryView';
export type { VerticalGalleryViewProps } from './vertical-gallery-view/VerticalGalleryView';

export { VerticalImageItem } from './vertical-gallery-view/VerticalImageItem';

export { KeyboardHelpOverlay } from './vertical-gallery-view/KeyboardHelpOverlay/KeyboardHelpOverlay';
export type { KeyboardHelpOverlayProps } from './vertical-gallery-view/KeyboardHelpOverlay/KeyboardHelpOverlay';

export { useGalleryKeyboard } from './vertical-gallery-view/hooks/useGalleryKeyboard';
export type { UseGalleryKeyboardOptions } from './vertical-gallery-view/hooks/useGalleryKeyboard';

export { useProgressiveImage } from './vertical-gallery-view/hooks/useProgressiveImage';
export type {
  ProgressiveImageOptions,
  ProgressiveImageResult,
} from './vertical-gallery-view/hooks/useProgressiveImage';
