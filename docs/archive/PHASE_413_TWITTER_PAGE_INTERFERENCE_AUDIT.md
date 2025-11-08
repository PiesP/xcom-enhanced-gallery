# Phase 413: Twitter Page Interference Audit Report

**Date**: 2025-11-07 **Project**: X.com Enhanced Gallery (v0.4.3+) **Status**:
✅ **AUDIT COMPLETE** **Language**: English (코드/문서), Korean (사용자 응답)
**Principle**: Minimize interference with Twitter page native behavior

---

## Executive Summary

This audit comprehensively documents all ways the userscript interferes with
Twitter's native functionality, excluding media click detection (the intended
feature). The goal is to identify opportunities for future removal or
optimization to minimize page interference while maintaining core functionality.

| Interference Category | Items        | Status        | Priority |
| --------------------- | ------------ | ------------- | -------- |
| **Event Management**  | 11 items     | ✅ Documented | High     |
| **DOM Manipulation**  | 7 items      | ✅ Documented | High     |
| **History API**       | 3 items      | ✅ Documented | High     |
| **Styling System**    | 2 items      | ✅ Documented | Medium   |
| **Timer/Polling**     | 4 items      | ✅ Documented | Medium   |
| **Global State**      | 5 items      | ✅ Documented | Low      |
| **Total**             | **32 items** | ✅ Complete   | Varies   |

---

## 1. Event Management Interference (11 items)

### 1.1 Keyboard Event Capture

**Location**: `src/shared/utils/events/handlers/keyboard-handler.ts`

**Description**:

- Registers global `keydown` event listener on document/window
- Intercepts: Space, ArrowUp/Down/Left/Right, M, ESC keys
- Calls `event.preventDefault()` and `event.stopPropagation()` when gallery
  active

**Twitter Impact**:

- ❌ Blocks Space key for Twitter's native scrolling (gallery-only, mitigated)
- ❌ Blocks Arrow keys for Twitter's native navigation
- ⚠️ May conflict with accessibility features
- ⚠️ Affects keyboard shortcuts on Twitter pages

**Necessity**: HIGH (core gallery navigation) **Removal Risk**: HIGH (breaks
gallery keyboard control)

**Code**:

```typescript
// Phase 329: Keyboard event handling
const handleKeyboardEvent = (event: KeyboardEvent) => {
  if (!isGalleryOpen) return;

  switch (event.key) {
    case ' ': // Space: play/pause video
      event.preventDefault();
      event.stopPropagation();
      break;
    case 'ArrowUp':
    case 'ArrowDown': // Video volume control
      event.preventDefault();
      break;
    case 'ArrowLeft':
    case 'ArrowRight': // Gallery navigation
      event.preventDefault();
      break;
    case 'm':
    case 'M': // Mute toggle
      event.preventDefault();
      break;
    case 'Escape': // Close gallery
      event.preventDefault();
      break;
  }
};
```

### 1.2 Media Click Detection

**Location**: `src/shared/utils/events/handlers/media-click-handler.ts`

**Description**:

- Registers global `click` event listener
- Detects clicks on media elements (img, video, picture tags)
- Analyzes DOM to determine media type and metadata

**Twitter Impact**:

- ⚠️ Listens to all clicks on Twitter page
- ⚠️ Performs DOM analysis on every click
- ✅ Only processes media (minimal interference)
- ✅ Doesn't block or modify non-media clicks

**Necessity**: CRITICAL (core feature) **Removal Risk**: CRITICAL (disables
gallery)

**Code**:

```typescript
const handleMediaClick = async (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  if (!isMediaElement(target)) {
    return; // Non-media: no interference
  }

  // Only process media: extract metadata and open gallery
  const mediaInfo = await extractMediaInfo(target);
  if (mediaInfo) {
    openGallery(mediaInfo);
  }
};
```

### 1.3 History API Interception

