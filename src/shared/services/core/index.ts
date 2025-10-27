/**
 * @fileoverview 핵심 서비스 관리 모듈 (위임 패턴)
 * @description registry, factory, lifecycle 세 관리자 노출
 * @version 2.0.0 - Phase C: Service Manager 완전 분리
 */

export { CoreService, serviceManager, getService, registerServiceFactory } from './service-manager';
export { ServiceRegistry } from './service-registry';
export { ServiceFactoryManager } from './service-factory';
export { ServiceLifecycleManager } from './service-lifecycle';
