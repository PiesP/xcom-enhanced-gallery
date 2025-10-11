# TDD 리팩토링 활성 계획

현재 상태: Phase 21.1 완료, Phase 21.2 진행 준비  
최종 업데이트: 2025-10-12

---

## 📊 현재 상태

Phase 21.1 완료, Phase 21.2 작업 준비 완료

프로젝트 상태:

- ✅ 빌드: 성공 (dev: 728.31 KB, prod: 329.68 KB, gzip: 89.69 KB)
- ✅ 테스트: 602/602 passing (24 skipped, 1 todo)
- ✅ 의존성: 0 violations (265 modules, 728 dependencies)
- ✅ 브랜치: feature/solidjs-optimization-phase21 (master에서 분기)

---

## 📚 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-21.1 완료 내역
- `docs/ARCHITECTURE.md`: 프로젝트 아키텍처
- `docs/CODING_GUIDELINES.md`: 코딩 규칙 및 품질 기준
- `docs/SOLIDJS_OPTIMIZATION_GUIDE.md`: SolidJS 최적화 가이드 (Phase 21 기반)

---

## 🎯 Phase 21: SolidJS 핵심 최적화

### 목표

IntersectionObserver 안정화 및 Signal 구조 개선으로 런타임 안정성과 성능 향상

### 우선순위

CRITICAL → HIGH → MEDIUM 순으로 진행

---

## Phase 21.2: galleryState Fine-grained Signals 분리 ⏳

**우선순위**: HIGH **대상 파일**: `src/shared/state/signals/gallery.signals.ts`
**예상 효과**: 불필요한 재렌더링 60% 감소, 메모리 사용량 15-20% 감소

### 문제 분석

현재 구조 (lines 24-31):

```typescript
// ❌ 거대 상태 객체
export interface GalleryState {
  readonly isOpen: boolean;
  readonly mediaItems: readonly MediaInfo[];
  readonly currentIndex: number;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly viewMode: 'horizontal' | 'vertical';
}

// ❌ currentIndex 변경 → 전체 GalleryState 객체 교체
galleryState.value = { ...galleryState.value, currentIndex: newIndex };
```

문제점:

- `currentIndex` 변경 → 전체 객체 재생성
- `useSelector` 사용하지 않는 컴포넌트는 불필요한 업데이트
- 메모리 GC 부담 증가

### 솔루션 전략

#### A. Fine-grained Signals로 분리

```typescript
// ✅ 개별 Signal로 분리
export const gallerySignals = {
  isOpen: createSignalSafe(false),
  mediaItems: createSignalSafe<readonly MediaInfo[]>([]),
  currentIndex: createSignalSafe(0),
  isLoading: createSignalSafe(false),
  error: createSignalSafe<string | null>(null),
  viewMode: createSignalSafe<'horizontal' | 'vertical'>('vertical'),
};

// 사용
const currentIndex = () => gallerySignals.currentIndex.value;
gallerySignals.currentIndex.value = 5; // 오직 currentIndex만 업데이트
```

#### B. 호환 레이어 제공

```typescript
// ✅ 기존 API 호환성 유지 (점진적 마이그레이션)
export const galleryState = {
  get value(): GalleryState {
    return {
      isOpen: gallerySignals.isOpen.value,
      mediaItems: gallerySignals.mediaItems.value,
      currentIndex: gallerySignals.currentIndex.value,
      isLoading: gallerySignals.isLoading.value,
      error: gallerySignals.error.value,
      viewMode: gallerySignals.viewMode.value,
    };
  },
  set value(state: GalleryState) {
    batch(() => {
      gallerySignals.isOpen.value = state.isOpen;
      gallerySignals.mediaItems.value = state.mediaItems;
      gallerySignals.currentIndex.value = state.currentIndex;
      gallerySignals.isLoading.value = state.isLoading;
      gallerySignals.error.value = state.error;
      gallerySignals.viewMode.value = state.viewMode;
    });
  },
};
```

### 마이그레이션 단계

1. Phase 21.2.1: 새 API 추가 (`gallerySignals.*`)
2. Phase 21.2.2: 호환 레이어 구현 (기존 API 유지)
3. Phase 21.2.3: VerticalGalleryView 전환 (useSelector 제거)
4. Phase 21.2.4: 나머지 컴포넌트 점진적 전환
5. Phase 21.2.5: 호환 레이어 제거 (모든 전환 완료 후)

### TDD 단계

1. **RED**: Fine-grained signals 업데이트 시 불필요한 재렌더링 감지 테스트
   - `test/unit/state/gallery-signals-fine-grained.red.test.ts`
