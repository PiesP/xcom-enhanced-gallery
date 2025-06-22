/**
 * Infrastructure Memory Management Barrel Export
 *
 * 메모리 자원 관리를 위한 유틸리티들을 export합니다.
 */

// 통합 자원 관리자 (ResourcePool)
export * from './ResourcePool';

// 편의를 위한 별칭 export
export { resourcePool as memoryManager } from './ResourcePool';

// 세부 메모리 관리 유틸리티들 (from shared utils)
export { ControllerManager } from './ControllerManager';
export { EventManager } from './EventManager';
export { MemoryCoordinator, type MemoryManagerConfig, type MemoryUsage } from './MemoryCoordinator';
export { TimerManager } from './TimerManager';
export { URLManager } from './URLManager';

// 기본 인스턴스 export (호환성을 위해)
import { MemoryCoordinator } from './MemoryCoordinator';
export const memoryCoordinator = MemoryCoordinator.getInstance();
