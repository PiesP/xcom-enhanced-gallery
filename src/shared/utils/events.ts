import { logger } from '@shared/logging';
import { isGalleryInternalElement } from './utils';
// Import from new modular layers
import {
  initializeGalleryEvents as _initializeGalleryEvents,
  cleanupGalleryEvents as _cleanupGalleryEvents,
  updateGalleryEventOptions as _updateGalleryEventOptions,
  getGalleryEventSnapshot as _getGalleryEventSnapshot,
} from './events/lifecycle';
import {
  addListener,
  removeEventListenerManaged,
  removeEventListenersByContext,
  removeAllEventListeners,
  getEventListenerStatus,
} from './events/core';
import type { EventContext, EventHandlers, GalleryEventOptions } from './events/core';

// Re-export core functions and types for backward compatibility
export {
  addListener,
  removeEventListenerManaged,
  removeEventListenersByContext,
  removeAllEventListeners,
  getEventListenerStatus,
};
export type { EventContext, EventHandlers, GalleryEventOptions };

// Re-export lifecycle functions with original signatures
export const initializeGalleryEvents = _initializeGalleryEvents;
export const cleanupGalleryEvents = _cleanupGalleryEvents;
export const updateGalleryEventOptions = _updateGalleryEventOptions;
export const getGalleryEventSnapshot = _getGalleryEventSnapshot;

/**
 * PC-only 정책: Touch/Pointer 이벤트 명시적 차단
 * CodeQL `forbidden-touch-events.ql` 검증 대상
 *
 * 터치 이벤트: touchstart, touchmove, touchend, touchcancel
 * 포인터 이벤트: pointerdown, pointermove, pointerup, pointercancel, pointerenter, pointerleave
 *
 * Phase 229: Pointer 이벤트 정책 변경
 * - Touch 이벤트: 갤러리 루트 범위에서만 차단 (PC-only 정책 핵심)
 * - Pointer 이벤트:
 *   - 갤러리 내부: 차단 (갤러리 전용 Mouse 이벤트 사용)
 *   - 폼 컨트롤: 허용 (select/input/textarea/button 등)
 */
const FORM_CONTROL_SELECTORS =
  'select, input, textarea, button, [role="listbox"], [role="combobox"]';

/**
 * 요소가 폼 컨트롤인지 확인
 * Phase 243: 재발 방지를 위한 명시적 함수 추출
 */
function isFormControlElement(element: HTMLElement): boolean {
  return Boolean(
    element.matches?.(FORM_CONTROL_SELECTORS) || element.closest?.(FORM_CONTROL_SELECTORS)
  );
}

/**
 * 포인터 이벤트 차단 여부 결정
 * Phase 243: 정책 결정 로직을 명확한 함수로 분리
 *
 * @returns 'allow' | 'block' | 'log'
 */
function getPointerEventPolicy(
  target: HTMLElement,
  pointerType: string
): 'allow' | 'block' | 'log' {
  // 1. 마우스 + 폼 컨트롤 → 허용 (Phase 242)
  if (pointerType === 'mouse' && isFormControlElement(target)) {
    return 'allow';
  }

  // 2. 갤러리 내부 → 차단
  if (isGalleryInternalElement(target)) {
    return 'block';
  }

  // 3. 기타 → 로깅만
  return 'log';
}

export function applyGalleryPointerPolicy(root: HTMLElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;

  const touchEvents: Array<keyof HTMLElementEventMap> = [
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',
  ];

  const pointerEvents: Array<keyof HTMLElementEventMap> = [
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointercancel',
    'pointerenter',
    'pointerleave',
  ];

  const touchHandler = (evt: Event) => {
    logger.debug('[PC-only policy] Blocked touch event', {
      type: evt.type,
      target: (evt.target as Element | null)?.tagName,
    });
    evt.preventDefault?.();
    evt.stopPropagation?.();
    evt.stopImmediatePropagation?.();
  };

  touchEvents.forEach(eventType => {
    root.addEventListener(eventType, touchHandler, {
      capture: true,
      passive: false,
      signal,
    });
  });

  const pointerHandler = (evt: Event) => {
    const pointerEvent = evt as PointerEvent;
    const rawTarget = evt.target;
    const pointerType =
      typeof pointerEvent.pointerType === 'string' && pointerEvent.pointerType.length > 0
        ? pointerEvent.pointerType
        : 'mouse';

    if (!(rawTarget instanceof HTMLElement)) {
      return;
    }

    const policy = getPointerEventPolicy(rawTarget, pointerType);

    if (policy === 'allow') {
      return;
    }

    if (policy === 'block') {
      evt.preventDefault?.();
      evt.stopPropagation?.();
      evt.stopImmediatePropagation?.();
      logger.debug('[PC-only policy] Blocked pointer event in gallery', {
        type: evt.type,
        pointerType,
        target: rawTarget.tagName,
      });
      return;
    }

    // log only
    logger.trace?.('[PC-only policy] Pointer event allowed (logged)', {
      type: evt.type,
      pointerType,
      target: rawTarget.tagName,
    });
  };

  pointerEvents.forEach(eventType => {
    root.addEventListener(eventType, pointerHandler, {
      capture: true,
      passive: false,
      signal,
    });
  });

  return () => {
    controller.abort();
  };
}
