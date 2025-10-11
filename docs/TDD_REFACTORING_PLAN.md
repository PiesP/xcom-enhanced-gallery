# TDD 리팩토링 활성 계획

현재 상태: Phase 18 진행 중 최종 업데이트: 2025-01-11

---

## 📋 Phase 18: 수동 스크롤 방해 제거

**목표**: 유저가 수동으로 스크롤하는 중이나 직후에 이미지 위치를 조정하는 로직
제거

**배경**:

- 현재 `handleMediaLoad` 함수가 미디어 로드 완료 시 자동으로 `scrollIntoView`
  실행
- 이로 인해 사용자가 수동 스크롤 중이거나 직후에도 이미지 위치가 강제로 조정됨
- 자동 스크롤은 prev/next 버튼 네비게이션에만 필요

**문제 코드 위치**:

- `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`
  - `handleMediaLoad` 함수 (line 376-413)
  - `lastAutoScrolledIndex` 상태 (사용처 정리 필요)

**분석 결과**:

1. **제거 대상**: `handleMediaLoad`의 자동 스크롤 로직
   - 미디어 로드 시점에 자동 스크롤하는 것은 수동 스크롤을 방해
   - `scrollIntoView` 호출 제거
2. **유지 대상**: `useGalleryItemScroll` 훅
   - prev/next 버튼으로 `currentIndex` 변경 시에만 작동
   - 이것은 의도된 자동 스크롤이므로 유지

**작업 계획**:

### 18.1: handleMediaLoad 자동 스크롤 제거 ⏳

**목표**: 미디어 로드 시 자동 스크롤 로직 제거

**작업**:

1. `handleMediaLoad` 함수 단순화
   - `scrollIntoView` 호출 제거
   - 미디어 로드 이벤트 리스너 제거
   - 로그만 남기고 스크롤 로직 전체 제거
2. `lastAutoScrolledIndex` 상태 제거
   - 선언부 제거
   - `setLastAutoScrolledIndex` 호출 제거

**예상 변경**:

```typescript
// Before (제거 대상)
const handleMediaLoad = (mediaId: string, index: number) => {
  // ... 복잡한 자동 스크롤 로직
  targetElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
  setLastAutoScrolledIndex(index);
};

// After (단순화)
const handleMediaLoad = (mediaId: string, index: number) => {
  logger.debug('VerticalGalleryView: 미디어 로드 완료', { mediaId, index });
  // 자동 스크롤 제거 - prev/next 버튼 네비게이션은 useGalleryItemScroll이 처리
};
```

**테스트 계획**:

- 미디어 로드 시 스크롤 위치가 변경되지 않음 확인
- prev/next 버튼으로 네비게이션 시 자동 스크롤 작동 확인

### 18.2: 관련 상태 정리 ⏳

**목표**: 더 이상 사용되지 않는 상태 제거

**작업**:

1. `lastAutoScrolledIndex` 상태 선언 제거
2. `setLastAutoScrolledIndex` 호출 제거
3. `handleMediaItemClick`에서 `setLastAutoScrolledIndex(-1)` 제거
4. `createEffect(on(currentIndex, ...))` 내 `setLastAutoScrolledIndex(-1)` 제거

**예상 변경**:

```typescript
// Before (제거 대상)
const [lastAutoScrolledIndex, setLastAutoScrolledIndex] = createSignal(-1);

createEffect(
  on(currentIndex, () => {
    setLastAutoScrolledIndex(-1);
    forceFocusSync();
  })
);

// After (제거)
createEffect(
  on(currentIndex, () => {
    forceFocusSync();
  })
);
```

### 18.3: 테스트 추가 ⏳

**목표**: 수동 스크롤 방해 제거 확인

**테스트 파일**:
`test/unit/features/gallery/vertical-gallery-no-auto-scroll.test.tsx`

**테스트 케이스**:

1. 미디어 로드 시 스크롤 위치 유지
2. 수동 스크롤 중 위치 조정 없음
3. prev/next 네비게이션 시에만 자동 스크롤 발생

### 18.4: 빌드 검증 ⏳

**목표**: 변경 사항 검증

**작업**:

1. `npm run typecheck` - 타입 체크
2. `npm run lint:fix` - 린트 검사
3. `npm test` - 전체 테스트
4. `Clear-Host && npm run build` - 빌드 검증

**예상 결과**:

- 번들 크기 감소 (자동 스크롤 로직 제거로 인한)
- 모든 테스트 통과

---

## 현재 상태

Phase 18 진행 중 → 18.1부터 순차 진행

---

## 참고 문서

- AGENTS.md: 개발 환경 및 워크플로
- TDD_REFACTORING_PLAN_COMPLETED.md: Phase 1-17 완료 내역
