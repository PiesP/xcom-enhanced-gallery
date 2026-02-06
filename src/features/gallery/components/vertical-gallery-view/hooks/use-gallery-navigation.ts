/**
 * @fileoverview Gallery navigation hook for event handling and scroll coordination
 *
 * Manages navigation trigger tracking and programmatic scrolling based on navigation events.
 * Coordinates scroll position with central navigation system.
 */

import {
  type GalleryNavigateCompletePayload,
  type GalleryNavigateStartPayload,
  galleryIndexEvents,
} from '@shared/state/signals/gallery.signals';
import type { NavigationTrigger } from '@shared/state/signals/navigation.state';
import type { Accessor } from 'solid-js';
import { createEffect, createSignal, on, onCleanup } from 'solid-js';

/**
 * Cleanup Function Type
 *
 * Represents a function that tears down resources (subscriptions, listeners, etc.).
 *
 * **Purpose**
 *   - Unsubscribe from event listeners
 *   - Release allocated resources
 *   - Prevent memory leaks
 *   - Called by onCleanup() or explicit invoke
 *
 * **Usage Pattern**
 * const cleanup = registerNavigationEvents(...);
 * onCleanup(cleanup);  // Auto cleanup on unmount
 *
 * @type VoidFunction
 * @see registerNavigationEvents - Returns Cleanup function
 */
type Cleanup = VoidFunction;

/**
 * Configuration Options for useGalleryNavigation Hook
 *
 * **Purpose**
 * Provides hook with necessary context to coordinate navigation:
 *   - Visibility signal to control event listener lifecycle
 *   - Scroll callback to synchronize UI with navigation state
 *
 * **Properties**
 *
 * @property isVisible - Accessor returning true if gallery is visible
 *   - Type: `() => boolean` (Solid.js signal getter)
 *   - Purpose: Conditional event subscription
 *   - When true: Event listeners registered
 *   - When false: Event listeners unregistered, cleanup runs
 *   - Usage: Used in createEffect dependency array via on(isVisible, ...)
 *   - Importance: Critical for preventing listener leaks
 *
 * **Example**:
 * ```ts
 * // Gallery open/close state
 * const [isOpen, setIsOpen] = createSignal(false);
 *
 * useGalleryNavigation({
 * isVisible: () => isOpen(),  // Track open/close
 * scrollToItem: ...,
 * });
 * ```
 *
 * @property scrollToItem - Callback to scroll gallery to specific index
 *   - Type: `(index: number) => void`
 *   - Purpose: Synchronize UI scroll position with navigation
 *   - When called: After navigate:complete event
 *   - Triggers: Only for non-scroll triggers (not for 'scroll' trigger)
 *   - Consumer responsibility: Implementation depends on UI library
 *   - Importance: Essential for keyboard/click navigation UX
 *
 * **Example**:
 * ```ts
 * // Virtual list scroll implementation
 * const scrollToItem = (index: number) => {
 * const virtualList = containerRef();
 * if (virtualList) {
 *   virtualList.scrollToIndex(index, { align: 'center' });
 * }
 * };
 *
 * useGalleryNavigation({
 * isVisible: ...,
 * scrollToItem,  // Pass implementation
 * });
 * ```
 *
 * **Null Handling**
 *   - isVisible never returns null (always boolean)
 *   - scrollToItem may be no-op if container not ready
 *   - Hook doesn't validate or null-check (consumer responsibility)
 *
 * **Full Configuration Example**:
 * ```ts
 * interface GalleryState {
 * isOpen: boolean;
 * containerRef: HTMLDivElement | null;
 * }
 *
 * const [state, setState] = createSignal<GalleryState>({
 * isOpen: false,
 * containerRef: null,
 * });
 *
 * useGalleryNavigation({
 * isVisible: () => state().isOpen,
 * scrollToItem: (index) => {
 * const container = state().containerRef;
 * if (container?.scrollToIndex) {
 *   container.scrollToIndex(index);
 * }
 * },
 * });
 * ```
 */
interface UseGalleryNavigationOptions {
  /** Accessor indicating if gallery is currently visible */
  readonly isVisible: () => boolean;

  /** Callback to scroll gallery container to specific item */
  readonly scrollToItem: (index: number) => void;
}

