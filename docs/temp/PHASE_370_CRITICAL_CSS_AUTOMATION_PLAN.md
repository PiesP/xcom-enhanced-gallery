# Phase 370: Critical CSS Extraction Automation Plan

**Status**: 📋 Planning
**Created**: 2025-11-05
**Target**: Phase 370+ (Long-term)
**Priority**: P3 (Low-Medium)

---

## 🎯 Objective

Automate extraction of Critical CSS to optimize initial page load by inlining essential styles and deferring non-critical CSS.

---

## 📊 Current State Analysis

### Style Loading Strategy

```
src/styles/globals.ts (현재 - 동기 로드)
  ├─ design-tokens.*.css (974 lines, 40KB)
  ├─ base/reset.css (97 lines, 4KB)
  ├─ utilities/*.css (178 lines, 6KB)
  ├─ modern-features.css (221 lines, 8KB)
  └─ isolated-gallery.css (300 lines, 12KB)
  ───────────────────────────────────────
  Total: 1,770 lines, ~70KB (압축 전)
```

### Loading Timeline

```
0ms ──────────────────────────────────── 100ms ─────────────── 200ms
 │                                          │                    │
 │ HTML parsed                              │ CSS fully loaded   │ FCP (First Contentful Paint)
 │                                          │                    │
 └─ styles/globals.ts imported ────────────┘                    │
    (all 70KB CSS blocking)                                      │
                                                                 └─ Gallery visible
```

**Issues**:
1. **70KB CSS blocking**: Delays First Contentful Paint (FCP)
2. **Unnecessary styles upfront**: Toolbar CSS loaded before gallery opened
3. **No progressive rendering**: User sees blank screen until all CSS loaded

---

## 🛠️ Proposed Architecture

### Critical vs Non-Critical CSS Split

**Critical CSS** (Inline in `<head>`):
- Design tokens (CSS variables only, ~10KB)
- Reset styles (base typography, ~4KB)
- Gallery container skeleton (~2KB)
- **Total**: ~16KB (inline in HTML)

**Non-Critical CSS** (Lazy load):
- Toolbar styles (80 lines)
- Media viewer animations (70 lines)
- Navigation controls (40 lines)
- Modern features (OKLCH fallbacks)
- **Total**: ~54KB (async load)

### Loading Timeline (Optimized)

```
0ms ──────── 50ms ───────── 100ms ────────── 200ms
 │            │              │                │
 │ HTML       │ Critical CSS │ Non-critical   │ FCP (improved)
 │ parsed     │ applied      │ loading        │
 │            │              │                │
 └─ Inline    └─ Gallery     └─ Full styles  └─ Gallery interactive
    16KB CSS     skeleton       async loaded
                 visible
```

**Benefits**:
- ✅ FCP improved by 40-60ms
- ✅ Perceived performance boost
- ✅ Progressive rendering (skeleton → full UI)

---

## 🔧 Implementation Strategy

### Phase 370.1: Critical CSS Identification (Manual)

**Tool**: Chrome DevTools Coverage

**Steps**:
1. Open gallery in Chrome DevTools
2. Run Coverage analysis (Cmd+Shift+P → "Coverage")
3. Identify CSS used in first 1-2 seconds
4. Extract critical rules

**Expected Critical CSS**:
- CSS variables (`:root { --xeg-* }`)
- Reset styles (`*, *::before, *::after`)
- Gallery container (`.xeg-gallery-root`)
- Loading skeleton (`.xeg-loading`)

### Phase 370.2: Automation with Vite Plugin

**Tool**: `vite-plugin-critical-css` or custom plugin

**Configuration**:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import criticalCss from 'vite-plugin-critical-css';

