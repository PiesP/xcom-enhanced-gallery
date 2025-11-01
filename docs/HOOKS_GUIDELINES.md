# 🪝 Hooks 개발 가이드

> Solid.js 반응성 기반 훅 작성 원칙 (간결 버전)
>
> **최종 업데이트**: 2025-11-01

---

## 📋 핵심 원칙

### 1. Vendor Getter 필수

**모든 Solid.js API는 반드시 getter를 통해 접근**

```typescript
// ✅ 올바른 방식
import { getSolid } from '@shared/external/vendors';

export function useFocusTrap() {
  const { createEffect, onCleanup } = getSolid();
  // ...
}

// ❌ 직접 import 금지
import { createEffect } from 'solid-js'; // TDZ 문제, 테스트 불가
```

**이유**: TDZ(Temporal Dead Zone) 회피, 테스트 모킹 가능

---

### 2. MaybeAccessor 패턴

**Signal과 정적 값을 모두 허용하여 유연성 확보**

```typescript
type MaybeAccessor<T> = T | (() => T);

export function useFocusTrap(
  containerRef: MaybeAccessor<HTMLElement | null>,
  isActive: MaybeAccessor<boolean>
) {
  const resolveContainer = () =>
    typeof containerRef === 'function' ? containerRef() : containerRef;
  const resolveActive = () =>
    typeof isActive === 'function' ? isActive() : isActive;
  // ...
}
```

**프로젝트 패턴**:

- `useFocusTrap`: containerRef, isActive 모두 MaybeAccessor 지원
- `useToolbarSettingsController`: containerElement MaybeAccessor 지원

---

### 3. 명시적 타입 정의

```typescript
// ✅ Options와 Result를 분리하여 명확하게 정의
export interface FocusTrapOptions {
  readonly preventScroll?: boolean;
  readonly initialFocus?: string;
  readonly fallbackFocus?: string;
}

export interface FocusTrapResult {
  readonly isActive: boolean;
  readonly activate: () => void;
  readonly deactivate: () => void;
}

export function useFocusTrap(
  containerRef: MaybeAccessor<HTMLElement | null>,
  isActive: MaybeAccessor<boolean>,
  options: FocusTrapOptions = {}
): FocusTrapResult {
  // ...
}
```

---

### 4. 리소스 정리 필수

**모든 리소스는 `onCleanup()`으로 확실히 해제**

```typescript
export function useFocusTrap(/* ... */) {
  const { createEffect, onCleanup } = getSolid();
  let trap: FocusTrap | null = null;

  createEffect(() => {
    const container = resolveContainer();
    if (!container || !resolveActive()) return;

    trap = createFocusTrap(container, options);
    trap.activate();

    onCleanup(() => {
      trap?.deactivate();
      trap = null;
    });
  });

  return {
    /* ... */
  };
}
```

**프로젝트 사례**:

- `useFocusTrap`: FocusTrap 인스턴스 정리
- `useToolbarState`: Store/Signal 구독 정리 (필요 시)

---

### 5. 훅 vs 서비스 구분

| 기준          | Hook                | Service                |
| ------------- | ------------------- | ---------------------- |
| **반응성**    | ✅ Signal 필수      | ❌ 없음                |
| **호출 위치** | 컴포넌트 내부       | 전역/서비스 계층       |
| **테스트**    | E2E/integration     | 단위 테스트            |
| **위치**      | `src/shared/hooks/` | `src/shared/services/` |

**의사결정 가이드**:

- Signal/Effect 필요? → Hook
- 전역 공유 로직? → Service
- 크기 < 200줄? → Hook 유지, 초과 시 분리 검토

---

## 📂 프로젝트 현황 (2025-11-01)

### 현재 사용 중인 Hooks

1. **`use-focus-trap.ts`** (119 lines)
   - 포커스 트랩 관리
   - `createFocusTrap` 유틸리티 위임
   - MaybeAccessor 패턴 활용

2. **`use-toolbar-state.ts`** (96 lines)
   - Toolbar Signal 상태 관리
   - `[state, actions]` 튜플 반환

3. **`use-toolbar-settings-controller.ts`** (130 lines)
   - Settings 패널 키보드 제어
   - MaybeAccessor<HTMLElement> 지원

**특징**:

- ✅ 모든 훅이 Vendor Getter 사용
- ✅ MaybeAccessor 패턴 준수
- ✅ onCleanup() 리소스 정리
- ✅ 명시적 타입 정의

---

## 🧪 테스트 전략

```text
test/unit/shared/hooks/
├── use-focus-trap.test.tsx
├── use-toolbar-state.test.tsx
└── toolbar/
    └── use-toolbar-settings-controller.test.tsx
```

**중점**:

- Signal 변경 검증
- onCleanup 호출 확인
- E2E/Integration 테스트 우선 (JSDOM 제약 고려)

---

## 📖 참고 문서

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 계층 구조 및 의존성 규칙
- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)** - Vendor Getter, 코드
  스타일
- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)** - JSDOM 제약사항

**실제 구현 예제**:

- `src/shared/hooks/use-focus-trap.ts`
- `src/shared/hooks/use-toolbar-state.ts`
- `src/shared/hooks/toolbar/use-toolbar-settings-controller.ts`

---

**작성**: 2025-10-26 | **최종 업데이트**: 2025-11-01 (간소화 버전)
