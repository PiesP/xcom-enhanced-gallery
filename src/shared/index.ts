/**
 * @fileoverview Shared Layer Exports
 * @version 4.0.0 - Phase 352: Named export 최적화
 * @description 모든 공통 기능을 통합한 Shared 레이어
 */

// ====================================
// 핵심 UI 컴포넌트들
// ====================================

export type {
  StandardButtonProps,
  StandardToastProps,
  StandardToastContainerProps,
  StandardToolbarProps,
} from './components/ui';

export { DEFAULT_SIZES, DEFAULT_VARIANTS, DEFAULT_TOAST_TYPES } from './components/ui';
export { Icon } from './components/ui';
export type { IconProps } from './components/ui';
export { LazyIcon, useIconPreload, useCommonIconPreload } from './components/ui';
export type { LazyIconProps } from './components/ui';
export { Button } from './components/ui';
export type { ButtonProps } from './components/ui';
export { IconButton } from './components/ui';
export type { IconButtonProps } from './components/ui';
export { Toast, ToastContainer } from './components/ui';
export type { ToastContainerProps } from './components/ui';
export { Toolbar } from './components/ui';
export type { ToolbarProps, GalleryToolbarProps, FitMode } from './components/ui';

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

export { withGallery, type GalleryComponentProps } from './components/hoc';

// ====================================
// 서비스들
// ====================================

export { BaseService } from './services';
export { AnimationService, MediaService } from './services';
export { extractUsername, parseUsernameFast } from './services';
export type {
  UsernameExtractionResult,
  MediaLoadingState,
  MediaLoadingOptions,
  PrefetchOptions,
  BulkDownloadOptions,
  DownloadResult,
  DownloadProgress,
} from './services';
export { ThemeService } from './services';
export type { Theme } from './services';
export { LanguageService } from './services';
export type { SupportedLanguage, LanguageStrings, BaseLanguageCode } from './services';
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
export type { ToastOptions, ToastItem } from './services';
export {
  FilenameService,
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
} from './services';
export type { FilenameOptions, ZipFilenameOptions } from './services';
export { BrowserService, TwitterTokenExtractor } from './services';
export type { TokenExtractionResult, TokenValidationResult } from './services';
export { CoreService } from './services';
export { type StorageAdapter, UserscriptStorageAdapter } from './services';
export { PersistentStorage, getPersistentStorage } from './services';
export type { StorageUsage } from './services';
export {
  NotificationService,
  getNotificationService,
  UnifiedDownloadService,
  unifiedDownloadService,
  DownloadService,
  downloadService,
  HttpRequestService,
  getHttpRequestService,
} from './services';
export type {
  NotificationOptions,
  NotificationProvider,
  NotificationProviderInfo,
  UnifiedDownloadOptions,
  UnifiedSingleDownloadResult,
  UnifiedBulkDownloadResult,
  BlobDownloadOptions,
  BlobDownloadResult,
  TestModeDownloadOptions,
  TestModeDownloadResult,
  HttpRequestOptions,
  BinaryRequestOptions,
  HttpResponse,
} from './services';
export {
  HttpError,
  formatErrorMessage,
  formatErrorForLogging,
  createErrorContext,
} from './services';
export type { ErrorContext, FormattedError } from './services';
export { logger, type ILogger, type Logger } from './services';

// ====================================
// 상태 관리
// ====================================

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
export type { NavigationSource } from './state';

// ====================================
// 로깅 시스템
// ====================================

export {
  LOG_LEVELS,
  createLogger,
  logger as loggingLogger,
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
export type {
  LogLevel,
  LoggableData,
  Logger as LoggerType,
  MemorySnapshot,
  TraceOptions,
} from './logging';
export { defaultLogger } from './logging';

// ====================================
// 핵심 유틸리티들
// ====================================

export {
  // 접근성 & DOM 유틸리티
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

// 새로운 P4-P7 유틸리티들
export {
  createSelector,
  useSelector,
  useCombinedSelector,
  useAsyncSelector,
  getGlobalSelectorStats,
  clearGlobalSelectorStats,
} from './utils/signal-selector';
export { createFocusTrap } from './utils/focus-trap';
export type { FocusTrapOptions, FocusTrap } from './utils/focus-trap';
export {
  getToolbarDataState,
  getToolbarClassName,
  type ToolbarDataState,
} from './utils/toolbar-utils';

// 새로운 P4-P7 훅들
export { useFocusTrap } from './hooks/use-focus-trap';

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
