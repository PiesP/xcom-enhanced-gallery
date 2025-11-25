# Browser Test Focus: Scroll-Based Focus Tracking

## Date: 2025-11-25

## Changes Made

### Refactored Components
1. **FocusCoordinator** (`src/features/gallery/logic/focus-coordinator.ts`)
   - Enhanced documentation with clear behavior descriptions
   - Switched from native `setTimeout` to `globalTimerManager` for consistency
   - Improved code organization with type definitions and constants
   - Better encapsulation with private methods

2. **useGalleryFocusTracker** (`src/features/gallery/hooks/useGalleryFocusTracker.ts`)
   - Removed unused options: `isScrolling`, `shouldAutoFocus`
   - Simplified interface to essential options only
   - Enhanced documentation for each function

3. **useGalleryScroll** (`src/features/gallery/hooks/useGalleryScroll.ts`)
   - Modernized with clear documentation
   - Simplified scroll end detection logic
   - Removed redundant comments

4. **VerticalGalleryView** (`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`)
   - Cleaned up unused hook options

### Test Additions
- Added comprehensive tests for `FocusCoordinator` class
- Updated `useGalleryFocusTracker` tests with proper typing

---

## Critical Test Areas

### 1. Scroll Stop → Focus Update → Toolbar Progress
**Priority: HIGH**

Test Steps:
1. Open gallery with multiple media items (3+)
2. Scroll down slowly through items
3. Stop scrolling and wait ~250ms
4. **Expected**: 
   - Progress indicator (e.g., "2/4") updates to show currently centered item
   - Focus outline (if visible) moves to centered item
   - No automatic scroll occurs (view stays where user stopped)

5. Scroll to middle of an item and stop
6. **Expected**: That item becomes focused, toolbar updates

### 2. Keyboard Navigation After Scroll
**Priority: HIGH**

Test Steps:
1. Open gallery with multiple items
2. Scroll manually to item 3
3. Wait for focus to settle (toolbar shows "3/N")
4. Press Down Arrow
5. **Expected**: Gallery scrolls to item 4, toolbar shows "4/N"
6. Press Up Arrow
7. **Expected**: Gallery scrolls to item 3, toolbar shows "3/N"

### 3. Scrollbar Drag Focus Tracking
**Priority: MEDIUM**

Test Steps:
1. Open gallery with many items (5+)
2. Drag scrollbar to middle
3. Release scrollbar
4. **Expected**: Focus updates to centered item, toolbar updates

### 4. Manual Focus vs Auto Focus
**Priority: MEDIUM**

Test Steps:
1. Open gallery
2. Click on a specific item (manual focus)
3. **Expected**: That item is focused, toolbar updates
4. Scroll away manually
5. **Expected**: After scroll stops, focus updates to new centered item
6. Use keyboard to navigate
7. **Expected**: Navigation works from current position

### 5. No Auto-Scroll Prevention
**Priority: HIGH**

Test Steps:
1. Open gallery at item 2
2. Scroll to show items 4-5 in view
3. Stop scrolling
4. **Expected**: 
   - Focus updates to visible item (4 or 5)
   - Gallery does NOT auto-scroll back to item 2
   - Gallery stays exactly where user left it

### 6. Rapid Scroll Debouncing
**Priority: MEDIUM**

Test Steps:
1. Open gallery
2. Scroll quickly through many items
3. **Expected**: 
   - Toolbar doesn't flicker/update rapidly
   - Only final position updates toolbar
   - Smooth performance, no lag

### 7. Edge Cases
**Priority: LOW**

Test Steps:
1. Open gallery with single item
   - **Expected**: Always shows "1/1", no focus tracking issues

2. Scroll to very top/bottom
   - **Expected**: First/last item gets focus properly

3. Rapid open/close gallery
   - **Expected**: No memory leaks, clean state on reopen

---

## Regression Check
- [ ] Previous keyboard navigation still works
- [ ] Download buttons work correctly
- [ ] Fit mode buttons work correctly
- [ ] Video playback/pause works
- [ ] Close button works
- [ ] Settings panel works

---

## Notes
- Focus tracking uses IntersectionObserver for efficiency
- Debounce time is 250ms for scroll end detection
- Focus tracking debounce is 0ms (immediate) for keyboard responsiveness
- Auto-focus only triggers when no manual focus is active
