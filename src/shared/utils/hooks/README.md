# Hook Utilities

**Phase 350**: 재사용 가능한 Hook 유틸리티 모음

## 📦 개요

Solid.js 기반 프로젝트에서 자주 사용되는 패턴을 공통 유틸리티로 추상화했습니다.

- **Observer 관리**: IntersectionObserver, MutationObserver, ResizeObserver
- **타이머 관리**: 자동 cleanup, debounce, retry 패턴
- **Signal 헬퍼**: 타입 안전한 상태 업데이트

## 🚀 Quick Start

```typescript
import {
  createManagedIntersectionObserver,
  createTimerGroup,
  updatePartial,
} from '@shared/utils/hooks';

// Observer 자동 관리
const observer = createManagedIntersectionObserver(
  entries => {
    entries.forEach(entry => {
      console.log('Visible:', entry.isIntersecting);
    });
  },
  { threshold: 0.5 }
);

observer.observe(element);
// cleanup
observer.disconnect();

// 타이머 그룹 관리
const timers = createTimerGroup();
timers.setTimeout(() => console.log('A'), 1000);
timers.setInterval(() => console.log('B'), 500);
// cleanup
timers.cancelAll();

// Signal 상태 업데이트
const [state, setState] = createSignal({ count: 0, name: 'John' });
updatePartial(setState, { count: 5 });
```

## 📚 API 문서

### Observer Lifecycle

#### `createManagedIntersectionObserver`

IntersectionObserver를 자동 관리합니다.

```typescript
const observer = createManagedIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
  }
): ManagedObserver<'intersection'>
```

**반환값**:

- `observer`: IntersectionObserver 인스턴스
- `targets`: Set<Element> - 관찰 중인 요소들
- `observe(target)`: 요소 관찰 시작
- `unobserve(target)`: 특정 요소 관찰 중지
- `disconnect()`: 모든 관찰 중지 및 정리
- `isActive()`: 활성 상태 확인

**특징**:

- ✅ 자동 타겟 관리 (중복 방지)
- ✅ 타입 안전
- ✅ 간단한 cleanup

#### `createManagedMutationObserver`

MutationObserver를 자동 관리합니다.

```typescript
const observer = createManagedMutationObserver(
  callback: MutationCallback,
  options?: {
    childList?: boolean;
    subtree?: boolean;
    attributes?: boolean;
    attributeFilter?: string[];
    characterData?: boolean;
  }
): ManagedObserver<'mutation'>
```

#### `createManagedResizeObserver`

ResizeObserver를 자동 관리합니다.

```typescript
const observer = createManagedResizeObserver(
  callback: ResizeObserverCallback,
  options?: { box?: ResizeObserverBoxOptions }
): ManagedObserver<'resize'>
```

#### `createObserverGroup`

여러 Observer를 그룹으로 관리합니다.

```typescript
const group = createObserverGroup();
group.add(intersectionObserver);
group.add(mutationObserver);
// 일괄 정리
group.disconnectAll();
```

---

### Timer Cleanup

#### `createManagedTimeout`

자동 정리되는 setTimeout입니다.

```typescript
const timer = createManagedTimeout(
  callback: () => void,
  delay: number
): ManagedTimer

// 수동 취소
timer.cancel();
// 상태 확인
timer.isActive(); // boolean
```

#### `createManagedInterval`

자동 정리되는 setInterval입니다.

```typescript
const timer = createManagedInterval(
  callback: () => void,
  interval: number
): ManagedTimer
```

#### `createTimerGroup`

여러 타이머를 그룹으로 관리합니다.

```typescript
const group = createTimerGroup();
const timer1 = group.setTimeout(() => {
  /*...*/
}, 1000);
const timer2 = group.setInterval(() => {
  /*...*/
}, 500);

// 일괄 취소
group.cancelAll();

// 활성 타이머 수 확인
group.getActiveCount(); // number
```

