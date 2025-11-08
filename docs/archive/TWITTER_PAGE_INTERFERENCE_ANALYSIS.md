# Twitter Page Interference Analysis Report

**Version**: 1.0 **Date**: 2025-11-07 **Phase**: Interference Audit **Status**:
✅ Complete - Ready for Review

---

## 📋 Executive Summary

This report identifies all functionality in the X.com Enhanced Gallery
userscript that modifies Twitter page behavior, **excluding media click
interactions** (which are necessary for core functionality).

**Key Findings**:

- **4 categories** of Twitter page interference identified
- **Actively blocking** Twitter scroll interactions during gallery use
- **DOM monitoring** via MutationObserver for Twitter structure changes
- **Scroll container** refresh on gallery unmount
- **Principle alignment**: Interference is minimal and intentional

---

## 🔍 Interference Categories

### 1. **Twitter Scroll Blocking** (Active, During Gallery Use)

#### Location

`src/features/gallery/hooks/useGalleryScroll.ts`

#### Description

When gallery is open and user scrolls within gallery content, the userscript
**prevents mouse wheel scroll events** from propagating to Twitter's page
scroll.

#### Code Implementation

```typescript
// Lines 186-217
const preventTwitterScroll = (event: Event) => {
  if (!blockTwitterScrollAccessor()) {
    return; // Can be disabled via option
  }

  if (!scrollState().isScrolling) {
    return; // Only blocks during active gallery scroll
  }

  if (isGalleryInternalEvent(event)) {
    return; // Gallery-internal events pass through
  }

  // INTERFERENCE: Block Twitter scroll
  event.preventDefault();
  event.stopPropagation();

  logger.debug('useGalleryScroll: External scroll chaining blocked', {
    preventedDelta,
    preventedTarget,
  });
};
```

#### Configuration

- **Option**: `blockTwitterScroll` (default: `true`)
- **Conditions**:
  - Only active when gallery is open
  - Only when gallery scroll is actively occurring
  - Does NOT affect gallery-internal events
  - Can be disabled programmatically

#### Impact on Twitter

- Prevents "scroll chaining" (wheel scroll jumping from gallery to Twitter page)
- Ensures smooth gallery experience
- Twitter page remains fully functional when gallery is not scrolling
- Twitter scroll resumes immediately after gallery scroll ends

#### Event Details

- **Event Type**: `wheel` (mouse wheel)
- **Capture Phase**: `true` (capture phase for priority)
- **Passive Mode**: `false` (required to call preventDefault)
- **Target Container**: Twitter's scroll container (typically
  `[data-testid="primaryColumn"]` or `main[role="main"]`)

#### Listener Management

```typescript
// Lines 269-298
const attachTwitterListener = (candidate: HTMLElement | null) => {
  if (!candidate) {
    detachTwitterListener();
    return;
  }

  // Register wheel listener
  twitterListenerId = addListener(
    candidate,
    'wheel',
    preventTwitterScroll as EventListener,
    {
      capture: TWITTER_WHEEL_CAPTURE, // true
      passive: false, // Required for preventDefault
    }
  );
};

const detachTwitterListener = () => {
  if (twitterListenerId) {
    removeEventListenerManaged(twitterListenerId);
    twitterListenerId = null;
  }
};
```

#### Dynamic Listener Monitoring

```typescript
// Lines 312-323
if (shouldBlockTwitterScroll) {
  refreshTwitterListener();

  // Monitor DOM for Twitter container changes
  const body = document.body;
  if (body && typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(() => {
      refreshTwitterListener(); // Re-attach if Twitter DOM changes
    });

    mutationObserver.observe(body, {
      childList: true,
      subtree: true,
    });
  }
}
```

**Classification**: ⚠️ **INTENTIONAL** - Necessary for core scroll functionality

---

### 2. **Twitter DOM Structure Monitoring** (Continuous)

#### Location

`src/features/gallery/hooks/useGalleryScroll.ts` (lines 312-323)

#### Description

The userscript uses **MutationObserver** to monitor Twitter page DOM changes and
re-attach scroll listeners when Twitter's page structure changes.

#### Code Implementation

```typescript
mutationObserver = new MutationObserver(() => {
  refreshTwitterListener(); // Re-detect and re-attach listener
});

mutationObserver.observe(body, {
  childList: true, // Monitor child additions/removals
  subtree: true, // Monitor entire tree, not just body
});
```

