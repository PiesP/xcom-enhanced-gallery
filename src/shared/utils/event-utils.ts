/**
 * @fileoverview 갤러리 이벤트 조정 유틸리티
 * @description 갤러리 전용 이벤트 처리 로직을 함수 기반으로 단순화
 * @version 2.0.0 - Phase 3 Simplified
 */

import { logger } from '@shared/logging/logger';
import { GalleryUtils } from '@shared/utils/unified-utils';
import { MediaClickDetector } from '@shared/utils/media/MediaClickDetector';
import { isVideoControlElement } from '@/constants';
import { addEventListenerManaged, removeEventListenersByContext } from './event-dispatcher';
import { galleryState } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';

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

    // MediaDetectionResult를 MediaInfo로 변환 (간단한 변환)
    if (result && typeof result === 'object' && 'mediaInfo' in result) {
      return result.mediaInfo as MediaInfo;
    }

    return null;
  } catch (error) {
    logger.warn('Failed to detect media from click:', error);
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
  /** 디바운싱 지연 시간 (ms) */
  debounceDelay?: number;
  /** 키보드 이벤트 활성화 */
  enableKeyboard?: boolean;
  /** 디버그 모드 */
  debug?: boolean;
}

// 모듈 레벨 상태
let eventHandlers: EventHandlers | null = null;
let lastClickTime = 0;
let isInitialized = false;
let eventOptions: Required<GalleryEventOptions> = {
  debounceDelay: 150,
  enableKeyboard: true,
  debug: false,
};

/**
 * 갤러리 이벤트 시스템 초기화
 */
export async function initializeGalleryEvents(
  handlers: EventHandlers,
  options: GalleryEventOptions = {}
): Promise<void> {
  if (isInitialized) {
    logger.warn('GalleryEventCoordinator: Already initialized');
    return;
  }

  try {
    eventHandlers = handlers;
    eventOptions = {
      debounceDelay: options.debounceDelay ?? 150,
      enableKeyboard: options.enableKeyboard ?? true,
      debug: options.debug ?? false,
    };

    setupGalleryEventListeners();
    isInitialized = true;

    logger.info('✅ Gallery events initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize gallery events:', error);
    throw error;
  }
}

/**
 * 갤러리 이벤트 리스너 설정
 */
function setupGalleryEventListeners(): void {
  // 전역 클릭 이벤트 리스너
  addEventListenerManaged(
    document,
    'click',
    handleGlobalClick,
    { capture: true, passive: false },
    'gallery-events'
  );

  // 키보드 이벤트 리스너 (옵션에 따라)
  if (eventOptions.enableKeyboard) {
    addEventListenerManaged(
      document,
      'keydown',
      handleKeyboardEvent,
      { capture: true, passive: false },
      'gallery-events'
    );
  }

  // 컨텍스트 메뉴 차단 (갤러리에서)
  addEventListenerManaged(
    document,
    'contextmenu',
    handleContextMenu,
    { capture: true, passive: false },
    'gallery-events'
  );

  logger.debug('Gallery event listeners setup completed');
}

/**
 * 전역 클릭 이벤트 처리
 */
async function handleGlobalClick(event: Event): Promise<void> {
  if (!eventHandlers) return;

  const mouseEvent = event as MouseEvent;

  try {
    // 디바운싱 체크
    const now = Date.now();
    if (now - lastClickTime < eventOptions.debounceDelay) {
      if (eventOptions.debug) {
        logger.debug('Click debounced:', { delay: now - lastClickTime });
      }
      return;
    }
    lastClickTime = now;

    const result = await processClickEvent(mouseEvent);

    if (result.handled) {
      if (eventOptions.debug) {
        logger.debug('Click event handled:', result);
      }
    }
  } catch (error) {
    logger.error('Error in global click handler:', error);
  }
}

/**
 * 클릭 이벤트 처리 로직
 */
