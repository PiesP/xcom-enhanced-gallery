/**
 * Shared Utils Barrel Export
 *
 * 새로운 구조로 정리된 공통 유틸리티를 중앙집중식으로 export합니다.
 *
 * 구조:
 * - core/        : DOM, accessibility, theming 등 핵심 유틸리티
 * - media/       : 미디어 처리 및 파일명 생성
 * - patterns/    : 패턴 인식 및 Twitter/X.com 특화 기능
 * - vendors/     : 외부 라이브러리 접근점
 *
 * @example
 * ```typescript
 * // 카테고리별 import (권장)
 * import { lockPageScroll } from '@shared/utils/core';
 * import { enhancedImageFilter } from '@shared/utils/media';
 * import { extractTweetInfoFromUrl } from '@shared/utils/patterns';
 * import { getFflate } from '@infrastructure/external/vendors';
 *
 * // 또는 전체 import
 * import { lockPageScroll, enhancedImageFilter } from '@shared/utils';
 * ```
 */

// Core utilities (DOM, accessibility, theming)
export * from './core';

// Media processing utilities (images, videos, filenames)
export * from './media';

// Pattern recognition utilities (Twitter/X.com, URLs)
export * from './patterns';

// Debug and development utilities
export * from './debug/gallery-debug';

// Error handling utilities
export * from './error-handling';

// Performance utilities
export * from './performance';

// Browser management (통합 매니저)
export { BrowserManager, browserManager } from './BrowserManager';

// Initialization guard
export { InitializationGuard, initGuard } from './InitializationGuard';
