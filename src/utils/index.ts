/**
 * @fileoverview Utils Layer Exports
 * @description 최소 표면적의 유틸리티/서비스 export만 노출합니다.
 *
 * 주의: 과거에는 `export * from '../shared'`로 전체 Shared 레이어를 re-export 했지만,
 * 이는 테스트/런타임에서 불필요한 대규모 모듈 그래프 로드를 유발하고, 일부 프로젝트에서
 * 동적 import(`await import('@/utils')`)가 5초 타임아웃에 근접해 플래키해지는 문제가 있어 제거했습니다.
 * 필요한 항목만 명시적으로 export 하세요.
 */

// CoreService 별칭 (테스트/기존 코드 호환)
export { CoreService } from '../shared/services/service-manager';

// 로거 (경량 유틸리티)
export { logger } from '../shared/logging/logger';
