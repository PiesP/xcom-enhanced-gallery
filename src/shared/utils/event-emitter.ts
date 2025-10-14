/**
 * @fileoverview Event Emitter (Phase 63 - Step 1)
 * @description 경량 타입 안전 이벤트 시스템
 *
 * 목적:
 * - gallerySignals 네비게이션 이벤트 전파
 * - 느슨한 결합 유지 (useGalleryFocusTracker와 gallery.signals 간)
 * - 최소 번들 크기 (+~200 bytes)
 */

/**
 * 타입 안전 이벤트 이미터 생성
 *
 * @example
 * ```ts
 * const emitter = createEventEmitter<{
 *   'user:login': { userId: string };
 *   'user:logout': { userId: string };
 * }>();
 *
 * const unsubscribe = emitter.on('user:login', ({ userId }) => {
 *   console.log(`User ${userId} logged in`);
 * });
 *
 * emitter.emit('user:login', { userId: '123' });
 * unsubscribe();
 * ```
 */
export function createEventEmitter<T extends Record<string, unknown>>() {
  const listeners = new Map<keyof T, Set<(data: unknown) => void>>();

  return {
    /**
     * 이벤트 리스너 등록
     * @returns 구독 해제 함수
     */
    on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(callback as (data: unknown) => void);

      return () => {
        listeners.get(event)?.delete(callback as (data: unknown) => void);
      };
    },

    /**
     * 이벤트 발행 (동기 실행)
     * 리스너 에러는 격리되어 다른 리스너 실행을 방해하지 않음
     */
    emit<K extends keyof T>(event: K, data: T[K]): void {
      const eventListeners = listeners.get(event);
      if (!eventListeners) {
        return;
      }

      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // 에러 격리: 하나의 리스너 실패가 다른 리스너 실행을 막지 않음
          console.error(`[EventEmitter] Listener error for event "${String(event)}":`, error);
        }
      });
    },

    /**
     * 모든 리스너 제거 (선택적)
     */
    dispose(): void {
      listeners.clear();
    },
  };
}