/**
 * Return Value of useGalleryNavigation Hook
 *
 * **Purpose**
 * Provides access to navigation state and control functions.
 * Allows consumers to track navigation source and timing.
 *
 * **Pattern**: Dual accessor + setter pattern (Solid.js signals)
 * Each signal has getter (Accessor) and setter
 * Setters allow external control (e.g., direct index navigation)
 *
 * **Properties**
 *
 * @property lastNavigationTrigger - Accessor to last navigation trigger type
 *   - Type: `Accessor<NavigationTrigger | null>`
 *   - InitialValue: null (no navigation yet)
 *   - Updated: On both navigate:start AND navigate:complete events
 *   - Values: 'keyboard' | 'click' | 'scroll' | 'external' | null
 *   - Reactivity: Fine-grained (memo can track changes)
 *   - Usage: Analytics, UX feedback, conditional logic
 *
 * **Example: Analytics tracking**:
 * ```ts
 * createEffect(() => {
 * const trigger = navigation.lastNavigationTrigger();
 * if (trigger) {
 *   analytics.trackNavigation(trigger);
 * }
 * });
 * ```
 *
 * **Example: Keyboard vs scroll styling**:
 * ```ts
 * const className = createMemo(
 * () =>
 *   navigation.lastNavigationTrigger() === 'keyboard'
 *     ? styles.keyboardNav
 *     : styles.mouseNav
 * );
 * ```
 *
 * @property setLastNavigationTrigger - Setter for navigation trigger
 *   - Type: `(trigger: NavigationTrigger | null) => void`
 *   - Purpose: Update trigger state from event handlers or externally
 *   - Called by: navigate:start, navigate:complete event handlers
 *   - External usage: Reset trigger (setLastNavigationTrigger(null))
 *   - Reactivity: Updates signal, triggers dependents
 *
 * @property programmaticScrollTimestamp - Accessor to last programmatic scroll timestamp
 *   - Type: `Accessor<number>` (milliseconds from performance.now())
 *   - InitialValue: 0 (no scroll yet)
 *   - Purpose: Track timing of programmatic scrolls
 *   - Usage: Detect if scroll was user-initiated or programmatic
 *   - Importance: Prevents re-scrolling on scroll events within timing window
 *
 * **Example: Scroll event debounce**:
 * ```ts
 * const handleScrollEvent = (event: ScrollEvent) => {
 * const lastProgrammaticTime = navigation.programmaticScrollTimestamp();
 * const timeSinceLastProgrammatic = performance.now() - lastProgrammaticTime;
 *
 * // Ignore scroll within 300ms of programmatic scroll
 * if (timeSinceLastProgrammatic < 300) {
 *   return;  // Skip processing (was our scroll)
 * }
 *
 * // Process user scroll
 * handleUserScroll(event);
 * };
 * ```
 *
 * @property setProgrammaticScrollTimestamp - Setter for scroll timestamp
 *   - Type: `(timestamp: number) => void`
 *   - Purpose: Record when programmatic scroll was triggered
 *   - Called by: External navigation functions
 *   - Parameter: performance.now() timestamp
 *   - Typical usage: Called before triggering navigation
 *
 * **Example: Programmatic navigation**:
 * ```ts
 * const goToIndex = (index: number) => {
 * navigation.setProgrammaticScrollTimestamp(performance.now());
 * triggerNavigation(index);
 * };
 * ```
 *
 * **Return Value Pattern**
 * Hook returns 4 items:
 *   - 2 accessors (read-only, reactive)
 *   - 2 setters (write, update signal)
 *   - Allows external control while maintaining reactivity
 *   - Consumer can read state + update when needed
 *
 * **Type Safety**
 *   - All types explicit and readonly
 *   - lastNavigationTrigger can be null (before first nav)
 *   - programmaticScrollTimestamp is number (0 = no scroll)
 *   - Setters have exact types (no inference)
 *
 * **Memory Characteristics**
 *   - Return object is stable (same reference across renders)
 *   - Signals created once in hook (no re-creation)
 *   - No closures over component state (no memory leaks)
 */
