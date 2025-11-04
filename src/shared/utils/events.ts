import { logger } from '@shared/logging';
import { isGalleryInternalElement } from './utils';
import { globalTimerManager } from './timer-management';
import { resetKeyboardDebounceState } from './keyboard-debounce';
import { findTwitterScrollContainer } from './core-utils';
import { handleKeyboardEvent } from './events/handlers/keyboard-handler';
import { handleMediaClick } from './events/handlers/media-click-handler';
import type { MediaInfo } from '../types/media.types';

interface EventContext {
  id: string;
  element: EventTarget;
  type: string;
  listener: EventListener;
  options?: AddEventListenerOptions | undefined;
  context?: string | undefined;
  created: number;
}

const listeners = new Map<string, EventContext>();

function generateListenerId(ctx?: string): string {
  const r = Math.random().toString(36).substr(2, 9);
  return ctx ? `${ctx}:${r}` : r;
}

/**
 * 이벤트 리스너 추가 (안전성 검사 포함)
 */
export function addListener(
  element: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions,
  context?: string
): string {
  const id = generateListenerId(context);

  try {
    if (!element || typeof element.addEventListener !== 'function') {
      logger.warn(`Invalid element passed to addEventListenerManaged: ${element}`, {
        type,
        context,
        elementType: typeof element,
        hasAddEventListener: element && typeof element.addEventListener,
      });
      return id;
    }

    const signal: AbortSignal | undefined = options?.signal as AbortSignal | undefined;
    if (signal?.aborted) {
      logger.debug(`Skip adding listener due to pre-aborted signal: ${type} (${id})`, {
        context,
      });
      return id;
    }

    element.addEventListener(type, listener, options);

    listeners.set(id, {
      id,
      element,
      type,
      listener,
      options,
      context,
      created: Date.now(),
    });

    if (signal && typeof signal.addEventListener === 'function') {
      const onAbort = () => {
        try {
          removeEventListenerManaged(id);
        } finally {
          try {
            signal.removeEventListener('abort', onAbort);
          } catch {
            logger.debug('AbortSignal removeEventListener safeguard failed (ignored)', {
              context,
            });
          }
        }
      };
      try {
        signal.addEventListener('abort', onAbort, { once: true } as AddEventListenerOptions);
      } catch {
        logger.debug('AbortSignal addEventListener not available (ignored)', { context });
      }
    }

    logger.debug(`Event listener added: ${type} (${id})`, { context });
    return id;
  } catch (error) {
    logger.error(`Failed to add event listener: ${type}`, { error, context });
    return id;
  }
}

export function removeEventListenerManaged(id: string): boolean {
  const eventContext = listeners.get(id);
  if (!eventContext) {
    logger.warn(`Event listener not found for removal: ${id}`);
    return false;
  }

  try {
    eventContext.element.removeEventListener(
      eventContext.type,
      eventContext.listener,
      eventContext.options
    );
    listeners.delete(id);

    logger.debug(`Event listener removed: ${eventContext.type} (${id})`);
    return true;
  } catch (error) {
    logger.error(`Failed to remove event listener: ${id}`, error);
    return false;
  }
}

/**
 * 컨텍스트별 리스너 제거
 */
export function removeEventListenersByContext(context: string): number {
  let removedCount = 0;
  for (const [id, eventContext] of listeners.entries()) {
    if (eventContext.context === context) {
      if (removeEventListenerManaged(id)) removedCount++;
    }
  }
  return removedCount;
}

/**
 * 모든 리스너 제거
 */
export function removeAllEventListeners(): void {
  for (const id of Array.from(listeners.keys())) {
    removeEventListenerManaged(id);
  }
}

/**
 * 리스너 상태 조회
 */
export function getEventListenerStatus() {
  const contextGroups = new Map<string, number>();
  const typeGroups = new Map<string, number>();

  for (const eventContext of listeners.values()) {
    const context = eventContext.context || 'default';
    contextGroups.set(context, (contextGroups.get(context) || 0) + 1);
    typeGroups.set(eventContext.type, (typeGroups.get(eventContext.type) || 0) + 1);
  }

  return {
    total: listeners.size,
    byContext: Object.fromEntries(contextGroups),
    byType: Object.fromEntries(typeGroups),
    listeners: Array.from(listeners.values()).map(ctx => ({
      id: ctx.id,
      type: ctx.type,
      context: ctx.context,
      created: ctx.created,
    })),
  };
} /**
 * 이벤트 핸들러 인터페이스 (handlers에서 export됨)
 */
