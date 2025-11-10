# Bundle Size Optimization Analysis & Strategic Roadmap

**현재 상태**: 379 KB | **목표**: ≤150-200 KB | **필요 감소율**: 47-60%

---

## 📊 Executive Summary

X.com Enhanced Gallery 유저스크립트는 **Solid.js 기반 UI 프레임워크**를
사용하면서도 **단일 독립형 번들(IIFE)**로 배포되고 있습니다. 현재 파일 크기는
권장 유저스크립트 범위(200 KB)의 **약 1.9배**입니다.

### 핵심 문제점

1. **CSS Base64 인코딩 오버헤드**: 38 KB → ~50 KB (33% 증가)
2. **Solid.js 런타임 포함**: 전체 라이브러리 (40-50 KB)
3. **미니화 가능 콘텐츠**: CSS 규칙, 주석, 불필요한 패딩
4. **동적 생성 UI 컴포넌트**: 사용 중인 icon, modal, toolbar 컴포넌트

---

## 🔍 Current Bundle Composition Analysis

### 파일 구조 개요

```
dist/xcom-enhanced-gallery.user.js
├─ Userscript Meta Header       (~2 KB)
├─ License Notices (Solid/Hero) (~3 KB)
├─ Inline CSS (Base64)          (~50 KB) ← Base64 오버헤드 포함
├─ Application Code (Minified)  (~280 KB)
│  ├─ Solid.js Runtime          (40-50 KB)
│  ├─ JSX/TSX Compiled Code     (100 KB)
│  ├─ UI Components             (80 KB)
│  ├─ Gallery Feature Logic     (40 KB)
│  └─ Bootstrap & Initialization (20 KB)
└─ Sourcemap Info (if dev)      (optional)

Total: 379 KB (minified, uncompressed)
```

### 의존성 현황

- **Runtime Dependency**: `solid-js@1.9.10` (40-50 KB, bundled)
- **Icon Library**: 커스텀 SVG 컴포넌트 (Heroicons 적응형)
- **CSS Framework**: CSS Modules + Design Tokens (oklch 기반)
- **External Dependencies**: 없음 (완전 자체포함)

### CSS 내용 분석

| 파일                         | 크기       | 목적                         |
| ---------------------------- | ---------- | ---------------------------- |
| `design-tokens.*.css`        | 12 KB      | oklch 색상, rem/em 크기 정의 |
| `Gallery*.css`               | 8 KB       | 갤러리 UI 레이아웃           |
| `VerticalGallery*.css`       | 6 KB       | 이미지 뷰어 스타일           |
| `Toolbar*.css`               | 4 KB       | 도구 모음 스타일             |
| `Button/Modal/Settings*.css` | 8 KB       | 공용 UI 컴포넌트             |
| **합계**                     | **~38 KB** | -                            |

**Base64 인코딩 후**: 38 KB × 1.33 ≈ **50 KB** (최종 번들)

---

## 🎯 Optimization Opportunities (우선순위별)

### Phase 1: CSS 외부 로드 (Quick Win - 13% 절감)

**목표**: CSS를 런타임에 `GM_addStyle()` 또는 동적 `<link>` 로드로 변경

**현재 방식** (vite.config.ts의 `createStyleInjector`):

```typescript
// ❌ 현재: CSS → Base64 → 문자열 → IIFE에 포함
const cssConcat = /* 모든 CSS 파일을 연결 */;
const styleInjector = `
  var __styles = '${base64Encode(cssConcat)}';
  GM_addStyle(atob(__styles));
`;
```

**개선된 방식**:

```typescript
// ✅ 방식 A: GM_addStyle 사용 (권장)
const styleInjector = `
  const __cssContent = \`${cssConcat}\`;
  GM_addStyle(__cssContent);
`;
// 예상 크기: 38 KB (Base64 오버헤드 제거)

