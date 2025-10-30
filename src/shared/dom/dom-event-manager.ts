/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview DOM 이벤트 관리 유틸리티
 * @version 2.1.0 - Phase 195: 구조 최적화
 * @description 이벤트 리스너의 등록, 관리, 정리를 담당하는 클래스
 *
 * 현황: 내부용 (index.ts에서 의도적으로 제외)
 * 사용: 상대 경로로 직접 import 필요
 * 또는 BrowserService의 이벤트 관리 기능 사용 권장
 */

// NOTE: Vitest(vite-node) Windows alias 해석 이슈 회피 — 내부 의존성은 상대 경로 사용
import { logger } from '@shared/logging';

type EventCleanup = () => void;

interface EventOptions {
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
}

/**
 * DOM 이벤트 등록 및 관리를 위한 유틸리티 클래스
 */
export class DomEventManager {
  private cleanups: EventCleanup[] = [];
  private isDestroyed = false;

  /**
   * 이벤트 리스너 등록
   *
   * @param element - 이벤트를 등록할 요소
   * @param eventType - 이벤트 타입
   * @param handler - 이벤트 핸들러
   * @param options - 이벤트 옵션
   * @returns 체이닝을 위한 자기 자신
   */
  public addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window | null,
    eventType: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: EventOptions
  ): DomEventManager {
    if (!element || this.isDestroyed) {
      return this;
    }

    try {
      element.addEventListener(eventType, handler as EventListener, options);
      this.cleanups.push(() => {
        try {
          element.removeEventListener(eventType, handler as EventListener, options);
        } catch (error) {
          logger.warn('DOM EM: 이벤트 리스너 제거 실패', { eventType, error });
        }
      });

      logger.debug('DOM EM: 이벤트 리스너 등록', { eventType, options });
    } catch (error) {
      logger.error('DOM EM: 이벤트 리스너 등록 실패', { eventType, error });
    }

    return this;
  }

  /**
   * 커스텀 이벤트 리스너 등록
   *
   * @param element - 이벤트를 등록할 요소
   * @param eventType - 커스텀 이벤트 타입
   * @param handler - 이벤트 핸들러
   * @param options - 이벤트 옵션
   * @returns 체이닝을 위한 자기 자신
   */
  public addCustomEventListener(
    element: HTMLElement | Document | Window | null,
    eventType: string,
    handler: (event: Event) => void,
    options?: EventOptions
  ): DomEventManager {
    if (!element || this.isDestroyed) {
      return this;
    }

    try {
      element.addEventListener(eventType, handler, options);
      this.cleanups.push(() => {
        try {
          element.removeEventListener(eventType, handler, options);
        } catch (error) {
          logger.warn('DOM EM: 커스텀 이벤트 리스너 제거 실패', { eventType, error });
        }
      });

      logger.debug('DOM EM: 커스텀 이벤트 리스너 등록', { eventType, options });
    } catch (error) {
      logger.error('DOM EM: 커스텀 이벤트 리스너 등록 실패', { eventType, error });
    }

    return this;
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
        logger.warn('DOM EM: 개별 정리 실패', error);
      }
    });

    this.cleanups = [];
    this.isDestroyed = true;

    logger.debug('DOM EM: 모든 이벤트 리스너 정리 완료', { cleanupCount });
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
 * @returns 새로운 내부 DOM 이벤트 매니저 인스턴스
 * @note EventManager (event-manager.ts)에서 내부적으로 사용됨
 */
export function createDomEventManager(): DomEventManager {
  return new DomEventManager();
}
