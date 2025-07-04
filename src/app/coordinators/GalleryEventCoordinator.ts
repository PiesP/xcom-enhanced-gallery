/**
 * 갤러리 이벤트 코디네이터
 *
 * 기존 GalleryApp.ts에서 이벤트 처리 부분을 분리하여 생성
 *
 * 책임:
 * - 클릭 이벤트 감지 및 처리
 * - 키보드 이벤트 처리
 * - 이벤트 디바운싱
 * - 미디어 요소 식별
 */

import { logger } from '@infrastructure/logging/logger';
import { galleryState } from '@core/state/signals/gallery.signals';
import { shouldBlockGalleryEvent } from '@shared/utils/core';

/**
 * 이벤트 코디네이터 설정
 */
export interface EventCoordinatorConfig {
  clickDebounceMs?: number;
  enableKeyboard?: boolean;
}

/**
 * 이벤트 핸들러 인터페이스
 */
export interface EventHandlers {
  onMediaClick: (target: HTMLElement, event: MouseEvent) => Promise<void>;
  onGalleryClose: () => void;
}

/**
 * 갤러리 이벤트 코디네이터
 */
export class GalleryEventCoordinator {
  private config: Required<EventCoordinatorConfig>;
  private handlers: EventHandlers | null = null;

  // 이벤트 핸들러들
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private mediaGridHandler: ((event: MouseEvent) => void) | null = null;
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;

  // 디바운싱
  private lastClickTime: number = 0;

  private isInitialized = false;

  constructor(config: EventCoordinatorConfig = {}) {
    this.config = {
      clickDebounceMs: config.clickDebounceMs ?? 500,
      enableKeyboard: config.enableKeyboard ?? true,
    };
  }

