# Phase 351-352: Media URL & Barrel Export Optimization

**마지막 업데이트**: 2025-11-04 | **상태**: 📋 계획 수립 완료 | **예상 기간**: 16-22시간

---

## 🎯 목표

### Priority 2: media-url.util.ts 분할 (6-8시간)
- **현재**: 1,118줄 단일 파일, 20개 export
- **목표**: 6개 모듈로 분리 (각 150-250줄)
- **효과**: 번들 -12%, 테스트 속도 +30%, 유지보수성 대폭 개선

### Priority 3: 배럴 Export 최적화 (10-14시간)
- **현재**: 50개 파일에서 `export *` 와일드카드 사용
- **목표**: 명시적 named export로 전환
- **효과**: 번들 -8~15%, tree-shaking 개선, 빌드 속도 향상

---

## 📊 현황 분석

### media-url.util.ts 구조

| 구분 | 함수 개수 | 주요 책임 |
|------|-----------|----------|
| **Extraction** | 2 | DOM에서 미디어 URL 추출 |
| **Classification** | 4 | URL 타입 분류 (이미지/비디오/이모지) |
| **Transformation** | 6 | URL 변환 (원본/고품질) |
| **Validation** | 3 | URL 유효성 검증 |
| **Quality** | 3 | 고품질 URL 선택 |
| **Factory** | 2 | MediaInfo 객체 생성 |

**총 라인**: 1,118줄
**Public Export**: 20개 함수/타입
**Internal Helper**: 15개+ 비공개 함수

### 배럴 Export 현황

| 파일 | `export *` 개수 | 영향도 |
|------|----------------|--------|
| `src/shared/index.ts` | 7 | 🔴 High (최상위) |
| `src/shared/types/index.ts` | 7 | 🔴 High (타입) |
| `src/shared/components/ui/index.ts` | 3 | 🟡 Medium |
| `src/shared/utils/accessibility/index.ts` | 4 | 🟢 Low |
| `src/shared/utils/performance/index.ts` | 5 | 🟢 Low |
| 기타 utils 하위 모듈 | 20+ | 🟢 Low |

**총 50개 파일** 에서 와일드카드 사용

---

## 🏗️ Phase 351: media-url.util.ts 모듈화

### Phase 351.1: 아키텍처 설계

#### 6계층 구조 (Phase 329 events.ts 참고)

```
src/shared/utils/media-url/
├── index.ts (배럴 export, 167줄 목표)
├── types.ts (타입 정의, 40줄)
├── extraction/
│   ├── index.ts (배럴)
│   └── dom-extractor.ts (200줄)
│       - getMediaUrlsFromTweet()
│       - extractMediaFromDocument()
├── classification/
│   ├── index.ts (배럴)
│   └── url-classifier.ts (180줄)
│       - classifyMediaUrl()
│       - isEmojiUrl()
│       - isVideoThumbnailUrl()
│       - shouldIncludeMediaUrl()
├── transformation/
│   ├── index.ts (배럴)
│   ├── image-transformer.ts (150줄)
│   │   - extractOriginalImageUrl()
│   │   - canExtractOriginalImage()
│   │   - extractMediaId()
│   │   - generateOriginalUrl()
│   └── video-transformer.ts (140줄)
│       - extractOriginalVideoUrl()
│       - canExtractOriginalVideo()
│       - convertThumbnailToVideoUrl()
│       - extractVideoIdFromThumbnail()
├── validation/
│   ├── index.ts (배럴)
│   └── url-validator.ts (120줄)
│       - isValidMediaUrl()
│       - isTwitterMediaUrl() (internal)
│       - validateUrlStructure() (internal)
├── quality/
│   ├── index.ts (배럴)
│   └── quality-selector.ts (160줄)
│       - getHighQualityMediaUrl()
│       - selectBestQualityVariant() (internal)
└── factory/
    ├── index.ts (배럴)
    └── media-info-factory.ts (180줄)
        - createMediaInfoFromImage()
        - createMediaInfoFromVideo()
        - generateMediaFilename() (helper)
        - cleanFilename()
```

#### 의존성 그래프

```
factory ──┐
          ├──> extraction (root)
quality ──┘
          ├──> validation ──> classification
transformation ────────────┘
```

### Phase 351.2: 함수 책임 매핑

#### Extraction Layer (DOM 추출)

**Public API** (2):
- `getMediaUrlsFromTweet(doc: Document | HTMLElement, tweetId: string): MediaInfo[]`
- `extractMediaFromDocument(root: HTMLElement): MediaInfo[]` (새로 추가)

