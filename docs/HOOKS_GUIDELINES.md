# 🪝 Hooks 개발 가이드

> Solid.js 반응성을 활용한 훅 작성 규칙 및 모범 사례
>
> **관련 문서**: `ARCHITECTURE.md` (hooks 구조), `CODING_GUIDELINES.md` (코드
> 스타일)

---

## 📋 목차

1. 훅의 정의
2. 훅 vs 서비스 vs 상태머신
3. 훅 작성 원칙
4. 훅 크기 기준
5. 모범 사례
6. 안티패턴
7. 테스트 전략
8. 마이그레이션 경로

---

## 🎯 훅의 정의

**훅(Hook)**: Solid.js 반응성 시스템(`createSignal`, `createEffect` 등)을
활용하여 UI 상태와 이벤트 조율을 제공하는 **재사용 가능한 로직 단위**.

### 특징

- ✅ **반응성 필수**: Signal, Effect 등 Solid 반응성 활용
- ✅ **컴포넌트 스코프**: 컴포넌트 내부 호출 (컴포넌트 외부 직접 호출 금지)
- ✅ **상태 + 액션 반환**: 현재 상태와 조작 방법 제공
- ✅ **정리 로직 포함**: `onCleanup()` 또는 cleanup 함수로 리소스 해제

### 예시

```typescript
// ✅ 훅의 정의에 맞는 예
export function useFocusTrap(
  containerRef: MaybeAccessor<HTMLElement | null>,
  isActive: MaybeAccessor<boolean>
): FocusTrapResult {
  const { createEffect, onCleanup } = getSolid();

  // 반응성 관리
  createEffect(() => {
    const container = resolveElement(containerRef);
    if (!container || !isActive()) return;

    const trap = createFocusTrap(container);
    trap.activate();

    // 정리 로직
    onCleanup(() => trap.destroy());
  });

  return { isActive, activate, deactivate };
}

// ❌ 훅이 아닌 예
export function extractMediaFromUrl(url: string): MediaItem[] {
  // Signal이 없고, 순수 함수의 작동만 있음
  // → 유틸리티 함수로 분류
  return parseMedia(url);
}
```

---

## 🏗️ 훅 vs 서비스 vs 상태머신

| 항목          | 훅 (Hook)           | 서비스 (Service)       | 상태머신 (State Machine) |
| ------------- | ------------------- | ---------------------- | ------------------------ |
| **반응성**    | ✅ Signal 사용      | ❌ 없음                | ✅ Signal 기반           |
| **크기**      | < 200줄             | 50-300줄               | 상태 전이별              |
| **호출 위치** | 컴포넌트 내부       | 모듈/서비스 계층       | 서비스/상태 계층         |
| **반환값**    | [상태, 액션]        | API 제공               | Signal + 액션            |
| **테스트**    | E2E/integration     | 단위 테스트            | 단위 테스트              |
| **위치**      | `src/shared/hooks/` | `src/shared/services/` | `src/shared/state/`      |
| **예시**      | useFocusTrap        | MediaService           | gallerySignals           |

### 의사결정 트리

```
새로운 로직이 필요한가?

├─ [Q1] Solid.js Signal/Effect가 필수인가?
│  ├─ Yes → [Q2]로 진행
│  └─ No → Service 고려
│
├─ [Q2] 컴포넌트 내부에서만 사용되는가?
│  ├─ Yes → Hook 고려
│  └─ No → State Machine 고려
│
├─ [Q3] 크기가 200줄 미만인가?
│  ├─ Yes → Hook ✅
│  ├─ No, 100-400줄 → Hook with refactoring 검토
│  └─ No, > 400줄 → Service 또는 State Machine 검토
```

### 마이그레이션 경로

```typescript
// Phase 1: 기본 Hook
function useToolbarState() {
  const [state, setState] = createStore({ ...INITIAL });
  return [state, { setDownloading, setLoading, ... }];
}

// Phase 2: 복잡도 증가 → State Machine 이동 검토
// src/shared/state/toolbar-state-machine.ts
export const toolbarSignals = {
  isDownloading: createSignal(false),
  isLoading: createSignal(false),
  // ...
};

// Phase 3: Hook은 State Machine 래퍼로 단순화
function useToolbarState() {
  return [toolbarSignals, { /* 접근자 */ }];
}
```

---

## 🎓 훅 작성 원칙

### 1. Vendor Getter 필수

```typescript
// ✅ 올바른 방식
import { getSolid } from '@shared/external/vendors';

export function useMyHook() {
  const { createSignal, createEffect } = getSolid();
  // ...
}

// ❌ 잘못된 방식
import { createSignal, createEffect } from 'solid-js';
export function useMyHook() {
  // ...
}
```

