# SolidJS 네이티브 패턴 마이그레이션 가이드

> SOLID-NATIVE-001 Phase G-2 완료 — 유틸리티 레이어 전환 가이드 (2025-01-01)

## 개요

이 문서는 레거시 `createGlobalSignal` 패턴에서 SolidJS 네이티브 패턴으로
점진적으로 마이그레이션하는 방법을 설명합니다.

### 핵심 원칙

1. **100% 레거시 호환성**: 기존 코드는 그대로 작동해야 함
2. **점진적 전환**: 파일 단위로 순차적 마이그레이션
3. **타입 안전성**: TypeScript strict 모드 유지
4. **성능 향상**: 네이티브 메모이제이션 활용

---

## 패턴 비교표

| 항목            | 레거시 (createGlobalSignal) | 네이티브 (SolidJS)                 |
| --------------- | --------------------------- | ---------------------------------- |
| **상태 생성**   | `createGlobalSignal(0)`     | `createSignal(0)`                  |
| **값 읽기**     | `signal.value`              | `signal()`                         |
| **값 쓰기**     | `signal.value = 10`         | `setSignal(10)`                    |
| **구독**        | `signal.subscribe(fn)`      | `createEffect(() => fn(signal()))` |
| **파생 상태**   | `useSelector(signal, fn)`   | `createMemo(() => fn(signal()))`   |
| **비추적 읽기** | `signal.peek()`             | `untrack(() => signal())`          |

---

## 마이그레이션 단계별 가이드

### Step 1: 상태 정의 전환

#### Before (레거시)

```typescript
import { createGlobalSignal } from '@shared/state/createGlobalSignal';

const countSignal = createGlobalSignal(0);

// 사용
console.log(countSignal.value); // 읽기
countSignal.value = 10; // 쓰기
```

#### After (네이티브)

```typescript
import { createSignal } from 'solid-js';

const [count, setCount] = createSignal(0);

// 사용
console.log(count()); // 읽기
setCount(10); // 쓰기
```

#### 과도기 (공존)

```typescript
import { createSignal } from 'solid-js';

// 네이티브 signal
const [count, setCount] = createSignal(0);

// 레거시 호환 래퍼 (필요 시)
const legacyWrapper = {
  get value() {
    return count();
  },
  set value(next: number) {
    setCount(next);
  },
  accessor: count,
  setter: setCount,
};
```

---

### Step 2: 파생 상태 전환

#### Before (레거시)

```typescript
import { useSelector } from '@shared/utils/signalSelector';

const doubled = useSelector(countSignal, n => n * 2);

// 사용
console.log(doubled.value);
```

#### After (네이티브)

```typescript
import { createMemo } from 'solid-js';

const doubled = createMemo(() => count() * 2);

// 사용
console.log(doubled());
```

**장점**:

- SolidJS의 네이티브 반응성 시스템 사용
- 불필요한 래퍼 제거
- 타입 추론 개선

---

### Step 3: 구독 패턴 전환

#### Before (레거시)

```typescript
const unsubscribe = countSignal.subscribe(value => {
  console.log('Count changed:', value);
});

// 정리
unsubscribe();
```

#### After (네이티브)

```typescript
import { createEffect, onCleanup } from 'solid-js';

createEffect(() => {
  console.log('Count changed:', count());
});

// createEffect는 createRoot/컴포넌트 내에서 자동 정리됨
```

**주의사항**:

- `createEffect`는 초기 실행됨 (subscribe는 변경 시만 실행)
- createRoot 또는 컴포넌트 내부에서만 사용
- onCleanup으로 수동 정리 가능

---

### Step 4: 비추적 접근 전환

#### Before (레거시)

```typescript
const current = countSignal.peek();
```

#### After (네이티브)

```typescript
import { untrack } from 'solid-js';

const current = untrack(() => count());
```

---

## 마이그레이션 체크리스트

### 준비 단계

- [ ] Phase G-1 인벤토리 보고서 검토 (`docs/SOLID_NATIVE_INVENTORY_REPORT.md`)
- [ ] 영향받는 파일 목록 확인
- [ ] 우선순위 결정 (Low → Medium → High)