**Internal Helpers** (5):
- `extractImagesFromDOM()` - Phase 1 이미지 추출
- `extractVideosFromDOM()` - Phase 2 비디오 추출
- `filterDuplicateMedia()` - 중복 제거
- `sortMediaByIndex()` - 인덱스 정렬
- `validateExtractionResult()` - 결과 검증

**의존성**:
```typescript
import { classifyMediaUrl, isEmojiUrl, isVideoThumbnailUrl } from '../classification';
import { createMediaInfoFromImage, createMediaInfoFromVideo } from '../factory';
import { isValidMediaUrl } from '../validation';
```

#### Classification Layer (URL 분류)

**Public API** (4):
- `classifyMediaUrl(url: string): MediaTypeResult`
- `isEmojiUrl(url: string): boolean`
- `isVideoThumbnailUrl(url: string): boolean`
- `shouldIncludeMediaUrl(url: string): boolean`

**Types**:
```typescript
export interface MediaTypeResult {
  type: 'image' | 'video' | 'gif' | 'unknown';
  format?: string;
  isAnimated: boolean;
}
```

**Internal Helpers** (3):
- `parseUrlExtension()` - 확장자 파싱
- `detectAnimatedFormat()` - GIF/APNG 감지
- `isTwitterVideoThumbnail()` - 비디오 썸네일 패턴 매칭

**의존성**:
```typescript
import { URL_PATTERNS } from '../../patterns/url-patterns';
```

#### Transformation Layer (URL 변환)

**Public API** (6):
- `extractOriginalImageUrl(url: string): string`
- `canExtractOriginalImage(url: string): boolean`
- `extractOriginalVideoUrl(url: string): string`
- `canExtractOriginalVideo(url: string): boolean`
- `convertThumbnailToVideoUrl(thumbnailUrl: string): string | null`
- `extractVideoIdFromThumbnail(url: string): string | null`

**Internal Helpers** (8):
- `removeQueryParameters()` - 쿼리 제거
- `replaceFormatSuffix()` - 포맷 변경 (jpg→orig)
- `extractMediaIdFromUrl()` - ID 추출
- `reconstructOriginalUrl()` - URL 재구성
- `parseVideoUrlVariants()` - 비디오 variant 파싱
- `selectHighestBitrate()` - 최고 비트레이트 선택
- `normalizeVideoUrl()` - URL 정규화
- `validateTransformedUrl()` - 변환 결과 검증

**의존성**:
```typescript
import { isValidMediaUrl } from '../validation';
import { classifyMediaUrl } from '../classification';
```

#### Validation Layer (검증)

**Public API** (1):
- `isValidMediaUrl(url: string): boolean`

**Internal Helpers** (4):
- `isTwitterMediaUrl(url: string): boolean` - 트위터 도메인 검증
- `validateUrlStructure(url: string): boolean` - URL 구조 검증
- `checkMediaPathPattern(url: string): boolean` - 미디어 경로 패턴
- `verifyUrlProtocol(url: string): boolean` - 프로토콜 검증 (https)

**의존성**:
```typescript
import { URL_PATTERNS } from '../../patterns/url-patterns';
```

#### Quality Layer (고품질 선택)

**Public API** (1):
- `getHighQualityMediaUrl(url: string, type: 'image' | 'video'): string`

**Internal Helpers** (6):
- `selectBestQualityVariant()` - 최적 품질 variant
- `extractAvailableQualities()` - 가능한 품질 목록
- `rankQualityOptions()` - 품질 순위
- `applyQualityTransformation()` - 품질 변환 적용
- `validateQualityUrl()` - 품질 URL 검증
- `fallbackToOriginal()` - 원본으로 fallback

**의존성**:
```typescript
import { extractOriginalImageUrl, extractOriginalVideoUrl } from '../transformation';
import { canExtractOriginalImage, canExtractOriginalVideo } from '../transformation';
import { classifyMediaUrl } from '../classification';
```

#### Factory Layer (MediaInfo 생성)

**Public API** (2):
- `createMediaInfoFromImage(img: HTMLImageElement, tweetId: string, index: number): MediaInfo | null`
- `createMediaInfoFromVideo(video: HTMLVideoElement, tweetId: string, index: number): MediaInfo | null`

**Internal Helpers** (5):
- `generateMediaFilename(options: FilenameOptions): string` - 파일명 생성
- `cleanFilename(filename: string): string` - 파일명 정리
- `extractUsernameFromContext()` - 사용자명 추출
- `buildMediaMetadata()` - 메타데이터 구성
- `validateMediaInfo()` - MediaInfo 검증

