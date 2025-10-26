# 💻 코딩 가이드라인

> **일관된 코드 스타일과 품질 보장을 위한 필수 규칙**

## 📚 관련 문서

- 구조/계층: `ARCHITECTURE.md` · 의존성: `DEPENDENCY-GOVERNANCE.md` · TDD:
  `TDD_REFACTORING_PLAN.md`

---

## 🎯 3대 핵심 원칙

### 1. Vendor Getter (필수)

```typescript
// ✅ Getter 사용 (TDZ-safe, 테스트 친화)
import { getSolid, getSolidStore } from '@shared/external/vendors';
const { createSignal, createMemo } = getSolid();

// ❌ 직접 import 금지
// import { createSignal } from 'solid-js';
```

### 2. PC 전용 이벤트

```typescript
// ✅ 허용: click, keydown/up, wheel, contextmenu, mouse*
// ❌ 금지: touchstart/move/end, pointerdown/up/move
```

### 3. CSS 디자인 토큰 (크기 + 색상)

```css
/* ✅ 크기: rem/em 토큰 사용 */
padding: var(--space-md); /* 1rem = 16px */
font-size: var(--font-size-base); /* 0.9375rem = 15px */
border-radius: var(--radius-md); /* 0.375em (폰트 비례) */

/* ✅ 색상: oklch 토큰 사용 */
color: var(--xeg-color-primary);
background: oklch(0 0 0 / var(--opacity-overlay-light));

/* ❌ 하드코딩 금지 (테스트/stylelint에서 차단) */
padding: 16px; /* rem/em 토큰 사용 */
font-size: 14px; /* rem 토큰 사용 */
border-radius: 8px; /* em 토큰 사용 */
color: #1da1f2; /* oklch 토큰 사용 */
background: rgba(0, 0, 0, 0.1); /* oklch 사용 */
```

---

## 🎨 디자인 토큰 체계 (3계층)

### 계층 구조

```css
/* 1. Primitive (design-tokens.primitive.css) */
--space-md: 1rem; /* 16px - rem (절대 크기) */
--radius-md: 0.375em; /* 6px @ 16px - em (상대 크기) */
--font-size-base: 0.9375rem; /* 15px - rem */
--color-gray-800: oklch(0.306 0.005 282);

/* 2. Semantic (design-tokens.semantic.css) */
--color-bg-elevated: var(--color-base-white);
--size-button-md: 2.5em; /* 40px @ 16px - em */
/* Semantic 레벨은 --xeg- 접두사 사용 (역할 기반 토큰) */
--xeg-modal-bg: var(--xeg-modal-bg-light);
--xeg-button-bg: var(--color-bg-surface);

/* 3. Component (design-tokens.component.css) */
/* Component 레벨은 컴포넌트별 접두사 또는 --xeg- 접두사 혼용 가능 */
--toolbar-bg: var(--xeg-bg-toolbar);
--button-border: var(--color-border-default);
--xeg-icon-size-md: var(--size-icon-md); /* 일부 component 토큰도 --xeg- 사용 */
```

### 접두사 규칙 (Prefix Rules)

**Semantic 레벨** (`design-tokens.semantic.css`):

**Component 레벨** (`design-tokens.component.css`):

### 업데이트된 가이드 (프로젝트 규칙 정리)

프로젝트는 이미 `--xeg-` 접두사를 광범위하게 사용하고 있으므로, 한 번에 대규모
리네이밍을 수행하지 않습니다. 대신 아래 가이드를 명확히 합니다:

- Semantic 레벨(`design-tokens.semantic.css`)의 권장 접두사는 `--xeg-` 입니다.
  주로 색상, 배경, 텍스트 컬러 등 전역 의미론적 토큰에 사용합니다. 예:
  `--xeg-modal-bg`, `--xeg-color-primary`.
- Component 레벨(`design-tokens.component.css`)에서는 컴포넌트 고유
  토큰(`--toolbar-`, `--button-` 등)을 권장합니다. 다만 기존 코드베이스와의
  호환성 때문에 `--xeg-` 접두사를 사용하는 component 토큰도 허용합니다. 예:
  `--xeg-icon-size-md`(허용), `--toolbar-bg`(권장).
