/**
 * Manages the IntersectionObserver used for gallery focus tracking.
 */
import type { ItemCache } from '@shared/state/focus';
import { isItemVisibleEnough, calculateTopDistance } from '@shared/state/focus';

/**
 * Focus candidate scoring information
 *
 * Calculated for each visible item to determine optimal focus target.
 * Lower scores indicate better focus candidates (closer to viewport center, more visible).
 *
 * @property index - Item index in gallery (cache key)
 * @property topDistance - Distance from viewport top edge (pixels)
 * @property intersectionRatio - Fraction of item currently visible (0-1)
 * @property time - Timestamp when entry was processed (milliseconds)
 *
 * @see {@link calculateCandidateScore} for score calculation
 * @see Phase 334 for detailed scoring algorithm
 */
interface CandidateScore {
  index: number;
  topDistance: number;
  intersectionRatio: number;
  time: number;
}

/**
 * Calculate focus candidate score from intersection entry
 *
 * Evaluates a single intersection entry and produces a scored candidate
 * for focus prioritization algorithm.
 *
 * **Performance**:
 * - O(1) calculation (only arithmetic operations)
 * - No DOM traversal or expensive operations
 * - Suitable for high-frequency update batches
 *
 * @param entry - IntersectionObserverEntry from observer callback
 * @param minimumVisibleRatio - Minimum visibility threshold (0-1)
 * @param index - Item index for this entry
 * @param time - Current timestamp (for temporal tracking)
 * @returns CandidateScore if visible enough, null otherwise
 *
 * @see {@link isItemVisibleEnough} for visibility check
 * @see {@link calculateTopDistance} for distance calculation
 * @see {@link CandidateScore} for score structure
 * @internal Used by handleEntries to process each intersection entry
 */
function calculateCandidateScore(
  entry: IntersectionObserverEntry,
  minimumVisibleRatio: number,
  index: number,
  time: number
): CandidateScore | null {
  if (!isItemVisibleEnough(entry, minimumVisibleRatio)) {
    return null;
  }

  const topDistance = calculateTopDistance(entry);
  const intersectionRatio = entry.intersectionRatio;

  return {
    index,
    topDistance,
    intersectionRatio,
    time,
  };
}

/**
 * Focus Observer Manager - IntersectionObserver lifecycle and entry processing
 *
 * Manages the creation, configuration, and lifecycle of IntersectionObserver
 * for focus system visibility detection.
 *
 * **Lifecycle Management**:
 * - setupObserver: Initialize observer with container elements
 * - cleanupObserver: Disconnect and cleanup observer
 * - observeItem: Dynamically add item to observation
 * - unobserveItem: Dynamically remove item from observation
 *
 * **Entry Processing**:
 * - Automatic entry batching from observer callback
 * - Cache synchronization with each entry update
 * - Score calculation for focus prioritization
 * - Callback invocation with scored candidates
 *
 * **Integration Points**:
 * - Called by focus hooks to setup initial observation
 * - Provides candidate scores to FocusStateManagerService
 * - Queries ItemCache for element lookup
 * - Logs debug information for troubleshooting
 *
 * **Performance Characteristics**:
 * - One observer per gallery (singleton pattern)
 * - Batched entry processing (all entries in single callback)
 * - O(n) setup where n = visible items (~5-50)
 * - O(1) per entry update
 * - Minimal memory overhead (observer + one timer)
 *
 * @since v1.0.0 - Phase 330 Focus System Implementation
 * @see {@link setupObserver} for initialization
 * @see {@link CandidateScore} for scoring structure
 * @see Phase 334 for focus priority algorithm
 */
interface FocusObserverDebugInfo {
  isActive: boolean;
  lastUpdateTime: number;
}

class FocusObserverManagerImpl {
  private observer: IntersectionObserver | null = null;
  private lastUpdateTime = 0;

