# Phase 153: Gallery Hook 상태 정규화 계획

**상태**: 🚀 시작 예정 | **기간**: 2025-10-23  
**목표**: Hook 상태 변수 정규화로 복잡도 감소

---

## 📊 분석 결과

### 1. useGalleryScroll (243줄)

**현재 상태 변수**:

```typescript
const [lastScrollTime, setLastScrollTime] = createSignal<number>(0);
const [isScrolling, setIsScrolling] = createSignal<boolean>(false);
const [scrollDirection, setScrollDirection] =
  createSignal<ScrollDirection>('idle');

// 내부 변수 (정규화 후보)
let lastDelta: number = 0;
let scrollTimeout: number | null = null;
let directionChangeTimeout: number | null = null;
```

**정규화 기회**:

- 3개 Signal을 1개 통합 Signal `ScrollState`로 통합
- 타이머 3개를 `FocusTimerManager` 패턴으로 중앙화
- 예상 효과: 상태 변수 40% 감소

**구현 계획**:

```typescript
// 통합 State 인터페이스
interface ScrollState {
  lastScrollTime: number;
  isScrolling: boolean;
  direction: ScrollDirection;
  lastDelta: number;
}

// useGalleryScroll 수정
const [scrollState, setScrollState] =
  createSignal<ScrollState>(INITIAL_SCROLL_STATE);
```

---

### 2. useProgressiveImage (300줄)

**현재 상태 변수**:

```typescript
const [state, setState] = createSignal<ProgressiveImageState>({
  isLoading: false,
  isLoaded: false,
  hasError: false,
  loadedSrc: null | string,
  progress: number,
  retryCount: number,
});

// 내부 변수
let timeoutId: number | null = null;
let retryTimeoutId: number | null = null;
```

**정규화 기회**:

- 이미 통합 `ProgressiveImageState`로 잘 구조화됨 ✅
- 타이머 2개를 `FocusTimerManager` 패턴으로 중앙화
- 예상 효과: 타이머 관리 일관성 증대

**구현 계획**:

```typescript
// 기존 State는 유지, 타이머만 중앙화
const timerManager = createFocusTimerManager();

// 기존
// let timeoutId: number | null = null;

// 변경 후
timerManager.setTimer('progressive-image-timeout', () => {...}, timeout);
```

---

### 3. useGalleryKeyboard (40줄)

**현재 상태 변수**:

```typescript
// 매우 간단한 구조, 정규화 불필요
// 입력 구독 기반으로 이미 최적화됨 ✅
```

**평가**: 이미 최적화됨, 변경 불필요 ✅

---

### 4. useGalleryCleanup (174줄)

**현재 상태 변수**:

```typescript
let isCleanedUp = false; // 클로저 변수
let hideTimeoutRef: { current: number | null }; // Ref 패턴
```

**정규화 기회**:

- `hideTimeoutRef` Ref 패턴을 Signal로 전환
- 정리 상태 Signal 도입
- 예상 효과: 상태 일관성 증대

**구현 계획**:

```typescript
// 상태 Signal 도입
const [cleanupState, setCleanupState] = createSignal<CleanupState>({
  isCleanedUp: false,
  hideTimeoutId: null,
});
```

---

## 🎯 구현 계획 (7 단계)

### Step 1: 통합 State 인터페이스 생성 (30분)

**파일**: `src/shared/state/hooks/`

```typescript
// scroll-state.ts
export interface ScrollState {
  lastScrollTime: number;
  isScrolling: boolean;
  direction: ScrollDirection;
  lastDelta: number;
}

// cleanup-state.ts
export interface CleanupState {
  isCleanedUp: boolean;
  hideTimeoutId: number | null;
}
```

### Step 2: useGalleryScroll 리팩토링 (1시간)

**변경 사항**:

- 3개 Signal → 1개 통합 Signal
- 타이머 중앙화
- 테스트 수정

### Step 3: useProgressiveImage 최적화 (30분)

**변경 사항**:

- 타이머 중앙화만 진행
- State 유지 (이미 최적)

### Step 4: useGalleryCleanup 정규화 (45분)

**변경 사항**:

- Ref 패턴 → Signal
- 상태 일관성 개선

### Step 5: 테스트 작성/수정 (1시간)

**대상**:

- useGalleryScroll 테스트 추가/수정
- useProgressiveImage 테스트 수정
- useGalleryCleanup 테스트 추가

### Step 6: 통합 테스트 (30분)

**검증 항목**:

- 기존 기능 호환성 유지
- 타이머 관리 일관성
- 상태 동기화

### Step 7: 문서화 및 정리 (30분)

**작업**:

- TDD_REFACTORING_PLAN_COMPLETED.md 업데이트
- 변경 로그 작성
- 최종 커밋

---

## ✅ 성공 기준

- ✅ 모든 기존 테스트 PASS
- ✅ 신규 테스트 10+ 추가
- ✅ 상태 변수 15~20개 감소
- ✅ 번들 크기 유지 (335.93 KB)
- ✅ 타이머 중앙화 완료

---

## 📊 예상 효과

| 항목             | 변경 전   | 변경 후   | 효과         |
| ---------------- | --------- | --------- | ------------ |
| 상태 변수        | 분산      | 통합      | 복잡도 ↓     |
| 타이머 관리      | 분산      | 중앙화    | 신뢰도 ↑     |
| 테스트 작성 난도 | 높음      | 낮음      | 유지보수성 ↑ |
| 번들 크기        | 335.93 KB | 335.93 KB | 유지         |

---

## 🚀 시작 준비

```powershell
# 1. 작업 브랜치 생성 (이미 생성됨)
git checkout feat/phase-153-hook-state-normalization

# 2. 구현 진행
# Step 1-7 순차 진행

# 3. 테스트 검증
npm run test:unit
npm run test:smoke

# 4. 빌드 검증
npm run build

# 5. 커밋
git commit -m "feat(phase-153): Gallery hook state normalization"
```

---

**다음 단계**: Step 1 (통합 State 인터페이스 생성) 시작
