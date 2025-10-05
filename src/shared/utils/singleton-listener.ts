/**
 * @fileoverview Singleton Listener Manager
 * @description 중복 리스너 방지를 위한 싱글톤 관리자
 */

type CleanupFn = () => void;

/**
 * 단일 키당 하나의 리스너만 유지하는 관리자
 *
 * @example
 * ```ts
 * const manager = new SingletonListenerManager();
 * const cleanup = ensureWheelLock(element, handler);
 * manager.register('gallery-wheel', cleanup);
 *
 * // 동일 키로 재등록 시 기존 cleanup 자동 호출
 * manager.register('gallery-wheel', newCleanup);
 *
 * // 명시적 해제
 * manager.unregister('gallery-wheel');
 * ```
 */
export class SingletonListenerManager {
  private readonly listeners = new Map<string, CleanupFn>();

  /**
   * 리스너 등록 (기존 것이 있으면 교체)
   * @param key - 고유 키
   * @param cleanup - 정리 함수
   */
  register(key: string, cleanup: CleanupFn): void {
    // 기존 리스너가 있으면 먼저 정리
    this.unregister(key);
    this.listeners.set(key, cleanup);
  }

  /**
   * 리스너 등록 해제 및 정리
   * @param key - 고유 키
   */
  unregister(key: string): void {
    const cleanup = this.listeners.get(key);
    if (cleanup) {
      cleanup();
      this.listeners.delete(key);
    }
  }

  /**
   * 모든 리스너 정리
   */
  clear(): void {
    this.listeners.forEach(cleanup => cleanup());
    this.listeners.clear();
  }

  /**
   * 리스너 활성 상태 확인
   * @param key - 고유 키
   */
  isActive(key: string): boolean {
    return this.listeners.has(key);
  }
}

/**
 * 전역 싱글톤 인스턴스
 *
 * 여러 훅이 동일 이벤트 타입을 공유할 때 사용
 *
 * @example
 * ```ts
 * import { globalListenerManager } from '@shared/utils/singleton-listener';
 *
 * export function useMyHook() {
 *   const cleanup = ensureWheelLock(document, handler);
 *   globalListenerManager.register('my-hook-wheel', cleanup);
 *
 *   onCleanup(() => globalListenerManager.unregister('my-hook-wheel'));
 * }
 * ```
 */
export const globalListenerManager = new SingletonListenerManager();