#### `createDebouncedFunction`

Debounce 패턴을 쉽게 구현합니다.

```typescript
const debouncedFn = createDebouncedFunction(
  () => console.log('Debounced!'),
  300
);

debouncedFn(); // 300ms 후 실행
debouncedFn(); // 이전 타이머 취소, 새로 300ms

// cleanup
debouncedFn.cancel();
```

#### `retryWithBackoff`

지수 백오프를 사용한 재시도 로직입니다.

```typescript
const result = await retryWithBackoff(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed');
    return response.json();
  },
  {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 5000,
    backoffFactor: 2,
  }
);
```

---

### Signal State Helpers

#### `updatePartial`

객체 Signal의 일부 필드만 업데이트합니다.

```typescript
const [state, setState] = createSignal({ count: 0, name: 'John' });
updatePartial(setState, { count: 5 });
// { count: 5, name: 'John' }
```

#### `mergeDeep`

중첩된 객체를 깊게 병합합니다.

```typescript
const [state, setState] = createSignal({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark' },
});

mergeDeep(setState, {
  user: { age: 31 },
  settings: { fontSize: 14 },
});
// user: { name: 'John', age: 31 }, settings: { theme: 'dark', fontSize: 14 }
```

#### `resetToInitial`

Signal을 초기값으로 리셋합니다.

```typescript
const initialState = { count: 0 };
const [state, setState] = createSignal(initialState);

setState({ count: 10 });
resetToInitial(setState, initialState);
// { count: 0 }
```

#### `updateIf`

조건이 참일 때만 상태를 업데이트합니다.

```typescript
const [count, setCount] = createSignal(0);
const updated = updateIf(
  setCount,
  () => count(),
  current => current < 10,
  prev => prev + 1
);
// count < 10일 때만 증가, 반환값: boolean
```

#### Boolean Helpers

```typescript
const [isOpen, setIsOpen] = createSignal(false);
toggle(setIsOpen); // true
```

#### Number Helpers

```typescript
const [count, setCount] = createSignal(0);
increment(setCount, 5); // 5
decrement(setCount, 2); // 3
```

#### Array Helpers

```typescript
const [items, setItems] = createSignal<number[]>([]);

// 추가
pushItem(setItems, 1, 2, 3); // [1, 2, 3]

// 필터
filterItems(setItems, x => x % 2 === 0); // [2]

// 매핑
mapItems(setItems, x => x * 2); // [4]

// 인덱스 기반 업데이트
updateItemAt(setItems, () => items(), 0, 10); // [10]

// 인덱스 기반 제거
removeItemAt(setItems, () => items(), 0); // []
```

#### Batch Update

```typescript
import { getSolid } from '@shared/external/vendors';
const { batch } = getSolid();

const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('');

batchUpdate(batch, () => {
  setCount(10);
  setName('John');
});
// 단일 렌더링 사이클
```

---

## 🎯 사용 사례

### Case 1: Intersection Observer Hook

```typescript
import { getSolid } from '@shared/external/vendors';
import { createManagedIntersectionObserver } from '@shared/utils/hooks';

export function useIntersectionObserver(
  target: () => Element | null,
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit
) {
  const { onCleanup } = getSolid();

  const observer = createManagedIntersectionObserver(entries => {
    entries.forEach(entry => callback(entry.isIntersecting));
  }, options);

  const targetEl = target();
  if (targetEl) {
    observer.observe(targetEl);
  }

  onCleanup(() => observer.disconnect());

  return { observer };
}
```

### Case 2: Debounced Input Hook

```typescript
import { getSolid } from '@shared/external/vendors';
import { createDebouncedFunction } from '@shared/utils/hooks';

export function useDebouncedInput(
  onInput: (value: string) => void,
  delay = 300
) {
  const { onCleanup } = getSolid();

  const debouncedFn = createDebouncedFunction(onInput, delay);

  onCleanup(() => debouncedFn.cancel());

  return { handleInput: debouncedFn };
}
```

