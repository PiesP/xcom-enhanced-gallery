/**
 * @fileoverview 통합 이벤트 관리 시스템
 */

import { logger } from '@shared/logging/logger';
import { isGalleryInternalElement } from '@shared/utils/utils';
import { MediaClickDetector } from '@shared/utils/media/MediaClickDetector';
import { isVideoControlElement, isTwitterNativeGalleryElement } from '@/constants';
import { galleryState } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';

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
let listenerIdCounter = 0;

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

    logger.debug(`Event listener added: ${type} (${id})`, { context });
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
  priorityInterval: null as ReturnType<typeof setTimeout> | null,
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
    clearInterval(galleryEventState.priorityInterval);
  }

  // 15초마다 우선순위 재설정 (성능 최적화: 적응형 스케줄링)
  galleryEventState.priorityInterval = setInterval(() => {
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
      clearInterval(galleryEventState.priorityInterval);
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

/**
 * TwitterEventManager 클래스 (GalleryEventManager의 별칭)
 */
export const TwitterEventManager = GalleryEventManager;