**이유**: TDZ(Temporal Dead Zone) 문제 회피, 테스트 모킹 용이, 디커플링

### 2. 명시적 타입 정의

```typescript
// ✅ 좋은 예
export interface FocusTrapOptions {
  readonly toolbar: HTMLElement;
  readonly offsets: ReadonlyArray<number>;
}

export interface FocusTrapResult {
  readonly isActive: boolean;
  readonly activate: () => void;
  readonly deactivate: () => void;
}

export function useFocusTrap(options: FocusTrapOptions): FocusTrapResult {
  // ...
}

// ❌ 피해야 할 패턴
export function useFocusTrap(options: any) {
  // ...
}
```

### 3. MaybeAccessor 패턴 (입력값 유연성)

```typescript
// ✅ 값 또는 Accessor 모두 허용
type MaybeAccessor<T> = T | (() => T);

export function useFocusTrap(
  containerRef: MaybeAccessor<HTMLElement | null>,
  isActive: MaybeAccessor<boolean>
): FocusTrapResult {
  const { createEffect } = getSolid();

  // 입력값 정규화
  const resolveContainer = () =>
    typeof containerRef === 'function' ? containerRef() : containerRef;
  const resolveIsActive = () =>
    typeof isActive === 'function' ? isActive() : isActive;

  createEffect(() => {
    const container = resolveContainer();
    const active = resolveIsActive();
    // ...
  });
}

// 호출 방식 (둘 다 가능)
const [containerRef, setContainerRef] = createSignal<HTMLElement | null>(null);

// 1. Accessor 전달
useFocusTrap(containerRef, isOpen);

// 2. 값 직접 전달
useFocusTrap(containerElement, true);
```

### 4. 정리 로직 필수

```typescript
// ✅ onCleanup으로 리소스 정리
export function useEventListener(
  element: MaybeAccessor<HTMLElement | null>,
  event: string,
  handler: EventListener
): void {
  const { createEffect, onCleanup } = getSolid();

  createEffect(() => {
    const el = resolveElement(element);
    if (!el) return;

    el.addEventListener(event, handler);

    // 정리 (컴포넌트 언마운트 시)
    onCleanup(() => {
      el.removeEventListener(event, handler);
    });
  });
}

// ❌ 정리 로직 없음
export function useEventListener(element, event, handler) {
  element.addEventListener(event, handler); // 리소스 누수!
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
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

// ❌ 과도한 사이드이펙트
export function useToggle(initialValue = false) {
  const [isOpen, setIsOpen] = createSignal(initialValue);

  // 불필요한 효과들
  createEffect(() => {
    console.log(`Toggle: ${isOpen()}`); // 로깅만을 위해?
  });

  createEffect(() => {
    localStorage.setItem('toggle-state', String(isOpen())); // 상태 저장은 훅 책임 X
  });

  return { isOpen, toggle };
}
```

---

## 📏 훅 크기 기준

| 크기      | 평가         | 권장사항                          |
| --------- | ------------ | --------------------------------- |
| < 100줄   | ✅ 매우 우수 | 재사용 가능하고 테스트하기 쉬움   |
| 100-200줄 | ✅ 좋음      | 단일 책임 명확 (리뷰 필수)        |
| 200-300줄 | ⚠️ 검토 필요 | 책임 분리/State Machine 이동 검토 |
| 300-400줄 | ❌ 필수 개선 | 즉시 분리 (서비스/상태머신으로)   |
| > 400줄   | 🚫 금지      | 아키텍처 오류, 재설계 필수        |

### 예시: 크기별 분류

```typescript
// ✅ 80줄 - Hook 적절
export function useFocusTrap(containerRef, isActive) {
  const { createEffect, onCleanup } = getSolid();
  let trap: FocusTrap | null = null;

  createEffect(() => {
    const container = resolveElement(containerRef);
    if (!container) return;

    trap = createFocusTrap(container);
    if (resolveIsActive()) trap.activate();

    onCleanup(() => trap?.destroy());
  });

  return { isActive: () => !!trap?.isActive() };
}

// ⚠️ 250줄 - 분리 검토
export function useToolbarSettingsController(options) {
  // 설정 패널 토글, 외부 클릭 감지, 고대비 감지, 테마/언어 변경
  // → 3개 책임 혼재
  // Solution:
  // 1. 고대비 감지 → useHighContrastDetector()로 분리
  // 2. 테마/언어 → useSettingsState()로 분리
  // 3. 패널 토글 → useSettingsPanel()로 분리 또는 상태머신으로 이동
}
```