export interface EventHandlers {
  onMediaClick: (mediaInfo: MediaInfo, element: HTMLElement, event: MouseEvent) => Promise<void>;
  onGalleryClose: () => void;
  onKeyboardEvent?: (event: KeyboardEvent) => void;
}

/**
 * 갤러리 이벤트 옵션 (handlers에서 export됨)
 */
export interface GalleryEventOptions {
  enableKeyboard: boolean;
  enableMediaDetection: boolean;
  debugMode: boolean;
  preventBubbling: boolean;
  context: string;
}

// 갤러리 이벤트 상태
let galleryEventState = {
  initialized: false,
  listenerIds: [] as string[],
  options: null as GalleryEventOptions | null,
  handlers: null as EventHandlers | null,
  scopeAbortController: null as AbortController | null,
  scopeTarget: null as WeakRef<HTMLElement> | null,
  scopeRefreshTimer: null as number | null,
  keyListener: null as EventListener | null,
  clickListener: null as EventListener | null,
  spaRouterCleanup: null as (() => void) | null, // SPA router cleanup function
};

function resolveTwitterEventScope(): HTMLElement | null {
  const candidate = findTwitterScrollContainer();
  if (!candidate) {
    return null;
  }
  if (candidate === document.body) {
    return null;
  }
  if (!(candidate instanceof HTMLElement)) {
    return null;
  }
  return candidate;
}

function clearScopedListeners(): void {
  galleryEventState.listenerIds.forEach(id => removeEventListenerManaged(id));
  galleryEventState.listenerIds = [];
  if (galleryEventState.scopeAbortController) {
    galleryEventState.scopeAbortController.abort();
    galleryEventState.scopeAbortController = null;
  }
  galleryEventState.scopeTarget = null;
}

function scheduleScopeRefresh(ensureScope: () => void, intervalMs: number = 1000): void {
  if (galleryEventState.scopeRefreshTimer !== null) {
    return;
  }

  galleryEventState.scopeRefreshTimer = globalTimerManager.setInterval(() => {
    ensureScope();
  }, intervalMs);
}

function cancelScopeRefresh(): void {
  if (galleryEventState.scopeRefreshTimer !== null) {
    globalTimerManager.clearInterval(galleryEventState.scopeRefreshTimer);
    galleryEventState.scopeRefreshTimer = null;
  }
}

function bindScopedListeners(
  target: HTMLElement,
  keyHandler: EventListener,
  clickHandler: EventListener,
  options: GalleryEventOptions
): void {
  clearScopedListeners();

  const controller = new AbortController();
  galleryEventState.scopeAbortController = controller;
  galleryEventState.scopeTarget = new WeakRef(target);

  const listenerOptions: AddEventListenerOptions = {
    passive: false,
    capture: true,
    signal: controller.signal,
  };

  const keyId = addListener(target, 'keydown', keyHandler, listenerOptions, options.context);
  const clickId = addListener(target, 'click', clickHandler, listenerOptions, options.context);

  galleryEventState.listenerIds = [keyId, clickId];
}

function ensureScopedEventTarget(
  keyHandler: EventListener,
  clickHandler: EventListener,
  options: GalleryEventOptions
): void {
  const existingTarget = galleryEventState.scopeTarget?.deref();
  if (existingTarget?.isConnected) {
    return;
  }

  const scope = resolveTwitterEventScope();
  if (!scope) {
    scheduleScopeRefresh(() => ensureScopedEventTarget(keyHandler, clickHandler, options));
    return;
  }

  cancelScopeRefresh();
  bindScopedListeners(scope, keyHandler, clickHandler, options);
}

/**
 * 갤러리 이벤트 초기화
 * Phase 305: cleanup 함수를 반환
 */