- 우선순위 규칙: 컴포넌트에서 동일 이름의 토큰이 존재할 경우 더 좁은(scope)인
  Component 토큰이 우선합니다. (CSS cascade/사용 컨텍스트에 따름.)

실무 규칙 요약:

1. 신규 Semantic 토큰은 `--xeg-` 접두사 사용.
2. 신규 Component 토큰은 `--component-` 스타일(예: `--toolbar-`) 사용 권장. 단,
   컴포넌트에서 글로벌한 의미를 갖는 토큰이 필요하면 `--xeg-` 사용 가능.
3. 기존 토큰은 호환성을 위해 현상 유지. 리팩토링은 점진적으로,
   테스트(RED→GREEN)를 통해 수행.

이 변경은 문서화 강화로, 대규모 코드 리네임 없이 규칙을 명확히 하는 것이
목적입니다.

**신규 토큰 추가 가이드라인**:

- Semantic 레벨: 항상 `--xeg-` 접두사 사용
- Component 레벨: 기존 컴포넌트 패턴을 따를 것
  - 새로운 컴포넌트: 컴포넌트명 접두사 권장 (`--mycomponent-*`)
  - 범용 속성: `--xeg-` 접두사 사용 가능

### 크기 단위 규칙 (Size Units)

**필수 원칙**:

- **rem**: 절대 크기 (spacing, font-size, layout) - 브라우저 설정 존중
- **em**: 상대 크기 (radius, button/icon size) - 폰트 크기에 비례
- **px 금지**: 디자인 토큰 정의 파일 외 사용 금지

```css
/* ✅ 올바른 사용 */
.button {
  padding: 0.5em 1em; /* em: 부모 폰트에 비례 */
  font-size: var(--font-size-base); /* 0.9375rem */
  border-radius: var(--radius-md); /* 0.375em */
  margin-bottom: var(--space-md); /* 1rem */
}

/* ❌ 잘못된 사용 - stylelint에서 차단 */
.button {
  padding: 8px 16px; /* rem/em 토큰 사용 */
  font-size: 14px; /* rem 토큰 사용 */
  border-radius: 6px; /* em 토큰 사용 */
  margin-bottom: 16px; /* rem 토큰 사용 */
}
```

**rem vs em 선택 가이드**:

| 속성                       | 단위   | 이유                 |
| -------------------------- | ------ | -------------------- |
| `font-size`                | rem    | 절대 크기, 중첩 방지 |
| `padding`, `margin`, `gap` | rem/em | 컨텍스트에 따라 선택 |
| `border-radius`            | em     | 폰트 크기에 비례     |
| `width`, `height` (button) | em     | 폰트 크기에 비례     |
| `line-height`              | 무단위 | 상속 고려            |

### 색상 단위 규칙 (Color Units)

**필수 원칙**:

- **oklch 전용**: 모든 색상은 `oklch()` 사용
- **투명도**: opacity 토큰 + oklch alpha 조합
- **rgba/hex 금지**: 흑백 기본값(`#ffffff`, `#000000`) 제외 금지

```css
/* ✅ 올바른 사용 */
.overlay {
  background: oklch(0 0 0 / var(--opacity-overlay-light)); /* 검은색 + 10% */
  color: oklch(1 0 0); /* 흰색 */
  border: 1px solid oklch(0.378 0.005 286.3); /* gray-700 */
}

.glass {
  background: oklch(1 0 0 / var(--opacity-glass)); /* 흰색 + 85% */
  box-shadow: 0 4px 12px oklch(0 0 0 / 0.15); /* 그림자 */
}

/* ❌ 잘못된 사용 - 테스트/CodeQL에서 차단 */
.overlay {
  background: rgba(0, 0, 0, 0.1); /* oklch 사용 */
  color: #ffffff; /* oklch 또는 var(--color-base-white) */
  border: 1px solid #333; /* oklch 토큰 사용 */
}
```

**oklch 구문**:

