/**
 * @fileoverview Core Application Types
 * @version 1.0.0 - Phase 1A 타입 통합
 *
 * 애플리케이션 관련 모든 타입들을 통합 관리
 * app/types.ts의 내용을 통합하여 중복 제거
 */

/**
 * 애플리케이션 설정 (통합된 버전)
 */
export interface AppConfig {
  /** 애플리케이션 버전 */
  version: string;
  /** 개발 모드 여부 */
  isDevelopment: boolean;
  /** 디버그 모드 여부 */
  debug?: boolean;
  /** 자동 시작 여부 */
  autoStart?: boolean;
  /** 성능 모니터링 활성화 여부 */
  performanceMonitoring?: boolean;
}

/**
 * 애플리케이션 인스턴스 인터페이스
 */
export interface AppInstance {
  /** 초기화 */
  initialize(): Promise<void>;
  /** 정리 */
  cleanup?(): Promise<void>;
  /** 실행 상태 확인 */
  isRunning?(): boolean;
}

/**
 * 애플리케이션 상태
 */
export type ApplicationState = 'initializing' | 'running' | 'stopping' | 'stopped' | 'error';

/**
 * 애플리케이션 라이프사이클 상태
 */
export type AppLifecycleState = 'idle' | 'initializing' | 'ready' | 'error' | 'destroyed';

/**
 * 서비스 상태
 */
export type ServiceState =
  | 'registered'
  | 'initializing'
  | 'initialized'
  | 'destroying'
  | 'destroyed'
  | 'error';

/**
 * 애플리케이션 메타데이터
 */
export interface ApplicationMetadata {
  /** 애플리케이션 이름 */
  name: string;
  /** 버전 */
  version: string;
  /** 빌드 시간 */
  buildTime?: string;
  /** 환경 정보 */
  environment: 'development' | 'production' | 'test';
}

/**
 * 성능 메트릭
 */
export interface PerformanceMetrics {
  /** 초기화 시간 (ms) */
  initializationTime: number;
  /** 메모리 사용량 */
  memoryUsage: {
    /** 힙 사용량 */
    usedJSHeapSize?: number;
    /** 총 힙 크기 */
    totalJSHeapSize?: number;
    /** 힙 크기 제한 */
    jsHeapSizeLimit?: number;
  };
  /** 서비스 수 */
  serviceCount: {
    /** 등록된 서비스 수 */
    registered: number;
    /** 초기화된 서비스 수 */
    initialized: number;
  };
  /** 최적화 설정 */
  optimizations?: {
    memoryMonitoring?: boolean;
    performanceProfiling?: boolean;
  };
}

/**
 * 갤러리 앱 설정
 */
export interface GalleryAppConfig {
  /** 자동 테마 활성화 */
  autoTheme: boolean;
  /** 키보드 단축키 활성화 */
  keyboardShortcuts: boolean;
  /** 성능 모니터링 활성화 */
  performanceMonitoring: boolean;
  /** 추출 타임아웃 */
  extractionTimeout?: number;
  /** 클릭 디바운스 지연시간 */
  clickDebounceMs?: number;
}

/**
 * 갤러리 앱 인터페이스
 */
export interface IGalleryApp extends AppInstance {
  /** 갤러리 열기 */
  openGallery(mediaItems: unknown[]): Promise<void>;
  /** 갤러리 닫기 */
  closeGallery(): void;
  /** 설정 업데이트 */
  updateConfig(config: Partial<GalleryAppConfig>): void;
}

/**
 * 미디어 추출 결과
 */
export interface MediaExtractionResult {
  /** 추출된 미디어 아이템 */
  mediaItems: unknown[];
  /** 추출 성공 여부 */
  success: boolean;
  /** 오류 메시지 */
  error?: string;
  /** 추출 시간 (ms) */
  extractionTime: number;
  /** 클릭된 미디어의 인덱스 */
  clickedIndex?: number;
  /** 추출 메타데이터 */
  metadata?: {
    strategy?: string;
    sourceType?: string;
  };
}

/**
 * 라이프사이클 설정 옵션
 */
export interface LifecycleConfig {
  autoStart: boolean;
  retryCount: number;
  timeout: number;
}

/**
 * 부트스트랩 옵션
 */
export interface BootstrapOptions {
  /** 자동 초기화 여부 */
  autoInitialize: boolean;
  /** 초기화 재시도 횟수 */
  retryCount: number;
  /** 초기화 타임아웃 (ms) */
  timeout: number;
}