export async function initializeGalleryEvents(
  handlers: EventHandlers,
  optionsOrRoot?: Partial<GalleryEventOptions> | HTMLElement
): Promise<() => void> {
  try {
    if (galleryEventState.initialized) {
      cleanupGalleryEvents();
    }

    // Phase 305: galleryRoot 파라미터 지원 (선택적)
    let finalOptions: GalleryEventOptions;
    let explicitGalleryRoot: HTMLElement | null = null;

    if (optionsOrRoot instanceof HTMLElement) {
      // galleryRoot가 명시적으로 제공된 경우
      explicitGalleryRoot = optionsOrRoot;
      finalOptions = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
      };
    } else {
      // 기존 options 객체 또는 undefined
      const options = optionsOrRoot || {};
      finalOptions = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
        ...options,
      };
    }

    galleryEventState.options = finalOptions;
    galleryEventState.handlers = handlers;

    const keyHandler: EventListener = (evt: Event) => {
      const event = evt as KeyboardEvent;
      handleKeyboardEvent(event, handlers, finalOptions);
    };

    const clickHandler: EventListener = async (evt: Event) => {
      const event = evt as MouseEvent;
      const result = await handleMediaClick(event, handlers, finalOptions);
      if (result.handled && finalOptions.preventBubbling) {
        event.stopPropagation();
        event.preventDefault();
      }
    };

    galleryEventState.keyListener = keyHandler;
    galleryEventState.clickListener = clickHandler;

    // Phase 305: 명시적 galleryRoot가 있으면 직접 바인딩
    if (explicitGalleryRoot) {
      bindScopedListeners(explicitGalleryRoot, keyHandler, clickHandler, finalOptions);
    } else {
      // 기존 로직: Twitter 범위 자동 감지
      ensureScopedEventTarget(keyHandler, clickHandler, finalOptions);
    }

    galleryEventState.initialized = true;

    // **SPA Router Observer Setup**
    // Observe SPA routing changes (pushState, replaceState, popstate) and re-initialize event listeners
    try {
      const { initializeSPARouterObserver, onRouteChange } = await import('./spa-router-observer');

      // Initialize the SPA router observer once
      initializeSPARouterObserver();

      // Register callback for route changes
      const unsubscribe = onRouteChange((oldUrl, newUrl) => {
        logger.info('[GalleryEvents] SPA route changed, re-initializing event listeners', {
          oldUrl,
          newUrl,
        });

        // Re-establish event listeners on new page
        if (galleryEventState.keyListener && galleryEventState.clickListener) {
          ensureScopedEventTarget(
            galleryEventState.keyListener,
            galleryEventState.clickListener,
            finalOptions
          );
        }
      });

      galleryEventState.spaRouterCleanup = unsubscribe;

      logger.debug('[GalleryEvents] SPA router observer registered');
    } catch (error) {
      logger.warn('[GalleryEvents] Failed to setup SPA router observer:', error);
    }

    // Phase 305: cleanup 함수 반환
    return () => {
      cleanupGalleryEvents();
    };
  } catch (error) {
    logger.error('Failed to initialize gallery events:', error);
    throw error;
  }
}

/**
 * 미디어 클릭 처리
 *
 * Phase 228.1: 이벤트 캡처 최적화
 * Phase 241: event.target 타입 가드 적용
 * - 빠른 경로 체크: 미디어 컨테이너 범위 확인 먼저
 * - 비처리 가능한 요소는 조기 종료 (불필요한 오버헤드 감소)
 */
/**
 * 키보드 이벤트 처리
 */
/**
 * 갤러리 이벤트 정리
 */
export function cleanupGalleryEvents(): void {
  try {
    if (galleryEventState.listenerIds.length > 0) {
      galleryEventState.listenerIds.forEach(id => {
        removeEventListenerManaged(id);
      });
    }

    if (galleryEventState.options?.context) {
      removeEventListenersByContext(galleryEventState.options.context);
    }

    cancelScopeRefresh();
    clearScopedListeners();

    // 키보드 debounce 상태 초기화
    resetKeyboardDebounceState();

    // **SPA Router Cleanup**
    if (galleryEventState.spaRouterCleanup) {
      try {
        galleryEventState.spaRouterCleanup();
        logger.debug('[GalleryEvents] SPA router observer unregistered');
      } catch (error) {
        logger.warn('[GalleryEvents] Failed to cleanup SPA router observer:', error);
      }
    }

    galleryEventState = {
      initialized: false,
      listenerIds: [],
      options: null,
      handlers: null,
      scopeAbortController: null,
      scopeTarget: null,
      scopeRefreshTimer: null,
      keyListener: null,
      clickListener: null,
      spaRouterCleanup: null,
    };
  } catch (error) {
    logger.error('Error cleaning up gallery events:', error);
  }
}

/**
 * 갤러리 이벤트 옵션 업데이트
 */
export function updateGalleryEventOptions(newOptions: Partial<GalleryEventOptions>): void {
  if (galleryEventState.options) {
    galleryEventState.options = { ...galleryEventState.options, ...newOptions };
  }
}
/**
 * 갤러리 이벤트 상태 스냅샷
 */
export function getGalleryEventSnapshot() {
  return {
    initialized: galleryEventState.initialized,
    listenerCount: galleryEventState.listenerIds.length,
    options: galleryEventState.options,
    hasHandlers: Boolean(galleryEventState.handlers),
    hasScopedTarget: Boolean(galleryEventState.scopeTarget?.deref()),
  };
}

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