#### Impact on Twitter

- **Performance**: Continuous DOM observation (may impact performance)
- **Functionality**: No direct modification of Twitter DOM
- **Reversibility**: Automatically cleaned up when gallery closes

#### Listener Lifecycle

- **Active During**: Gallery open + `blockTwitterScroll` enabled
- **Cleanup**: Automatically disconnected on gallery close or when feature
  disabled
- **Details**: Re-attaches scroll blocking listener when Twitter DOM structure
  changes (e.g., navigation)

**Classification**: ⚠️ **NECESSARY** - Required to handle Twitter's dynamic SPA
structure

---

### 3. **Twitter Scroll Container Refresh** (On Unmount)

#### Location

`src/shared/components/isolation/GalleryContainer.tsx` (lines 145-157)

#### Description

When gallery is closed/unmounted, the userscript **reads `scrollHeight`
property** of Twitter's scroll container to trigger layout recalculation.

#### Code Implementation

```typescript
// Phase 300.1: Twitter scroll container optimization
if (
  window.location.hostname === 'x.com' ||
  window.location.hostname === 'twitter.com'
) {
  const twitterScroll = findTwitterScrollContainer();
  if (twitterScroll) {
    // Trigger layout recalculation by reading scrollHeight property
    void twitterScroll.scrollHeight;

    logger.debug(
      'Twitter scroll container refreshed for restoration compatibility'
    );
  }
}
```

#### Justification

- **Purpose**: Help Twitter's built-in scroll restoration logic recalculate
  viewport
- **Mechanism**: Property read forces browser layout recalculation
- **Scope**: Twitter pages only (`x.com`, `twitter.com`)

#### Impact on Twitter

- **Direct DOM Modification**: ❌ None
- **Layout Impact**: Minimal (one property read triggers reflow)
- **Functionality**: May improve scroll restoration accuracy after gallery close
- **Reversibility**: Passive operation, no persistent state change

**Classification**: ⚠️ **OPTIMIZATION** - Performance-related, aids Twitter's
native scroll restoration

---

### 4. **Twitter Scroll Container Detection**

#### Location

`src/shared/utils/core-utils.ts` (lines 61-77)

#### Description

The userscript queries multiple selectors to find Twitter's scroll container.

#### Code Implementation

```typescript
export function findTwitterScrollContainer(): HTMLElement | null {
  const selectors = [
    '[data-testid="primaryColumn"]', // Primary content area
    'main[role="main"]', // Main semantic element
    '.css-1dbjc4n[data-at-shortcutkeys]', // Fallback class-based selector
    'body', // Fallback to body
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      return element;
    }
  }

  return document.body;
}
```

#### Impact on Twitter

- **Observation Only**: Uses `querySelector` (no modification)
- **Multiple Attempts**: Tries 4 selectors to find correct container
- **Fallback**: Defaults to `body` if specific containers not found

**Classification**: ✅ **NON-INTRUSIVE** - Read-only DOM queries

---

## 📊 Interference Matrix

| Category                | Scope            | Active When                    | Reversible             | Impact                          | Risk   |
| ----------------------- | ---------------- | ------------------------------ | ---------------------- | ------------------------------- | ------ |
| **Scroll Blocking**     | Wheel events     | Gallery open + scrolling       | Yes (configurable)     | High (prevents scroll chaining) | Medium |
| **DOM Monitoring**      | MutationObserver | Gallery open + feature enabled | Yes (cleanup on close) | Medium (continuous observation) | Low    |
| **Scroll Refresh**      | Property read    | Gallery unmount                | Yes (passive)          | Low (one-time reflow)           | Low    |
| **Container Detection** | Query-only       | Any time needed                | Yes (non-destructive)  | None (observation only)         | None   |

---

## ⚙️ Configuration & Control

### Programmatic Options

#### `blockTwitterScroll` (useGalleryScroll hook)

```typescript
const scrollManager = useGalleryScroll({
  container: galleryRef,
  blockTwitterScroll: true, // Enable: block Twitter scroll during gallery scroll
  // or
  blockTwitterScroll: false, // Disable: allow simultaneous scroll chaining
});
```

**Default**: `true` (blocking enabled) **Scope**: Per-gallery instance
**Cleanup**: Automatic on gallery close

#### Event Listener States

