/**
 * 성능 모니터링 시스템 메인 익스포트
 *
 * @description 성능 모니터링 관련 모든 클래스와 타입을 익스포트
 * @author TDD-AI-Assistant
 * @version 1.0.0
 */

// 메인 클래스들
export { PerformanceMonitor } from './PerformanceMonitor';
// export { EnhancedPerformanceMonitor } from './EnhancedPerformanceMonitor';
export { MetricsCollector } from './MetricsCollector';
export { AlertSystem } from './AlertSystem';
export {
  PerformanceIntegration,
  getPerformanceIntegration,
  destroyPerformanceIntegration,
} from './PerformanceIntegration';

// 타입 정의들
export type {
  PerformanceMetrics,
  MemoryMetrics,
  RenderMetrics,
  UserExperienceMetrics,
  AlertThreshold,
  PerformanceAlert,
  OptimizationSuggestion,
  TrendAnalysis,
  BrowserCompatibilityReport,
  DashboardData,
  MonitoringConfig,
  AlertSeverity,
  MetricType,
  OptimizationType,
} from './types';

// 성능 모니터링 시스템 팩토리는 별도 파일로 분리
export { PerformanceMonitoringSystem } from './PerformanceMonitoringSystem';