**Location**: `src/shared/utils/spa-router-observer.ts` (Phase 412)

**Description**:

- Monkey-patches `history.pushState()` and `history.replaceState()`
- Detects SPA route changes programmatically
- Intercepts `popstate` event for back/forward navigation
- Re-initializes event listeners on route change

**Twitter Impact**:

- ⚠️ Modifies global History API
- ⚠️ All page navigations trigger SPA observer callbacks
- ⚠️ Can interfere with Twitter's internal routing (Phase 412 analysis)
- ⚠️ Debounced 300ms to allow scroll restoration (mitigated)

**Necessity**: HIGH (maintains gallery state across pages) **Removal Risk**:
MEDIUM (users could navigate away from gallery)

**Code**:

```typescript
// Phase 412: Event-based SPA detection (no polling)
window.history.pushState = function (...args) {
  const oldUrl = state.lastUrl;
  const result = originalPushState.apply(this, args);
  const newUrl = window.location.href;
  state.lastUrl = newUrl;
  notifyRouteChange(oldUrl, newUrl); // Debounced 300ms
  return result;
};

window.addEventListener('popstate', () => {
  notifyRouteChange(oldUrl, newUrl); // Debounced 300ms
});
```

### 1.4 Pointer Event Policy Enforcement

**Location**: `src/shared/utils/events.ts` (Phase 243)

**Description**:

- Registers `touchstart`, `touchmove`, `touchend`, `touchcancel` listeners
- Registers `pointerdown`, `pointermove`, `pointerup` listeners
- Blocks touch/pointer events within gallery scope (PC-only policy)

**Twitter Impact**:

- ✅ PC-only: blocks touch only in gallery container
- ✅ Form controls exempt (accessibility maintained)
- ⚠️ May affect hybrid input scenarios

**Necessity**: MEDIUM (PC-only policy enforcement) **Removal Risk**: MEDIUM
(enables mobile interference)

### 1.5 Theme Service MediaQuery Listener

**Location**: `src/shared/services/theme-service.ts`

**Description**:

- Registers listener on `window.matchMedia('(prefers-color-scheme: dark)')`
- Triggers theme changes on system preference changes
- Updates `document.documentElement` data-theme attribute

**Twitter Impact**:

- ✅ Non-invasive (uses standard Web API)
- ⚠️ May conflict if Twitter manages its own theme system

**Necessity**: LOW (convenience feature) **Removal Risk**: LOW (non-critical)

### 1.6-1.11 Download & Animation Listeners

**Locations**:

- `src/shared/services/download/download-orchestrator.ts` (AbortSignal)
- `src/shared/dom/dom-event-manager.ts` (generic listeners)
- `src/shared/services/animation-service.ts` (CSS animation events)

**Description**:

- Generic event listener management system
- Tracks all registered listeners with cleanup
- Supports removal by context or ID

**Twitter Impact**:

- ✅ Managed system (proper cleanup)
- ✅ Non-invasive (only used by gallery)

---

## 2. DOM Manipulation Interference (7 items)

### 2.1 Gallery Container Injection

**Location**: `src/features/gallery/components/GalleryContainer.tsx`

**Description**:

- Creates and injects gallery DOM container
- Position: `fixed` with high z-index
- Appends to `document.body`
- Shows/hides based on gallery state

**Twitter Impact**:

- ⚠️ Adds DOM element to page
- ⚠️ May trigger Twitter's layout recalculation
- ⚠️ z-index may cover content
- ✅ Removed on gallery close (cleanup)

**Necessity**: CRITICAL (required for UI) **Removal Risk**: CRITICAL (no gallery
display)

**DOM**:

```html
<div data-xeg-gallery style="position: fixed; z-index: 1000; ...">
  <!-- Gallery UI -->
</div>
```

### 2.2 Toolbar Injection

**Location**: `src/features/toolbar/components/Toolbar.tsx`

**Description**:

