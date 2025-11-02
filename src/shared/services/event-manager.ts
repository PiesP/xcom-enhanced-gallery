/**
 * @fileoverview 통합 이벤트 관리자 (BaseServiceImpl 패턴 적용)
 * @description DOM 이벤트 매니저(DOM EM)와 events 유틸리티를 통합한 단일 인터페이스
 */

// NOTE: Vitest(vite-node) Windows alias 해석 이슈 회피 — 내부 의존성은 상대 경로 사용
import { logger } from '@shared/logging';
import { BaseServiceImpl } from './base-service';
import { DomEventManager, createDomEventManager } from '../dom/dom-event-manager';
import {
  addListener as registerManagedListener,
  removeEventListenerManaged,
  removeEventListenersByContext,
  initializeGalleryEvents,
  cleanupGalleryEvents,
  getGalleryEventSnapshot,
} from '../utils/events';
import type { EventHandlers, GalleryEventOptions } from '../utils/events';

/**
 * 이벤트 관리자
 * DOM 이벤트 매니저와 GalleryEventManager의 기능을 통합
 */
export class EventManager extends BaseServiceImpl {
  private static instance: EventManager | null = null;
  private readonly domManager: DomEventManager;
  private isDestroyed = false;

  constructor() {
    super('EventManager');
    this.domManager = createDomEventManager();
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

  /**
   * 생명주기: 초기화
   */
  protected async onInitialize(): Promise<void> {
    // DOM 매니저는 생성자에서 이미 초기화됨
    logger.debug('EventManager 초기화 완료');
  }

  /**
   * 생명주기: 정리
   */
  protected onDestroy(): void {
    this.cleanup();
    logger.debug('EventManager 파괴 완료');
  }

  // ================================
  // DOM 이벤트 매니저 위임 메서드들
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
    this.isDestroyed = true;
    this.domManager.cleanup();
    logger.debug('EventManager DOM 이벤트 정리 완료');
  }

  // ================================
  // GalleryEventManager 위임 메서드들
  // ================================

  /**
   * 이벤트 리스너 추가 (GalleryEventManager 방식)
   */
  public addListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string {
    if (this.isDestroyed) {
      logger.warn('EventManager가 파괴된 상태에서 addListener 호출');
      return '';
    }

    return registerManagedListener(element, type, listener, options, context);
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
   * Phase 305: cleanup 함수 반환
   */
  public async initializeGallery(
    handlers: EventHandlers,
    options?: Partial<GalleryEventOptions>
  ): Promise<() => void> {
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
    return getGalleryEventSnapshot();
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
    if (this.isDestroyed) {
      logger.warn('EventManager가 파괴된 상태에서 handleTwitterEvent 호출');
      return '';
    }

    return registerManagedListener(element, eventType, handler, undefined, context);
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
      galleryEvents: getGalleryEventSnapshot(),
      totalListeners: this.getListenerCount(),
      isDestroyed: this.getIsDestroyed(),
    };
  }

  /**
   * 모든 이벤트 정리
   */
  public cleanupAll(): void {
    this.cleanupGallery();
    if (!this.isDestroyed) {
      this.cleanup();
    }
    logger.debug('EventManager 전체 정리 완료');
  }
}

// 별칭 제거됨: 외부 표면은 EventManager 단일 표면만 유지합니다.
