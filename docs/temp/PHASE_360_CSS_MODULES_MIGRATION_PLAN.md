# Phase 360: CSS Modules Migration Plan

**Status**: 📋 Planning  
**Created**: 2025-11-05  
**Target**: Phase 360+ (Long-term)  
**Priority**: P2 (Medium)

---

## 🎯 Objective

Migrate `isolated-gallery.css` (300 lines, 12KB) to component-scoped CSS Modules for improved tree-shaking and maintainability.

---

## 📊 Current State Analysis

### File Breakdown

```
src/shared/styles/isolated-gallery.css (300 lines)
├─ Gallery Container (50 lines)
├─ Toolbar (80 lines)
├─ Media Viewer (70 lines)
├─ Navigation Controls (40 lines)
├─ Download Button (30 lines)
└─ Misc Utilities (30 lines)
```

### Import Chain

```
src/styles/globals.ts
  └─ isolated-gallery.css (全体 load)
     ↓
All styles loaded regardless of component usage
```

### Issues

1. **No tree-shaking**: Unused component styles still bundled
2. **Global scope pollution**: Risk of class name conflicts
3. **Maintenance difficulty**: 300-line monolithic file
4. **No scoped styles**: Hard to identify component ownership

---

## 🛠️ Proposed Architecture

### Component-Level CSS Modules

```
src/features/gallery/components/
├─ GalleryContainer.tsx
│  └─ GalleryContainer.module.css (50 lines)
├─ Toolbar.tsx
│  └─ Toolbar.module.css (80 lines)
├─ MediaViewer.tsx
│  └─ MediaViewer.module.css (70 lines)
├─ NavigationControls.tsx
│  └─ NavigationControls.module.css (40 lines)
└─ DownloadButton.tsx
   └─ DownloadButton.module.css (30 lines)
```

### Benefits

✅ **Tree-shaking**: Only import used component styles  
✅ **Scoped styles**: Auto-generated unique class names  
✅ **Maintainability**: Co-located with components  
✅ **Type safety**: TypeScript definitions for class names  
✅ **Dead code elimination**: Easier to spot unused styles

---

## 📋 Migration Phases

### Phase 360.1: Setup (2 hours)

**Tasks**:
1. Configure Vite for CSS Modules (already done)
2. Create TypeScript definitions for `.module.css`
3. Setup CSS Modules naming convention

**Deliverables**:
- Updated `vite.config.ts` with CSS Modules config
- Type definition file: `types/css-modules.d.ts`
- Documentation: CSS Modules usage guide

### Phase 360.2: Component Extraction (1 day)

**Strategy**: Bottom-up migration (leaf components first)

**Order**:
1. DownloadButton → `DownloadButton.module.css` (30 lines)
2. NavigationControls → `NavigationControls.module.css` (40 lines)
3. MediaViewer → `MediaViewer.module.css` (70 lines)
4. Toolbar → `Toolbar.module.css` (80 lines)
5. GalleryContainer → `GalleryContainer.module.css` (50 lines)

**Per Component**:
1. Extract relevant CSS from `isolated-gallery.css`
2. Create `*.module.css` file
3. Update component imports
4. Run browser tests
5. Verify no visual regression

### Phase 360.3: Shared Utilities (4 hours)

**Issue**: Some styles are shared across components (e.g., `.glass-surface`)

**Solution**: Create shared CSS Module

```
src/shared/styles/modules/
├─ common.module.css       # Shared utilities
├─ animations.module.css   # Reusable animations
└─ mixins.module.css       # CSS mixins (if needed)
```

**Usage**:
```typescript
// Component A
import commonStyles from '@shared/styles/modules/common.module.css';

<div className={commonStyles.glassSurface}>...</div>
```

### Phase 360.4: Legacy Cleanup (2 hours)

**Tasks**:
1. Remove `isolated-gallery.css` (after all components migrated)
2. Update `src/styles/globals.ts` (remove import)
3. Update documentation
4. Run full test suite

