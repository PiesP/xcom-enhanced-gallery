/**
 * @fileoverview Core Application Types
 * @version 1.0.0 - Phase 1A Simplification
 *
 * Core 레이어의 Application 관련 타입들
 * Clean Architecture 의존성 규칙 준수
 */

/**
 * 애플리케이션 설정 타입
 */
export interface AppConfig {
  /** 애플리케이션 버전 */
  version: string;

  /** 개발 환경 여부 */
  isDevelopment: boolean;

  /** 디버그 모드 활성화 여부 */
  debug: boolean;

  /** 자동 시작 여부 */
  autoStart: boolean;

  /** 성능 모니터링 활성화 여부 */
  performanceMonitoring?: boolean;
}

/**
 * 부트스트랩 옵션
 */
export interface BootstrapOptions {
  /** 초기화 타임아웃 (ms) */
  timeout?: number;

  /** 재시도 횟수 */
  retryCount?: number;

  /** 에러 핸들링 모드 */
  errorMode?: 'strict' | 'tolerant';
}

/**
 * 애플리케이션 인스턴스 인터페이스
 */
export interface AppInstance {
  initialize(): Promise<void>;
  cleanup?(): Promise<void>;
  isRunning?(): boolean;
}

/**
 * 성능 메트릭
 */
export interface PerformanceMetrics {
  initializationTime: number;
  memoryUsage: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
  serviceCount: {
    registered: number;
    initialized: number;
  };
  optimizations?: {
    memoryMonitoring?: boolean;
    performanceProfiling?: boolean;
  };
}

/**
 * 애플리케이션 라이프사이클 상태
 */
export type AppLifecycleState = 'idle' | 'initializing' | 'ready' | 'error' | 'destroyed';

/**
 * 라이프사이클 설정 옵션
 */
export interface LifecycleConfig {
  autoStart: boolean;
  retryCount: number;
  timeout: number;
}