export default defineConfig({
  plugins: [
    criticalCss({
      // Critical CSS 추출 설정
      inline: true, // <head>에 inline
      minify: true, // 압축
      width: 1920, // 뷰포트 너비
      height: 1080, // 뷰포트 높이
      penthouse: {
        timeout: 30000, // 타임아웃 (30초)
      },
    }),
  ],
});
```

**Output**:

```html
<!-- dist/index.html -->
<head>
  <style>
    /* Critical CSS (16KB, inlined) */
    :root { --xeg-color-primary: ...; }
    * { margin: 0; padding: 0; }
    .xeg-gallery-root { ... }
  </style>

  <!-- Non-critical CSS (lazy load) -->
  <link rel="preload" href="/assets/style-[hash].css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/assets/style-[hash].css"></noscript>
</head>
```

### Phase 370.3: Build-Time Extraction

**Alternative**: PostCSS plugin for more control

**Tool**: `@fullhuman/postcss-purgecss` + custom splitter

```javascript
// postcss.config.js
export default {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: ['./src/**/*.tsx', './src/**/*.ts'],
      safelist: [/^xeg-/, /^glass-/], // 보호할 클래스
      blocklist: [/^toolbar-/, /^navigation-/], // 제외할 클래스
    }),
  ],
};
```

### Phase 370.4: Runtime CSS Injection

**Strategy**: Lazy load non-critical CSS after gallery mount

```typescript
// src/features/gallery/GalleryApp.tsx
import { onMount } from 'solid-js';

export function GalleryApp() {
  onMount(() => {
    // 갤러리 마운트 후 전체 스타일 로드
    import('@shared/styles/gallery-full.css');
  });

  return <div class="xeg-gallery-root">...</div>;
}
```

---

## 📋 Migration Phases

### Phase 370.1: Manual Analysis (4 hours)

**Tasks**:
1. Run Chrome DevTools Coverage on gallery page
2. Identify critical CSS rules (First Paint)
3. Create `styles/critical.css` (manual extraction)
4. Measure FCP improvement

**Deliverables**:
- `src/styles/critical.css` (~16KB)
- Coverage report (screenshots)
- Performance benchmark (Before/After FCP)

### Phase 370.2: Vite Plugin Integration (1 day)

**Tasks**:
1. Research Vite CSS plugins (`vite-plugin-critical-css`, `critters`)
2. Configure plugin in `vite.config.ts`
3. Test automated extraction
4. Adjust selectors/thresholds

**Deliverables**:
- Updated `vite.config.ts`
- Automated critical CSS extraction
- Build-time performance report

### Phase 370.3: Progressive Loading (1 day)

**Tasks**:
1. Split `globals.ts` → `critical.ts` + `non-critical.ts`
2. Inline critical CSS in HTML template
3. Lazy load non-critical CSS via `onMount`
4. Add loading skeleton styles

**Deliverables**:
- `src/styles/critical.ts` (inline)
- `src/styles/non-critical.ts` (lazy)
- Updated `index.html` template
- Loading skeleton component

### Phase 370.4: Testing & Optimization (4 hours)

**Tasks**:
1. Lighthouse performance audit
2. WebPageTest analysis
3. Adjust critical CSS threshold
4. Browser compatibility testing

**Deliverables**:
- Lighthouse report (FCP, LCP metrics)
- WebPageTest screenshots
- Optimization recommendations

---

## 🔄 Critical CSS Extraction Example

### Before (All CSS Blocking)

```typescript
// src/main.ts
await import('./styles/globals'); // 70KB blocking
```

### After (Critical Inlined + Lazy Load)

```html
<!-- index.html -->
<head>
  <style data-critical>
    /* Critical CSS (16KB, inline) */
    :root { --xeg-color-primary: oklch(70% 0.15 220deg); }
    * { box-sizing: border-box; }
    .xeg-gallery-root { position: fixed; inset: 0; }
  </style>
</head>
```

```typescript
// src/main.ts
// No blocking CSS import