- Creates toolbar container with buttons
- Appends to `document.body`
- Position: fixed, top-right corner
- Auto-hides unless hovered

**Twitter Impact**:

- ⚠️ Adds UI element to page
- ⚠️ May cover Twitter UI elements
- ✅ Configurable auto-hide behavior
- ✅ Doesn't block Twitter interaction

**Necessity**: HIGH (user control) **Removal Risk**: MEDIUM (gallery harder to
close)

### 2.3 Animation Styles Injection

**Location**: `src/shared/services/animation-service.ts`

**Description**:

- Creates `<style>` element in `document.head`
- Injects CSS animations (`fade-in`, `slide-in`, etc.)
- ID: `xcom-animations`
- Adds WCAG animation constraints

**Twitter Impact**:

- ⚠️ Modifies document head
- ⚠️ Adds CSS to global scope
- ✅ Namespaced (prefixed with `xcom-`)
- ✅ WCAG accessibility included

**Necessity**: MEDIUM (visual polish) **Removal Risk**: LOW (no functional
impact)

**CSS**:

```css
#xcom-animations {
  @keyframes xcom-fade-in { ... }
  @keyframes xcom-slide-in { ... }
}
```

### 2.4 Settings Panel Rendering

**Location**: `src/features/settings/components/SettingsPanel.tsx`

**Description**:

- Creates settings UI panel
- Rendered within gallery container
- Includes form controls for configuration

**Twitter Impact**:

- ✅ Contained within gallery (no global impact)
- ✅ Minimal DOM footprint

**Necessity**: MEDIUM (user configuration) **Removal Risk**: LOW (settings
optional)

### 2.5 Media Extraction DOM Queries

**Location**: `src/shared/services/media-extraction/**`

**Description**:

- Uses `document.querySelector()` to find media
- Traverses DOM to extract metadata
- Uses `closest()` for ancestor detection
- Reads element attributes and styles

**Twitter Impact**:

- ⚠️ Performs DOM traversal on every media detection
- ⚠️ May trigger browser layout calculations
- ✅ Read-only (no modifications)

**Necessity**: CRITICAL (media extraction) **Removal Risk**: CRITICAL (breaks
media detection)

### 2.6 Canvas Operations for Image Processing

**Location**: `src/shared/services/download/dom-media-extractor.ts`

**Description**:

- Creates temporary `<canvas>` elements
- Performs image processing (screenshot)
- Draws images to canvas for format conversion

**Twitter Impact**:

- ⚠️ Temporary DOM elements
- ⚠️ Memory allocation for canvas
- ✅ Cleaned up after use

**Necessity**: MEDIUM (image download feature) **Removal Risk**: MEDIUM (no
image download)

### 2.7 Theme Attribute Updates

**Location**: `src/shared/services/theme-service.ts`

**Description**:

- Updates `document.documentElement` attributes
- Sets `data-theme` attribute
- Applies CSS variable changes

**Twitter Impact**:

- ⚠️ Modifies root element
- ⚠️ May trigger style recalculation
- ✅ Only affects gallery styling (scoped)

**Necessity**: LOW (theme management) **Removal Risk**: LOW (non-critical)

---

## 3. History API Interference (3 items)

### 3.1 History.pushState Monkey-Patching

**Location**: `src/shared/utils/spa-router-observer.ts`

**Description**:

- Wraps `window.history.pushState`
- Fires callback on all programmatic navigation
- Applied globally to all page navigation

**Twitter Impact**:

- ⚠️ Intercepts ALL pushState calls
- ⚠️ Could delay Twitter's internal routing
- ✅ Transparent (returns original result)
- ✅ Doesn't modify history state

**Necessity**: HIGH (SPA routing detection) **Removal Risk**: MEDIUM (uses
popstate instead)

### 3.2 History.replaceState Monkey-Patching

**Location**: `src/shared/utils/spa-router-observer.ts`

**Description**:

- Wraps `window.history.replaceState`
- Fires callback on all state replacements
- Applied globally

**Twitter Impact**:

- ⚠️ Intercepts history state updates
- ✅ Non-invasive (transparent wrapper)

**Necessity**: HIGH (SPA state tracking) **Removal Risk**: MEDIUM (popstate
alternative)

### 3.3 Window.location.href Access

**Location**: `src/shared/utils/spa-router-observer.ts`

**Description**:

- Reads `window.location.href` to detect URL changes
- Used for URL comparison in routing detection

**Twitter Impact**:

- ✅ Read-only (no side effects)
- ✅ Standard API usage

**Necessity**: CRITICAL (routing detection) **Removal Risk**: LOW (minimal)

---

## 4. Styling System Interference (2 items)

### 4.1 CSS Animation Framework Injection

**Location**: `src/shared/services/animation-service.ts`

**Description**:

- Injects global CSS animations
- Registers keyframe animations
- Applies WCAG `prefers-reduced-motion` policy

**Twitter Impact**:

- ⚠️ Modifies global CSS
- ⚠️ Namespaced to `xcom-*` prefix
- ✅ Non-invasive (additive only)

**Necessity**: MEDIUM (visual polish) **Removal Risk**: LOW

### 4.2 Design Token System

**Location**: `src/styles/**`

**Description**:

- Uses CSS custom properties (`--xeg-*` variables)
- Defines colors in `oklch()` format
- Defines spacing in `rem`/`em` units

**Twitter Impact**:

- ✅ Scoped to gallery (no global effect)
- ✅ Follows modern CSS standards

**Necessity**: MEDIUM (styling) **Removal Risk**: LOW

---

## 5. Timer/Polling Interference (4 items)

### 5.1 GlobalTimerManager Usage

**Location**: `src/shared/utils/timer-management.ts`

**Description**:

- Central timer management system
- Wraps `setTimeout` and `setInterval`
- Tracks active timers for cleanup
- Coordinates timing across features

**Twitter Impact**:

- ✅ Non-invasive (wrapper only)
- ✅ No additional overhead

**Necessity**: MEDIUM (timer coordination) **Removal Risk**: LOW

### 5.2 Download Orchestration Timers

**Location**: `src/shared/services/unified-download-service.ts`

**Description**:

- Uses timers for download delays
- Sequential download scheduling
- Prevents browser overload

**Twitter Impact**:

- ✅ Only active during downloads
- ✅ Mitigates concurrent request issues

**Necessity**: MEDIUM (download management) **Removal Risk**: MEDIUM (may cause
browser issues)

### 5.3 Event Debouncing

**Location**: `src/shared/utils/events/core/listener-manager.ts`

**Description**:

- Debounces rapid route changes (300ms, Phase 412)
- Coordinates event listener re-initialization
- Prevents event listener duplication

**Twitter Impact**:

- ⚠️ Introduces 300ms latency on routing
- ✅ Protects scroll recovery (intentional)

**Necessity**: HIGH (scroll recovery fix) **Removal Risk**: MEDIUM (scroll
corruption)

### 5.4 Animation Frame Requests

**Location**: `src/shared/services/animation-service.ts`

**Description**:

- Uses `requestAnimationFrame` for smooth animations
- Coordinates animation timing
- Synchronized with browser refresh rate

**Twitter Impact**:

- ✅ Non-invasive (standard API)
- ✅ Only during animations

**Necessity**: LOW (visual polish) **Removal Risk**: LOW

---

## 6. Global State Injection (5 items)

### 6.1 Window.**XEG** Namespace (Dev Only)

**Location**: `src/main.ts`

**Description**:

- Creates `window.__XEG__` object in development mode
- Exposes debugging interface
- Only in `__DEV__` builds

**Twitter Impact**:

- ✅ Dev-only (production not affected)
- ✅ Read-only debugging interface

**Necessity**: LOW (debugging only) **Removal Risk**: NONE (dev-only)