- **Attached**: Gallery open + `blockTwitterScroll: true`
- **Detached**: Gallery closed OR `blockTwitterScroll: false`
- **Re-attached**: When Twitter DOM structure changes (via MutationObserver)

---

## 🧹 Cleanup & Resource Management

### Gallery Close Sequence (src/shared/components/isolation/GalleryContainer.tsx)

1. **Call Solid.js dispose**: `host[DISPOSE_SYMBOL]?.()`
2. **Remove DOM children**:
   `while (container.firstChild) { container.removeChild(container.firstChild); }`
3. **Twitter scroll refresh**: Read `scrollHeight` for reflow
4. **Event manager cleanup**: All listeners removed
5. **MutationObserver disconnect**: `mutationObserver?.disconnect()`
6. **Clear timeouts**: Scroll-related timers cleared

**Result**: Zero event listeners, zero observers, zero timeouts remain

---

## 📐 Architectural Alignment

### Project Principles (from AGENTS.md)

```markdown
## Core Principles

1. **Vendor Getters**: `getSolid()`, `getUserscript()`
2. **PC-Only Events**: No touch/pointer (Phase 242-243)
3. **Design Tokens**: `oklch()` colors, `rem`/`em` sizes, `--xeg-*` vars
4. **Service Layer**: Use Tampermonkey APIs via services (not direct GM calls)
```

### Compliance Assessment

| Principle                | Compliance | Note                                                       |
| ------------------------ | ---------- | ---------------------------------------------------------- |
| **Vendor Getters**       | ✅ Full    | Uses `getSolid()` for Solid.js                             |
| **PC-Only Events**       | ✅ Full    | Wheel events (not touch/pointer)                           |
| **Service Layer**        | ✅ Full    | Uses EventManager service (not direct addEventListener)    |
| **Minimal Interference** | ⚠️ Partial | Necessary blocking of scroll events for core functionality |

---

## 🔧 Review Recommendations

### Candidates for Removal (0)

- **✅ All interference is NECESSARY** for core gallery functionality
- Scroll blocking prevents scroll chaining (critical UX)
- DOM monitoring required for Twitter's SPA structure
- Scroll refresh optimizes restoration behavior

### Candidates for Optimization (2)

1. **MutationObserver Scope** (Performance)
   - **Current**: Monitors entire `body` subtree
   - **Recommendation**: Consider limiting to specific Twitter containers
   - **Trade-off**: Reduced performance impact vs. missed DOM changes
   - **Priority**: Low

2. **Scroll Container Selectors** (Compatibility)
   - **Current**: 4-selector fallback chain
   - **Recommendation**: Monitor Twitter updates for selector stability
   - **Trade-off**: Ensure detection works across Twitter versions
   - **Priority**: Medium

### Candidates for Enhancement (1)

1. **Configurable Interference Level**
   - **Option A**: Current (blocking enabled/disabled)
   - **Option B**: Add granular control (e.g., "soft" blocking vs "hard"
     blocking)
   - **Priority**: Low
   - **Effort**: Medium

---

## 🎯 Conclusion

### Summary

The X.com Enhanced Gallery userscript maintains **minimal interference** with
Twitter page functionality:

- **4 interference points** identified
- **All are INTENTIONAL** and serve core functionality
- **All are REVERSIBLE** and cleanup on gallery close
- **NONE violate** project architectural principles

### Recommendation

✅ **APPROVE ALL INTERFERENCE** - Necessary for core functionality, well-managed
lifecycle, minimal impact

### Next Steps

1. ✅ Review this analysis for completeness
2. ⏳ Decide: Proceed with npm run build validation
3. ⏳ Monitor performance metrics if MutationObserver optimization needed
   (future phase)

---

## 📎 References

- **Project Architecture**: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- **AI Guidelines**: [AGENTS.md](../AGENTS.md)
- **Core Hook**:
  [src/features/gallery/hooks/useGalleryScroll.ts](../src/features/gallery/hooks/useGalleryScroll.ts)
- **Component**:
  [src/shared/components/isolation/GalleryContainer.tsx](../src/shared/components/isolation/GalleryContainer.tsx)
- **Utilities**:
  [src/shared/utils/core-utils.ts](../src/shared/utils/core-utils.ts)

---

**Generated**: 2025-11-07 **Status**: ✅ Ready for npm run build validation
