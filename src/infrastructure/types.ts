/**
 * @fileoverview Infrastructure Layer 타입 정의
 * @version 1.0.0
 */

/**
 * 에러 컨텍스트 정보
 */
export interface ErrorContext {
  /** 에러가 발생한 컴포넌트/서비스명 */
  component?: string;
  /** 에러가 발생한 메서드/함수명 */
  method?: string;
  /** 에러 발생 위치 */
  location?: string;
  /** 에러 관련 추가 컨텍스트 */
  context?: Record<string, unknown>;
  /** 에러 관련 추가 데이터 */
  data?: Record<string, unknown>;
  /** 사용자 에이전트 정보 */
  userAgent?: string;
  /** 현재 URL */
  url?: string;
  /** 타임스탬프 */
  timestamp?: number;
}

/**
 * 로그 레벨
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 로그 엔트리
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

/**
 * 성능 메트릭
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
