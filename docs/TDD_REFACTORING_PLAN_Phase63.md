# Phase 63: 갤러리 인덱스 관리 통합 및 동기화 강화

> **작성일**: 2025-10-14  
> **목표**: currentIndex와 focusedIndex 간 동기화를 강화하여 네비게이션 시
> 일관성 보장

## 현황 분석

### 현재 인덱스 관리 구조

1. **gallerySignals.currentIndex** (중앙 상태)
   - 위치: `src/shared/state/signals/gallery.signals.ts`
   - 역할: 논리적 현재 위치 (네비게이션, 카운터)
   - 변경: `navigateToItem()`, `navigatePrevious()`, `navigateNext()`

2. **focusedIndex** (useGalleryFocusTracker)
   - 위치: `src/features/gallery/hooks/useGalleryFocusTracker.ts`
   - 역할: 시각적/물리적 포커스 (스크롤 위치, DOM focus)
   - 구성: `manualFocusIndex` (우선) → `autoFocusIndex` (fallback)

3. **동기화 메커니즘 (Phase 21.1 구현)**
   - autoFocusIndex와 currentIndex 차이가 1보다 클 때 동기화
   - 자연스러운 스크롤 중 불일치는 허용
   - VerticalGalleryView에서 `currentIndex` 변경 시 `forceFocusSync()` 호출

### 발견된 잠재적 문제

#### 1. 명시적 네비게이션(버튼 클릭) 시 동기화 누락 가능

**시나리오**:

```text
사용자가 스크롤하여 focusedIndex = 5
currentIndex = 3 (차이 2, 동기화 임계값 초과)
→ autoFocusIndex가 3으로 동기화됨

사용자가 "다음" 버튼 클릭
→ navigateNext() → currentIndex = 4
→ useGalleryItemScroll이 스크롤 수행 (smooth)
→ focusedIndex는 스크롤 완료 후에나 IntersectionObserver로 업데이트

문제: 스크롤 애니메이션 중 Toolbar의 focusedIndex 표시가 즉시 반영되지 않음
```

#### 2. useGalleryItemScroll과 navigateToItem 간 결합도 부족

- `navigateToItem()`: currentIndex만 변경
- `useGalleryItemScroll`: currentIndex 변경 감지 → 스크롤 수행
- 두 작업이 분리되어 있어 중간 상태 발생 가능

#### 3. 아이템 클릭 시 focusedIndex 즉시 반영 누락

```tsx
// VerticalGalleryView.tsx:351
const handleMediaItemClick = (index: number) => {
  if (index >= 0 && index < items.length && index !== current) {
    navigateToItem(index); // currentIndex만 변경
    // focusedIndex 즉시 업데이트 없음
  }
};
```

## 개선 방안 (3가지 옵션)

### Option A: 이벤트 시스템 추가 (권장)

**장점**:

- 느슨한 결합 유지
- 확장성 높음
- 기존 코드 최소 변경

**단점**:

- 새로운 추상화 추가
- 이벤트 전파 복잡도 증가

**구현**:

```typescript
// gallery.signals.ts
export const galleryEvents = createEventEmitter<{
  'index:changed': { index: number; source: 'navigation' | 'scroll' | 'click' };
  'index:willChange': { from: number; to: number };
}>();

export function navigateToItem(index: number): void {
  const prev = galleryState.value.currentIndex;
  galleryEvents.emit('index:willChange', { from: prev, to: index });

  // ... 기존 로직

  galleryEvents.emit('index:changed', { index, source: 'navigation' });
}

// useGalleryFocusTracker.ts
createEffect(() => {
  const unsubscribe = galleryEvents.on('index:changed', ({ index, source }) => {
    if (source === 'navigation' || source === 'click') {
      setAutoFocusIndex(index); // 즉시 동기화
      applyAutoFocus(index, `sync:${source}`);
    }
  });

  onCleanup(unsubscribe);
});
```

### Option B: 명시적 동기화 함수 노출

**장점**:

- 단순하고 직관적
- 호출 흐름 명확

**단점**:

- 결합도 증가
- 호출자가 동기화 책임 가짐

**구현**:

```typescript
// useGalleryFocusTracker.ts
export interface UseGalleryFocusTrackerReturn {
  // ... 기존
  syncWithCurrentIndex: (index: number) => void; // 신규
}

// VerticalGalleryView.tsx
const { syncWithCurrentIndex } = useGalleryFocusTracker(...);

const handleMediaItemClick = (index: number) => {
  if (index >= 0 && index < items.length && index !== current) {
    navigateToItem(index);
    syncWithCurrentIndex(index); // 명시적 동기화
  }
};
```

### Option C: 통합 네비게이션 액션

**장점**:

- 단일 진입점
- 원자적 작업 보장

