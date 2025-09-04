/**
 * @fileoverview Scroll Coordinator (Phase SR-2 Skeleton)
 * Feature Flag: FEATURE_SCROLL_REFACTORED (임시 - constants.ts 추가 예정)
 * 책임:
 *  - 단일 scroll 이벤트 소스 attach
 *  - snapshot signal 업데이트 (throttle: rAF)
 *  - 파생 상태는 후속 Phase 에서 추가
 */
import { signal, computed } from '@preact/signals';
import type { ScrollCoordinatorAPI, ScrollSnapshot, ScrollDirection } from './types';
import { logger } from '@shared/logging/logger';

// 내부 전역 (재실행 안전)
const coordinatorSingleton: { api: ScrollCoordinatorAPI | null } = { api: null };

function createInitialSnapshot(): ScrollSnapshot {
  return { x: 0, y: 0, maxY: 0, atTop: true, atBottom: false };
}

export interface ScrollCoordinatorOptions {
  idleDelay?: number; // ms
}

export function getScrollCoordinator(
  _options: ScrollCoordinatorOptions = {}
): ScrollCoordinatorAPI {
  if (coordinatorSingleton.api) return coordinatorSingleton.api;

  const position = signal<ScrollSnapshot>(createInitialSnapshot());
  const directionInternal = signal<ScrollDirection>('none');
  const idleInternal = signal<boolean>(true);
  const maxYInternal = signal<number>(0);
  const idleDelay = typeof _options.idleDelay === 'number' ? _options.idleDelay : 150;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  // 파생 상태
  const direction = computed<ScrollDirection>(() => directionInternal.value);
  const idle = computed<boolean>(() => idleInternal.value);
  const progress = computed<number>(() => {
    const y = position.value.y;
    const maxY = maxYInternal.value;
    if (maxY <= 0) return 0;
    const p = y / maxY;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  });

  let target: Window | HTMLElement = window;
  let attached = false;
  let lastY = 0;
  let ticking = false;
  // 활동 타임스탬프 (SR-3 idle 파생에서 사용 예정)
  let _lastActivityAt = 0;

  function computeSnapshot(): void {
    try {
      let y: number, x: number, maxY: number;

      if (target instanceof Window) {
        y = target.scrollY || 0;
        x = target.scrollX || 0;

        if (typeof document !== 'undefined' && document.documentElement) {
          const docHeight = document.documentElement.scrollHeight || 0;
          const winHeight = target.innerHeight || 0;
          maxY = Math.max(0, docHeight - winHeight);
        } else {
          maxY = 0;
        }
      } else {
        const el = target as HTMLElement;
        y = el.scrollTop || 0;
        x = el.scrollLeft || 0;
        maxY = Math.max(0, (el.scrollHeight || 0) - (el.clientHeight || 0));
      }

      const atTop = y <= 0;
      const atBottom = maxY <= 0 ? true : y >= maxY;
      const next: ScrollSnapshot = { x, y, maxY, atTop, atBottom };

      const prev = position.value;
      const changed =
        next.y !== prev.y ||
        next.x !== prev.x ||
        next.maxY !== prev.maxY ||
        next.atTop !== prev.atTop ||
        next.atBottom !== prev.atBottom;

      if (changed) position.value = next;
      if (maxYInternal.value !== next.maxY) maxYInternal.value = next.maxY;

      // direction 계산 (y 변화가 있을 때만)
      const dy = y - lastY;
      if (dy !== 0) {
        const nextDir: ScrollDirection = dy > 0 ? 'down' : 'up';
        if (nextDir !== directionInternal.value) directionInternal.value = nextDir;
        lastY = y;
      } else if (Math.abs(y - lastY) < 0.1) {
        // 미세한 변화 또는 정지 상태에서는 'none'으로 설정
        if (directionInternal.value !== 'none') directionInternal.value = 'none';
      }

      // idle 처리: 활동시 false, idleDelay 후 true
      _lastActivityAt = performance.now();
      if (idleInternal.value) idleInternal.value = false;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        idleInternal.value = true;
      }, idleDelay);
    } catch (error) {
      logger.warn('[ScrollCoordinator] snapshot compute failed', error);
    } finally {
      ticking = false;
    }
  }

  function onScroll(): void {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(computeSnapshot);
    }
  }

  function attach(newTarget?: Window | HTMLElement): void {
    try {
      if (attached) return;
      if (newTarget) target = newTarget;
      (target as Window | HTMLElement).addEventListener('scroll', onScroll, {
        passive: true,
      } as AddEventListenerOptions);
      attached = true;
      logger.debug('[ScrollCoordinator] attached');
      computeSnapshot();
    } catch (error) {
      logger.warn('[ScrollCoordinator] attach failed', error);
    }
  }

  function detach(): void {
    try {
      if (!attached) return;
      (target as Window | HTMLElement).removeEventListener('scroll', onScroll);
      attached = false;
      logger.debug('[ScrollCoordinator] detached');
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    } catch (error) {
      logger.warn('[ScrollCoordinator] detach failed', error);
    }
  }

  function subscribe(cb: (snap: ScrollSnapshot) => void): () => void {
    let prev = position.value;
    const stop = position.subscribe(next => {
      if (next !== prev) {
        prev = next;
        try {
          cb(next);
        } catch (e) {
          logger.warn('[ScrollCoordinator] subscriber error', e);
        }
      }
    });
    return stop;
  }

  const api: ScrollCoordinatorAPI = {
    position,
    direction,
    idle,
    progress,
    attach,
    detach,
    subscribe,
  };
  coordinatorSingleton.api = api;
  return api;
}

// EOF
