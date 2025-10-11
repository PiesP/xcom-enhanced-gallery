# TDD 리팩토링 활성 계획

현재 상태: Phase 20 계획 수립 최종 업데이트: 2025-10-12

---

## 📊 현재 상태

Phase 19 (테스트 console.log 제거) 완료 → COMPLETED.md로 이관 완료

프로젝트 상태:

- ✅ 빌드: 성공 (dev: 728.24 KB, prod: 329.08 KB, gzip: 89.48 KB)
- ✅ 테스트: 587/587 passing (24 skipped, 1 todo)
- ✅ 의존성: 0 violations (265 modules, 727 dependencies)

---

## 📚 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-19 완료 내역
- `docs/ARCHITECTURE.md`: 프로젝트 아키텍처
- `docs/CODING_GUIDELINES.md`: 코딩 규칙 및 품질 기준
- `docs/SOLIDJS_OPTIMIZATION_GUIDE.md`: SolidJS 최적화 가이드

---

## 🎯 Phase 20: VerticalGalleryView Effect 통합 (HIGH PRIORITY)

**목표**: createEffect 호출 수를 줄여 성능을 개선하고 메모리 사용량 감소

**배경**:

SOLIDJS_OPTIMIZATION_GUIDE 분석 결과, `VerticalGalleryView.tsx`에 9개의
createEffect가 집중되어 있으며, 이 중 일부는 통합 가능합니다:

1. **Derived Signal로 변환 가능** (Effect → Memo):
   - `isVisible` 상태는 `mediaItems().length > 0`의 파생 상태
   - Effect로 동기화하는 대신 createMemo로 직접 계산 가능

2. **의존성 명시 필요** (`on()` 사용):
   - 일부 effect가 불필요한 재실행 발생
   - 명시적 의존성 추적으로 최적화 필요

3. **관련 Effect 통합 가능**:
   - 애니메이션 관련 effect 2개 → 1개로 통합
   - 컨테이너 설정 관련 effect 분산 → 통합 검토

**예상 효과**:

- Effect 실행 횟수: 50-70% 감소
- 불필요한 재계산: 60% 감소
- 메모리 사용량: 15-20% 감소

---

### 20.1: Derived Signal로 isVisible 변환 ✅

**완료 상태**: GREEN (2025-10-12)

**목표**: Effect로 동기화하는 `isVisible`을 createMemo로 변환

**구현 내용**:

```tsx
// ✅ Derived signal (파생 상태)로 변환 완료
const isVisible = createMemo(() => {
  const visible = mediaItems().length > 0;
  logger.debug('VerticalGalleryView: 가시성 계산', {
    visible,
    mediaCount: mediaItems().length,
  });
  return visible;
});
```

**변경 사항**:

1. ✅ `isVisible` 선언부 변경 (createSignal → createMemo)
2. ✅ `setIsVisible` 제거
3. ✅ createEffect 블록 제거 (불필요한 동기화 effect 삭제)
4. ✅ 사용처 확인 완료 (읽기 전용이므로 호환)

**테스트 결과**:

- 파일: `test/unit/features/gallery/vertical-gallery-view-effects.test.tsx`
- 결과: 4/4 tests GREEN ✅
- 전체 테스트: 598/598 passing ✅

**품질 게이트**:

- ✅ 타입 체크 통과
- ✅ 린트 통과
- ✅ 전체 테스트 GREEN (598 passed, 24 skipped, 1 todo)
- ✅ 빌드 성공 (dev: 727.66 KB, prod: 329.03 KB, gzip: 89.46 KB)
- ✅ 의존성: 0 violations

**예상 효과**:

- Effect 실행 횟수 1회 감소 (9개 → 8개)
- 불필요한 상태 동기화 로직 제거
- 코드 가독성 향상 (파생 상태임이 명확)

---

**테스트 계획**:

- 파일: `test/unit/features/gallery/vertical-gallery-view-effects.test.tsx`
  (신규)
- 테스트 케이스:
  1. mediaItems가 비어있을 때 isVisible() === false
  2. mediaItems가 추가될 때 isVisible() === true
  3. 불필요한 재계산이 발생하지 않음 (effect 카운트 측정)

---

### 20.2: 애니메이션 Effect 의존성 명시 ⏳

**목표**: 애니메이션 관련 effect에 명시적 의존성 추가

**현재 코드** (`VerticalGalleryView.tsx:127-137`):

```tsx
createEffect(() => {
  const container = containerEl();
  if (!container) return;

  if (isVisible()) {
    animateGalleryEnter(container);
    logger.debug('갤러리 진입 애니메이션 실행');
  } else {
    animateGalleryExit(container);
    logger.debug('갤러리 종료 애니메이션 실행');
  }
});
```

**최적화 전략**:

```tsx
// ✅ 명시적 의존성 (isVisible만 추적)
createEffect(
  on(
    [containerEl, isVisible],
    ([container, visible]) => {
      if (!container) return;

      if (visible) {
        animateGalleryEnter(container);
        logger.debug('갤러리 진입 애니메이션 실행');
      } else {
        animateGalleryExit(container);
        logger.debug('갤러리 종료 애니메이션 실행');
      }
    },
    { defer: true }
  )
);
```

**변경 범위**:

1. `on()` wrapper 추가
2. 의존성 배열 명시: `[containerEl, isVisible]`
3. `defer: true` 옵션으로 초기 실행 지연

**테스트 계획**:

- 기존 테스트 활용: `test/features/gallery/prev-next-scroll.integration.test.ts`
- 추가 테스트:
  1. containerEl 변경 시에만 애니메이션 재실행
  2. isVisible 변경 시에만 애니메이션 전환
  3. mediaItems 변경은 애니메이션 트리거 안 함

---

### 20.3: 빌드 검증 및 성능 측정 ⏳

**목표**: 변경 사항 검증 및 성능 개선 확인

**작업**:

1. `npm run typecheck` - 타입 체크
2. `npm run lint:fix` - 린트 검사
3. `npm test` - 전체 테스트
4. `Clear-Host && npm run build` - 빌드 검증

**성능 측정**:

- Effect 실행 카운트 비교 (before/after)
- Chrome DevTools Performance 프로파일링
- 메모리 스냅샷 비교

**예상 결과**:

- ✅ 타입 체크 통과
- ✅ 모든 테스트 GREEN
- ✅ 빌드 크기 유지 또는 감소
- ✅ Effect 실행 횟수 50% 이상 감소

---

## 💡 다음 작업 후보 (Phase 21+)

Phase 20 완료 후 검토할 항목:

1. **Signal 구조 재설계** (HIGH): galleryState를 Fine-grained Signals로 분리
2. **무한 루프 방지** (CRITICAL): IntersectionObserver + Signal 조합 안정화
3. **useGalleryScroll 최적화** (MEDIUM): Passive listener + RAF 조합
4. **불필요한 Memo 제거** (MEDIUM): 단순 계산의 createMemo 제거
5. **KeyboardNavigator 최적화** (LOW): Map 기반 핸들러로 전환

---

1. ✅ Phase 18: 수동 스크롤 방해 제거 (완료)
2. ⏳ Phase 19: 테스트 console.log 제거 (진행 예정)
