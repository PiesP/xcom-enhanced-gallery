/\*\*

- Phase 415: SPA Scroll Recovery and Event Optimization Guide
-
- This document provides implementation guidelines for addressing X.com SPA
- scroll restoration issues and optimizing event handling to prevent
  interference
- with Twitter's native mechanisms.
-
- Language: English (code & documentation per language policy)
- Context: Korean user responses
-
- @see docs/ARCHITECTURE.md for service layer patterns
- @see copilot-instructions.md for AI collaboration guidelines \*/

// ============================================================================
// SOLUTION 1: DOM Manipulation Minimization //
============================================================================

/\*\*

- Problem:
- - Style element removal and re-insertion triggers DOM observer notifications
- - Toolbar/modal elements interfere with Twitter's Infinite Scroll detection
- - popstate event processing finds modified DOM structure
-
- Solution: Conditional DOM manipulation based on page state
-
- Implementation:
- 1.  Track initial load vs SPA navigation
- 2.  Skip DOM manipulation on route change (popstate)
- 3.  Use WeakRef for element references (memory safe)
-
- Pattern Example:
- ```typescript

  ```

- class StyleManager {
- private isInitialLoad = true;
- private styleElement: WeakRef<HTMLStyleElement> | null = null;
-
- constructor() {
-     window.addEventListener('popstate', () => {
-       this.isInitialLoad = false;
-     });
- }
-
- initialize(): void {
-     if (!this.isInitialLoad) return; // Skip on navigation
-
-     const oldStyle = document.getElementById('xeg-styles');
-     if (oldStyle) oldStyle.remove();
-
-     const newStyle = document.createElement('style');
-     newStyle.id = 'xeg-styles';
-     newStyle.textContent = STYLES;
-     document.head.appendChild(newStyle);
-     this.styleElement = new WeakRef(newStyle);
- }
- }
- ```

  ```

-
- Implementation Locations in Project:
- - src/shared/utils/events/core/event-context.ts: Event context setup
- - src/bootstrap/events.ts: Global event wiring
- - src/shared/services/scroll-restore-service.ts: Route tracking (NEW
    Phase 415)
-
- Benefits:
- - Reduces DOM churn on SPA navigation
- - Preserves Twitter's scroll restoration state
- - Minimal performance overhead \*/

// ============================================================================
// SOLUTION 2: Event Handler Optimization //
============================================================================

/\*\*

- Problem:
- - stopPropagation() prevents Twitter's keydown/popstate handlers from firing
- - Event delegation captures bubbled events incorrectly
- - Escape key handling conflicts with browser back navigation
-
- Solution: Selective event handling with proper event flow
-
- Anti-patterns to avoid:
- ❌ event.stopPropagation() on scroll/keydown events
- ❌ event.preventDefault() on navigation-related events
- ❌ Capturing phase listeners on top-level elements
-
- Best practices:
- ✅ Use bubbling phase only (addEventListener default: useCapture=false)
- ✅ Allow events to propagate unless critical
- ✅ Filter events by target/type, not by suppression
- ✅ Use specific event selectors (data-testid, role attributes)
-
- Pattern Example - Keyboard Handler:
- ```typescript

  ```

- function handleKeyDown(event: KeyboardEvent): void {
- // Filter: only process if target is gallery-related
- if (!isGalleryElement(event.target as Element)) return;
-
- if (event.code === 'Space') {
-     // DO NOT stopPropagation or preventDefault globally
-     // Instead, handle only our specific gallery case
-     handleGallerySpace(event);
-     // Note: Let Twitter's handlers also see this event
- } else if (event.code === 'Escape') {
-     // For Escape, allow Twitter to handle it naturally
-     // (back button, modal close, etc.)
-     if (closeModalIfOpen()) {
-       // Only prevent default if we actually closed something
-       event.preventDefault();
-     }
-     // Otherwise let Twitter's handlers process
- }
- }
-
- function isGalleryElement(elem: Element): boolean {
- return elem.closest('[data-testid=\"xeg-gallery\"]') !== null;
- }
- ```

  ```