**의존성**:
```typescript
import { getMediaFilenameService } from '@shared/container/service-accessors';
import { getPreferredUsername } from '../../../media/username-source';
import { extractOriginalImageUrl, extractOriginalVideoUrl } from '../transformation';
import { getHighQualityMediaUrl } from '../quality';
import type { MediaInfo, FilenameOptions } from '../types';
```

### Phase 351.3: 타입 정의 분리

**`src/shared/utils/media-url/types.ts`** (40줄):

```typescript
/**
 * Media URL Utility Types
 *
 * Phase 351: Modularization - Type Definitions
 */

// Re-export from shared types
export type { MediaInfo } from '@shared/types';

// FilenameOptions (기존 re-export)
export type { FilenameOptions } from '@shared/services/file-naming';

// Classification types
export interface MediaTypeResult {
  type: 'image' | 'video' | 'gif' | 'unknown';
  format?: string;
  isAnimated: boolean;
}

// Quality selection types
export interface QualityVariant {
  url: string;
  bitrate: number;
  width?: number;
  height?: number;
}

export interface QualitySelectionOptions {
  preferredFormat?: 'jpg' | 'png' | 'webp';
  maxSize?: number;
  allowAnimated?: boolean;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Internal extraction types
export interface MediaExtractionContext {
  tweetId: string;
  rootElement: HTMLElement;
  mediaIndex: number;
}
```

### Phase 351.4: 배럴 Export 구조

**`src/shared/utils/media-url/index.ts`** (167줄, Phase 329 events.ts 참고):

```typescript
/**
 * Media URL Utility Module
 *
 * Phase 351: Modularization - Barrel Export
 *
 * @fileoverview 트윗에서 미디어 URL 추출, 분류, 변환, 검증을 담당하는 모듈화된 유틸리티
 * @version 2.0.0 - Phase 351: 6-layer modularization
 */

// ===== Type Exports =====
export type { MediaInfo, FilenameOptions, MediaTypeResult } from './types';

// ===== Extraction Layer =====
export {
  getMediaUrlsFromTweet,
  extractMediaFromDocument,
} from './extraction';

// ===== Classification Layer =====
export {
  classifyMediaUrl,
  isEmojiUrl,
  isVideoThumbnailUrl,
  shouldIncludeMediaUrl,
} from './classification';

// ===== Transformation Layer =====
export {
  extractOriginalImageUrl,
  canExtractOriginalImage,
  extractOriginalVideoUrl,
  canExtractOriginalVideo,
  convertThumbnailToVideoUrl,
  extractVideoIdFromThumbnail,
} from './transformation';

// ===== Validation Layer =====
export {
  isValidMediaUrl,
} from './validation';

// ===== Quality Layer =====
export {
  getHighQualityMediaUrl,
} from './quality';

// ===== Factory Layer =====
export {
  createMediaInfoFromImage,
  createMediaInfoFromVideo,
  cleanFilename,
} from './factory';

/**
 * Public API 요약
 *
 * **Extraction** (2):
 * - getMediaUrlsFromTweet() - DOM에서 미디어 추출
 * - extractMediaFromDocument() - HTML 요소 기반 추출
 *
 * **Classification** (4):
 * - classifyMediaUrl() - URL 타입 분류
 * - isEmojiUrl() - 이모지 URL 판별
 * - isVideoThumbnailUrl() - 비디오 썸네일 판별
 * - shouldIncludeMediaUrl() - 미디어 포함 여부
 *
 * **Transformation** (6):
 * - extractOriginalImageUrl() - 원본 이미지 URL
 * - canExtractOriginalImage() - 원본 추출 가능 여부
 * - extractOriginalVideoUrl() - 원본 비디오 URL
 * - canExtractOriginalVideo() - 원본 비디오 추출 가능 여부
 * - convertThumbnailToVideoUrl() - 썸네일→비디오 변환
 * - extractVideoIdFromThumbnail() - 비디오 ID 추출
 *
 * **Validation** (1):
 * - isValidMediaUrl() - URL 유효성 검증
 *
 * **Quality** (1):
 * - getHighQualityMediaUrl() - 고품질 URL 선택
 *
 * **Factory** (3):
 * - createMediaInfoFromImage() - 이미지 MediaInfo 생성
 * - createMediaInfoFromVideo() - 비디오 MediaInfo 생성
 * - cleanFilename() - 파일명 정리
 */
```

### Phase 351.5: 후방호환성 유지

**`src/shared/utils/media/media-url.util.ts`** (배럴 re-export):

