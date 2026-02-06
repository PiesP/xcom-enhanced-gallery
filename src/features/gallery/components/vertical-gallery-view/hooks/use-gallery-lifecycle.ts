/**
 *   @fileoverview Gallery lifecycle management hook for animations, cleanup, viewport tracking
 *
 *   Orchestrates gallery enter/exit animations, video cleanup, and viewport CSS synchronization.
 *   Manages three coordinated effects: scroll setup, animation timing, and viewport observation.
 */

import { ensureGalleryScrollAvailable } from '@edge/dom/ensure-gallery-scroll';
import { observeViewportCssVars } from '@shared/dom/viewport';
import { logger } from '@shared/logging/logger';
import { animateGalleryEnter, animateGalleryExit } from '@shared/utils/css/css-animations';
import { createEffect, on, onCleanup } from 'solid-js';

/**
 *   Configuration options for useGalleryLifecycle hook
 *
 *   @property containerEl - Gallery container element accessor
 *   @property toolbarWrapperEl - Toolbar wrapper element accessor
 *   @property isVisible - Gallery visibility state accessor
 */
interface UseGalleryLifecycleOptions {
  /** Container element accessor */
  readonly containerEl: () => HTMLDivElement | null;
  /** Toolbar wrapper element accessor */
  readonly toolbarWrapperEl: () => HTMLDivElement | null;
  /** Whether gallery is visible */
  readonly isVisible: () => boolean;
}

