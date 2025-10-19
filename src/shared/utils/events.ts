/**
 * @fileoverview 통합 이벤트 관리 시스템
 */

import { logger } from '../logging/logger';
import { STABLE_SELECTORS } from '../../constants';
import { isGalleryInternalElement, isVideoControlElement } from './utils';
import { detectMediaFromClick as detectMediaElement } from './media/media-click-detector';
import {
  gallerySignals,
  navigateToItem,
  navigatePrevious,
  navigateNext,
} from '../state/signals/gallery.signals';
import { getMediaServiceFromContainer } from '../container/service-accessors';
import { globalTimerManager } from './timer-management';
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
let listenerIdCounter = 0;
const __videoPlaybackState = new WeakMap<HTMLVideoElement, { playing: boolean }>();

function generateListenerId(context?: string): string {
  const timestamp = Date.now();
  const counter = ++listenerIdCounter;
  const random = Math.random().toString(36).substr(2, 6);
  return context
    ? `${context}:${timestamp}_${counter}_${random}`
    : `event_${timestamp}_${counter}_${random}`;
}

/**
 * 현재 갤러리 비디오 요소 가져오기 (공통 헬퍼)
 */
function getCurrentGalleryVideo(): HTMLVideoElement | null {
  try {
    const doc = (
      typeof document !== 'undefined' ? document : (globalThis as { document?: Document }).document
    ) as Document | undefined;
    if (!doc) return null;
    const root = doc.querySelector('#xeg-gallery-root');
    const items = root?.querySelector('[data-xeg-role="items-container"]');
    if (!items) return null;
    const index = gallerySignals.currentIndex.value;
    const target = (items as HTMLElement).children?.[index] as HTMLElement | undefined;
    if (!target) return null;
    const v = target.querySelector('video');
    return v instanceof HTMLVideoElement ? v : null;
  } catch {
    return null;
  }
}

/**
 * MediaService 인스턴스 가져오기 (공통 헬퍼)
 */
function getMediaService(): MediaServiceLike | null {
  try {
    // 설계상 필수 타입 단언 (Phase 103): 서비스 컨테이너 반환값을 구체적 타입으로 변환
    // 이유: getMediaServiceFromContainer()는 범용 object 타입 반환, 구체적 인터페이스 필요
    // 배경: 서비스 컨테이너는 런타임 등록 방식으로 컴파일 타임 타입 추론 불가
    // 대안: 타입 안전 컨테이너 (서비스 키 타입 맵핑) 도입 시 타입 단언 제거 가능 (Phase 104+)
    return getMediaServiceFromContainer() as unknown as MediaServiceLike;
  } catch {
    return null;
  }
}

/**
 * 안전한 함수 실행 래퍼 (에러 로깅 포함)
 */
function safeExecute(fn: () => void, errorContext: string): void {
  try {
    fn();
  } catch (err) {
    logger.debug(`${errorContext} failed`, err);
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
  logger.debug(`Removed ${removedCount} event listeners for context: ${context}`);
  return removedCount;
}

/**
 * 모든 리스너 제거
 */
export function removeAllEventListeners(): void {
  const totalCount = listeners.size;
  for (const id of Array.from(listeners.keys())) {
    removeEventListenerManaged(id);
  }
  logger.debug(`Removed all ${totalCount} event listeners`);
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
}

// Phase 21.6: gallerySignals 사용으로 마이그레이션
// Helper 함수들
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
    const target = event.target as HTMLElement;
    if (!target) return null;

    const result = detectMediaElement(target);

    if (result?.type !== 'none' && result.mediaUrl) {
      const mediaInfo: MediaInfo = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: result.mediaUrl,
        originalUrl: result.mediaUrl,
        type: result.type === 'video' ? 'video' : result.type === 'image' ? 'image' : 'image',
        filename: extractFilenameFromUrl(result.mediaUrl) || 'untitled',
      };

      logger.debug('Media detected and converted:', {
        detectionResult: result,
        mediaInfo,
        confidence: result.confidence,
        method: result.method,
      });

      return mediaInfo;
    }

    logger.debug('No media detected or invalid result:', result);
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
  priorityInterval: null as number | null,
};

/**
 * 갤러리 이벤트 초기화
 */
export async function initializeGalleryEvents(
  handlers: EventHandlers,
  options: Partial<GalleryEventOptions> = {}
): Promise<void> {
  try {
    // 기존 이벤트 정리
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

    // Document 객체 안전성 검사
    const documentElement =
      (typeof document !== 'undefined' && document) ||
      (typeof globalThis !== 'undefined' && globalThis.document) ||
      null;

    if (!documentElement) {
      logger.warn('Document is not available, skipping event registration');
      return;
    }

    // 클릭 이벤트 처리
    const clickHandler: EventListener = async (evt: Event) => {
      const event = evt as MouseEvent;
      const result = await handleMediaClick(event, handlers, finalOptions);
      if (result.handled && finalOptions.preventBubbling) {
        event.stopPropagation();
        event.preventDefault();
      }
    };

    // ESC 키 처리
    const keyHandler: EventListener = (evt: Event) => {
      const event = evt as KeyboardEvent;
      handleKeyboardEvent(event, handlers, finalOptions);
    };

    // 이벤트 리스너 등록 (캡처 단계에서 처리하여 트위터보다 먼저 실행)
    const clickId = addListener(
      documentElement,
      'click',
      clickHandler,
      { passive: false, capture: true },
      finalOptions.context
    );

    const keyId = addListener(
      documentElement,
      'keydown',
      keyHandler,
      { passive: false, capture: true },
      finalOptions.context
    );

    galleryEventState.listenerIds = [clickId, keyId];
    galleryEventState.initialized = true;

    // 우선순위 강화 메커니즘 시작 (트위터가 동적으로 리스너를 추가할 경우 대비)
    startPriorityEnforcement(handlers, finalOptions);

    logger.debug('Gallery events initialized', { options: finalOptions });
  } catch (error) {
    logger.error('Failed to initialize gallery events:', error);
    throw error;
  }
}