2. **GREEN**: `gallerySignals` 구현 및 호환 레이어 추가
3. **REFACTOR**: VerticalGalleryView부터 점진적 전환

### 검증 기준

- ✅ currentIndex 업데이트 시 mediaItems 구독 컴포넌트 재렌더링 안 됨
- ✅ 기존 테스트 모두 통과 (602/602)
- ✅ 메모리 사용량 15% 이상 감소 (프로파일링)

---

## Phase 21.3: useGalleryScroll Passive Listener 최적화 ⏳

**우선순위**: MEDIUM **대상 파일**:
`src/features/gallery/hooks/useGalleryScroll.ts` **예상 효과**: 스크롤 성능
30-40% 향상, 메인 스레드 블로킹 제거

### 문제 분석

현재 코드 (lines 150-180):

```typescript
// ❌ passive: false로 모든 wheel 이벤트 차단
const id = EventManager.getInstance().addListener(
  container,
  'wheel',
  handleWheel,
  { passive: false }
);
```

문제점:

- `passive: false` → 브라우저가 스크롤 최적화 불가
- 모든 wheel 이벤트에서 `preventDefault()` 가능성 대기
- 메인 스레드 블로킹 → 스크롤 버벅임

### 솔루션 전략

#### A. Passive Listener + 조건부 preventDefault

```typescript
// ✅ 기본은 passive: true
const handleWheel = (event: WheelEvent) => {
  const shouldPreventDefault = calculateShouldPrevent(event);

  // passive: true이므로 preventDefault 불가
  // 대신 트위터 스크롤 별도 차단
  if (shouldPreventDefault && blockTwitterScrollAccessor()) {
    preventTwitterScrollSeparately();
  }

  onScroll?.(event.deltaY, scrollTargetAccessor());
};

const id = EventManager.getInstance().addListener(
  container,
  'wheel',
  handleWheel,
  { passive: true } // ✅ 브라우저 최적화 활성화
);
```

#### B. requestAnimationFrame으로 스크롤 처리

```typescript
import { throttleScroll } from '@shared/utils/performance/performance-utils';

let rafId: number | null = null;

const handleWheel = (event: WheelEvent) => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }

  rafId = requestAnimationFrame(() => {
    updateScrollState(true);
    onScroll?.(event.deltaY, scrollTargetAccessor());
    handleScrollEnd();
    rafId = null;
  });
};

onCleanup(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
});
```

#### C. Throttle 최적화

```typescript
// ✅ 이미 구현된 throttleScroll 사용
const throttledUpdate = throttleScroll((delta: number) => {
  requestAnimationFrame(() => {
    batch(() => {
      setIsScrolling(true);
      setLastScrollTime(Date.now());
    });
    onScroll?.(delta, scrollTargetAccessor());
  });
}, 16); // 60fps
```

### TDD 단계

1. **RED**: Passive listener 성능 측정 테스트
   - `test/unit/features/gallery/scroll-passive-performance.red.test.ts`
2. **GREEN**: passive: true + RAF 구현
3. **REFACTOR**: 트위터 스크롤 차단 로직 분리

### 검증 기준

- ✅ wheel 이벤트 핸들러 실행 시간 < 5ms (passive: true 효과)
- ✅ 스크롤 중 메인 스레드 블로킹 < 10ms
- ✅ 기존 테스트 모두 통과 (602/602)

---

## Phase 21.4: 불필요한 Memo 제거 ⏳

**우선순위**: MEDIUM **대상 파일**:

- `src/shared/components/ui/Toolbar/Toolbar.tsx`
- `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`

**예상 효과**: 메모리 사용량 5-10% 감소, 코드 간결성 향상

### 문제 분석

과도한 createMemo 사용 사례:

```typescript
// ❌ 단순 문자열 연결에 Memo 사용
const toolbarClass = createMemo(
  () => `${styles.toolbar} ${styles.galleryToolbar} ${props.className}`
);

// ❌ 단순 조건문에 Memo 사용
const displayedIndex = createMemo(() => {
  const focus = props.focusedIndex;
  const current = props.currentIndex;
  return focus >= 0 && focus < props.totalCount ? focus : current;
});
```

### 솔루션 전략

#### Memo 사용 가이드라인

**Memo 필요**:

- 배열 순회 (`map`, `filter`, `reduce`)
- 객체 생성 (`{ ...obj }`, `Object.keys()`)
- 외부 함수 호출 (비용 높은 계산)

