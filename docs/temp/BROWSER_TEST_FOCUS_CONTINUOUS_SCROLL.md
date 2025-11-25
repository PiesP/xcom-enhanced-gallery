# Browser Testing Focus Areas - Continuous Scroll Focus

## Changes in This Update

This update adds comprehensive unit tests for auto-focus behavior during continuous scroll-stop actions.

### New Test File
- `test/unit/features/gallery/continuous-scroll-focus.test.ts` - 13 new tests

### Cleanup
- Removed orphan module: `src/shared/state/signals/scroll.signals.ts`

---

## Critical Areas for Browser Testing

### 1. Consecutive Scroll-Stop Behavior
**Priority: HIGH**

Test the following scenarios in the real browser:

1. **Basic Scroll-Stop Cycles**
   - Open gallery with 3+ images
   - Scroll down slowly, stop, wait for focus to update
   - Repeat scroll-stop 3-4 times
   - Verify toolbar shows correct image number each time

2. **Rapid Scrolling**
   - Scroll quickly through multiple images without stopping
   - Stop suddenly
   - Verify focus settles on the most visible item (not a stale item)

3. **Bidirectional Scroll Pattern**
   - Scroll down to image 3
   - Scroll back up to image 1
   - Scroll down to image 2
   - Verify focus tracks correctly in both directions

### 2. Focus Stability Under Jitter
**Priority: MEDIUM**

1. **Trackpad Jitter**
   - Use trackpad with small, rapid movements
   - Verify no flickering in toolbar progress bar
   - Focus should debounce properly (50ms default)

2. **Scroll Wheel Precision**
   - Use scroll wheel with variable speed
   - Verify smooth focus transitions

### 3. Edge Cases
**Priority: MEDIUM**

1. **Equal Visibility Scenario**
   - Scroll until two images are approximately equally visible
   - Verify the item closer to viewport center gets focus

2. **Large Images**
   - Test with images taller than viewport
   - Focus should work correctly for partially visible items

3. **Video Items**
   - Mix of images and videos in gallery
   - Verify focus works for both media types

---

## Test Checklist

| Scenario | Expected Behavior | Pass/Fail |
|----------|-------------------|-----------|
| 3 consecutive scroll-stops | Focus updates correctly each time | ☐ |
| Rapid scroll then stop | Focus on most visible item | ☐ |
| Scroll down then up | Focus tracks bidirectionally | ☐ |
| Trackpad jitter | No focus flickering | ☐ |
| Two items equally visible | Center-closest item focused | ☐ |
| Gallery with videos | Focus works for all media | ☐ |

---

## Regression Checks

These existing behaviors should still work:

- [ ] Keyboard navigation (arrow keys) updates focus
- [ ] Clicking an image sets manual focus
- [ ] Toolbar download button works for focused item
- [ ] Gallery close/reopen resets focus state