```typescript
/**
 * Media URL Utility (Legacy Barrel)
 *
 * Phase 351: Backward Compatibility Layer
 *
 * @deprecated 이 파일은 후방호환성을 위해 유지됩니다.
 * 새 코드는 '@shared/utils/media-url' 에서 직접 import하세요.
 *
 * @example
 * // ❌ Old (deprecated)
 * import { getMediaUrlsFromTweet } from '@shared/utils/media/media-url.util';
 *
 * // ✅ New (recommended)
 * import { getMediaUrlsFromTweet } from '@shared/utils/media-url';
 */

// Re-export all from new modular structure
export * from '../media-url';

// Legacy compatibility
export type { FilenameOptions } from '../media-url/types';
```

**`src/shared/utils/media/index.ts`** 업데이트:

```typescript
// Media URL utilities (Phase 351: Modular structure)
export {
  getHighQualityMediaUrl,
  getMediaUrlsFromTweet,
  isValidMediaUrl,
  isEmojiUrl,
  isVideoThumbnailUrl,
  extractVideoIdFromThumbnail,
  convertThumbnailToVideoUrl,
  classifyMediaUrl,
  shouldIncludeMediaUrl,
  type MediaTypeResult,
} from '../media-url'; // ✅ 새 경로

// Legacy re-export (backward compatibility)
export * from './media-url.util'; // ⚠️ 호환성
```

### Phase 351.6: 단위 테스트 구조

**`test/unit/shared/utils/media-url/`** (120+ cases):

```
├── extraction/
│   ├── dom-extractor.test.ts (30 cases)
│   │  ├─ getMediaUrlsFromTweet (이미지, 비디오, 혼합)
│   │  ├─ 중복 제거
│   │  ├─ 이모지 제외 (Phase 331)
│   │  ├─ 비디오 썸네일 제외 (Phase 332)
│   │  └─ 에러 처리
│   └── index.test.ts (배럴 import 검증)
├── classification/
│   ├── url-classifier.test.ts (25 cases)
│   │  ├─ classifyMediaUrl (이미지, 비디오, GIF)
│   │  ├─ isEmojiUrl (twemoji, 커스텀)
│   │  ├─ isVideoThumbnailUrl (패턴 매칭)
│   │  └─ shouldIncludeMediaUrl (필터링)
│   └── index.test.ts
├── transformation/
│   ├── image-transformer.test.ts (20 cases)
│   │  ├─ extractOriginalImageUrl (jpg, png, webp)
│   │  ├─ canExtractOriginalImage (format=jpg/png)
│   │  ├─ extractMediaId (ID 추출)
│   │  └─ generateOriginalUrl (재구성)
│   ├── video-transformer.test.ts (18 cases)
│   │  ├─ extractOriginalVideoUrl (variant 파싱)
│   │  ├─ canExtractOriginalVideo (m3u8 지원)
│   │  ├─ convertThumbnailToVideoUrl (썸네일→비디오)
│   │  └─ extractVideoIdFromThumbnail
│   └── index.test.ts
├── validation/
│   ├── url-validator.test.ts (15 cases)
│   │  ├─ isValidMediaUrl (트위터 도메인)
│   │  ├─ isTwitterMediaUrl (internal)
│   │  ├─ validateUrlStructure (프로토콜, 경로)
│   │  └─ 에지 케이스
│   └── index.test.ts
├── quality/
│   ├── quality-selector.test.ts (18 cases)
│   │  ├─ getHighQualityMediaUrl (이미지, 비디오)
│   │  ├─ selectBestQualityVariant (비트레이트)
│   │  ├─ fallbackToOriginal (실패 시)
│   │  └─ 품질 순위
│   └── index.test.ts
└── factory/
    ├── media-info-factory.test.ts (22 cases)
    │  ├─ createMediaInfoFromImage (MediaInfo 생성)
    │  ├─ createMediaInfoFromVideo (비디오 메타)
    │  ├─ generateMediaFilename (파일명)
    │  ├─ cleanFilename (특수문자)
    │  └─ validateMediaInfo
    └── index.test.ts
```

**테스트 환경**: JSDOM + Vitest + setupGlobalTestIsolation()

### Phase 351.7: 마이그레이션 가이드

#### 기존 코드 (변경 불필요)

```typescript
// ✅ 기존 import 경로는 모두 동작 (후방호환)
import { getMediaUrlsFromTweet } from '@shared/utils/media/media-url.util';
import { classifyMediaUrl } from '@shared/utils/media';
```

#### 권장 코드 (새 프로젝트)

```typescript
// ✅ 새 모듈화 구조 (tree-shaking 최적화)
import { getMediaUrlsFromTweet } from '@shared/utils/media-url';
import { classifyMediaUrl } from '@shared/utils/media-url/classification';

// ✅ 특정 계층만 import (번들 크기 최소화)
import { extractOriginalImageUrl } from '@shared/utils/media-url/transformation';
import { isValidMediaUrl } from '@shared/utils/media-url/validation';
```

