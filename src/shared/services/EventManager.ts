/**
 * @fileoverview 통합 이벤트 관리자 (TDD GREEN 단계)
 * @description DOMEventManager와 Gallery 이벤트 기능을 통합한 단일 인터페이스
 */

import { logger } from '@shared/logging/logger';
import { DOMEventManager, createEventManager } from '@shared/dom/DOMEventManager';
import {
  addListener,
  removeEventListenerManaged,
  removeEventListenersByContext,
  initializeGalleryEvents,
  cleanupGalleryEvents,
  getGalleryEventStatus,
  type EventHandlers,
  type GalleryEventOptions,
} from '@shared/utils/events';

/**
 * 이벤트 관리자
 * DOMEventManager와 Gallery 이벤트 기능을 통합
 */
export class EventManager {
  private static instance: EventManager | null = null;
  private readonly domManager: DOMEventManager;
  private isDestroyed = false;

  constructor() {
    this.domManager = createEventManager();

    logger.debug('EventManager 초기화 완료');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  // ================================
  // DOMEventManager 위임 메서드들
  // ================================

  /**
   * DOM 이벤트 리스너 등록
   */
  public addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window | null,
    eventType: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions
  ): EventManager {
    if (this.isDestroyed) {
      logger.warn('EventManager가 파괴된 상태에서 addEventListener 호출');
      return this;
    }

    this.domManager.addEventListener(element, eventType, handler, options);
    return this;
  }

  /**
   * 커스텀 이벤트 리스너 등록
   */
  public addCustomEventListener(
    element: HTMLElement | Document | Window | null,
    eventType: string,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions
  ): EventManager {
    if (this.isDestroyed) {
      logger.warn('EventManager가 파괴된 상태에서 addCustomEventListener 호출');
      return this;
    }

    this.domManager.addCustomEventListener(element, eventType, handler, options);
    return this;
  }

  /**
   * DOM 이벤트 리스너 개수 반환
   */
  public getListenerCount(): number {
    return this.domManager.getListenerCount();
  }

  /**
   * 파괴된 상태인지 확인
   */
  public getIsDestroyed(): boolean {
    return this.isDestroyed || this.domManager.getIsDestroyed();
  }

  /**
   * DOM 이벤트 정리
   */
  public cleanup(): void {
    this.domManager.cleanup();
    this.isDestroyed = true;
    logger.debug('EventManager DOM 이벤트 정리 완료');
  }

  // ================================
  // Gallery 이벤트 관리 메서드들
  // ================================

  /**
   * 이벤트 리스너 추가 (Gallery 방식)
   */
  public addListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string {
    return addListener(element, type, listener, options, context);
  }

  /**
   * 이벤트 리스너 제거
   */
  public removeListener(id: string): boolean {
    return removeEventListenerManaged(id);
  }

  /**
   * 컨텍스트별 이벤트 리스너 제거
   */
  public removeByContext(context: string): number {
    return removeEventListenersByContext(context);
  }

  /**
   * 갤러리 이벤트 초기화
   */
  public async initializeGallery(
    handlers: EventHandlers,
    options?: Partial<GalleryEventOptions>
  ): Promise<void> {
    return initializeGalleryEvents(handlers, options);
  }

  /**
   * 갤러리 이벤트 정리
   */
  public cleanupGallery(): void {
    cleanupGalleryEvents();
  }

  /**
   * 갤러리 상태 조회
   */
  public getGalleryStatus() {
    return getGalleryEventStatus();
  }

  // ================================
  // 통합 기능들
  // ================================

  /**
   * 트위터 이벤트 처리 (handleTwitterEvent의 별칭)
   */
  public handleTwitterEvent(
    element: EventTarget,
    eventType: string,
    handler: EventListener,
    context?: string
  ): string {
    return addListener(element, eventType, handler, undefined, context);
  }

  /**
   * 통합 상태 조회
   */
  public getUnifiedStatus() {
    return {
      domEvents: {
        listenerCount: this.getListenerCount(),
        isDestroyed: this.domManager.getIsDestroyed(),
      },
      galleryEvents: getGalleryEventStatus(),
      totalListeners: this.getListenerCount(),
      isDestroyed: this.getIsDestroyed(),
    };
  }

  /**
   * 모든 이벤트 정리
   */
  public cleanupAll(): void {
    this.cleanupGallery();
    this.cleanup();
    logger.debug('EventManager 전체 정리 완료');
  }
}

// ================================
// 백워드 호환성을 위한 별칭
// ================================

/**
 * TwitterEventManager 별칭 (기존 호환성 유지)
 */
export const TwitterEventManager = EventManager;