interface UseGalleryNavigationResult {
  /**
   * Accessor: Last navigation trigger type
   *
   * Reactive accessor returning the most recent navigation trigger.
   * Updated on both navigate:start and navigate:complete events.
   *
   * **Value Types**:
   * - 'keyboard': ArrowUp, ArrowDown, Home, End keys
   * - 'click': Direct item click in gallery
   * - 'scroll': Mouse wheel or scrollbar scroll
   * - 'external': Programmatic/API navigation
   * - null: No navigation has occurred yet
   *
   * **Usage Examples**:
   * ```ts
   * createEffect(() => {
   *   const trigger = lastNavigationTrigger();
   *   if (trigger) {
   *     logger.info('Navigation trigger', { trigger });
   *   }
   * });
   *
   * \<Show when={lastNavigationTrigger() === 'keyboard'}\>
   *   \<KeyboardIndicator /\>
   * \</Show\>
   * ```
   */
  readonly lastNavigationTrigger: Accessor<NavigationTrigger | null>;

  /**
   * Setter: Update last navigation trigger
   *
   * Sets the lastNavigationTrigger signal to provided value.
   * Triggers reactivity in all dependents.
   *
   * **Called by**:
   * - navigate:start event handler
   * - navigate:complete event handler
   * - External code (reset, override)
   *
   * **Usage Examples**:
   * ```ts
   * // Reset navigation trigger
   * setLastNavigationTrigger(null);
   *
   * // Update from event
   * const handler = (payload) => {
   *   setLastNavigationTrigger(payload.trigger);
   * };
   * ```
   */
  readonly setLastNavigationTrigger: (trigger: NavigationTrigger | null) => void;

  /**
   * Accessor: Last programmatic scroll timestamp
   *
   * Returns milliseconds (from performance.now()) of last programmatic scroll.
   * Initial value is 0 (no scroll recorded).
   *
   * **Purpose**: Distinguish user-initiated scroll from programmatic scroll
   * **Units**: Milliseconds (DOMHighResTimeStamp from performance.now())
   * **Precision**: Sub-millisecond (FloatingPoint)
   * **Range**: 0 (never) to current time
   *
   * **Usage Pattern**:
   * ```ts
   * const lastTime = programmaticScrollTimestamp();
   * const elapsed = performance.now() - lastTime;
   * const isRecent = elapsed < 300;  // Within 300ms
   *
   * if (isRecent) {
   *   // Skip (was our programmatic scroll)
   * } else {
   *   // Process user scroll
   * }
   * ```
   *
   * **Timing Window Examples**:
   * - 0ms: Exact moment of programmatic scroll
   * - 50ms: Still buffering animations/renders
   * - 300ms: Safe window to ignore echo scroll events
   * - 1000ms+: Likely new user action
   */
  readonly programmaticScrollTimestamp: Accessor<number>;

  /**
   * Setter: Update programmatic scroll timestamp
   *
   * Records the current time as latest programmatic scroll.
   * Call before triggering navigation to mark scroll as programmatic.
   *
   * **Parameter**: number (milliseconds from performance.now())
   * **Typical usage**: setProgrammaticScrollTimestamp(performance.now())
   *
   * **When to call**:
   * - Before triggering keyboard navigation
   * - Before triggering API navigation
   * - After programmatic index change
   *
   * **When NOT to call**:
   * - User wheel scroll (let natural scroll happen)
   * - User scrollbar interaction
   * - User keyboard (unless keyboard nav)
   *
   * **Example: Programmatic navigation**:
   * ```ts
   * const navigateToIndex = (index: number) => {
   *   // Record timestamp FIRST
   *   setProgrammaticScrollTimestamp(performance.now());
   *
   *   // Then trigger navigation
   *   triggerNavigation(index);
   * };
   *
   * // In scroll event handler
   * const handleUserScroll = (event: ScrollEvent) => {
   *   const lastTime = programmaticScrollTimestamp();
   *   const elapsed = performance.now() - lastTime;
   *
   *   if (elapsed < 300) {
   *     return;  // Skip (was programmatic)
   *   }
   *
   *   // Process as user scroll
   *   updateGalleryIndex(event.scrollPosition);
   * };
   * ```
   */
  readonly setProgrammaticScrollTimestamp: (timestamp: number) => void;
}

