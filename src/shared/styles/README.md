# 스타일 시스템 가이드

> `src/shared/styles/` 디렉터리의 역할, 사용 방법, 토큰 추가 가이드

## 📂 파일 구조

```
src/shared/styles/
├─ design-tokens.css               # SSOT: 3계층 통합 토큰
├─ design-tokens.primitive.css     # 기본 토큰 (색상, 크기, 간격)
├─ design-tokens.semantic.css      # 의미 토큰 (역할 기반)
├─ design-tokens.component.css     # 컴포넌트 토큰 (UI 특화)
├─ isolated-gallery.css            # 격리된 갤러리 스타일
├─ modern-features.css             # 모던 CSS 기능 (OKLCH, Grid Subgrid)
├─ tokens.ts                       # JS 토큰 (타입 안정성용, 보조)
├─ theme-utils.ts                  # 테마 헬퍼 (CSS 변수 접근)
├─ namespaced-styles.ts            # 미사용 (향후 Light DOM 격리용)
└─ index.ts                        # Export 중앙화
```

## 🎯 핵심 원칙

### 1. SSOT (Single Source of Truth): CSS 변수 최상위

**모든 토큰의 최고 권한은 CSS 변수입니다.** JS 토큰은 보조 역할만 합니다.

```css
/* ✅ SSOT: CSS 변수 먼저 정의 */
:root {
  --xeg-color-primary: oklch(70% 0.15 220deg);
  --xeg-spacing-md: 1rem;
  --xeg-radius-lg: 0.5rem;
}
```

```typescript
// ✅ 보조: JS 토큰 (IDE 자동완성, 타입 안정성)
export const SPACING_TOKENS = {
  md: '1rem', // CSS 변수 값과 동기화 필수
} as const;
```

### 2. 계층 구조 (3단계)

**Primitive → Semantic → Component** 순서로 로드되어 우선순위 결정

```css
/* 1. Primitive: 기본값 (최하단) */
--color-primary: oklch(70% 0.15 220deg);
--space-md: 1rem;

/* 2. Semantic: 역할 기반 (중간) */
--xeg-color-primary: var(--color-primary);
--xeg-spacing-md: var(--space-md);

/* 3. Component: 컴포넌트 특화 (최상단) */
--button-bg: var(--xeg-color-primary);
--button-padding: var(--xeg-spacing-md);
```

**장점**:

- 유지보수성: Primitive만 수정하면 모든 레벨에 반영
- 확장성: Semantic 레벨 추가 용이
- 테마: 각 레벨별 테마 변경 가능

### 3. 유닛 규칙

**크기는 rem/em, 색상은 oklch만 사용**

```css
/* ✅ 올바른 사용 */
padding: var(--space-md); /* rem 토큰 */
font-size: var(--font-size-base); /* em 상대값 */
color: var(--xeg-color-primary); /* oklch 토큰 */
background: oklch(0 0 0 / 0.1); /* oklch 직접 사용 */

/* ❌ 하드코딩 금지 */
padding: 16px; /* px 금지 */
color: #1da1f2; /* hex 금지 */
background: rgba(0, 0, 0, 0.1); /* rgba 금지 */
```

---

## 📖 파일별 용도

### `design-tokens.css` (SSOT)

**역할**: 3계층 토큰 통합 진입점

```css
@import './design-tokens.primitive.css';
@import './design-tokens.semantic.css';
@import './design-tokens.component.css';
```

**사용**:

- 모든 프로젝트는 이 파일만 import
- 내부 구조 변경해도 외부 영향 없음

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
.xeg-gallery-container {
  /* 갤러리 컨테이너만 적용 */
  box-sizing: border-box;
  font-family: system-ui, sans-serif;
  all: revert; /* 트위터 스타일 리셋 */
}
```

### `tokens.ts` (보조)

**역할**: JS 기반 토큰 (타입 안정성, IDE 자동완성)

```typescript
export const SPACING_TOKENS = {
  xs: '0.25rem',
  md: '1rem',
  lg: '1.5rem',
} as const;

export const RADIUS_TOKENS = {
  sm: '0.25rem',
  full: '50%',
} as const;

export function getSpacing(token: SpacingToken): string {
  return SPACING_TOKENS[token];
}
```

**사용 시기**:

- IDE 자동완성이 필요할 때
- 타입 체크가 필요할 때
- ⚠️ CSS 변수와 동기화 필수!

### `theme-utils.ts`

**역할**: CSS 변수 접근, 테마 설정

```typescript
// CSS 변수 값 읽기
const primaryColor = getXEGVariable('color-primary-500');

// 테마 설정
setGalleryTheme('dark');

// 갤러리 내부 확인
if (isInsideGallery(element)) {
  applyGalleryStyles(element);
}
```

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

### Step 4: JS 토큰 동기화 (선택, 자동완성 필요시)

```typescript
// src/shared/styles/tokens.ts
export const SPACING_TOKENS = {
  // ... 기존
  xl: '2rem', // 새로 추가
} as const;

export const COLOR_TOKENS = {
  // ... 필요시 추가
  accent: 'oklch(75% 0.12 60deg)',
} as const;
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
import { getSpacing, getRadius } from '@shared/styles/tokens';
import { getXEGVariable } from '@shared/styles/theme-utils';

// ✅ JS 토큰으로 값 얻기 (타입 안전)
const padding = getSpacing('md'); // '1rem'
const radius = getRadius('lg'); // '0.5rem'

// ✅ CSS 변수 값 읽기 (런타임)
const primaryColor = getXEGVariable('color-primary-500');
```

### 예제 3: 테마 설정

```typescript
import { setGalleryTheme, getXEGVariable } from '@shared/styles/theme-utils';

// ✅ 테마 변경
setGalleryTheme('dark');

// ✅ 설정값 읽기
const isDarkTheme = getXEGVariable('theme') === 'dark';
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
// ❌ CSS 변수 값 계산하지 말 것
const padding = parseFloat(getXEGVariable('spacing-md')) * 2;

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

### Q2: tokens.ts는 언제 사용하나?

**A**: IDE 자동완성이나 타입 체크가 필요할 때:

```typescript
// ✅ 자동완성 필요
import { getSpacing } from '@shared/styles/tokens';
const padding = getSpacing('md'); // IDE가 'md' 자동완성

// vs

// CSS 변수 직접 사용 (자동완성 없음)
padding: var(--xeg-spacing-md);
```

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
| 애니메이션    | ~5   | animation-tokens.css |

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
