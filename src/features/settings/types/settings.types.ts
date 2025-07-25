/**
 * @fileoverview 설정 모듈 타입 정의
 * @description 애플리케이션 설정 관련 인터페이스와 타입들
 */

/**
 * 갤러리 설정
 */
export interface GallerySettings {
  /** 자동 스크롤 속도 (1-10) */
  autoScrollSpeed: number;
  /** 무한 스크롤 활성화 */
  infiniteScroll: boolean;
  /** 이미지 사전 로딩 개수 */
  preloadCount: number;
  /** 가상 스크롤링 활성화 */
  virtualScrolling: boolean;
  /** 갤러리 테마 */
  theme: 'auto' | 'light' | 'dark';
  /** 애니메이션 활성화 */
  animations: boolean;
}

/**
 * 다운로드 설정
 */
export interface DownloadSettings {
  /** 파일명 패턴 */
  filenamePattern: 'original' | 'tweet-id' | 'timestamp' | 'custom';
  /** 커스텀 파일명 템플릿 */
  customTemplate?: string;
  /** 이미지 품질 */
  imageQuality: 'original' | 'large' | 'medium' | 'small';
  /** 병렬 다운로드 수 */
  maxConcurrentDownloads: number;
  /** 자동 ZIP 압축 */
  autoZip: boolean;
  /** 다운로드 폴더 구조 */
  folderStructure: 'flat' | 'by-date' | 'by-user';
}

/**
 * 토큰 설정
 */
export interface TokenSettings {
  /** Bearer 토큰 */
  bearerToken?: string;
  /** 토큰 자동 갱신 */
  autoRefresh: boolean;
  /** 토큰 만료 시간 (분) */
  expirationMinutes: number;
  /** 마지막 갱신 시간 */
  lastRefresh?: number;
}

/**
 * 성능 설정
 */
export interface PerformanceSettings {
  /** DOM 캐시 활성화 */
  domCaching: boolean;
  /** 캐시 TTL (밀리초) */
  cacheTTL: number;
  /** 메모리 모니터링 */
  memoryMonitoring: boolean;
  /** 성능 로깅 */
  performanceLogging: boolean;
  /** 디버그 모드 */
  debugMode: boolean;
}

/**
 * 접근성 설정
 */
export interface AccessibilitySettings {
  /** 고대비 모드 */
  highContrast: boolean;
  /** 애니메이션 감소 */
  reduceMotion: boolean;
  /** 스크린 리더 지원 */
  screenReaderSupport: boolean;
  /** 포커스 표시 */
  focusIndicators: boolean;
}

/**
 * 전체 애플리케이션 설정
 */
export interface AppSettings {
  gallery: GallerySettings;
  download: DownloadSettings;
  tokens: TokenSettings;
  performance: PerformanceSettings;
  accessibility: AccessibilitySettings;
  /** 설정 버전 (호환성 관리용) */
  version: string;
  /** 마지막 수정 시간 */
  lastModified: number;
}

/**
 * 설정 키 타입 (type-safe 접근용)
 */
export type SettingKey = keyof AppSettings;

/**
 * 중첩된 설정 키 타입
 */
export type NestedSettingKey =
  | `gallery.${keyof GallerySettings}`
  | `download.${keyof DownloadSettings}`
  | `tokens.${keyof TokenSettings}`
  | `performance.${keyof PerformanceSettings}`
  | `accessibility.${keyof AccessibilitySettings}`
  | SettingKey;

/**
 * 설정 변경 이벤트
 */
export interface SettingChangeEvent<T = unknown> {
  key: NestedSettingKey;
  oldValue: T;
  newValue: T;
  timestamp: number;
}

/**
 * 설정 유효성 검증 결과
 */
export interface SettingValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * 기본 설정 값들
 */
// Re-export from constants for consistency
export { DEFAULT_SETTINGS } from '@/constants';