```css
/* 기본 형식: oklch(lightness chroma hue / alpha) */
oklch(0.7 0.15 220)        /* 파란색 (lightness 70%, chroma 0.15, hue 220°) */
oklch(0.7 0.15 220 / 0.5)  /* 50% 투명도 */
oklch(0 0 0 / var(--opacity-overlay-light))  /* 검은색 + 토큰 opacity */

/* 흑백 (chroma 0) */
oklch(0 0 0)      /* 검은색 */
oklch(1 0 0)      /* 흰색 */
oklch(0.5 0 0)    /* 중간 회색 */
```

---

## 🎨 디자인 토큰 사용 예제

### 버튼 컴포넌트

```css
/* Button.module.css */
.button {
  /* Semantic 레벨 토큰 사용 */
  background: var(--xeg-button-bg);
  border: 1px solid var(--xeg-button-border);
  color: var(--xeg-button-text);

  /* Component 레벨 토큰 사용 */
  border-radius: var(--button-radius);
  padding: var(--button-padding-y) var(--button-padding-x);
  height: var(--button-height);

  /* 또는 xeg 접두사 component 토큰 */
  font-size: var(--xeg-text-base);
}

.button:hover {
  background: var(--xeg-button-bg-hover);
  border-color: var(--xeg-button-border-hover);
}
```

### 아이콘 컴포넌트

```css
/* Icon.module.css */
.icon {
  /* Component 레벨 토큰 (xeg 접두사 사용) */
  width: var(--xeg-icon-size-md);
  height: var(--xeg-icon-size-md);
  color: var(--xeg-icon-color);
  stroke-width: var(--xeg-icon-stroke-width);
}

.iconLarge {
  width: var(--xeg-icon-size-lg);
  height: var(--xeg-icon-size-lg);
}
```

### 컴포넌트 토큰 규칙

**필수**: 계층에 따른 토큰 참조

```css
:root {
  /* Semantic 레벨 (design-tokens.semantic.css) */
  /* Light defaults */
  --xeg-modal-bg-light: var(--color-bg-elevated);
  --xeg-modal-border-light: var(--color-border-default);
  --xeg-modal-bg: var(--xeg-modal-bg-light);
  --xeg-modal-border: var(--xeg-modal-border-light);

  /* Component 레벨 (design-tokens.component.css) */
  /* 컴포넌트별 접두사 */
  --toolbar-bg: var(--xeg-bg-toolbar);
  --button-border: var(--color-border-default);

  /* 또는 xeg 접두사 (범용 속성) */
  --xeg-icon-size-md: var(--size-icon-md);
  --xeg-text-base: var(--font-size-base);
}

[data-theme='dark'] {
  /* Dark overrides */
  --xeg-modal-bg-dark: var(--color-gray-800);
  --xeg-modal-border-dark: var(--color-border-emphasis);
  --xeg-modal-bg: var(--xeg-modal-bg-dark);
  --xeg-modal-border: var(--xeg-modal-border-dark);
}
```

**고대비 접근성**:

```css
.toolbar.highContrast {
  background: var(--xeg-toolbar-bg-high-contrast) !important;
}
```

---

## 📂 스타일 파일 구조

프로젝트의 CSS 파일은 계층별로 정리되어 있습니다.

### 파일 구조 개요

```
src/
├── assets/styles/
│   ├── base/
│   │   └── reset.css (v4.1)        ← 브라우저 리셋
│   ├── tokens/
│   │   ├── animation-tokens.css    ← 애니메이션 토큰 (duration/easing/delay/perf)
│   │   └── animation.css           ← deprecated (호환성 유지, 리다이렉트)
│   └── utilities/
│       ├── animations.css (v2.1)   ← @keyframes + 유틸 클래스
│       └── layout.css (v2.0)       ← Flexbox + Gap + Size 유틸
├── shared/styles/
│   ├── design-tokens.primitive.css ← 기본 토큰 (색상/크기/간격)
│   ├── design-tokens.semantic.css  ← 의미 토큰 (역할 기반)
│   ├── design-tokens.component.css ← 컴포넌트 토큰
│   ├── design-tokens.css           ← 3계층 통합 임포트
│   ├── isolated-gallery.css        ← 격리된 갤러리 스타일
│   ├── modern-features.css         ← 모던 CSS 기능
│   └── (기타 로직/테마)
└── styles/
    └── globals.ts                  ← CSS 임포트 진입점
```