// Gallery mount triggers lazy load
onMount(() => {
  import('./styles/non-critical.css'); // 54KB async
});
```

---

## 📊 Expected Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **FCP** | 200ms | 140ms | **-30%** |
| **LCP** | 300ms | 250ms | **-17%** |
| **Blocking CSS** | 70KB | 16KB | **-77%** |
| **Time to Interactive** | 400ms | 350ms | **-12%** |
| **Lighthouse Score** | 85 | 95+ | **+10-15** |

**Note**: Actual improvements depend on network speed and device performance.

---

## ⚠️ Risks & Mitigations

### Risk 1: FOUC (Flash of Unstyled Content)

**Problem**: Gallery renders before non-critical CSS loads

**Mitigation**:
- Inline all skeleton/layout styles in critical CSS
- Use CSS `content-visibility` for off-screen elements
- Add loading state indicator

### Risk 2: Over-Inlining

**Problem**: Too much critical CSS bloats HTML

**Mitigation**:
- Target 10-20KB max for critical CSS
- Use Coverage tool to validate necessity
- Monitor HTML size in CI

### Risk 3: Build Complexity

**Problem**: Critical CSS extraction adds build time

**Mitigation**:
- Cache extraction results
- Run only on production builds
- Skip in development mode

---

## 🧪 Testing Strategy

### Performance Metrics

**Tools**:
- Lighthouse CI (automated)
- WebPageTest (real-world conditions)
- Chrome DevTools Performance panel

**Thresholds**:
- FCP: < 150ms (target)
- LCP: < 250ms (target)
- CLS: < 0.1 (no layout shift)

### Visual Regression

**Tools**:
- Playwright visual comparison
- Manual inspection (dev tools)

**Checks**:
- No FOUC on slow 3G
- Skeleton renders correctly
- Smooth transition to full styles

---

## 🛠️ Tooling Options

### Option A: Vite Plugin (Recommended ⭐)

**Pros**:
- ✅ Integrated with build process
- ✅ Automated extraction
- ✅ Minimal config

**Cons**:
- ⚠️ May need custom tweaks
- ⚠️ Less control over rules

**Packages**:
- `vite-plugin-critical-css`
- `critters` (Google's tool)

### Option B: PostCSS + PurgeCSS

**Pros**:
- ✅ Fine-grained control
- ✅ Widely used
- ✅ Flexible

**Cons**:
- ⚠️ More setup required
- ⚠️ Manual safelist management

**Packages**:
- `@fullhuman/postcss-purgecss`
- `postcss-critical-split`

### Option C: Manual Extraction

**Pros**:
- ✅ Full control
- ✅ No dependencies

**Cons**:
- ❌ High maintenance
- ❌ Error-prone

---

## 📚 References

- [Web.dev: Critical Rendering Path](https://web.dev/critical-rendering-path/)
- [Google Critters](https://github.com/GoogleChromeLabs/critters)
- [Vite CSS Code Splitting](https://vitejs.dev/guide/features.html#css-code-splitting)
- Phase 352: CSS Import Optimization (completed)
- Phase 360: CSS Modules Migration (planned)

---

## 📅 Timeline Estimate

| Phase | Duration | Effort |
|-------|----------|--------|
| 370.1 Manual Analysis | 4 hours | Medium |
| 370.2 Vite Plugin | 1 day | High |
| 370.3 Progressive Loading | 1 day | High |
| 370.4 Testing & Optimization | 4 hours | Medium |
| **Total** | **~3 days** | **High** |

---

## ✅ Success Criteria

- [ ] FCP reduced by 30% (200ms → 140ms)
- [ ] Critical CSS < 20KB (inline)
- [ ] No FOUC on slow networks
- [ ] Lighthouse score > 95
- [ ] All tests passing (2,809 tests)
- [ ] No visual regressions

---

## 🚀 Next Steps

1. **Phase 370.1**: Manual critical CSS analysis with Chrome DevTools
2. **Phase 370.2**: Evaluate Vite plugins (critters vs vite-plugin-critical-css)
3. **Phase 370.3**: Implement progressive loading strategy
4. **Phase 370.4**: Production validation with Lighthouse CI

---

**Note**: This is a **low-priority optimization**. Start only after:
- Phase 352 (CSS import optimization) ✅ Completed
- Phase 360 (CSS Modules migration) - Not started yet

Critical CSS extraction provides diminishing returns if bundle size is already optimized. Focus on Phase 360 first for better overall impact.