### 파일별 마이그레이션

- [ ] 1. 상태 정의를 `createSignal`로 전환
- [ ] 2. `.value` 접근을 함수 호출로 변경
- [ ] 3. `useSelector` → `createMemo`
- [ ] 4. `.subscribe()` → `createEffect()`
- [ ] 5. 타입 정의 업데이트 (`GlobalSignal<T>` → `[Accessor<T>, Setter<T>]`)
- [ ] 6. 테스트 실행 및 통과 확인

### 검증

- [ ] TypeScript: `npm run typecheck` GREEN
- [ ] Linter: `npm run lint` GREEN
- [ ] Tests: `npm test` GREEN
- [ ] Build: `npm run build` GREEN

---

## 우선순위별 마이그레이션 순서

### 1. Low Risk (우선 착수)

- **파일**: `toolbar.signals.ts`
- **영향**: 작음, 독립적
- **예상 소요**: 2-3시간

### 2. Medium Risk

- **파일**: `download.signals.ts`, `UnifiedToastManager.ts`
- **영향**: 중간, 서비스 레이어 연관
- **예상 소요**: 4-6시간

### 3. High Risk (마지막)

- **파일**: `gallery.signals.ts`, `gallery-store.ts`
- **영향**: 큼, 핵심 로직
- **예상 소요**: 6-8시간

---

## 공통 이슈 및 해결책

### Issue 1: "Cannot read property 'value' of undefined"

**원인**: 네이티브 signal은 `.value` 속성이 없음  
**해결**: `signal()` 함수 호출로 변경

### Issue 2: "createEffect is not defined"

**원인**: createRoot 외부에서 createEffect 호출  
**해결**: createRoot 또는 컴포넌트 내부로 이동

### Issue 3: "Type 'Accessor<T>' is not assignable to type 'GlobalSignal<T>'"

**원인**: 레거시 타입과 네이티브 타입 불일치  
**해결**: 타입 정의를 `Accessor<T>` 또는 `[Accessor<T>, Setter<T>]`로 변경

---

## 성능 개선 효과

### Before (레거시)

- 수동 메모이제이션 (useSelector 내부)
- 래퍼 오버헤드
- 명시적 구독 관리

### After (네이티브)

- 자동 의존성 추적
- 최소 재계산
- 자동 정리

**측정 결과** (Phase G-1 기준):

- 메모리 사용량: ~5% 감소 예상
- 리렌더링 횟수: ~10-20% 감소 예상
- 번들 사이즈: ~2-3KB 감소 예상

---

## 테스트 전략

### Unit Tests

```typescript
import { createRoot } from 'solid-js';

it('should update signal value', () => {
  const result = createRoot(dispose => {
    const [count, setCount] = createSignal(0);

    expect(count()).toBe(0);

    setCount(10);
    expect(count()).toBe(10);

    return count;
  });

  expect(result()).toBe(10);
});
```

### Integration Tests

- 레거시 코드와 네이티브 코드 공존 검증
- 컴포넌트 반응성 검증
- Effect 실행 순서 검증

---

## 다음 단계 (Phase G-3 이후)

1. **State Signals 전환** (`toolbar.signals.ts` → `download.signals.ts` →
   `gallery.signals.ts`)
2. **컴포넌트 최적화** (memo/effect 정리)
3. **레거시 제거** (createGlobalSignal deprecated 후 삭제)
4. **문서 업데이트** (아키텍처 문서 갱신)

---

## 참고 문서

- [SolidJS Reactivity Basics](https://www.solidjs.com/tutorial/introduction_basics)
- [SOLID_NATIVE_INVENTORY_REPORT.md](./SOLID_NATIVE_INVENTORY_REPORT.md)
- [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)
- [Phase G-2 Tests](../test/shared/utils/signal-selector-native.test.ts)

---

**작성일**: 2025-01-01  
**버전**: 1.0.0  
**상태**: Phase G-2 완료, 테스트 100% GREEN
