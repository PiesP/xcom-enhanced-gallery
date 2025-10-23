# Phase 150.3 Step 5: useGalleryFocusTracker 통합 계획

## 개요

**목표**: Phase 150.2에서 생성한 4개 모듈을 `useGalleryFocusTracker.ts`에
통합하여 상태 복잡도 감소

- 상태 변수: 18개 → 8-10개 (55% 감소)
- 코드 라인: 661줄 → ~500줄 (23% 감소)
- API: backward compatible (기존 호출 패턴 유지)

## Phase 150.2 완료 상태 (✅ 78/78 tests PASSED)

### Step 1: FocusState (20/20 ✅)

- **파일**: `src/shared/state/focus/focus-state.ts` (83줄)
- **내용**:
  - `FocusState { index, source, timestamp }`
  - Helper: `createFocusState()`, `isSameFocusState()`, `isValidFocusState()`
  - Constant: `INITIAL_FOCUS_STATE`

### Step 2: ItemCache (17/17 ✅)

- **파일**: `src/shared/state/focus/focus-cache.ts` (175줄)
- **내용**:
  - `ItemEntry { index, element, entry, isVisible }`
  - `ItemCache` class: Map + WeakMap 기반
  - Factory: `createItemCache()`

### Step 3: FocusTimerManager (24/24 ✅)

- **파일**: `src/shared/state/focus/focus-timer-manager.ts` (237줄)
- **내용**:
  - `FocusTimerManager` class: 역할 기반 타이머 관리
  - Roles: 'auto-focus', 'recompute', 'flush-batch', 'auto-focus-debounce'
  - Factory: `createFocusTimerManager()`

### Step 4: FocusTracking (17/17 ✅)

- **파일**: `src/shared/state/focus/focus-tracking.ts` (87줄)
- **내용**:
  - `FocusTracking { lastAutoFocusedIndex, lastAppliedIndex, hasPendingRecompute, lastUpdateTime }`
  - Helper: `createFocusTracking()`, `isSameFocusTracking()`,
    `updateFocusTracking()`, `resetFocusTracking()`

## useGalleryFocusTracker.ts 현황

**파일**: `src/features/gallery/hooks/useGalleryFocusTracker.ts` (661줄)

### 현재 상태 변수 (18개)

#### Signals (2개)

```typescript
const [manualFocusIndex, setManualFocusIndex] = createSignal<number | null>(
  null
);
const [autoFocusIndex, setAutoFocusIndex] = createSignal<number | null>(null);
```

→ **통합 대상**: FocusState Signal 1개

#### Maps (3개)

```typescript
const itemElements = new Map<number, HTMLElement>();
const elementToIndex = new WeakMap<HTMLElement, number>();
const entryCache = new Map<number, IntersectionObserverEntry>();
```

→ **통합 대상**: ItemCache 인스턴스 1개

#### Observer & Timers (1개)

```typescript
let observer: IntersectionObserver | null = null;
let autoFocusTimerId: number | null = null; // + recomputeTimerId?, flushBatchTimerId?
```

→ **통합 대상**: FocusTimerManager 인스턴스 1개

#### Tracking Variables (4개)

```typescript
let lastAutoFocusedIndex: number | null = null;
let lastAppliedIndex: number | null = null;
let hasPendingRecompute = false;
let lastUpdateTime?: number;  // implicit
```

→ **통합 대상**: FocusTracking Signal 1개

#### Other State

- Memos: focusedIndex 1개
- Debouncers: debouncedSetAutoFocusIndex, debouncedUpdateContainerFocusAttribute
  (2개)
- Misc: pendingFocusIndex?, focusBatchScheduled? (2개)

## 통합 계획 (7단계)

### Step 1: Import 추가

```typescript
import type { FocusState } from '../../../shared/state/focus/focus-state';
import {
  INITIAL_FOCUS_STATE,
  createFocusState,
  isSameFocusState,
} from '../../../shared/state/focus/focus-state';
import {
  createItemCache,
  type ItemCache,
} from '../../../shared/state/focus/focus-cache';
import {
  createFocusTimerManager,
  type FocusTimerManager,
} from '../../../shared/state/focus/focus-timer-manager';
import type { FocusTracking } from '../../../shared/state/focus/focus-tracking';
import {
  createFocusTracking,
  isSameFocusTracking,
  updateFocusTracking,
} from '../../../shared/state/focus/focus-tracking';
```