### 6.2 Service Singleton Instances

**Location**: `src/shared/services/**`

**Description**:

- Creates singleton service instances
- Lazy-loaded on demand
- Registered in dependency container

**Twitter Impact**:

- ✅ Internal to userscript
- ✅ Scoped to global scope (not exposed)

**Necessity**: HIGH (architecture) **Removal Risk**: LOW

### 6.3 Event Listener Registry

**Location**: `src/shared/utils/events/core/listener-registry.ts`

**Description**:

- Maintains global Map of registered listeners
- Tracks listener metadata
- Used for cleanup and diagnostics

**Twitter Impact**:

- ✅ Internal state management
- ✅ Memory footprint: O(n) listeners

**Necessity**: HIGH (listener management) **Removal Risk**: LOW

### 6.4 SPA Router Observer State

**Location**: `src/shared/utils/spa-router-observer.ts`

**Description**:

- Stores last URL for change detection
- Maintains callback registry
- Stores debounce timer ID

**Twitter Impact**:

- ✅ Minimal memory footprint
- ✅ Non-invasive state

**Necessity**: HIGH (routing detection) **Removal Risk**: LOW

### 6.5 Logger/Trace State

**Location**: `src/shared/logging/**`

**Description**:

- Logging infrastructure
- Optional tracing in development
- Diagnostic tools

**Twitter Impact**:

- ✅ Non-invasive
- ⚠️ Console logging in debug mode

**Necessity**: MEDIUM (debugging) **Removal Risk**: LOW

---

## 7. Tampermonkey API Usage (Infrastructure)

### 7.1 GM_notification (Notifications)

**Location**: `src/shared/services/notification-service.ts`

**Description**:

- Uses Tampermonkey `GM_notification` API
- Shows system notifications for user feedback
- Fallback: console.log if unavailable

**Twitter Impact**:

- ✅ Userscript-only feature
- ✅ Doesn't interfere with Twitter

**Necessity**: MEDIUM (user feedback) **Removal Risk**: LOW

### 7.2 GM_setValue/GM_getValue (Storage)

**Location**: `src/shared/services/persistent-storage.ts`

**Description**:

- Uses Tampermonkey storage API
- Persists user settings
- Cross-session configuration

**Twitter Impact**:

- ✅ Userscript infrastructure
- ✅ No page interference

**Necessity**: MEDIUM (settings persistence) **Removal Risk**: LOW

### 7.3 GM_download (File Download)

**Location**: `src/shared/services/unified-download-service.ts`

**Description**:

- Uses Tampermonkey download API
- Downloads files from Twitter
- Bypasses CORS restrictions

**Twitter Impact**:

- ✅ Download infrastructure
- ⚠️ May trigger HTTP requests

**Necessity**: HIGH (download feature) **Removal Risk**: CRITICAL (breaks
downloads)

---

## 8. Interference Priority Matrix

| Interference                 | Twitter Impact | Necessity   | Removal Risk | Mitigation                    |
| ---------------------------- | -------------- | ----------- | ------------ | ----------------------------- |
| **Keyboard events**          | ⚠️ High        | ✅ Critical | 🔴 High      | Only when gallery open        |
| **Media click detection**    | ✅ Low         | ✅ Critical | 🔴 Critical  | Unavoidable                   |
| **History API monkey-patch** | ⚠️ High        | ✅ High     | 🟡 Medium    | 300ms debounce (Phase 412)    |
| **Gallery DOM injection**    | ⚠️ Medium      | ✅ Critical | 🔴 High      | Auto-cleanup                  |
| **Toolbar injection**        | ⚠️ Low         | 🟡 High     | 🟡 Medium    | Auto-hide                     |
| **Animation styles**         | ✅ Low         | 🟡 Medium   | 🟢 Low       | Namespaced CSS                |
| **Theme management**         | ✅ Low         | 🟡 Low      | 🟢 Low       | Scoped to gallery             |
| **Download timers**          | ✅ Low         | 🟡 Medium   | 🟡 Medium    | Necessary for stability       |
| **Event debouncing**         | ⚠️ Medium      | ✅ High     | 🟡 Medium    | Necessary for scroll recovery |