### 파일별 책임

| 파일                    | 책임                                   | 사용 위치         |
| ----------------------- | -------------------------------------- | ----------------- |
| base/reset.css          | 브라우저 기본 스타일 초기화            | 항상 로드         |
| tokens/animation-tokens | @keyframes 없는 토큰만 (duration/ease) | 토큰 참조         |
| utilities/animations    | @keyframes + 유틸 클래스               | 클래스 적용 (+JS) |
| utilities/layout        | Flexbox + Gap + Size 유틸 클래스       | 클래스 적용       |
| shared/design-tokens.\* | 색상/크기/간격 토큰 (3계층)            | 토큰 참조         |
| shared/isolated-gallery | X.com과 격리된 갤러리 스타일           | 항상 로드         |

### 임포트 순서 (src/styles/globals.ts)

```typescript
// 1. 글로벌 격리 스타일
import '@shared/styles/isolated-gallery.css';

// 2. 통합 디자인 토큰 (Primitive → Semantic → Component)
import '@shared/styles/design-tokens.css';

// 3. 애니메이션 토큰 (duration/easing/delay/perf)
import '@assets/styles/tokens/animation-tokens.css';

// 4. 모던 CSS 기능 (상대 색상 등)
import '@shared/styles/modern-features.css';

// 5. 브라우저 리셋
import '@assets/styles/base/reset.css';

// 6. 유틸 클래스 (정렬/간격/크기)
import '@assets/styles/utilities/layout.css';

// 7. 유틸 클래스 (@keyframes + 애니메이션)
import '@assets/styles/utilities/animations.css';
```

---

## 🚀 Bootstrap 패턴 (초기화)

### 개요

Bootstrap 파일들은 애플리케이션 시작 시 한 번만 실행되는 초기화 로직을 담습니다.

**원칙**:

- 동적 import 사용 (트리셰이킹 최적화)
- 사이드이펙트 최소화 (호출 시에만 실행)
- 에러 처리 필수 (실패해도 앱 작동)
- 구조화된 로깅 (`[module-name]` 패턴)

### 파일 구조

```
src/bootstrap/
├── environment.ts          ← Vendor 라이브러리 초기화
├── events.ts              ← 전역 이벤트 (beforeunload/pagehide)
├── features.ts            ← Features 레이어 서비스 지연 등록
└── initialize-theme.ts    ← 테마 초기화 (시스템/localStorage/DOM)
```

### 사용 방법

```typescript
// src/main.ts에서 호출
import { initializeEnvironment } from '@/bootstrap/environment';
import { wireGlobalEvents } from '@/bootstrap/events';
import { registerFeatureServicesLazy } from '@/bootstrap/features';
import { initializeTheme } from '@/bootstrap/initialize-theme';

async function startApplication() {
  // 1. 환경 초기화 (Vendor 설정)
  await initializeEnvironment();

  // 2. 테마 초기화 (동기, 렌더링 전)
  initializeTheme();

  // 3. 글로벌 이벤트 (정리 핸들러)
  const unregisterEvents = wireGlobalEvents(() => {
    // 페이지 언로드 시 정리
  });

  // 4. Features 서비스 등록 (지연)
  await registerFeatureServicesLazy();
}
```

### 패턴: 동적 Import + Async/Await

**이유**: 프로덕션 번들 크기 최소화

```typescript
// ✅ 올바른 방식 (동적 import)
export async function initializeFeatures(): Promise<void> {
  const { setupFeatures } = await import('@features/setup');
  await setupFeatures();
}

// ❌ 피해야 할 방식 (정적 import)
// import { setupFeatures } from '@features/setup';
```

### 패턴: 정리 함수 반환

**이유**: 메모리 누수 방지, 테스트 정리

