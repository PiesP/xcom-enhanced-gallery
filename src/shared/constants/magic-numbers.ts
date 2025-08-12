/**
 * 매직 넘버를 대체하기 위한 상수 정의
 * TDD 접근법으로 매직 넘버 제거
 */

/**
 * 갤러리 관련 상수
 */
export const GALLERY_CONSTANTS = {
  /** 갤러리 아이템 높이 (px) */
  ITEM_HEIGHT: 40,
  /** 스크롤 디바운스 지연 시간 (ms) */
  SCROLL_DEBOUNCE_DELAY: 300,
  /** 스크롤 오프셋 (px) */
  SCROLL_OFFSET: 50,
  /** 애니메이션 지속 시간 (ms) */
  ANIMATION_DURATION: 1000,
} as const;

/**
 * 이미지 로딩 관련 상수
 */
export const IMAGE_CONSTANTS = {
  /** 진행률 완료 상태 (%) */
  PROGRESS_COMPLETE: 100,
  /** 이미지 품질 임계값 */
  QUALITY_THRESHOLD: 0.7,
} as const;

/**
 * 코치마크 관련 상수
 */
export const COACH_MARK_CONSTANTS = {
  /** 진행률 완료 상태 (%) */
  PROGRESS_COMPLETE: 100,
  /** 자동 숨김 지연 시간 (ms) */
  AUTO_HIDE_DELAY: 3000,
  /** 페이드 지연 시간 (ms) */
  FADE_DELAY: 300,
  /** 툴팁 오프셋 (px) */
  TOOLTIP_OFFSET: 12,
} as const;

/**
 * 미디어 추출 관련 상수
 */
export const MEDIA_CONSTANTS = {
  /** URL 세그먼트 시작 위치 */
  URL_SEGMENT_START: 36,
  /** URL 세그먼트 길이 */
  URL_SEGMENT_LENGTH: 9,
} as const;

/**
 * 테스팅 관련 상수
 */
export const TESTING_CONSTANTS = {
  /** 백분율 변환 배수 */
  PERCENTAGE_MULTIPLIER: 100,
  /** 밀리초를 초로 변환하는 배수 */
  MILLISECONDS_PER_SECOND: 1000,
  /** 높은 신뢰도 임계값 */
  CONFIDENCE_THRESHOLD_HIGH: 0.3,
  /** 낮은 신뢰도 임계값 */
  CONFIDENCE_THRESHOLD_LOW: 0.1,
  /** 기본 아이템 개수 */
  DEFAULT_ITEMS_COUNT: 10,
  /** 캐시 크기 제한 */
  CACHE_SIZE_LIMIT: 5,
  /** 배치 크기 */
  BATCH_SIZE: 3,
  /** 목 타임아웃 (ms) */
  MOCK_TIMEOUT: 60000,
} as const;
