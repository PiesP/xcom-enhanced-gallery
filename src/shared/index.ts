/**
 * @fileoverview Shared Layer Exports
 * @version 4.1.0 - Phase 353: Export 최적화 및 정리
 * @description 모든 공통 기능을 통합한 Shared 레이어
 */

// ====================================
// 핵심 UI 컴포넌트들
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
// 격리 컴포넌트들 (갤러리 전용)
// ====================================
export {
  GalleryContainer,
  mountGallery,
  unmountGallery,
  type GalleryContainerProps,
} from './components/isolation';

// ====================================
// HOC 컴포넌트들
// ====================================

export { withGallery } from './components/hoc';
export type { GalleryComponentProps } from './components/hoc';

// ====================================
// 서비스들
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
  TokenExtractionResult,
  TokenValidationResult,
} from './services';

// Services
export { BaseService } from './services';
export { AnimationService, MediaService } from './services';
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
export { BrowserService, TwitterTokenExtractor } from './services';
export { CoreService } from './services';

// Storage & Infrastructure Services
export { UserscriptStorageAdapter } from './services';
export type { StorageAdapter, StorageUsage } from './services';
export { PersistentStorage, getPersistentStorage } from './services';

// Notification Service
export { NotificationService, getNotificationService } from './services';
export type {
  NotificationOptions,
  NotificationProvider,
  NotificationProviderInfo,
} from './services';

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
  TestModeDownloadOptions,
  TestModeDownloadResult,
} from './services';

// HTTP Request Service
export { HttpRequestService, getHttpRequestService, HttpError } from './services';
export type { HttpRequestOptions, BinaryRequestOptions, HttpResponse } from './services';

// Error Handling
export { formatErrorMessage, formatErrorForLogging, createErrorContext } from './services';
export type { ErrorContext, FormattedError } from './services';

// ====================================
// 상태 관리
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
// 로깅 시스템
// ====================================

// Types
export type {
  LogLevel,
  LoggableData,
  Logger as LoggerType,
  MemorySnapshot,
  TraceOptions,
} from './logging';

// Logger & Utilities
export {
  LOG_LEVELS,
  createLogger,
  logger,
  defaultLogger,
  createScopedLogger,
  createScopedLoggerWithCorrelation,
  createCorrelationId,
  measurePerformance as loggingMeasurePerformance,
  logError,
  measureMemory,
  logGroup,
  logTable,
  setLogLevel,
  getLogLevel,
  tracePoint,
  traceAsync,
  startFlowTrace,
  stopFlowTrace,
  traceStatus,
} from './logging';

// ====================================
// 핵심 유틸리티들
// ====================================

// Accessibility & DOM
export {
  detectLightBackground,
  getRelativeLuminance,
  parseColor,
  imageFilter,
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
  getGlobalSelectorStats,
  clearGlobalSelectorStats,
} from './utils/signal-selector';

// Focus Management
export { createFocusTrap } from './utils/focus-trap';
export type { FocusTrapOptions, FocusTrap } from './utils/focus-trap';
export { useFocusTrap } from './hooks/use-focus-trap';

// Toolbar Utilities
export { getToolbarDataState, getToolbarClassName } from './utils/toolbar-utils';
export type { ToolbarDataState } from './utils/toolbar-utils';

// ====================================
// 스타일 토큰들
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
// 타입들
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
