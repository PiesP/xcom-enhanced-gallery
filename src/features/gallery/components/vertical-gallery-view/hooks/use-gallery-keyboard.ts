/**
 *   @fileoverview Gallery keyboard navigation hook (Escape key listener)
 *
 *   Manages keyboard event handling for gallery overlay close.
 *   Respects editable form fields (INPUT, TEXTAREA, contenteditable).
 */

import { EventManager } from '@shared/services/event-manager';
import { createEffect, onCleanup } from 'solid-js';

/**
 *   Configuration options for useGalleryKeyboard hook.
 *
 * **Purpose**
 *   Defines the contract for keyboard event handling configuration.
 *   Currently supports only Escape key, but extensible for future
 *   keyboard shortcuts (e.g., ArrowUp, ArrowDown for navigation).
 *
 * **Properties**
 *   - onClose: Callback invoked when Escape key is pressed by user
 *
 * **Callback Semantics**
 *   The onClose callback is invoked after event interception:
 *   - Only called if keyboardEvent.key === 'Escape'
 *   - Only called if target element is not editable (INPUT, TEXTAREA, contenteditable)
 *   - preventDefault() and stopPropagation() called before callback
 *   - Callback should update component state to hide gallery (for example: setGalleryVisible(false))
 *
 * **Type Safety**
 *   All properties are required (no optional fields). If a property is not
 *   needed in the future, use undefined type instead of making it optional.
 *
 * @property onClose - Callback function invoked on Escape key press.
 * Type: function returning void - Takes no arguments, returns void.
 * Called synchronously during event handler execution.
 * Must not throw (wrap in try-catch if uncertain).
 *
 * @example
 * Basic usage:
 * ```ts
 * const options: UseGalleryKeyboardOptions = {
 *   onClose: () => {
 *     setGalleryVisible(false);
 *     console.log('Gallery closed by user (Escape key)');
 *   },
 * };
 * ```
 *
 * @example
 * With state update:
 * ```ts
 * const [galleryVisible, setGalleryVisible] = createSignal(true);
 *
 * useGalleryKeyboard({
 *   onClose: () => setGalleryVisible(false),
 * });
 * ```
 */
interface UseGalleryKeyboardOptions {
  /**
   * Callback triggered when Escape key is pressed (and target is not editable).
   */
  onClose: () => void;
}

/**
 *   Custom Solid.js hook for gallery keyboard navigation.
 *
 *   Registers a document-level keydown listener (capture phase) that:
 *   1. Detects Escape key presses
 *   2. Filters out presses on editable targets (INPUT, TEXTAREA, contenteditable)
 *   3. Calls onClose callback and prevents default behavior
 *   4. Auto-cleans up listener on component unmount
 *
 * **Hook Classification**
 *   - Side-effect hook (returns void, not a value)
 *   - Reactive hook (integrates with Solid.js createEffect)
 *   - Must be called at component top level (Solid.js rules)
 *   - Cleanup is automatic via onCleanup
 *
 * **Implementation Details**
 *
 * **SSR Safety**: Checks typeof document !== 'undefined' to avoid SSR errors
 *   in non-browser environments (Node.js, Web Workers, etc.)
 *
 * **Editable Target Detection**: isEditableTarget helper checks:
 *   - Element exists (null check)
 *   - Tag name is INPUT or TEXTAREA (case-insensitive via toUpperCase)
 *   - Element has contenteditable=true attribute (for rich editors)
 *
 * **Event Handler Flow**:
 *   1. handleKeyDown receives Event, casts to KeyboardEvent
 *   2. isEditableTarget check: if true, return early (skip processing)
 *   3. Check if event.key === 'Escape': if true, call onClose()
 *   4. If handled: preventDefault() and stopPropagation()
 *
 * **Capture Phase Rationale**:
 *   - Capture phase executes before bubbling phase
 *   - Allows gallery to intercept Escape even if child elements have handlers
 *   - Prevents accidental event suppression by form inputs
 *   - Standard pattern for overlay/modal keyboard handling
 *
 * **EventManager Integration**:
 *   - addListener returns listenerId (unique identifier)
 *   - listenerId used to remove listener in onCleanup
 *   - context parameter ('gallery-keyboard-navigation') enables
 *   centralized cleanup if gallery context is destroyed
 *
 * **Memory Management**:
 *   - No closure over component state (only onClose callback)
 *   - No circular references
 *   - Listener guaranteed removed via onCleanup
 *   - Safe to mount/unmount repeatedly
 *
 * **Error Boundaries**:
 *   - onClose callback is called synchronously (must not throw)
 *   - Event handler itself has no try-catch (browser handles KeyboardEvent safely)
 *   - If onClose throws, error propagates (component responsible for error boundary)
 *
 * **Interaction with Other Handlers**:
 *   - preventDefault() blocks browser default Escape behavior
 *   - stopPropagation() blocks parent elements' Escape handlers
 *   - capture phase: parent gallery handlers fire before child element handlers
 *   - Escape in focused input: preventDefault called, isEditableTarget true, returns early
 *
 * @param options - Configuration with onClose callback
 * @returns void - This is a side-effect hook with no return value
 *
 * @throws Never - All errors in onClose are caller's responsibility
 *
 * @see {@link UseGalleryKeyboardOptions} - Options interface
 * @see {@link EventManager.addListener} - Event listener registration
 * @see {@link EventManager.removeListener} - Event listener removal
 */
