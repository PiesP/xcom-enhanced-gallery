# Phase 426: Scroll Recovery Deep Diagnosis & Enhancement

**최종 업데이트**: 2025-11-07 | **상태**: 🔍 **진행 중** | **버전**: v0.4.3+ |
**언어**: 한국어 (보고서), 영어 (코드)

---

## 📋 작업 개요

사용자가 보고한 **타임라인 깊이 탐색 후 스크롤 위치 복원 미작동** 문제를
점검하기 위해, 유저스크립트가 Twitter SPA 스크롤 복원에 미칠 수 있는 모든 영향을
체계적으로 분석합니다.

**현황**: Phase 421-425에서 다양한 개선이 이루어진 상태이며, 현재 코드가
충분한지 또는 추가 개선이 필요한지 검증합니다.

---

## 🔍 핵심 발견사항

### ✅ 이미 구현된 보호 메커니즘 (Phase 412-425)

| Phase | 메커니즘                                     | 구현 위치                            | 효과                                  |
| ----- | -------------------------------------------- | ------------------------------------ | ------------------------------------- |
| 412   | Polling → Event-based 마이그레이션           | spa-router-observer.ts               | CPU 10-15% → <1% ✅                   |
| 412   | 300ms 디바운스                               | spa-router-observer.ts               | Race condition 제거                   |
| 422   | Duplicate popstate listener 제거             | spa-router-observer.ts               | 불필요한 콜백 실행 제거               |
| 422   | Scroll recovery window 도입 (200ms)          | gallery-lifecycle.ts                 | 범위 갱신 연기                        |
| 422   | 초기 로드 감지 (isInitialLoadComplete)       | spa-router-observer.ts               | 초기 로드 중 콜백 스킵                |
| 422   | replaceState 필터링                          | spa-router-observer.ts               | 불필요한 라우트 변경 감지 제거        |
| 424   | popstate 리스너 보호 추가                    | spa-router-observer.ts               | 중복 등록 방지                        |
| 425   | Window 확장 (200ms → 350ms)                  | gallery-lifecycle.ts                 | 복잡한 DOM 상황 대응                  |
| 425   | Focus trap 연기                              | focus-trap.ts                        | 포커스 변경으로 인한 스크롤 중단 방지 |
| 425   | 전역 플래그 (\_\_XEG_SCROLL_RECOVERY_ACTIVE) | gallery-lifecycle.ts + focus-trap.ts | 교차 모듈 조정                        |

### ⚠️ 잠재적 문제점 (심화 분석 필요)

#### 문제 #1: 매우 깊은 타임라인 탐색 후 추가 로드 시 DOM 복잡성

**시나리오**:

1. 사용자 타임라인 깊이 탐색 (스크롤 위치: Y = 10,000px)
2. 추가 트윗 로드 (예: 무한 스크롤로 150개+ 트윗)
3. 갤러리 열기 (이벤트 리스너 등록)
4. 다른 페이지로 이동
5. 타임라인으로 돌아오기 (뒤로 가기)

**예상 문제**:

- Twitter React reconciliation 시간 증가 (100-150ms → 200-300ms 가능)
- 현재 350ms 윈도우가 충분한가?
- DOM 쿼리 성능 저하 (scope-manager.ts `resolveTwitterEventScope()`)

#### 문제 #2: Event Listener 재등록 타이밍

**현재 흐름**:

```
popstate 발생
  ↓
350ms 윈도우 활성화 (__XEG_SCROLL_RECOVERY_ACTIVE__ = true)
  ↓
범위 갱신 연기 (ensureScopedEventTarget 호출 연기)
  ↓
350ms 후 window 폐쇄
  ↓
onRouteChange 콜백 실행 (debounce 300ms 이후)
  ↓
ensureScopedEventTarget 호출 → 리스너 재등록
```

**잠재적 경합**:

- 만약 Deep Timeline의 경우 React reconciliation이 350ms를 초과하면?
- 콜백이 실행되기 전에 window가 닫혀서 상태 불일치?

