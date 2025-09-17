/**
 * @fileoverview 통합 이벤트 관리 시스템
 */

import { logger } from '../logging/logger';
import { globalTimerManager } from './timer-management';
import { isGalleryInternalElement } from './utils';
import { MediaClickDetector } from './media/MediaClickDetector';
import { isVideoControlElement, isTwitterNativeGalleryElement } from '../../constants';
import { galleryState } from '../state/signals/gallery.signals';
import { getMediaServiceFromContainer } from '../container/service-accessors';
import type { MediaInfo } from '../types/media.types';

// 기본 이벤트 관리
interface EventContext {
  id: string;
  element: EventTarget;
  type: string;
  listener: EventListener;
  options?: AddEventListenerOptions | undefined;
  context?: string | undefined;
  created: number;
}

// 모듈 레벨 상태 관리
const listeners = new Map<string, EventContext>();
// De-duplication registry: key -> { masterId, refCount }
interface DedupEntry {
  masterId: string;
  refCount: number;
  element: EventTarget;
  type: string;
  listener: EventListener;
  options?: AddEventListenerOptions | undefined;
}
const dedupRegistry = new Map<string, DedupEntry>();

// Stable identity maps for element and listener
const elementIds = new WeakMap<object, number>();
let elementIdCounter = 0;
function getElementId(element: EventTarget): number {
  const key = element as unknown as object;
  let id = elementIds.get(key);
  if (!id) {
    id = ++elementIdCounter;
    elementIds.set(key, id);
  }
  return id;
}

const listenerIds = new WeakMap<Function, number>();
let listenerFnIdCounter = 0;
function getListenerId(fn: EventListener): number {
  const key = fn as unknown as Function;
  let id = listenerIds.get(key);
  if (!id) {
    id = ++listenerFnIdCounter;
    listenerIds.set(key, id);
  }
  return id;
}

type ListenerOptionsWithSignal = AddEventListenerOptions & {
  signal?: {
    aborted: boolean;
    addEventListener?: (
      type: 'abort',
      listener: () => void,
      options?: AddEventListenerOptions
    ) => void;
    removeEventListener?: (type: 'abort', listener: () => void) => void;
  };
};

const signalIds = new WeakMap<object, number>();
let signalIdCounter = 0;
function getSignalId(signalObj: object): number {
  let id = signalIds.get(signalObj);
  if (!id) {
    id = ++signalIdCounter;
    signalIds.set(signalObj, id);
  }
  return id;
}

function getOptionsKey(options?: AddEventListenerOptions): string {
  const o = options as ListenerOptionsWithSignal | undefined;
  const capture = o?.capture ? 1 : 0;
  const passive = o?.passive ? 1 : 0;
  const once = o?.once ? 1 : 0;
  const hasSignal = o?.signal ? 1 : 0;
  const sigId = hasSignal ? getSignalId(o!.signal as unknown as object) : 0;
  return `${capture}:${passive}:${once}:${hasSignal ? 'sig' : 'nosig'}:${sigId}`;
}
let listenerIdCounter = 0;
// Fallback 재생 상태 추적(서비스 미가용 시 키보드 제어용)
const __videoPlaybackState = new WeakMap<HTMLVideoElement, { playing: boolean }>();

// Local minimal contract to avoid importing service types from utils layer
type MediaServiceLike = {
  togglePlayPauseCurrent: () => void;
  volumeUpCurrent: () => void;
  volumeDownCurrent: () => void;
  toggleMuteCurrent: () => void;
};

/**
 * 고유 리스너 ID 생성
 */
