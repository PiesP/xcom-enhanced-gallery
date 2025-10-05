/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 개선된 갤러리 스크롤 관리 훅
 * @description 마우스 움직임에 의존하지 않는 안정적인 스크롤 처리를 제공
 */

import { getSolidCore } from '@shared/external/vendors';
import { ensureWheelLock } from '@shared/utils/events/wheel';
import { isEventWithinContainer } from '@shared/utils/events/event-origin';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { resolve, resolveWithDefault, type ReactiveValue } from '@shared/utils/reactive-accessor';
import { globalListenerManager } from '@shared/utils/singleton-listener';

export type GalleryScrollDirection = 'up' | 'down';

export interface GalleryScrollMeta {
  readonly direction: GalleryScrollDirection;
  readonly event: WheelEvent;
}

export interface UseGalleryScrollOptions {
  container: ReactiveValue<HTMLElement | null | undefined>;
  onScroll: (delta: number, meta?: GalleryScrollMeta) => void;
  enabled?: ReactiveValue<boolean>;
  blockTwitterScroll?: ReactiveValue<boolean>;
  enableScrollDirection?: ReactiveValue<boolean>;
}

const LISTENER_KEY = 'gallery-wheel';

export function useGalleryScroll(options: UseGalleryScrollOptions): void {
  if (typeof document === 'undefined') {
    return;
  }

  const { onCleanup } = getSolidCore();
  const getGalleryState = galleryState; // Native SolidJS Accessor

  const containerAccessor = () => resolve(options.container) ?? null;
  const getEnabled = () => resolveWithDefault(options.enabled, true);
  const getBlockPolicy = () => resolveWithDefault(options.blockTwitterScroll, true);

  const handleWheel = (event: WheelEvent): boolean => {
    const container = containerAccessor();
    if (!container) {
      return false;
    }

    if (!getEnabled() || !getGalleryState().isOpen) {
      return false;
    }

    if (isEventWithinContainer(event, container)) {
      // 갤러리 내부 이벤트는 네이티브 스크롤 허용
      return false;
    }

    // 배경(Twitter) 이벤트는 차단하여 배경 스크롤 방지
    if (getBlockPolicy() && event.cancelable) {
      return true;
    }

    return false;
  };

  const cleanupWheel = ensureWheelLock(document, handleWheel);

  globalListenerManager.register(LISTENER_KEY, cleanupWheel);

  onCleanup(() => {
    globalListenerManager.unregister(LISTENER_KEY);
  });
}

export type { UseGalleryScrollOptions as GalleryScrollOptions };
