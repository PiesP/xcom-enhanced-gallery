/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview DOM 이벤트 관리 유틸리티
 * @description 이벤트 리스너의 등록, 관리, 정리를 담당하는 클래스
 * @version 2.0.0 - Core layer migration
 */

import { logger } from '@shared/logging/logger';

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
  private auditRecords: {
    id: number;
    event: string;
    target: string;
    capture: boolean;
    passive: boolean;
    once: boolean;
    order: number;
  }[] = [];
  private nextId = 1;

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
  ): DOMEventManager {
    if (!element || this.isDestroyed) {
      return this;
    }

    try {
      element.addEventListener(eventType, handler as EventListener, options);
      // 감사 레코드 저장 (오버헤드 낮음)
      const targetLabel =
        element === window ? 'window' : element === document ? 'document' : 'element';
      this.auditRecords.push({
        id: this.nextId++,
        event: String(eventType),
        target: targetLabel,
        capture: !!options?.capture,
        passive: !!options?.passive,
        once: !!options?.once,
        order: this.auditRecords.length,
      });
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
   * Phase 2.1: 이벤트 리스너 제거 메서드 추가
   */
  public removeEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window | null,
    eventType: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: EventOptions
  ): DOMEventManager {
    if (!element || this.isDestroyed) {
      return this;
    }

    try {
      element.removeEventListener(eventType, handler as EventListener, options);
    } catch (error) {
      logger.warn('DOMEventManager: 이벤트 리스너 제거 실패', { eventType, error });
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
  ): DOMEventManager {
    if (!element || this.isDestroyed) {
      return this;
    }

    try {
      element.addEventListener(eventType, handler, options);
      this.cleanups.push(() => {
        try {
          element.removeEventListener(eventType, handler, options);
        } catch (error) {
          logger.warn('DOMEventManager: 커스텀 이벤트 리스너 제거 실패', { eventType, error });
        }
      });

      logger.debug('DOMEventManager: 커스텀 이벤트 리스너 등록', { eventType, options });
    } catch (error) {
      logger.error('DOMEventManager: 커스텀 이벤트 리스너 등록 실패', { eventType, error });
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
        logger.warn('DOMEventManager: 개별 정리 실패', error);
      }
    });

    this.cleanups = [];
    this.isDestroyed = true;
    this.auditRecords = [];
    this.nextId = 1;

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

  /**
   * 등록된 DOM 이벤트 감사 레코드 (우선순위 스냅샷용)
   */
  public getAuditRecords(): ReadonlyArray<{
    id: number;
    event: string;
    target: string;
    capture: boolean;
    passive: boolean;
    once: boolean;
    order: number;
  }> {
    return this.auditRecords;
  }
}

/**
 * DOM 이벤트 매니저 인스턴스 생성
 *
 * @deprecated UnifiedEventManager를 사용하세요
 * @returns 새로운 DOMEventManager 인스턴스
 */
export function createEventManager(): DOMEventManager {
  return new DOMEventManager();
}
