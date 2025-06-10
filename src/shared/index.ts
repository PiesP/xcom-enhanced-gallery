/**
 * Shared Module Barrel Export
 *
 * 모든 shared 모듈을 중앙집중식으로 export합니다.
 * 이를 통해 다음과 같이 간편하게 import할 수 있습니다:
 *
 * @example
 * ```typescript
 * // 컴포넌트 import
 * import { Button, Toolbar } from '@shared/components';
 *
 * // 유틸리티 import
 * import { getFflate, createZipFromItems } from '@shared/utils';
 *
 * // 타입 import
 * import type { MediaInfo, ViewMode } from '@shared/types';
 *
 * // 또는 전체 import
 * import { Button, getFflate, type MediaInfo } from '@shared';
 * ```
 */

// Components
export * from './components';

// Utilities - ComponentChildren, ComponentType 중복 방지를 위해 명시적 export
export {
  // Auto theme utilities
  AutoThemeController,
  autoThemeHelpers,
  calculateContrastRatio,
  // ZIP utilities
  createZipFromItems,
  detectActualBackgroundColor,
  detectLightBackground,
  // Media utilities
  enhancedImageFilter,
  extractTweetId,
  extractTweetInfoFromUrl,
  // Pattern utilities
  extractTweetInfoUnified,
  // Filename utilities
  generateMediaFilename,
  generateZipFilename,
  // Vendor utilities
  getFflate,
  getNativeDownload,
  getPreact,
  getPreactHooks,
  getPreactSignals,
  // Accessibility utilities
  getRelativeLuminance,
  getTweetIdFromContainer,
  getVideoMediaEntry,
  getVideoUrlFromThumbnail,
  // Twitter utilities
  isVideoThumbnail,
  meetsWCAGAA,
  meetsWCAGAAA,
  parseColor,
  type TweetInfo,
  type TweetMediaEntry,
} from './utils';

// Types (중복 방지를 위해 특정 타입만 export)
export type {
  BaseComponentProps,
  GalleryTheme,
  ImageFitMode,
  MediaInfo,
  // ui.types에서 ButtonProps 제외 (components에서 이미 export됨)
  ToastType,
  ViewMode,
} from './types';