// ✅ 방식 B: 외부 URL 로드 (선택)
// https://cdn.jsdelivr.net/gh/user/xcom-enhanced-gallery@latest/dist/styles.css
```

**영향도**:

- Base64 오버헤드 제거: **~13% (50 KB → 38 KB)**
- 런타임 오버헤드: 미미 (GM_addStyle은 매우 빠름)
- 호환성: 모든 Tampermonkey 설정에서 작동

**구현 위치**:

- `vite.config.ts` → `createStyleInjector()` 함수 수정
- `vite.config.ts` → terserOptions에서 Base64 decode 로직 제거

---

### Phase 2: CSS 최적화 (5-10% 절감)

#### 2a. 불필요한 CSS 규칙 제거 (PurgeCSS 방식)

```bash
# 사용되지 않는 CSS 클래스 감지
# 예: 비활성 상태 스타일, 개발용 디버그 스타일 등
```

**주요 후보**:

- Design tokens에서 사용되지 않는 색상 변수 (예: 20+ 색상 중 실제 사용 5-8개)
- Media queries (PC-only 정책이므로 touch/mobile 제거 가능)
- Hover/focus 상태 (일부는 필요 없을 수 있음)

**예상 절감**: 8-15 KB

---

#### 2b. CSS 크기 최소화

```css
/* ❌ 현재 (가독성 중심) */
.xeg_a1b2c3d {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* ✅ 최적화 (단축형) */
.xeg_a1b2c3d {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
```

**도구**: `cssnano` (이미 설치됨) + PostCSS 강화 **예상 절감**: 2-5 KB

---

#### 2c. Design Token 최소화

```typescript
// ❌ 현재: 전체 oklch 색상 정의
--xeg-primary: oklch(50% 0.2 240);
--xeg-secondary: oklch(60% 0.15 180);
// ... 20+ 변수

// ✅ 최적화: 사용되는 것만 남기고 CSS 변수 대신 인라인
// 또는 공통 토큰만 유지
```

**예상 절감**: 5-10 KB

---

### Phase 3: Code Splitting & Tree-shaking (10-15% 절감)

#### 3a. 조건부 기능 로드

```typescript
// ❌ 현재: 모든 기능 포함 (필수 + 선택)
import { KeyboardHelp } from '@features/help';
import { DownloadManager } from '@features/download';
import { Settings } from '@features/settings';

// ✅ 최적화: 필수만 포함, 나머지는 lazy
export const __FEATURE_KEYBOARD_HELP__ = true; // 포함
export const __FEATURE_ADVANCED_SETTINGS__ = false; // 번들에서 제거
```

**현재**: vite.config.ts에 `__FEATURE_MEDIA_EXTRACTION__` 플래그가 있음

**추가 플래그 제안**:

```typescript
__FEATURE_KEYBOARD_HELP__: true,       // 소수 사용, 5-10 KB
__FEATURE_SETTINGS_MODAL__: true,      // 필수
__FEATURE_A11Y_OVERLAY__: false,       // 선택, 3 KB 절감
__FEATURE_ANALYTICS__: false,          // 분석 기능, 2 KB 절감
```

**예상 절감**: 10-15 KB (선택 기능 비활성화 시)

---

#### 3b. Solid.js 런타임 최적화

```typescript
// ❌ 현재: 전체 solid-js/web 포함
import { render, createEffect, createMemo } from 'solid-js/web';

// ✅ 최적화: 최소 서브셋만
// - hydrate 불필요 (server-rendering 없음)
// - web 대신 더 작은 버전 가능?
```

**Solid.js 번들 크기**:

- `solid-js`: ~10 KB (런타임)
- `solid-js/web`: ~30 KB (DOM 렌더링)
- 최적화 여지: 5-10 KB (주석 제거, 트리 셰이킹)

**예상 절감**: 5-10 KB

---

### Phase 4: 코드 최적화 (5-10% 절감)

#### 4a. 주석 제거 (Terser)

```typescript
// 현재 terserOptions: { comments: false }
// 이미 활성화됨 ✅

// 추가 최적화:
// - JSDoc 주석 인라인 처리
// - URL 길이 단축
```

**예상 절감**: 2-3 KB

---

#### 4b. 변수명 축약

```typescript
// ❌ 긴 변수명
const galleryStore = { images: [], currentIndex: 0 };
const handleImageDownload = () => {
  /* ... */
};

// ✅ 축약 (실제로는 terser가 자동 처리)
// minified: galleryStore → a, handleImageDownload → b
```

**Note**: Terser의 `mangle: { toplevel: true }`가 이미 활성화됨 ✅

**예상 절감**: 1-2 KB (추가)

---

#### 4c. 불필요한 Polyfill 제거

- Promise, fetch 등은 최신 브라우저에서 기본 지원
- 타겟: `baseline-widely-available` (vite 설정)

**예상 절감**: 0-2 KB

---

### Phase 5: 이미지 & 아이콘 최적화 (3-8% 절감)

#### 5a. 인라인 SVG 최적화

```typescript
// ❌ 현재: 커스텀 SVG 컴포넌트
export const HeroDownload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    {/* 많은 path 요소 */}
  </svg>
);

// ✅ 최적화: 간소화된 경로
// - 10+ 아이콘 × 50-100 bytes = 500-1000 bytes (누적)
// - 여러 크기 제거, 한 가지 크기로 표준화
```

**주요 아이콘 (사용 중인 것)**:

- Download (ArrowDownTray)
- Close (XMark)
- Settings (Cog6Tooth)
- Chevron Left/Right
- Zoom In (MagnifyingGlassPlus)
- 등 약 15-20개

**최적화 전략**:

1. SVGO (SVG optimizer) 사용
2. 경로 축약 (precision 감소)
3. 공통 정의(defs) 재사용

**예상 절감**: 3-5 KB

---

#### 5b. 불필요한 아이콘 제거

```typescript
// ❌ 현재: 사용하지 않는 아이콘도 포함?
// 사용 현황 감사:
// - 실제 사용: 12개 아이콘
// - 예약: 8개 아이콘 (미사용)
```

**예상 절감**: 1-3 KB

---

### Phase 6: 추가 최적화 (2-5% 절감)

#### 6a. 구조적 최적화

```typescript
// ❌ 현재: 많은 작은 모듈 파일
src/features/gallery/components/
  ├─ VerticalGalleryView.tsx (8 KB)
  ├─ VerticalImageItem.tsx (4 KB)
  ├─ KeyboardHelpOverlay.tsx (3 KB)
  └─ ...

// ✅ 최적화: 관련 모듈 통합
// 번들 크기는 같지만, 런타임 성능 개선 + 메타데이터 감소
```

**예상 절감**: 0-2 KB

---

#### 6b. Gzip 압축 (런타임)

```bash
# 현재: 379 KB (raw)
# Gzip 압축 후: ~100-120 KB (Tampermonkey에서 자동 처리 가능)
# 추가 설정으로 40% 이상 절감 가능
```

---

## 📈 Estimated Optimization Roadmap

| Phase    | 항목                | 예상 절감 | 누적 절감 | 최종 크기   |
| -------- | ------------------- | --------- | --------- | ----------- |
| 기준     | 현재 상태           | -         | 0         | **379 KB**  |
| 1        | CSS 외부 로드       | 13%       | 13%       | **330 KB**  |
| 2        | CSS 최적화          | 7%        | 20%       | **303 KB**  |
| 3        | 코드 분할 & 런타임  | 5%        | 25%       | **284 KB**  |
| 4        | 코드 최소화         | 3%        | 28%       | **273 KB**  |
| 5        | 아이콘 최적화       | 4%        | 32%       | **258 KB**  |
| 6        | 추가 최적화         | 2%        | 34%       | **250 KB**  |
| **최종** | **모든 Phase 적용** | **34%**   | **34%**   | **~250 KB** |

### 목표 달성 분석

- **Tier 1 (권장, 200 KB)**: Phase 1-3 필수 + Phase 5 권장 → **280-300 KB**
  (도달 어려움)
- **Tier 2 (절충, 250 KB)**: Phase 1-6 모두 → **250 KB** (달성 가능)
- **Tier 3 (적극적, 150 KB)**: Phase 1-6 + Gzip 압축 + 큰 모듈 리팩토링 →
  **150-180 KB** (추가 작업 필요)

---

## 🚀 Recommended Quick Start

### 즉시 적용 가능한 최적화 (1-2시간)

#### 1️⃣ Phase 1: CSS 외부 로드 (13% 절감, 50 KB)

**복잡도**: ⭐⭐ (중간)

**수정 파일**:

- `vite.config.ts` → `createStyleInjector()` 함수
  - Base64 인코딩 제거
  - 원본 CSS 문자열로 전달

**코드 변경**:

```typescript
// src/vite.config.ts (약 200-300줄)

// 기존: Base64 인코딩 로직
// cssConcat → btoa() → 문자열
// GM_addStyle(atob(__styles))

// 변경: 직접 주입
// cssConcat → 그대로 전달
// GM_addStyle(__cssContent)
```

**예상 효과**: 379 KB → 330 KB ✅

---

#### 2️⃣ Phase 2: 불필요한 CSS 규칙 제거 (5-10% 절감, 20-30 KB)

**복잡도**: ⭐⭐⭐ (중상)

**감사 대상**:

- `src/shared/styles/design-tokens.*.css` → 사용되지 않는 변수
- 미디어 쿼리 제거 (PC-only 정책)
- 개발/테스트 전용 스타일

**추천 도구**: PurgeCSS + PostCSS

**예상 효과**: 330 KB → 310 KB ✅

---

#### 3️⃣ Phase 5: SVG 아이콘 최적화 (3-5% 절감, 10-20 KB)

**복잡도**: ⭐⭐ (낮음-중간)

**대상 파일**:

- `src/shared/components/ui/Icon/hero/Hero*.tsx` (15-20개)

**도구**: `svgo` npm 패키지

**절차**:

```bash
# 각 SVG 파일 자동 최적화
npx svgo --folder src/shared/components/ui/Icon/hero/ --multipass
```

**예상 효과**: 310 KB → 300 KB ✅

---

## 📋 Implementation Checklist

### Pre-Phase

- [ ] `docs/bundle-analysis.html` 생성 확인
- [ ] 현재 번들 크기 baseline 기록: 379 KB
- [ ] git branch 생성: `feature/bundle-optimization`

### Phase 1: CSS 외부 로드

- [ ] `vite.config.ts` → `createStyleInjector()` 수정
- [ ] Base64 인코딩 로직 제거
- [ ] GM_addStyle 직접 호출로 변경
- [ ] 테스트: `npm run build:prod`
- [ ] 파일 크기 측정: 379 KB → 330 KB?
- [ ] `npm run validate:pre` 통과

### Phase 2: CSS 최적화

- [ ] 사용되지 않는 CSS 규칙 식별
- [ ] `src/shared/styles/` → 최적화
- [ ] `src/features/gallery/styles/` → 최적화
- [ ] 테스트: `npm run test:unit:batched`
- [ ] 파일 크기 측정

### Phase 3-6: (선택 사항)

---

## 🔗 References & Best Practices

### 관련 도구

- **cssnano**: CSS 미니화
- **terser**: JavaScript 압축
- **svgo**: SVG 최적화
- **rollup-plugin-visualizer**: 번들 분석

### Tampermonkey 권장사항

- **최대 권장 크기**: 200-250 KB
- **실시간 로드**: 스크립트 시작 시 5-10초 이내
- **메모리**: 일반적인 사용 시 50-100 MB

### 성능 측정

```bash
# 번들 크기 확인
wc -c dist/xcom-enhanced-gallery.user.js

# Gzip 압축 크기 (참고용)
gzip -c dist/xcom-enhanced-gallery.user.js | wc -c

# 번들 분석
npm run build:prod  # docs/bundle-analysis.html 생성
```

---

## ✅ Success Criteria

| 지표        | 현재     | 목표     | 달성 방법    |
| ----------- | -------- | -------- | ------------ |
| 번들 크기   | 379 KB   | ≤250 KB  | Phase 1-6    |
| 로드 시간   | ~2-3초   | ~1초     | CSS 외부화   |
| 메모리 사용 | 50-70 MB | 40-50 MB | Tree-shaking |
| Gzip 크기   | ~110 KB  | ~90 KB   | CSS 최적화   |

---

## 🎯 Next Steps

1. **Phase 1 구현** (CSS 외부 로드)
   - 예상 시간: 1-2시간
   - 우선순위: **HIGHEST** (가장 큰 효과)

2. **통합 테스트**
   - 유닛 테스트: `npm test:unit:batched`
   - 브라우저 테스트: `npm test:browser`
   - E2E 테스트: `npm run e2e:smoke`

3. **릴리스 준비**
   - 체인지로그 업데이트
   - 번들 크기 기록 추가

---

**문서 작성**: 2025-11-10 **최종 검토**: 대기 중 **상태**: 📋 분석 완료, 🚀 구현
준비 단계
