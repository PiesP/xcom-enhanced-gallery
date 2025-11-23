/**
 * @fileoverview SelectorRegistry - Simplified DOM Query Abstraction
 * @description Provides type-safe DOM querying using cached stable selectors.
 */

import { STABLE_SELECTORS } from '@/constants';
import { cachedStableQuery, cachedQuerySelectorAll } from './dom-cache';

export type QueryContainer = Document | Element;

export interface ISelectorRegistry {
  findFirst(selectors: readonly string[], container?: QueryContainer): Element | null;
  findAll(selectors: readonly string[], container?: QueryContainer): Element[];
  findClosest(selectors: readonly string[], start?: Element): Element | null;

  // Domain specific
  findTweetContainer(container?: QueryContainer): Element | null;
  findImageElement(container?: QueryContainer): Element | null;
  findMediaPlayer(container?: QueryContainer): Element | null;
  findMediaLink(container?: QueryContainer): Element | null;
  queryActionButton(
    action: keyof typeof STABLE_SELECTORS.ACTION_BUTTONS,
    container?: QueryContainer
  ): Element | null;
}

export interface SelectorRegistryOptions {
  selectors?: typeof STABLE_SELECTORS;
}

class SelectorRegistryImpl implements ISelectorRegistry {
  private readonly selectors: typeof STABLE_SELECTORS;

  constructor(options: SelectorRegistryOptions = {}) {
    this.selectors = options.selectors ?? STABLE_SELECTORS;
  }

  findFirst(selectors: readonly string[], container?: QueryContainer): Element | null {
    return cachedStableQuery(selectors, container);
  }

  findAll(selectors: readonly string[], container?: QueryContainer): Element[] {
    const results = new Set<Element>();
    for (const selector of selectors) {
      const elements = cachedQuerySelectorAll(selector, container);
      elements.forEach(el => results.add(el));
    }
    return Array.from(results);
  }

  findClosest(selectors: readonly string[], start?: Element): Element | null {
    if (!start) return null;
    for (const selector of selectors) {
      const match = start.closest(selector);
      if (match) return match;
    }
    return null;
  }

  findTweetContainer(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.TWEET_CONTAINERS, container);
  }

  findImageElement(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.IMAGE_CONTAINERS, container);
  }

  findMediaPlayer(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.MEDIA_PLAYERS, container);
  }

  findMediaLink(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.MEDIA_LINKS, container);
  }

  queryActionButton(
    action: keyof typeof STABLE_SELECTORS.ACTION_BUTTONS,
    container?: QueryContainer
  ): Element | null {
    const selector = this.selectors.ACTION_BUTTONS[action];
    return selector ? this.findFirst([selector], container) : null;
  }
}

export const SelectorRegistry = SelectorRegistryImpl;

export function createSelectorRegistry(options: SelectorRegistryOptions = {}): ISelectorRegistry {
  return new SelectorRegistryImpl(options);
}
