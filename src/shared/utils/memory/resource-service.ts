/**
 * @fileoverview 🟢 GREEN: 리소스 서비스 - UnifiedMemoryManager로 통합됨
 * @description TDD Phase 2: 중복 제거 완료, 통합 메모리 관리자 사용
 * @version 2.0.0 - 통합 완료
 */

// 🟢 GREEN: UnifiedMemoryManager로 완전 통합
export { UnifiedMemoryManager as ResourceService } from '@shared/memory/unified-memory-manager';
export { memoryManager as globalResourceManager } from '@shared/memory/unified-memory-manager';
export type { ResourceType } from '@shared/memory/unified-memory-manager';

// 편의 함수들 - UnifiedMemoryManager API로 위임
import { memoryManager } from '@shared/memory/unified-memory-manager';

/**
 * 편의 함수: 리소스 등록
 */
export function registerResource(id: string, cleanup: () => void): void {
  memoryManager.register(id, 'memory', cleanup);
}

/**
 * 편의 함수: 리소스 해제
 */
export function releaseResource(id: string): boolean {
  return memoryManager.release(id);
}

/**
 * 편의 함수: 모든 리소스 해제
 */
export function releaseAllResources(): void {
  // UnifiedMemoryManager는 타입별 해제 지원
  memoryManager.releaseByType('memory');
}