```typescript
// ✅ 올바른 방식 (정리 함수 반환)
export function wireGlobalEvents(onCleanup: () => void): () => void {
  window.addEventListener('beforeunload', onCleanup);

  return () => {
    window.removeEventListener('beforeunload', onCleanup);
  };
}

// 사용
const cleanup = wireGlobalEvents(() => {
  // 정리 로직
});

// 테스트/언마운트 시
cleanup();
```

### 로깅 패턴

**규칙**: `[module-name] 메시지`

```typescript
// ✅ 올바른 패턴
logger.debug('[environment] ✅ Vendors initialized');
logger.debug('[events] 🧩 Global events wired');
logger.debug('[features] Feature services registered');
logger.info('[theme] ✅ Theme initialized: dark');

// ❌ 피해야 할 패턴
logger.debug('✅ 초기화 완료'); // 모듈 불명확
logger.debug('[initializeModule] 메시지'); // 너무 길음
```

---

## 🧪 TDD 워크플로

```typescript
// 1. RED: 실패하는 테스트 작성
describe('MediaService', () => {
  it('should extract 4 images', () => {
    const result = service.extract(tweetData);
    expect(result).toHaveLength(4); // ❌ 실패
  });
});

// 2. GREEN: 최소 구현
class MediaService {
  extract(data: unknown) {
    return extractImages(data); // ✅ 통과
  }
}

// 3. REFACTOR: 개선
class MediaService {
  extract(data: TweetData): MediaItem[] {
    return this.strategy.extract(data);
  }
}
```

---

## 📦 파일 네이밍 (kebab-case 필수)

```text
✅ 올바른 파일명
gallery-view.tsx
media-processor.ts
bulk-download-service.ts

✅ Semantic Suffix 허용
app.types.ts             # 타입 정의
gallery.test.ts          # 테스트
button.module.css        # CSS Modules

❌ 잘못된 파일명
GalleryView.tsx          # PascalCase 금지
mediaProcessor.ts        # camelCase 금지
```

**자동 검증**: Phase 24 테스트 스위트가 강제 **Regex**:
`/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z]+)?\.(?:ts|tsx)$/`

---

## � 타입 정의 (Type Definitions)

### 파일 위치 규칙

**전역 빌드 환경 변수**: `types/` 루트

```typescript
// types/env.d.ts - Vite define 플러그인으로 주입되는 전역 변수
declare const __DEV__: boolean; // 개발 모드
declare const __PROD__: boolean; // 프로덕션 모드
declare const __VERSION__: string; // 패키지 버전
```

**도메인 비즈니스 타입**: `src/shared/types/` (패턴: `*.types.ts`)

```typescript
// ✅ 올바른 배치
src / shared / types / app.types.ts; // 앱 전역 타입
src / shared / types / media.types.ts; // 미디어 관련
src / shared / types / core / extraction.types.ts; // 핵심 추출 로직

// ✅ Features 특화 타입도 shared로 중앙화 가능
src / shared / types / settings.types.ts; // Settings 기능 타입

// ❌ 피해야 할 패턴
src / features / gallery / types.ts; // gallery 내부 타입 정의 (shared로 이동)
```

### 타입 정의 원칙

- **도메인별 분리**: 기능이 명확히 분리된 타입은 separate 파일 생성
  (`media.types.ts` ≠ `app.types.ts`)
- **Core 타입 세분화**: 코어 로직(추출, 매핑, 서비스)은 `core/` 하위 구조화
- **재사용성 우선**: 여러 파일에서 사용하는 타입은 shared로, 단일 파일만
  사용하면 파일 내 정의 검토
- **명시적 export**: 배럴 export 최소화, 필요한 타입만 명시 export

```typescript
// ✅ 좋은 예: 명시적 정의, 단일 책임
// src/shared/types/media.types.ts
export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  dimensions?: { width: number; height: number };
}

export type MediaList = MediaItem[];
```

---

## �📂 Import 순서