---

## 📚 모범 사례

### 패턴 1: 토글 훅

```typescript
// ✅ 재사용 가능한 Toggle 훅
export interface UseToggleOptions {
  readonly initialValue?: boolean;
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
}

export interface UseToggleResult {
  readonly isOpen: Accessor<boolean>;
  readonly toggle: () => void;
  readonly open: () => void;
  readonly close: () => void;
}

export function useToggle(options: UseToggleOptions = {}): UseToggleResult {
  const { createSignal, createEffect } = getSolid();
  const { initialValue = false, onOpen, onClose } = options;

  const [isOpen, setIsOpen] = createSignal(initialValue);

  // 상태 변경 시 콜백 실행
  createEffect(() => {
    const open = isOpen();
    if (open && onOpen) onOpen();
    if (!open && onClose) onClose();
  });

  return {
    isOpen,
    toggle: () => setIsOpen(prev => !prev),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

// 사용
const modal = useToggle({
  onOpen: () => console.log('Modal opened'),
  onClose: () => console.log('Modal closed'),
});
```

### 패턴 2: 폼 값 관리

```typescript
// ✅ 재사용 가능한 Form Value 훅
export interface UseFormValueResult<T> {
  readonly value: Accessor<T>;
  readonly setValue: (value: T) => void;
  readonly reset: () => void;
  readonly isDirty: Accessor<boolean>;
}

export function useFormValue<T>(initialValue: T): UseFormValueResult<T> {
  const { createSignal, createMemo } = getSolid();

  const [value, setValue] = createSignal(initialValue);
  const isDirty = createMemo(() => JSON.stringify(value()) !== JSON.stringify(initialValue));

  return {
    value,
    setValue,
    reset: () => setValue(initialValue),
    isDirty,
  };
}

// 사용
const username = useFormValue('');
const email = useFormValue('');

return (
  <>
    <input value={username.value()} onChange={e => username.setValue(e.target.value)} />
    {username.isDirty() && <span>*</span>}
  </>
);
```

### 패턴 3: 리소스 관리

```typescript
// ✅ 리소스 할당/정리를 자동화하는 훅
export interface UseResourceOptions<T> {
  readonly create: () => T;
  readonly cleanup?: (resource: T) => void;
}

export interface UseResourceResult<T> {
  readonly resource: Accessor<T | null>;
  readonly isLoading: Accessor<boolean>;
}

export function useResource<T>(
  options: UseResourceOptions<T>
): UseResourceResult<T> {
  const { createEffect, onCleanup } = getSolid();
  const { create, cleanup } = options;

  const [resource, setResource] = createSignal<T | null>(null);

  createEffect(() => {
    try {
      const res = create();
      setResource(res);

      onCleanup(() => {
        if (cleanup) cleanup(res);
        setResource(null);
      });
    } catch (error) {
      // 에러 처리
      setResource(null);
    }
  });

  return { resource, isLoading: () => resource() === null };
}

// 사용 예: IntersectionObserver
const observer = useResource({
  create: () => new IntersectionObserver(handleIntersection),
  cleanup: obs => obs.disconnect(),
});
```

---

## ⚠️ 안티패턴

### 안티패턴 1: 훅 내 직접 localStorage 접근

```typescript
// ❌ 피해야 할 패턴
export function useSettings() {
  const { createEffect } = getSolid();
  const [settings, setSettings] = createSignal({});

  createEffect(() => {
    // 직접 localStorage 접근 - 사이드이펙트
    const saved = localStorage.getItem('settings');
    setSettings(JSON.parse(saved || '{}'));
  });

  return settings;
}

// ✅ 올바른 패턴 (서비스에서 처리)
export function useSettings() {
  const settingsService = getSettingsService();
  const [settings, setSettings] = createSignal(settingsService.load());
  return settings;
}
```

### 안티패턴 2: 직접 DOM 조작

```typescript
// ❌ 피해야 할 패턴
export function useHighlight() {
  const [isActive, setIsActive] = createSignal(false);

  createEffect(() => {
    // 직접 DOM 조작
    document.body.classList.toggle('highlight', isActive());
  });

  return { isActive, toggle: () => setIsActive(prev => !prev) };
}

// ✅ 올바른 패턴 (JSX 클래스 바인딩)
// 또는 CSS 변수 설정
export function useHighlight() {
  const [isActive, setIsActive] = createSignal(false);

  return { isActive, toggle: () => setIsActive(prev => !prev) };
}

// 컴포넌트에서
<div class={isActive() ? 'highlight' : ''}>...</div>
```