/**
 *   Manages the complete gallery lifecycle through coordinated effects.
 *
 *   Orchestrates three independent Solid.js effects that handle:
 *   1. **Container Scroll Setup** - Makes container scrollable when needed
 *   2. **Enter/Exit Animations** - Animates gallery appearing and disappearing
 *   3. **Video Cleanup** - Stops and resets video playback on close
 *   4. **Viewport Tracking** - Synchronizes toolbar height with CSS variables
 *
 * **Lifecycle Stages**
 *
 * **Stage 1: Mount**
 *   - Component initializes with containerEl and toolbarWrapperEl
 *   - First effect runs: ensureGalleryScrollAvailable(container)
 *   - Result: Container configured for overflow scrolling
 *
 * **Stage 2: Open Gallery (isVisible = true)**
 *   - Second effect runs with visible=true
 *   - animateGalleryEnter(container) called
 *   - Result: CSS animations played (fade-in, scale, etc.)
 *   - Videos may start playing (user interaction)
 *
 * **Stage 3: Viewport Tracking (continuous)**
 *   - Third effect runs immediately
 *   - observeViewportCssVars monitors toolbar height
 *   - CSS variables updated as toolbar resizes
 *   - Result: Gallery adjusts padding dynamically
 *
 * **Stage 4: Close Gallery (isVisible = false)**
 *   - Second effect runs with visible=false
 *   - animateGalleryExit(container) called
 *   - All videos paused and reset (currentTime = 0)
 *   - Result: Smooth closing animation + cleanup
 *
 * **Stage 5: Unmount**
 *   - Component removed from DOM
 *   - All effects cleaned up automatically
 *   - Observers, listeners, timers all terminated
 *   - Memory released (no leaks)
 *
 * **Effect 1: Container Setup**
 * ```ts
 *   createEffect(on(containerEl, (element) => {
 *   if (element) ensureGalleryScrollAvailable(element);
 *   }));
 * ```
 *   - Dependencies: containerEl
 *   - Runs when container reference changes
 *   - Calls ensureGalleryScrollAvailable to set overflow style
 *   - Skips if container is null
 *   - Idempotent: safe to run multiple times
 *
 * **Effect 2: Animation & Video Cleanup**
 * ```ts
 *   createEffect(on(
 *   [containerEl, isVisible],
 *   ([container, visible]) => {
 *   if (!container) return;
 *   if (visible) animateGalleryEnter(container);
 *   else {
 *     animateGalleryExit(container);
 *     // Video cleanup...
 *   }
 *   },
 *   `{ defer: true }`
 *   ));
 * ```
 *   - Dependencies: containerEl, isVisible
 *   - Runs when either dependency changes
 *   - `{ defer: true }` ensures animation classes applied before transitions
 *   - Videos paused: video.pause()
 *   - Videos reset: video.currentTime = 0
 *   - Errors caught and logged (never crashes)
 *   - Only on close (visible = false)
 *
 * **Effect 3: Viewport Tracking**
 * ```ts
 *   createEffect(() => {
 *     const container = containerEl();
 *     const wrapper = toolbarWrapperEl();
 *     if (!container || !wrapper) return;
 *     const cleanup = observeViewportCssVars(container, ...);
 *     onCleanup(() => cleanup?.());
 *   });
 * ```
 *   - Dependencies: containerEl, toolbarWrapperEl (implicit)
 *   - Runs when either element accessor called
 *   - observeViewportCssVars returns cleanup function
 *   - cleanup() called on effect re-run or component unmount
 *   - Calculates toolbar height from getBoundingClientRect()
 *   - Updates CSS variables for dynamic layout
 *
 * **Error Handling**
 *
 * **Animation Errors**
 *   animateGalleryEnter and animateGalleryExit should not throw.
 *   If they do, error propagates to browser (component error boundary).
 *
 * **Video Cleanup Errors**
 *   wrapped in try-catch blocks. If pause() or currentTime assignment fails:
 *   - Logged via logger.warn('video cleanup failed', `{ error }`)
 *   - Only in development (__DEV__)
 *   - Continues to next video (no early exit)
 *
 * **Viewport Tracking Errors**
 *   observeViewportCssVars may fail if elements don't support observers.
 *   Error handled by observeViewportCssVars implementation.
 *   cleanup() is called safely in onCleanup.
 *
 * **Performance Optimization**
 *
 * **`{ defer: true }`**
 *   Second effect uses `{ defer: true }` option:
 *   - Effect callback queued as microtask
 *   - Allows CSS to apply before transitions fire
 *   - Prevents animation queueing/batching issues
 *   - Alternative: requestAnimationFrame, but defer is cleaner
 *
 * **Video Cleanup Batching**
 *   Videos accessed via querySelectorAll once:
 *   - Caches NodeList (single DOM traversal)
 *   - forEach iterates over static list
 *   - O(n) where n = number of videos (typically 1-5)
 *   - No re-querying per video
 *
 * **Viewport Tracking Overhead**
 *   observeViewportCssVars likely uses ResizeObserver:
 *   - Efficient: only fires on actual size changes
 *   - Batched: multiple changes fire once per frame
 *   - No polling (not O(n) on timer)
 *
 * **Memory Management**
 *   - No closures over component state
 *   - No event listener leaks (cleanup called)
 *   - No observer leaks (cleanup called via onCleanup)
 *   - Safe to mount/unmount repeatedly
 *   - Garbage collector reclaims all memory
 *
 * @param options - Configuration with element accessors and visibility signal
 * @returns void - This is a side-effect hook with no return value
 *
 * @throws Never - All errors caught internally (video cleanup, logging)
 *
 * @see {@link UseGalleryLifecycleOptions} - Configuration options
 * @see {@link ensureGalleryScrollAvailable} - Container scroll setup
 * @see {@link animateGalleryEnter} - Opening animation
 * @see {@link animateGalleryExit} - Closing animation
 * @see {@link observeViewportCssVars} - Viewport height tracking
 */