function startPriorityEnforcement(handlers: EventHandlers, options: GalleryEventOptions): void {
  // 기존 인터벌 정리
  if (galleryEventState.priorityInterval) {
    globalTimerManager.clearInterval(galleryEventState.priorityInterval);
  }

  // 15초마다 우선순위 재설정 (성능 최적화: 적응형 스케줄링)
  galleryEventState.priorityInterval = globalTimerManager.setInterval(() => {
    try {
      if (!galleryEventState.initialized) return;

      // 갤러리가 열린 상태에서는 우선순위 강화 중단 (메모리 최적화)
      if (checkGalleryOpen()) {
        logger.debug('Gallery is open, skipping priority enforcement');
        return;
      }

      // Document 안전성 검사
      const documentElement =
        (typeof document !== 'undefined' && document) ||
        (typeof globalThis !== 'undefined' && globalThis.document) ||
        null;

      if (!documentElement) {
        logger.debug('Document not available, skipping priority enforcement');
        return;
      }

      // 페이지가 비활성 상태일 때는 스케줄링 중단 (CPU 절약)
      if (documentElement.hidden) {
        logger.debug('Page is hidden, skipping priority enforcement');
        return;
      }

      // 기존 리스너 제거
      galleryEventState.listenerIds.forEach(id => removeEventListenerManaged(id));

      // 새로운 리스너 등록 (최신 우선순위로)
      const clickHandler: EventListener = async (evt: Event) => {
        const event = evt as MouseEvent;
        const result = await handleMediaClick(event, handlers, options);
        if (result.handled && options.preventBubbling) {
          event.stopPropagation();
          event.preventDefault();
        }
      };

      const keyHandler: EventListener = (evt: Event) => {
        const event = evt as KeyboardEvent;
        handleKeyboardEvent(event, handlers, options);
      };

      const clickId = addListener(
        documentElement,
        'click',
        clickHandler,
        { passive: false, capture: true },
        options.context
      );

      const keyId = addListener(
        documentElement,
        'keydown',
        keyHandler,
        { passive: false, capture: true },
        options.context
      );

      galleryEventState.listenerIds = [clickId, keyId];
      logger.debug('Gallery event priority reinforced');
    } catch (error) {
      logger.warn('Failed to reinforce gallery event priority:', error);
    }
  }, 15000);
}

/**
 * 미디어 클릭 처리
 */
async function handleMediaClick(
  event: MouseEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): Promise<EventHandlingResult> {
  try {
    const target = event.target as HTMLElement;

    // 갤러리 내부 클릭인지 확인
    if (checkGalleryOpen() && checkInsideGallery(target)) {
      return { handled: false, reason: 'Gallery internal event' };
    }

    // 비디오 컨트롤 클릭인지 확인
    if (isVideoControlElement(target)) {
      return { handled: false, reason: 'Video control element' };
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
          logger.debug('Twitter gallery blocked, our gallery opened instead');
          return {
            handled: true,
            reason: 'Twitter blocked, our gallery opened',
            mediaInfo,
          };
        }
      }

      logger.debug('Twitter native gallery event blocked');
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
            safeExecute(() => adjustVideoVolume(+0.1), 'volumeUpCurrent');
            break;
          case 'ArrowDown':
            safeExecute(() => adjustVideoVolume(-0.1), 'volumeDownCurrent');
            break;
          case 'm':
          case 'M':
            safeExecute(() => {
              const svc = getMediaService();
              if (svc) {
                svc.toggleMuteCurrent();
              } else {
                const v = getCurrentGalleryVideo();
                if (v) v.muted = !v.muted;
              }
            }, 'toggleMuteCurrent');
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

    // 컨텍스트별 정리 (추가 안전장치)
    if (galleryEventState.options?.context) {
      removeEventListenersByContext(galleryEventState.options.context);
    }

    // 우선순위 강화 인터벌 정리
    if (galleryEventState.priorityInterval) {
      globalTimerManager.clearInterval(galleryEventState.priorityInterval);
    }

    galleryEventState = {
      initialized: false,
      listenerIds: [],
      options: null,
      handlers: null,
      priorityInterval: null,
    };

    logger.debug('Gallery events cleaned up');
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
    logger.debug('Gallery event options updated', newOptions);
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
    hasPriorityInterval: Boolean(galleryEventState.priorityInterval),
  };
}

// 별칭 제거됨: 이벤트 매니저 표면은 Service 레이어의 EventManager로 일원화됩니다.