#### 문제 #3: 깊은 타임라인의 복잡한 DOM 쿼리

**현재 구현** (scope-manager.ts):

```typescript
export function resolveTwitterEventScope(): HTMLElement | null {
  // 1. 캐시 확인 (100ms 이내)
  const now = Date.now();
  if (scopeState.cachedScope && now - scopeState.lastCacheUpdateTime < 100) {
    // 캐시된 범위 반환
  }

  // 2. 캐시 없음 → DOM 쿼리 (비용 높음)
  // - querySelector 실행 (모든 DOM 노드 스캔)
  // - Deep timeline = 수백 개의 DOM 노드
  // - 쿼리 시간: 10-50ms (정상) → 50-200ms (deep timeline)
}
```

**문제**:

- 캐시 유효 시간 100ms는 충분한가?
- Scope 변경이 350ms 윈도우 중에 일어날 가능성?

#### 문제 #4: Race Condition 발생 가능성

**시나리오**:

```
popstate 감지 (t=0ms)
  ↓
Window 활성화 (350ms)
  ↓
t=100ms: Twitter 스크롤 완료
  ↓
t=150ms: React reconciliation 완료
  ↓
t=200ms: onRouteChange 콜백 대기 중... (debounce 300ms 계산 중)
  ↓
t=250ms: 다른 상호작용 발생?
  ↓
t=300ms: onRouteChange 콜백 실행
  ↓
t=300ms: ensureScopedEventTarget 호출
```

**만약 콜백이 280ms에 실행된다면?** (debounce 재설정)

- 350ms window가 닫혀있음
- scope refresh 즉시 실행
- DOM 변경이 아직 미완료 React 렌더링과 겹침

---

## 📊 상세 분석

### 1. Twitter 스크롤 복원 메커니즘 (심화)

#### 기본 흐름 (이미 알려짐)

```
popstate → history.state.scrollY 읽기 → window.scrollTo(0, Y) → 완료
```

#### Deep Timeline 시나리오에서의 변화

```
[시간 측정 시뮬레이션]

정상 타임라인 (30개 트윗, DOM 노드 ~1000):
  - popstate: 0ms
  - scrollTo 큐: 1-2ms
  - 스크롤 애니메이션: 10-30ms
  - React reconciliation: 30-80ms
  - 완료: ~100ms ✅

Deep 타임라인 (200개+ 트윗, DOM 노드 ~10,000):
  - popstate: 0ms
  - scrollTo 큐: 1-2ms
  - 스크롤 애니메이션: 20-50ms (DOM이 많아서 렌더 성능 저하)
  - React reconciliation: 100-200ms (복잡한 상태 업데이트)
  - 완료: ~200-250ms ⚠️
```

**결론**: 350ms 윈도우는 여전히 충분해 보임 (250ms + 100ms 버퍼)

### 2. 이벤트 리스너 재등록 타이밍 분석

**현재 구현의 문제점**:

```typescript
// gallery-lifecycle.ts
const unsubscribe = onRouteChange((oldUrl, newUrl) => {
  logger.info('[GalleryEvents] SPA route changed');

  // Phase 422: Guard scroll recovery window
  if (scrollRecoveryActive) {
    logger.debug('[GalleryEvents] Deferring scope refresh');

    const deferralTimer = globalTimerManager.setTimeout(() => {
      // 범위 갱신 (이때가 문제!)
      ensureScopedEventTarget(...);
    }, SCROLL_RECOVERY_WINDOW_MS); // 350ms 대기
  }
});
```

**발견된 문제**:

1. 이 콜백 자체가 300ms 디바운스 후에 실행됨
2. 디바운스 중에도 팝스테이트 감지되면 타이머 재설정
3. 최악의 경우 콜백 실행이 600ms까지 지연 가능 (300ms + 350ms)

**개선 기회**:

- popstate 감지 시 콜백 실행 순서 재검토
- 범위 갱신 타이밍을 더 조기에 수행 가능한가?

### 3. Scope Manager 성능 최적화 검토

