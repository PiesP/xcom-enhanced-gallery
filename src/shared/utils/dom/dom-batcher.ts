/**
 * @fileoverview 간단한 DOM 배치 업데이트 유틸리티
 * @description 유저스크립트에 적합한 간단한 DOM 배치 처리
 * @version 1.0.0 - Phase C2: 단순화
 */

import { logger } from '@shared/logging/logger';

/**
 * DOM 업데이트 작업
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
 */
export class DOMBatcher {
  private readonly updates: DOMUpdate[] = [];
  private rafId: number | null = null;

  /**
   * DOM 업데이트 추가
   */
  add(update: DOMUpdate): void {
    this.updates.push(update);
    this.scheduleFlush();
  }

  /**
   * 여러 업데이트 추가
   */
  addMany(updates: DOMUpdate[]): void {
    this.updates.push(...updates);
    this.scheduleFlush();
  }

  /**
   * 즉시 모든 업데이트 실행
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
 */
export const globalDOMBatcher = new DOMBatcher();

/**
 * 편의 함수: 여러 요소의 스타일을 배치로 업데이트
 */
export function updateElementsInBatch(updates: DOMUpdate[]): void {
  globalDOMBatcher.addMany(updates);
}

/**
 * 편의 함수: 단일 요소 업데이트
 */
export function updateElement(element: HTMLElement, update: Omit<DOMUpdate, 'element'>): void {
  globalDOMBatcher.add({ element, ...update });
}

// 하위 호환성을 위한 별칭
export { DOMBatcher as BatchDOMUpdateManager };
export { globalDOMBatcher as batchDOMUpdateManager };
