/**
 * 성능 모니터링 시스템 타입 정의
 *
 * @description 성능 메트릭, 알림, 모니터링 관련 타입들
 * @author TDD-AI-Assistant
 */

/**
 * 메모리 사용량 메트릭
 */
export interface MemoryMetrics {
  /** 사용 중인 힙 메모리 (바이트) */
  heapUsed: number;
  /** 총 할당된 힙 메모리 (바이트) */
  heapTotal: number;
  /** 힙 메모리 한계 (바이트) */
  heapLimit: number;
}

/**
 * 렌더링 성능 메트릭
 */
export interface RenderMetrics {
  /** 페인트 시간 (밀리초) */
  paintTime: number;
  /** 레이아웃 시간 (밀리초) */
  layoutTime: number;
  /** 스크립트 실행 시간 (밀리초) */
  scriptTime: number;
}

/**
 * 사용자 경험 지표 (Core Web Vitals)
 */
export interface UserExperienceMetrics {
  /** First Contentful Paint (밀리초) */
  fcp: number;
  /** Largest Contentful Paint (밀리초) */
  lcp: number;
  /** First Input Delay (밀리초) */
  fid: number;
  /** Cumulative Layout Shift (점수) */
  cls: number;
}

/**
 * 종합 성능 메트릭
 */
export interface PerformanceMetrics {
  /** 측정 타임스탬프 */
  timestamp: number;
  /** 메모리 메트릭 */
  memory: MemoryMetrics;
  /** 성능 메트릭 */
  performance: RenderMetrics;
  /** 사용자 경험 메트릭 */
  userExperience: UserExperienceMetrics;
}

/**
 * 알림 심각도 레벨
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * 메트릭 타입
 */
export type MetricType = 'memoryUsage' | 'renderTime' | 'userExperience' | 'networkLatency';

/**
 * 알림 임계값 설정
 */
export interface AlertThreshold {
  /** 메트릭 타입 */
  metric: MetricType;
  /** 임계값 */
  value: number;
  /** 단위 */
  unit: string;
  /** 심각도 */
  severity: AlertSeverity;
}

/**
 * 성능 알림
 */
export interface PerformanceAlert {
  /** 알림 ID */
  id: string;
  /** 타임스탬프 */
  timestamp: number;
  /** 메트릭 타입 */
  metric: MetricType;
  /** 현재 값 */
  currentValue: number;
  /** 임계값 */
  threshold: number;
  /** 심각도 */
  severity: AlertSeverity;
  /** 알림 메시지 */
  message: string;
}

/**
 * 최적화 제안 타입
 */
export type OptimizationType = 'memory' | 'render' | 'network' | 'cache' | 'bundle';

/**
 * 성능 최적화 제안
 */
export interface OptimizationSuggestion {
  /** 제안 ID */
  id: string;
  /** 제안 타입 */
  type: OptimizationType;
  /** 제안 설명 */
  description: string;
  /** 예상 영향도 (1-10) */
  impact: number;
  /** 구현 난이도 (1-10) */
  difficulty: number;
  /** 상세 권장사항 */
  recommendations: string[];
}

/**
 * 성능 트렌드 분석
 */
export interface TrendAnalysis {
  /** 메모리 사용량 트렌드 */
  memoryTrend: 'improving' | 'stable' | 'degrading';
  /** 성능 트렌드 */
  performanceTrend: 'improving' | 'stable' | 'degrading';
  /** 트렌드 기반 권장사항 */
  recommendations: string[];
  /** 분석 기간 (밀리초) */
  analysisWindow: number;
}

/**
 * 브라우저 호환성 리포트
 */
export interface BrowserCompatibilityReport {
  /** 현재 브라우저 정보 */
  currentBrowser: {
    name: string;
    version: string;
    engine: string;
  };
  /** 지원 기능 목록 */
  supportedFeatures: string[];
  /** 성능 기능 지원 여부 */
  performanceCapabilities: {
    performanceObserver: boolean;
    memoryAPI: boolean;
    webVitalsAPI: boolean;
    navigationTiming: boolean;
  };
}

/**
 * 대시보드 데이터
 */
export interface DashboardData {
  /** 현재 메트릭 */
  currentMetrics: PerformanceMetrics;
  /** 활성 알림 목록 */
  alerts: PerformanceAlert[];
  /** 트렌드 분석 */
  trends: TrendAnalysis;
  /** 전체 건강 점수 (0-100) */
  healthScore: number;
}

/**
 * 모니터링 설정
 */
export interface MonitoringConfig {
  /** 수집 간격 (밀리초) */
  collectionInterval: number;
  /** 히스토리 보관 기간 (밀리초) */
  historyRetention: number;
  /** 자동 알림 활성화 */
  enableAlerts: boolean;
  /** 자동 최적화 제안 활성화 */
  enableSuggestions: boolean;
  /** 상세 로깅 활성화 */
  enableDetailedLogging: boolean;
}