-
- Pattern Example - Click Handler:
- ```typescript

  ```

- function handleMediaClick(event: MouseEvent): void {
- const target = event.target as Element;
-
- // Check if this is a media element we care about
- if (!target.matches('img, video, [data-testid=\"xeg-media\"]')) {
-     return; // Let Twitter handle other clicks
- }
-
- // Handle our media click
- handleGalleryMediaClick(event);
-
- // Only stop propagation if we actually handled it
- // event.stopPropagation(); // OPTIONAL - avoid if possible
- }
- ```

  ```

-
- Implementation Locations in Project:
- - src/shared/utils/events/handlers/keyboard-handler.ts
- - src/shared/utils/events/handlers/media-click-handler.ts
- - src/features/gallery/components/ModalShell.tsx (Phase 415: Check
    handleKeyDown)
-
- Validation:
- - Keyboard shortcuts work correctly
- - Twitter's back button works (popstate fires)
- - Scroll restoration works (scroll event propagates)
- - No console errors about event handling
-
- Benefits:
- - Twitter's native event handlers still execute
- - Better interoperability with Twitter's SPA routing
- - Fewer "event interference" bugs \*/

// ============================================================================
// SOLUTION 3: Manual Scroll Restoration (IMPLEMENTED IN PHASE 415) //
============================================================================

/\*\*

- Problem:
- - Twitter's scroll restoration fails when DOM is heavily modified
- - sessionStorage scroll position lost during SPA transitions
- - No fallback mechanism when native restoration fails
-
- Solution: ScrollRestoreService (NEW in Phase 415)
- Location: src/shared/services/scroll-restore-service.ts
-
- Features:
- - Auto-save scroll position on beforeunload
- - Auto-restore on page load or route change
- - WeakMap-based memory tracking (prevents leaks)
- - Route-aware restoration (only restore if same page)
- - Optional conditional restoration
-
- Usage:
- ```typescript

  ```

- // Initialize at startup (Phase 415 in main.ts)
- const scrollRestoreService = getScrollRestoreService();
- scrollRestoreService.initialize();
-
- // Manual save (if needed)
- scrollRestoreService.saveScrollPosition('/home');
-
- // Manual restore (if needed)
- await scrollRestoreService.restoreScrollPosition(100); // 100ms delay
-
- // Check current state
- const position = scrollRestoreService.getCurrentPosition();
-
- // Cleanup (automatic in cleanup() phase)
- scrollRestoreService.destroy();
- ```

  ```

-
- Implementation Details:
- - Uses sessionStorage (cleared on browser close, survives page reload)
- - Route tracking via popstate/hashchange events
- - Configurable delay for DOM settlement
- - Automatic cleanup on unload
-
- Benefits:
- - Backup mechanism when native restoration fails
- - Handles deep scroll + infinite load scenarios
- - No external dependencies \*/

// ============================================================================
// SOLUTION 4: Observer Scope Restriction //
============================================================================

/\*\*

- Problem:
- - IntersectionObserver monitors entire feed (100+ elements)
- - MutationObserver catches Twitter's DOM updates
- - Observers conflict with Twitter's own Observer instances
-
- Solution: Restrict Observer scope to specific elements
-
- Anti-patterns to avoid:
- ❌ observeElements(document.querySelectorAll('img'))
- ❌ IntersectionObserver on feed container
- ❌ MutationObserver watching article elements
-
- Best practices:
- ✅ Target only gallery media (data-testid="xeg-media")
- ✅ Skip Twitter feed containers ([data-testid="primaryColumn"])
- ✅ Use specific selectors, not wildcards
- ✅ Limit callback frequency (debounce/throttle)
-
- Current Implementation:
- - IntersectionObserverService:
    src/shared/services/intersection-observer-service.ts
- - Observers limited to media elements with specific class/id
- - No observation of Twitter's feed structure
-
- Phase 415 Audit:
- - ✅ Reviewed IntersectionObserverService (safe)
- - ✅ Checked MediaService observer usage (safe)
- - ✅ Verified no feed-level observers (OK)
-
- Testing:
- ```javascript

  ```