### Phase 351.8: 성능 목표

| 지표 | Before | After | 개선 |
|------|--------|-------|------|
| **파일 크기** | 1,118줄 | 6×180줄 평균 | -15% (모듈화 + 중복 제거) |
| **번들 크기** | 100% | 88% | -12% (tree-shaking) |
| **테스트 속도** | 100% | 130% | +30% (병렬화) |
| **책임 분리** | 6가지 혼재 | 1가지/파일 | SRP 준수 |
| **유지보수성** | Medium | High | 명확한 계층 |

---

## 🏛️ Phase 352: 배럴 Export 최적화

### Phase 352.1: 분석 대상 파일 (50개)

#### 🔴 High Priority (14개, 4-6시간)

| 파일 | `export *` | 영향도 | 예상 시간 |
|------|-----------|--------|----------|
| `src/shared/index.ts` | 7 | Critical | 90분 |
| `src/shared/types/index.ts` | 7 | Critical | 60분 |
| `src/shared/services/index.ts` | 12 | High | 90분 |
| `src/shared/components/ui/index.ts` | 3 | High | 60분 |
| `src/shared/state/index.ts` | 5 | High | 45분 |
| `src/features/gallery/index.ts` | 2 | Medium | 30분 |
| `src/features/settings/index.ts` | 1 | Medium | 20분 |

#### 🟡 Medium Priority (18개, 3-4시간)

| 파일 | `export *` | 영향도 | 예상 시간 |
|------|-----------|--------|----------|
| `src/shared/utils/accessibility/index.ts` | 4 | Medium | 30분 |
| `src/shared/utils/performance/index.ts` | 5 | Medium | 40분 |
| `src/shared/utils/browser/index.ts` | 2 | Low | 20분 |
| `src/shared/utils/styles/index.ts` | 1 | Low | 15분 |
| `src/shared/utils/deduplication/index.ts` | 1 | Low | 15분 |
| `src/shared/utils/scroll/index.ts` | 1 | Low | 15분 |
| `src/shared/logging/index.ts` | 2 | Medium | 25분 |
| `src/shared/external/index.ts` | 2 | Low | 20분 |
| `src/shared/constants/index.ts` | 1 | Medium | 20분 |

#### 🟢 Low Priority (18개, 2-3시간)

- 나머지 utils 하위 모듈들
- 테스트 헬퍼 모듈들
- 타입 정의 모듈들 (type-only export)

### Phase 352.2: shared/index.ts 최적화 (90분)

#### Before (7개 와일드카드)

```typescript
// 핵심 UI 컴포넌트들
export * from './components/ui';

// 격리 컴포넌트들
export * from './components/isolation';

// HOC 컴포넌트들
export * from './components/hoc';

// 서비스들
export * from './services';

// 상태 관리
export * from './state';

// 로깅 시스템
export * from './logging';

// 스타일 토큰
export * from './styles/tokens';
```

#### After (명시적 export)

```typescript
/**
 * @fileoverview Shared Layer Exports
 * @version 3.1.0 - Phase 352: Explicit named exports
 */

// ===== UI Components (from ./components/ui) =====
export {
  // Core UI
  Button,
  Dropdown,
  // Media components
  Image,
  Video,
  // Toolbar
  Toolbar,
  ToolbarButton,
  // Types
  type ButtonProps,
  type DropdownProps,
  type ImageProps,
  type VideoProps,
  type ToolbarProps,
} from './components/ui';

// ===== Isolation Components =====
export {
  GalleryRoot,
  IsolatedGallery,
  type GalleryRootProps,
} from './components/isolation';

// ===== HOC Components =====
export {
  withErrorBoundary,
  withPortal,
  type ErrorBoundaryProps,
} from './components/hoc';

// ===== Services =====
export {
  // Storage
  PersistentStorage,
  // Notifications
  NotificationService,
  notificationService, // singleton
  // Downloads
  DownloadService,
  downloadService, // singleton
  UnifiedDownloadService,
  BulkDownloadService,
  // HTTP
  HttpRequestService,
  httpRequestService, // singleton
  // Media
  MediaService,
  mediaService, // singleton
  // Theme
  ThemeService,
  // Language
  LanguageService,
  // Animation
  AnimationService,
  // Types
  type DownloadOptions,
  type NotificationOptions,
  type HttpRequestOptions,
} from './services';

// ===== State Management =====
export {
  // Gallery state
  galleryState,
  useGalleryState,
  // Settings state
  settingsState,
  useSettingsState,
  // UI state
  uiState,
  useUIState,
  // Types
  type GalleryState,
  type SettingsState,
  type UIState,
} from './state';

// ===== Logging =====
export {
  logger,
  createLogger,
  FlowTracer,
  type Logger,
  type LogLevel,
} from './logging';

// ===== Style Tokens =====
export {
  // Design tokens
  DESIGN_TOKENS,
  // CSS variables
  CSS_VARIABLES,
  // Animation presets
  ANIMATION_PRESETS,
  // Types
  type DesignToken,
  type CSSVariable,
} from './styles/tokens';

// ===== Core Utilities (Phase 326.7) =====
export {
  // Accessibility
  detectLightBackground,
  getRelativeLuminance,
  parseColor,
  // Performance
  rafThrottle,
  throttleScroll,
  createDebouncer,
  // DOM utilities
  safeElementCheck,
  canTriggerGallery,
  isGalleryInternalElement,
  // Selectors (Phase 350)
  createSelector,
  useSelector,
  useCombinedSelector,
  // Type guards
  isMediaInfo,
  isValidTweetId,
  // Hooks
  useKeyboardNavigation,
  useFocusTrap,
  useMediaQuery,
} from './utils';
```

