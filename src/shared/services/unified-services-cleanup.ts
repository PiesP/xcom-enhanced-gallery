/**
 * @fileoverview 통합 서비스 정리 유틸리티
 * @description 모든 통합 서비스들의 정리 기능을 제공
 */

/**
 * 모든 통합 서비스 정리 함수
 * 앱 종료 시 호출하여 메모리 누수 방지
 */
export function cleanupAllUnifiedServices(): void {
  try {
    // 새로운 DOMService 사용
    const { DOMService } = require('@shared/dom');
    const { unifiedStyleService, unifiedPerformanceService } = require('./unified-style-service');

    DOMService.getInstance().cleanup();
    unifiedStyleService.cleanup();
    unifiedPerformanceService.cleanup();
  } catch (error) {
    console.error('[Services] Failed to cleanup unified services:', error);
  }
}

/**
 * 통합 서비스 상태 확인
 */
export function getUnifiedServicesStatus(): {
  dom: { active: boolean };
  style: { active: boolean; resources: number };
  performance: { active: boolean; metricsCount: number };
} {
  try {
    const { unifiedStyleService, unifiedPerformanceService } = require('./unified-style-service');

    return {
      dom: { active: true },
      style: {
        active: true,
        resources: unifiedStyleService.getActiveResources().size,
      },
      performance: {
        active: true,
        metricsCount: unifiedPerformanceService.getMetrics().size,
      },
    };
  } catch (error) {
    console.error('[Services] Failed to get unified services status:', error);
    return {
      dom: { active: false },
      style: { active: false, resources: 0 },
      performance: { active: false, metricsCount: 0 },
    };
  }
}
