/**
 * @fileoverview DOM 배치 업데이트 유틸리티 - DOMService로 통합됨
 * @description DOMService.batchUpdate 사용을 권장
 * @version 1.0.0 - Deprecated: Use DOMService instead
 * @deprecated Use DOMService.batchUpdate() instead
 */

import { logger } from '@shared/logging/logger';

/**
 * DOM 업데이트 작업
 * @deprecated Use DOMService.DOMUpdate instead
 */
export interface DOMUpdate {
  element: HTMLElement;
  styles?: Partial<CSSStyleDeclaration>;
  classes?: { add?: string[]; remove?: string[] };
  attributes?: Record<string, string>;
  textContent?: string;
}

/**
 * 간단한 DOM 배치 업데이트 매니저
 * @deprecated Use DOMService.batchUpdate() instead
 */
export class DOMBatcher {
  private readonly updates: DOMUpdate[] = [];
  private rafId: number | null = null;

  /**
   * DOM 업데이트 추가
   * @deprecated Use DOMService.batchUpdate() instead
   */
  add(update: DOMUpdate): void {
    logger.warn('[DOMBatcher] DEPRECATED: Use DOMService.batchUpdate() instead');
    this.updates.push(update);
    this.scheduleFlush();
  }

  /**
   * 여러 업데이트 추가
   * @deprecated Use DOMService.batchUpdate() instead
   */
  addMany(updates: DOMUpdate[]): void {
    logger.warn('[DOMBatcher] DEPRECATED: Use DOMService.batchUpdate() instead');
    this.updates.push(...updates);
    this.scheduleFlush();
  }

  /**
   * 즉시 모든 업데이트 실행
   * @deprecated Use DOMService.batchUpdate() instead
   */
  flush(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    const updates = this.updates.splice(0);
    if (updates.length === 0) return;

    try {
      updates.forEach(update => this.applyUpdate(update));
      logger.debug(`DOMBatcher: Applied ${updates.length} updates`);
    } catch (error) {
      logger.error('DOMBatcher: Update failed', error);
    }
  }

  /**
   * 모든 대기 중인 업데이트 취소
   */
  clear(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.updates.length = 0;
  }

  private scheduleFlush(): void {
    if (this.rafId) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.flush();
    });
  }

  private applyUpdate(update: DOMUpdate): void {
    const { element, styles, classes, attributes, textContent } = update;

    if (styles) {
      Object.assign(element.style, styles);
    }

    if (classes) {
      if (classes.add) {
        element.classList.add(...classes.add);
      }
      if (classes.remove) {
        element.classList.remove(...classes.remove);
      }
    }

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (textContent !== undefined) {
      element.textContent = textContent;
    }
  }
}

/**
 * 글로벌 DOMBatcher 인스턴스
 * @deprecated Use DOMService.batchUpdate() instead
 */
export const globalDOMBatcher = new DOMBatcher();

/**
 * 편의 함수: 여러 요소의 스타일을 배치로 업데이트
 * @deprecated Use DOMService.batchUpdate() instead
 */
export function updateElementsInBatch(updates: DOMUpdate[]): void {
  logger.warn('[updateElementsInBatch] DEPRECATED: Use DOMService.batchUpdate() instead');
  globalDOMBatcher.addMany(updates);
}

/**
 * 편의 함수: 단일 요소 업데이트
 * @deprecated Use DOMService.batchUpdate() instead
 */
export function updateElement(element: HTMLElement, update: Omit<DOMUpdate, 'element'>): void {
  logger.warn('[updateElement] DEPRECATED: Use DOMService.batchUpdate() instead');
  globalDOMBatcher.add({ element, ...update });
}

// 하위 호환성을 위한 별칭 - 모두 deprecated
/** @deprecated Use DOMService.batchUpdate() instead */
export { DOMBatcher as BatchDOMUpdateManager };
/** @deprecated Use DOMService.batchUpdate() instead */
export { globalDOMBatcher as batchDOMUpdateManager };
