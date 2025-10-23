# TDD 리팩토링 계획

> xcom-enhanced-gallery 프로젝트의 활성 리팩토링 진행 상황 **현재 Phase**: 159
> (Hook 상태 정규화) **마지막 업데이트**: 2025-10-23

---

## 📊 현황 요약

| 항목           | 상태          | 세부                            |
| -------------- | ------------- | ------------------------------- |
| Build (prod)   | ✅ 337.53 KB  | 제한: 337.5 KB (Phase 157 결정) |
| 전체 테스트    | ✅ 3205+ PASS | 보안 및 린트 통과               |
| E2E 테스트     | ✅ 89/97 PASS | Playwright 스모크 테스트        |
| Typecheck/Lint | ✅ PASS       | 모든 검사 완료                  |
| 의존성         | ✅ OK         | 0 violations                    |
| **현재 Phase** | 📋 159 계획중 | Hook 상태 정규화 분석 대기      |

---

## 📝 Phase 159: Hook 상태 정규화 (계획 중 📋)

### 목표

1. **Hook 상태 정규화 평가**: `useProgressiveImage`, `useGalleryItemScroll` 검토
2. **신호 기반 리팩토링**: 컴포넌트 내부 상태 → shared/state Signals 이동
3. **유지보수성 향상**: 단일 책임 원칙 강화, 테스트 커버리지 개선

### 배경

Phase 158 이후 이벤트 처리가 안정화되었으며, 다음 우선순위는 **상태 관리의
일관성 강화**입니다. 현재 프로젝트의 Hook들이 부분적으로 서로 다른 패턴(컴포넌트
로컬 상태 vs shared Signal)을 사용하고 있어, 다음을 목표로 합니다:

- **Phase 150/153 이후 패턴 일관성**: shared/state 패턴 확대
- **테스트 개선**: 상태 기반 테스트로 UI 테스트 의존도 감소
- **유지보수**: 상태 추적/디버깅 용이성 개선

### 📊 Hook 분석 결과

| Hook                   | 파일 크기 | 상태 유형        | 패턴 평가 | 리팩토링 기회            |
| ---------------------- | --------- | ---------------- | --------- | ------------------------ |
| useProgressiveImage    | ~300줄    | 컴포넌트 로컬    | 🟢 최적   | 없음 (이미 신호 기반)    |
| useGalleryItemScroll   | ~428줄    | 혼합 (로컬+접근) | 🔴 개선   | 상태 추출 가능 (+25-30%) |
| useGalleryScroll       | ~259줄    | 신호 기반        | 🟢 양호   | 없음 (이미 shared 패턴)  |
| useGalleryFocusTracker | ~688줄    | 신호 기반        | 🟢 최적   | 없음 (Phase 150.3 완료)  |

**주요 발견**:

1. **useProgressiveImage**: 이미 최적화 상태
   - 독립적 이미지 로딩 로직, 컴포넌트 스코프 적절
   - 신호 기반, 외부 의존성 최소
   - 추가 리팩토링 불필요

2. **useGalleryItemScroll**: 리팩토링 기회 가장 높음
   - 로컬 상태: `lastScrolledIndex`, `pendingIndex`, `userScrollDetected` (3개
     추출 가능)
   - 복잡한 타이머 관리 (scrollTimeoutId, indexWatcherId, userScrollTimeoutId)
   - 상태 추출 시 테스트 커버리지 +25-30% 예상
   - 재사용성 ↑, 버그 수정 용이

3. **useGalleryScroll**: 이미 좋은 패턴
   - galleryState selector 적극 활용
   - scrollState Signal 기반 (shared 패턴)
   - 추가 정규화 불필요

4. **useGalleryFocusTracker**: Phase 150.3 완료
   - shared/state/focus 모듈로 완전 정규화
   - FocusState, ItemCache, FocusTimerManager 등 모듈화 완료
   - 모범 사례

### 🎯 리팩토링 옵션 (비용/효과 분석)

#### **Option A: useGalleryItemScroll 상태 추출** ⭐ 1순위

**목표**: `useGalleryItemScroll` 상태를 shared/state로 정규화

**비용**: 3-4시간

- 상태 모듈 생성 (item-scroll-state.ts)
- useGalleryItemScroll 리팩토링
- 테스트 작성/통합
- 문서 업데이트