function generateListenerId(context?: string): string {
  const timestamp = Date.now();
  const counter = ++listenerIdCounter;
  const random = Math.random().toString(36).substr(2, 6);

  return context
    ? `${context}:${timestamp}_${counter}_${random}`
    : `event_${timestamp}_${counter}_${random}`;
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

    // If AbortSignal provided and already aborted, skip any registration
    const abortSignal = (options as ListenerOptionsWithSignal | undefined)?.signal;
    if (abortSignal?.aborted) {
      logger.debug(`Skip adding listener due to pre-aborted signal: ${type} (${id})`, {
        context,
      });
      return id;
    }

    // De-duplication key: element identity + type + listener identity + options signature
    const key = `${getElementId(element)}|${type}|${getListenerId(listener)}|${getOptionsKey(options)}`;
    const existing = dedupRegistry.get(key);

    if (existing) {
      // Increase refCount and alias this id to master id in listeners map (without double addEventListener)
      existing.refCount += 1;
      listeners.set(id, {
        id,
        element,
        type,
        listener,
        options,
        context,
        created: Date.now(),
      });
      logger.debug(`Event listener deduped: ${type} (${id} -> ${existing.masterId})`, {
        context,
      });
      // attach abort handler for this alias as well
      if (abortSignal && typeof abortSignal.addEventListener === 'function') {
        const onAbort = () => {
          try {
            removeEventListenerManaged(id);
          } finally {
            try {
              abortSignal.removeEventListener?.('abort', onAbort);
            } catch {
              /* ignore */
            }
          }
        };
        try {
          abortSignal.addEventListener('abort', onAbort, { once: true } as AddEventListenerOptions);
        } catch {
          logger.debug('AbortSignal addEventListener not available (ignored)', { context });
        }
      }
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

    // Create dedup entry as master
    dedupRegistry.set(key, {
      masterId: id,
      refCount: 1,
      element,
      type,
      listener,
      options,
    });

    // AbortSignal 지원: abort 시 자동 해제
    if (abortSignal && typeof abortSignal.addEventListener === 'function') {
      const onAbort = () => {
        try {
          removeEventListenerManaged(id);
        } finally {
          // once 옵션으로 자동 해제되지만, 방어적으로 제거 시도
          try {
            abortSignal.removeEventListener?.('abort', onAbort);
          } catch {
            logger.debug('AbortSignal removeEventListener safeguard failed (ignored)', {
              context,
            });
          }
        }
      };
      try {
        abortSignal.addEventListener('abort', onAbort, { once: true } as AddEventListenerOptions);
      } catch {
        // ignore — 환경에 따라 EventTarget 미구현일 수 있음
        logger.debug('AbortSignal addEventListener not available (ignored)', { context });
      }
    }

    // Debug log with sampling for high-frequency types to reduce noise in dev
    debugLogEvent(`Event listener added: ${type} (${id})`, type, { context });
    return id;
  } catch (error) {
    logger.error(`Failed to add event listener: ${type}`, { error, context });
    return id; // 빈 ID 반환하여 오류 방지
  }
}

/**
 * 다중 이벤트 리스너 추가
 */
export function addMultipleEventListeners(
  element: EventTarget,
  types: string[],
  listener: EventListener,
  options?: AddEventListenerOptions,
  context?: string
): string[] {
  return types.map(type => addListener(element, type, listener, options, context));
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
    // Reconstruct the de-dup key used during registration
    const key = `${getElementId(eventContext.element)}|${eventContext.type}|${getListenerId(eventContext.listener)}|${getOptionsKey(eventContext.options)}`;

    const entry = dedupRegistry.get(key);
    if (entry) {
      entry.refCount -= 1;
      listeners.delete(id);
      if (entry.refCount <= 0) {
        // Actually remove the DOM listener once
        entry.element.removeEventListener(
          entry.type,
          entry.listener as EventListener,
          entry.options as AddEventListenerOptions | undefined
        );
        dedupRegistry.delete(key);
        debugLogEvent(`Event listener removed: ${eventContext.type} (${id})`, eventContext.type);
      } else {
        debugLogEvent(
          `Event listener dereferenced: ${eventContext.type} (${id}), refs=${entry.refCount}`,
          eventContext.type
        );
      }
      return true;
    }

    // Fallback: if no registry entry exists (legacy), remove directly
    eventContext.element.removeEventListener(
      eventContext.type,
      eventContext.listener,
      eventContext.options
    );
    listeners.delete(id);
    debugLogEvent(
      `Event listener removed (no-registry): ${eventContext.type} (${id})`,
      eventContext.type
    );
    return true;
  } catch (error) {
    logger.error(`Failed to remove event listener: ${id}`, error);
    return false;
  }
}

