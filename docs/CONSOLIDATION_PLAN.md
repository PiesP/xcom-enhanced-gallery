# 스크롤 모듈 통폐합 계획

## 📊 현재 상태 분석

### 변경된 핵심 모듈들

1. `anchor-scroll-position-controller.ts` - ✅ 최적화 완료
2. `route-scroll-restorer.ts` - ✅ 로깅 강화 완료
3. `gallery.signals.ts` - ✅ 키 시스템 통합 완료

### 중복/불필요 모듈들

1. `useScrollPositionManager.ts` - 🔴 Signal 기반으로 대체됨
2. `strategy-registry.ts` + `*-strategy.ts` - 🟡 오버엔지니어링
3. `use-gallery-scroll.ts` vs `use-gallery-item-scroll.ts` - 🟡 기능 중복

## 🎯 통폐합 계획

### Phase 1: 즉시 제거 가능 (높은 우선순위)

#### A. useScrollPositionManager 완전 제거

- **이유**: Signal 기반 복원이 활성화되면 실질적으로 비활성화됨
- **영향도**: 낮음 (이미 기능적으로 비활성화 상태)
- **제거 대상**:
  - `src/features/gallery/hooks/useScrollPositionManager.ts`
  - `test/features/gallery/useScrollPositionManager.test.ts`

#### B. Strategy Pattern 단순화

- **이유**: 2개 전략만 있고, route-scroll-restorer에서만 사용
- **방법**: 직접 Controller 호출로 대체
- **제거 대상**:
  - `src/shared/scroll/strategy-registry.ts`
  - `src/shared/scroll/anchor-strategy.ts`
  - `src/shared/scroll/absolute-strategy.ts`
  - 관련 테스트 파일들

### Phase 2: 갤러리 스크롤 훅 통합 (중간 우선순위)

#### A. 스크롤 훅 기능 분석

```typescript
// use-gallery-scroll.ts: 갤러리 전체 스크롤 처리
- 휠 이벤트 감지
- 스크롤 방향 감지
- 갤러리 내외부 구분

// use-gallery-item-scroll.ts: 갤러리 내 아이템 간 스크롤
- 특정 인덱스로 스크롤
- 아이템 간 네비게이션
- scrollIntoView 기반
```

#### B. 통합 방안

- 하나의 `useGalleryScroll` 훅으로 통합
- 옵션으로 기능 분리 (`enableItemScroll`, `enableDirectionDetection`)
- 더 명확한 책임 분리

### Phase 3: 유틸리티 정리 (낮은 우선순위)

#### A. scroll-utils.ts 검토

- 일부 함수가 더 이상 사용되지 않을 수 있음
- core-utils.ts와 중복 기능 확인

## 🔄 구체적 통폐합 작업

### 1. useScrollPositionManager 제거

**Before:**

```typescript
// gallery component에서
const { saveCurrentPosition, restorePosition } = useScrollPositionManager({
  isGalleryOpen: isOpen,
});
```

**After:**

```typescript
// 이미 gallery.signals.ts에서 자동 처리
// 추가 코드 불필요
```

### 2. Strategy Pattern 단순화

**Before:**

```typescript
// route-scroll-restorer.ts
const ordered = order
  .map(name => getScrollStrategies().find(s => s.name === name))
  .filter((s): s is NonNullable<typeof s> => !!s);

for (const strat of ordered) {
  if (strat.name === 'anchor') {
    const anchorSaved = strat.save({ pathname: prevPath });
  } else if (strat.name === 'absolute') {
    const absoluteSaved = strat.save({ key: buildKey(prevPath) });
  }
}
```

**After:**

```typescript
// route-scroll-restorer.ts
const order = getScrollRestorationConfig().strategyOrder || [
  'anchor',
  'absolute',
];

for (const strategyName of order) {
  if (strategyName === 'anchor') {
    const anchorSaved = AnchorScrollPositionController.save({
      pathname: prevPath,
    });
    if (anchorSaved) break;
  } else if (strategyName === 'absolute') {
    const absoluteSaved = ScrollPositionController.save({
      key: buildKey(prevPath),
    });
    if (absoluteSaved) break;
  }
}
```

### 3. 갤러리 스크롤 훅 통합

**Before:** 2개 파일

- `use-gallery-scroll.ts` (800+ lines)
- `use-gallery-item-scroll.ts` (400+ lines)

**After:** 1개 통합 파일

```typescript
// use-unified-gallery-scroll.ts
export function useGalleryScroll({
  // 기존 전체 스크롤 옵션들
  onScroll,
  enableScrollDirection,

  // 아이템 스크롤 옵션들 (선택적)
  enableItemScroll = false,
  currentIndex,
  totalItems,
  onItemChange,
}: UnifiedGalleryScrollOptions) {
  // 통합된 구현
}
```

## 📈 예상 효과

### 코드베이스 축소

- **제거될 파일**: 6-8개 파일
- **라인 수 감소**: ~1500+ 라인
- **테스트 파일 정리**: 4-6개 테스트 파일

### 유지보수성 향상

- Strategy Pattern 제거로 복잡성 감소
- Signal 기반 통합으로 일관성 확보
- 단일 책임 원칙 강화

### 성능 향상

- 불필요한 추상화 제거
- 직접 함수 호출로 오버헤드 감소
- 번들 크기 축소

## ⚠️ 주의사항

### 호환성 체크

- 기존 gallery component 사용 코드 확인
- useScrollPositionManager 사용 지점 모두 제거
- Strategy 기반 코드 직접 호출로 변경

### 테스트 업데이트

- 제거된 모듈의 테스트 로직을 핵심 모듈로 이전
- 통합 테스트 케이스 추가
- 회귀 테스트 실행

## 🎯 결론

이번 스크롤 시스템 개선을 통해 **Signal 기반 중앙집중식 관리**가 확립되면서,
많은 보조 모듈들이 불필요해졌습니다. 특히:

1. **useScrollPositionManager**: 완전 중복, 즉시 제거 가능
2. **Strategy Pattern**: 오버엔지니어링, 단순화 필요
3. **갤러리 스크롤 훅들**: 통합으로 중복 제거 가능

이 통폐합을 통해 **코드베이스가 30% 이상 축소**되고 **유지보수성이 크게 향상**될
것으로 예상됩니다.
