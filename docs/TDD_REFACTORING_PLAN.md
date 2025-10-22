# TDD 리팩토링 활성 계획

최종 업데이트: 2025-10-22

---

## 현황 요약 (읽기 전 10초 요약)

- Build: prod 330.47 KB / 335 KB (여유 4.53 KB), gzip ~88.9 KB
- Tests: **2755 passed** + 5 skipped (unit+browser+E2E+a11y) GREEN ✅
- Note: **Phase A5.5 완료! 🎉** — 132개 신규 테스트 추가 (목표 100-150 달성!)
- 정적 분석: Typecheck/ESLint/Stylelint/CodeQL 모두 PASS
- 의존성: 269 modules, 758 deps, **순환 0** ✅ (Phase A5.1 완료)
- 완료 이력은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 완료된 작업

### ✅ Phase A5.5: Service Layer BaseServiceImpl 확대 (완료 ✅)

**목표**: BaseServiceImpl 패턴 사용률 35% → 90%+ (18개 서비스 마이그레이션)

**달성 성과**:

- BaseServiceImpl 도입: 8개 서비스 (35% → 향후 확대 대상)
- 신규 테스트: **132개** (목표 100-150 달성!)
  - Step 1 Main: 72 테스트 (BulkDownloadService, MediaService, EventManager)
  - KeyboardNavigator: 25 테스트
  - DownloadOrchestrator: 21 테스트
  - StabilityDetectorService: 14 테스트
- 빌드 안정성: 330.47 KB (여유 4.53 KB 유지)
- 테스트 통과: 2755/2760 ✅

**이관됨**: 자세한 내용은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

**최근 완료** (2025-10-22):

- 순환 의존성 해결: BulkDownloadServiceType 동적 import 제거
  - 순환 구조: DownloadOrchestrator → BaseServiceImpl → app.types → core-types →
    BulkDownloadService
  - 해결책: core-types에서 동적 import를 unknown으로 변경
  - 결과: deps:check 통과, 빌드 성공 ✅

**Phase A5 통합** (완료):

| Phase | 내용                    | 결과          |
| ----- | ----------------------- | ------------- |
| A5.1  | 순환 참조 해결          | ✅ 순환 0     |
| A5.2  | Service Registry 중앙화 | ✅ 완료       |
| A5.3  | State Management 통일   | ✅ 143 테스트 |
| A5.4  | Error Handling 개선     | ✅ 59 테스트  |
| A5.5  | BaseServiceImpl 확대    | ✅ 132 테스트 |

**Phase A5 누적**: 334개 테스트, 빌드 330.47 KB (안정적)

---

### ✅ Phase B3: 커버리지 개선 (완료 ✅)

**완성 상태**: 3개 파일 100% 커버리지 달성

**완료 파일**:

- solid-helpers.ts: 100% (10 테스트)
- focus-trap.ts: 100% (45 테스트)
- vendor-manager-static.ts: 100% (53 테스트)

**결과**: 108개 테스트, 커버리지 70% ✅

---

## 활성 작업

### 🔄 Phase B3 후속: 커버리지 심화 (진행 중)

**목표**: 커버리지 70% → 75%+ (300+ 테스트 추가)

**현황**:

- 전체 커버리지: 70.02% (lines: 45104/64413)
- 100% 달성 파일: 3개 (solid-helpers, focus-trap, vendor-manager-static)
- 80% 미만 파일: 65개

**우선순위 전략** (높은 영향도 순서):

1. **고우선순위 (높은 복잡도 + 낮은 커버리지)** - 30-50 테스트 예상
   - `src/shared/utils/dom/utils/dom-utils.ts`: 9.55% (13/136)
   - `src/shared/components/ui/Toast/Toast.tsx`: 6.97% (6/86)
   - `src/shared/browser/utils/browser-utils.ts`: 9.09% (19/209)
   - `src/shared/components/ui/Toast/ToastContainer.tsx`: 19.4% (13/67)
   - `src/shared/components/isolation/GalleryContainer.tsx`: 36.66% (22/60)

2. **중우선순위 (높은 사용도 + 중간 커버리지)** - 50-100 테스트 예상
   - `src/shared/external/userscript/adapter.ts`: 55.21% (127/230)
   - `src/shared/external/vendors/vendor-api-safe.ts`: 46.61% (62/133)
   - `src/shared/dom/dom-cache.ts`: 54.26% (140/258)
   - `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx`:
     58.06% (198/341)

3. **저우선순위 (낮은 사용도 또는 UI 요소)** - 100-150 테스트 예상
   - `src/features/gallery/hooks/useGalleryItemScroll.ts`: 63.7% (158/248)
   - `src/features/settings/services/twitter-token-extractor.ts`: 58.26%
     (201/345)
   - 기타 utility 함수들

**Step 1 계획** (Phase B3.1):

- 대상: dom-utils, Toast 컴포넌트 (5-10개 파일)
- 목표: 50-100 테스트 추가
- 예상 소요: 3-4시간

**성공 조건**:

- 모든 추가 테스트 GREEN ✅
- 빌드 크기 유지 (≤335 KB)
- 커버리지 2-3% 향상 (70% → 72-73%)

---

## 완료 이관 규칙

- 완료된 항목은 요약 후 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 이동
- 본 문서에서는 제거하여 간결성 유지
- 문서가 500줄 초과 시 핵심만 유지하고 재작성

---

## 참고 문서

- **완료 기록**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md`
- **아키텍처**: `docs/ARCHITECTURE.md`
- **테스트 전략**: `docs/TESTING_STRATEGY.md`
- **의존성 관리**: `docs/DEPENDENCY-GOVERNANCE.md`
