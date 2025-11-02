# Phase 326.5-2: Bundle Analysis & Tree-shaking Strategy

**Last Updated**: November 3, 2025 | **Phase**: 326.5-2 | **Status**: In Progress

---

## 📊 Overview

Phase 326.5-2 focuses on detailed bundle analysis to identify optimization opportunities through tree-shaking and code elimination.

**Goal**: Map all optimization opportunities for Phase 326.5-3 implementation

---

## 🔍 Analysis Framework

### 1. Bundle Composition

#### Current Breakdown (Estimated)

```
Total: 406.94 KB (416,705 bytes)
├── Gallery Feature          ~120 KB (29.5%)
├── Settings Feature         ~80 KB (19.7%)
├── Download Feature         ~60 KB (14.8%)
├── MediaExtraction Feature  ~50 KB (12.3%)  ← Optional
├── Shared Utils             ~22 KB (5.4%)
├── AdvancedFilters Feature  ~40 KB (9.8%)   ← Optional
└── Accessibility Feature    ~35 KB (8.6%)   ← Optional

Optional Features Total: 125 KB (30.7% - tree-shake candidates)
Required Features Total: 281.94 KB (69.3%)
```

### 2. Feature Dependency Analysis

#### Gallery (120 KB - Required)

**Imports**:
- Solid.js Signal/Component APIs
- DOM utilities
- Media extraction (if mediaExtraction enabled)
- Scroll management
- Event handling

**Dead Code Risk**: 
- Media URL extraction (when mediaExtraction=false)
- Video processing (when mediaExtraction=false)

**Optimization**: Conditional imports in gallery/index.ts

#### Settings (80 KB - Required)

**Imports**:
- Solid.js forms/UI
- Settings panel components
- Persistence layer

**Dead Code Risk**: Low

**Optimization**: UI components are already modular

#### Download (60 KB - Required)

**Imports**:
- ZIP creation (fflate - already lazy loaded)
- Download service (Tampermonkey API wrapper)
- Media preparation

**Dead Code Risk**: Low (fflate already async)

**Optimization**: Already optimized (Phase 326.3)

#### MediaExtraction (50 KB - Optional)

**Imports**:
- Twitter token extraction
- API clients
- Video metadata parsing
- Image optimization

**When Disabled**: ~50 KB savings

**Dead Code Risk**: HIGH - entire module unused

**Optimization**: Complete feature removal via tree-shaking

#### AdvancedFilters (40 KB - Optional)

**Imports**:
- Filter UI components
- Filter logic (media type, quality, date)
- Search utilities

**When Disabled**: ~40 KB savings

**Dead Code Risk**: HIGH - entire module unused

**Optimization**: Complete feature removal via tree-shaking

#### Accessibility (35 KB - Optional)

**Imports**:
- ARIA attributes
- Screen reader support
- Keyboard navigation enhancements
- a11y validation

**When Disabled**: ~35 KB savings

**Dead Code Risk**: MEDIUM - some overlap with core

**Optimization**: Feature removal + core a11y retention

#### Shared Utils (22 KB)

**Modules**:
- Utility functions
- Helper methods
- Constants

**Dead Code Risk**: MEDIUM - unused helpers

**Optimization**: 
- Remove unused exports
- Consolidate duplicates
- Inline hot-path functions

---

## 🎯 Optimization Opportunities

### Tier 1: High Impact (15-20 KB savings)

#### 1.1 Optional Feature Tree-shaking

**Method**: Esbuild/Rollup tree-shake when feature flag is false

**Implementation**:
```javascript
// vite.config.ts
rollupOptions: {
  external: process.env.DISABLE_FEATURES ? ['mediaExtraction', 'advancedFilters'] : []
}
```

**Potential Savings**: 
- mediaExtraction disabled: 50 KB ✓
- advancedFilters disabled: 40 KB ✓
- Total: 90 KB (but not all users disable all)
- Conservative: 30-40 KB average

**Effort**: Medium (1-2 hours, config + testing)

#### 1.2 Shared Utils Consolidation

**Target**: Deduplicate utility functions

**Methods**:
- Audit imports in `@shared/utils/`
- Remove unused exports
- Inline frequently-called utilities
- Consolidate type guards

**Potential Savings**: 3-5 KB

**Effort**: Medium (2-3 hours, code review + refactoring)

### Tier 2: Medium Impact (5-10 KB savings)

#### 2.1 CSS Optimization

**Methods**:
- PurgeCSS for unused classes
- Remove unused design tokens
- Consolidate media queries
- Minify inline styles

**Potential Savings**: 2-4 KB

**Effort**: Low (1 hour)

#### 2.2 Dynamic Import Optimization

**Target**: Lazy-load non-critical modules

**Methods**:
- Advanced Filters can be lazy-loaded
- Keyboard help overlay already lazy
- Settings panel partial lazy-loading

**Potential Savings**: 1-3 KB (already partially done)

**Effort**: Low (1-2 hours)

### Tier 3: Low Impact (1-5 KB savings)

#### 3.1 Export Optimization

**Methods**:
- Remove unused type exports
- Consolidate barrel exports
- Tree-shake unused interfaces