### Step 2: FocusState Signal 도입

**Before**:

```typescript
const [manualFocusIndex, setManualFocusIndex] = createSignal<number | null>(
  null
);
const [autoFocusIndex, setAutoFocusIndex] = createSignal<number | null>(null);
```

**After**:

```typescript
// ✅ Phase 150.3 Step 5.1: FocusState Signal 통합
// manualFocusIndex + autoFocusIndex → 단일 FocusState Signal
// source: 'auto' | 'manual' | 'external'로 포커스 출처 추적
const [focusState, setFocusState] =
  createSignal<FocusState>(INITIAL_FOCUS_STATE);

// Backward compatibility: getter 헬퍼 (테스트용)
// const manualFocusIndex = () => (focusState().source === 'manual' ? focusState().index : null);
// const autoFocusIndex = () => (focusState().source === 'auto' ? focusState().index : null);
```

**수정 영향도**:

- `focusedIndex` createMemo: `focusState().index` 사용
- `debouncedSetAutoFocusIndex`: `focusState` 기반으로 리팩토링
- `setManualFocus`: `focusState` 업데이트로 변경

### Step 3: ItemCache 도입

**Before**:

```typescript
const itemElements = new Map<number, HTMLElement>();
const elementToIndex = new WeakMap<HTMLElement, number>();
const entryCache = new Map<number, IntersectionObserverEntry>();
```

**After**:

```typescript
// ✅ Phase 150.3 Step 5.2: ItemCache 통합
const itemCache = createItemCache();

// ItemCache 메서드:
// - setItem(index, element)
// - getElement(index): HTMLElement | null
// - getEntry(index): IntersectionObserverEntry | null
// - setEntry(index, entry)
// - getIndex(element): number | undefined
// - has(index): boolean
// - delete(index): boolean
// - clear()
```

**수정 영향도**:

- `registerItem`: `itemCache.setItem()` 사용
- `observer.observe/unobserve`: 내부 함수에서 itemCache 업데이트
- `getVisibleIndices()`: itemCache 기반 조회
- `updateContainerFocusAttribute`: itemCache 활용

### Step 4: FocusTimerManager 도입

**Before**:

```typescript
let autoFocusTimerId: number | null = null;
// + implicit recomputeTimerId, flushBatchTimerId
```

**After**:

```typescript
// ✅ Phase 150.3 Step 5.3: FocusTimerManager 통합
const timerManager = createFocusTimerManager();

// 타이머 역할 (roles):
// - 'auto-focus': 자동 포커스 타이머
// - 'recompute': 재계산 타이머
// - 'flush-batch': 배치 플러시 타이머
// - 'auto-focus-debounce': 자동 포커스 debounce

// 메서드:
// - setTimer(role, callback, delay): number
// - clearTimer(role): void
// - clearAll(): void
// - dispose(): void (cleanup)
```

**수정 영향도**:

- 타이머 설정 모든 위치: `timerManager.setTimer()` 사용
- 타이머 해제 모든 위치: `timerManager.clearTimer()` 또는
  `timerManager.clearAll()` 사용
- `onCleanup`: `timerManager.dispose()` 호출

### Step 5: FocusTracking Signal 도입

**Before**:

```typescript
let lastAutoFocusedIndex: number | null = null;
let lastAppliedIndex: number | null = null;
let hasPendingRecompute = false;
```

**After**:

```typescript
// ✅ Phase 150.3 Step 5.4: FocusTracking Signal 통합
const [tracking, setTracking] = createSignal<FocusTracking>(
  createFocusTracking()
);

// FocusTracking 필드:
// - lastAutoFocusedIndex
// - lastAppliedIndex
// - hasPendingRecompute
// - lastUpdateTime

// Helper 사용:
// - isSameFocusTracking(tracking1, tracking2): boolean
// - updateFocusTracking(tracking, updates): FocusTracking
// - resetFocusTracking(): FocusTracking
```

**수정 영향도**:

- 추적 변수 모든 읽기: `tracking().<field>` 접근
- 추적 변수 모든 업데이트:
  `setTracking(updateFocusTracking(tracking(), { ... }))`

### Step 6: 메서드 리팩토링

#### registerItem()

```typescript
// Before: itemElements.set, elementToIndex.set, entryCache init
// After: itemCache.setItem(index, element)
```

#### handleItemFocus()/handleItemBlur()

