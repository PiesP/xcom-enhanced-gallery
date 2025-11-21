/**
 * @fileoverview SelectorRegistry - STABLE_SELECTORS Query Abstraction
 * @version 2.0.0 - Phase 195: Structural optimization, Phase 403: Enhanced docs
 *
 * Provides type-safe, testable DOM querying with selector fallback chains.
 * Integrates with DomCache for performance optimization.
 *
 * **Design Pattern**: Registry pattern + Selector fallback strategy
 * **Architecture Role**: Shared DOM query abstraction (media extraction focus)
 * **Type Safety**: Generic interface ISelectorRegistry for mockability
 * **Performance**: Uses DomCache for repeated queries
 *
 * **Key Concepts**:
 * - Selector Chains: Try multiple selectors in priority order
 * - Deduplication: findAll() removes duplicates across chains
 * - Container Scoping: All queries support container parameter
 * - Test Friendly: Selectors injected via options (mockable)
 *
 * **Architectural Role**:
 * DomDirectExtractor (uses)
 *   ↓
 * SelectorRegistry (queries)
 *   ↓
 * DomCache (caches queries)
 *   ↓
 * DOM Utils (safe queries)
 *
 * **Primary Use Case**: Media extraction from tweet DOM (X.com gallery)
 * **Related**: [DomDirectExtractor](../services/media-extraction/extractors/dom-direct-extractor.ts)
 *
 * @related [DomCache](./dom-cache.ts), [DOM Utils](./utils/dom-utils.ts), [STABLE_SELECTORS](@/constants)
 */

import { STABLE_SELECTORS } from '../../constants';
import { cachedQuerySelectorAll, cachedStableQuery } from './dom-cache';

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Supported query container types (Document or Element) */
export type QueryContainer = Document | Element;

/**
 * SelectorRegistry public interface.
 *
 * **Generic Methods**:
 * - findFirst() - Try selectors in order, return first match
 * - findAll() - Try selectors, collect all matches (deduplicated)
 * - findClosest() - Find closest ancestor matching any selector
 *
 * **Specialized Methods** (domain-specific):
 * - findTweetContainer() - Media container
 * - findImageElement() - Image element
 * - findMediaPlayer() - Video player
 * - findMediaLink() - Media URL source
 * - queryActionButton() - Action buttons (retweet, like, etc.)
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
 * Options for SelectorRegistry instantiation.
 *
 * **Supports Dependency Injection** for testing:
 * - selectors: Custom selector map (defaults to STABLE_SELECTORS)
 *
 * @example
 * // Production (defaults)
 * const registry = new SelectorRegistry();
 *
 * // Testing (custom selectors)
 * const testRegistry = new SelectorRegistry({
 *   selectors: mockSelectors
 * });
 */
export interface SelectorRegistryOptions {
  selectors?: typeof STABLE_SELECTORS;
}

// ============================================================================
// SelectorRegistry Implementation
// ============================================================================

/**
 * Query registry with selector fallback chains.
 *
 * **Lifecycle**:
 * 1. Create: `new SelectorRegistry(options)`
 * 2. Query: `findFirst()`, `findAll()`, etc.
 * 3. Results: Cached by DomCache, deduplicated
 *
 * **Key Algorithms**:
 * - findFirst(): Try selectors in order, return first match (short-circuit)
 * - findAll(): Accumulate matches from all selectors, deduplicate
 * - findClosest(): Walk ancestor chain for matches
 */

export class SelectorRegistry implements ISelectorRegistry {
  private readonly selectors: typeof STABLE_SELECTORS;

  constructor(options: SelectorRegistryOptions = {}) {
    this.selectors = options.selectors ?? STABLE_SELECTORS;
  }

  /**
   * Find first matching element from selector chain.
   *
   * **Behavior**: Try selectors in order, return first match
   * **Performance**: Short-circuit (stops at first match)
   * **Caching**: Queries cached by DomCache
   *
   * @param selectors - Selector array to try (priority order)
   * @param container - Query scope (defaults to document)
   * @returns First matching element or null if none found
   *
   * @example
   * const el = registry.findFirst(['img.primary', 'img']);
   */
  public findFirst(selectors: readonly string[], container?: QueryContainer): Element | null {
    return cachedStableQuery(selectors, container);
  }