### 안티패턴 3: 과도한 의존성

```typescript
// ❌ 너무 많은 의존성
export function useComplexLogic(
  service1,
  service2,
  service3,
  service4,
  service5,
  config
) {
  // 5개 이상 의존성 - 책임이 너무 많음
}

// ✅ 의존성 주입 또는 분리
export function useSimpleLogic(primaryService) {
  const { getSecondaryService } = getSolid();
  // 또는 컴포넌트에서 조율
}
```

---

## 🧪 테스트 전략

### 테스트 파일 위치

```
src/shared/hooks/
├── use-focus-trap.ts
├── use-toolbar-state.ts
└── toolbar/
    └── use-toolbar-settings-controller.ts

test/unit/shared/hooks/
├── use-focus-trap.test.tsx
├── use-toolbar-state.test.ts
└── toolbar/
    └── use-toolbar-settings-controller.test.tsx
```

### 테스트 패턴 1: Signal 테스트

```typescript
// ✅ 훅에서 Signal 변경 검증
describe('useToggle', () => {
  it('should toggle value', () => {
    let toggleState: boolean | undefined;

    const { cleanup } = render(() => {
      const toggle = useToggle();
      createEffect(() => {
        toggleState = toggle.isOpen();
      });
      return null;
    });

    expect(toggleState).toBe(false);

    // 상태 변경 트리거
    act(() => {
      // 명시적 상태 변경 필요
    });

    cleanup();
  });
});
```

### 테스트 패턴 2: 이펙트 검증

```typescript
// ✅ onCleanup 콜백 테스트
describe('useEventListener', () => {
  it('should attach and remove listener', () => {
    const handler = vi.fn();
    const element = document.createElement('div');

    const { cleanup } = render(() => {
      useEventListener(() => element, 'click', handler);
      return null;
    });

    // 리스너 등록 검증
    element.click();
    expect(handler).toHaveBeenCalled();

    // 정리 후 리스너 제거 검증
    cleanup();
    handler.mockClear();
    element.click();
    expect(handler).not.toHaveBeenCalled();
  });
});
```

### 테스트 패턴 3: 옵션 검증

```typescript
// ✅ 옵션 전달 및 콜백 검증
describe('useToggle', () => {
  it('should call onOpen/onClose callbacks', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    const { cleanup } = render(() => {
      const toggle = useToggle({ onOpen, onClose });

      return (
        <button onClick={() => toggle.open()}>Open</button>
      );
    });

    screen.getByRole('button').click();
    expect(onOpen).toHaveBeenCalled();

    cleanup();
  });
});
```

---

## 🔄 마이그레이션 경로

### 기존 Hook → 현대화 (Phase 2025-10-26)

#### 1단계: 타입 업데이트

```typescript
// Before (느슨한 타입)
export function useToolbarState() {
  const [state, setState] = createStore({...});
  return [state, {...}];
}

// After (명시적 타입)
export interface ToolbarState { /* ... */ }
export interface ToolbarActions { /* ... */ }

export function useToolbarState(): [ToolbarState, ToolbarActions] {
  const [state, setState] = createStore<ToolbarState>({...});
  return [state, {...}];
}
```

#### 2단계: 헬퍼 함수 분리

```typescript
// Before (훅과 섞여있음)
export function useToolbarState() {
  /* ... */
}
export function getToolbarDataState(state) {
  /* 유틸 */
}

// After (분리됨)
// hooks/use-toolbar-state.ts
export function useToolbarState() {
  /* ... */
}

// utils/toolbar-utils.ts
export function getToolbarDataState(state) {
  /* 유틸 */
}
```

#### 3단계: 복잡 로직 분리

```typescript
// Before (476줄 한 파일)
export function useToolbarSettingsController(options) {
  // 패널 토글 + 고대비 감지 + 테마 변경 섞여있음
}

// After (책임 분리)
// services/high-contrast-detection.ts
export function evaluateHighContrast(input) { /* ... */ }

// hooks/use-toolbar-settings-controller.ts (376줄로 감소)
export function useToolbarSettingsController(options) {
  // 고대비 감지는 위임
  const shouldEnable = evaluateHighContrast({...});
  // ...
}
```

---

## 📖 참고 자료

- `ARCHITECTURE.md` - 훅의 계층 구조
- `CODING_GUIDELINES.md` - 코드 스타일 및 vendor getter
- `TESTING_STRATEGY.md` - 테스트 전략 (JSDOM 제약 등)
- 실제 예제: `src/shared/hooks/use-focus-trap.ts`

---

**작성**: 2025-10-26 **최종 업데이트**: GitHub Copilot
