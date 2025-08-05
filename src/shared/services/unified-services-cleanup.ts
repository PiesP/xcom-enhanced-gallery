/**
 * @fileoverview 통합 서비스 정리 유틸리티
 * @description StyleManager와 DOMService의 정리 기능을 제공
 */

/**
 * 모든 통합 서비스 정리 함수
 * 앱 종료 시 호출하여 메모리 누수 방지
 */
export function cleanupAllUnifiedServices(): void {
  // DOMService는 singleton이므로 특별한 cleanup이 필요하지 않음
  // StyleManager는 정적 메서드만 있으므로 특별한 cleanup이 필요하지 않음
}

/**
 * 통합 서비스 상태 확인
 */
export function getUnifiedServicesStatus(): {
  dom: { active: boolean };
  style: { active: boolean; resources: number };
  performance: { active: boolean; metricsCount: number };
} {
  return {
    dom: { active: true },
    style: {
      active: true,
      resources: 0, // StyleManager는 리소스 카운팅 없음
    },
    performance: {
      active: true,
      metricsCount: 0, // 성능 메트릭스는 별도 시스템에서 관리
    },
  };
}