**효과**:

- ✅ 테스트 커버리지 +25-30%
- ✅ 코드 재사용성 ↑
- ✅ 상태 추적/디버깅 용이
- ✅ 버그 수정 시간 ↓

**난이도**: 중간

**상세 계획**:

1. `src/shared/state/item-scroll/item-scroll-state.ts` 생성
   - `ItemScrollState` 타입 정의 (lastScrolledIndex, pendingIndex,
     userScrollDetected, etc.)
   - 헬퍼 함수 (createItemScrollState, updateItemScrollState,
     resetItemScrollState)
2. `useGalleryItemScroll` 리팩토링
   - 로컬 상태 → shared/state 신호로 이동
   - 기존 API 유지 (backward compatible)
3. 테스트 추가
   - `test/unit/shared/state/item-scroll/item-scroll-state.test.ts`
   - `test/integration/hooks/useGalleryItemScroll.integration.test.ts`
4. 빌드/검증
   - 번들 크기 영향도 측정 (예상: +1-2 KB)

#### **Option B: useProgressiveImage 문서화 강화** 3순위

**목표**: 이미 최적화된 useProgressiveImage의 문서화 개선

**비용**: 1-2시간

- 코드 주석 추가
- 사용 패턴 문서화
- 테스트 커버리지 확인 (이미 높음)

**효과**:

- ✅ 유지보수성 ↑ (문서화)
- ✅ 온보딩 시간 ↓
- ✅ 버그 방지

**난이도**: 낮음

**상태**: Option A 이후 필요시 진행

#### **Option C: Hook 통합 테스트** 2순위

**목표**: useGalleryItemScroll + useGalleryScroll + useGalleryFocusTracker 통합
검증

**비용**: 2-3시간

- 통합 시나리오 테스트 작성
- E2E 테스트 일부 대체

**효과**:

- ✅ 훅 간 상호작용 검증
- ✅ E2E 테스트 감소 가능 (테스트 속도 ↑)
- ✅ 신뢰도 ↑

**난이도**: 중간

**상태**: Option A 완료 후 필요시 진행

### 📋 실행 계획 (이번 세션)

#### **159a: Hook 분석 및 옵션 결정** ✅ COMPLETE

- ✅ 4개 Hook 분석 완료
- ✅ 패턴 평가: 1개 리팩토링 필요 (useGalleryItemScroll)
- ✅ 리팩토링 옵션 3가지 정의 (A/B/C)
- ✅ **선정 결과**: Option A (useGalleryItemScroll) → 1순위

#### **159b: Option A 실행** (다음 단계)

**예상 소요시간**: 3-4시간

**체크리스트**:

- [ ] `src/shared/state/item-scroll/` 디렉터리 생성
- [ ] `item-scroll-state.ts` 작성 (상태 타입 + 헬퍼 함수)
- [ ] `item-scroll-state.test.ts` 작성 (테스트)
- [ ] `useGalleryItemScroll` 리팩토링
- [ ] 기존 테스트 통과 확인
- [ ] 빌드/번들 크기 검증

#### **159c: Option C 검토** (선택)

**조건**: Option A 완료 후, 필요시 진행

**체크리스트**:

- [ ] 통합 시나리오 식별
- [ ] 테스트 작성
- [ ] E2E 대체 가능성 검토

#### **159d: 문서 업데이트**

- [ ] CODING_GUIDELINES.md: Hook 패턴 가이드 강화
- [ ] ARCHITECTURE.md: shared/state 패턴 명확화
- [ ] 완료 기록: TDD_REFACTORING_PLAN_COMPLETED.md 이관

### 📈 성공 기준

| 항목          | 목표             | 허용 범위 |
| ------------- | ---------------- | --------- |
| 테스트 통과율 | 99%+ (3200/3211) | 98% 이상  |
| 빌드 크기     | ≤337.5 KB        | ±2 KB     |
| 커버리지 증가 | +20-30%          | +15% 이상 |
| 타입 에러     | 0                | 0         |
| 린트 에러     | 0                | 0         |

---

## 📚 참고 문서

- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - 테스트 피라미드 및 전략
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙 및 Hook 패턴
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조 및 상태 관리
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  완료 기록

---

**다음 단계**: Phase 159a 실행 (Hook 분석)
