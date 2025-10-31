export {
  gallerySignals,
  openGallery,
  closeGallery,
  navigateToItem,
  navigatePrevious,
  navigateNext,
  setFocusedIndex,
  setLoading,
  setError,
  setViewMode,
  // selectors
  getCurrentMediaItem,
  getCurrentIndex,
  getMediaItems,
  getMediaItemsCount,
  hasPreviousMedia,
  hasNextMedia,
  isGalleryOpen,
  isLoading,
  getError,
  getViewMode,
  // navigation helpers
  galleryIndexEvents,
  getNavigationState,
  getLastNavigationSource,
} from './signals/gallery.signals';
export type { NavigationSource } from './signals/gallery.signals';
export { toolbarState, setSettingsExpanded } from './signals/toolbar.signals';
export { downloadState } from './signals/download.signals';
/**
 * @fileoverview State Layer Exports
 * @description 상태 관리 관련 exports (명시적 내보내기만 허용)
 */