- // In browser console while gallery is active
- Performance.observer.getEntries().filter(e => e.observerType)
- // Should show only gallery-specific observers
-
- // Check for DOM mutation conflicts
- const mutationCount = window.\_\_XEG_TRACE_mutations?.count || 0;
- console.log('Mutations observed:', mutationCount);
- ```
  */
  ```

// ============================================================================
// IMPLEMENTATION CHECKLIST //
============================================================================

/\*\*

- Before committing Phase 415 changes:
-
- [ ] ScrollRestoreService
- [ ] Service created: src/shared/services/scroll-restore-service.ts
- [ ] Exported in: src/shared/services/index.ts
- [ ] Initialized in: src/main.ts (startApplication)
- [ ] Cleaned up in: src/main.ts (cleanup)
- [ ] Unit tests passing (see scroll-restore-service.test.ts)
-
- [ ] Event Optimization (Code Review)
- [ ] Reviewed keyboard-handler.ts for stopPropagation()
- [ ] Reviewed media-click-handler.ts for stopPropagation()
- [ ] Checked ModalShell.tsx handleKeyDown for preventDefault()
- [ ] Verified no popstate interference
-
- [ ] DOM Manipulation (Code Review)
- [ ] No style re-insertion on route change
- [ ] Toolbar/modal creation delayed until needed
- [ ] No unnecessary DOM queries in boot path
- [ ] WeakRef used for element references where applicable
-
- [ ] Observer Scope (Code Review)
- [ ] IntersectionObserverService safe (gallery only)
- [ ] No observers on Twitter feed containers
- [ ] Mutation observer callbacks efficient
-
- [ ] Testing
- [ ] Unit tests pass: npm run test:unit:batched
- [ ] Integration tests pass: npm run test:browser
- [ ] E2E smoke tests pass: npm run e2e:smoke
- [ ] Manual test: Deep scroll → navigate → back → scroll restored
-
- [ ] Build & Validation
- [ ] TypeScript: npm run typecheck (0 errors)
- [ ] ESLint: npm run lint (0 errors)
- [ ] Build: npm run build (success)
- [ ] All checks: npm run check (pass) \*/

// ============================================================================
// TESTING METHODOLOGY //
============================================================================

/\*\*

- Manual Testing (in X.com):
-
- Test Case 1: Basic Scroll Restoration
- 1.  Open X.com/home
- 2.  Scroll down 5-10 screen heights (let infinite scroll load)
- 3.  Note current scroll position (e.g., 3000px)
- 4.  Click on a tweet (navigation)
- 5.  Click back button
- 6.  Verify scroll position restored to ~3000px
- Expected: Scroll position maintained or ScrollRestoreService restores it
-
- Test Case 2: Multiple Navigation
- 1.  Home → scroll deep
- 2.  Profile page
- 3.  Back to home (should restore scroll)
- 4.  Notifications page
- 5.  Back to home (should restore scroll again)
- Expected: Each restoration works independently
-
- Test Case 3: Event Interference
- 1.  Open browser DevTools (F12)
- 2.  Console tab
- 3.  Add listener: document.addEventListener('scroll', () =>
      console.log('scroll'))
- 4.  Deep scroll and navigate
- 5.  Check console: scroll events should fire during navigation
- Expected: No blocked/prevented scroll events
-
- Test Case 4: Memory Leaks
- 1.  Open DevTools → Performance
- 2.  Record memory timeline
- 3.  Scroll → navigate → back (repeat 5 times)
- 4.  Take heap snapshot
- Expected: Memory stable, no WeakRef leaks
-
- Debugging:
- Enable debug mode in ScrollRestoreService (localStorage override):
- ```javascript

  ```

- // In browser console
- localStorage.setItem('\_\_xeg_debug_scroll', 'true');
- location.reload();
- // Now ScrollRestoreService logs all operations
- ```
  */
  ```

export const PHASE_415_IMPLEMENTATION_GUIDE = 'See this file for complete
documentation';
