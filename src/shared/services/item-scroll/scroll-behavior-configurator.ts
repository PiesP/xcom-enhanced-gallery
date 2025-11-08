/**
 * Scroll Behavior Configurator
 *
 * @fileoverview Manages scroll positioning behavior with accessibility support.
 *
 * **Responsibilities**:
 * - Normalize scroll options (behavior, block, offset, alignToCenter)
 * - Handle prefers-reduced-motion media query for accessibility
 * - Cache media query results (performance optimization)
 * - Convert static values to Solid.js accessors (reactivity)
 *
 * **Accessibility**:
 * - Respects prefers-reduced-motion (reduces motion for users with vestibular disorders)
 * - Forces 'auto' behavior when reduced motion is requested
 * - Caches media query results for performance
 *
 * **Architecture Integration**:
 * - Part of item-scroll service layer (Phase 309 Service Layer pattern)
 * - Works with ItemPositioningService for complete scroll control
 * - Exports factory function for dependency injection
 *
 * **Performance**:
 * - Media query cache: O(1) lookup after first check
 * - Accessor conversion: Single-pass transformation
 * - No polling or timers
 *
 * **Usage**:
 * ```typescript
 * const configurator = createScrollBehaviorConfigurator({
 *   behavior: 'smooth',
 *   block: 'center',
 *   respectReducedMotion: true,
 * });
 *
 * const resolved = configurator.getResolvedBehavior();
 * // { behavior: 'auto' if reduced motion, block: 'center', ... }
 * ```
 */

import { logger } from '../../logging';
import type { Accessor } from 'solid-js';
import { toAccessor } from '../../utils/solid-helpers';

/**
 * Scroll behavior configuration options
 *
 * Reactive accessors for scroll positioning parameters.
 *
 * **Properties**:
 * - enabled: Whether scrolling is enabled
 * - behavior: 'auto' (instant) or 'smooth' (animated)
 * - block: Vertical alignment ('start', 'center', 'end', 'nearest')
 * - offset: Pixel offset from alignment position
 * - alignToCenter: Override block to use 'center'
 * - respectReducedMotion: Honor prefers-reduced-motion media query
 */
export interface ScrollBehaviorConfig {
  enabled: Accessor<boolean>;
  behavior: Accessor<ScrollBehavior>;
  block: Accessor<ScrollLogicalPosition>;
  offset: Accessor<number>;
  alignToCenter: Accessor<boolean>;
  respectReducedMotion: Accessor<boolean>;
}

/**
 * Resolved scroll behavior values
 *
 * Final computed values after resolving accessors and media queries.
 *
 * **Properties**:
 * - behavior: Final behavior ('auto' if reduced motion, else configured)
 * - block: Final vertical alignment
 * - alignToCenter: Whether to override to 'center'
 * - offset: Pixel offset
 */
export interface ResolvedScrollBehavior {
  behavior: ScrollBehavior;
  block: ScrollLogicalPosition;
  alignToCenter: boolean;
  offset: number;
}

/**
 * Scroll Behavior Configurator
 *
 * Manages scroll positioning behavior with accessibility support.
 *
 * **Responsibilities**:
 * - Normalize scroll options to Solid.js accessors for reactivity
 * - Detect and honor prefers-reduced-motion (accessibility)
 * - Cache media query results for performance
 * - Compute final scroll parameters
 *
 * **Flow**:
 * 1. Constructor: Convert static values or accessors to normalized form
 * 2. getResolvedBehavior(): Compute final values (check reduced motion)
 * 3. resolveBehavior(): Decide 'auto' vs 'smooth' based on preferences
 *
 * **Accessibility**:
 * - Checks prefers-reduced-motion media query
 * - Forces 'auto' (instant scroll) when reduced motion requested
 * - Respects user accessibility preferences
 *
 * **Performance**:
 * - Media query cache: Store results to avoid repeated checks
 * - Media query runs in try-catch for safety
 * - Cache cleared on demand via clearCache()
 *
 * **Use Cases**:
 * - Gallery scroll: Smooth by default, instant if reduced motion
 * - Navigation: Respect user preferences
 * - Adaptive UI: Change behavior based on device capabilities
 *
 * @example
 * ```typescript
 * const configurator = new ScrollBehaviorConfigurator({
 *   behavior: 'smooth',
 *   block: 'center',
 *   respectReducedMotion: true,
 * });
 *
 * const resolved = configurator.getResolvedBehavior();
 * // Returns { behavior: 'auto' if reduced motion, block: 'center', ... }
 * ```
 */
