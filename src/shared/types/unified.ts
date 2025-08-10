/**
 * @fileoverview 통합 타입 정의 모듈
 * @description 중복된 타입들을 하나의 위치에서 통합 관리
 * @version 1.0.0 - 타입 통합 완료
 */

// ========================================
// CORE APPLICATION TYPES
// ========================================

/**
 * 애플리케이션 설정 - 통합된 버전
 * @description 기존 app.types.ts와 core-types.ts의 AppConfig 통합
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
}

/**
 * 서비스 설정 - 통합된 버전
 * @description 기존 app.types.ts와 core-types.ts의 ServiceConfig 통합
 */
export interface ServiceConfig<T = unknown> {
  /** 서비스 인스턴스 또는 팩토리 함수 */
  instance?: T;
  factory?: () => T | Promise<T>;
  /** 싱글톤 여부 */
  singleton?: boolean;
  /** 의존성 목록 */
  dependencies?: string[];
  /** 지연 로딩 여부 */
  lazy?: boolean;
  /** 활성화 여부 */
  enabled?: boolean;
  /** 추가 옵션 */
  options?: Record<string, unknown>;
}

/**
 * 정리 가능한 리소스 인터페이스 - 통합된 버전
 * @description 기존 app.types.ts와 core-types.ts의 Cleanupable 통합
 */
export interface Cleanupable {
  /**
   * 동기적 정리 (메모리, 타이머, 이벤트 리스너 등)
   */
  cleanup(): void;
}

/**
 * 비동기적 정리 인터페이스
 */
export interface Disposable {
  /**
   * 비동기적 정리 (파일, 네트워크, 스트림 등)
   */
  dispose(): Promise<void>;
}

/**
 * 완전한 소멸 인터페이스
 */
export interface Destroyable {
  /**
   * 완전한 소멸 (상태 초기화 포함)
   */
  destroy(): void;
}

/**
 * 통합 생명주기 인터페이스
 */
export interface Lifecycle extends Cleanupable, Disposable, Destroyable {
  /**
   * 리소스 상태 확인
   */
  isActive(): boolean;
}

// ========================================
// GALLERY TYPES
// ========================================

/**
 * 갤러리 설정 - 통합된 버전
 * @description 여러 모듈에 분산된 GalleryConfig 통합
 */
export interface GalleryConfig {
  /** 키보드 단축키 활성화 */
  enableKeyboardShortcuts?: boolean;
  /** 자동 재생 설정 */
  autoPlay?: boolean;
  /** 애니메이션 지속 시간 (ms) */
  animationDuration?: number;
  /** 배경 투명도 */
  backgroundOpacity?: number;
  /** 썸네일 크기 */
  thumbnailSize?: 'small' | 'medium' | 'large';
  /** 다운로드 활성화 */
  enableDownload?: boolean;
  /** 풀스크린 모드 지원 */
  enableFullscreen?: boolean;
  /** 줌 기능 활성화 */
  enableZoom?: boolean;
  /** 슬라이드쇼 간격 (ms) */
  slideshowInterval?: number;
  /** 무한 루프 */
  infiniteLoop?: boolean;

  // 갤러리 앱에서 사용하는 필드들
  /** 자동 테마 */
  autoTheme?: boolean;
  /** 키보드 단축키 (레거시 호환) */
  keyboardShortcuts?: boolean;
  /** 성능 모니터링 */
  performanceMonitoring?: boolean;
  /** 추출 타임아웃 (ms) */
  extractionTimeout?: number;
  /** 클릭 디바운스 (ms) */
  clickDebounceMs?: number;
}

/**
 * 테마 설정
 */
export interface ThemeConfig {
  /** 테마 모드 */
  mode: 'light' | 'dark' | 'auto';
  /** 기본 색상 */
  primaryColor: string;
  /** 보조 색상 */
  secondaryColor: string;
  /** 배경 색상 */
  backgroundColor: string;
  /** 텍스트 색상 */
  textColor: string;
  /** 경계선 반경 */
  borderRadius: number;
  /** 그림자 활성화 */
  enableShadow: boolean;
}

// ========================================
// SERVICE & COMPONENT TYPES
// ========================================

/**
 * 기본 서비스 인터페이스
 */
export interface BaseService {
  destroy?(): void;
  initialize?(): Promise<void> | void;
  isInitialized?(): boolean;
}

/**
 * 기본 설정 인터페이스
 */
export interface BaseConfig {
  /** 설정 버전 */
  version: string;
  /** 활성화 여부 */
  enabled: boolean;
  /** 디버그 모드 */
  debug?: boolean;
}

/**
 * 애니메이션 설정
 */
export interface AnimationConfig {
  /** 지속 시간 (ms) */
  duration: number;
  /** 이징 함수 */
  easing: string;
  /** 지연 시간 (ms) */
  delay?: number;
  /** 반복 횟수 */
  repeat?: number | 'infinite';
  /** 방향 */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

// ========================================
// UTILITY TYPES
// ========================================

/**
 * 기본 위치 좌표
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 크기 정보
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 일반적인 이벤트 핸들러 타입
 */
export type EventHandler<T = Event> = (event: T) => void;

/**
 * 비동기 이벤트 핸들러 타입
 */
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

/**
 * 생명주기 설정
 */
export interface LifecycleConfig {
  /** 자동 초기화 */
  autoInit: boolean;
  /** 자동 정리 */
  autoCleanup: boolean;
  /** 타임아웃 (ms) */
  timeout?: number;
}

// ========================================
// TYPE UTILITIES
// ========================================

/**
 * Optional 속성을 Required로 변환
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 특정 속성만 Optional로 변환
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 문자열 키를 가진 객체 타입
 */
export type StringRecord<T = unknown> = Record<string, T>;

/**
 * 함수 타입 가드
 */
export type TypeGuard<T> = (value: unknown) => value is T;
