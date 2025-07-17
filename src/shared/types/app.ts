/**
 * 애플리케이션 설정 관련 타입 정의
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

export interface BootstrapOptions {
  /** 초기화 타임아웃 (ms) */
  timeout?: number;

  /** 재시도 횟수 */
  retryCount?: number;

  /** 에러 핸들링 모드 */
  errorMode?: 'strict' | 'tolerant';
}

export interface AppInstance {
  initialize(): Promise<void>;
  cleanup?(): Promise<void>;
}

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