  /**
   * Find all matching elements from selector chain.
   *
   * **Behavior**: Try all selectors, collect matches (deduplicated)
   * **Performance**: O(n*m) where n = selectors, m = elements
   * **Deduplication**: Uses Set to avoid duplicates across chains
   *
   * @param selectors - Selector array to try (all tested)
   * @param container - Query scope (defaults to document)
   * @returns Array of unique matching elements
   *
   * @example
   * const all = registry.findAll(['img.primary', 'img.fallback', 'img']);
   */

  public findAll(selectors: readonly string[], container?: QueryContainer): Element[] {
    // Priority array traversal with result accumulation + deduplication
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
   * Find closest ancestor matching any selector.
   *
   * **Behavior**: Try selectors in order on ancestor chain
   * **Algorithm**: For each selector, walk ancestors until match or root
   * **Performance**: O(selectors.length * ancestor_depth)
   *
   * @param selectors - Selector array to try (priority order)
   * @param start - Starting element (defaults to null)
   * @returns Closest matching ancestor or null
   *
   * @example
   * const container = registry.findClosest(['article', 'div[data-tweet]'], element);
   */
  public findClosest(selectors: readonly string[], start?: Element): Element | null {
    if (!start) return null;

    for (const sel of selectors) {
      const found = start.closest(sel);
      if (found) return found;
    }
    return null;
  }

  /**
   * Find tweet container (media extraction focus).
   *
   * **Uses**: STABLE_SELECTORS.TWEET_CONTAINERS chain
   * **Purpose**: Identify tweet article element
   *
   * @param container - Query scope
   * @returns Tweet container element or null
   */
  public findTweetContainer(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.TWEET_CONTAINERS, container);
  }

  /**
   * Find image element within media container.
   *
   * **Uses**: STABLE_SELECTORS.IMAGE_CONTAINERS chain
   * **Purpose**: Extract image URL sources
   *
   * @param container - Query scope
   * @returns Image element or null
   */
  public findImageElement(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.IMAGE_CONTAINERS, container);
  }

  /**
   * Find media player (video) element.
   *
   * **Uses**: STABLE_SELECTORS.MEDIA_PLAYERS chain
   * **Purpose**: Detect and extract video sources
   *
   * @param container - Query scope
   * @returns Video player element or null
   */
  public findMediaPlayer(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.MEDIA_PLAYERS, container);
  }

  /**
   * Find media link element (URL source).
   *
   * **Uses**: STABLE_SELECTORS.MEDIA_LINKS chain
   * **Purpose**: Extract media resource URLs
   *
   * @param container - Query scope
   * @returns Media link element or null
   */
  public findMediaLink(container?: QueryContainer): Element | null {
    return this.findFirst(this.selectors.MEDIA_LINKS, container);
  }

  /**
   * Find action button by action type.
   *
   * **Uses**: STABLE_SELECTORS.ACTION_BUTTONS[action] selector
   * **Purpose**: Identify tweet action buttons (like, retweet, share, etc.)
   *
   * @param action - Action button type (key of ACTION_BUTTONS)
   * @param container - Query scope
   * @returns Action button element or null
   */
  public queryActionButton(
    action: keyof typeof STABLE_SELECTORS.ACTION_BUTTONS,
    container?: QueryContainer
  ): Element | null {
    const selector = this.selectors.ACTION_BUTTONS[action];
    if (!selector) return null;
    return this.findFirst([selector], container);
  }
}

// ============================================================================
// Factory Function & Type Re-exports
// ============================================================================

/**
 * Create new SelectorRegistry instance.
 *
 * **Convenience Factory**: Shorthand for `new SelectorRegistry(options)`
 * **Testability**: Supports options injection for custom selectors
 *
 * @param options - Configuration (selectors, etc.)
 * @returns New registry instance
 *
 * @example
 * const registry = createSelectorRegistry();
 * const el = registry.findTweetContainer();
 */

export function createSelectorRegistry(options: SelectorRegistryOptions = {}): SelectorRegistry {
  return new SelectorRegistry(options);
}
