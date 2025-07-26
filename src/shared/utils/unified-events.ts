/**
 * @fileoverview 통합 이벤트 관리 시스템
 * @description event-dispatcher.ts와 event-utils.ts를 통합한 단일 이벤트 관리 시스템
 * @version 1.0.0 - Phase 1 Consolidation
 */

import { logger } from '@shared/logging/logger';
import { GalleryUtils } from '@shared/utils/unified-utils';
import { MediaClickDetector } from '@shared/utils/media/MediaClickDetector';
import { isVideoControlElement } from '@/constants';
import { galleryState } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';

// ================================
// 기본 이벤트 관리 (기존 event-dispatcher 기능)
// ================================

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
 * 이벤트 리스너 추가
 */
export function addEventListenerManaged(
  element: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions,
  context?: string
): string {
  const id = generateListenerId(context);

  try {
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
    logger.error(`Failed to add event listener: ${type}`, error);
    throw error;
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
  return types.map(type => addEventListenerManaged(element, type, listener, options, context));
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
    return GalleryUtils.isGalleryInternalElement(element);
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
    const urlObj = new URL(url);
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

    // 이벤트 리스너 등록
    const clickId = addEventListenerManaged(
      document,
      'click',
      clickHandler,
      { passive: false },
      finalOptions.context
    );

    const keyId = addEventListenerManaged(
      document,
      'keydown',
      keyHandler,
      { passive: false },
      finalOptions.context
    );

    galleryEventState.listenerIds = [clickId, keyId];
    galleryEventState.initialized = true;

    logger.debug('Gallery events initialized', { options: finalOptions });
  } catch (error) {
    logger.error('Failed to initialize gallery events:', error);
    throw error;
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

    // 미디어 감지 시도
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

    galleryEventState = {
      initialized: false,
      listenerIds: [],
      options: null,
      handlers: null,
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
    return addEventListenerManaged(element, type, listener, options, context);
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

// 백워드 호환성을 위한 별칭
export const EventDispatcher = GalleryEventManager;
export const GalleryEventCoordinator = GalleryEventManager;
