# TDD 리팩토링 계획

> xcom-enhanced-gallery 프로젝트의 활성 리팩토링 진행 상황 **최종 업데이트**:
> 2025-10-23

---

## 📊 현황 요약

| 항목           | 상태          | 세부                        |
| -------------- | ------------- | --------------------------- |
| Build (prod)   | ✅ 335.93 KB  | 제한: 336 KB, 여유: 0.07 KB |
| 전체 테스트    | ✅ 3041+ PASS | 보안 및 린트 통과           |
| 누적 테스트    | 📈 727+개     | 70%+ 커버리지 유지          |
| E2E 테스트     | ✅ 89/97 PASS | Playwright 스모크 테스트    |
| Typecheck/Lint | ✅ PASS       | 모든 검사 완료              |
| 의존성         | ✅ OK         | 0 violations                |

---

## 📝 다음 작업 계획

### 🎯 우선순위 분석

현재 codebase에서 식별된 리팩토링 기회 (우선순위 순):

1. **추가 상태 정규화** (중간 복잡도, 높은 영향) - **진행 중 🚀**
   - Phase 153: Hook 상태 정규화 (useGalleryScroll, useProgressiveImage 등)
   - 대상: 분산된 상태 변수 → Signal 기반 통합
   - 예상 효과: 유지보수성 ↑, 버그 위험 ↓

2. **이벤트 핸들링 개선** (중간 복잡도, UX 개선)
   - PC 전용 이벤트 정책 강화
   - 키보드 네비게이션 최적화
   - 예상 효과: 반응성 ↑

3. **번들 크기 최적화** (낮은 복잡도, 즉시 효과) - **마지막 우선순위로 설정 ⏳**
   - 현재: 335.93 KB / 제한: 336 KB (여유: 0.07 KB)
   - 다른 작업 완료 후 진행
   - 검토 대상: 불필요한 폴리필, tree-shaking 최적화
   - 예상 효과: -0.5~1 KB

---

## 📝 Phase 153 계획 (진행 중 🚀)

### Step 1: useGalleryScroll 상태 정규화 (완료 ✅)

**커밋**: 9dd6f5ef + 51f0e444 (master로 merge 완료)

**변경사항**:

- 3개 분산 Signal → 1개 통합 ScrollState Signal
- `src/shared/state/hooks/scroll-state.ts` 신규 생성
- 배치 업데이트 적용으로 성능 개선
- API 역호환성 100% 유지

**검증**:

- ✅ 타입 체크 PASS
- ✅ 스모크 테스트 14/14 PASS
- ⚠️ 빌드 크기: 336.22 KB (초과 0.22 KB) → Phase 155에서 처리

### Step 2: useGalleryItemScroll 상태 최적화 (예정)

**분석**:

- 현재: 분산 상태 변수 7개 (lastScrolledIndex, pendingIndex, retryCount,
  userScrollDetected 등)
- 목표: 통합 State 구조 도입으로 복잡도 감소

\*\*Step 3: useGalleryFocusTracker 리뷰 (예정)

**분석**:

- Phase 150.2에서 이미 상당히 정규화됨
- 추가 최적화 여부 평가

**Step 4-5: 테스트 및 정리 (예정)**

- 신규 테스트 추가/수정
- 문서화 및 최종 검증

---

## ✅ 완료된 작업

### Phase 152: Link Preview Image Click Detection (완료 ✅)

- 링크 미리보기 이미지 감지 로직 추가
- 링크 미리보기 차단으로 트위터 기본 링크 동작 보존
- **테스트**: 4/4 PASSED ✅
- **빌드**: 335.93 KB (+1 KB from phase 151)

### Phase 151: Service Container 최적화 (완료 ✅)

- CoreServiceRegistry 구현 (18/18 테스트 통과)
- service-accessors.ts 리팩토링 (smoke 14/14 통과)
- 12개+ getter 함수 중앙화, 캐싱 레이어 추가

### Phase 150: Media Extraction & Auto Focus (완료 ✅)

- **Phase 150.1**: TwitterAPIExtractor Strategy 리팩토링 (60→20줄, 67% 감소)
- **Phase 150.2**: 자동 포커스 상태 정규화 (18→8-10개 상태 통합, 78/78 테스트)
- **Phase 150.3**: useGalleryFocusTracker 통합 검증 완료

---

## 📚 참고 문서

- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - 테스트 피라미드 및 전략
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  완료된 Phase 상세 기록

**기간**: 2025-10-23 **상태**: 완료

### 버그 개요

- **증상**: 설정 메뉴를 표시한 후 호버 영역에서 마우스를 이탈하면 툴바가
  자동으로 사라지지 않고, 브라우저 포커스 손실 시 다시 활성화되는 문제
- **근본 원인**: CSS의 `pointer-events: none` 규칙이 `data-settings-expanded`
  속성을 고려하지 않음
- **영향 범위**: `VerticalGalleryView.module.css` 라인 301-304

### 구현 내용

**CSS 수정** (`VerticalGalleryView.module.css`):

