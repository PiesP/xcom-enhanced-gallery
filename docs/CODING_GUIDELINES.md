# 💻 코딩 가이드라인

> **일관된 코드 스타일과 품질 보장을 위한 필수 규칙**

## 📚 관련 문서

- 구조/계층: `ARCHITECTURE.md` · 의존성: `DEPENDENCY-GOVERNANCE.md` · TDD:
  `TDD_REFACTORING_PLAN.md`

---

## 🎯 3대 핵심 원칙 (필수)

### 1. Vendor Getter

```typescript
// ✅ Getter 사용 (TDZ-safe, 테스트 친화)
import { getSolid, getSolidStore } from '@shared/external/vendors';
const { createSignal, createMemo } = getSolid();

// ❌ 직접 import 금지
// import { createSignal } from 'solid-js';
```

**이유**: TDZ(Temporal Dead Zone) 방지, 테스트 모킹 가능, 의존성 주입

### 2. PC 전용 이벤트

```typescript
// ✅ 허용: click, keydown/up, wheel, contextmenu, mouse*
element.addEventListener('click', handler);
element.addEventListener('keydown', handler);

// ❌ 금지: touchstart/move/end, pointerdown/up/move
// element.addEventListener('touchstart', handler);
```

**이유**: PC 전용 유저스크립트, 터치 장치 간섭 방지

**포인터 이벤트 정책** (Phase 242-243):

- Touch 이벤트: **전역 차단** (모든 타깃)
- Pointer 이벤트:
  - **갤러리 외부**: 로깅만 (네이티브 동작 보존: 텍스트 선택, 링크)
  - **갤러리 내부**: 차단 (Mouse 이벤트만 사용)
  - **예외**: 마우스 기반 폼 컨트롤(`select`, `input`, `textarea`, `button`)은
    **항상 허용**

**재발 방지**:

- `isFormControlElement()`: 폼 컨트롤 판별 (명시적 함수)
- `getPointerEventPolicy()`: 정책 결정 로직 분리
- 테스트 커버리지: `test/unit/shared/utils/events-pointer-policy.test.ts`

### 3. CSS 디자인 토큰 (크기 + 색상)

```css
/* ✅ 크기: rem/em 토큰 사용 */
padding: var(--space-md); /* 1rem = 16px */
font-size: var(--font-size-base); /* 0.9375rem = 15px */
border-radius: var(--radius-md); /* 0.375em */

/* ✅ 색상: oklch 토큰 사용 */
color: var(--xeg-color-primary);
background: oklch(0 0 0 / var(--opacity-overlay-light));

/* ❌ 하드코딩 금지 */
padding: 16px; /* ❌ rem/em 토큰 사용 */
color: #1da1f2; /* ❌ oklch 토큰 사용 */
```

**이유**: 일관성, 유지보수성, 다크모드/테마 지원

---

## 🎨 디자인 토큰 체계 (3계층)

### 계층 구조

```css
/* 1. Primitive (design-tokens.primitive.css) */
--space-md: 1rem; /* 16px - rem (절대) */
--radius-md: 0.375em; /* 6px @ 16px - em (상대) */
--color-gray-800: oklch(0.306 0.005 282);

/* 2. Semantic (design-tokens.semantic.css) */
--xeg-modal-bg: var(--color-base-white);
--xeg-color-primary: var(--color-blue-500);

/* 3. Component (design-tokens.component.css) */
--toolbar-bg: var(--xeg-bg-toolbar);
--button-border: var(--color-border-default);
```

### 단위 규칙

| 단위      | 용도                  | 예시                              |
| --------- | --------------------- | --------------------------------- |
| **rem**   | 절대 크기 (고정)      | `padding: var(--space-md)` (1rem) |
| **em**    | 상대 크기 (폰트 비례) | `border-radius: var(--radius-md)` |
| **oklch** | 색상 (지각적 균일성)  | `oklch(0.6 0.15 240)`             |
| **%**     | 투명도 (opacity 전용) | `oklch(0 0 0 / 50%)`              |

### 접두사 규칙

- **Semantic**: `--xeg-*` (역할 기반 토큰)
- **Component**: `--component-*` 또는 `--xeg-*` (컴포넌트별)