/**
 * 컨텍스트별 이벤트 리스너 제거
 */
export function removeEventListenersByContext(context: string): number {
  let removedCount = 0;

  for (const [id, eventContext] of listeners.entries()) {
    if (eventContext.context === context) {
      if (removeEventListenerManaged(id)) {
        removedCount++;
      }
    }
  }

  logger.debug(`Removed ${removedCount} event listeners for context: ${context}`);
  return removedCount;
}

/**
 * 타입별 이벤트 리스너 제거
 */
export function removeEventListenersByType(type: string): number {
  let removedCount = 0;

  for (const [id, eventContext] of listeners.entries()) {
    if (eventContext.type === type) {
      if (removeEventListenerManaged(id)) {
        removedCount++;
      }
    }
  }

  logger.debug(`Removed ${removedCount} event listeners for type: ${type}`);
  return removedCount;
}

/**
 * 모든 이벤트 리스너 제거
 */
export function removeAllEventListeners(): void {
  const totalCount = listeners.size;

  for (const id of Array.from(listeners.keys())) {
    removeEventListenerManaged(id);
  }

  logger.debug(`Removed all ${totalCount} event listeners`);
}

/**
 * 이벤트 리스너 상태 조회
 */
export function getEventListenerStatus() {
  const contextGroups = new Map<string, number>();
  const typeGroups = new Map<string, number>();

  for (const eventContext of listeners.values()) {
    // 컨텍스트별 집계
    const context = eventContext.context || 'default';
    contextGroups.set(context, (contextGroups.get(context) || 0) + 1);

    // 타입별 집계
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

/**
 * 이벤트 디스패처 정리
 */
export function cleanupEventDispatcher(): void {
  removeAllEventListeners();
  listenerIdCounter = 0;
  logger.debug('Event dispatcher cleaned up');
}

// ================================
// 갤러리 전용 이벤트 처리 (기존 event-utils 기능)
// ================================

// Helper 함수들
function checkGalleryOpen(): boolean {
  try {
    return galleryState.value.isOpen;
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

async function detectMediaFromClick(event: MouseEvent): Promise<MediaInfo | null> {
  try {
    const target = event.target as HTMLElement;
    if (!target) return null;

    const detector = MediaClickDetector.getInstance();
    const result = detector.detectMediaFromClick(target);

    if (result && result.type !== 'none' && result.mediaUrl) {
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
 * 갤러리 이벤트 시스템 초기화
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

/**
 * 우선순위 강화 메커니즘 - Phase 4: 런타임 성능 최적화
 * 트위터가 동적으로 이벤트 리스너를 추가하는 경우를 대비해 주기적으로 우리의 리스너를 재등록
 *
 * 성능 최적화 사항:
 * - 인터벌 빈도를 15초로 제한하여 CPU 오버헤드 최소화
 * - 갤러리 열린 상태에서는 우선순위 강화 중단으로 메모리 절약
 * - 불필요한 리스너 재등록 방지로 성능 향상
 */
function startPriorityEnforcement(handlers: EventHandlers, options: GalleryEventOptions): void {
  // 기존 인터벌 정리
  if (galleryEventState.priorityInterval) {
    globalTimerManager.clearInterval(galleryEventState.priorityInterval);
  }

  // 적응형 백오프 설정: 15s → 30s → 60s 상한. 강화 성공 시 15s로 리셋.
  let currentInterval = 15000;
  let consecutiveSkips = 0;

  const schedule = () => {
    // 기존 인터벌이 있으면 정리 후 재설정
    if (galleryEventState.priorityInterval) {
      globalTimerManager.clearInterval(galleryEventState.priorityInterval);
    }

    galleryEventState.priorityInterval = globalTimerManager.setInterval(() => {
      try {
        if (!galleryEventState.initialized) return;

        // Document 안전성 검사
        const documentElement =
          (typeof document !== 'undefined' && document) ||
          (typeof globalThis !== 'undefined' && (globalThis as { document?: Document }).document) ||
          null;

        // 스킵 조건: 갤러리 열림, document 없음, 페이지 hidden
        if (checkGalleryOpen() || !documentElement || documentElement.hidden) {
          consecutiveSkips++;
          // 백오프 증가: 2회 이상 연속 스킵 시 인터벌을 다음 단계로 증가 (최대 60s)
          if (consecutiveSkips >= 2) {
            const next = Math.min(currentInterval * 2, 60000);
            if (next !== currentInterval) {
              currentInterval = next;
              schedule();
            }
          }
          return;
        }

        // 현재 리스너가 모두 정상적으로 유지되고 있으면 재등록을 건너뛴다
        const listenersHealthy = Array.isArray(galleryEventState.listenerIds)
          ? galleryEventState.listenerIds.every(id => listeners.has(id))
          : false;

        if (listenersHealthy) {
          logger.debug('Gallery event priority check: listeners healthy — skip reinforcement');
          // 스킵이 계속되면 백오프를 증가시킨다
          consecutiveSkips++;
          if (consecutiveSkips >= 2) {
            const next = Math.min(currentInterval * 2, 60000);
            if (next !== currentInterval) {
              currentInterval = next;
              schedule();
            }
          }
          return;
        }

        // 우선순위 강화 실행: 기존 리스너 제거 후 재등록
        galleryEventState.listenerIds.forEach(id => removeEventListenerManaged(id));

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

        // 강화 성공: 백오프 리셋 및 기본 인터벌(15s)로 복귀
        if (currentInterval !== 15000) {
          currentInterval = 15000;
          schedule();
        }
        consecutiveSkips = 0;
      } catch (error) {
        logger.warn('Failed to reinforce gallery event priority:', error);
      }
    }, currentInterval);
  };

  schedule();
}

// ================================
// Log sampling for high-frequency event types
// ================================
const NOISY_EVENT_TYPES = new Set(['scroll', 'mousemove', 'mouseover', 'mouseout']);
const lastLogByType = new Map<string, number>();

function debugLogEvent(message: string, type: string, meta?: Record<string, unknown>) {
  try {
    if (NOISY_EVENT_TYPES.has(type)) {
      const now = Date.now();
      const last = lastLogByType.get(type) ?? 0;
      // log at most once per 3000ms for each noisy type
      if (now - last < 3000) return;
      lastLogByType.set(type, now);
    }
    if (meta) {
      logger.debug(message, meta);
    } else {
      logger.debug(message);
    }
  } catch {
    // ignore logging failures
  }
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
        const mediaInfo = await detectMediaFromClick(event);
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
      const mediaInfo = await detectMediaFromClick(event);
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

        // 비디오 키 처리
        // 내부 헬퍼: 현재 갤러리 비디오 검색 (Service 미사용 폴백)
        const getCurrentGalleryVideo = (): HTMLVideoElement | null => {
          try {
            const doc = (
              typeof document !== 'undefined'
                ? document
                : (globalThis as { document?: Document }).document
            ) as Document | undefined;
            if (!doc) return null;
            const root = (doc.querySelector('.xeg-gallery-container') ||
              doc.querySelector('[data-xeg-gallery-container]')) as HTMLElement | null;
            const items = root?.querySelector('[data-xeg-role="items-container"]');
            if (!items) return null;
            const index = galleryState.value.currentIndex;
            const target = (items as HTMLElement).children?.[index] as HTMLElement | undefined;
            if (!target) return null;
            const v = target.querySelector('video');
            return v instanceof HTMLVideoElement ? v : null;
          } catch {
            return null;
          }
        };

        switch (key) {
          case ' ': // fallthrough
          case 'Space':
            try {
              let svc: MediaServiceLike | null = null;
              try {
                svc = getMediaServiceFromContainer() as unknown as MediaServiceLike;
              } catch {
                svc = null;
              }
              if (svc) {
                svc.togglePlayPauseCurrent();
              } else {
                const v = getCurrentGalleryVideo();
                if (v) {
                  const current = __videoPlaybackState.get(v)?.playing ?? false;
                  const next = !current;
                  if (next) {
                    (v as HTMLVideoElement & Partial<{ play: () => Promise<void> }>).play?.();
                  } else {
                    (v as HTMLVideoElement & Partial<{ pause: () => void }>).pause?.();
                  }
                  __videoPlaybackState.set(v, { playing: next });
                }
              }
            } catch (err) {
              logger.debug('togglePlayPauseCurrent dispatch failed', err);
            }
            break;
          case 'ArrowUp':
            try {
              let svc: MediaServiceLike | null = null;
              try {
                svc = getMediaServiceFromContainer() as unknown as MediaServiceLike;
              } catch {
                svc = null;
              }
              if (svc) {
                svc.volumeUpCurrent();
              } else {
                const v = getCurrentGalleryVideo();
                if (v) {
                  const next = Math.min(1, Math.round((v.volume + 0.1) * 100) / 100);
                  v.volume = next;
                  if (next > 0 && v.muted) v.muted = false;
                }
              }
            } catch (err) {
              logger.debug('volumeUpCurrent dispatch failed', err);
            }
            break;
          case 'ArrowDown':
            try {
              let svc: MediaServiceLike | null = null;
              try {
                svc = getMediaServiceFromContainer() as unknown as MediaServiceLike;
              } catch {
                svc = null;
              }
              if (svc) {
                svc.volumeDownCurrent();
              } else {
                const v = getCurrentGalleryVideo();
                if (v) {
                  const next = Math.max(0, Math.round((v.volume - 0.1) * 100) / 100);
                  v.volume = next;
                }
              }
            } catch (err) {
              logger.debug('volumeDownCurrent dispatch failed', err);
            }
            break;
          case 'm':
          case 'M':
            try {
              let svc: MediaServiceLike | null = null;
              try {
                svc = getMediaServiceFromContainer() as unknown as MediaServiceLike;
              } catch {
                svc = null;
              }
              if (svc) {
                svc.toggleMuteCurrent();
              } else {
                const v = getCurrentGalleryVideo();
                if (v) v.muted = !v.muted;
              }
            } catch (err) {
              logger.debug('toggleMuteCurrent dispatch failed', err);
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
 * 갤러리 이벤트 상태 조회
 */
export function getGalleryEventStatus() {
  return {
    initialized: galleryEventState.initialized,
    listenerCount: galleryEventState.listenerIds.length,
    options: galleryEventState.options,
    hasHandlers: !!galleryEventState.handlers,
    hasPriorityInterval: !!galleryEventState.priorityInterval,
  };
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

// ================================
// 통합 이벤트 관리자 클래스
// ================================

/**
 * 통합 이벤트 관리자 클래스
 * @deprecated 외부 소비자는 `@shared/services/EventManager`를 사용하세요. 이 클래스는 내부 호환 용도로만 유지됩니다.
 */
export class GalleryEventManager {
  private static instance: GalleryEventManager | null = null;

  public static getInstance(): GalleryEventManager {
    if (!GalleryEventManager.instance) {
      GalleryEventManager.instance = new GalleryEventManager();
    }
    return GalleryEventManager.instance;
  }

  // 기본 이벤트 관리
  public addListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string {
    return addListener(element, type, listener, options, context);
  }

  public addMultipleListeners(
    element: EventTarget,
    types: string[],
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string[] {
    return addMultipleEventListeners(element, types, listener, options, context);
  }

  public removeListener(id: string): boolean {
    return removeEventListenerManaged(id);
  }

  public removeByContext(context: string): number {
    return removeEventListenersByContext(context);
  }

  public removeByType(type: string): number {
    return removeEventListenersByType(type);
  }

  public removeAll(): void {
    removeAllEventListeners();
  }

  public getStatus() {
    return getEventListenerStatus();
  }

  public cleanup(): void {
    cleanupEventDispatcher();
  }

  // 갤러리 이벤트 관리
  public async initializeGallery(
    handlers: EventHandlers,
    options?: Partial<GalleryEventOptions>
  ): Promise<void> {
    return initializeGalleryEvents(handlers, options);
  }

  public cleanupGallery(): void {
    cleanupGalleryEvents();
  }

  public getGalleryStatus() {
    return getGalleryEventStatus();
  }

  public updateGalleryOptions(options: Partial<GalleryEventOptions>): void {
    updateGalleryEventOptions(options);
  }
}

// ================================
// 백워드 호환성을 위한 추가 유틸리티 함수들
// ================================

/**
 * 활성 리스너 개수 조회
 */
export function getActiveListenerCount(): number {
  return listeners.size;
}

/**
 * 모든 이벤트 리스너 제거 (removeAllEventListeners의 별칭)
 */
export function clearAllEventListeners(): void {
  removeAllEventListeners();
}

/**
 * 이벤트 리스너 정리 (cleanupEventDispatcher의 별칭)
 */
export function cleanupEventListeners(): void {
  cleanupEventDispatcher();
}

/**
 * 클릭 가능한 요소인지 확인
 */
export function isClickableElement(element: Element): boolean {
  if (!element) return false;

  const clickableTags = ['BUTTON', 'A', 'INPUT'];
  if (clickableTags.includes(element.tagName)) return true;

  const clickableRoles = ['button', 'link', 'tab', 'menuitem'];
  const role = element.getAttribute('role');
  if (role && clickableRoles.includes(role)) return true;

  return (
    element.hasAttribute('onclick') ||
    element.hasAttribute('data-testid') ||
    getComputedStyle(element).cursor === 'pointer'
  );
}

/**
 * 미디어 요소인지 확인
 */
export function isMediaElement(element: Element): boolean {
  if (!element) return false;

  const mediaTags = ['IMG', 'VIDEO', 'AUDIO', 'PICTURE', 'SOURCE'];
  if (mediaTags.includes(element.tagName)) return true;

  // Twitter 미디어 관련 클래스나 속성 확인
  const classList = element.className || '';
  return (
    classList.includes('media') ||
    classList.includes('image') ||
    classList.includes('video') ||
    element.hasAttribute('data-image-url') ||
    element.hasAttribute('data-video-url')
  );
}

/**
 * 커스텀 이벤트 생성
 */
export function createCustomEvent<T = unknown>(
  type: string,
  detail?: T,
  options?: EventInit
): CustomEvent<T> {
  const eventOptions = {
    bubbles: true,
    cancelable: true,
    ...options,
  };

  if (detail !== undefined) {
    return new CustomEvent(type, { ...eventOptions, detail });
  }

  return new CustomEvent(type, eventOptions) as CustomEvent<T>;
}

/**
 * 관리형 이벤트 발송
 */
export function dispatchManagedEvent<T = unknown>(
  element: EventTarget,
  type: string,
  detail?: T,
  options?: EventInit
): boolean {
  const event = createCustomEvent(type, detail, options);
  return element.dispatchEvent(event);
}

/**
 * Twitter 이벤트 처리
 */
export function handleTwitterEvent(
  element: EventTarget,
  eventType: string,
  handler: EventListener,
  context?: string
): string {
  return addListener(element, eventType, handler, undefined, context);
}

// 별칭 제거됨: 이벤트 매니저 표면은 Service 레이어의 EventManager로 일원화됩니다.