/**
 * Hook: Gallery Navigation Event Management
 *
 * **Primary Responsibilities**
 * 1. Track navigation trigger source (keyboard, click, scroll, external)
 * 2. Listen to navigation completion events from central system
 * 3. Coordinate programmatic scrolling for non-scroll triggers
 * 4. Manage event subscription lifecycle based on gallery visibility
 *
 * **Lifecycle**
 *
 * **1. Initialization (Mount)**
 *   - Signals created: lastNavigationTrigger (null), programmaticScrollTimestamp (0)
 *   - Effect setup: on(isVisible, ...) dependency
 *   - Subscriptions not yet registered (waiting for isVisible true)
 *
 * **2. Visibility = true (Gallery Opens)**
 *   - Effect callback fires
 *   - registerNavigationEvents called with event handlers
 *   - Event listeners attached to galleryIndexEvents
 *   - Ready to receive navigate:start and navigate:complete
 *
 * **3. Navigation Event: navigate:start**
 *   - Fires before index change
 *   - Payload includes: trigger type, next index
 *   - Hook action: setLastNavigationTrigger(trigger)
 *   - Signal updates, reactive dependents notified
 *
 * **4. Navigation Event: navigate:complete**
 *   - Fires after index change
 *   - Payload includes: final index, trigger type
 *   - Hook actions:
 *   - setLastNavigationTrigger(trigger)
 *   - IF trigger !== 'scroll': scrollToItem(index)
 *   - Scroll call allows UI to catch up with state
 *
 * **5. Visibility = false (Gallery Closes)**
 *   - Effect re-runs (isVisible changed)
 *   - Previous effect cleanup runs first
 *   - onCleanup() called with dispose function
 *   - Event listeners unsubscribed
 *   - No more events processed until visibility true again
 *
 * **6. Unmount (Component Destroyed)**
 *   - Effect cleanup runs (visibility change or unmount)
 *   - onCleanup() called
 *   - All subscriptions disposed
 *   - Signals garbage collected
 *
 * **Event Flow Diagram**
 *
 * User Action (keyboard/click/scroll)
 *   ↓
 * galleryIndexEvents emit navigate:start
 *   ↓
 * Hook receives: setLastNavigationTrigger(trigger)
 *   ↓
 * Solid.js reactivity: dependents notified
 *   ↓
 * Gallery system updates index
 *   ↓
 * galleryIndexEvents emit navigate:complete
 *   ↓
 * Hook receives: setLastNavigationTrigger(trigger)
 *   ↓
 * Hook decision:
 *   ├─ if (trigger === 'scroll') → skip scroll
 *   └─ else → scrollToItem(index)
 *   ↓
 * UI scroll position synchronized with index
 *
 * **Trigger Handling Logic**
 *
 * **'keyboard' trigger**:
 *   - Source: Arrow keys, Home, End
 *   - Hook action: scrollToItem(index)
 *   - Reason: Keyboard nav doesn't auto-scroll, need manual sync
 *   - Timing: Immediate (no delay)
 *
 * **'click' trigger**:
 *   - Source: Direct item click
 *   - Hook action: scrollToItem(index)
 *   - Reason: Click may be off-screen, need to scroll into view
 *   - Timing: Immediate
 *
 * **'scroll' trigger**:
 *   - Source: User wheel/scrollbar
 *   - Hook action: SKIP scrollToItem (no-op)
 *   - Reason: User already scrolling, don't interfere
 *   - Consequence: No double-scroll artifacts
 *
 * **'external' trigger**:
 *   - Source: Programmatic/API navigation
 *   - Hook action: scrollToItem(index)
 *   - Reason: External nav doesn't sync UI, need manual catch-up
 *   - Timing: After external nav completes
 *
 * **Scroll Trigger Special Case**
 *
 * Why skip scroll triggers?
 *   - User is actively scrolling with mouse wheel
 *   - Gallery system detects scroll → updates index
 *   - Hook receives navigate:complete with trigger='scroll'
 *   - If hook called scrollToItem → double scroll (user's scroll + hook's scroll)
 *   - Result: Jittery UX, scroll fight, poor performance
 *
 * Solution: Simple check
 * ```ts
 * if (trigger === 'scroll') {
 * return;  // Skip, user is already scrolling
 * }
 * scrollToItem(index);  // Only for keyboard/click/external
 * ```
 *
 * **Visibility-Based Subscription**
 *
 * Why conditional on isVisible?
 *   - User navigates other UI (tabs, panels)
 *   - Gallery not visible (hidden tab)
 *   - No need for gallery navigation listeners
 *   - Prevents unnecessary event processing
 *   - Reduces memory footprint
 *   - Enables clean teardown on tab switch
 *
 * Implementation:
 * ```ts
 * createEffect(on(isVisible, (visible) => {
 * if (!visible) {
 * return;  // Early exit, cleanup runs
 * }
 *
 * const dispose = registerNavigationEvents(...);
 * onCleanup(dispose);
 * }));
 * ```
 *
 * **Return Value Strategy**
 *
 * Returns 4 items:
 *   - 2 accessors (for reading state)
 *   - 2 setters (for updating state)
 *   - Separation allows:
 *   - Consumers to observe trigger changes
 *   - External code to record programmatic scrolls
 *   - Hook to update both internally
 *   - Fine-grained reactivity
 *
 * **Error Handling**
 *   - No error handling in hook (consumer responsibility)
 *   - scrollToItem exceptions not caught
 *   - Navigation events assumed valid
 *   - Index bounds checking done by consumer
 *
 * **Performance Characteristics**
 *   - Hook creation: O(1)
 *   - Signal updates: O(1)
 *   - Event subscription: O(1)
 *   - Scroll call: O(n) where n = item count (consumer's impl)
 *   - Memory: 2 signals + 1 effect + closures
 *
 * **Dependency Analysis**
 *   - Effect dependency: isVisible (explicit via on)
 *   - Signal dependencies: none (signals don't depend on each other)
 *   - External: galleryIndexEvents (global, not dependency)
 *   - Options: captured in closure, no signal dependencies
 *
 * **Usage Patterns**
 *
 * **Pattern 1: Basic gallery**
 * ```ts
 * const [isOpen, setIsOpen] = createSignal(false);
 * const navigation = useGalleryNavigation({
 * isVisible: () => isOpen(),
 * scrollToItem: (index) => {
 *   containerRef()?.scrollToIndex(index);
 * },
 * });
 * ```
 *
 * **Pattern 2: With navigation tracking**
 * ```ts
 * const navigation = useGalleryNavigation({
 * isVisible: () => isGalleryOpen(),
 * scrollToItem: (index) => { ... },
 * });
 *
 * const showKeyboardHint = createMemo(
 * () => navigation.lastNavigationTrigger() === 'keyboard'
 * );
 * ```
 *
 * **Pattern 3: External navigation**
 * ```ts
 * const navigation = useGalleryNavigation({
 * isVisible: () => isGalleryOpen(),
 * scrollToItem: (index) => { ... },
 * });
 *
 * const goToIndex = (index: number) => {
 * navigation.setProgrammaticScrollTimestamp(performance.now());
 * triggerNavigation(index);
 * };
 * ```
 *
 * @param options - Configuration with isVisible and scrollToItem
 * @returns Object with navigation state accessors and setters
 *
 * @throws Nothing - Consumer handles scrollToItem errors
 *
 * @remarks
 * This hook is minimal and focused:
 *   - Doesn't manage gallery index (central system does)
 *   - Doesn't control navigation (just responds)
 *   - Doesn't validate index bounds
 *   - Doesn't implement scroll behavior
 *   - Separation of concerns: hooks one aspect only
 */