**단점**:

- 기존 구조 대폭 변경
- 확장성 제한

**구현**:

```typescript
// gallery.signals.ts
export function navigateToItemWithSync(
  index: number,
  options: { scroll?: boolean; focus?: boolean } = { scroll: true, focus: true }
): void {
  const prev = galleryState.value.currentIndex;

  batch(() => {
    navigateToItem(index);

    if (options.focus) {
      // 포커스 트래커에 직접 알림 (의존성 주입 필요)
      globalFocusTrackerInstance?.syncWithCurrentIndex(index);
    }
  });
}
```

## 권장 솔루션: Option A (이벤트 시스템)

### 구현 단계

#### Step 1: 경량 이벤트 시스템 추가

```typescript
// src/shared/utils/event-emitter.ts
export function createEventEmitter<T extends Record<string, unknown>>() {
  const listeners = new Map<keyof T, Set<(data: unknown) => void>>();

  return {
    on<K extends keyof T>(
      event: K,
      callback: (data: T[K]) => void
    ): () => void {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(callback as (data: unknown) => void);

      return () =>
        listeners.get(event)?.delete(callback as (data: unknown) => void);
    },

    emit<K extends keyof T>(event: K, data: T[K]): void {
      listeners.get(event)?.forEach(callback => callback(data));
    },
  };
}
```

#### Step 2: gallery.signals에 이벤트 통합

```typescript
// gallery.signals.ts
export const galleryIndexEvents = createEventEmitter<{
  'navigate:start': {
    from: number;
    to: number;
    trigger: 'button' | 'click' | 'keyboard';
  };
  'navigate:complete': {
    index: number;
    trigger: 'button' | 'click' | 'keyboard';
  };
}>();

export function navigateToItem(
  index: number,
  trigger: 'button' | 'click' | 'keyboard' = 'button'
): void {
  const state = galleryState.value;
  const validIndex = Math.max(0, Math.min(index, state.mediaItems.length - 1));

  if (validIndex === state.currentIndex) {
    logger.warn(`[Gallery] Already at index ${index}`);
    return;
  }

  galleryIndexEvents.emit('navigate:start', {
    from: state.currentIndex,
    to: validIndex,
    trigger,
  });

  galleryState.value = {
    ...state,
    currentIndex: validIndex,
  };

  galleryIndexEvents.emit('navigate:complete', { index: validIndex, trigger });
  logger.debug(`[Gallery] Navigated to item: ${index} (trigger: ${trigger})`);
}
```

#### Step 3: useGalleryFocusTracker에서 이벤트 구독

```typescript
// useGalleryFocusTracker.ts
createEffect(() => {
  // 명시적 네비게이션 이벤트 구독
  const unsubNavigate = galleryIndexEvents.on(
    'navigate:complete',
    ({ index, trigger }) => {
      // 버튼/클릭/키보드 네비게이션은 즉시 동기화
      if (
        trigger !== 'button' &&
        trigger !== 'click' &&
        trigger !== 'keyboard'
      ) {
        return;
      }

      logger.debug('useGalleryFocusTracker: navigation event received', {
        index,
        trigger,
      });

      // manualFocusIndex를 우회하고 autoFocusIndex를 즉시 업데이트
      batch(() => {
        setAutoFocusIndex(index);
        updateContainerFocusAttribute(index);
      });

      // 포커스 적용 (스크롤 완료 후)
      const delay = autoFocusDelayAccessor();
      globalTimerManager.setTimeout(() => {
        applyAutoFocus(index, `navigation:${trigger}`);
      }, delay + 100); // 스크롤 완료 대기
    }
  );

  onCleanup(() => {
    unsubNavigate();
  });
});
```

#### Step 4: 호출 지점 업데이트

```typescript
// VerticalGalleryView.tsx
const handleMediaItemClick = (index: number) => {
  const items = mediaItems();
  const current = currentIndex();

  if (index >= 0 && index < items.length && index !== current) {
    navigateToItem(index, 'click'); // trigger 명시
    logger.debug('VerticalGalleryView: 미디어 아이템 클릭으로 네비게이션', {
      index,
    });
  }
};

// GalleryRenderer.ts (키보드 핸들러도 업데이트)
// keyboard handler에서 trigger: 'keyboard' 전달
```

## TDD 테스트 계획

### 1. 이벤트 시스템 테스트 (10개)

```typescript
// test/unit/utils/event-emitter.test.ts
describe('createEventEmitter', () => {
  it('should emit events to all listeners');
  it('should support multiple event types');
  it('should remove listener on unsubscribe');
  it('should not fail if no listeners registered');
  it('should handle synchronous emissions');
  it('should support generic type safety');
  it('should allow multiple subscriptions to same event');
  it('should execute listeners in registration order');
  it('should handle errors in listeners gracefully');
  it('should cleanup all listeners on dispose');
});
```

