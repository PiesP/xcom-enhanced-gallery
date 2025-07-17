/**
 * 갤러리 이벤트 코디네이터
 *
 * EventManager를 활용한 통합 이벤트 처리
 * 기존 GalleryApp.ts에서 이벤트 처리 부분을 분리하여 생성
 *
 * 책임:
 * - EventManager 인스턴스 관리
 * - 이벤트 핸들러 설정
 * - 갤러리 특화 이벤트 조정
 */

import { logger } from '@infrastructure/logging/logger';
import {
  GalleryEventCoordinator as EventCoordinator,
  type EventHandlers as EventManagerHandlers,
  type GalleryEventOptions as EventManagerOptions,
} from '@shared/utils/events/GalleryEventCoordinator';

/**
 * 이벤트 코디네이터 설정
 */
export interface EventCoordinatorConfig {
  clickDebounceMs?: number;
  enableKeyboard?: boolean;
  debug?: boolean;
}

/**
 * 이벤트 핸들러 인터페이스 (갤러리 특화)
 */
export interface EventHandlers {
  onMediaClick: (target: HTMLElement, event: MouseEvent) => Promise<void>;
  onGalleryClose: () => void;
}

/**
 * 갤러리 이벤트 코디네이터
 * EventManager를 활용하여 이벤트를 통합 관리합니다.
 */
export class GalleryEventCoordinator {
  private config: Required<EventCoordinatorConfig>;
  private handlers: EventHandlers | null = null;
  private readonly eventManager: EventCoordinator;

  private isInitialized = false;

  constructor(config: EventCoordinatorConfig = {}) {
    this.config = {
      clickDebounceMs: config.clickDebounceMs ?? 500,
      enableKeyboard: config.enableKeyboard ?? true,
      debug: config.debug ?? false,
    };

    // EventManager 초기화 (싱글톤 패턴 사용)
    const eventManagerOptions: EventManagerOptions = {
      debounceDelay: this.config.clickDebounceMs,
      enableKeyboard: this.config.enableKeyboard,
      debug: this.config.debug,
    };

    this.eventManager = EventCoordinator.getInstance(eventManagerOptions);
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

      // EventManager 핸들러 설정
      const eventManagerHandlers: EventManagerHandlers = {
        onMediaClick: async (_mediaInfo, element, event) => {
          if (this.handlers?.onMediaClick) {
            await this.handlers.onMediaClick(element, event);
          }
        },
        onGalleryClose: () => {
          if (this.handlers?.onGalleryClose) {
            this.handlers.onGalleryClose();
          }
        },
      };

      // EventManager 초기화
      await this.eventManager.initialize(eventManagerHandlers);

      this.isInitialized = true;
      logger.info('✅ GalleryEventCoordinator 초기화 완료 (EventManager 통합)');
    } catch (error) {
      logger.error('❌ EventCoordinator 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<EventCoordinatorConfig>): void {
    // 설정 업데이트
    this.config = { ...this.config, ...newConfig };

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
      eventManagerStatus: this.eventManager ? 'initialized' : 'not_initialized',
    };
  }

  /**
   * 정리
   */
  public async cleanup(): Promise<void> {
    try {
      // EventManager 정리
      await this.eventManager.cleanup();

      this.handlers = null;
      this.isInitialized = false;

      logger.info('✅ GalleryEventCoordinator 정리 완료 (EventManager 통합)');
    } catch (error) {
      logger.error('❌ EventCoordinator 정리 실패:', error);
      throw error;
    }
  }
}