export class ScrollBehaviorConfigurator {
  private readonly config: ScrollBehaviorConfig;
  private readonly mediaQueryCache: Map<string, boolean> = new Map();

  constructor(
    options: {
      enabled?: boolean | Accessor<boolean>;
      behavior?: ScrollBehavior | Accessor<ScrollBehavior>;
      block?: ScrollLogicalPosition | Accessor<ScrollLogicalPosition>;
      offset?: number | Accessor<number>;
      alignToCenter?: boolean | Accessor<boolean>;
      respectReducedMotion?: boolean | Accessor<boolean>;
    } = {}
  ) {
    this.config = {
      enabled: toAccessor(options.enabled ?? true),
      behavior: toAccessor(options.behavior ?? 'smooth'),
      block: toAccessor(options.block ?? 'start'),
      offset: toAccessor(options.offset ?? 0),
      alignToCenter: toAccessor(options.alignToCenter ?? false),
      respectReducedMotion: toAccessor(options.respectReducedMotion ?? true),
    };
  }

  /**
   * Get resolved scroll behavior
   *
   * Computes final scroll parameters by evaluating all accessors.
   *
   * **Process**:
   * 1. Resolve scroll behavior (auto vs smooth based on reduced motion)
   * 2. Determine block position (center or configured)
   * 3. Gather offset and alignToCenter settings
   *
   * **Return Value**:
   * - behavior: 'auto' if reduced motion, else configured behavior
   * - block: 'center' if alignToCenter, else configured block
   * - alignToCenter: Raw flag (true/false)
   * - offset: Pixel offset from position
   *
   * @returns Final resolved scroll behavior parameters
   *
   * @example
   * ```typescript
   * const config = new ScrollBehaviorConfigurator({
   *   behavior: 'smooth',
   *   block: 'start',
   *   respectReducedMotion: true,
   * });
   *
   * const resolved = config.getResolvedBehavior();
   * // { behavior: 'smooth', block: 'start', alignToCenter: false, offset: 0 }
   * ```
   */
  getResolvedBehavior(): ResolvedScrollBehavior {
    const behavior = this.resolveBehavior();

    return {
      behavior,
      block: this.config.alignToCenter() ? 'center' : this.config.block(),
      alignToCenter: this.config.alignToCenter(),
      offset: this.config.offset(),
    };
  }

  /**
   * Resolve scroll behavior (auto vs smooth)
   *
   * Determines final scroll behavior by checking reduced motion preference.
   *
   * **Algorithm**:
   * 1. If respectReducedMotion = false, use configured behavior
   * 2. If respectReducedMotion = true:
   *    - Check prefersReducedMotion() (media query)
   *    - If true, return 'auto' (instant)
   *    - If false, return configured behavior ('smooth')
   *
   * **Accessibility**:
   * - Honors prefers-reduced-motion for users with vestibular disorders
   * - Instant scroll prevents nausea/disorientation
   *
   * **Performance**:
   * - Media query cached after first call
   * - Subsequent calls return cached value
   *
   * @returns 'auto' if reduced motion, else configured behavior
   */
  private resolveBehavior(): ScrollBehavior {
    if (!this.config.respectReducedMotion()) {
      return this.config.behavior();
    }

    // Check prefers-reduced-motion media query
    if (this.prefersReducedMotion()) {
      logger.debug('ScrollBehaviorConfigurator: prefers-reduced-motion detected, using auto');
      return 'auto';
    }

    return this.config.behavior();
  }

