/**
 * @fileoverview Event Handler - Single Point of Event Coordination
 * @version 2.0.0
 *
 * 모든 갤러리 관련 이벤트를 통합 관리하여 중복을 제거하고
 * 일관성 있는 이벤트 처리를 보장합니다.
 */

import { logger } from '../../../infrastructure/logging/logger';
import { GalleryStateGuard } from '../gallery/GalleryStateGuard';
import { MediaClickDetector } from '../media/MediaClickDetector';
import { shouldBlockGalleryForVideo } from '../../constants/video-controls';
import type { MediaInfo } from '../../../core/types/media.types';

/**
 * 이벤트 처리 결과
 */
interface EventHandlingResult {
  handled: boolean;
  reason?: string;
}

/**
 * 미디어 클릭 정보
 */
interface MediaClickInfo {
  mediaInfo: MediaInfo;
  target: Element;
  index: number;
}

/**
 * 이벤트 핸들러 타입 정의
 */
export interface EventHandlers {
  onMediaClick?: (info: MediaClickInfo) => void | boolean | Promise<void>;
  onGalleryOpen?: (mediaList: MediaInfo[]) => void;
  onGalleryClose?: () => void;
  onVideoControl?: (action: string, target: Element) => void;
}

/**
 * EventHandler 옵션
 */
export interface EventHandlerOptions {
  enableVideo?: boolean;
  videoThreshold?: number;
  debounceDelay?: number;
  debug?: boolean;
}

/**
 * EventHandler - 싱글톤 이벤트 조정자
 *
 * 갤러리와 미디어 관련 모든 이벤트를 중앙에서 관리하여
 * 이벤트 중복, 충돌, 누락을 방지합니다.
 */
export class EventHandler {
  private static instance: EventHandler | null = null;
  private activeHandlers: EventHandlers = {};
  private mediaClickDetector: MediaClickDetector | null = null;
  private isInitialized = false;

  private readonly options: Required<EventHandlerOptions>;