**변경 사항**:
- 7개 와일드카드 → 120+ 명시적 export
- 타입 export는 `type` 키워드 명시
- 주석으로 계층 구분
- 알파벳 순서 정렬 (그룹 내)

### Phase 352.3: types/index.ts 최적화 (60분)

#### Before (7개 와일드카드)

```typescript
export * from './media.types';
export * from './app.types';
export * from './ui.types';
export * from './component.types';
export * from './navigation.types';
export * from './toolbar.types';
export * from './core/userscript.d';
```

#### After (명시적 type export)

```typescript
/**
 * @fileoverview Shared Type Exports
 * @version 2.1.0 - Phase 352: Explicit type exports
 */

// ===== Media Types =====
export type {
  MediaInfo,
  MediaType,
  MediaQuality,
  VideoVariant,
  TweetMediaEntry,
  QuoteTweetInfo,
} from './media.types';

// ===== App Types =====
export type {
  AppConfig,
  AppState,
  AppServiceKey,
  ErrorBoundaryState,
} from './app.types';

// ===== UI Types =====
export type {
  Position,
  Size,
  Rect,
  Alignment,
  Direction,
  Orientation,
} from './ui.types';

// ===== Component Types =====
export type {
  ComponentProps,
  ComponentState,
  ComponentRef,
  ComponentLifecycle,
} from './component.types';

// ===== Navigation Types =====
export type {
  NavigationState,
  NavigationDirection,
  NavigationEvent,
  KeyboardNavigationOptions,
} from './navigation.types';

// ===== Toolbar Types =====
export type {
  ToolbarProps,
  ToolbarState,
  ToolbarButtonProps,
  ToolbarPosition,
} from './toolbar.types';

// ===== Core Types (Userscript) =====
export type {
  GMDownloadOptions,
  GMNotificationOptions,
  GMXMLHttpRequestOptions,
  GMInfo,
} from './core/userscript.d';
```

**중요**: 타입만 export → 런타임 번들 크기 0

### Phase 352.4: services/index.ts 최적화 (90분)

**현재**: `export * from './media-extraction'` 등 12개 와일드카드

**목표**: 80+ 명시적 export

```typescript
/**
 * @fileoverview Service Layer Exports
 * @version 2.1.0 - Phase 352: Explicit service exports
 */

// ===== Storage Services =====
export {
  PersistentStorage,
  type StorageOptions,
  type StorageResult,
} from './persistent-storage';

// ===== Notification Services =====
export {
  NotificationService,
  notificationService, // singleton instance
  type NotificationOptions,
  type NotificationType,
} from './notification-service';

// ===== Download Services =====
export {
  DownloadService,
  downloadService, // singleton instance
  type DownloadOptions,
  type DownloadResult,
  type BlobDownloadOptions,
} from './download-service';

export {
  UnifiedDownloadService,
  type UnifiedDownloadOptions,
} from './unified-download-service';

export {
  BulkDownloadService,
  type BulkDownloadOptions,
  type BulkDownloadProgress,
} from './bulk-download-service';

// ===== HTTP Request Service =====
export {
  HttpRequestService,
  httpRequestService, // singleton instance
  HttpError,
  type HttpRequestOptions,
  type HttpResponse,
  type HttpMethod,
  type ResponseType,
} from './http-request-service';

// ===== Media Services =====
export {
  MediaService,
  mediaService, // singleton instance
  type MediaServiceOptions,
} from './media';

export {
  MediaExtractionService,
  type MediaExtractionOptions,
  type MediaExtractionResult,
} from './media-extraction';

export {
  MediaFilenameService,
  type FilenameOptions,
  type FilenameTemplate,
} from './file-naming';

// ===== Theme Service =====
export {
  ThemeService,
  type ThemeOptions,
  type Theme,
} from './theme-service';

// ===== Language Service =====
export {
  LanguageService,
  type SupportedLanguage,
  type LanguageStrings,
} from './language-service';

// ===== Animation Service =====
export {
  AnimationService,
  type AnimationOptions,
  type AnimationPreset,
} from './animation-service';
```

