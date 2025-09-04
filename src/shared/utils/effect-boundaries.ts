/**
 * @fileoverview Phase 5 - Effect Boundary Utilities
 * @description Signals와 side-effect 경계를 관리하는 유틸리티
 */

import { Signal } from '@preact/signals';
import { getPreactSignalsSafe } from '@shared/external/vendors/vendor-api-safe';
import { logger } from '@shared/logging/logger';

/**
 * 격리된 effect 생성 유틸리티
 * @internal - 내부 구현, 외부에서 직접 사용 금지
 */
class IsolatedEffectManager {
  private readonly activeEffects = new Set<() => void>();
  private isDestroyed = false;

  constructor(private readonly name: string) {}

  createEffect<T>(signalOrFn: Signal<T> | (() => T), callback?: (value: T) => void): () => void {
    if (this.isDestroyed) {
      logger.warn(`Attempted to create effect in destroyed manager: ${this.name}`);
      return () => {};
    }

    const { effect: rawEffect } = getPreactSignalsSafe();

    let cleanup: () => void;

    if (callback && typeof signalOrFn === 'object' && 'value' in signalOrFn) {
      // Signal과 callback이 제공된 경우
      cleanup = rawEffect(() => {
        try {
          callback(signalOrFn.value);
        } catch (error) {
          logger.error(`Effect error in ${this.name}:`, error);
        }
      });
    } else if (typeof signalOrFn === 'function') {
      // 함수만 제공된 경우
      cleanup = rawEffect(() => {
        try {
          signalOrFn();
        } catch (error) {
          logger.error(`Effect error in ${this.name}:`, error);
        }
      });
    } else {
      logger.warn(`Invalid effect parameters in ${this.name}`);
      return () => {};
    }

    this.activeEffects.add(cleanup);

    return () => {
      this.activeEffects.delete(cleanup);
      cleanup();
    };
  }

  destroy(): void {
    if (this.isDestroyed) return;

    this.activeEffects.forEach(cleanup => cleanup());
    this.activeEffects.clear();
    this.isDestroyed = true;

    logger.debug(`Effect manager destroyed: ${this.name}`);
  }

  get isActive(): boolean {
    return !this.isDestroyed;
  }

  get effectCount(): number {
    return this.activeEffects.size;
  }
}

/**
 * 격리된 effect 관리자 생성
 *
 * @param name - 디버깅용 이름
 * @returns 격리된 effect 관리자
 *
 * @example
 * ```typescript
 * const effectManager = createIsolatedEffect('GalleryView');
 *
 * // effect 생성
 * const cleanup = effectManager.createEffect(isVisible, (visible) => {
 *   console.log('Gallery visible:', visible);
 * });
 *
 * // 정리
 * effectManager.destroy();
 * ```
 */
export function createIsolatedEffect(name: string): IsolatedEffectManager {
  return new IsolatedEffectManager(name);
}

/**
 * Computed signal 생성 헬퍼 (네이밍 가이드라인 준수)
 *
 * @param computeFn - 계산 함수
 * @param debugName - 디버깅용 이름 (derive* 패턴 권장)
 * @returns Computed signal
 *
 * @example
 * ```typescript
 * const deriveGalleryStatus = createDerivedSignal(
 *   () => isLoading.value ? 'loading' : 'ready',
 *   'deriveGalleryStatus'
 * );
 * ```
 */
export function createDerivedSignal<T>(computeFn: () => T, debugName?: string): Signal<T> {
  const { computed } = getPreactSignalsSafe();

  if (
    debugName &&
    !debugName.startsWith('derive') &&
    !debugName.startsWith('use') &&
    !debugName.includes('Computed')
  ) {
    logger.warn(
      `Signal naming guideline: prefer 'derive*' or 'use*Computed' prefix for: ${debugName}`
    );
  }

  try {
    return computed(computeFn);
  } catch (error) {
    logger.error(`Error creating derived signal ${debugName}:`, error);
    // fallback to simple signal
    const { signal } = getPreactSignalsSafe();
    return signal(undefined as T);
  }
}

/**
 * Effect 생성 헬퍼 (네이밍 가이드라인 준수)
 *
 * @param effectFn - Effect 함수
 * @param debugName - 디버깅용 이름 (effect* 패턴 권장)
 * @returns Cleanup 함수
 *
 * @example
 * ```typescript
 * const cleanup = createEffect(() => {
 *   console.log('Count:', count.value);
 * }, 'effectLogCount');
 * ```
 */
export function createEffect(effectFn: () => void, debugName?: string): () => void {
  if (debugName && !debugName.startsWith('effect') && !debugName.includes('Effect')) {
    logger.warn(`Effect naming guideline: prefer 'effect*' prefix for: ${debugName}`);
  }

  const { effect: rawEffect } = getPreactSignalsSafe();

  return rawEffect(() => {
    try {
      effectFn();
    } catch (error) {
      logger.error(`Effect error ${debugName}:`, error);
    }
  });
}

/**
 * AbortController와 함께 사용하는 effect 생성
 *
 * @param effectFn - Effect 함수 (AbortSignal 받음)
 * @param debugName - 디버깅용 이름
 * @returns Cleanup 함수
 *
 * @example
 * ```typescript
 * const cleanup = createAbortableEffect((abortSignal) => {
 *   fetch(url, { signal: abortSignal })
 *     .then(response => setState(response));
 * }, 'effectFetchData');
 * ```
 */
export function createAbortableEffect(
  effectFn: (abortSignal: AbortSignal) => void,
  debugName?: string
): () => void {
  const abortController = new AbortController();

  const cleanup = createEffect(() => {
    if (!abortController.signal.aborted) {
      effectFn(abortController.signal);
    }
  }, debugName);

  return () => {
    abortController.abort();
    cleanup();
  };
}
