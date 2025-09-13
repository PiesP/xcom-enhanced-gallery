/**
 * @fileoverview SelectorRegistry — STABLE_SELECTORS 기반 DOM 접근 추상화
 * 테스트 가능한 구조(TDD)와 캐시 연동을 위한 경량 래퍼
 */

import { STABLE_SELECTORS } from '../../constants';
import { cachedQuerySelectorAll, cachedStableQuery } from './DOMCache';

export type QueryContainer = Document | Element;

/**
 * SelectorRegistry 계약
 */
export interface ISelectorRegistry {
  findFirst(selectors: readonly string[], container?: QueryContainer): Element | null;
  findAll(selectors: readonly string[], container?: QueryContainer): Element[];
  findClosest(selectors: readonly string[], start?: Element): Element | null;

  findTweetContainer(container?: QueryContainer): Element | null;
  findImageElement(container?: QueryContainer): Element | null;
  findMediaPlayer(container?: QueryContainer): Element | null;
  findMediaLink(container?: QueryContainer): Element | null;
  queryActionButton(
    action: keyof typeof STABLE_SELECTORS.ACTION_BUTTONS,
    container?: QueryContainer
  ): Element | null;
}

/**
 * STABLE_SELECTORS를 주입 가능하게 유지(테스트 용이)
 */
export interface SelectorRegistryOptions {
  selectors?: typeof STABLE_SELECTORS;
}

export class SelectorRegistry implements ISelectorRegistry {
  private readonly selectors: typeof STABLE_SELECTORS;

  constructor(options: SelectorRegistryOptions = {}) {
    this.selectors = options.selectors ?? STABLE_SELECTORS;
  }

  public findFirst(selectors: readonly string[], container?: QueryContainer): Element | null {
    return cachedStableQuery(selectors, container);
  }

  public findAll(selectors: readonly string[], container?: QueryContainer): Element[] {
    // 우선순위 배열을 순회하며 결과를 누적 + 중복 제거
    const seen = new Set<Element>();
    const result: Element[] = [];
    for (const sel of selectors) {
      const list = cachedQuerySelectorAll(sel, container);
      for (let i = 0; i < list.length; i++) {
        const el = list[i] as Element;
        if (!seen.has(el)) {
          seen.add(el);
          result.push(el);
        }
      }
    }
    return result;
  }

  /**
   * 우선순위 배열에 따라 start 기준으로 가장 가까운 상위 조상 중 첫 매칭을 반환
   */
  public findClosest(selectors: readonly string[], start?: Element): Element | null {
    if (!start) return null;

    for (const sel of selectors) {
      const found = start.closest(sel);
      if (found) return found;
    }
    return null;
  }

  public findTweetContainer(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.TWEET_CONTAINERS, container);
  }

  public findImageElement(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.IMAGE_CONTAINERS, container);
  }

  public findMediaPlayer(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.MEDIA_PLAYERS, container);
  }

  public findMediaLink(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.MEDIA_LINKS, container);
  }

  public queryActionButton(
    action: keyof typeof STABLE_SELECTORS.ACTION_BUTTONS,
    container?: QueryContainer
  ): Element | null {
    const selector = this.selectors.ACTION_BUTTONS[action];
    if (!selector) return null;
    return this.findFirst([selector], container);
  }
}

export function createSelectorRegistry(options: SelectorRegistryOptions = {}): SelectorRegistry {
  return new SelectorRegistry(options);
}

// 타입 안전성을 위한 안정적 export 타입(테스트에서 재사용)
// (no-op)