export function useGalleryNavigation(
  options: UseGalleryNavigationOptions
): UseGalleryNavigationResult {
  const { isVisible, scrollToItem } = options;

  const [lastNavigationTrigger, setLastNavigationTrigger] = createSignal<NavigationTrigger | null>(
    null
  );
  const [programmaticScrollTimestamp, setProgrammaticScrollTimestamp] = createSignal(0);

  // Listen for navigation events only while gallery is visible
  /**
   * Effect: Conditional Navigation Event Subscription
   *
   * **Purpose**
   * Register/unregister event listeners based on gallery visibility.
   * Only subscribe to events when gallery is open.
   *
   * **Dependency Tracking**
   * - Dependency: isVisible() accessor
   * - Wrapped in on(isVisible, ...) for explicit tracking
   * - Effect re-runs when isVisible value changes
   * - Previous effect cleanup runs before new subscription
   *
   * **Visibility Transitions**
   *
   * **False → True (Gallery Opens)**:
   * 1. Effect callback fires
   * 2. visible parameter = true
   * 3. registerNavigationEvents called
   * 4. Event subscriptions attached
   * 5. `onCleanup(() => dispose)` registered
   * 6. Ready for navigation events
   *
   * **True → False (Gallery Closes)**:
   * 1. Visibility changes to false
   * 2. Effect re-runs first
   * 3. Previous onCleanup() executes: dispose()
   * 4. Event listeners unsubscribed
   * 5. cleanup returns from registerNavigationEvents
   * 6. Effect callback early returns (visible === false)
   *
   * **Early Return Pattern**
   *
   * ```ts
   * if (!visible) {
   *   return;  // No subscription needed
   * }
   * // Subscription setup continues only if visible
   * ```
   *
   * When visible is false:
   * - Effect callback runs (triggered by visibility change)
   * - Condition fails immediately
   * - Early return (no listener registration)
   * - Previous onCleanup() already ran (disposed listeners)
   * - Effect completes
   *
   * **Event Handler Setup**
   *
   * registerNavigationEvents callback receives:
   * - onTriggerChange: Called on navigate:start AND navigate:complete
   *   - Parameter: trigger type ('keyboard', 'click', 'scroll', 'external')
   *   - Action: setLastNavigationTrigger(trigger)
   *
   * - onNavigateComplete: Called on navigate:complete only
   *   - Parameter: payload `{ index, trigger }`
   *   - Conditional scroll:
   *     - If trigger === 'scroll': skip (user already scrolling)
   *     - Else: scrollToItem(index) (sync UI position)
   *
   * **Cleanup Chain**
   *
   * dispose() → unsubscribe from events:
   * 1. stopStart() - unsubscribe from navigate:start
   * 2. stopComplete() - unsubscribe from navigate:complete
   * 3. Listeners removed, no more events processed
   *
   * onCleanup(dispose):
   * - Solid.js registers cleanup
   * - Runs when effect re-runs or component unmounts
   * - Automatic timing (no manual management)
   *
   * **Performance**
   * - Effect re-runs: O(1) (only on visibility toggle)
   * - Subscription setup: O(1)
   * - Event listener removal: O(1)
   * - Listener count: 2 (navigate:start + navigate:complete)
   *
   * **Memory Management**
   * - Listeners persist while visible = true
   * - Listeners removed when visible = false or unmount
   * - No listener leaks (guaranteed cleanup)
   * - Closures: onTriggerChange, onNavigateComplete (necessary)
   *
   * **Timing Diagram**
   *
   * Gallery open sequence:
   * Time 0: Gallery component mount
   * Time 5: setIsGalleryOpen(true)
   * Time 10: Effect runs (visible = true)
   * Time 12: registerNavigationEvents() called
   * Time 15: Event listeners attached
   * Time 20: User presses arrow key
   * Time 21: navigate:start event → onTriggerChange called
   * Time 22: Index updated in store
   * Time 25: navigate:complete event → both handlers called
   *
   * Gallery close sequence:
   * Time 100: setIsGalleryOpen(false)
   * Time 105: Effect runs (visible = false)
   * Time 106: Previous onCleanup() executes: dispose()
   * Time 108: stopStart(), stopComplete() called
   * Time 110: Listeners removed
   * Time 111: Effect returns
   * Time 120: User presses arrow (no effect - not listening)
   *
   * **Comparison: With vs Without Visibility Check**
   *
   * ❌ BAD: Always listening
   * ```ts
   * createEffect(() => {
   *   const dispose = registerNavigationEvents(...);
   *   onCleanup(dispose);
   * });
   * // Listeners active even when gallery hidden
   * // Wasted CPU processing hidden gallery nav
   * ```
   *
   * ✅ GOOD: Conditional on visibility
   * ```ts
   * createEffect(on(isVisible, (visible) => {
   *   if (!visible) return;
   *   const dispose = registerNavigationEvents(...);
   *   onCleanup(dispose);
   * }));
   * // Listeners only when gallery visible
   * // Cleaned up automatically on hide
   * ```
   */
  createEffect(
    on(isVisible, (visible) => {
      if (!visible) {
        return;
      }

      const dispose = registerNavigationEvents({
        onTriggerChange: setLastNavigationTrigger,
        onNavigateComplete: ({ index, trigger }) => {
          if (trigger === 'scroll') {
            return;
          }

          scrollToItem(index);
        },
      });

      onCleanup(dispose);
    })
  );

  return {
    lastNavigationTrigger,
    setLastNavigationTrigger,
    programmaticScrollTimestamp,
    setProgrammaticScrollTimestamp,
  };
}