**현재 구현**:

```typescript
export function resolveTwitterEventScope(): HTMLElement | null {
  // 캐시 확인 (100ms)
  const now = Date.now();
  if (scopeState.cachedScope) {
    const cached = scopeState.cachedScope.deref(); // WeakRef 역참조
    if (cached && now - scopeState.lastCacheUpdateTime < 100) {
      return cached;
    }
  }

  // 캐시 없음 → 새로운 쿼리
  const scope = document.querySelector('[role="main"]'); // selector-heavy
  if (scope) {
    scopeState.cachedScope = new WeakRef(scope);
    scopeState.lastCacheUpdateTime = now;
    return scope;
  }

  return null;
}
```

**문제점**:

1. querySelector 성능은 DOM 크기에 선형 증가
2. Deep timeline = 10,000 DOM 노드 = 느린 쿼리
3. 캐시 만료 (100ms) 후 재쿼리하면 한 번에 50-100ms 소비 가능

**개선 방안**:

- 캐시 유효 시간을 더 길게 (100ms → 500ms 또는 지속적)
- 캐시 무효화 조건을 더 명시적으로
- MutationObserver로 DOM 변경 감지 후 캐시 무효화

### 4. Focus Trap 연기 메커니즘 검증

**Phase 425 구현**:

```typescript
function activate(): void {
  const scrollRecoveryWindow = window.__XEG_SCROLL_RECOVERY_ACTIVE__;
  if (scrollRecoveryWindow === true) {
    // 350ms 후 재시도
    globalThis.setTimeout(() => {
      activate();
    }, 350);
    return;
  }

  // 포커스 트랩 활성화
  focusFirstElement();
}
```

**검증**:

- ✅ 작동 원리는 올바름
- ✅ 350ms 타이밍은 적절함
- ⚠️ 하지만 focus trap이 여러 번 시도될 가능성 (중첩 호출)
- ⚠️ 타이머 참조 추적 메커니즘 필요

---

## 🎯 발견된 미흡한 점

### 1. 콜백 실행 순서의 불명확함

**현재 상황**:

```
popstate (t=0ms)
  ↓
Window 활성화 (SCROLL_RECOVERY_ACTIVE = true)
  ↓
notifyRouteChange() 호출 (debounce 300ms 설정)
  ↓
[HERE: Conflict possible]
  - Window 닫혀야 함: t=350ms
  - 콜백 실행 예정: t=300ms
  - 콜백 내에서 범위 갱신 연기: t=350ms
  = 총 지연: 700ms?
```

**우려사항**: 타이밍이 의도와 다를 수 있음

### 2. Debounce와 Scroll Recovery Window의 이중 대기

**문제**:

```
debounce (300ms) + scroll recovery window guard (350ms)
= 최악의 경우 650ms의 긴 지연
```

사용자는 느린 반응을 경험할 수 있음 (특히 깊은 타임라인에서)

### 3. 캐시 유효 시간 (100ms)의 적절성 재검토

Deep timeline에서 scope 변경이 자주 일어나면 캐시 효과 미미

---

## ✅ 개선 솔루션 제안

### 솔루션 1: 타이밍 최적화 (debounce ↔️ window coordination)

**목표**: 350ms 윈도우와 300ms 디바운스를 명확하게 조정

**구현 아이디어**:

```typescript
// Phase 426: Align timing between debounce and recovery window
const ROUTE_CHANGE_DEBOUNCE_MS = 350; // ← 수정: 300ms → 350ms (window과 동일)

function notifyRouteChange(oldUrl, newUrl) {
  if (state.debounceTimerId !== null) {
    globalTimerManager.clearTimeout(state.debounceTimerId);
  }

  state.debounceTimerId = globalTimerManager.setTimeout(() => {
    // 콜백 실행 시점 = window 폐쇄 시점
    // → 타이밍 충돌 제거
    state.callbacks.forEach(callback => {
      callback(oldUrl, newUrl);
    });
  }, ROUTE_CHANGE_DEBOUNCE_MS); // 이제 350ms
}
```