```typescript
// Before: setManualFocusIndex(index)
// After: setFocusState(createFocusState(index, 'manual'))
```

#### setManualFocus()

```typescript
// Before: setManualFocusIndex(index), autoFocusTimerId 취소
// After: setFocusState(...), timerManager.clearTimer('auto-focus')
```

#### IntersectionObserver 콜백

```typescript
// Before: entryCache.set(), lastAutoFocusedIndex 업데이트
// After: itemCache.setEntry(), setTracking(updateFocusTracking(...))
```

### Step 7: Cleanup & Validation

```typescript
// onCleanup 내부:
onCleanup(() => {
  observer?.disconnect();
  timerManager.dispose(); // 새로 추가
  itemCache.clear(); // 새로 추가
  // 기존 변수들은 GC 처리
});
```

## 통합 테스트 계획

### 기존 테스트 호환성 (73개)

- 모든 기존 테스트는 수정 없이 PASS해야 함
- API 호출 패턴 유지 (backward compatible)
- focusedIndex, registerItem, handleItemFocus, setManualFocus 등 공개 API는 동일

### 새로운 통합 테스트 (3-5개 예상)

1. **focusState Signal 통합 검증**
   - `setFocusState(createFocusState(index, 'auto'))` 호출 시 focusedIndex 변경
     확인
   - 기존 `autoFocusIndex()` getter 호환성 검증

2. **ItemCache 통합 검증**
   - `itemCache.setItem()` 호출 시 아이템 등록 확인
   - 삭제/조회 기능 동작 확인

3. **FocusTimerManager 통합 검증**
   - 타이머 설정/해제 작동 확인
   - dispose() 호출 시 모든 타이머 정리 확인

4. **FocusTracking Signal 통합 검증**
   - tracking 상태 업데이트 확인
   - isSameFocusTracking 비교 기능 검증

5. **엔드-투-엔드 포커스 흐름**
   - 자동 포커스 → 수동 포커스 → 자동 포커스 전환 시 상태 관리 확인

## 구현 작업 예상 시간

- **분석 & 설계**: 30분 ✅ (완료)
- **Step 1-2 (FocusState)**: 1시간
- **Step 3 (ItemCache)**: 1시간
- **Step 4 (FocusTimerManager)**: 1시간
- **Step 5 (FocusTracking)**: 1시간
- **Step 6 (메서드 리팩토링)**: 1.5시간
- **Step 7 (Cleanup & 테스트)**: 1시간
- **전체 빌드 & 검증**: 30분
- **문서 작성**: 30분

**총 예상**: 7-8시간

## 번들 크기 영향 (예상)

- Phase 150.2 모듈 추가: +1-2 KB (이미 반영됨)
- useGalleryFocusTracker 축소: -2-3 KB (함수 크기 감소)
- **순변화**: ±0-1 KB (예상)
- **최종 빌드 크기**: 331-333 KB (335 KB 예산 유지)

## 리스크 & 완화 전략

### 리스크 1: Backward Compatibility 깨짐

- **위험도**: 높음
- **완화**: 기존 API 호출 패턴 유지, 기존 73개 테스트 PASS 확인

### 리스크 2: 복잡한 refactor로 인한 버그

- **위험도**: 중간
- **완화**: 단계별 구현, 각 단계마다 테스트 실행

### 리스크 3: 번들 크기 증가

- **위험도**: 낮음 (모듈 추가량 < 감소량)
- **완화**: 최종 빌드 검증

## 성공 기준

- ✅ 기존 73개 테스트 모두 PASS
- ✅ 새로운 통합 테스트 3-5개 추가 및 PASS
- ✅ 최종 빌드 크기 335 KB 이하
- ✅ TypeScript strict 모드 통과
- ✅ Linting/Formatting 통과
- ✅ E2E 테스트 통과 (Playwright 스모크)
- ✅ 코드 라인 661줄 → 500줄 이상 감소 (23% 이상)
- ✅ 상태 변수 18개 → 8-10개 (55% 이상 감소)

## 다음 단계

- Phase 150.3 완료 후:
  - 상태 변수/라인 감소 확인
  - 버전 업데이트 (v150.3.0)
  - Phase 150.4 계획 검토 (추가 최적화 또는 다른 모듈)

---

**상태**: 계획 수립 완료, 구현 대기 중 **예상 시작**: 2025-10-23 **담당자**:
xcom-enhanced-gallery 팀
