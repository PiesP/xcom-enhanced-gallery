# Styles System Guide

> Role, usage, and token addition guide for `src/shared/styles/` directory

## 📂 File Structure

```
src/shared/styles/
├─ design-tokens.primitive.css     # Step 1: Base tokens (color, size, spacing)
├─ design-tokens.semantic.css      # Step 2: Semantic tokens (role-based)
├─ design-tokens.component.css     # Step 3: Component tokens (UI specific)
├─ isolated-gallery.css            # Isolated gallery styles
├─ tokens/                         # Animation token CSS
└─ utilities/                      # Shared utility CSS (layout, animations)
```

## 🎯 Core Principles

### 1. SSOT (Single Source of Truth): CSS variables at top level

**CSS variables have the highest authority for all tokens.** JS tokens serve
only as auxiliary.

```css
/* ✅ SSOT: Define CSS variables first */
:root {
  --xeg-color-primary: oklch(70% 0.15 220deg);
  --xeg-spacing-md: 1rem;
  --xeg-radius-lg: 0.5rem;
}
```

```typescript
// ✅ Auxiliary: JS tokens (IDE autocomplete, type safety)
export const SPACING_TOKENS = {
  md: '1rem', // Must sync with CSS variable value
} as const;
```

### 2. Hierarchy (3 levels)

**Primitive → Semantic → Component** loaded in order, priority determined

```css
/* 1. Primitive: Base values (bottom level) */
--color-primary: oklch(70% 0.15 220deg);
--space-md: 1rem;

/* 2. Semantic: Role-based (middle) */
--xeg-color-primary: var(--color-primary);
--xeg-spacing-md: var(--space-md);

/* 3. Component: Component specific (top level) */
--button-bg: var(--xeg-color-primary);
--button-padding: var(--xeg-spacing-md);
```

**Advantages**:

- Maintainability: Modify Primitive only, reflected at all levels
- Extensibility: Easy to add Semantic levels
- Theming: Theme changes per level possible

### 3. Unit Rules

**Sizes use rem/em, colors use oklch only**

```css
/* ✅ Correct usage */
padding: var(--space-md); /* rem token */
font-size: var(--font-size-base); /* em relative value */
color: var(--xeg-color-primary); /* oklch token */
background: oklch(0 0 0 / 0.1); /* oklch direct use */

/* ❌ Hardcoding forbidden */
padding: 16px; /* px forbidden */
color: #1da1f2; /* hex forbidden */
background: rgba(0, 0, 0, 0.1); /* rgba forbidden */
```

---

## 📖 파일별 용도

### Design Token 시스템 (3단 계층)

**Phase 352 변경**: ~~`design-tokens.css`~~ 제거됨 (중간 레이어 불필요)

**사용**:

- `src/styles/globals.ts`에서 3개 파일을 직접 import
- CSS `@import` 대신 JS import로 번들러 최적화

```typescript
// src/styles/globals.ts
import '@shared/styles/design-tokens.primitive.css'; // 1단계
import '@shared/styles/design-tokens.semantic.css'; // 2단계
import '@shared/styles/design-tokens.component.css'; // 3단계
```

### `design-tokens.primitive.css`

**역할**: 기본 토큰 정의 (색상, 크기, 간격)

```css
:root {
  /* 색상 (oklch) */
  --color-primary: oklch(70% 0.15 220deg);
  --color-gray-500: oklch(50% 0 0deg);

  /* 크기 (rem) */
  --space-xs: 0.25rem;
  --space-md: 1rem;

  /* Border Radius (rem) */
  --radius-sm: 0.25rem;
  --radius-full: 50%;
}
```

### `design-tokens.semantic.css`

**역할**: 의미 있는 토큰 (역할 기반)

```css
:root {
  /* Primary (CTA, 강조) */
  --xeg-color-primary: var(--color-primary);
  --xeg-color-primary-hover: color-mix(...);

  /* Surface (배경, 카드) */
  --xeg-color-surface: var(--color-gray-100);

  /* Error, Success, Warning */
  --xeg-color-error: oklch(50% 0.2 0deg);
  --xeg-color-success: oklch(60% 0.18 120deg);
}
```

