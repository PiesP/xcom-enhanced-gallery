// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Re-exports from split state modules.
 *
 * This barrel file preserves backward compatibility for imports from
 * `@shared/state/signals/gallery.signals`. Prefer importing from the
 * specific sub-modules directly for better tree-shaking:
 *
 *   - `@shared/state/signals/gallery.state` — gallery open/close/navigate
 *   - `@shared/state/signals/navigation.state` — navigation source/timestamp
 *   - `@shared/state/signals/download.state` — download processing state
 */

export {
  downloadState,
  setDownloading,
} from './download.state';
export {
  closeGallery,
  disposeGallerySignals,
  type GalleryNavigateCompletePayload,
  type GalleryState,
  galleryIndexEvents,
  gallerySignals,
  navigateNext,
  navigatePrevious,
  navigateToItem,
  openGallery,
  setCurrentVideoElement,
  setError,
  setGalleryFocus,
} from './gallery.state';

export {
  type NavigationSource,
  recordNavigation,
  resetNavigation,
  resolveNavigationSource,
} from './navigation.state';