### Case 3: Timer-based Polling Hook

```typescript
import { getSolid } from '@shared/external/vendors';
import { createTimerGroup } from '@shared/utils/hooks';

export function usePolling(
  pollFn: () => void,
  interval: number,
  enabled = true
) {
  const { onCleanup } = getSolid();
  const timers = createTimerGroup();

  if (enabled) {
    timers.setInterval(pollFn, interval);
  }

  onCleanup(() => timers.cancelAll());

  return { timers };
}
```

---

## 📊 성능 특성

| 유틸리티      | 오버헤드 | 메모리 | 권장 사용 |
| ------------- | -------- | ------ | --------- |
| Observer 관리 | 최소     | ~1KB   | 항상      |
| Timer 관리    | 최소     | ~500B  | 항상      |
| Signal 헬퍼   | 없음     | 0      | 항상      |
| Observer 그룹 | 최소     | ~2KB   | 3개 이상  |
| Timer 그룹    | 최소     | ~1KB   | 5개 이상  |

---

## 🔧 개발 가이드

### 새 유틸리티 추가 시

1. **단일 책임 원칙**: 하나의 책임만 가지도록
2. **타입 안전성**: 모든 파라미터와 반환값에 타입 명시
3. **에러 처리**: 적절한 에러 메시지와 로깅
4. **문서화**: JSDoc 주석 필수
5. **테스트**: 단위 테스트 작성

### 테스트 작성

```typescript
import { describe, it, expect } from 'vitest';
import { createManagedTimeout } from '@shared/utils/hooks';

describe('createManagedTimeout', () => {
  it('should create a managed timer', () => {
    let executed = false;
    const timer = createManagedTimeout(() => {
      executed = true;
    }, 100);

    expect(timer.isActive()).toBe(true);
    timer.cancel();
    expect(timer.isActive()).toBe(false);
  });
});
```

---

## 🚫 안티패턴

### ❌ 직접 Observer 생성

```typescript
// ❌ Bad
const observer = new IntersectionObserver(/*...*/);
observer.observe(element);
// cleanup 누락 위험

// ✅ Good
const observer = createManagedIntersectionObserver(/*...*/);
observer.observe(element);
observer.disconnect(); // 명시적 cleanup
```

### ❌ 타이머 수동 관리

```typescript
// ❌ Bad
const timerId = setTimeout(/*...*/);
const intervalId = setInterval(/*...*/);
// cleanup 복잡

// ✅ Good
const timers = createTimerGroup();
timers.setTimeout(/*...*/);
timers.setInterval(/*...*/);
timers.cancelAll(); // 일괄 cleanup
```

### ❌ 반복적인 Signal 업데이트

```typescript
// ❌ Bad
setter(prev => ({ ...prev, field1: value1 }));
setter(prev => ({ ...prev, field2: value2 }));

// ✅ Good
updatePartial(setter, { field1: value1, field2: value2 });
```

---

## 📝 변경 이력

### v1.0.0 (Phase 350)

- ✨ 초기 릴리스
- 🎯 Observer 관리 (3종)
- ⏱️ Timer 관리 (5개 함수)
- 🎨 Signal 헬퍼 (15개 함수)
- 📦 배럴 export 구성

---

## 🤝 기여

새로운 유틸리티 추가 시:

1. `src/shared/utils/hooks/` 하위에 파일 생성
2. 타입 정의 및 JSDoc 작성
3. `index.ts`에 export 추가
4. 단위 테스트 작성 (`test/unit/shared/utils/hooks/`)
5. 이 README 업데이트

---

## 📚 관련 문서

- [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) - 전체 아키텍처
- [CODING_GUIDELINES.md](../../../docs/CODING_GUIDELINES.md) - 코딩 규칙
- [Phase 329 Event System](../events/README.md) - 이벤트 시스템 참고