  private constructor(options: EventHandlerOptions = {}) {
    this.options = {
      enableVideo: options.enableVideo ?? true,
      videoThreshold: options.videoThreshold ?? 500,
      debounceDelay: options.debounceDelay ?? 100,
      debug: options.debug ?? false,
    };
    logger.debug('EventHandler: Instance created with options:', this.options);
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(options?: EventHandlerOptions): EventHandler {
    if (!EventHandler.instance) {
      EventHandler.instance = new EventHandler(options ?? {});
    } else if (options) {
      logger.warn('EventHandler: Options provided but instance already exists. Options ignored.');
    }
    return EventHandler.instance;
  }

  /**
   * 이벤트 핸들러 등록
   */
  public setHandlers(handlers: EventHandlers): void {
    this.activeHandlers = { ...this.activeHandlers, ...handlers };
    logger.debug('EventHandler: Handlers updated:', Object.keys(this.activeHandlers));
  }

  /**
   * 초기화
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('EventHandler: Already initialized');
      return;
    }

    try {
      // MediaClickDetector 초기화
      if (!this.mediaClickDetector) {
        this.mediaClickDetector = MediaClickDetector.getInstance();
      }

      // GalleryStateGuard는 static 클래스이므로 초기화 불필요
      // this.galleryStateGuard = new GalleryStateGuard();

      // 이벤트 리스너 등록
      this.setupEventListeners();

      this.isInitialized = true;
      logger.info('EventHandler: Successfully initialized');
    } catch (error) {
      logger.error('EventHandler: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.removeEventListeners();
    this.activeHandlers = {};
    this.isInitialized = false;

    // MediaClickDetector는 static 클래스이므로 cleanup 불필요
    this.mediaClickDetector = null;

    // GalleryStateGuard는 static 클래스이므로 cleanup 불필요

    logger.debug('EventHandler: Cleaned up');
  }

  /**
   * 미디어 클릭 이벤트 처리
   */
  public async handleMediaClick(
    target: Element,
    mediaInfo: MediaInfo,
    index: number
  ): Promise<EventHandlingResult> {
    if (!this.isInitialized) {
      logger.warn('EventHandler: Not initialized, ignoring media click');
      return { handled: false, reason: 'Not initialized' };
    }

    try {
      // 갤러리 차단 검사
      if (this.shouldBlockGallery(target)) {
        logger.debug('EventHandler: Gallery blocked for this element');
        return { handled: false, reason: 'Gallery blocked' };
      }

      // 미디어 클릭 핸들러 호출
      if (this.activeHandlers.onMediaClick) {
        const clickInfo: MediaClickInfo = { mediaInfo, target, index };
        const result = this.activeHandlers.onMediaClick(clickInfo);

        if (result === false) {
          return { handled: false, reason: 'Handler prevented action' };
        }
      }

      logger.debug('EventHandler: Media click handled successfully');
      return { handled: true };
    } catch (error) {
      logger.error('EventHandler: Error handling media click:', error);
      return { handled: false, reason: `Error: ${error}` };
    }
  }

  /**
   * 갤러리 열기 이벤트 처리
   */
  public handleGalleryOpen(mediaList: MediaInfo[]): void {
    if (!this.isInitialized) {
      logger.warn('EventHandler: Not initialized, ignoring gallery open');
      return;
    }

    try {
      this.activeHandlers.onGalleryOpen?.(mediaList);
      logger.debug('EventHandler: Gallery open handled, media count:', mediaList.length);
    } catch (error) {
      logger.error('EventHandler: Error handling gallery open:', error);
    }
  }

  /**
   * 갤러리 닫기 이벤트 처리
   */
  public handleGalleryClose(): void {
    if (!this.isInitialized) {
      logger.warn('EventHandler: Not initialized, ignoring gallery close');
      return;
    }

    try {
      this.activeHandlers.onGalleryClose?.();
      logger.debug('EventHandler: Gallery close handled');
    } catch (error) {
      logger.error('EventHandler: Error handling gallery close:', error);
    }
  }

  /**
   * 비디오 컨트롤 이벤트 처리
   */
  public handleVideoControl(action: string, target: Element): void {
    if (!this.options.enableVideo) {
      return;
    }

    try {
      this.activeHandlers.onVideoControl?.(action, target);
      logger.debug('EventHandler: Video control handled:', action);
    } catch (error) {
      logger.error('EventHandler: Error handling video control:', error);
    }
  }

  /**
   * 갤러리 차단 여부 확인
   */
  private shouldBlockGallery(target: Element): boolean {
    // 비디오 관련 차단 검사
    if (shouldBlockGalleryForVideo(target as HTMLElement)) {
      return true;
    }

    // 기타 상태 기반 차단 검사
    return GalleryStateGuard.shouldBlockGalleryTrigger(target as HTMLElement);
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // DOM 클릭 이벤트 감지
    document.addEventListener('click', this.handleDocumentClick, {
      capture: true,
      passive: false,
    });

    // 키보드 이벤트 감지
    document.addEventListener('keydown', this.handleKeyDown, {
      capture: true,
      passive: false,
    });

    logger.debug('EventHandler: Event listeners attached');
  }

  /**
   * 이벤트 리스너 제거
   */
  private removeEventListeners(): void {
    document.removeEventListener('click', this.handleDocumentClick, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);

    logger.debug('EventHandler: Event listeners removed');
  }

  /**
   * 문서 클릭 이벤트 핸들러
   */
  private readonly handleDocumentClick = async (event: Event): Promise<void> => {
    if (!this.mediaClickDetector) {
      return;
    }

    try {
      // 클릭된 요소를 가져와서 미디어 감지
      const target = event.target as HTMLElement;
      if (!target) return;

      const result = this.mediaClickDetector.detectMediaFromClick(target);
      if (result && result.type !== 'none') {
        // 미디어가 감지되었을 때만 갤러리 트리거
        const mediaInfo: MediaInfo = {
          url: result.mediaUrl || '',
          type: result.type,
          alt: target.getAttribute('alt') || '',
        };

        await this.handleMediaClick(target, mediaInfo, 0);
      }
    } catch (error) {
      logger.error('EventHandler: Error in document click handler:', error);
    }
  };

  /**
   * 키보드 이벤트 핸들러
   */
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    // ESC 키로 갤러리 닫기
    if (event.key === 'Escape') {
      this.handleGalleryClose();
    }
  };

  /**
   * 인스턴스 재설정 (테스트용)
   */
  public static resetInstance(): void {
    if (EventHandler.instance) {
      EventHandler.instance.cleanup();
      EventHandler.instance = null;
    }
  }

  /**
   * 현재 상태 정보 반환
   */
  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasHandlers: Object.keys(this.activeHandlers).length > 0,
      options: this.options,
      detectorReady: !!this.mediaClickDetector,
      guardReady: GalleryStateGuard.isGalleryOpen !== undefined, // static class이므로 항상 준비됨
    };
  }
}

/**
 * 전역 인스턴스
 */
export const eventHandler = EventHandler.getInstance();

/**
 * 편의 함수들
 */
export const initializeEventHandler = (options?: EventHandlerOptions) =>
  EventHandler.getInstance(options).initialize();

export const setEventHandlers = (handlers: EventHandlers) => eventHandler.setHandlers(handlers);

export const cleanupEventHandler = () => eventHandler.cleanup();
