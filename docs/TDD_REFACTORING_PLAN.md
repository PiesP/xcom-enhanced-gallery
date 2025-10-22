# TDD 리팩토링 활성 계획

최종 업데이트: 2025-10-22

---

## 현황 요약 (읽기 전 10초 요약)

- Build: prod 329.83 KB / 335 KB (여유 5.17 KB), gzip ~88.8 KB
- Tests: **2741 passed** + 5 skipped (unit+browser+E2E+a11y) GREEN ✅
- Note: **Phase A5.5 Step 1 확대 🔄 진행 중** — 118 신규 테스트 추가 (목표
  100-120 달성! 🎯)
- 정적 분석: Typecheck/ESLint/Stylelint/CodeQL 모두 PASS
- 의존성: 265 modules, 746 deps, 순환 0
- 완료 이력은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 활성 작업

### Phase A5.5: Service Layer BaseServiceImpl 확대 (진행 중 🔄)

**목표**: BaseServiceImpl 패턴 사용률 35% → 90%+ (18개 서비스 마이그레이션)

**현황** (실시간 업데이트):

- BaseServiceImpl 도입 완료: AnimationService, ThemeService, LanguageService,
  BulkDownloadService, MediaService, EventManager, KeyboardNavigator,
  DownloadOrchestrator (8개 = 35%)
- Service Registry 중앙화: ✅ Phase A5.2 완료
- 에러 처리 개선: ✅ Phase A5.4 완료
- 남은 서비스: ~16개

**진행 상황** (상세):

- ✅ **Step 1 Main** (완료 ✅): 고우선순위 서비스 리팩토링 **72 테스트 추가**
  - ✅ BulkDownloadService (21 테스트)
  - ✅ MediaService (20 테스트)
  - ✅ EventManager (31 테스트)

- 🔄 **Step 1 Expansion** (진행 중): 추가 서비스 리팩토링 **46 테스트 추가**
  (목표 30-50)
  - ✅ KeyboardNavigator (25 테스트) - 싱글톤 + 이벤트 구독 관리
  - ✅ DownloadOrchestrator (21 테스트) - 동시성 제어 + 타이머 정리
  - 다음 대상:
    - StabilityDetectorService (factory → class, 8-10 테스트 예상)
    - 기타 우선순위 낮은 서비스들

- 📋 **Step 2 (계획)**: 중우선순위 서비스 리팩토링
  - ToastServices (UI 상태)
  - ServiceManager (핵심 인프라)
  - 및 기타 유틸리티 서비스
  - 예상 테스트: 30-50개 추가

- 📋 **Step 3 (계획)**: 최종 검증 및 통합 테스트
  - Service Registry 상태 검증
  - 순환 참조 재검증
  - 빌드 및 전체 테스트 검증
  - 예상 테스트: 20-30개 추가

**누적 성과**:

| 항목                     | 값            | 상태              |
| ------------------------ | ------------- | ----------------- |
| Phase A5.5 Main (Step 1) | 72 tests      | ✅ Complete       |
| KeyboardNavigator        | 25 tests      | ✅ Complete       |
| DownloadOrchestrator     | 21 tests      | ✅ Complete       |
| **총 누적**              | **118 tests** | **🎯 목표 달성!** |
| Step 1 Expansion 목표    | 30-50 tests   | ✅ 46 achieved    |
| Phase A5.5 목표          | 100-120 tests | ✅ 118 achieved   |
| BaseServiceImpl 사용률   | 8/23 = 35%    | 📈 증가 중        |

**예상 성과**:

- BaseServiceImpl 사용률: 35% → 70%+ (Step 1 완료 시)
- 누적 신규 테스트: 118 (목표 100-120 달성 ✅)
- 코드 복잡도 감소: 10-15%
- 빌드 영향: +0 KB (현재 여유 5.17 KB)
- 예상 소요 시간: 4-5시간 (TDD 기반)

**성공 조건**:

- 모든 서비스에 initialize/destroy 생명주기 ✓
- 에러 처리 ErrorFactory 패턴 사용 ✓
- 의존성 규칙 준수 (Shared → External) ✓
- 모든 검증 PASS (test/lint/build/type) ✓

---

### Phase A5 (완료 경로 추적)

**목표**: Service Layer 정리, State Management 패턴 통일, Error Handling 전략
개선

**완료 항목**:

- ✅ **Phase A5.1**: 순환 참조 해결 및 빌드 검증
- ✅ **Phase A5.2**: Service Registry 중앙화
- ✅ **Phase A5.3**: State Management 패턴 통일 (143 테스트)
- ✅ **Phase A5.4**: Error Handling 개선 (59 테스트)
- 🔄 **Phase A5.5**: Service Layer BaseServiceImpl 확대 (예정)

**Phase A5 누적**: 신규 테스트 202개 (143 + 59), 빌드 329.53 KB (안정적)

---

### Phase B3: 커버리지 개선 (완료 ✅)

**완성 상태**: 3개 파일 100% 커버리지 달성

**완료 파일**:

1. **solid-helpers.ts** ✅ (100%, 44 lines) - 10개 테스트 추가
2. **focus-trap.ts** ✅ (100%, 215 lines) - 45개 테스트 추가
3. **vendor-manager-static.ts** ✅ (100%, 536 lines) - 53개 테스트 추가

**결과**: 108개 테스트 추가, 커버리지 69.95% → 70%, 빌드 ✅

---

## 백로그 (후순위)

### 1. 번들 최적화 (Phase C1)

- Hero 아이콘 최적화: 배럴 파일 제거, tree-shaking 개선 (수 KB 절감)
- 번들 분석기: rollup-plugin-visualizer 도입, 큰 의존성 식별
- 조건부 컴파일: FEATURE 플래그 기반 디버그 코드 제거

### 2. 커버리지 심화 (Phase B3 후속)

- 80% 미만 파일: 13개 남음
- 예상 테스트: 300-400개 추가

### 3. 성능 개선

- Virtual scrolling (gallery 무한 스크롤)
- Bundle 분석 및 최적화
- 렌더링 성능 벤치마크

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
