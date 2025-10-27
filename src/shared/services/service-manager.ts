/**
 * @fileoverview 서비스 관리자 래퍼 (호환성 유지)
 * @description 새로운 core 모듈의 exports 재내보내기
 * @version 2.0.0 - Phase C: Service Manager 완전 분리 (위임 패턴)
 *
 * ⚠️ 실제 구현은 src/shared/services/core/service-manager.ts로 이동됨
 * 호환성을 위해 이 파일에서 모든 exports를 재내보냅니다.
 */

export {
  CoreService,
  serviceManager,
  getService,
  registerServiceFactory,
} from './core/service-manager';