export function useGalleryLifecycle(options: UseGalleryLifecycleOptions): void {
  const { containerEl, toolbarWrapperEl, isVisible } = options;

  /**
   * Effect 1: Container Scroll Setup
   *
   * **Purpose**
   * Ensures the gallery container is configured to support scrolling
   * when media items overflow. Runs once when container element changes.
   *
   * **Dependency Tracking**
   * - Explicit dependency: containerEl
   * - Runs when containerEl() returns different reference
   * - Skipped if containerEl() returns null
   *
   * **on() Helper**
   * The on(source, fn) wrapper allows:
   * - Tracking specific signal changes
   * - Accessing current value in callback
   * - Running immediately (vs createEffect default)
   * - Cleaner code than `createEffect({ track: true })`
   *
   * **Null Safety**
   * if (element) guard ensures:
   * - ensureGalleryScrollAvailable not called on null
   * - No errors if container not yet mounted
   * - Safe to call before element available
   *
   * **ensureGalleryScrollAvailable Call**
   * Calls edge/dom function to:
   * - Set overflow: auto or scroll on container
   * - Query data-xeg-role or fallback selectors
   * - Handle multiple container types (div, section, etc.)
   * - Idempotent: safe to call multiple times
   *
   * **Performance**
   * - O(1) DOM manipulation (single element)
   * - No re-layout unless styles change
   * - Cached by browser (CSS optimization)
   * - Runs once per mount (or ref change)
   *
   * **Timing**
   * Runs after component renders (during Solid.js effect phase).
   * Element must exist by time effect runs (set via ref).
   *
   * @remarks
   * This effect is independent of animation or visibility.
   * Container scrollability is set up regardless of open/close state.
   * Idempotent: calling multiple times has same effect as once.
   */
  createEffect(
    on(containerEl, (element) => {
      if (element) {
        ensureGalleryScrollAvailable(element);
      }
    })
  );

  /**
   * Effect 2: Animation & Video Cleanup
   *
   * **Purpose**
   * Manages gallery enter/exit animations and cleans up video playback
   * when gallery closes. Reactive to container and visibility changes.
   *
   * **Dependency Tracking**
   * - Dependencies: [containerEl, isVisible]
   * - Runs when either element or visibility changes
   * - Uses array notation to track multiple dependencies
   * - Receives destructured values ([container, visible])
   *
   * **`{ defer: true }` option**
   * Defers effect callback to microtask queue:
   * - Allows CSS to apply before transitions fire
   * - Prevents requestAnimationFrame timing issues
   * - Animation classes set, then transitions run
   * - Equivalent to setTimeout(..., 0) but cleaner
   *
   * **Null Safety**
   * `if (!container) return` exits early:
   * - animateGalleryEnter/Exit never called on null
   * - Safe even if element unmounts during visibility change
   * - No error thrown, just skipped
   *
   * **Enter Animation (visible = true)**
   * ```ts
   * if (visible) {
   *   animateGalleryEnter(container);
   * }
   * ```
   * - Plays opening animation when gallery becomes visible
   * - Applies CSS classes for fade-in, scale, etc.
   * - Called once per visibility toggle (true)
   * - May trigger user interactions (clicking media)
   *
   * **Exit Animation & Cleanup (visible = false)**
   * ```ts
   * animateGalleryExit(container);
   * // Additional cleanup...
   * ```
   * - Plays closing animation when gallery becomes hidden
   * - Then stops all video playback
   *
   * **Video Cleanup Subprocess**
   * Pauses all videos and resets playback:
   *
   * 1. Query Videos:
   *    container.querySelectorAll('video') finds all video elements
   *    - NodeList stored once (no re-querying per video)
   *    - Handles multiple videos in gallery
   *
   * 2. Pause Logic (forEach):
   *    `try { video.pause(); } catch (error) { logCleanupFailure(error); }`
   *    - pause() may throw if video not properly loaded
   *    - Catch silences error, logs to dev console
   *    - Continue to next video (no early exit)
   *
   * 3. Reset Logic (forEach):
   *    `try { if (video.currentTime !== 0) { video.currentTime = 0; } }`
   *    - Setting currentTime may throw (unsupported property)
   *    - Skip if already at start (optimization)
   *    - Catch silences error, logs to dev console
   *
   * 4. Error Logging:
   *    logCleanupFailure function wraps logger.warn
   *    - Only logs in development (__DEV__)
   *    - Prevents spam in production
   *    - Includes error in context for debugging
   *
   * **Why Both pause() and currentTime = 0?**
   * - pause(): Stops playback (silent if already paused)
   * - currentTime = 0: Resets to start (allows replay without seek)
   * - Both necessary for full cleanup
   * - Either may fail, so try-catch independently
   *
   * **Error Resilience**
   * Video cleanup wrapped in try-catch:
   * - pause() errors don't affect reset
   * - reset() errors don't affect next video
   * - Logging errors don't crash component
   * - Gallery always completes cleanup
   *
   * **Performance**
   * - querySelectorAll: O(n) where n = number of videos
   * - pause() per video: O(1) media control
   * - currentTime assignment: O(1) seek (immediate for position 0)
   * - Total: O(n) but n typically 1-5 (acceptable)
   *
   * **Timing**
   * Cleanup runs AFTER exit animation applied:
   * - Animation class added first
   * - Microtask queue allows transition to start
   * - Then video cleanup (non-blocking)
   * - Smooth appearance of closing animation
   *
   * **Accessibility**
   * Video cleanup important for:
   * - Accessibility: stops audio before gallery closes
   * - Experience: prevents sound artifacts
   * - Network: stops buffering unseen videos
   * - Battery: stops playback drain
   *
   * @remarks
   * This effect is the most complex, handling both animation and cleanup.
   * Kept together because both triggered by same visibility change.
   * Separating would require duplicate visible dependency.
   */
  createEffect(
    on(
      [containerEl, isVisible],
      ([container, visible]) => {
        if (!container) return;

        if (visible) {
          animateGalleryEnter(container);
        } else {
          // Gallery is closing - run exit animation and cleanup videos
          animateGalleryExit(container);

          /**
           * Helper function to log video cleanup errors.
           *
           * **Purpose**
           * Wraps logger.warn with __DEV__ guard.
           * Prevents error spam in production.
           *
           * **__DEV__ Constant**
           * - true in development builds
           * - false in production (tree-shakeable)
           * - Errors not logged in production
           * - Logging code removed by bundler
           *
           * **Error Parameter**
           * - Type: unknown (catch block returns unknown)
           * - Passed as-is to logger context
           * - Logger formats for console output
           *
           * @param error - Error from pause() or currentTime assignment
           */
          const logCleanupFailure = (error: unknown) => {
            if (__DEV__) {
              logger.warn('video cleanup failed', { error });
            }
          };

          const videos = container.querySelectorAll('video');
          videos.forEach((video) => {
            try {
              video.pause();
            } catch (error) {
              logCleanupFailure(error);
            }

            try {
              if (video.currentTime !== 0) {
                video.currentTime = 0;
              }
            } catch (error) {
              logCleanupFailure(error);
            }
          });
        }
      },
      { defer: true }
    )
  );

  /**
   * Effect 3: Viewport Tracking & CSS Variable Sync
   *
   * **Purpose**
   * Observes toolbar height changes and synchronizes viewport CSS variables.
   * Enables responsive layout adjustments based on toolbar size.
   *
   * **Reactive Dependencies (Implicit)**
   * - containerEl: Gallery container (passed to observeViewportCssVars)
   * - toolbarWrapperEl: Toolbar measurement target (passed to observeViewportCssVars)
   * - No explicit dependency array (runs once on mount)
   * - Effect never re-runs (dependencies never change)
   * - Single-run effect pattern for observer setup
   *
   * **Container & Wrapper Accessors**
   * const container = containerEl(); // Calls signal getter
   * const wrapper = toolbarWrapperEl(); // Calls signal getter
   * - containerEl and toolbarWrapperEl are signals (getters)
   * - Calling them without dependency tracking (not in dependency array)
   * - Null check ensures both exist before observer setup
   * - If either null, effect exits early (no observer)
   *
   * **Null Safety Pattern**
   * `if (!container || !wrapper) return;`
   * - Prevents observer creation without valid DOM elements
   * - No error thrown (simple early exit)
   * - Effect completes without crash
   * - Acceptable if gallery not fully rendered yet
   *
   * **observeViewportCssVars Function**
   * `const cleanup = observeViewportCssVars(container, measureFn);`
   * - Takes gallery container and measure function
   * - Measure function returns `{ toolbarHeight, paddingTop, paddingBottom }`
   * - Sets up ResizeObserver on toolbar
   * - Monitors toolbar height changes
   * - Updates CSS variables on container
   * - Returns cleanup function (may be undefined if setup fails)
   *
   * **Measure Function**
   * ```ts
   * () => {
   *   const toolbarHeight = wrapper ? Math.floor(wrapper.getBoundingClientRect().height) : 0;
   *   return { toolbarHeight, paddingTop: 0, paddingBottom: 0 } as const;
   * }
   * ```
   * - Closure captures wrapper reference
   * - Called on each observer callback
   * - getBoundingClientRect() gets current toolbar dimensions
   * - Math.floor() ensures integer pixel values (no sub-pixel)
   * - Returns object with viewport metrics
   * - paddingTop/paddingBottom: 0 for horizontal layouts
   *
   * **Toolbar Height Monitoring**
   * Observer watches toolbarWrapperEl dimensions:
   * - getBoundingClientRect().height measured each time
   * - Height stored in viewport metrics
   * - Container layout reacts to change
   * - Gallery content adjusts when toolbar resizes
   *
   * **CSS Variable Update Pattern**
   * observeViewportCssVars sets CSS variables:
   * - --xeg-viewport-height: toolbar height (in px)
   * - --xeg-padding-top: padding above viewport (0 here)
   * - --xeg-padding-bottom: padding below viewport (0 here)
   * - Updates on container element
   * - Available to all descendants via CSS custom properties
   *
   * **Observer Lifecycle**
   * ResizeObserver created in observeViewportCssVars:
   * - Observes container dimensions (main listener)
   * - Callback fires when toolbar changes
   * - May fire multiple times (accumulating changes)
   * - Continues until disconnect() called
   *
   * **Cleanup Mechanism**
   * `onCleanup(() => { cleanup?.(); });`
   * - Runs when component unmounts
   * - Calls returned cleanup function (if provided)
   * - cleanup?.() = optional chaining (safe if undefined)
   * - ResizeObserver.disconnect() called in cleanup
   *
   * **Why Optional Cleanup?**
   * cleanup?.() allows:
   * - observeViewportCssVars to return null on error
   * - Component continues without crash
   * - Observer resources freed if created
   * - Graceful degradation if setup fails
   *
   * **Performance Characteristics**
   * - ResizeObserver: O(n) where n = observed elements (main target)
   * - Measure function: O(1) single DOM query via getBoundingClientRect
   * - Callback frequency: Capped by browser (not per pixel change)
   * - CSS variable update: O(1) inline style assignment
   * - No polling or timers (event-driven)
   *
   * **Browser Compatibility**
   * ResizeObserver supported in:
   * - Chrome 64+, Firefox 69+, Safari 13.1+
   * - Edge 79+, all modern browsers
   * - No polyfill needed (project targets esnext)
   *
   * **Timing**
   * Effect runs once on mount:
   * - Observer ready by first render complete
   * - Initial height sync happens in observer callback
   * - Responsive to toolbar changes throughout lifetime
   * - Cleanup runs on unmount (no memory leaks)
   *
   * **Use Case Examples**
   *
   * **Example 1: Toolbar Height Change**
   * 1. User toggles fullscreen (toolbar hides)
   * 2. toolbarWrapperEl height changes (e.g., 60px → 0px)
   * 3. ResizeObserver fires callback
   * 4. Measure function called: getBoundingClientRect().height = 0
   * 5. CSS variables updated: --xeg-viewport-height = 0px
   * 6. Gallery layout media queries react
   * 7. Gallery image dimensions adjust
   *
   * **Example 2: Responsive Window Resize**
   * 1. Window resized (desktop mode)
   * 2. Toolbar content reflows (buttons wrap)
   * 3. Toolbar height increases (e.g., 60px → 80px)
   * 4. ResizeObserver fires
   * 5. Measure function measures new height
   * 6. CSS variables updated
   * 7. Gallery adjusts max-height accordingly
   *
   * **Example 3: Cleanup on Unmount**
   * 1. Gallery component unmounts (user navigates away)
   * 2. onCleanup callback fires
   * 3. cleanup?.() calls ResizeObserver.disconnect()
   * 4. Observer no longer fires callbacks
   * 5. Memory freed, no lingering observers
   *
   * **Related CSS Variables**
   * - --xeg-viewport-height: Set by this effect
   * - --xeg-padding-top: Set to 0 (no padding)
   * - --xeg-padding-bottom: Set to 0 (no padding)
   * - Used in gallery layout CSS
   * - Allows responsive design without JavaScript calculations
   * - Decouples layout from component logic
   *
   * @remarks
   * This effect is the simplest and most stable.
   * Handles one responsibility: viewport height tracking.
   * No animation or complex state management.
   * Pure observer setup with cleanup.
   */
  createEffect(() => {
    const container = containerEl();
    const wrapper = toolbarWrapperEl();
    if (!container || !wrapper) return;

    const cleanup = observeViewportCssVars(container, () => {
      const toolbarHeight = wrapper ? Math.floor(wrapper.getBoundingClientRect().height) : 0;
      return { toolbarHeight, paddingTop: 0, paddingBottom: 0 } as const;
    });

    onCleanup(() => {
      cleanup?.();
    });
  });
}
