/**
 * @fileoverview 통합 이벤트 관리자 (TDD GREEN 단계)
 * @description DOMEventManager와 GalleryEventManager를 통합한 단일 인터페이스
 * Phase 6: events.ts 중복 제거 및 성능 최적화
 */

import { logger } from '@shared/logging/logger';

// 테스트 환경 전역 플래그 타입 선언 (경고 소음 억제)
declare global {
  interface Global {
    __XEG_SILENCE_EVENT_MANAGER_WARN?: boolean;
  }
  interface GlobalThis {
    __XEG_SILENCE_EVENT_MANAGER_WARN?: boolean;
  }
}
import { DOMEventManager, createEventManager } from '@shared/dom/DOMEventManager';
import { GalleryEventManager } from '@shared/utils/events';
import { galleryState } from '@shared/state/signals/gallery.signals';
import type { EventHandlers, GalleryEventOptions } from '@shared/utils/events';

// Phase 6: 안전한 이벤트 처리를 위한 새로운 인터페이스
interface SafeEventOptions extends GalleryEventOptions {
  useEventDelegation?: boolean;
  preventImmediateStop?: boolean;
  mutationObserver?: boolean;
  handlers?: EventHandlers;
}

/**
 * 이벤트 관리자 (Phase 6: 성능 최적화 및 중복 제거)
 * DOMEventManager와 GalleryEventManager의 기능을 통합하며
 * events.ts의 성능 문제(setInterval, stopImmediatePropagation)를 해결
 */
export class EventManager {
  private static instance: EventManager | null = null;
  private static autoReinitialize = false;
  private domManager: DOMEventManager;
  private readonly galleryManager: GalleryEventManager;
  private isDestroyed = false;

  // Phase 6: 성능 최적화를 위한 새로운 상태
  private mutationObserver: MutationObserver | null = null;
  private safeEventOptions: SafeEventOptions | null = null;

  constructor() {
    this.domManager = createEventManager();
    this.galleryManager = GalleryEventManager.getInstance();

    logger.debug('EventManager 초기화 완료 (Phase 6: 성능 최적화)');
  }

