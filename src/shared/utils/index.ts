/**
 * Shared Utils Barrel Export
 *
 * 새로운 구조로 정리된 공통 유틸리티를 중앙집중식으로 export합니다.
 *
 * 구조:
 * - core/        : DOM, accessibility, theming 등 핵심 유틸리티
 * - media/       : 미디어 처리 및 파일명 생성
 * - patterns/    : 패턴 인식 및 Twitter/X.com 특화 기능
 * - external/    : 외부 라이브러리 및 ZIP 처리
 *
 * @example
 * ```typescript
 * // 카테고리별 import (권장)
 * import { lockPageScroll } from '@shared/utils/core';
 * import { enhancedImageFilter } from '@shared/utils/media';
 * import { extractTweetInfoFromUrl } from '@shared/utils/patterns';
 * import { getFflate } from '@shared/utils/external';
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

// External dependencies (vendors, ZIP)
export * from './external';
