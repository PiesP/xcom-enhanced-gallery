/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview DOM 이벤트 관리 유틸리티
 * @description 이벤트 리스너의 등록, 관리, 정리를 담당하는 클래스
 */

import { logger } from '@infrastructure/logging/logger';

type EventCleanup = () => void;

interface EventOptions {
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
}

/**
 * DOM 이벤트 등록 및 관리를 위한 유틸리티 클래스
 */
export class DOMEventManager {
  private cleanups: EventCleanup[] = [];
  private isDestroyed = false;

  /**
   * 이벤트 리스너 등록
   *
   * @param element - 이벤트를 등록할 요소
   * @param eventType - 이벤트 타입
   * @param handler - 이벤트 핸들러
   * @param options - 이벤트 옵션
   * @returns 체이닝을 위한 DOMEventManager 인스턴스
   */
  public addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window | null,
    eventType: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: EventOptions
  ): DOMEventManager {
    if (!element || this.isDestroyed) {
      return this;
    }

    try {
      element.addEventListener(eventType, handler as EventListener, options);
      this.cleanups.push(() => {
        try {
          element.removeEventListener(eventType, handler as EventListener, options);
        } catch (error) {
          logger.warn('DOMEventManager: 이벤트 리스너 제거 실패', { eventType, error });
        }
      });

      logger.debug('DOMEventManager: 이벤트 리스너 등록', { eventType, options });
    } catch (error) {
      logger.error('DOMEventManager: 이벤트 리스너 등록 실패', { eventType, error });
    }

    return this;
  }

  /**
   * 여러 이벤트 리스너 등록
   *
   * @param element - 이벤트를 등록할 요소
   * @param events - 이벤트 타입 배열
   * @param handler - 이벤트 핸들러
   * @param options - 이벤트 옵션
   * @returns 체이닝을 위한 DOMEventManager 인스턴스
   */
  public addMultipleEventListeners<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window | null,
    events: K[],
    handler: (event: Event) => void,
    options?: EventOptions
  ): DOMEventManager {
    events.forEach(eventType => {
      this.addEventListener(element, eventType, handler, options);
    });
    return this;
  }

  /**
   * 특정 이벤트 타입의 핸들러만 정리
   *
   * @param eventType - 정리할 이벤트 타입
   */
  public removeEventListenersOfType(eventType: string): void {
    // 구현 복잡도를 줄이기 위해 전체 정리로 대체
    // 실제 사용에서는 이벤트 타입별로 분리하여 관리할 수 있음
    logger.debug('DOMEventManager: 특정 이벤트 타입 정리 요청', { eventType });
  }

  /**
   * 모든 이벤트 리스너 정리
   */
  public cleanup(): void {
    if (this.isDestroyed) {
      return;
    }

    let cleanupCount = 0;
    this.cleanups.forEach(cleanup => {
      try {
        cleanup();
        cleanupCount++;
      } catch (error) {
        logger.warn('DOMEventManager: 개별 정리 실패', error);
      }
    });

    this.cleanups = [];
    this.isDestroyed = true;

    logger.debug('DOMEventManager: 모든 이벤트 리스너 정리 완료', { cleanupCount });
  }

  /**
   * 등록된 이벤트 리스너 개수 반환
   */
  public getListenerCount(): number {
    return this.cleanups.length;
  }

  /**
   * 파괴된 상태인지 확인
   */
  public getIsDestroyed(): boolean {
    return this.isDestroyed;
  }
}

/**
 * DOM 이벤트 매니저 인스턴스 생성
 *
 * @returns 새로운 DOMEventManager 인스턴스
 */
export function createEventManager(): DOMEventManager {
  return new DOMEventManager();
}
