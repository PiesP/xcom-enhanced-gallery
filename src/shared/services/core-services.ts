/**
 * @fileoverview Core Services Consolidation
 * @version 1.1.0 - Phase 350: 순환 참조 제거
 *
 * 작은 서비스 파일들의 통합
 * - ServiceRegistry (통합됨)
 * - CoreService (구 ServiceManager) export 추가
 *
 * Phase 1 Step 3: 파일 통합을 통한 복잡도 감소
 * Phase 2025-10-27: Logger 재정의 제거 (→ @shared/logging 사용)
 * Phase 350 (2025-11-04): ServiceDiagnostics re-export 제거 (순환 참조 방지)
 */

// ================================
// Core Service Export
// ================================

// CoreService (구 ServiceManager) - 명명 규칙 통일
export { CoreService } from './service-manager';
export { serviceManager } from './service-manager';
export { getService } from './service-manager';

// ================================
// Logger & Type Aliases
// ================================

// @shared/logging에서 직접 사용하도록 유도
export { logger, type Logger } from '@shared/logging';
export type { Logger as ILogger } from '@shared/logging';

// ServiceTypeMapping 제거됨 - Phase 4 Step 4: 과도한 추상화 제거
// 직접적인 서비스 키 타입 사용
export type ServiceKey = string;

// ================================
// Service Diagnostics
// ================================

/**
 * ServiceManager 진단 도구
 *
 * ServiceManager의 상태와 서비스 등록 상황을 확인하는 도구
 *
 * Phase 350: 순환 참조 제거
 * - ServiceDiagnostics는 개발 도구이므로 필요시 직접 import 사용:
 *   import { ServiceDiagnostics } from '@shared/services/service-diagnostics';
 * - core-services.ts에서 re-export 제거하여 순환 참조 방지
 */
// export { ServiceDiagnostics } from './service-diagnostics'; // REMOVED: Circular dependency

// ================================
// Service Registry는 별도 파일로 분리됨
// service-registry.ts 참조
// ================================

// CoreService 클래스 제거됨 - Phase 4 간소화

// ================================
// Service Registry (재export)
// ================================

/**
 * ServiceRegistry 기능을 재export합니다
 * ServiceRegistry가 ServiceManager에 통합되었고, 초기화는 별도 파일로 분리
 */
export { registerCoreServices } from './service-initialization';
