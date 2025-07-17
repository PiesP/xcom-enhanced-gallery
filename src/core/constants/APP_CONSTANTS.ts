/**
 * Application Constants
 *
 * @description 앱 전체에서 사용되는 상수들을 정의합니다.
 * @version 1.0.0
 *
 * 코딩 가이드라인 준수:
 * - 매직넘버 제거
 * - 상수로 명시적 정의
 * - 중앙 집중식 관리
 */

// ================================
// 초기화 관련 상수
// ================================

export const INITIALIZATION_CONSTANTS = {
  /** CSS 내용 최소 길이 (가이드라인: 매직넘버 제거) */
  MIN_CSS_CONTENT_LENGTH: 100,

  /** 최대 초기화 시도 횟수 */
  MAX_INITIALIZATION_ATTEMPTS: 3,

  /** DOM 준비 대기 타임아웃 (ms) */
  DOM_READY_TIMEOUT: 10000,

  /** 서비스 초기화 타임아웃 (ms) */
  SERVICE_INIT_TIMEOUT: 15000,
} as const;

// ================================
// CSS 검사 패턴
// ================================

export const CSS_CHECK_PATTERNS = [
  '--xeg-gallery-z-index',
  '--xeg-color-primary',
  'xeg-gallery-overlay',
  'xeg-gallery-container',
] as const;

// ================================
// 이벤트 처리 상수
// ================================

export const EVENT_CONSTANTS = {
  /** 디바운싱 지연 시간 (ms) */
  DEBOUNCE_DELAY: 100,

  /** 페이지 변경 감지 간격 (ms) - 성능 개선을 위해 단축 */
  PAGE_CHANGE_CHECK_INTERVAL: 1000,

  /** 클릭 이벤트 처리 타임아웃 (ms) */
  CLICK_HANDLER_TIMEOUT: 5000,
} as const;

// ================================
// 메모리 관리 상수
// ================================

export const MEMORY_CONSTANTS = {
  /** URL 자동 정리 시간 (ms) - 5분에서 30초로 단축 */
  URL_CLEANUP_TIMEOUT: 30 * 1000,

  /** 캐시 정리 간격 (ms) */
  CACHE_CLEANUP_INTERVAL: 60 * 1000,

  /** 최대 추출 세션 개수 */
  MAX_EXTRACTION_SESSIONS: 10,
} as const;

// ================================
// 성능 최적화 상수
// ================================

export const PERFORMANCE_CONSTANTS = {
  /** 캐시 히트 확인 간격 (ms) */
  CACHE_CHECK_INTERVAL: 100,

  /** 리소스 정리 지연 시간 (ms) */
  RESOURCE_CLEANUP_DELAY: 1000,

  /** 최대 동시 미디어 처리 개수 */
  MAX_CONCURRENT_MEDIA: 5,
} as const;

// ================================
// 보안 및 검증 상수
// ================================

export const VALIDATION_CONSTANTS = {
  /** 최대 미디어 URL 길이 */
  MAX_MEDIA_URL_LENGTH: 2048,

  /** 최대 파일명 길이 */
  MAX_FILENAME_LENGTH: 255,

  /** 허용된 미디어 도메인 */
  ALLOWED_MEDIA_DOMAINS: ['pbs.twimg.com', 'video.twimg.com', 'abs.twimg.com'] as const,
} as const;

// ================================
// 타입 안전성을 위한 유틸리티
// ================================

export type InitializationConstant = keyof typeof INITIALIZATION_CONSTANTS;
export type EventConstant = keyof typeof EVENT_CONSTANTS;
export type MemoryConstant = keyof typeof MEMORY_CONSTANTS;
export type PerformanceConstant = keyof typeof PERFORMANCE_CONSTANTS;
export type ValidationConstant = keyof typeof VALIDATION_CONSTANTS;