**Potential Savings**: 0.5-1 KB

**Effort**: Low (30 mins)

#### 3.2 Dead Code Elimination

**Methods**:
- Remove commented code
- Delete obsolete utilities
- Consolidate similar functions

**Potential Savings**: 0.5-2 KB

**Effort**: Low (1 hour)

---

## 📋 Analysis Checklist

### Bundle Composition

- [ ] **Verify** feature size estimates with actual measurements
- [ ] **Identify** largest modules in each feature
- [ ] **Map** interdependencies between features
- [ ] **Find** circular dependencies (if any)

### Dead Code Detection

- [ ] **List** all exports from `@shared/utils`
- [ ] **Check** which utilities are actually used
- [ ] **Identify** feature-specific code
- [ ] **Mark** optimization candidates

### Tree-shaking Potential

- [ ] **Test** tree-shaking with feature flags enabled
- [ ] **Test** tree-shaking with feature flags disabled
- [ ] **Measure** actual size reductions
- [ ] **Validate** feature functionality after removal

### Optimization Priority

- [ ] **Rank** opportunities by effort/savings ratio
- [ ] **Identify** quick wins (high impact, low effort)
- [ ] **Plan** implementation phases
- [ ] **Estimate** total potential reduction

---

## 🔧 Tools & Commands

### Bundle Analysis

```bash
# Generate dependency graph
npm run generate-dep-graph

# Show largest modules (visual inspection)
npx vite build --profile

# Tree-shake dry-run
npx rollup --input src/main.ts --file /dev/null --format esm
```

### Feature Isolation Testing

```bash
# Test with mediaExtraction disabled
BUILD_FLAGS="mediaExtraction:false" npm run build

# Test with all optional features disabled
BUILD_FLAGS="mediaExtraction:false,advancedFilters:false,accessibility:false" npm run build
```

### Size Measurement

```bash
# Before optimization
du -sh dist/xcom-enhanced-gallery.user.js

# After optimization
du -sh dist/xcom-enhanced-gallery.user.js
```

---

## 📊 Success Metrics

### Before Optimization (Current)

- Bundle Size: 406.94 KB
- Gzip: ~101 KB
- Features: 6/6 enabled
- Test Pass Rate: 99.3%

### Target After Optimization (Phase 326.5-3)

- Bundle Size: 310-315 KB (23% reduction)
- Gzip: ~77-79 KB
- Features: 6/6 capable (with selective disabling)
- Test Pass Rate: 99.3%+ (maintained)

### Optimal Scenario (All Optional Features Disabled)

- Bundle Size: ~280 KB (31% reduction)
- Gzip: ~70 KB
- Features: 3/3 core enabled
- Use Case: Minimal gallery, no media extraction

---

## 🚀 Phase 326.5-2 Deliverables

### 1. Analysis Report

- [ ] **Module breakdown** (top 20 modules by size)
- [ ] **Feature dependency** map (SVG visualization)
- [ ] **Dead code** summary
- [ ] **Tree-shaking** potential per feature

### 2. Implementation Plan

- [ ] **Prioritized** optimization list
- [ ] **Effort estimates** (hours for each)
- [ ] **Risk assessment** (functionality impact)
- [ ] **Testing strategy** (validation approach)

### 3. Optimization Roadmap

- [ ] **Quick wins** (Phase 326.5-3, Session 1)
- [ ] **Medium efforts** (Phase 326.5-3, Session 2)
- [ ] **Advanced optimizations** (Phase 326.5-4 if time)

---

## 📈 Expected Outcomes

### Bundle Size Reduction

```
Current:     406.94 KB (100%)
Target:      310-315 KB (76-77%)
Reduction:   ~93 KB (23%)

By Tier:
  Tier 1: 30-40 KB (tree-shaking, shared utils)
  Tier 2: 5-10 KB (CSS, dynamic import)
  Tier 3: 1-5 KB (exports, dead code)
  Reserve: 10-15 KB (unforeseen savings)
```

### Quality Assurance

- ✅ All tests continue to pass (99.3%+)
- ✅ E2E smoke tests validated (92+ passed)
- ✅ No feature regressions
- ✅ Performance improved (smaller bundle = faster load)

---

## 🔗 References

- **[PHASE_326_5_PERFORMANCE_BASELINE.md](./PHASE_326_5_PERFORMANCE_BASELINE.md)** - Phase 326.5-1 baseline results
- **[phase-326-bundle-analysis.json](./phase-326-bundle-analysis.json)** - Machine-readable baseline data
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Current architecture and dependencies
- **[DEPENDENCY-GOVERNANCE.md](./DEPENDENCY-GOVERNANCE.md)** - Dependency rules and validation

---

## 📅 Timeline

```
Phase 326.5-2 (Analysis):      Nov 3-4 (1-2 days)
Phase 326.5-3 (Optimization):  Nov 4-5 (1-2 days)
Phase 326.5-4 (Release):       Nov 5-6 (1 day)
```

---

**Status**: 🔄 Phase 326.5-2 In Progress - Awaiting detailed module analysis

**Next**: Phase 326.5-3 (Implement optimizations based on analysis)
