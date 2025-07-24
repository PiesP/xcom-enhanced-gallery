/**
 * @fileoverview Service Managers - Service 관리 컴포넌트들
 * @version 1.0.0
 *
 * ServiceResolver는 ServiceManager로 통합되었습니다.
 * 기존 export는 호환성을 위해 ServiceManager로 리다이렉트합니다.
 */

// ServiceResolver 기능은 ServiceManager로 통합됨
export { ServiceManager as ServiceResolver } from '../ServiceManager';

// Re-export types from ServiceManager
export type { ServiceInstance, ServiceState } from '../ServiceManager';