**장점**:

- ✅ 타이밍 명확화
- ✅ 범위 갱신 연기 불필요 (콜백 자체가 window 폐쇄 후 실행)
- ✅ 코드 간결화

**단점**:

- ⚠️ 콜백 실행이 50ms 더 지연 (300ms → 350ms)
- ⚠️ 사용자 경험 약간 저하 (하지만 인지 불가)

### 솔루션 2: 캐시 유효 시간 증가

**구현**:

```typescript
// Phase 426: Increase cache validity from 100ms to 500ms
// Rationale: Scope rarely changes during a session
// Even on deep timelines, scrolling doesn't change the scroll container
const SCOPE_CACHE_VALIDITY_MS = 500; // ← 100ms → 500ms

// 또는: 캐시 수동 무효화 전까지 지속 (권장)
const SCOPE_CACHE_VALIDITY_MS = Infinity; // 수동 무효화만 사용
```

**실행 방법**:

- scope 변경을 감지하는 MutationObserver 추가
- 또는 명시적으로 캐시 무효화 함수 호출

### 솔루션 3: Focus Trap 재시도 횟수 제한

**문제**: Focus trap이 무한정 재시도할 수 있음

**개선**:

```typescript
// Phase 426: Limit focus trap retry attempts
let focusTrapRetryCount = 0;
const MAX_FOCUS_TRAP_RETRIES = 3;

function activate(): void {
  const scrollRecoveryWindow = window.__XEG_SCROLL_RECOVERY_ACTIVE__;

  if (scrollRecoveryWindow === true) {
    if (focusTrapRetryCount < MAX_FOCUS_TRAP_RETRIES) {
      focusTrapRetryCount++;
      globalThis.setTimeout(() => {
        activate();
      }, 350);
      return;
    } else {
      // 최대 재시도 횟수 초과: 로그하고 계속
      logger.warn('[FocusTrap] Max retries reached, forcing activation');
    }
  }

  focusTrapRetryCount = 0; // 성공 시 리셋
  focusFirstElement();
}
```

### 솔루션 4: Deep Timeline 감지 및 타이밍 동적 조정

**아이디어**: DOM 크기를 측정해서 복잡도에 따라 window 크기 조정

```typescript
// Phase 426: Dynamic scroll recovery window based on DOM complexity
function getDynamicScrollRecoveryWindow(): number {
  const domNodeCount = document.querySelectorAll('*').length;

  if (domNodeCount < 2000) {
    return 200; // 정상 타임라인
  } else if (domNodeCount < 5000) {
    return 300; // 중간 복잡도
  } else {
    return 400; // Deep 타임라인
  }
}
```

**장점**: 적응형 대응 **단점**: 매번 DOM 쿼리 필요 (성능 영향)

---

## 📊 추천 우선순위

| 솔루션            | 영향도 | 복잡도 | 리스크 | 우선순위 |
| ----------------- | ------ | ------ | ------ | -------- |
| 솔루션 1 (타이밍) | 중     | 낮     | 낮     | ⭐ 1순위 |
| 솔루션 2 (캐시)   | 중     | 낮     | 낮     | ⭐ 1순위 |
| 솔루션 3 (Retry)  | 낮     | 낮     | 낮     | 2순위    |
| 솔루션 4 (동적)   | 높     | 중     | 중     | 3순위    |

---

## 🔧 다음 단계

1. ✅ 이 분석 문서 작성 (완료)
2. ⏳ 솔루션 1-2 구현 (타이밍 정렬 + 캐시 최적화)
3. ⏳ npm run build 검증
4. ⏳ E2E 테스트 실행

---

## 📚 관련 문서

- PHASE_412_SPA_SCROLL_RECOVERY_ANALYSIS.md
- PHASE_422_SCROLL_RECOVERY_TIMING_ROOT_CAUSE.md
- PHASE_425_SCROLL_RECOVERY_ENHANCEMENT.md
- ARCHITECTURE.md#Phase_309_Service_Layer