### `design-tokens.component.css`

**역할**: 컴포넌트 특화 토큰

```css
/* Button 토큰 */
.button {
  --button-bg: var(--xeg-color-primary);
  --button-text: white;
  --button-padding: var(--xeg-spacing-md);
  background: var(--button-bg);
}

/* Modal 토큰 */
.modal {
  --modal-bg: var(--xeg-color-surface);
  --modal-border: var(--xeg-color-border);
  background: var(--modal-bg);
}
```

### `isolated-gallery.css`

**역할**: 트위터/X.com과 격리된 갤러리 스타일

```css
.xeg-gallery-root {
  /* 격리된 갤러리 루트만 스타일 */
  all: initial;
  isolation: isolate;
  background: var(--xeg-gallery-bg);
}
```

### `tokens.ts` (legacy)

**Status**: Removed. CSS variables remain the single source of truth.

**Recommended approach**:

- Reference `var(--xeg-*)` tokens directly in CSS Modules and component styles.
- Prefer passing theme or mode via data attributes rather than reading computed
  styles.
- When runtime values are unavoidable, add a component-scoped helper instead of
  a shared utility.

> Avoid recreating JS copies of token maps. Keeping CSS as SSOT prevents drift
> that the legacy `tokens.ts` file introduced.

---

## ➕ 토큰 추가 가이드

### Step 1: CSS 변수 정의 (Primitive 또는 Semantic)

```css
/* src/shared/styles/design-tokens.primitive.css */
:root {
  /* 새 색상 추가 */
  --color-accent: oklch(75% 0.12 60deg);

  /* 새 간격 추가 */
  --space-xl: 2rem;
}
```

### Step 2: Semantic 토큰 추가 (필요시)

```css
/* src/shared/styles/design-tokens.semantic.css */
:root {
  /* Primitive를 의미 토큰으로 매핑 */
  --xeg-color-accent: var(--color-accent);
  --xeg-spacing-xl: var(--space-xl);
}
```

### Step 3: Component 토큰 추가 (선택)

```css
/* src/shared/styles/design-tokens.component.css */
.button-secondary {
  --button-bg: var(--xeg-color-accent);
}
```

### Step 4: (Optional) Local helpers for autocomplete

```typescript
// Define inside the component/module that needs autocomplete
const SPACING = {
  xl: 'var(--xeg-spacing-xl)',
  toastOffset: 'var(--xeg-toast-offset)',
} as const;

type SpacingKey = keyof typeof SPACING;

export function getSpacing(token: SpacingKey): string {
  return SPACING[token];
}
```

### Step 5: 테스트

```bash
# 타입 체크
npm run typecheck

# 린트 (하드코딩 감지)
npm run lint

# 빌드 검증
npm run build:dev
```

---

## 🚀 사용 예제

### 예제 1: CSS 파일에서 토큰 사용

```css
/* ✅ CSS 변수 사용 */
.card {
  padding: var(--xeg-spacing-md);
  background: var(--xeg-color-surface);
  border-radius: var(--xeg-radius-md);
  color: var(--xeg-color-text-primary);
}

/* ✅ Opacity와 함께 사용 */
.card:hover {
  background: oklch(from var(--xeg-color-surface) l c h / 0.9);
}
```

### 예제 2: TypeScript에서 토큰 접근

```typescript
// ✅ CSS 변수 조합 (정적)
const padding = 'var(--xeg-spacing-md)';
const radius = 'var(--xeg-radius-lg)';

// ⚠️ 런타임 접근은 컴포넌트 범위에 한정하세요
function readToken(element: HTMLElement, token: string): string {
  return getComputedStyle(element).getPropertyValue(`--xeg-${token}`).trim();
}
```

### 예제 3: 테마 설정

```typescript
const root = document.querySelector('[data-xeg-gallery-container]');

if (root instanceof HTMLElement) {
  root.setAttribute('data-theme', 'dark');
}
```

---

## ❌ 금지 사항

