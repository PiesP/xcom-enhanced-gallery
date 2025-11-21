/**
 * @fileoverview Collection of utilities
 * @description Simplified utilities collection suitable for userscripts
 * @version 2.0.0 - Complexity Reduction & Modularization
 */

// Re-export from new locations
export { removeDuplicateMediaItems } from './deduplication/deduplication-utils';
export {
  ensureGalleryScrollAvailable,
  isVideoControlElement,
  isGalleryInternalElement,
  canTriggerGallery,
  isGalleryContainer,
  isGalleryInternalEvent,
} from './dom/gallery-dom';
