# 🪝 Hooks 개발 가이드

> Solid.js 반응성을 활용한 훅 작성 규칙 및 모범 사례
>
> **최종 업데이트**: 2025-10-27 | **관련 문서**: `ARCHITECTURE.md`,
> `CODING_GUIDELINES.md`

---

## 🎯 훅의 정의

**훅(Hook)**: Solid.js 반응성 시스템을 활용하여 UI 상태와 이벤트를 조율하는
**재사용 가능한 로직 단위**

### 핵심 특징

- ✅ **반응성 필수**: Signal, Effect 등 Solid 반응성 활용
- ✅ **컴포넌트 스코프**: 컴포넌트 내부에서만 호출
- ✅ **상태 + 액션 반환**: 현재 상태와 조작 방법 제공
- ✅ **정리 로직 포함**: `onCleanup()`으로 리소스 해제

```typescript
// ✅ 올바른 훅 예시
export function useFocusTrap(
  containerRef: MaybeAccessor<HTMLElement | null>,
  isActive: MaybeAccessor<boolean>
): FocusTrapResult {
  const { createEffect, onCleanup } = getSolid();

  createEffect(() => {
    const container = resolveElement(containerRef);
    if (!container || !isActive()) return;

    const trap = createFocusTrap(container);
    trap.activate();
    onCleanup(() => trap.destroy());
  });

  return { isActive, activate, deactivate };
}

// ❌ 훅이 아닌 예시 (Signal 없음 → 유틸리티 함수)
export function extractMedia(url: string): MediaItem[] {
  return parseMedia(url);
}
```

---

## 🏗️ 훅 vs 서비스 vs 상태머신

| 항목          | 훅 (Hook)           | 서비스 (Service)       | 상태머신 (State Machine) |
| ------------- | ------------------- | ---------------------- | ------------------------ |
| **반응성**    | ✅ Signal 필수      | ❌ 없음                | ✅ Signal 기반           |
| **크기**      | < 200줄             | 50-300줄               | 상태 전이별              |
| **호출 위치** | 컴포넌트 내부       | 모듈/서비스 계층       | 서비스/상태 계층         |
| **반환값**    | [상태, 액션]        | API 제공               | Signal + 액션            |
| **테스트**    | E2E/integration     | 단위 테스트            | 단위 테스트              |
| **위치**      | `src/shared/hooks/` | `src/shared/services/` | `src/shared/state/`      |

### 의사결정 가이드

```text
새로운 로직 필요?
├─ Signal/Effect 필수? → No → Service
├─ 컴포넌트 내부만? → No → State Machine
└─ 크기 < 200줄? → Yes → Hook ✅
                   No → 분리 또는 State Machine 검토
```

---

## 🎓 작성 원칙

### 1. Vendor Getter 필수

```typescript
// ✅ 올바른 방식
import { getSolid } from '@shared/external/vendors';

export function useMyHook() {
  const { createSignal, createEffect } = getSolid();
  // ...
}

// ❌ 직접 import 금지
import { createSignal } from 'solid-js'; // TDZ 문제, 테스트 어려움
```

### 2. 명시적 타입 정의

```typescript
// ✅ 명확한 타입
export interface UseToggleOptions {
  readonly initialValue?: boolean;
  readonly onOpen?: () => void;
}

export interface UseToggleResult {
  readonly isOpen: Accessor<boolean>;
  readonly toggle: () => void;
}

export function useToggle(options: UseToggleOptions = {}): UseToggleResult {
  // ...
}
```

### 3. MaybeAccessor 패턴 (유연한 입력)

```typescript
type MaybeAccessor<T> = T | (() => T);

// 값 또는 Accessor 모두 허용
export function useFocusTrap(
  containerRef: MaybeAccessor<HTMLElement | null>,
  isActive: MaybeAccessor<boolean>
) {
  const resolveContainer = () =>
    typeof containerRef === 'function' ? containerRef() : containerRef;
  // ...
}
```

### 4. 정리 로직 필수

```typescript
// ✅ 리소스 정리
export function useEventListener(
  element: MaybeAccessor<HTMLElement | null>,
  event: string,
  handler: EventListener
) {
  const { createEffect, onCleanup } = getSolid();

  createEffect(() => {
    const el = resolveElement(element);
    if (!el) return;

    el.addEventListener(event, handler);
    onCleanup(() => el.removeEventListener(event, handler));
  });
}
```

### 5. 사이드이펙트 최소화

```typescript
// ✅ 순수한 상태 관리
export function useToggle(initialValue = false) {
  const [isOpen, setIsOpen] = createSignal(initialValue);
  return {
    isOpen,
    toggle: () => setIsOpen(prev => !prev),
  };
}

// ❌ 불필요한 사이드이펙트
export function useToggle(initialValue = false) {
  // ...
  createEffect(() => {
    console.log(isOpen()); // 로깅만을 위한 Effect
    localStorage.setItem('state', isOpen()); // 상태 저장은 훅 책임 X
  });
}
```

---

## 📏 크기 기준

