/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 개선된 갤러리 스크롤 관리 훅
 * @description 마우스 움직임에 의존하지 않는 안정적인 스크롤 처리를 제공
 */

import { getSolidCore } from '@shared/external/vendors';
import { ensureWheelLock } from '@shared/utils/events/wheel';
import { galleryState } from '@shared/state/signals/gallery.signals';

let activeCleanup: (() => void) | null = null;

type MaybeAccessor<T> = T | (() => T);

const BODY_ELEMENTS = new Set<EventTarget | null>([
  typeof document !== 'undefined' ? document.body : null,
  typeof document !== 'undefined' ? document.documentElement : null,
  typeof document !== 'undefined' ? document : null,
  typeof window !== 'undefined' ? window : null,
]);

export type GalleryScrollDirection = 'up' | 'down';

export interface GalleryScrollMeta {
  readonly direction: GalleryScrollDirection;
  readonly event: WheelEvent;
}

export interface UseGalleryScrollOptions {
  container: MaybeAccessor<HTMLElement | null | undefined>;
  onScroll: (delta: number, meta?: GalleryScrollMeta) => void;
  enabled?: MaybeAccessor<boolean>;
  blockTwitterScroll?: MaybeAccessor<boolean>;
  enableScrollDirection?: MaybeAccessor<boolean>;
}

function resolve<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

function resolveWithDefault<T>(value: MaybeAccessor<T> | undefined, fallback: T): T {
  if (value === undefined) {
    return fallback;
  }
  return resolve(value);
}

function isBodyLike(container: HTMLElement | null): boolean {
  if (!container || typeof document === 'undefined') {
    return false;
  }

  return container === document.body || container === document.documentElement;
}

function isTargetWithinContainer(event: WheelEvent, container: HTMLElement): boolean {
  if (!container) {
    return false;
  }

  const target = event.target as Node | null;

  if (target && container.contains(target)) {
    return true;
  }

  if (typeof event.composedPath === 'function') {
    const path = event.composedPath();
    if (path.includes(container)) {
      return true;
    }

    if (isBodyLike(container) && path.some(node => BODY_ELEMENTS.has(node))) {
      return true;
    }
  }

  if (isBodyLike(container)) {
    return BODY_ELEMENTS.has(target);
  }

  return target === container;
}

export function useGalleryScroll(options: UseGalleryScrollOptions): void {
  if (typeof document === 'undefined') {
    return;
  }

  const { onCleanup } = getSolidCore();
  const getGalleryState = galleryState.accessor;

  if (activeCleanup) {
    activeCleanup();
  }

  const containerAccessor = () => resolve(options.container) ?? null;
  const getEnabled = () => resolveWithDefault(options.enabled, true);
  const getBlockPolicy = () => resolveWithDefault(options.blockTwitterScroll, true);
  const getDirectionFlag = () => resolveWithDefault(options.enableScrollDirection, false);

  let scheduled = false;
  let accumulatedDelta = 0;
  let lastEvent: WheelEvent | null = null;
  let cancelScheduled: (() => void) | null = null;

  const resetScheduler = () => {
    scheduled = false;
    accumulatedDelta = 0;
    lastEvent = null;
    cancelScheduled = null;
  };

  const cancelScheduledFlush = () => {
    if (cancelScheduled) {
      cancelScheduled();
    }
    resetScheduler();
  };

  const flushScroll = () => {
    const event = lastEvent;
    const delta = accumulatedDelta;

    resetScheduler();

    if (!event || !Number.isFinite(delta) || delta === 0) {
      return;
    }

    if (!getEnabled() || !getGalleryState().isOpen) {
      return;
    }

    const container = containerAccessor();
    if (!container || !isTargetWithinContainer(event, container)) {
      return;
    }

    const callback = options.onScroll;
    if (typeof callback !== 'function') {
      return;
    }

    if (getDirectionFlag()) {
      const direction: GalleryScrollDirection = delta >= 0 ? 'down' : 'up';
      callback(delta, { direction, event });
    } else {
      callback(delta);
    }
  };

  const scheduleFlush = (event: WheelEvent) => {
    accumulatedDelta += event.deltaY;
    lastEvent = event;

    if (scheduled) {
      return;
    }

    scheduled = true;

    if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
      const frameId = requestAnimationFrame(() => {
        flushScroll();
      });

      cancelScheduled = () => {
        cancelAnimationFrame(frameId);
      };
    } else {
      const timeoutId = window.setTimeout(() => {
        flushScroll();
      }, 16);

      cancelScheduled = () => {
        window.clearTimeout(timeoutId);
      };
    }
  };

  const handleWheel = (event: WheelEvent): boolean => {
    const container = containerAccessor();
    if (!container) {
      cancelScheduledFlush();
      return false;
    }

    if (!getEnabled() || !getGalleryState().isOpen) {
      cancelScheduledFlush();
      return false;
    }

    if (isTargetWithinContainer(event, container)) {
      scheduleFlush(event);
      return false;
    }

    cancelScheduledFlush();

    if (getBlockPolicy() && event.cancelable) {
      return true;
    }

    return false;
  };

  const cleanupWheel = ensureWheelLock(document, handleWheel);

  const removeListener = () => {
    cleanupWheel();
    cancelScheduledFlush();
    if (activeCleanup === removeListener) {
      activeCleanup = null;
    }
  };

  activeCleanup = removeListener;

  onCleanup(() => {
    removeListener();
  });
}

export type { UseGalleryScrollOptions as GalleryScrollOptions };
