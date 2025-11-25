# Browser Test Checklist - VerticalGalleryView Refactoring

**Date**: 2025-11-26
**Branch**: `refactor/vertical-gallery-view-simplification`
**Changes**: Effect consolidation and hook extraction

---

## 🎯 Critical Test Areas

### 1. Gallery Opening/Closing (High Priority)
- [ ] Gallery opens correctly when clicking media on timeline
- [ ] Enter animation plays smoothly
- [ ] Exit animation plays when closing
- [ ] Videos pause when gallery closes
- [ ] Gallery container scrolls correctly

### 2. Toolbar Behavior (High Priority)
- [ ] Toolbar visible initially when gallery opens
- [ ] Toolbar auto-hides after 3 seconds (default)
- [ ] Toolbar shows on hover (top hover zone)
- [ ] Toolbar hides when scrolling starts
- [ ] Toolbar settings persist (theme, language)

### 3. Navigation (High Priority)
- [ ] Arrow key navigation (left/right)
- [ ] Click navigation between items
- [ ] Button navigation (prev/next)
- [ ] Scroll-based navigation updates index correctly
- [ ] Focus indicator follows navigation

### 4. Scroll Behavior (Medium Priority)
- [ ] Manual scroll updates focused index
- [ ] Programmatic scroll (keyboard nav) works smoothly
- [ ] Scroll snap behavior functions correctly
- [ ] Last item scrolls to top properly

### 5. Fit Modes (Medium Priority)
- [ ] Original size mode
- [ ] Fit width mode
- [ ] Fit height mode
- [ ] Fit container mode
- [ ] Mode persists across sessions

### 6. Download (Low Priority)
- [ ] Single file download works
- [ ] Bulk download (ZIP) works
- [ ] Download button states update correctly

---

## 📝 Changes Made

### New Hooks Created
1. **useToolbarAutoHide** - Toolbar visibility timer management
2. **useGalleryLifecycle** - Consolidated animation and video cleanup
3. **useGalleryNavigation** - Unified navigation event handling

### Effects Reduced
- Before: 9 `createEffect` calls in VerticalGalleryView
- After: 5 `createEffect` calls (1 remaining in component + 4 in hooks)

### Files Changed
- `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`
- New: `src/features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide.ts`
- New: `src/features/gallery/components/vertical-gallery-view/hooks/useGalleryLifecycle.ts`
- New: `src/features/gallery/components/vertical-gallery-view/hooks/useGalleryNavigation.ts`

### Test Coverage Added
- `test/unit/.../useToolbarAutoHide.test.ts`
- `test/unit/.../useGalleryLifecycle.test.ts`
- `test/unit/.../useGalleryNavigation.test.ts`
- `test/unit/shared/utils/media/dimensions.test.ts`

---

## ⚠️ Known Risks

1. **Effect timing** - Consolidated effects may have different execution order
2. **Animation coordination** - Enter/exit animations now share effect with video cleanup
3. **Navigation trigger tracking** - Single effect now handles multiple responsibilities

---

## ✅ Build Verification

```bash
npm run build:fast
# All tests pass
# No type errors
# No lint errors
```
