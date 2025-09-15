/**
 * @fileoverview 통합 이벤트 관리자 (TDD GREEN 단계)
 * @description DOM 이벤트 매니저(DOM EM)와 GalleryEventManager를 통합한 단일 인터페이스
 */

// NOTE: Vitest(vite-node) Windows alias 해석 이슈 회피 — 내부 의존성은 상대 경로 사용
import { logger } from '../logging/logger';
import { DomEventManager, createDomEventManager } from '../dom/DOMEventManager';
import { GalleryEventManager } from '../utils/events';
import type { EventHandlers, GalleryEventOptions } from '../utils/events';

/**
 * 이벤트 관리자
 * DOM 이벤트 매니저와 GalleryEventManager의 기능을 통합
 */
export class EventManager {
  private static instance: EventManager | null = null;
  private readonly domManager: DomEventManager;
  private readonly galleryManager: GalleryEventManager;
  private isDestroyed = false;

  constructor() {
    this.domManager = createDomEventManager();
    this.galleryManager = GalleryEventManager.getInstance();

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
    this.domManager.cleanup();
    this.isDestroyed = true;
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
    return this.galleryManager.addListener(element, type, listener, options, context);
  }

  /**
   * 이벤트 리스너 제거
   */
  public removeListener(id: string): boolean {
    return this.galleryManager.removeListener(id);
  }

  /**
   * 컨텍스트별 이벤트 리스너 제거
   */
  public removeByContext(context: string): number {
    return this.galleryManager.removeByContext(context);
  }

  /**
   * 갤러리 이벤트 초기화
   */
  public async initializeGallery(
    handlers: EventHandlers,
    options?: Partial<GalleryEventOptions>
  ): Promise<void> {
    return this.galleryManager.initializeGallery(handlers, options);
  }

  /**
   * 갤러리 이벤트 정리
   */
  public cleanupGallery(): void {
    this.galleryManager.cleanupGallery();
  }

  /**
   * 갤러리 상태 조회
   */
  public getGalleryStatus() {
    return this.galleryManager.getGalleryStatus();
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
    return this.galleryManager.addListener(element, eventType, handler, undefined, context);
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
      galleryEvents: this.galleryManager.getGalleryStatus(),
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

// 별칭 제거됨: 외부 표면은 EventManager 단일 표면만 유지합니다.