/**
 * Configuration for Navigation Event Registration
 *
 * **Purpose**
 * Provides callbacks for two navigation event stages:
 * 1. navigate:start - Early notification (trigger only)
 * 2. navigate:complete - Final state (index + trigger)
 *
 * **Design**: Callback pattern for event handling
 *   - Decouples event source from hook implementation
 *   - Allows injection of custom handlers
 *   - Testable (can mock callbacks)
 *
 * **Properties**
 *
 * @property onTriggerChange - Callback for trigger updates
 *   - Called on: navigate:start AND navigate:complete
 *   - Parameter: NavigationTrigger type
 *   - Purpose: Track what caused navigation
 *   - Frequency: 2x per navigation (start + complete)
 *   - Error handling: Errors in callback will crash effect
 *
 * **Trigger Types**:
 *   - 'keyboard': ArrowUp, ArrowDown, Home, End
 *   - 'click': Item clicked
 *   - 'scroll': Wheel or scrollbar
 *   - 'external': API/programmatic
 *
 * **Event Timeline**:
 * Time 0: User presses arrow key
 * Time 5: navigate:start event
 * Time 6: onTriggerChange('keyboard') called
 * Time 10: Index updated
 * Time 15: navigate:complete event
 * Time 16: onTriggerChange('keyboard') called again
 *
 * **Why Called Twice?**
 *   - Start: Notify early (for analytics, UI feedback)
 *   - Complete: Update with certainty (navigation done)
 *   - Both use same value (trigger doesn't change mid-nav)
 *   - Allows dual-phase processing
 *
 * **Implementation Example**:
 * ```ts
 * onTriggerChange: (trigger) => {
 * setLastNavigationTrigger(trigger);
 * analytics.trackTrigger(trigger);  // Can do both
 * }
 * ```
 *
 * @property onNavigateComplete - Callback for completion events
 *   - Called on: navigate:complete only (not start)
 *   - Parameter: `{ index: number, trigger: NavigationTrigger }`
 *   - Purpose: Handle final index with knowledge of how it changed
 *   - Frequency: 1x per navigation (complete only)
 *   - Error handling: Errors in callback will crash effect
 *
 * **Payload Properties**:
 *   - index: Final gallery index (0-based)
 *   - trigger: Type of navigation trigger
 *
 * **Typical Implementation**:
 * ```ts
 * onNavigateComplete: ({ index, trigger }) => {
 * // Update UI if needed
 * if (trigger !== 'scroll') {
 *   containerRef()?.scrollToIndex(index);
 * }
 *
 * // Log or analyze
 * analytics.trackCompletion({
 *   index,
 *   trigger,
 *   timestamp: Date.now(),
 * });
 * }
 * ```
 *
 * **Why Separate from onTriggerChange?**
 *   - Start event doesn't have index (not calculated yet)
 *   - Complete event has final index
 *   - Allows different handling for different stages
 *   - Complete can do index-dependent actions (like scroll)
 *
 * **Callback Contract**
 *   - Both must be synchronous (not async)
 *   - Both must not throw errors (or handle internally)
 *   - Both should complete quickly (event handlers)
 *   - Both have access to closure scope
 *
 * **Return Type**
 *   - No return value expected
 *   - Both are void functions (side-effect only)
 */
