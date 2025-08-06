/**
 * Core Logging System
 *
 * 🔄 UPDATED: UnifiedLogger 기반 통합 로깅 시스템
 * - console.error/warn 직접 사용 제거
 * - 성능 최적화 및 메모리 효율성 개선
 * - 로그 레벨 관리 및 필터링
 *
 * @fileoverview Core logging barrel export with UnifiedLogger
 * @version 2.0.0
 */

export * from './unified-logger';

// 기존 logger는 legacy로 export
export { logger as legacyLogger } from './logger';

// 주요 logger 인스턴스 및 유틸리티 함수들 export
export {
  logger,
  unifiedLogger,
  logError,
  logWarning,
  logInfo,
  logDebug,
  setLogLevel,
  createScopedLogger,
  measurePerformanceWithLog,
  type Logger,
  type LogLevelCompat,
  type LoggableData,
} from './logger';