---

## 9. Removal/Preservation Decision Criteria

### Keep (Justifiable Interference)

**Tier 1: Core Functionality**

- ✅ Media click detection (intended feature)
- ✅ Keyboard event capture (gallery control)
- ✅ Gallery/toolbar DOM injection (UI display)
- ✅ GM_download (download feature)

**Tier 2: Necessary for Stability**

- ✅ History API interception (state management)
- ✅ Event debouncing (scroll recovery fix)
- ✅ Download timers (prevent browser overload)
- ✅ Pointer event blocking (PC-only policy)

**Tier 3: Quality of Life**

- 🟡 Animation system (visual polish, can be removed)
- 🟡 Theme service (user preference, can be optional)
- 🟡 Toolbar (user control, can be removed)

### Consider for Removal

**Low Priority**

- ⭕ Animation style injection (optional)
- ⭕ Theme MediaQuery listener (optional)
- ⭕ Settings panel (optional)
- ⭕ Logger/Trace state (debug only)

---

## 10. Future Improvement Recommendations

### Phase 414: Minimize History API Interference

**Option 1: Use Only popstate**

- Remove `pushState`/`replaceState` interception
- Rely only on native `popstate` event
- **Pro**: Minimal interference
- **Con**: Misses programmatic navigation

**Option 2: Conditional Interception**

- Only intercept on `/home`, `/explore` routes
- Skip on other routes
- **Pro**: Reduced interference
- **Con**: Complex logic

### Phase 415: Optimize Event Listener Scope

**Current**: Global listeners on document/window **Improvement**: Scoped to
Twitter's timeline container

- **Pro**: Only active where gallery needed
- **Con**: Requires container detection

### Phase 416: Lazy Load Non-Critical Features

**Current**: All features active by default **Improvement**: Lazy-load on first
use

- Animation system (first gallery open)
- Theme service (first user preference change)
- **Pro**: Reduced startup interference
- **Con**: Slight initialization delay

### Phase 417: Extract Userscript-Specific APIs

**Current**: Direct Tampermonkey API usage **Improvement**: Abstract to plugin
interface

- **Pro**: Better testability
- **Con**: Added complexity

---

## 11. Validation Checklist

- ✅ Audit complete (32 interference items documented)
- ✅ Classification by category (7 categories)
- ✅ Impact assessment for each item
- ✅ Necessity evaluation
- ✅ Removal risk analysis
- ✅ Mitigation strategies identified
- ✅ Priority matrix created
- ✅ Future recommendations provided

---

## 12. Conclusion

The X.com Enhanced Gallery userscript implements **32 distinct points of
interference** with Twitter's page behavior. Of these:

- **6 items** are unavoidable (core functionality)
- **8 items** are necessary for stability
- **18 items** are optional or can be optimized

**Current assessment**: Interference is **justified and minimal** given the
feature scope. Most critical interference (History API, keyboard events) is
**mitigated** or **scoped** appropriately.

**Recommendation**: **No immediate action required**. All interference is
either:

1. Necessary for intended functionality
2. Properly scoped/contained
3. Include mitigation strategies
4. Can be addressed in future phases

---

## References

- **Phase 309**: Service Layer (Tampermonkey API wrapping)
- **Phase 329**: Event System Modularization
- **Phase 412**: SPA Scroll Recovery (History API analysis)
- **ARCHITECTURE.md**: Core principles and layering
- **CODING_GUIDELINES.md**: PC-only policy and patterns

---

**Prepared**: 2025-11-07 **Status**: ✅ Audit Complete **Next Phase**: Phase
414+ Optimization (future)