### Phase 352.5: utils 하위 모듈 최적화 (2-3시간)

#### accessibility/index.ts

```typescript
// Before
export * from './color-contrast';
export * from './keyboard-navigation';
export * from './aria-helpers';
export * from './focus-restore-manager';

// After
export {
  detectLightBackground,
  getRelativeLuminance,
  parseColor,
  getContrastRatio,
  type ColorInfo,
} from './color-contrast';

export {
  handleKeyboardNavigation,
  isNavigationKey,
  type KeyboardNavigationOptions,
} from './keyboard-navigation';

export {
  setAriaLabel,
  setAriaDescribedBy,
  announceToScreenReader,
  type AriaAttributes,
} from './aria-helpers';

export {
  FocusRestoreManager,
  type FocusRestoreOptions,
} from './focus-restore-manager';
```

#### performance/index.ts

```typescript
// Before
export * from './performance-utils';
export * from './preload';
export * from './idle-scheduler';
export * from './schedulers';
export * from './prefetch-bench';

// After
export {
  rafThrottle,
  throttleScroll,
  createDebouncer,
  measurePerformance,
  type ThrottleOptions,
} from './performance-utils';

export {
  preloadImage,
  preloadVideo,
  type PreloadOptions,
} from './preload';

export {
  scheduleIdleTask,
  cancelIdleTask,
  type IdleTaskOptions,
} from './idle-scheduler';

export {
  scheduleTask,
  createTaskScheduler,
  type TaskPriority,
} from './schedulers';

export {
  benchmarkPrefetch,
  type BenchmarkResult,
} from './prefetch-bench';
```

### Phase 352.6: 검증 스크립트

**`scripts/validate-barrel-exports.js`** (새로 생성):

```javascript
#!/usr/bin/env node
/**
 * Phase 352: Barrel Export Validation
 *
 * 와일드카드 export 감지 및 명시적 export 검증
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');

function findWildcardExports(dir, results = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findWildcardExports(fullPath, results);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      const content = readFileSync(fullPath, 'utf-8');
      const wildcardMatches = content.match(/export \* from/g);

      if (wildcardMatches) {
        const relativePath = relative(rootDir, fullPath);
        results.push({
          file: relativePath,
          count: wildcardMatches.length,
        });
      }
    }
  }

  return results;
}

console.log('🔍 Scanning for wildcard exports...\n');
const wildcards = findWildcardExports(srcDir);

if (wildcards.length === 0) {
  console.log('✅ No wildcard exports found!');
  process.exit(0);
}

console.log(`⚠️  Found ${wildcards.length} files with wildcard exports:\n`);
wildcards.sort((a, b) => b.count - a.count);

for (const { file, count } of wildcards) {
  console.log(`  ${count}× ${file}`);
}

console.log(`\n📊 Total: ${wildcards.reduce((sum, w) => sum + w.count, 0)} wildcard exports`);
process.exit(1);
```

**사용**:

```bash
# 검증
node scripts/validate-barrel-exports.js

# npm script 추가 (package.json)
"scripts": {
  "validate:barrels": "node scripts/validate-barrel-exports.js"
}
```

### Phase 352.7: 번들 크기 분석

#### Before (Baseline)

```bash
npm run build
npx vite-bundle-visualizer
```

**예상 결과**:
- `shared/index.ts` → 450KB (압축 전)
- `types/index.ts` → 0KB (type-only)
- `services/index.ts` → 280KB

#### After (Phase 352 완료)

**예상 결과**:
- `shared/index.ts` → 390KB (-60KB, -13%)
- `types/index.ts` → 0KB (동일)
- `services/index.ts` → 245KB (-35KB, -12%)

**총 번들 크기**: -95KB (-10~12%)

### Phase 352.8: 마이그레이션 체크리스트

#### 코드 변경 (필수)

