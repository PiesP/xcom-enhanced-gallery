/**
 * App Layer 타입 정의
 */

/**
 * 애플리케이션 설정
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
