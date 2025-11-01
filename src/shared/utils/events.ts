/**
 * @fileoverview 통합 이벤트 관리 시스템
 * PC-only 이벤트 정책 (MANDATORY):
 * - 허용: click, keydown/keyup, wheel, contextmenu, mouse*
 * - 금지: touchstart/move/end/cancel, pointerdown/up/move/enter/leave/cancel
 * - 검증: CodeQL `forbidden-touch-events.ql` 및 타입 검사
 */

import { logger } from '@shared/logging';
import { STABLE_SELECTORS } from '../../constants';
import { isGalleryInternalElement, isVideoControlElement } from './utils';
import { isHTMLElement } from './type-guards';
import {
  detectMediaFromClick as detectMediaElement,
  isProcessableMedia,
} from './media/media-click-detector';
import { isMediaServiceLike } from './type-safety-helpers';
import {
  gallerySignals,
  navigateToItem,
  navigatePrevious,
  navigateNext,
} from '../state/signals/gallery.signals';
import { getMediaServiceFromContainer } from '../container/service-accessors';
import { globalTimerManager } from './timer-management';
import {
  shouldExecuteVideoControlKey,
  shouldExecutePlayPauseKey,
  resetKeyboardDebounceState,
} from './keyboard-debounce';
import { findTwitterScrollContainer } from './core-utils';
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

type MediaServiceLike = {
  togglePlayPauseCurrent: () => void;
  volumeUpCurrent: () => void;
  volumeDownCurrent: () => void;
  toggleMuteCurrent: () => void;
};

const listeners = new Map<string, EventContext>();
const __videoPlaybackState = new WeakMap<HTMLVideoElement, { playing: boolean }>();

function generateListenerId(ctx?: string): string {
  const r = Math.random().toString(36).substr(2, 9);
  return ctx ? `${ctx}:${r}` : r;
}

/**
 * 현재 갤러리 비디오 요소 가져오기 (공통 헬퍼)
 */
function getCurrentGalleryVideo(): HTMLVideoElement | null {
  try {
    const d =
      typeof document !== 'undefined' ? document : (globalThis as { document?: Document }).document;
    if (!(d instanceof Document)) return null;
    const sel = '#xeg-gallery-root';
    const isel = '[data-xeg-role="items-container"]';
    const it = d.querySelector(sel)?.querySelector(isel) as HTMLElement | null;
    if (!it) return null;
    const idx = gallerySignals.currentIndex.value;
    const itm = it.children?.[idx] as HTMLElement | null;
    return itm?.querySelector('video') as HTMLVideoElement | null;
  } catch {
    return null;
  }
}

/**
 * MediaService 인스턴스 가져오기 (공통 헬퍼)
 */
