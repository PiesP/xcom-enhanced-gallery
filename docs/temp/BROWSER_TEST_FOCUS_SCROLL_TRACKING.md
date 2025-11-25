# Browser Test Focus: Scroll-Based Focus Tracking

## Date: 2025-11-25 (Updated)

## Changes Made (Phase: scroll-focus-toolbar-sync)

### Refactored Components

1. **FocusCoordinator** (`src/features/gallery/logic/focus-coordinator.ts`)
   - Simplified documentation with clear behavior descriptions
   - Cached observer options for better performance
   - Reordered methods for better code flow (public before private)
   - 159 lines → ~130 lines (18% reduction)

2. **useGalleryFocusTracker** (`src/features/gallery/hooks/useGalleryFocusTracker.ts`)
   - Removed unused `getCurrentIndex` parameter
   - Simplified interface to essential options only
   - Enhanced inline documentation
   - 162 lines → ~125 lines (23% reduction)

3. **useGalleryScroll** (`src/features/gallery/hooks/useGalleryScroll.ts`)
   - Modernized with streamlined documentation
   - Inlined `extractWheelDelta` function
   - Simplified `shouldIgnoreScroll` as arrow function
   - 239 lines → ~200 lines (16% reduction)

4. **VerticalGalleryView** (`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`)
   - Removed unused `getCurrentIndex` from focus tracker options
   - Improved comments for scroll-focus integration flow
   - Clearer separation of concerns in effect hooks

### Test Additions

- Added new integration test file: `scroll-focus-toolbar-sync.test.ts`
- 7 new tests covering scroll-focus-toolbar synchronization
- Updated `useGalleryFocusTracker.test.ts` to match new API

---

## Critical Test Areas

### 1. Scroll Stop → Focus Update → Toolbar Progress

**Priority: HIGH**

**Focus Selection Criteria** (Updated 2025-11-25):

- **Priority 1**: Item with ≥30% visibility whose top edge is closest to viewport top
- **Priority 2**: If no item has ≥30% visibility, select item whose top edge is closest to viewport top (regardless of visibility)

Test Steps:

1. Open gallery with multiple media items (3+)
2. Scroll down slowly through items
3. Stop scrolling and wait ~250ms
4. **Expected**:
   - Progress indicator (e.g., "2/4") updates to show item closest to top with ≥30% visibility
   - Focus outline (if visible) moves to top-aligned item
   - No automatic scroll occurs (view stays where user stopped)

5. Scroll so an item is ~30% visible at top of viewport and stop
6. **Expected**: That item becomes focused (≥30% visibility + closest to top), toolbar updates
7. Scroll so an item is barely visible (<30%) at top and another is fully visible below
8. **Expected**: The item ≥30% visible closest to top gets focus, not the barely visible one

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
4. **Expected**: Focus updates to item ≥30% visible and closest to viewport top, toolbar updates

### 4. Manual Focus vs Auto Focus

**Priority: MEDIUM**

Test Steps:

1. Open gallery
2. Click on a specific item (manual focus)
3. **Expected**: That item is focused, toolbar updates
4. Scroll away manually
5. **Expected**: After scroll stops, focus updates to new top-aligned item with ≥30% visibility
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

- Focus tracking uses IntersectionObserver via SharedObserver pool for efficiency
- Debounce time is 250ms for scroll end detection
- Focus tracking debounce is 0ms (immediate) for keyboard responsiveness
- Auto-focus only triggers when no manual focus is active
- FocusCoordinator does NOT trigger auto-scroll (tracking only)
- Programmatic scrolls within 100ms window are ignored for focus tracking