  /**
   * Phase 6: MutationObserver 기반 동적 이벤트 처리
   * setInterval을 대체하는 성능 최적화된 방식
   */
  private initializeMutationObserver(): void {
    if (this.mutationObserver || typeof MutationObserver === 'undefined') {
      return;
    }

    try {
      this.mutationObserver = new MutationObserver(mutations => {
        let shouldReinforce = false;

        for (const mutation of mutations) {
          // DOM 구조 변경 감지 (Twitter의 동적 콘텐츠 로딩)
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Twitter 갤러리 관련 요소가 추가되었는지 확인
            for (const node of Array.from(mutation.addedNodes)) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (this.isTwitterGalleryElement(element)) {
                  shouldReinforce = true;
                  break;
                }
              }
            }
          }
        }

        if (shouldReinforce && this.safeEventOptions) {
          logger.debug('MutationObserver: Twitter 갤러리 요소 감지, 이벤트 재설정');
          this.reinforceEventPriority();
        }
      });

      // Twitter 메인 컨테이너 관찰 (JSDOM 호환성 확보)
      const observeTarget =
        document.getElementById('react-root') || document.body || document.documentElement;

      if (observeTarget) {
        this.mutationObserver.observe(observeTarget, {
          childList: true,
          subtree: true,
          attributes: false,
        });

        logger.debug('MutationObserver 초기화 완료 (setInterval 대체)');
      } else {
        logger.warn('MutationObserver: 관찰 대상을 찾을 수 없음');
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
    } catch (error) {
      logger.warn('MutationObserver 초기화 실패:', error);
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
    }
  }

  /**
   * Phase 6: Twitter 갤러리 요소 감지 (개선된 방식)
   */
  private isTwitterGalleryElement(element: Element): boolean {
    const gallerySelectors = [
      '[data-testid="photoViewer"]',
      '[data-testid="videoViewer"]',
      '[aria-label*="이미지"]',
      '[aria-label*="Image"]',
      '.r-1p0dtai', // Twitter 갤러리 클래스
    ];

    return gallerySelectors.some(selector => {
      try {
        return element.matches?.(selector) || element.querySelector?.(selector);
      } catch {
        return false;
      }
    });
  }

  /**
   * Phase 6: 안전한 이벤트 우선순위 강화
   * setInterval 대신 필요할 때만 실행
   */
  private reinforceEventPriority(): void {
    if (!this.safeEventOptions || this.isDestroyed) {
      return;
    }

    try {
      // Phase 11 GREEN: initialized 여부가 아니라 실제 갤러리가 열려(isOpen) 있는지 여부로 스킵 결정
      let isOpen = false;
      try {
        isOpen = !!galleryState.value.isOpen;
      } catch {
        isOpen = false;
      }
      if (isOpen) {
        logger.debug('갤러리 열림 상태, 우선순위 강화 스킵');
        return;
      }

      // 페이지가 비활성 상태일 때는 실행하지 않음
      if (document.hidden) {
        logger.debug('페이지 비활성 상태, 우선순위 강화 스킵');
        return;
      }

      // 기존 갤러리 이벤트 정리 후 재등록
      this.galleryManager.cleanupGallery();

      if (this.safeEventOptions.handlers) {
        this.galleryManager.initializeGallery(
          this.safeEventOptions.handlers,
          this.safeEventOptions
        );
      }

      logger.debug('이벤트 우선순위 안전하게 강화됨 (MutationObserver 기반, isOpen 기준)');
    } catch (error) {
      logger.error('이벤트 우선순위 강화 실패:', error);
    }
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(forceReinitialize = false): EventManager {
    if (!EventManager.instance || forceReinitialize) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * 싱글톤 인스턴스 초기화 (테스트용)
   */
  public static resetInstance(): void {
    if (EventManager.instance) {
      EventManager.instance.cleanupAll();
      EventManager.instance = null;
      logger.debug('EventManager 싱글톤 인스턴스 초기화됨');
    }
  }

  /**
   * 자동 재초기화 모드 설정
   */
  public static enableAutoReinitialize(enabled: boolean): void {
    EventManager.autoReinitialize = enabled;
    logger.debug(`EventManager 자동 재초기화 모드: ${enabled ? '활성화' : '비활성화'}`);
  }

  /**
   * 자동 재초기화 모드 상태 확인
   */
  public static isAutoReinitializeEnabled(): boolean {
    return EventManager.autoReinitialize;
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
      if (EventManager.autoReinitialize) {
        this.reinitialize();
      } else {
        // 테스트(갤러리 구조/깊이) 환경에서 파괴 후 호출되는 패턴이 다수 발생 → 노이즈 감소용 무음 플래그
        if (!globalThis.__XEG_SILENCE_EVENT_MANAGER_WARN) {
          logger.warn('EventManager가 파괴된 상태에서 addEventListener 호출');
        }
        return this;
      }
    }

    this.domManager.addEventListener(element, eventType, handler, options);
    return this;
  }

  /**
   * Phase 2.1: DOM 이벤트 리스너 제거 메서드 추가
   */
  public removeEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window | null,
    eventType: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: EventListenerOptions
  ): EventManager {
    if (this.isDestroyed) {
      logger.warn('EventManager가 파괴된 상태에서 removeEventListener 호출');
      return this;
    }

    this.domManager.removeEventListener(element, eventType, handler, options);
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
      if (EventManager.autoReinitialize) {
        this.reinitialize();
      } else {
        logger.warn('EventManager가 파괴된 상태에서 addCustomEventListener 호출');
        return this;
      }
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

  /**
   * 수동 재초기화
   */
  public reinitialize(): void {
    // 기존 리스너들 정리
    this.domManager.cleanup();
    this.galleryManager.cleanupGallery();

    // 상태 초기화
    this.isDestroyed = false;

    // DOMEventManager를 새로 생성하여 재초기화
    this.domManager = createEventManager();

    logger.debug('EventManager 재초기화 완료');
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
   * Phase 6: 갤러리 이벤트 초기화 (성능 최적화 버전)
   * events.ts의 initializeGalleryEvents를 대체하는 안전한 버전
   */
  public async initializeGallery(
    handlers: EventHandlers,
    options?: Partial<SafeEventOptions>
  ): Promise<void> {
    const safeOptions: SafeEventOptions = {
      enableKeyboard: true,
      enableMediaDetection: true,
      debugMode: false,
      preventBubbling: false, // Phase 6: stopImmediatePropagation 문제 해결
      context: 'unified-gallery',
      useEventDelegation: true, // Phase 6: 이벤트 위임 사용
      preventImmediateStop: true, // Phase 6: stopImmediatePropagation 방지
      mutationObserver: true, // Phase 6: MutationObserver 사용
      handlers, // 핸들러 저장
      ...options,
    };

    this.safeEventOptions = safeOptions;

    // MutationObserver 초기화 (setInterval 대체)
    if (safeOptions.mutationObserver) {
      this.initializeMutationObserver();
    }

    // 기존 갤러리 이벤트 정리
    this.galleryManager.cleanupGallery();

    // 안전한 이벤트 등록 (stopImmediatePropagation 사용 안 함)
    return this.galleryManager.initializeGallery(handlers, {
      ...safeOptions,
      preventBubbling: false, // 다른 스크립트와의 호환성 유지
    });
  }

  /**
   * Phase 6: 갤러리 이벤트 정리 (개선된 버전)
   */
  public cleanupGallery(): void {
    // MutationObserver 정리
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    this.galleryManager.cleanupGallery();
    this.safeEventOptions = null;

    logger.debug('갤러리 이벤트 정리 완료 (Phase 6: 성능 최적화)');
  }

  /**
   * Phase 11: 갤러리 닫기 후 재우선순위 재설정을 위한 soft reset
   * - listener 들 제거하고 initialized 플래그만 false 로 전환하여
   *   향후 reinforce 또는 명시적 initialize 호출 시 재바인딩 허용
   */
  public softResetGallery(): void {
    try {
      // GalleryEventManager soft reset 사용
      // (handlers / options 유지, listenerIds 제거, initialized=false)
      if (this.galleryManager && 'softReset' in this.galleryManager) {
        // @ts-ignore - 런타임 존재 여부 체크 후 호출
        this.galleryManager.softReset();
        logger.debug('EventManager: gallery soft reset 수행 (Phase 11)');
      }
    } catch (error) {
      logger.warn('EventManager: gallery soft reset 실패:', error);
    }
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
   * Phase 2.1: 성능 메트릭 제공
   */
  public getPerformanceMetrics(): {
    usesMutationObserver: boolean;
    eventListenerCount: number;
    hasActiveObserver: boolean;
  } {
    return {
      usesMutationObserver: this.mutationObserver !== null,
      eventListenerCount: this.domManager.getListenerCount(),
      hasActiveObserver: this.mutationObserver !== null,
    };
  }

  /**
   * Phase 11: soft reset 후 갤러리 재열기 시 자동 재초기화 보장
   * - softResetGallery() 는 handlers/options 는 유지하되 listenerIds 제거 & initialized=false 설정
   * - reopen 시 initialized=false && handlers 존재하면 재등록 수행
   */
  public ensureGalleryAutoReinitialized(): void {
    try {
      const status = this.galleryManager.getGalleryStatus();
      if (!status.initialized && this.safeEventOptions?.handlers) {
        // 기존 handlers/options 재사용하여 재등록
        this.galleryManager.initializeGallery(this.safeEventOptions.handlers, {
          ...this.safeEventOptions,
          preventBubbling: false,
        });
        logger.debug('EventManager: soft reset 이후 자동 재초기화 수행 (Phase 11)');
      }
    } catch (error) {
      logger.warn('EventManager: 자동 재초기화 실패', error);
    }
  }

  /**
   * 모든 이벤트 정리 (Phase 6: 개선된 버전)
   */
  public cleanupAll(): void {
    this.cleanupGallery(); // MutationObserver도 함께 정리됨
    this.cleanup();
    logger.debug('EventManager 전체 정리 완료 (Phase 6)');
  }
}

// ================================
// Phase 6: events.ts 대체 함수들 (백워드 호환성)
// ================================

/**
 * events.ts의 initializeGalleryEvents를 대체하는 안전한 함수
 * @deprecated EventManager.getInstance().initializeGallery()를 사용하세요
 */
export async function initializeGalleryEventsSafe(
  handlers: EventHandlers,
  options?: Partial<SafeEventOptions>
): Promise<void> {
  const manager = EventManager.getInstance();
  return manager.initializeGallery(handlers, options);
}

/**
 * events.ts의 cleanupGalleryEvents를 대체하는 함수
 * @deprecated EventManager.getInstance().cleanupGallery()를 사용하세요
 */
export function cleanupGalleryEventsSafe(): void {
  const manager = EventManager.getInstance();
  manager.cleanupGallery();
}

/**
 * 성능 최적화된 통합 이벤트 관리자 팩토리
 */
export function createUnifiedEventManager(): EventManager {
  return EventManager.getInstance(true);
}

// ================================
// 백워드 호환성을 위한 별칭
// ================================

/**
 * TwitterEventManager 별칭 (기존 호환성 유지)
 */
export const TwitterEventManager = EventManager;