function getMediaService(): MediaServiceLike | null {
  try {
    const service = getMediaServiceFromContainer();
    // Type Guard를 사용하여 타입 안전성 확보
    if (isMediaServiceLike(service)) {
      return service as unknown as MediaServiceLike;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 안전한 함수 실행 래퍼 (에러 로깅 포함)
 */
function safeExecute(fn: () => void, _ctx: string): void {
  try {
    fn();
  } catch {
    // 무시
  }
}

/**
 * 비디오 볼륨 조절 (공통 로직)
 */
function adjustVideoVolume(delta: number): void {
  const svc = getMediaService();
  if (svc) {
    delta > 0 ? svc.volumeUpCurrent() : svc.volumeDownCurrent();
  } else {
    const v = getCurrentGalleryVideo();
    if (v) {
      const next =
        delta > 0
          ? Math.min(1, Math.round((v.volume + 0.1) * 100) / 100)
          : Math.max(0, Math.round((v.volume - 0.1) * 100) / 100);
      v.volume = next;
      if (next > 0 && v.muted) v.muted = false;
    }
  }
}

/**
 * 트위터 네이티브 갤러리 요소인지 확인 (중복 실행 방지용)
 */
function isTwitterNativeGalleryElement(element: HTMLElement): boolean {
  // 우리의 갤러리 요소는 제외
  if (
    element.closest('.xeg-gallery-container, [data-xeg-gallery], .xeg-gallery') ||
    element.classList.contains('xeg-gallery-item') ||
    element.hasAttribute('data-xeg-gallery-type')
  ) {
    return false;
  }

  const selectors = [
    ...STABLE_SELECTORS.MEDIA_CONTAINERS,
    ...STABLE_SELECTORS.IMAGE_CONTAINERS,
    ...STABLE_SELECTORS.MEDIA_PLAYERS,
    ...STABLE_SELECTORS.MEDIA_LINKS,
    ...STABLE_SELECTORS.MEDIA_VIEWERS,
    'div[role="button"][aria-label*="재생"]',
    'div[role="button"][aria-label*="Play"]',
  ];

  return selectors.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
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
    // 안전성 검사: element가 유효한지 확인
    if (!element || typeof element.addEventListener !== 'function') {
      logger.warn(`Invalid element passed to addEventListenerManaged: ${element}`, {
        type,
        context,
        elementType: typeof element,
        hasAddEventListener: element && typeof element.addEventListener,
      });
      return id; // 빈 ID 반환하여 오류 방지
    }

    // AbortSignal 지원: 이미 종료된 시그널이면 등록을 건너뜀
    const signal: AbortSignal | undefined = options?.signal as AbortSignal | undefined;
    if (signal?.aborted) {
      logger.debug(`Skip adding listener due to pre-aborted signal: ${type} (${id})`, {
        context,
      });
      return id; // 등록/저장하지 않음
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

    // AbortSignal 지원: abort 시 자동 해제
    if (signal && typeof signal.addEventListener === 'function') {
      const onAbort = () => {
        try {
          removeEventListenerManaged(id);
        } finally {
          // once 옵션으로 자동 해제되지만, 방어적으로 제거 시도
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
        // ignore — 환경에 따라 EventTarget 미구현일 수 있음
        logger.debug('AbortSignal addEventListener not available (ignored)', { context });
      }
    }

    logger.debug(`Event listener added: ${type} (${id})`, { context });
    return id;
  } catch (error) {
    logger.error(`Failed to add event listener: ${type}`, { error, context });
    return id; // 빈 ID 반환하여 오류 방지
  }
}

/**
 * 이벤트 리스너 제거
 */
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
} // Helper 함수들
function checkGalleryOpen(): boolean {
  try {
    return gallerySignals.isOpen.value;
  } catch {
    return false;
  }
}

function checkInsideGallery(element: HTMLElement | null): boolean {
  try {
    if (!element) return false;
    return isGalleryInternalElement(element);
  } catch {
    return false;
  }
}

async function detectMediaFromEvent(event: MouseEvent): Promise<MediaInfo | null> {
  try {
    const target = event.target;
    if (!target || !isHTMLElement(target)) return null;

    const result = detectMediaElement(target);

    if (result?.type !== 'none' && result.mediaUrl) {
      const mediaInfo: MediaInfo = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: result.mediaUrl,
        originalUrl: result.mediaUrl,
        type: result.type === 'video' ? 'video' : result.type === 'image' ? 'image' : 'image',
        filename: extractFilenameFromUrl(result.mediaUrl) || 'untitled',
      };

      return mediaInfo;
    }
    return null;
  } catch (error) {
    logger.warn('Failed to detect media from click:', error);
    return null;
  }
}

function extractFilenameFromUrl(url: string): string | null {
  try {
    // URL 생성자를 안전하게 시도
    let URLConstructor: typeof URL | undefined;

    if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
      URLConstructor = globalThis.URL;
    } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
      URLConstructor = window.URL;
    }

    if (!URLConstructor) {
      // Fallback: 간단한 파싱
      const lastSlashIndex = url.lastIndexOf('/');
      if (lastSlashIndex === -1) return null;
      const filename = url.substring(lastSlashIndex + 1);
      return filename.length > 0 ? filename : null;
    }

    const urlObj = new URLConstructor(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    return filename && filename.length > 0 ? filename : null;
  } catch {
    return null;
  }
}

/**
 * 이벤트 처리 결과
 */
interface EventHandlingResult {
  handled: boolean;
  reason?: string;
  mediaInfo?: MediaInfo;
}

/**
 * 이벤트 핸들러 인터페이스
 */
export interface EventHandlers {
  onMediaClick: (mediaInfo: MediaInfo, element: HTMLElement, event: MouseEvent) => Promise<void>;
  onGalleryClose: () => void;
  onKeyboardEvent?: (event: KeyboardEvent) => void;
}

/**
 * 갤러리 이벤트 옵션
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
 */
export async function initializeGalleryEvents(
  handlers: EventHandlers,
  options: Partial<GalleryEventOptions> = {}
): Promise<void> {
  try {
    if (galleryEventState.initialized) {
      cleanupGalleryEvents();
    }

    const finalOptions: GalleryEventOptions = {
      enableKeyboard: true,
      enableMediaDetection: true,
      debugMode: false,
      preventBubbling: true,
      context: 'gallery',
      ...options,
    };

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

    ensureScopedEventTarget(keyHandler, clickHandler, finalOptions);

    galleryEventState.initialized = true;
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
async function handleMediaClick(
  event: MouseEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): Promise<EventHandlingResult> {
  try {
    const target = event.target;
    if (!isHTMLElement(target)) {
      return { handled: false, reason: 'Invalid target (not HTMLElement)' };
    }

    // **Phase 228.1: 빠른 경로 체크 (조기 종료)**
    // 미디어 컨테이너 범위 확인 - 가장 먼저 검사하여 불필요한 처리 제거
    if (!options.enableMediaDetection) {
      return { handled: false, reason: 'Media detection disabled' };
    }

    // 갤러리 내부 클릭인지 확인
    if (checkGalleryOpen() && checkInsideGallery(target)) {
      return { handled: false, reason: 'Gallery internal event' };
    }

    // 비디오 컨트롤 클릭인지 확인
    if (isVideoControlElement(target)) {
      return { handled: false, reason: 'Video control element' };
    }

    // **빠른 범위 체크: 미디어 컨테이너 범위 밖이면 조기 종료**
    // 이 체크는 isProcessableMedia()보다 먼저 실행되어 성능 개선
    const mediaContainerSelectors = [
      ...STABLE_SELECTORS.IMAGE_CONTAINERS,
      ...STABLE_SELECTORS.MEDIA_PLAYERS,
      ...STABLE_SELECTORS.MEDIA_LINKS,
    ].join(', ');

    const isInMediaContainer = target.closest(mediaContainerSelectors);
    if (!isInMediaContainer) {
      return { handled: false, reason: 'Outside media container' };
    }

    if (!isProcessableMedia(target)) {
      return { handled: false, reason: 'Non-processable media target' };
    }

    // **우선순위 1: 트위터 네이티브 갤러리 요소 확인 및 차단 (중복 실행 방지)**
    if (isTwitterNativeGalleryElement(target)) {
      // 트위터 네이티브 이벤트를 즉시 차단
      event.stopImmediatePropagation();
      event.preventDefault();

      // 미디어 감지 후 우리의 갤러리 열기 시도
      if (options.enableMediaDetection) {
        const mediaInfo = await detectMediaFromEvent(event);
        if (mediaInfo) {
          await handlers.onMediaClick(mediaInfo, target, event);
          return {
            handled: true,
            reason: 'Twitter blocked, our gallery opened',
            mediaInfo,
          };
        }
      }
      return { handled: true, reason: 'Twitter native gallery blocked' };
    }

    // **우선순위 2: 일반 미디어 감지 (트위터 요소가 아닌 경우)**
    if (options.enableMediaDetection) {
      const mediaInfo = await detectMediaFromEvent(event);
      if (mediaInfo) {
        await handlers.onMediaClick(mediaInfo, target, event);
        return {
          handled: true,
          reason: 'Media click handled',
          mediaInfo,
        };
      }
    }

    return { handled: false, reason: 'No media detected' };
  } catch (error) {
    logger.error('Error handling media click:', error);
    return { handled: false, reason: `Error: ${error}` };
  }
}

/**
 * 키보드 이벤트 처리
 */
function handleKeyboardEvent(
  event: KeyboardEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): void {
  if (!options.enableKeyboard) return;

  try {
    // 갤러리 열린 상태에서 네비게이션 키들의 기본 스크롤을 차단하여 충돌 방지
    if (checkGalleryOpen()) {
      const key = event.key;
      const isNavKey =
        key === 'Home' ||
        key === 'End' ||
        key === 'PageDown' ||
        key === 'PageUp' ||
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === ' ' ||
        key === 'Space';

      // 비디오 제어 키: Space(재생/일시정지), ArrowUp/Down(볼륨), M/m(음소거)
      const isVideoKey =
        key === ' ' ||
        key === 'Space' ||
        key === 'ArrowUp' ||
        key === 'ArrowDown' ||
        key === 'm' ||
        key === 'M';

      if (isNavKey || isVideoKey) {
        // 기본 스크롤/페이지 전환을 차단
        event.preventDefault();
        event.stopPropagation();

        switch (key) {
          case ' ':
          case 'Space':
            // Keyboard debounce: Space 반복 입력 시 재생/일시정지 중복 호출 방지 (150ms 간격)
            if (shouldExecutePlayPauseKey(event.key)) {
              safeExecute(() => {
                const svc = getMediaService();
                if (svc) {
                  svc.togglePlayPauseCurrent();
                } else {
                  const v = getCurrentGalleryVideo();
                  if (v) {
                    const current = __videoPlaybackState.get(v)?.playing ?? false;
                    const next = !current;
                    next
                      ? (v as HTMLVideoElement & Partial<{ play: () => Promise<void> }>).play?.()
                      : (v as HTMLVideoElement & Partial<{ pause: () => void }>).pause?.();
                    __videoPlaybackState.set(v, { playing: next });
                  }
                }
              }, 'togglePlayPauseCurrent');
            }
            break;
          case 'ArrowLeft':
            safeExecute(() => navigatePrevious('keyboard'), 'navigatePrevious');
            break;
          case 'ArrowRight':
            safeExecute(() => navigateNext('keyboard'), 'navigateNext');
            break;
          case 'Home':
            safeExecute(() => navigateToItem(0, 'keyboard'), 'navigateToItem(Home)');
            break;
          case 'End':
            safeExecute(() => {
              const lastIndex = Math.max(0, gallerySignals.mediaItems.value.length - 1);
              navigateToItem(lastIndex, 'keyboard');
            }, 'navigateToItem(End)');
            break;
          case 'PageDown':
            safeExecute(() => {
              // Page Down: +5 items
              const nextIndex = Math.min(
                gallerySignals.mediaItems.value.length - 1,
                gallerySignals.currentIndex.value + 5
              );
              navigateToItem(nextIndex, 'keyboard');
            }, 'navigateToItem(PageDown)');
            break;
          case 'PageUp':
            safeExecute(() => {
              // Page Up: -5 items
              const prevIndex = Math.max(0, gallerySignals.currentIndex.value - 5);
              navigateToItem(prevIndex, 'keyboard');
            }, 'navigateToItem(PageUp)');
            break;
          case 'ArrowUp':
            // Keyboard debounce: ArrowUp 반복 입력 시 볼륨 조절 과도 호출 방지 (100ms 간격)
            if (shouldExecuteVideoControlKey(event.key)) {
              safeExecute(() => adjustVideoVolume(+0.1), 'volumeUpCurrent');
            }
            break;
          case 'ArrowDown':
            // Keyboard debounce: ArrowDown 반복 입력 시 볼륨 조절 과도 호출 방지 (100ms 간격)
            if (shouldExecuteVideoControlKey(event.key)) {
              safeExecute(() => adjustVideoVolume(-0.1), 'volumeDownCurrent');
            }
            break;
          case 'm':
          case 'M':
            // Keyboard debounce: M 키 반복 입력 시 음소거 토글 중복 호출 방지 (100ms 간격)
            if (shouldExecuteVideoControlKey(event.key)) {
              safeExecute(() => {
                const svc = getMediaService();
                if (svc) {
                  svc.toggleMuteCurrent();
                } else {
                  const v = getCurrentGalleryVideo();
                  if (v) v.muted = !v.muted;
                }
              }, 'toggleMuteCurrent');
            }
            break;
        }

        // 커스텀 핸들러 위임
        if (handlers.onKeyboardEvent) {
          handlers.onKeyboardEvent(event);
        }
        return;
      }
    }

    // ESC 키로 갤러리 닫기
    if (event.key === 'Escape' && checkGalleryOpen()) {
      handlers.onGalleryClose();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // 커스텀 키보드 핸들러 호출
    if (handlers.onKeyboardEvent) {
      handlers.onKeyboardEvent(event);
    }
  } catch (error) {
    logger.error('Error handling keyboard event:', error);
  }
}

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