**Memo 불필요**:

- 문자열 연결 (`+`, 템플릿 리터럴)
- 단순 비교 (`===`, `>`, `<`)
- 산술 연산 (`+`, `-`, `*`, `/`)

#### 리팩토링 예시

```typescript
// ❌ 불필요한 Memo
const toolbarClass = createMemo(() =>
  `${styles.toolbar} ${styles.galleryToolbar} ${props.className}`
);

// ✅ JSX 내부에서 직접 계산
<div class={`${styles.toolbar} ${styles.galleryToolbar} ${props.className ?? ''}`}>

// ✅ 복잡한 계산만 Memo 유지
const preloadIndices = createMemo(() => {
  const count = getSetting<number>('gallery.preloadCount', 0);
  return computePreloadIndices(currentIndex(), mediaItems().length, count);
});
```

### TDD 단계

1. **RED**: Memo 제거 후 성능 유지 테스트
   - `test/unit/optimization/unnecessary-memo-removal.red.test.ts`
2. **GREEN**: 단순 계산의 Memo 제거
3. **REFACTOR**: 벤치마크로 성능 검증

### 검증 기준

- ✅ Memo 개수 20% 감소
- ✅ 렌더링 성능 유지 (벤치마크 ±5% 이내)
- ✅ 기존 테스트 모두 통과 (602/602)

---

## Phase 21.5: KeyboardNavigator Map 기반 최적화 ⏳

**우선순위**: LOW **대상 파일**:
`src/shared/services/input/KeyboardNavigator.ts` **예상 효과**: 키 이벤트 처리
10-15% 빠름, 코드 간결성 향상

### 문제 분석

현재 코드 (lines 50-140):

```typescript
// ❌ 긴 switch 문 (O(n) 비교)
switch (event.key) {
  case 'Escape':
    handlers.onEscape?.();
    handled = !!handlers.onEscape;
    break;
  case 'ArrowLeft':
    handlers.onLeft?.();
    handled = !!handlers.onLeft;
    break;
  // ... 많은 케이스
}
```

### 솔루션 전략

#### Map 기반 핸들러

```typescript
// ✅ Map으로 O(1) 룩업
class KeyboardNavigator {
  private keyHandlerMap: Map<string, () => void>;

  constructor(handlers: KeyHandlers) {
    this.keyHandlerMap = new Map(
      [
        ['Escape', handlers.onEscape],
        ['ArrowLeft', handlers.onLeft],
        ['ArrowRight', handlers.onRight],
        ['Home', handlers.onHome],
        ['End', handlers.onEnd],
        ['Enter', handlers.onEnter],
        [' ', handlers.onSpace],
        ['Space', handlers.onSpace],
      ].filter(([_, handler]) => handler !== undefined) as [
        string,
        () => void,
      ][]
    );
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    const handler = this.keyHandlerMap.get(event.key);

    if (handler) {
      handler();
      return true;
    }

    return false;
  }
}
```

### TDD 단계

1. **RED**: Map 기반 핸들러 성능 벤치마크
   - `test/unit/services/keyboard-navigator-map.red.test.ts`
2. **GREEN**: Map 구현
3. **REFACTOR**: 가독성 개선

### 검증 기준

- ✅ 키 이벤트 처리 시간 10% 이상 단축 (벤치마크)
- ✅ 기존 테스트 모두 통과 (602/602)

---

## 📊 Phase 21 전체 예상 효과

### 성능 지표

- **Effect 실행 횟수**: 50-70% 감소 (Phase 21.1)
- **재렌더링**: 60% 감소 (Phase 21.2)
- **스크롤 성능**: 30-40% 향상 (Phase 21.3)
- **메모리 사용량**: 20-30% 감소 (Phase 21.2 + 21.4)
- **키 이벤트 처리**: 10-15% 향상 (Phase 21.5)

### 품질 지표

- ✅ 런타임 안정성 대폭 향상 (무한 루프 제거)
- ✅ 타입 안전성 유지
- ✅ 기존 테스트 모두 통과
- ✅ 코드 간결성 향상

---

## 📝 작업 히스토리

- Phase 1-20: COMPLETED.md 참조
- Phase 21.1: IntersectionObserver 무한 루프 방지 ⏳
- Phase 21.2: galleryState Fine-grained Signals 분리 ⏳
- Phase 21.3: useGalleryScroll Passive Listener 최적화 ⏳
- Phase 21.4: 불필요한 Memo 제거 ⏳
- Phase 21.5: KeyboardNavigator Map 기반 최적화 ⏳