```typescript
// 1. 타입
import type { MediaItem, GalleryState } from '@shared/types';

// 2. 외부 라이브러리 (Vendor getter)
import { getSolid } from '@shared/external/vendors';

// 3. 내부 모듈 (경로 별칭 사용)
import { MediaService } from '@shared/services';
import { GalleryApp } from '@features/gallery';

// 4. 스타일
import styles from './Component.module.css';
```

---

## 🏗️ 아키텍처 경계

```text
Features (UI/기능)
    ↓
Shared (서비스/상태/유틸)
    ↓
External (어댑터/벤더)
```

- **단방향 의존만 허용**: Features → Shared → External
- **순환 참조 금지**: dependency-cruiser로 강제
- **배럴 표면 최소화**: 필요한 심볼만 export

---

## 🚀 빌드 & 검증

```bash
# 빠른 검증
npm run validate      # typecheck + lint + format

# 테스트
npm run test:smoke    # 스모크 테스트 (빠름)
npm run test:fast     # 단위 테스트
npm run e2e:smoke     # E2E 스모크

# 빌드
npm run build:dev     # 개발 빌드 (sourcemap 포함)
npm run build:prod    # 프로덕션 빌드

# 종합 검증
npm run build         # dev + prod + validate-build
```

---

## 🚫 금지 사항

| 항목            | ❌ 금지                            | ✅ 허용                                                     |
| --------------- | ---------------------------------- | ----------------------------------------------------------- |
| **Vendor**      | `import { createSignal } from...`  | `const { createSignal } = getSolid()`                       |
| **이벤트**      | `onTouchStart`, `onPointerDown`    | `onClick`, `onKeyDown`, `onWheel`                           |
| **크기**        | `padding: 16px; font-size: 14px;`  | `padding: var(--space-md); font-size: var(--font-size-sm);` |
| **색상**        | `color: #1da1f2; rgba(0,0,0,0.1);` | `color: var(--xeg-color-*); oklch(0 0 0 / 0.1);`            |
| **경로**        | `import from '../../../shared'`    | `import from '@shared'`                                     |
| **서비스 접근** | `ServiceManager` 직접 import       | `@shared/container/service-accessors` 헬퍼 사용             |
| **파일명**      | `GalleryView.tsx`, `media_util.ts` | `gallery-view.tsx`, `media-util.ts`                         |

**강제 도구**:

- **stylelint**: px 하드코딩 차단 (디자인 토큰 외)
- **CodeQL**: 하드코딩 색상/크기 감지
- **테스트**: 토큰 사용 강제 검증
- **Prettier**: 코드 포맷 자동화

---

## 📝 커밋 규칙 (Conventional Commits)

```bash
# 타입: 설명
feat: 새로운 기능
fix: 버그 수정
docs: 문서 변경
style: 코드 스타일 (포맷, 세미콜론 등)
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드/도구 변경

# 예시
git commit -m "feat: add keyboard navigation to gallery"
git commit -m "fix: resolve memory leak in media loader"
```

---

## 🔍 코드 리뷰 체크리스트

- [ ] Vendor getter 사용 (직접 import 없음)
- [ ] PC 전용 이벤트만 사용
- [ ] CSS 디자인 토큰 사용 (하드코딩 없음)
- [ ] 경로 별칭 사용 (`@shared`, `@features` 등)
- [ ] 파일명 kebab-case 준수
- [ ] 타입 명시 (TypeScript strict)
- [ ] 테스트 추가/수정 (TDD)
- [ ] 린트/포맷 통과
- [ ] 빌드 성공

---

## 🎯 성능 & 품질 목표

### 번들 크기

- **Dev**: ~730 KB (sourcemap 포함)
- **Prod**: ~320 KB (예산: 325 KB)
- **Gzip**: ~88 KB

### 접근성

- **focus-visible**: 모든 인터랙션 요소
- **high contrast**: 디자인 토큰으로 지원
- **reduced motion**: 애니메이션 최소화

### 테스트

- **커버리지**: 주요 경로 >80%
- **타임아웃**: 테스트 20s, 훅 25s
- **격리**: 각 테스트는 독립 실행

---

**💻 일관된 코드 스타일은 개발 생산성을 높입니다.**