interface RegisterNavigationEventsOptions {
  readonly onTriggerChange: (trigger: NavigationTrigger) => void;
  readonly onNavigateComplete: (payload: GalleryNavigateCompletePayload) => void;
}

/**
 * Helper Function: Register Navigation Event Listeners
 *
 * **Purpose**
 * Subscribes to gallery navigation events and delegates to callbacks.
 * Returns cleanup function to unsubscribe.
 *
 * **Responsibilities**
 * 1. Subscribe to galleryIndexEvents.on('navigate:start', ...)
 * 2. Subscribe to galleryIndexEvents.on('navigate:complete', ...)
 * 3. Invoke appropriate callbacks on each event
 * 4. Return cleanup function to unsubscribe both
 *
 * **Not Responsible For**
 *   - Managing gallery index (central system does)
 *   - Scrolling (that's in onNavigateComplete callback)
 *   - Timing/debouncing (passed through as-is)
 *   - Error handling (caller's responsibility)
 *
 * **Event Subscription Pattern**
 *
 * galleryIndexEvents.on() returns:
 *   - Type: `() => void` (unsubscribe function)
 *   - Store in variable: stopStart, stopComplete
 *   - Call to remove listener: stopStart()
 *
 * Example from galleryIndexEvents source:
 * ```ts
 * const events = {
 * on(event, callback) {
 * listeners[event].push(callback);
 * return () => {
 *   listeners[event] = listeners[event].filter(cb => cb !== callback);
 * };
 * }
 * };
 * ```
 *
 * **Handler Flow**
 *
 * **navigate:start handler**:
 * ```ts
 * (payload: GalleryNavigateStartPayload) => onTriggerChange(payload.trigger)
 * ```
 *   - Input: Full navigate:start payload
 *   - Extract: payload.trigger
 *   - Call: onTriggerChange(trigger)
 *   - Effect: Updates lastNavigationTrigger signal
 *
 * **navigate:complete handler**:
 * ```ts
 * (payload: GalleryNavigateCompletePayload) => {
 * onTriggerChange(payload.trigger);
 * onNavigateComplete(payload);
 * }
 * ```
 *   - Input: Full navigate:complete payload
 *   - Step 1: onTriggerChange(payload.trigger) - update signal
 *   - Step 2: onNavigateComplete(payload) - handle completion
 *   - In hook: checks trigger, conditionally calls scrollToItem
 *   - Order: Trigger updated first, then navigate complete
 *
 * **Cleanup Function**
 *
 * Returns cleanup that:
 * 1. Calls stopStart() - unsubscribe from navigate:start
 * 2. Calls stopComplete() - unsubscribe from navigate:complete
 * 3. Both subscriptions removed simultaneously
 * 4. Ready for new subscriptions (if re-called)
 *
 * ```ts
 * return () => {
 * stopStart();
 * stopComplete();
 * };
 * ```
 *
 * **Memory Semantics**
 *
 * Closure captures:
 *   - stopStart function reference
 *   - stopComplete function reference
 *   - onTriggerChange callback reference
 *   - onNavigateComplete callback reference
 *
 * These are kept alive as long as:
 *   - Cleanup not called (listeners still active)
 *   - Component not unmounted
 *   - Gallery not hidden
 *
 * Cleanup frees:
 *   - Event listener references
 *   - Callback references (if no other references)
 *   - Subscriptions cleared
 *   - Memory reclaimed
 *
 * **Type Safety**
 *
 *   - Payload types from `@shared/state/signals/gallery.signals`
 *   - NavigationTrigger validated at source
 *   - GalleryNavigateCompletePayload structure defined
 *   - No type casting needed (trust source)
 *
 * **Error Handling**
 *
 * NOT handled in this function:
 *   - onTriggerChange throwing (propagates to effect)
 *   - onNavigateComplete throwing (propagates to effect)
 *   - galleryIndexEvents.on failing (unlikely)
 *
 * Should be handled by caller:
 *   - Wrap callbacks in try-catch if needed
 *   - Handle errors in effect body
 *   - Provide fallback or logging
 *
 * **Performance**
 *   - Registration: O(1) array push in each event listener
 *   - Trigger: O(1) callback invocation
 *   - Cleanup: O(n) array filter where n = listener count (usually 1)
 *   - Overall: Very fast, event-driven
 *
 * **Usage Example**
 *
 * ```ts
 * const cleanup = registerNavigationEvents({
 * onTriggerChange: (trigger) => {
 * setLastNavigationTrigger(trigger);
 * },
 * onNavigateComplete: ({ index, trigger }) => {
 * if (trigger !== 'scroll') {
 *   scrollToItem(index);
 * }
 * },
 * });
 *
 * // Later, cleanup
 * cleanup();  // Unsubscribe from both events
 * ```
 *
 * **Relation to Hook**
 *
 * Called from: useGalleryNavigation effect
 * Called when: Gallery visibility = true
 * Called via: createEffect(on(isVisible, ...))
 * Cleanup: onCleanup(dispose)
 *
 * Hook ensures cleanup runs automatically:
 *   - When isVisible changes to false
 *   - When component unmounts
 *   - Never has dangling listeners
 *
 * @param options - Callbacks for event handling
 * @returns Cleanup function to unsubscribe
 */
function registerNavigationEvents({
  onTriggerChange,
  onNavigateComplete,
}: RegisterNavigationEventsOptions): Cleanup {
  const stopStart = galleryIndexEvents.on(
    'navigate:start',
    (payload: GalleryNavigateStartPayload) => onTriggerChange(payload.trigger)
  );

  const stopComplete = galleryIndexEvents.on(
    'navigate:complete',
    (payload: GalleryNavigateCompletePayload) => {
      onTriggerChange(payload.trigger);
      onNavigateComplete(payload);
    }
  );

  return () => {
    stopStart();
    stopComplete();
  };
}
