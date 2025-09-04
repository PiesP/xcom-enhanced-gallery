/**
 * @fileoverview Intersection/Resize Observer Pool (SR-3)
 * 목적: 동일 옵션 조합 재사용으로 메모리/생성 비용 감소 & teardown 안전성 확보
 */
import { logger } from '@shared/logging/logger';

export interface IntersectionPoolOptions extends IntersectionObserverInit {}
export type IntersectionCallback = (entry: IntersectionObserverEntry) => void;

interface ObserverBucket {
  observer: IntersectionObserver;
  targets: Map<Element, IntersectionCallback>;
}

const intersectionPool: Map<string, ObserverBucket> = new Map();

function makeKey(options: IntersectionPoolOptions = {}): string {
  const { root = null, rootMargin = '0px', threshold = 0 } = options;
  return JSON.stringify({
    r: root ? (root as Element).nodeName : 'null',
    m: rootMargin,
    t: Array.isArray(threshold) ? threshold : [threshold],
  });
}

export function registerIntersection(
  element: Element,
  callback: IntersectionCallback,
  options: IntersectionPoolOptions = {}
): () => void {
  if (!element) return () => {};
  if (typeof globalThis.IntersectionObserver !== 'function') {
    logger.warn('[ObserverPool] IntersectionObserver not supported');
    return () => {};
  }

  const key = makeKey(options);
  let bucket = intersectionPool.get(key);
  if (!bucket) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const target = entry.target;
        const b = intersectionPool.get(key);
        if (!b) continue;
        const cb = b.targets.get(target);
        if (cb) {
          try {
            cb(entry);
          } catch (err) {
            logger.warn('[ObserverPool] callback error', err);
          }
        }
      }
    }, options);
    bucket = { observer, targets: new Map() };
    intersectionPool.set(key, bucket);
  }

  bucket.targets.set(element, callback);
  try {
    bucket.observer.observe(element);
  } catch (err) {
    logger.warn('[ObserverPool] observe failed', err);
  }

  return () => {
    try {
      const current = intersectionPool.get(key);
      if (!current) return;
      current.targets.delete(element);
      try {
        current.observer.unobserve(element);
      } catch {
        /* noop */
      }
      if (current.targets.size === 0) {
        current.observer.disconnect();
        intersectionPool.delete(key);
      }
    } catch (err) {
      logger.warn('[ObserverPool] unobserve failed', err);
    }
  };
}

// Debug / 테스트용 메트릭
export function __debugGetIntersectionObserverStats(): { total: number; counts: number[] } {
  return {
    total: intersectionPool.size,
    counts: Array.from(intersectionPool.values()).map(b => b.targets.size),
  };
}