  /**
   * Setup IntersectionObserver with visibility detection
   *
   * Initializes a new IntersectionObserver and begins observing all items
   * in the provided container element.
   *
   * **Execution Steps**:
   * 1. Cleanup existing observer (if any)
   * 2. Create new IntersectionObserver with callback
   * 3. Query all items in container (via [data-index] selector)
   * 4. Begin observing each item element
   * 5. Log setup completion with item count
   *
   * @param container - Container element with [data-index] items
   * @param itemCache - Cache for storing intersection entries
   * @param onEntries - Callback when entries processed (receives CandidateScore[])
   * @param threshold - Visibility thresholds (default [0.25, 0.5, 0.75])
   * @param rootMargin - Observation area margin (default "0px")
   *
   * @throws None (errors logged, observer state preserved)
   * @see {@link cleanupObserver} for cleanup
   * @see {@link handleEntries} for entry processing details
   */
  setupObserver(
    container: HTMLElement,
    itemCache: ItemCache,
    onEntries: (candidates: CandidateScore[]) => void,
    threshold: number | number[] = [0.25, 0.5, 0.75],
    rootMargin: string = '0px'
  ): void {
    this.cleanupObserver();

    this.observer = new IntersectionObserver(
      entries => {
        this.handleEntries(entries, itemCache, onEntries);
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    const items = container.querySelectorAll('[data-index]');
    items.forEach(item => {
      if (item instanceof HTMLElement) {
        this.observer?.observe(item);
      }
    });
  }

  /**
   * Process intersection entries and calculate candidate scores
   *
   * Called automatically by observer when visibility changes.
   * Processes each entry to calculate focus priority scores.
   *
   * **Processing Steps** (per entry):
   * 1. Extract element and data-index attribute
   * 2. Parse index as integer
   * 3. Synchronize cache with intersection entry
   * 4. Calculate candidate score (or skip if not visible)
   * 5. Add to candidates array if score valid
   * 6. Invoke callback with all scored candidates
   *
   * @param entries - IntersectionObserverEntry array from observer
   * @param itemCache - Cache for storing visibility information
   * @param onEntries - Callback with processed candidates
   *
   * @see {@link calculateCandidateScore} for scoring algorithm
   * @see {@link ItemCache} for cache interface
   * @internal Called automatically by IntersectionObserver
   */
  private handleEntries(
    entries: IntersectionObserverEntry[],
    itemCache: ItemCache,
    onEntries: (candidates: CandidateScore[]) => void
  ): void {
    const candidates: CandidateScore[] = [];
    this.lastUpdateTime = Date.now();

    entries.forEach(entry => {
      const element = entry.target as HTMLElement;
      const indexStr = element.getAttribute('data-index');
      const index = indexStr ? parseInt(indexStr, 10) : -1;

      if (index < 0) {
        return;
      }

      itemCache.setEntry(element, entry);

      const score = calculateCandidateScore(entry, 0.05, index, Date.now());
      if (score) {
        candidates.push(score);
      }
    });

    onEntries(candidates);
  }

  /**
   * Begin observing new item element
   *
   * Dynamically adds a new element to observation after initial setup.
   * Useful for lazy-loaded or dynamically-added items.
   *
   * @param element - HTMLElement to begin observing
   *
   * @see {@link unobserveItem} for removing observation
   * @see {@link setupObserver} for initial setup
   */
  observeItem(element: HTMLElement): void {
    this.observer?.observe(element);
  }

  /**
   * Stop observing item element
   *
   * Dynamically removes an element from observation.
   * Useful for cleanup or when item is no longer relevant.
   *
   * @param element - HTMLElement to stop observing
   *
   * @see {@link observeItem} for starting observation
   * @see {@link cleanupObserver} for complete cleanup
   */
  unobserveItem(element: HTMLElement): void {
    this.observer?.unobserve(element);
  }

  /**
   * Disconnect and cleanup IntersectionObserver
   *
   * Stops all observations and releases observer resources.
   * Should be called during component unmount or focus system shutdown.
   *
   * **Safety**:
   * - Safe to call multiple times (idempotent)
   * - Safe to call if observer never initialized
   * - Prevents memory leaks
   *
   * @see {@link setupObserver} for initialization
   */
  cleanupObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  getDebugInfo(): FocusObserverDebugInfo {
    return {
      isActive: this.observer !== null,
      lastUpdateTime: this.lastUpdateTime,
    };
  }

  getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }
}

export type FocusObserverManager = FocusObserverManagerImpl;

/**
 * Factory function for FocusObserverManager
 *
 * Creates a new FocusObserverManager instance. Useful for:
 * - Dependency injection
 * - Testing (allows mocking)
 * - Clean service instantiation pattern
 *
 * @returns New FocusObserverManager instance
 *
 */
export function createFocusObserverManager(): FocusObserverManager {
  return new FocusObserverManagerImpl();
}
