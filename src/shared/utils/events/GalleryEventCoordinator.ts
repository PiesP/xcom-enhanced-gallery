/**
 * @fileoverview 갤러리 이벤트 조정자 - 갤러리 전용 이벤트 처리
 * @version 2.0.0
 *
 * 모든 갤러리 관련 이벤트를 통합 관리하여 중복을 제거하고
 * 일관성 있는 이벤트 처리를 보장합니다.
 */

import { logger } from '@core/logging/logger';
import { GalleryUtils } from '../gallery-utils';
import { MediaClickDetector } from '../media/MediaClickDetector';
import { isVideoControlElement } from '../../../constants';
import type { MediaInfo } from '../../../core/types/media.types';

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
 * 갤러리 이벤트 조정자 옵션
 */
export interface GalleryEventOptions {
  /** 디바운싱 지연 시간 (ms) */
  debounceDelay?: number;
  /** 키보드 이벤트 활성화 */
  enableKeyboard?: boolean;
  /** 디버그 모드 */
  debug?: boolean;
}

/**
 * 갤러리 이벤트 조정자
 *
 * 모든 갤러리 관련 이벤트를 단일 지점에서 처리하여
 * 중복 리스너와 이벤트 충돌을 방지합니다.
 */
export class GalleryEventCoordinator {
  private static instance: GalleryEventCoordinator | null = null;

  private handlers: EventHandlers | null = null;
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;

  private lastClickTime = 0;
  private readonly options: Required<GalleryEventOptions>;
  private isInitialized = false;

