/**
 * @fileoverview Core Types - 통합 도메인 타입 및 인프라 타입
 * @version 3.0.0 - Phase 197.1: 구조 명확화
 *
 * **역할**:
 * 이 파일은 여러 도메인과 인프라 타입을 통합하여 관리합니다.
 * app.types.ts가 이 타입들을 재-export하므로, 직접 import하는 경우는 거의 없습니다.
 *
 * **구성** (섹션별):
 * 1. SERVICE TYPES - 서비스 기본 인터페이스
 * 2. GALLERY TYPES - 갤러리 도메인 (상태, 액션, 이벤트)
 * 3. MEDIA MAPPING TYPES - 미디어 매핑 전략 패턴
 * 4. CORE FOUNDATION TYPES - 앱 설정 & 생명주기
 * 5. RESULT TYPES - 성공/실패 명시적 표현
 *
 * **사용 권장**:
 * - 일반적: `import type { Result, BaseService } from '@shared/types'` (app.types.ts 거경)
 * - 세부: `import type { GalleryState } from '@shared/types/core/core-types'`
 *
 * **Phase 197 개선**:
 * - BaseService 중복 제거 (base-service.types.ts 재-export)
 * - Result 패턴 통합
 * - JSDoc 강화 & 섹션 명확화
 *
 * @see {@link ../app.types.ts} - 재-export 허브
 * @see {@link ./base-service.types.ts} - BaseService 정의
 * @see {@link ../result.types.ts} - Result 패턴 & ErrorCode
 */

import type { MediaInfo, MediaMapping } from '@shared/types/media.types';
import type { BaseService } from './base-service.types';
import type { Result } from '../result.types';

// ========================================
// SERVICE TYPES (from services.types.ts)
// ========================================

// Export BaseService from dedicated file (avoid duplication)
export type { BaseService };

/**
 * 서비스 생명주기 상태
 */
export type ServiceLifecycle = 'uninitialized' | 'initializing' | 'initialized' | 'destroyed';

// All unused service type definitions removed in Phase 326.6
// Services use concrete implementations instead of interface abstractions

// ========================================
// GALLERY TYPES (from gallery.types.ts)
// ========================================

/**
 * 갤러리 뷰 모드 타입
 */
export type GalleryViewMode = 'grid' | 'carousel' | 'slideshow';

/**
 * 갤러리 상태 인터페이스 (불변성 보장)
 */
export interface GalleryState {
  readonly isOpen: boolean;
  readonly currentIndex: number;
  readonly items: readonly MediaInfo[];
  readonly viewMode: GalleryViewMode;
  readonly isFullscreen: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

/**
 * 갤러리 이벤트 타입
 */
export type GalleryEvents = {
  'gallery:open': { items: MediaInfo[]; startIndex: number };
  'gallery:close': {};
  'gallery:navigate': { index: number; item: MediaInfo };
  'gallery:viewModeChange': { mode: GalleryViewMode };
  'gallery:fullscreenToggle': { isFullscreen: boolean };
  'gallery:error': { error: string };
};

// ========================================
// VIEW MODE TYPES (from view-mode.types.ts)
// ========================================

// Re-export from constants for better organization
import { VIEW_MODES } from '@/constants';
export { VIEW_MODES, type ViewMode } from '@/constants';

/**
 * ViewMode 유효성 검사 함수
 */
export function isValidViewMode(mode: string): mode is (typeof VIEW_MODES)[number] {
  return VIEW_MODES.includes(mode as (typeof VIEW_MODES)[number]);
}

// ========================================
// CORE UTILITY TYPES
// ========================================
// ========================================
// MEDIA MAPPING TYPES (from media.types.ts)
// ========================================

/**
 * Re-export MediaMappingStrategy from media.types
 * (actual definition is in @shared/types/media.types)
 */
export type { MediaMappingStrategy } from '@shared/types/media.types';

/**
 * 전략 메트릭스
 */
export interface StrategyMetrics {
  successRate: number;
  avgProcessingTime: number;
  lastUsed: number;
  priority: number;
}

/**
 * 매핑 캐시 엔트리
 */
export interface MappingCacheEntry {
  result: MediaMapping;
  timestamp: number;
}

// ========================================
// CORE FOUNDATION TYPES (from core.types.ts)
// ========================================

/**
 * 기본 갤러리 설정
 */
export interface GalleryConfig {
  /** 자동 재생 여부 */
  autoPlay: boolean;
  /** 썸네일 표시 여부 */
  showThumbnails: boolean;
  /** 다운로드 기능 활성화 여부 */
  downloadEnabled: boolean;
  /** 키보드 네비게이션 활성화 여부 */
  keyboardNavigation?: boolean;
  /** 풀스크린 모드 지원 여부 */
  fullscreenEnabled?: boolean;
  /** 이미지 확대/축소 기능 */
  zoomEnabled?: boolean;
}

/**
 * 다운로드 옵션
 */
export interface DownloadOptions {
  /** 다운로드 품질 */
  quality?: 'original' | 'high' | 'medium';
  /** 파일명 형식 */
  filenameFormat?: string;
  /** 압축 활성화 여부 */
  compressionEnabled?: boolean;
}

/**
 * 크기 정보
 */
export interface Size {
  width: number;
  height: number;
}

/** 일반적인 이벤트 핸들러 타입 */
export type EventHandler<T = Event> = (event: T) => void;

/** 로딩 상태 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ========================================
// APPLICATION TYPES (from app.types.ts)
// ========================================

/**
 * 애플리케이션 설정 (통합된 버전)
 */
export interface AppConfig {
  /** 애플리케이션 버전 */
  version: string;
  /** 개발 모드 여부 */
  isDevelopment: boolean;
  /** 디버그 모드 여부 */
  debug: boolean;
  /** 자동 시작 여부 */
  autoStart: boolean;
  /** 성능 모니터링 활성화 여부 */
  performanceMonitoring?: boolean;
  /** 윈도우 load 이후에 갤러리 렌더링을 지연할지 여부 (기본 true, 테스트 모드 제외) */
  renderAfterLoad?: boolean;
}

// ========================================
// LIFECYCLE TYPES (from lifecycle.types.ts)
// ========================================

/**
 * 동기적 정리 인터페이스
 */
export interface Cleanupable {
  /**
   * 동기적 정리 (메모리, 타이머, 이벤트 리스너 등)
   */
  cleanup(): void;
}

/**
 * 통합 생명주기 인터페이스
 */
export interface Lifecycle extends Cleanupable {
  /**
   * 리소스 상태 확인
   */
  isActive(): boolean;
}

// ========================================
// RESULT TYPES (from result.ts)
// ========================================

/**
 * Result 타입 - Enhanced Result 패턴 사용
 * @deprecated Simple Result<T, E> 패턴은 Phase 355.4에서 제거됨
 * @see {@link ../result.types.ts} - Enhanced Result 정의 및 유틸리티
 */
export type { Result } from '../result.types';

/**
 * 비동기 Result 타입
 * @note Phase 353: E 파라미터 제거 완료
 */
export type AsyncResult<T> = Promise<Result<T>>;

/**
 * Option 타입 - 값이 있거나 없음을 명시적으로 표현
 */
export type Option<T> = T | null;

// Result 유틸리티 함수들은 result.types.ts로 이동됨 (Phase 355.2)
// - success, failure, partial, cancelled
// - isSuccess, isFailure, isPartial
// - unwrapOr, safe, safeAsync, chain, map
// import { success, failure, isSuccess, ... } from '@shared/types/result.types';