### 2. gallery.signals 이벤트 통합 테스트 (12개)

```typescript
// test/unit/state/gallery-index-events.test.ts
describe('Gallery Index Events', () => {
  describe('navigateToItem with trigger', () => {
    it('should emit navigate:start before index change');
    it('should emit navigate:complete after index change');
    it('should include trigger type in events');
    it('should handle button trigger');
    it('should handle click trigger');
    it('should handle keyboard trigger');
    it('should not emit events if already at target index');
  });

  describe('navigatePrevious/navigateNext', () => {
    it('should emit events with button trigger by default');
    it('should support custom trigger parameter');
  });

  describe('event data validation', () => {
    it('should provide from/to indices in navigate:start');
    it('should provide final index in navigate:complete');
    it('should maintain type safety for event data');
  });
});
```

### 3. useGalleryFocusTracker 동기화 테스트 (15개)

```typescript
// test/unit/hooks/use-gallery-focus-tracker-sync.test.ts
describe('useGalleryFocusTracker - Index Synchronization', () => {
  describe('navigation event handling', () => {
    it('should sync autoFocusIndex on button navigation');
    it('should sync autoFocusIndex on click navigation');
    it('should sync autoFocusIndex on keyboard navigation');
    it('should not sync on scroll-triggered navigation');
    it('should apply auto focus after scroll completes');
    it('should update container attribute immediately');
  });

  describe('manual focus precedence', () => {
    it('should not override manualFocusIndex during navigation');
    it('should resume auto sync after manual blur');
  });

  describe('timing and debouncing', () => {
    it('should respect autoFocusDebounce setting');
    it('should add scroll completion delay to navigation focus');
    it('should batch autoFocusIndex and attribute updates');
  });

  describe('edge cases', () => {
    it('should handle rapid navigation events');
    it('should handle navigation while scrolling');
    it('should handle navigation to same index');
    it('should cleanup event subscriptions on unmount');
  });
});
```

### 4. 통합 테스트 (8개)

```typescript
// test/integration/gallery-navigation-sync.test.ts
describe('Gallery Navigation Synchronization (Integration)', () => {
  it('should sync currentIndex and focusedIndex on toolbar button click');
  it('should sync on media item click');
  it('should sync on keyboard navigation');
  it('should allow natural drift during scroll');
  it('should re-sync after large scroll jump');
  it('should maintain sync during rapid button clicks');
  it('should handle navigation during smooth scroll animation');
  it('should cleanup all event listeners on gallery close');
});
```

## 예상 효과

### 개선 효과

1. **일관성 보장**: 모든 네비게이션 시점에 focusedIndex 즉시 동기화
2. **UX 개선**: Toolbar 카운터와 실제 포커스 위치 불일치 해소
3. **확장성**: 이벤트 시스템으로 향후 다른 구독자 추가 용이
4. **유지보수**: 동기화 로직 중앙화로 버그 추적 간소화

### 성능 영향

- **이벤트 발행 오버헤드**: 무시할 수준 (<1ms)
- **추가 메모리**: Set 기반 리스너 맵 (100바이트 이내)
- **렌더링**: 기존 signal 업데이트와 동일 (변화 없음)

### 번들 크기 영향

- **event-emitter.ts**: ~200바이트 (minified)
- **galleryIndexEvents 통합**: ~150바이트
- **총 증가**: ~350바이트 (예산 내)

## 실행 순서

1. ✅ **분석 완료** (이 문서 작성)
2. ⏳ **Step 1**: event-emitter.ts 구현 + 테스트 (10개)
3. ⏳ **Step 2**: gallery.signals 이벤트 통합 + 테스트 (12개)
4. ⏳ **Step 3**: useGalleryFocusTracker 구독 추가 + 테스트 (15개)
5. ⏳ **Step 4**: 호출 지점 trigger 명시 + 통합 테스트 (8개)
6. ⏳ **검증**: `npm run build`, `npm test`, 수동 테스트
7. ⏳ **문서 업데이트**: ARCHITECTURE.md, 이 문서를 COMPLETED로 이관

## 대안 검토 이유

- **Option B**: 호출자 부담 증가, 누락 위험
- **Option C**: 과도한 결합, 테스트 어려움
- **현상 유지**: 버튼 클릭 시 UX 불일치 지속

**결론**: Option A가 아키텍처 원칙(느슨한 결합, 확장성)과 TDD 원칙(테스트
용이성)에 가장 부합

## 참고

- Phase 62: 툴바 순환 네비게이션 (완료)
- Phase 61: 스크롤 동작 정리 (완료)
- Phase 21.1: focusedIndex-currentIndex 동기화 초기 구현 (완료)