- [ ] `src/shared/index.ts` - 7개 와일드카드 제거
- [ ] `src/shared/types/index.ts` - 7개 와일드카드 제거
- [ ] `src/shared/services/index.ts` - 12개 와일드카드 제거
- [ ] `src/shared/components/ui/index.ts` - 3개 와일드카드 제거
- [ ] `src/shared/state/index.ts` - 5개 와일드카드 제거

#### 검증 (자동화)

- [ ] `npm run typecheck` - 타입 에러 0
- [ ] `npm run lint` - ESLint 경고 0
- [ ] `npm test` - 모든 테스트 통과
- [ ] `npm run build` - 번들 크기 -8~15%
- [ ] `node scripts/validate-barrel-exports.js` - 와일드카드 0

#### 성능 측정

- [ ] Before/After 번들 크기 비교 (vite-bundle-visualizer)
- [ ] Tree-shaking 효과 검증 (사용하지 않는 export 제거)
- [ ] 빌드 시간 측정 (Before/After)

---

## 📅 타임라인

### Week 1 (Phase 351: media-url.util.ts)

| Day | Phase | 작업 | 시간 |
|-----|-------|------|------|
| 1 | 351.1-351.2 | 아키텍처 설계 + 함수 매핑 | 2시간 |
| 1-2 | 351.3 | 타입 정의 분리 | 1시간 |
| 2-3 | 351.4 | 6개 모듈 파일 생성 + 함수 마이그레이션 | 4시간 |
| 3 | 351.5 | 배럴 export 생성 + 후방호환성 | 1시간 |
| 4 | 351.6 | 단위 테스트 작성 (120+ cases) | 3시간 |
| 4-5 | 351.7 | 검증 및 마이그레이션 가이드 | 2시간 |

**총 소요 시간**: 13시간 (예상 6-8시간 초과, 버퍼 포함)

### Week 2 (Phase 352: Barrel Export)

| Day | Phase | 작업 | 시간 |
|-----|-------|------|------|
| 1 | 352.1 | Export 사용 분석 (50개 파일) | 2시간 |
| 1-2 | 352.2 | shared/index.ts 최적화 | 1.5시간 |
| 2 | 352.3 | types/index.ts 최적화 | 1시간 |
| 2-3 | 352.4 | services/index.ts 최적화 | 1.5시간 |
| 3-4 | 352.5 | utils 하위 모듈 최적화 (18개) | 3시간 |
| 4 | 352.6 | 검증 스크립트 작성 | 1시간 |
| 5 | 352.7 | 번들 크기 분석 | 1시간 |
| 5 | 352.8 | 최종 검증 + 문서화 | 1시간 |

**총 소요 시간**: 12시간 (예상 10-14시간 내)

---

## 🎯 성공 기준

### Phase 351 (media-url.util.ts)

- ✅ 1,118줄 → 6×180줄 평균 (모듈화)
- ✅ 번들 크기 -12% 이상
- ✅ 테스트 속도 +30% 이상
- ✅ 120+ 단위 테스트 cases
- ✅ 후방호환성 유지 (기존 import 동작)
- ✅ 타입 에러 0, 린트 경고 0

### Phase 352 (Barrel Export)

- ✅ 50개 파일 와일드카드 제거
- ✅ 번들 크기 -8~15%
- ✅ Tree-shaking 개선 (미사용 코드 제거)
- ✅ 빌드 시간 동일 또는 개선
- ✅ 모든 테스트 통과 (회귀 없음)

---

## 📚 참고 자료

### 기존 성공 사례

- **Phase 329**: events.ts 모듈화 (1,053줄 → 167줄, -84%)
- **Phase 342**: QuoteTweetDetector (561줄, 92 test cases)
- **Phase 309**: Service Layer (Tampermonkey API 래핑)

### 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 프로젝트 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙
- [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md) - 진행 중 작업

### 외부 참고

- [Vite Tree-Shaking Guide](https://vitejs.dev/guide/features.html#tree-shaking)
- [TypeScript Barrel Patterns](https://basarat.gitbook.io/typescript/main-1/barrel)
- [ESLint no-restricted-syntax](https://eslint.org/docs/latest/rules/no-restricted-syntax)

---

## 🚀 다음 단계

1. **Phase 351 시작**: media-url.util.ts 분할
2. **Phase 352 시작**: Barrel export 최적화
3. **검증**: 번들 크기 및 성능 측정
4. **문서화**: 마이그레이션 가이드 업데이트
5. **릴리스**: v0.5.1 (Phase 351-352 Optimization)

---

**작성자**: GitHub Copilot
**날짜**: 2025-11-04
**버전**: 1.0.0