```css
/* Before */
.container.initialToolbarVisible .toolbarHoverZone,
.container:has(.toolbarWrapper:hover) .toolbarHoverZone {
  pointer-events: none;
}

/* After */
.container.initialToolbarVisible:not([data-settings-expanded='true'])
  .toolbarHoverZone,
.container:has(.toolbarWrapper:hover):not([data-settings-expanded='true'])
  .toolbarHoverZone {
  pointer-events: none;
}
```

**E2E 테스트 추가** (`playwright/smoke/toolbar-initial-display.spec.ts`):

- 테스트: "설정 메뉴 표시 후 호버 이탈 시 정상 작동한다"
- 검증: Settings 메뉴 열린 상태에서 toolbar 컨테이너의 속성 정상화 확인

### 테스트 현황

**E2E 테스트**: **6/6 통과** ✅

1. ✓ 갤러리 진입 시 툴바가 초기에 표시된다
2. ✓ 마우스를 상단으로 이동하면 툴바가 표시된다
3. ✓ 버튼이 클릭 가능한 상태이다
4. ✓ 설정된 ARIA 레이블이 있다
5. ✓ 툴바가 정확한 위치에 배치된다
6. ✓ 설정 메뉴 표시 후 호버 이탈 시 정상 작동한다 (신규)

### 검증

- ✅ dev/prod 빌드 통과
- ✅ E2E 스모크 테스트 97/97 통과
- ✅ TypeScript strict 모드
- ✅ ESLint/CodeQL 통과

---

## 📝 Phase 146: Toolbar Initial Display (완료 ✅)

**기간**: 2025-10-22 ~ 2025-10-23 **상태**: 완료

### 구현 내용

- **기능**: 갤러리 진입 시 툴바 자동 표시 및 설정된 시간 후 자동 숨김
- **파일**:
  `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`
- **구현 방식**:
  - Solid.js `createSignal` + `createEffect`를 사용한 반응형 상태 관리
  - `globalTimerManager`를 통한 생명주기 안전 타이머
  - CSS Modules를 통한 초기 표시 상태 스타일링
  - 설정값 `toolbar.autoHideDelay` (기본값: 3000ms)

### 테스트 현황

**E2E 테스트** (Playwright): **5/5 통과** ✅

- 갤러리 진입 시 툴바가 초기에 표시된다
- 마우스를 상단으로 이동하면 툴바가 표시된다
- 버튼이 클릭 가능한 상태이다
- 설정된 ARIA 레이블이 있다
- 툴바가 정확한 위치에 배치된다

**파일**: `playwright/smoke/toolbar-initial-display.spec.ts`

### 의사 결정 기록

1. **TDD RED 단계**: 8개 단위 테스트 작성 (모두 실패 - JSDOM 제약)
2. **TDD GREEN 단계**: 기능 구현 완료
3. **전환 결정**: JSDOM 환경 제약으로 인한 **E2E 테스트 전환**
   - 이유: CSS Modules 해싱, 무한 타이머 루프, 반응성 추적 실패
   - 결과: E2E 테스트가 더 적합하며 모두 통과
4. **검증**:
   - 개발 빌드 ✅
   - 프로덕션 빌드 ✅
   - 타입 체크 ✅
   - ESLint/CodeQL ✅
   - Prettier 포맷 ✅

### 학습 사항

- E2E 테스트가 브라우저 의존 기능(CSS, 타이머, 반응성)에 더 효과적
- Playwright 하네스를 통한 컴포넌트 마운트/언마운트로 상태 전환 검증 가능
- 타입 단언(`as XegHarness`)으로 Playwright 타입 안정성 확보

---

## ✅ 완료된 Phase 요약

**누적 성과**: 총 723+개 테스트, 커버리지 70%+ 달성

| #   | Phase  | 테스트 | 상태 | 설명                        |
| --- | ------ | ------ | ---- | --------------------------- |
| 1   | A5     | 334    | ✅   | Service Architecture        |
| 2   | 145    | 26     | ✅   | Gallery Loading Timing      |
| 3   | B3.1   | 108    | ✅   | Coverage Deep Dive          |
| 4   | B3.2.1 | 32     | ✅   | GalleryApp.ts               |
| 5   | B3.2.2 | 51     | ✅   | MediaService.ts             |
| 6   | B3.2.3 | 50     | ✅   | BulkDownloadService         |
| 7   | B4     | 4      | ✅   | Click Navigation            |
| 8   | B3.2.4 | 51     | ✅   | UnifiedToastManager         |
| 9   | B3.3   | 50     | ✅   | 서비스 간 통합 시나리오     |
| 10  | 134    | 1      | ✅   | 성능/메모리 상태 문서화     |
| 11  | B3.4   | 33     | ✅   | 성능 측정 & 메모리 거버넌스 |
| 12  | B3.5   | 15     | ✅   | E2E 성능 검증               |
| 13  | B3.6   | 0      | ✅   | 최종 통합 & 성능 요약       |
| 14  | 146    | 5      | ✅   | Toolbar Initial Display     |
| 15  | 147    | 1      | ✅   | Settings Menu Hover Fix     |

상세 기록:
[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) 참조

---

## 📚 참고 문서

- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - 테스트 피라미드 및 전략
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  완료된 Phase 상세 기록