---

## 🔧 에러 처리 패턴

### Result<T> 패턴

```typescript
// ✅ 성공/실패를 명시적으로 표현
import { Result } from '@shared/utils/result-type';

function processData(input: string): Result<ProcessedData> {
  if (!input) {
    return Result.err('Input is empty');
  }
  return Result.ok({ processed: input });
}

// 사용
const result = processData(input);
if (result.ok) {
  console.log(result.value); // ProcessedData
} else {
  console.error(result.error); // string
}
```

### 에러 팩토리

```typescript
// ✅ 표준화된 에러 생성
import { ErrorFactory } from '@shared/errors/error-factory';

const error = ErrorFactory.validation('Invalid input', { field: 'username' });
// AppError { code: 'validation_error', message: 'Invalid input', context: {...} }
```

---

## 🌐 Browser & DOM Utilities

### Browser Utilities

```typescript
// ✅ 안전한 글로벌 접근
import { BrowserEnv } from '@shared/external/browser';

if (BrowserEnv.canUseDOM()) {
  const window = BrowserEnv.getWindow();
}

// ✅ 미디어 쿼리
if (BrowserEnv.matchesMedia('(prefers-reduced-motion: reduce)')) {
  // 애니메이션 비활성화
}
```

### DOM Utilities

```typescript
// ✅ 캐시된 DOM 쿼리
import { DOMQuery } from '@shared/utils/dom';

const element = DOMQuery.querySelectorCached(
  '[data-testid="gallery-container"]'
);
```

---

## 📝 로깅 시스템

### 기본 사용

```typescript
// ✅ 범위별 로거
import { logger } from '@shared/external/logger';

const myLogger = logger.child({ module: 'MyModule' });
myLogger.info('Operation completed', { result: data });
myLogger.error('Operation failed', { error });
```

### 로깅 레벨 정책

| 레벨  | 용도             | 예시           |
| ----- | ---------------- | -------------- |
| trace | 상세 디버그      | 반복 루프 내부 |
| debug | 개발 디버그      | 함수 호출/반환 |
| info  | 정상 동작        | 초기화 완료    |
| warn  | 경고 (복구 가능) | 폴백 사용      |
| error | 에러 (복구 불가) | API 호출 실패  |

---

## 📂 파일 구조 규칙

### 경로 별칭

```typescript
// ✅ 별칭 사용 (권장)
import { MyComponent } from '@features/gallery/components';
import { MyService } from '@shared/services/media';

// ❌ 상대 경로 (금지)
// import { MyComponent } from '../../features/gallery/components';
```

### 파일명 규칙

- **컴포넌트**: PascalCase + `.tsx` (예: `GalleryApp.tsx`)
- **유틸리티**: kebab-case + `.ts` (예: `media-url.util.ts`)
- **서비스**: kebab-case + `.service.ts` (예: `media-service.ts`)
- **테스트**: kebab-case + `.test.ts` (예: `media-service.test.ts`)

---

## 🧪 테스트 규칙

### 테스트 작성 원칙

1. **TDD**: RED (실패) → GREEN (통과) → REFACTOR (정리)
2. **격리**: 각 테스트는 독립적으로 실행 가능
3. **AAA**: Arrange (준비) → Act (실행) → Assert (검증)

### 테스트 파일 위치

```
test/
  ├── unit/           # 단위 테스트 (JSDOM)
  ├── integration/    # 통합 테스트 (JSDOM)
  ├── browser/        # 브라우저 테스트 (Chromium)
  └── archive/        # 완료된 테스트
```

---

## 📚 추가 참고

- **아키텍처**: `ARCHITECTURE.md` - 3계층 구조, 의존성 규칙
- **의존성 관리**: `DEPENDENCY-GOVERNANCE.md` - dependency-cruiser 규칙
- **테스트 전략**: `TESTING_STRATEGY.md` - Testing Trophy, JSDOM 제약
- **유지보수**: `MAINTENANCE.md` - 정기 점검 항목

---

**💻 일관된 코드 스타일은 개발 생산성을 높입니다.**