| 크기      | 평가         | 권장사항                        |
| --------- | ------------ | ------------------------------- |
| < 100줄   | ✅ 매우 우수 | 재사용 가능, 테스트 용이        |
| 100-200줄 | ✅ 좋음      | 단일 책임 명확 (리뷰 필수)      |
| 200-300줄 | ⚠️ 검토 필요 | 책임 분리/State Machine 검토    |
| 300-400줄 | ❌ 필수 개선 | 즉시 분리 (서비스/상태머신)     |
| > 400줄   | 🚫 금지      | 아키텍처 오류, 즉시 재설계 필요 |

---

## 📚 핵심 패턴

### 패턴 1: 토글 훅

```typescript
export function useToggle(options: UseToggleOptions = {}): UseToggleResult {
  const { createSignal } = getSolid();
  const { initialValue = false } = options;

  const [isOpen, setIsOpen] = createSignal(initialValue);

  return {
    isOpen,
    toggle: () => setIsOpen(prev => !prev),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
```

### 패턴 2: 폼 값 관리

```typescript
export function useFormValue<T>(initialValue: T): UseFormValueResult<T> {
  const { createSignal, createMemo } = getSolid();

  const [value, setValue] = createSignal(initialValue);
  const isDirty = createMemo(
    () => JSON.stringify(value()) !== JSON.stringify(initialValue)
  );

  return {
    value,
    setValue,
    reset: () => setValue(initialValue),
    isDirty,
  };
}
```

### 패턴 3: 리소스 관리

```typescript
export function useResource<T>(
  options: UseResourceOptions<T>
): UseResourceResult<T> {
  const { createEffect, onCleanup } = getSolid();
  const { create, cleanup } = options;

  const [resource, setResource] = createSignal<T | null>(null);

  createEffect(() => {
    const res = create();
    setResource(res);
    onCleanup(() => {
      cleanup?.(res);
      setResource(null);
    });
  });

  return { resource };
}

// 사용 예: IntersectionObserver
const observer = useResource({
  create: () => new IntersectionObserver(handleIntersection),
  cleanup: obs => obs.disconnect(),
});
```

---

## ⚠️ 안티패턴

### 1. 직접 외부 의존성 접근

```typescript
// ❌ localStorage 직접 접근
export function useSettings() {
  const [settings, setSettings] = createSignal({});
  createEffect(() => {
    const saved = localStorage.getItem('settings'); // 사이드이펙트
    setSettings(JSON.parse(saved || '{}'));
  });
  return settings;
}

// ✅ 서비스로 위임
export function useSettings() {
  const settingsService = getSettingsService();
  const [settings] = createSignal(settingsService.load());
  return settings;
}
```

### 2. 직접 DOM 조작

```typescript
// ❌ 직접 DOM 조작
export function useHighlight() {
  const [isActive, setIsActive] = createSignal(false);
  createEffect(() => {
    document.body.classList.toggle('highlight', isActive());
  });
  return { isActive };
}

// ✅ JSX 클래스 바인딩
export function useHighlight() {
  const [isActive, setIsActive] = createSignal(false);
  return { isActive }; // 컴포넌트에서 <div class={isActive() ? 'highlight' : ''}
}
```

### 3. 과도한 의존성

```typescript
// ❌ 5개 이상 의존성
export function useComplexLogic(
  service1,
  service2,
  service3,
  service4,
  service5
) {
  // 책임이 너무 많음
}

// ✅ 분리 또는 의존성 주입
export function useSimpleLogic(primaryService) {
  // 필요 시 getter로 추가 서비스 가져오기
}
```

---

## 🧪 테스트 전략

### 테스트 파일 구조

```text
src/shared/hooks/
├── use-focus-trap.ts
└── use-toggle.ts

test/unit/shared/hooks/
├── use-focus-trap.test.tsx
└── use-toggle.test.tsx
```

### 테스트 예시

```typescript
// Signal 변경 검증
describe('useToggle', () => {
  it('should toggle value', () => {
    const { result } = renderHook(() => useToggle());

    expect(result.isOpen()).toBe(false);

    act(() => result.toggle());
    expect(result.isOpen()).toBe(true);
  });
});

// onCleanup 검증
describe('useEventListener', () => {
  it('should remove listener on cleanup', () => {
    const handler = vi.fn();
    const element = document.createElement('div');

    const { cleanup } = renderHook(() =>
      useEventListener(() => element, 'click', handler)
    );

    element.click();
    expect(handler).toHaveBeenCalledOnce();

    cleanup();
    element.click();
    expect(handler).toHaveBeenCalledOnce(); // 여전히 1번만
  });
});
```

---

## 📖 참고 문서

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 훅의 계층 구조 및 의존성 규칙
- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)** - 코드 스타일 및 Vendor
  Getter
- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)** - 테스트 전략 및 JSDOM 제약
- **실제 예제** - `src/shared/hooks/use-focus-trap.ts`

---

**작성**: 2025-10-26 | **최종 업데이트**: 2025-10-27