export function useGalleryKeyboard({ onClose }: UseGalleryKeyboardOptions): void {
  createEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    /**
     * Checks if an event target is an editable form element.
     *
     * **Purpose**
     * Determines whether a keyboard event should be suppressed.
     * If the user is typing in a form field (input, textarea) or
     * a contenteditable region (rich text editor), Escape should
     * not close the gallery.
     *
     * **Checks Performed** (in order)
     * 1. Existence: Element must exist (null check)
     * 2. Tag Name: INPUT or TEXTAREA (case-insensitive)
     * 3. ContentEditable: element.isContentEditable attribute
     *
     * **Type Casting**
     * EventTarget is casted to HTMLElement | null for property access.
     * This is safe because:
     * - EventTarget is the base interface, HTMLElement extends it
     * - KeyboardEvent.target is typically an HTMLElement (or SVGElement)
     * - Null check handles edge cases (no element)
     *
     * **Tag Name Normalization**
     * toUpperCase() converts to uppercase for comparison because:
     * - DOM API returns uppercase tag names: \<input\> becomes "INPUT"
     * - Ensures case-insensitive matching (standard DOM behavior)
     * - Handles malformed tags gracefully
     *
     * **ContentEditable Detection**
     * isContentEditable property is:
     * - Built-in DOM property (HTML5 standard)
     * - true for elements with contenteditable="true"
     * - true for descendants of contenteditable elements (inherited)
     * - false for regular divs or other non-editable elements
     * - Detects rich text editors, medium.com-style editors, etc.
     *
     * **Falsy Operator !!**
     * The !! coercion converts to boolean:
     * - !!element.isContentEditable returns true or false
     * - Matches expected return type (boolean)
     * - Prevents TypeScript errors on optional property
     *
     * **Performance**
     * O(1) complexity:
     * - Null check: single reference comparison
     * - toUpperCase(): string method (O(1) for short strings)
     * - Property access: direct DOM property (O(1))
     * - No DOM traversal, no loops, no allocations
     *
     * **Browser Compatibility**
     * - tagName: DOM Level 1 (all browsers)
     * - isContentEditable: HTML5 (IE9+, all modern browsers)
     * - toUpperCase: ES3 (all browsers)
     *
     * @param target - Event target from KeyboardEvent.target
     * @returns true if target is editable (suppress Escape handling), false otherwise
     *
     * @example
     * isEditableTarget(\<input\>) → true (INPUT tag)
     * isEditableTarget(\<textarea\>) → true (TEXTAREA tag)
     * isEditableTarget(\<div contenteditable\>) → true (isContentEditable=true)
     * isEditableTarget(\<div\>) → false (regular div)
     * isEditableTarget(null) → false (no element)
     */
    const isEditableTarget = (target: EventTarget | null | undefined): boolean => {
      const element = target as HTMLElement | null;
      if (!element) {
        return false;
      }

      const tag = element.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return true;
      }

      return !!element.isContentEditable;
    };

    /**
     * Handles keydown events and triggers close callback on Escape.
     *
     * **Event Flow**
     * 1. Event is received (keydown event on document)
     * 2. Cast Event to KeyboardEvent for type safety
     * 3. Check isEditableTarget: if true, return early
     * 4. Check if key === 'Escape': if true, call onClose
     * 5. If handled: call preventDefault and stopPropagation
     *
     * **Early Return for Editable Targets**
     * If user is typing in an input or contenteditable div,
     * exit immediately without processing. This allows the
     * browser to handle Escape normally for that element.
     *
     * **Type Casting**
     * Event is casted to KeyboardEvent because:
     * - addEventListener('keydown') guarantees KeyboardEvent type
     * - TypeScript needs explicit cast for property access
     * - Safe cast: keydown events are always KeyboardEvent
     *
     * **Event Property: key**
     * KeyboardEvent.key is a string representing the pressed key:
     * - 'Escape' for Escape key (modern KeyboardEvent API)
     * - W3C standard, supported in all modern browsers (Chrome 51+)
     * - Preferred over legacy keyCode (which uses numeric codes)
     * - Case-sensitive string comparison
     *
     * **Handled Flag Pattern**
     * Using a 'handled' flag allows:
     * - Extensibility for future keyboard shortcuts
     * - Clear indication that event was processed
     * - Grouped preventDefault/stopPropagation calls
     * - Easy to add else-if for other keys
     *
     * **preventDefault() Semantics**
     * Calling preventDefault():
     * - Stops browser default Escape behavior
     * - Does NOT stop propagation to parent listeners
     * - Required to prevent browser from handling key
     * - Safe to call on any event (browsers ignore on non-cancellable)
     *
     * **stopPropagation() Semantics**
     * Calling stopPropagation():
     * - Stops event from bubbling to parent elements
     * - Does NOT stop capture phase handlers (we're in capture, this is still early)
     * - Prevents event from reaching other document handlers
     * - Standard pattern for modal/overlay event handling
     *
     * **Capture vs Bubbling**
     * This listener is in capture phase (addEventListener 3rd arg = true):
     * - Fires during capture phase (before bubbling)
     * - stopPropagation() stops capture phase propagation
     * - Child handlers still execute (different phase)
     * - Allows gallery to catch Escape before children handle it
     *
     * **Error Handling**
     * - onClose() is called directly (no try-catch)
     * - If onClose throws, error propagates to browser
     * - Component should wrap onClose in try-catch if uncertain
     * - Modern components typically have error boundaries
     *
     * **Performance**
     * O(1) operation:
     * - Event property access: O(1)
     * - String comparison: O(1) for short string ('Escape')
     * - Callback invocation: O(1) (callback time varies)
     * - preventDefault/stopPropagation: O(1)
     *
     * @param event - Keyboard event from document listener
     *
     * @remarks
     * This is called on EVERY keydown on the document. Performance is critical.
     * Early return pattern (editable target check) ensures non-Escape keys
     * exit immediately without overhead.
     *
     * @example
     * Escape key on div:
     * ```
     * User presses Escape
     * handleKeyDown fired
     * isEditableTarget returns false
     * event.key === 'Escape' is true
     * onClose() called
     * preventDefault() and stopPropagation() called
     * Gallery closes
     * ```
     *
     * @example
     * Escape key in input field:
     * ```
     * User presses Escape (while focused on \<input\>)
     * handleKeyDown fired
     * isEditableTarget returns true (INPUT tag)
     * Return early (do not process)
     * Browser handles Escape normally for input
     * Gallery stays open
     * ```
     */
    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;

      if (isEditableTarget(keyboardEvent.target)) {
        return;
      }

      let handled = false;

      if (keyboardEvent.key === 'Escape') {
        onClose();
        handled = true;
      }

      if (handled) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
      }
    };

    /**
     * Register keyboard listener with EventManager.
     *
     * **EventManager Pattern**
     * Instead of direct element.addEventListener(), we use EventManager singleton.
     * This provides:
     * - Centralized listener tracking (prevents leaks)
     * - Automatic cleanup on context unload
     * - Listener grouping by context ('gallery-keyboard-navigation')
     * - Simplified removal via listenerId
     *
     * **Listener Parameters**
     * - document: Global keyboard listener (all keydown events pass through)
     * - 'keydown': Keyboard event type (fires for every key press)
     * - handleKeyDown: Handler function (called for each event)
     * - `{ capture: true }`: Options - capture phase (intercept before bubbling)
     * - 'gallery-keyboard-navigation': Context string for filtering/cleanup
     *
     * **Return Value: listenerId**
     * EventManager.addListener returns unique ID for listener:
     * - Used to identify this specific listener
     * - Passed to removeListener for cleanup
     * - Ensures only this listener is removed (no side effects)
     * - Type: string or number (opaque ID, don't inspect contents)
     *
     * **Capture Phase Benefits**
     * `{ capture: true }` means:
     * - Listener fires during capture phase (before event bubbles)
     * - Executes before any target element's listeners
     * - Can intercept before child event handlers
     * - Standard for overlay/modal behavior
     * - Required for Escape to work with focused inputs
     *
     * **Context String: 'gallery-keyboard-navigation'**
     * Context is used for:
     * - Filtering listeners by feature (helps EventManager cleanup)
     * - Debugging (logging which context owns a listener)
     * - Batch cleanup (EventManager can remove all listeners in context)
     * - Convention: kebab-case, descriptive name
     *
     * **Why Not Direct addEventListener?**
     * Direct approach has problems:
     * - Must manually track listener IDs
     * - Must remember to call removeEventListener
     * - Errors can cause listener leaks
     * - Hard to debug which listeners are registered
     * - EventManager solves all these problems
     *
     * **Timing**
     * Registration happens inside createEffect:
     * - Runs during component initialization
     * - Ensures document exists before registering
     * - Cleanup runs when component unmounts
     * - Safe in Solid.js reactive context
     *
     * @see {@link EventManager.addListener} - Add listener with auto-cleanup
     * @see {@link EventManager.removeListener} - Remove listener by ID
     */
    const eventManager = EventManager.getInstance();
    const listenerId = eventManager.addListener(
      document,
      'keydown',
      handleKeyDown,
      { capture: true },
      'gallery-keyboard-navigation'
    );

    /**
     * Cleanup listener on component unmount.
     *
     * **Solid.js onCleanup Pattern**
     * onCleanup callback is called when:
     * - Component unmounts
     * - Component re-executes effect (reactive dependency changes)
     * - Effect is disposed explicitly
     *
     * **Why Cleanup is Critical**
     * Without cleanup:
     * - Listener remains active even after component is destroyed
     * - Next keypress could reference unmounted component
     * - Can cause memory leaks and unexpected behavior
     * - Multiple listeners accumulate if component remounts
     *
     * **Listener Removal**
     * eventManager.removeListener(listenerId):
     * - Removes only this listener (by ID)
     * - Calls element.removeEventListener internally
     * - No-op if already removed
     * - Null-safe (checks listenerId existence)
     *
     * **Closure Variable: listenerId**
     * listenerId is captured in closure:
     * - Available in cleanup callback
     * - Ensures correct listener is removed
     * - No global state or side effects
     * - Safe if multiple instances of this hook
     *
     * **Guard: if (listenerId)**
     * Checks if listenerId is truthy:
     * - listenerId could be undefined if addListener fails
     * - Guard prevents calling removeListener(undefined)
     * - Defensive programming pattern
     * - Safe to remove even if it's null/undefined
     *
     * **Memory Safety**
     * After cleanup:
     * - No references to event handler remain
     * - No references to onClose callback remain
     * - Garbage collector can reclaim memory
     * - Safe to mount/unmount repeatedly
     *
     * @remarks
     * This cleanup is guaranteed to run. Solid.js ensures onCleanup
     * callbacks are called during component disposal, regardless of
     * whether the effect completed normally or encountered errors.
     *
     * @example
     * Component lifecycle:
     * ```
     * Mount: createEffect runs → addListener → listener active
     * User presses Escape → handleKeyDown → onClose()
     * Unmount: onCleanup runs → removeListener → listener inactive
     * ```
     *
     * @example
     * Reactive re-execution:
     * \`\`\`
     * onClose dependency changes
     * Old effect: onCleanup → removeListener (old instance)
     * New effect: createEffect → addListener (new instance)
     * \`\`\`
     */
    onCleanup(() => {
      if (listenerId) {
        eventManager.removeListener(listenerId);
      }
    });
  });
}