  /**
   * 이벤트 코디네이터 초기화
   */
  public async initialize(handlers: EventHandlers): Promise<void> {
    if (this.isInitialized) {
      logger.debug('EventCoordinator: Already initialized');
      return;
    }

    try {
      this.handlers = handlers;

      // 클릭 이벤트 리스너 설정
      this.setupClickListeners();

      // 키보드 이벤트 리스너 설정
      if (this.config.enableKeyboard) {
        this.setupKeyboardListener();
      }

      this.isInitialized = true;
      logger.info('✅ GalleryEventCoordinator 초기화 완료');
    } catch (error) {
      logger.error('❌ EventCoordinator 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 클릭 이벤트 리스너 설정
   */
  private setupClickListeners(): void {
    // 메인 클릭 핸들러
    this.clickHandler = (event: MouseEvent) => {
      if (event.button !== 0) return; // 마우스 왼쪽 버튼만

      const target = event.target as HTMLElement;

      // 갤러리가 열려 있을 때 갤러리 내부 클릭은 차단
      if (galleryState.value.isOpen && shouldBlockGalleryEvent(event)) {
        logger.debug('갤러리 내부 클릭 차단 - 기본 동작 허용');
        return;
      }

      // 디바운싱 체크
      if (!this.checkDebounce()) {
        return;
      }

      // 미디어 요소 감지
      const mediaContainer = this.findMediaContainer(target);
      if (mediaContainer) {
        // 갤러리 차단 요소 체크
        if (this.shouldBlockGalleryTrigger(target)) {
          logger.debug('갤러리 차단 요소 클릭 - 기본 동작 허용');
          return;
        }

        // 기본 동작 차단 및 갤러리 실행
        event.preventDefault();
        event.stopPropagation();

        logger.info('미디어 요소 클릭 감지:', {
          tagName: target.tagName,
          className: target.className,
        });

        this.handleMediaClick(target, event);
      }
    };

    // 미디어 그리드 핸들러
    this.mediaGridHandler = (event: MouseEvent) => {
      if (event.button !== 0) return;

      const target = event.target as HTMLElement;

      // 갤러리가 열려 있을 때 갤러리 내부 클릭은 차단
      if (galleryState.value.isOpen && shouldBlockGalleryEvent(event)) {
        logger.debug('갤러리 내부 그리드 클릭 차단');
        return;
      }

      // 미디어 그리드 링크 감지
      const mediaGridLink = target.closest(
        'a[href*="/status/"][href*="/photo/"], a[href*="/status/"][href*="/video/"]'
      ) as HTMLAnchorElement;

      if (mediaGridLink) {
        if (!this.checkDebounce()) return;

        event.preventDefault();
        event.stopPropagation();

        logger.info('미디어 그리드 링크 클릭 감지');
        this.handleMediaClick(target, event);
      }
    };

    // 이벤트 리스너 등록 (캡처 단계)
    document.addEventListener('click', this.clickHandler, true);
    document.addEventListener('click', this.mediaGridHandler, true);

    logger.debug('클릭 이벤트 리스너 설정 완료');
  }

  /**
   * 키보드 이벤트 리스너 설정
   */
  private setupKeyboardListener(): void {
    this.keyHandler = (event: KeyboardEvent) => {
      // 갤러리가 열려있을 때만 처리
      // Note: 실제 갤러리 상태는 handlers를 통해 확인해야 함

      switch (event.key) {
        case 'Escape':
          this.handlers?.onGalleryClose();
          event.preventDefault();
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'Home':
        case 'End':
          // 갤러리 내비게이션은 갤러리 상태 매니저에서 직접 처리
          // 여기서는 이벤트만 캐치
          break;
      }
    };

    document.addEventListener('keydown', this.keyHandler);
    logger.debug('키보드 이벤트 리스너 설정 완료');
  }

  /**
   * 미디어 컨테이너 찾기
   */
  private findMediaContainer(target: HTMLElement): Element | null {
    const selectors = [
      // 트위터 미디어 우선 처리
      '[data-testid="tweetPhoto"]',
      '[data-testid="tweetMedia"]',
      '[data-testid="videoPlayer"]',
      '[data-testid="tweetVideo"]',
      // 일반 미디어 요소
      '[role="img"]',
      'img[src*="pbs.twimg.com"]',
      'video[src*="video.twimg.com"]',
      '[aria-label*="Image"]',
      '[aria-label*="Photo"]',
      '[aria-label*="Video"]',
      // 미디어 링크
      'a[href*="/photo/"]',
      'a[href*="/video/"]',
    ];

    for (const selector of selectors) {
      try {
        const container = target.closest(selector);
        if (container) {
          return container;
        }
      } catch {
        // CSS 선택자 오류 무시
        continue;
      }
    }

    return null;
  }

  /**
   * 갤러리 트리거를 차단해야 하는 요소인지 확인
   */
  private shouldBlockGalleryTrigger(target: HTMLElement): boolean {
    // 플레이 버튼 및 동영상 제어 버튼들은 기본 동작 허용
    const blockSelectors = [
      '[data-testid="playButton"]',
      'button[aria-label*="다시보기"]',
      'button[aria-label*="일시정지"]',
      'button[aria-label*="재생"]',
      'button[aria-label*="Replay"]',
      'button[aria-label*="Pause"]',
      'button[aria-label*="Play"]',
    ];

    return blockSelectors.some(selector => {
      try {
        return target.closest(selector) !== null;
      } catch {
        return false;
      }
    });
  }

  /**
   * 디바운싱 체크
   */
  private checkDebounce(): boolean {
    const now = Date.now();
    if (now - this.lastClickTime < this.config.clickDebounceMs) {
      logger.debug('클릭 디바운싱으로 무시됨');
      return false;
    }
    this.lastClickTime = now;
    return true;
  }

  /**
   * 미디어 클릭 처리
   */
  private async handleMediaClick(target: HTMLElement, event: MouseEvent): Promise<void> {
    try {
      if (!this.handlers) {
        logger.error('이벤트 핸들러가 설정되지 않음');
        return;
      }

      await this.handlers.onMediaClick(target, event);
    } catch (error) {
      logger.error('미디어 클릭 처리 실패:', error);
    }
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<EventCoordinatorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 키보드 이벤트 리스너 재설정
    if (newConfig.enableKeyboard !== undefined) {
      if (this.keyHandler) {
        document.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
      }

      if (newConfig.enableKeyboard) {
        this.setupKeyboardListener();
      }
    }

    logger.debug('이벤트 코디네이터 설정 업데이트됨');
  }

  /**
   * 진단 정보
   */
  public getDiagnostics() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      handlersSet: !!this.handlers,
      activeListeners: {
        click: !!this.clickHandler,
        mediaGrid: !!this.mediaGridHandler,
        keyboard: !!this.keyHandler,
      },
      lastClickTime: this.lastClickTime,
    };
  }

  /**
   * 정리
   */
  public async cleanup(): Promise<void> {
    try {
      // 이벤트 리스너 제거
      if (this.clickHandler) {
        document.removeEventListener('click', this.clickHandler, true);
        this.clickHandler = null;
      }

      if (this.mediaGridHandler) {
        document.removeEventListener('click', this.mediaGridHandler, true);
        this.mediaGridHandler = null;
      }

      if (this.keyHandler) {
        document.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
      }

      // 상태 초기화
      this.handlers = null;
      this.isInitialized = false;

      logger.debug('GalleryEventCoordinator 정리 완료');
    } catch (error) {
      logger.error('이벤트 코디네이터 정리 실패:', error);
    }
  }
}