  /**
   * Check prefers-reduced-motion media query
   *
   * Detects user accessibility preference for reduced motion.
   *
   * **Process**:
   * 1. Check cache first (O(1) lookup)
   * 2. If not cached, run matchMedia('(prefers-reduced-motion: reduce)')
   * 3. Store result in cache for future calls
   * 4. Catch errors and return false (safe default)
   *
   * **Cache Benefits**:
   * - Avoid repeated media query evaluations
   * - Media queries trigger reflow (performance expensive)
   * - Single check per session sufficient
   *
   * **Error Handling**:
   * - Catches errors in matchMedia (browser incompatibility)
   * - Logs warning and returns false (fail-safe)
   * - Ensures smooth animation by default on error
   *
   * **Browser Support**:
   * - Modern browsers (Chrome 63+, Firefox 63+, Safari 10.1+)
   * - Falls back to false if unavailable
   *
   * @returns True if user prefers reduced motion, false otherwise
   *
   * @example
   * ```typescript
   * const reduceMotion = configurator['prefersReducedMotion']();
   * // Returns true for users with motion sickness risk
   * ```
   */
  private prefersReducedMotion(): boolean {
    try {
      const cacheKey = 'prefers-reduced-motion';

      // Check cache first
      if (this.mediaQueryCache.has(cacheKey)) {
        return this.mediaQueryCache.get(cacheKey) ?? false;
      }

      // Run media query if not in browser environment
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const matches = mediaQuery.matches;

        // Store in cache
        this.mediaQueryCache.set(cacheKey, matches);

        return matches;
      }
    } catch (error) {
      logger.warn('ScrollBehaviorConfigurator: matchMedia failed, using default', { error });
    }

    return false;
  }

  /**
   * Update configuration options
   *
   * Partially updates scroll behavior settings.
   *
   * **Behavior**:
   * - Only updates specified options
   * - Undefined options are skipped
   * - Converts values to accessors
   *
   * **Use Cases**:
   * - Dynamic configuration: Update at runtime
   * - Accessibility: Change behavior based on settings
   * - Testing: Override specific values
   *
   * @param options - Partial configuration to update
   *
   * @example
   * ```typescript
   * config.update({
   *   behavior: 'auto',
   *   alignToCenter: true,
   * });
   * ```
   */
  update(options: Partial<ScrollBehaviorConfig>): void {
    if (options.enabled !== undefined) {
      this.config.enabled = toAccessor(options.enabled());
    }
    if (options.behavior !== undefined) {
      this.config.behavior = toAccessor(options.behavior());
    }
    if (options.block !== undefined) {
      this.config.block = toAccessor(options.block());
    }
    if (options.offset !== undefined) {
      this.config.offset = toAccessor(options.offset());
    }
    if (options.alignToCenter !== undefined) {
      this.config.alignToCenter = toAccessor(options.alignToCenter());
    }
    if (options.respectReducedMotion !== undefined) {
      this.config.respectReducedMotion = toAccessor(options.respectReducedMotion());
    }

    logger.debug('ScrollBehaviorConfigurator: options updated');
  }

  /**
   * Clear media query cache
   *
   * Invalidates cached prefers-reduced-motion result.
   *
   * **Use Cases**:
   * - Testing: Reset cached values
   * - Runtime: Force re-check if user preferences changed
   * - Memory: Cleanup on component unmount (optional)
   *
   * **Note**:
   * - Cache is small (typically 1 entry)
   * - Usually not necessary to call
   * - Safe to call multiple times (idempotent)
   */
  clearCache(): void {
    this.mediaQueryCache.clear();
    logger.debug('ScrollBehaviorConfigurator: media query cache cleared');
  }
}

/**
 * Factory function for ScrollBehaviorConfigurator
 *
 * Creates a new instance with optional configuration.
 *
 * **Purpose**:
 * - Dependency injection pattern for testing
 * - Default options for common cases
 * - Type-safe instance creation
 *
 * @param options - Optional scroll configuration
 * @returns New ScrollBehaviorConfigurator instance
 *
 * @example
 * ```typescript
 * const configurator = createScrollBehaviorConfigurator({
 *   behavior: 'smooth',
 *   respectReducedMotion: true,
 * });
 * ```
 */
export function createScrollBehaviorConfigurator(options?: {
  enabled?: boolean | Accessor<boolean>;
  behavior?: ScrollBehavior | Accessor<ScrollBehavior>;
  block?: ScrollLogicalPosition | Accessor<ScrollLogicalPosition>;
  offset?: number | Accessor<number>;
  alignToCenter?: boolean | Accessor<boolean>;
  respectReducedMotion?: boolean | Accessor<boolean>;
}): ScrollBehaviorConfigurator {
  return new ScrollBehaviorConfigurator(options);
}