async function processClickEvent(event: MouseEvent): Promise<EventHandlingResult> {
  if (!eventHandlers) {
    return { handled: false, reason: 'No handlers available' };
  }

  const target = event.target as HTMLElement;
  if (!target) {
    return { handled: false, reason: 'No target element' };
  }

  // 갤러리가 열려있는지 확인
  const isGalleryOpen = checkGalleryOpen();

  // 갤러리가 열려있고 외부 클릭인 경우 닫기
  if (isGalleryOpen && !checkInsideGallery(target)) {
    await eventHandlers.onGalleryClose();
    event.preventDefault();
    event.stopPropagation();
    return { handled: true, reason: 'Gallery closed by outside click' };
  }

  // 비디오 컨트롤 요소인 경우 무시
  if (isVideoControlElement(target)) {
    return { handled: false, reason: 'Video control element' };
  }

  // 미디어 클릭 감지
  const mediaInfo = await detectMediaFromClick(event);
  if (mediaInfo) {
    await eventHandlers.onMediaClick(mediaInfo, target, event);
    event.preventDefault();
    event.stopPropagation();
    return { handled: true, reason: 'Media click processed', mediaInfo };
  }

  return { handled: false, reason: 'No media detected' };
}

/**
 * 키보드 이벤트 처리
 */
function handleKeyboardEvent(event: Event): void {
  if (!eventHandlers?.onKeyboardEvent) return;

  const keyboardEvent = event as KeyboardEvent;

  try {
    // 갤러리가 열려있을 때만 키보드 이벤트 처리
    if (checkGalleryOpen()) {
      eventHandlers.onKeyboardEvent(keyboardEvent);
    }
  } catch (error) {
    logger.error('Error in keyboard event handler:', error);
  }
}

/**
 * 컨텍스트 메뉴 처리
 */
function handleContextMenu(event: Event): void {
  const mouseEvent = event as MouseEvent;
  const target = mouseEvent.target as HTMLElement;

  // 갤러리 내부에서는 컨텍스트 메뉴 차단
  if (checkInsideGallery(target)) {
    event.preventDefault();
    event.stopPropagation();

    if (eventOptions.debug) {
      logger.debug('Context menu blocked in gallery');
    }
  }
}

/**
 * 갤러리 이벤트 시스템 정리
 */
export function cleanupGalleryEvents(): void {
  if (!isInitialized) {
    return;
  }

  try {
    // 모든 갤러리 이벤트 리스너 제거
    removeEventListenersByContext('gallery-events');

    // 상태 초기화
    eventHandlers = null;
    lastClickTime = 0;
    isInitialized = false;

    logger.debug('Gallery events cleaned up');
  } catch (error) {
    logger.error('Error cleaning up gallery events:', error);
  }
}

/**
 * 갤러리 이벤트 상태 확인
 */
export function getGalleryEventStatus(): {
  initialized: boolean;
  handlersAvailable: boolean;
  keyboardEnabled: boolean;
  debugMode: boolean;
} {
  return {
    initialized: isInitialized,
    handlersAvailable: eventHandlers !== null,
    keyboardEnabled: eventOptions.enableKeyboard,
    debugMode: eventOptions.debug,
  };
}

/**
 * 이벤트 옵션 업데이트
 */
export function updateGalleryEventOptions(newOptions: Partial<GalleryEventOptions>): void {
  eventOptions = {
    ...eventOptions,
    ...newOptions,
  };

  logger.debug('Gallery event options updated:', eventOptions);
}

// 레거시 클래스 API 호환성 제공
export class GalleryEventCoordinator {
  public static getInstance(options?: GalleryEventOptions): GalleryEventCoordinator {
    if (options) {
      updateGalleryEventOptions(options);
    }
    return new GalleryEventCoordinator();
  }

  public async initialize(handlers: EventHandlers): Promise<void> {
    return initializeGalleryEvents(handlers);
  }

  public cleanup(): void {
    cleanupGalleryEvents();
  }

  public getStatus() {
    return getGalleryEventStatus();
  }

  public updateOptions(options: Partial<GalleryEventOptions>): void {
    updateGalleryEventOptions(options);
  }
}