  private constructor(options: GalleryEventOptions = {}) {
    this.options = {
      debounceDelay: options.debounceDelay ?? 150,
      enableKeyboard: options.enableKeyboard ?? true,
      debug: options.debug ?? false,
    };

    logger.debug('GalleryEventCoordinator: Instance created with options:', this.options);
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(options?: GalleryEventOptions): GalleryEventCoordinator {
    if (!GalleryEventCoordinator.instance) {
      GalleryEventCoordinator.instance = new GalleryEventCoordinator(options ?? {});
    } else if (options) {
      logger.warn(
        'GalleryEventCoordinator: Options provided but instance already exists. Options ignored.'
      );
    }
    return GalleryEventCoordinator.instance;
  }

  /**
   * 갤러리 이벤트 조정자 초기화
   */
  public async initialize(handlers: EventHandlers): Promise<void> {
    if (this.isInitialized) {
      logger.warn('GalleryEventCoordinator: Already initialized');
      return;
    }

    try {
      this.handlers = handlers;
      this.setupEventListeners();
      this.isInitialized = true;

      logger.info('✅ GalleryEventCoordinator initialized successfully');
    } catch (error) {
      logger.error('❌ GalleryEventCoordinator initialization failed:', error);
      throw error;
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 클릭 이벤트 리스너 (단일 진입점)
    this.clickHandler = this.handleDocumentClick.bind(this);
    document.addEventListener('click', this.clickHandler, {
      capture: true,
      passive: false,
    });

    // 키보드 이벤트 리스너
    if (this.options.enableKeyboard) {
      this.keyboardHandler = this.handleKeyboardEvent.bind(this);
      document.addEventListener('keydown', this.keyboardHandler, {
        capture: true,
      });
    }

    this.log('Event listeners attached successfully');
  }

  /**
   * 문서 클릭 이벤트 처리 (통합 진입점)
   */
  private handleDocumentClick(event: MouseEvent): void {
    try {
      const result = this.processClickEvent(event);

      if (result.handled) {
        // 중복 처리 방지를 위한 커스텀 이벤트 발송
        this.markEventAsHandled(event);

        if (result.mediaInfo) {
          this.handleMediaClick(result.mediaInfo, event.target as HTMLElement, event);
        }
      }

      this.log('Click event processed', {
        handled: result.handled,
        reason: result.reason,
        hasMediaInfo: !!result.mediaInfo,
      });
    } catch (error) {
      logger.error('GalleryEventCoordinator: Click handling failed:', error);
    }
  }

  /**
   * 클릭 이벤트 처리 로직
   */
  private processClickEvent(event: MouseEvent): EventHandlingResult {
    const target = event.target as HTMLElement;

    // 1. 기본 검증
    if (event.button !== 0) {
      return { handled: false, reason: 'Not left click' };
    }

    // 2. 이벤트가 이미 처리되었는지 확인
    if (this.isEventAlreadyHandled(event)) {
      return { handled: false, reason: 'Already handled' };
    }

    // 3. 갤러리 상태 확인
    if (!GalleryUtils.canTriggerGallery(event)) {
      return { handled: false, reason: 'Gallery state guard blocked' };
    }

    // 4. 디바운싱 체크
    if (!this.checkDebounce()) {
      return { handled: false, reason: 'Debouncing' };
    }

    // 5. 비디오 제어 요소 체크
    if (isVideoControlElement(target)) {
      return { handled: false, reason: 'Video control element' };
    }

    // 6. 미디어 요소 확인
    if (!MediaClickDetector.isProcessableMedia(target)) {
      return { handled: false, reason: 'Not processable media' };
    }

    // 7. MediaInfo 추출
    const detectionResult = MediaClickDetector.getInstance().detectMediaFromClick(target);
    if (detectionResult.type === 'none' || !detectionResult.mediaUrl) {
      return { handled: false, reason: 'Media detection failed' };
    }

    // MediaInfo 생성
    const mediaInfo: MediaInfo = {
      id: detectionResult.mediaUrl,
      url: detectionResult.mediaUrl,
      type: detectionResult.type,
      filename: this.generateFilename(detectionResult.mediaUrl, detectionResult.type),
      metadata: {
        source: 'event-manager',
        confidence: detectionResult.confidence,
        method: detectionResult.method,
      },
    };

    // Twitter의 기본 동작 차단
    event.preventDefault();
    event.stopPropagation();

    return {
      handled: true,
      reason: 'Media click detected',
      mediaInfo,
    };
  }

  /**
   * 미디어 클릭 처리
   */
  private async handleMediaClick(
    mediaInfo: MediaInfo,
    element: HTMLElement,
    event: MouseEvent
  ): Promise<void> {
    try {
      if (!this.handlers) {
        logger.error('GalleryEventCoordinator: No handlers configured');
        return;
      }

      await this.handlers.onMediaClick(mediaInfo, element, event);
    } catch (error) {
      logger.error('GalleryEventCoordinator: Media click handling failed:', error);
    }
  }

  /**
   * 키보드 이벤트 처리
   */
  private handleKeyboardEvent(event: KeyboardEvent): void {
    try {
      if (this.handlers?.onKeyboardEvent) {
        this.handlers.onKeyboardEvent(event);
      } else {
        // 기본 키보드 처리
        this.handleDefaultKeyboardEvent(event);
      }
    } catch (error) {
      logger.error('GalleryEventCoordinator: Keyboard handling failed:', error);
    }
  }

  /**
   * 기본 키보드 이벤트 처리
   */
  private handleDefaultKeyboardEvent(event: KeyboardEvent): void {
    // 갤러리가 열려있을 때만 처리
    if (!GalleryUtils.canTriggerGallery()) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.handlers?.onGalleryClose();
        break;
    }
  }

  /**
   * 디바운싱 체크
   */
  private checkDebounce(): boolean {
    const now = Date.now();
    if (now - this.lastClickTime < this.options.debounceDelay) {
      return false;
    }
    this.lastClickTime = now;
    return true;
  }

  /**
   * 이벤트가 이미 처리되었는지 확인
   */
  private isEventAlreadyHandled(event: Event): boolean {
    return (event as Event & { _xegHandled?: boolean })._xegHandled === true;
  }

  /**
   * 이벤트를 처리됨으로 표시
   */
  private markEventAsHandled(event: Event): void {
    (event as Event & { _xegHandled?: boolean })._xegHandled = true;

    // 다른 리스너들에게 알림
    document.dispatchEvent(
      new CustomEvent('xeg:event-handled', {
        detail: { originalEvent: event },
      })
    );
  }

  /**
   * 상태 정보 조회
   */
  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasHandlers: !!this.handlers,
      hasClickListener: !!this.clickHandler,
      hasKeyboardListener: !!this.keyboardHandler,
      options: this.options,
      lastClickTime: this.lastClickTime,
    };
  }

  /**
   * 정리 및 리소스 해제
   */
  public async cleanup(): Promise<void> {
    try {
      // 이벤트 리스너 해제
      if (this.clickHandler) {
        document.removeEventListener('click', this.clickHandler, true);
        this.clickHandler = null;
      }

      if (this.keyboardHandler) {
        document.removeEventListener('keydown', this.keyboardHandler, true);
        this.keyboardHandler = null;
      }

      // 상태 초기화
      this.handlers = null;
      this.isInitialized = false;
      this.lastClickTime = 0;

      // 싱글톤 인스턴스 해제
      GalleryEventCoordinator.instance = null;

      logger.info('✅ GalleryEventCoordinator cleaned up successfully');
    } catch (error) {
      logger.error('❌ GalleryEventCoordinator cleanup failed:', error);
    }
  }

  /**
   * 파일명 생성
   */
  private generateFilename(url: string, type: 'image' | 'video'): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastSegment = pathname.split('/').pop() || 'media';

      // 확장자가 없으면 타입에 따라 추가
      if (!lastSegment.includes('.')) {
        const ext = type === 'image' ? 'jpg' : 'mp4';
        return `${lastSegment}.${ext}`;
      }

      return lastSegment;
    } catch {
      // URL 파싱 실패 시 기본 파일명
      const ext = type === 'image' ? 'jpg' : 'mp4';
      return `media_${Date.now()}.${ext}`;
    }
  }

  /**
   * 디버그 로깅
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.options.debug) {
      logger.debug(`GalleryEventCoordinator: ${message}`, data);
    }
  }
}

/**
 * 전역 이벤트 매니저 인스턴스
 */
export const galleryEventCoordinator = GalleryEventCoordinator.getInstance();
