/**
 * @fileoverview Shared Layer Exports
 * @version 4.1.0 - Phase 353: Export optimization and cleanup
 * @description Shared layer integrating all common functionality
 */

// ====================================
// Core UI Components
// ====================================

// Types
export type {
  StandardButtonProps,
  StandardToastProps,
  StandardToastContainerProps,
  StandardToolbarProps,
  IconProps,
  LazyIconProps,
  ButtonProps,
  IconButtonProps,
  ToastContainerProps,
  ToolbarProps,
  GalleryToolbarProps,
  FitMode,
} from './components/ui';

// Components & Constants
export { DEFAULT_SIZES, DEFAULT_VARIANTS, DEFAULT_TOAST_TYPES } from './components/ui';
export { Icon, LazyIcon, useIconPreload, useCommonIconPreload } from './components/ui';
export { Button, IconButton } from './components/ui';
export { Toast, ToastContainer } from './components/ui';
export { Toolbar } from './components/ui';

// ====================================
// Isolated Components (gallery-only)
// ====================================
export {
  GalleryContainer,
  mountGallery,
  unmountGallery,
  type GalleryContainerProps,
} from './components/isolation';

// ====================================
// HOC Components
// ====================================

export { withGallery } from './components/hoc';
export type { GalleryComponentProps } from './components/hoc';

// ====================================
// Services
// ====================================

// Types
export type {
  UsernameExtractionResult,
  MediaLoadingState,
  MediaLoadingOptions,
  PrefetchOptions,
  BulkDownloadOptions,
  DownloadResult,
  DownloadProgress,
  Theme,
  SupportedLanguage,
  LanguageStrings,
  BaseLanguageCode,
  ToastOptions,
  ToastItem,
  FilenameOptions,
  ZipFilenameOptions,
} from './services';

// Phase 380: TokenExtraction types moved to direct import
// import type { TokenExtractionResult, TokenValidationResult } from './services/token-extraction';

// Services
export { BaseServiceImpl } from './services';
// Phase 414: AnimationService removed (optional feature)
export { MediaService } from './services';
export { extractUsername, parseUsernameFast } from './services';
export { ThemeService } from './services';
export { LanguageService } from './services';
export {
  FocusObserverManager,
  createFocusObserverManager,
  FocusApplicatorService,
  createFocusApplicatorService,
  FocusStateManagerService,
  createFocusStateManagerService,
  toastManager,
  ToastManager,
} from './services';
export {
  FilenameService,
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
} from './services';

// Phase 380: TwitterTokenExtractor removed from barrel export (circular dependency)
// Direct import: import { TwitterTokenExtractor } from '@shared/services/token-extraction';
export { BrowserService } from './services';
export { CoreService } from './services';

// Storage & Infrastructure Services (Phase 360: StorageAdapter removed)
export { PersistentStorage, getPersistentStorage } from './services';

// Notification Service
export { NotificationService, getNotificationService } from './services';
export type { NotificationOptions, NotificationProviderInfo } from './services';

// Download Services
export {
  UnifiedDownloadService,
  unifiedDownloadService,
  DownloadService,
  downloadService,
} from './services';
export type {
  UnifiedDownloadOptions,
  UnifiedSingleDownloadResult,
  UnifiedBulkDownloadResult,
  BlobDownloadOptions,
  BlobDownloadResult,
} from './services';

// HTTP Request Service
export { HttpRequestService, getHttpRequestService, HttpError } from './services';
export type { HttpRequestOptions, BinaryRequestOptions, HttpResponse } from './services';

// ====================================
// State Management
// ====================================

// Types
export type { NavigationSource } from './state';

// State & Actions
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
  galleryIndexEvents,
  getNavigationState,
  getLastNavigationSource,
  toolbarState,
  setSettingsExpanded,
  downloadState,
} from './state';

// ====================================
// Logging System
// ====================================

// Types
export type { LogLevel, LoggableData, Logger as LoggerType, MemorySnapshot } from './logging';

// Logger & Utilities
export {
  LOG_LEVELS,
  createLogger,
  logger,
  defaultLogger,
  createScopedLogger,
  createScopedLoggerWithCorrelation,
  createCorrelationId,
  logError,
  measureMemory,
  logGroup,
  logTable,
  setLogLevel,
  getLogLevel,
} from './logging';

// ====================================
// Core Utilities
// ====================================

// Accessibility & DOM
export {
  rafThrottle,
  throttleScroll,
  createDebouncer,
  safeElementCheck,
  canTriggerGallery,
  isGalleryInternalElement,
} from './utils';

// Signal Selectors
export {
  createSelector,
  useSelector,
  useCombinedSelector,
  useAsyncSelector,
} from './utils/signal-selector';

// Focus Management
export { createFocusTrap } from './utils/focus-trap';
export type { FocusTrapOptions, FocusTrap } from './utils/focus-trap';
export { useFocusTrap } from './hooks/use-focus-trap';

// Toolbar Utilities
export { getToolbarDataState, getToolbarClassName } from './utils/toolbar-utils';
export type { ToolbarDataState } from './utils/toolbar-utils';

// ====================================
// Style Tokens
// ====================================

export {
  SPACING_TOKENS,
  RADIUS_TOKENS,
  getSpacing,
  getRadius,
  getSpacingVar,
  getRadiusVar,
} from './styles/tokens';
export type { SpacingToken, RadiusToken } from './styles/tokens';

// ====================================
// Types
// ====================================

export type {
  BaseComponentProps,
  GalleryTheme,
  ImageFitMode,
  MediaInfo,
  Result,
  MediaType,
  ToastType,
  ViewMode,
} from './types';