```css
/* ❌ px 단위 사용 금지 */
padding: 16px;

/* ❌ em 단위도 px로 계산하지 말 것 */
font-size: 0.875em; /* ✅ 맞음: em으로 쓰되 */
font-size: 14px; /* ❌ 틀림: px 사용 */

/* ❌ 색상 하드코딩 금지 */
color: #1da1f2;
background: rgba(0, 0, 0, 0.1);

/* ❌ hex/rgb 사용 금지 */
color: rgb(255, 0, 0);
```

```typescript
// ❌ CSS 변수 값을 숫자로 파싱하지 말 것
const element = document.querySelector('[data-xeg-gallery-container]');

if (element instanceof HTMLElement) {
  // ❌ Avoid converting CSS variables to numbers
  const padding =
    parseFloat(getComputedStyle(element).getPropertyValue('--xeg-spacing-md')) *
    2;
}

// ✅ 토큰 조합 사용
const doublePadding = `calc(2 * var(--xeg-spacing-md))`;
```

---

## 🔗 관련 문서

- **CODING_GUIDELINES.md** - 디자인 토큰 정책 (3계층, 유닛 규칙)
- **ARCHITECTURE.md** - 스타일 계층 구조
- **src/styles/globals.ts** - 스타일 임포트 진입점

---

## 🆘 자주 묻는 질문

### Q1: 새 토큰을 어디에 추가해야 하나?

**A**: 단계적으로 진행하세요:

1. **기본값** → `design-tokens.primitive.css`
2. **의미 있는 이름** → `design-tokens.semantic.css`
3. **컴포넌트 특화** → `design-tokens.component.css`

예: 새 색상 추가

```css
/* 1. Primitive: 색상 정의 */
--color-info: oklch(60% 0.15 200deg);

/* 2. Semantic: 역할 부여 */
--xeg-color-info: var(--color-info);

/* 3. Component: 사용처 (선택) */
.alert-info {
  --alert-bg: var(--xeg-color-info);
}
```

### Q2: How do I get IDE autocomplete without `tokens.ts`?

**A**: Define local helper maps when you truly need TS assistance:

```typescript
const SPACING = {
  xs: 'var(--xeg-spacing-xs)',
  md: 'var(--xeg-spacing-md)',
  lg: 'var(--xeg-spacing-lg)',
} as const;

type SpacingKey = keyof typeof SPACING;

function getSpacing(token: SpacingKey): string {
  return SPACING[token];
}
```

Keeping the map local prevents divergence from the CSS source of truth while
still giving editors something to autocomplete.

### Q3: 색상 변경이 필요하면?

**A**: Primitive 레벨에서만 변경:

```css
/* ✅ Primitive 변경 (모든 레벨에 반영) */
--color-primary: oklch(65% 0.14 210deg); /* 변경 */

/* 자동으로 반영됨 */
--xeg-color-primary: var(--color-primary); /* 자동 갱신 */
--button-bg: var(--xeg-color-primary); /* 자동 갱신 */
```

### Q4: 테마 간 색상 변경?

**A**: Semantic 레벨에서 변경:

```css
/* Light Theme */
:root {
  --xeg-color-background: oklch(95% 0 0deg);
}

/* Dark Theme */
@media (prefers-color-scheme: dark) {
  :root {
    --xeg-color-background: oklch(20% 0 0deg); /* 변경 */
  }
}
```

---

## 📊 현재 토큰 통계

| 카테고리      | 개수 | 파일                 |
| ------------- | ---- | -------------------- |
| 색상          | ~50  | primitive + semantic |
| 간격          | ~8   | primitive            |
| Border Radius | ~6   | primitive            |
| Z-index       | ~8   | semantic             |
| 애니메이션    | ~5   | tokens/animation.css |

---

## ✅ 체크리스트 (새 기능 추가 시)

- [ ] 토큰 정의됨 (CSS 변수)
- [ ] 3계층 구조 준수 (Primitive → Semantic → Component)
- [ ] 유닛 규칙 적용 (rem/em/oklch)
- [ ] 하드코딩 없음 (스타일링트 통과)
- [ ] 테스트 통과 (npm run validate)
- [ ] 빌드 성공 (npm run build:dev)

---

**마지막 업데이트**: 2025-10-27 **상태**: ✅ Phase 1-3 완료 **다음 단계**: Phase
4 (성능 최적화) 예정