---

## 🔄 Migration Example

### Before (Global CSS)

```css
/* src/shared/styles/isolated-gallery.css */
.xeg-toolbar {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}

.xeg-toolbar__button {
  padding: 0.5rem;
  color: var(--text-primary);
}
```

```typescript
// src/features/gallery/components/Toolbar.tsx
export function Toolbar() {
  return (
    <div className="xeg-toolbar">
      <button className="xeg-toolbar__button">Previous</button>
    </div>
  );
}
```

### After (CSS Modules)

```css
/* src/features/gallery/components/Toolbar.module.css */
.toolbar {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}

.button {
  padding: 0.5rem;
  color: var(--text-primary);
}
```

```typescript
// src/features/gallery/components/Toolbar.tsx
import styles from './Toolbar.module.css';

export function Toolbar() {
  return (
    <div className={styles.toolbar}>
      <button className={styles.button}>Previous</button>
    </div>
  );
}
```

**Generated HTML**:
```html
<div class="Toolbar_toolbar_a3f2b">
  <button class="Toolbar_button_c8d1e">Previous</button>
</div>
```

---

## 📊 Expected Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Bundle Size | 12KB | ~10KB | -17% (tree-shaking) |
| Initial Load | 100% | 60-70% | -30-40% (lazy load) |
| Maintainability | Low | High | ++ (co-location) |
| Class Conflicts | High Risk | Zero | ✅ (scoped) |
| Type Safety | None | Full | ✅ (TS defs) |

---

## ⚠️ Risks & Mitigations

### Risk 1: Visual Regression

**Mitigation**:
- Run browser tests after each component
- Manual visual inspection
- Screenshot comparison (future: Playwright visual testing)

### Risk 2: Performance Overhead

**Mitigation**:
- CSS Modules add ~50 bytes per class (hash)
- Tree-shaking benefits outweigh overhead
- Monitor bundle size via `bundle-analysis.html`

### Risk 3: Shared Styles Duplication

**Mitigation**:
- Extract common styles to `common.module.css`
- Use CSS `composes` for style reuse
- Document shared patterns

---

## 🧪 Testing Strategy

### Per Component Migration

1. **Visual Test**: Manual inspection in browser
2. **Unit Test**: Verify class name application
3. **Browser Test**: Solid.js reactivity with scoped styles
4. **Smoke Test**: E2E gallery flow

### Full Migration

1. **Regression Suite**: All existing tests must pass
2. **Performance Test**: Bundle size analysis
3. **Accessibility Test**: `npm run e2e:a11y`

---

## 📚 References

- [Vite CSS Modules Guide](https://vitejs.dev/guide/features.html#css-modules)
- [CSS Modules Spec](https://github.com/css-modules/css-modules)
- Phase 352: CSS Import Optimization (completed)
- Phase 329: Event System Modularization (pattern reference)

---

## 📅 Timeline Estimate

| Phase | Duration | Effort |
|-------|----------|--------|
| 360.1 Setup | 2 hours | Low |
| 360.2 Component Extraction | 1 day | High |
| 360.3 Shared Utilities | 4 hours | Medium |
| 360.4 Legacy Cleanup | 2 hours | Low |
| **Total** | **~2 days** | **Medium** |

---

## ✅ Success Criteria

- [ ] All 5 components migrated to CSS Modules
- [ ] `isolated-gallery.css` deleted
- [ ] Bundle size reduced by 10-15%
- [ ] All tests passing (2,809 tests)
- [ ] Zero visual regressions
- [ ] Documentation updated

---

## 🚀 Next Steps

1. **Phase 360.1**: Setup CSS Modules infrastructure
2. **Phase 360.2**: Migrate DownloadButton (pilot)
3. **Phase 360.3**: Migrate remaining components
4. **Phase 360.4**: Cleanup and verification

---

**Note**: This is a long-term optimization. Start only after Phase 352 (barrel optimization) is fully stable.
