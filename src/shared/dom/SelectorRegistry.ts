/**
 * @fileoverview SelectorRegistry — STABLE_SELECTORS 기반 DOM 접근 추상화
 * 테스트 가능한 구조(TDD)와 캐시 연동을 위한 경량 래퍼
 */

import { STABLE_SELECTORS } from '@/constants';
import { logger } from '@shared/logging/logger';
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
      try {
        const found = start.closest(sel);
        if (found) return found;
      } catch (error) {
        // invalid selector — standardized warn log and skip to next fallback
        logger.warn('selector.invalid', {
          module: 'SelectorRegistry',
          op: 'findClosest',
          selector: sel,
          reason: 'invalid-selector',
          error,
        });
        continue;
      }
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
    const table = getActionButtonMap(this.selectors);
    const entry = table[action];
    if (!entry) return null;

    // data-testid 1순위 + aria-label/role 기반 보조 셀렉터 (테이블 기반)
    const { primary, fallbacks } = entry;
    const candidates = [primary, ...fallbacks];
    return this.findFirst(candidates, container);
  }
}

export function createSelectorRegistry(options: SelectorRegistryOptions = {}): SelectorRegistry {
  return new SelectorRegistry(options);
}

// 타입 안전성을 위한 안정적 export 타입(테스트에서 재사용)
// (no-op)

// 내부 유틸: 액션 버튼 보조 셀렉터 집합
// data-testid가 제거/변경되어도 aria-label/role 조합으로 탐색 가능해야 함
// CSS4의 대소문자 무시 플래그(i)를 사용해 레이블 변형에 대응
// JSDOM/브라우저 지원 범위에서 안전한 속성 부분 일치 선택자를 사용
export type ActionName = keyof typeof STABLE_SELECTORS.ACTION_BUTTONS;
export interface ActionButtonMapEntry {
  primary: string;
  fallbacks: readonly string[];
}
export type ActionButtonMap = Record<ActionName, ActionButtonMapEntry>;

/**
 * 액션 버튼 선택자 매핑 테이블
 * - primary(data-testid) + aria-label/role 기반 fallbacks를 단일 구조로 노출
 * - 선택자 상수(STABLE_SELECTORS)를 주입 가능하게 유지
 */
export function getActionButtonMap(
  selectors: typeof STABLE_SELECTORS = STABLE_SELECTORS
): ActionButtonMap {
  const map: ActionButtonMap = {
    like: {
      primary: selectors.ACTION_BUTTONS.like,
      fallbacks: ['button[aria-label*="Like" i]', '[role="button"][aria-label*="Like" i]'],
    },
    retweet: {
      primary: selectors.ACTION_BUTTONS.retweet,
      fallbacks: [
        '[aria-label*="Retweet" i]',
        '[aria-label*="Repost" i]',
        '[role="button"][aria-label*="Retweet" i]',
        '[role="button"][aria-label*="Repost" i]',
      ],
    },
    reply: {
      primary: selectors.ACTION_BUTTONS.reply,
      fallbacks: ['[aria-label*="Reply" i]', '[role="button"][aria-label*="Reply" i]'],
    },
    share: {
      primary: selectors.ACTION_BUTTONS.share,
      fallbacks: ['[aria-label*="Share" i]', '[role="button"][aria-label*="Share" i]'],
    },
    bookmark: {
      primary: selectors.ACTION_BUTTONS.bookmark,
      fallbacks: ['[aria-label*="Bookmark" i]', '[role="button"][aria-label*="Bookmark" i]'],
    },
  };
  return map;
}

/**
 * 내부 유틸(하위 호환): 액션 버튼 보조 셀렉터 집합
 * - deprecated: 통합 테이블(getActionButtonMap)에서 fallbacks를 조회하는 얇은 래퍼
 */
export function getActionButtonFallbacks(
  action: keyof typeof STABLE_SELECTORS.ACTION_BUTTONS
): readonly string[] {
  const table = getActionButtonMap();
  return table[action]?.fallbacks ?? ([] as const);
}
