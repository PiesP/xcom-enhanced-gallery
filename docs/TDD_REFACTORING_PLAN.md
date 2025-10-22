# TDD 리팩토링 활성 계획

최종 업데이트: 2025-10-22

---

## 현황 요약 (읽기 전 10초 요약)

- Build: prod 329.53 KB / 335 KB (여유 5.47 KB), gzip 88.75 KB
- Tests: **2623 passed** + 5 skipped (unit+browser+E2E+a11y) GREEN
- Note: **Phase A5.4 ✅ 완료** — Error Handling 개선(59 신규 테스트), 무음 처리
  0개
- 정적 분석: Typecheck/ESLint/Stylelint/CodeQL 모두 PASS
- 의존성: 265 modules, 746 deps, 순환 0
- 완료 이력은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 활성 작업

### Phase A5.5: Service Layer BaseServiceImpl 확대 (계획 중 🔄)

**목표**: BaseServiceImpl 패턴 사용률 35% → 90%+ (18개 서비스 마이그레이션)

**현황**:

- BaseServiceImpl 도입 완료: AnimationService, ThemeService, LanguageService
  (3개 = 13%)
- Service Registry 중앙화: ✅ Phase A5.2 완료
- 에러 처리 개선: ✅ Phase A5.4 완료
- 남은 서비스: 20개 (media/download/storage/input/utils 등)

**계획**:

- � **Step 1 (계획 단계)**: 고우선순위 서비스 리팩토링 (2시간)
  - MediaQueryService (캐시 기반, 쿼리 비용 높음)
  - ExtractorService (복잡한 상태 관리)
  - DownloadManagerService (활성 모니터링, 생명주기)
  - StorageService (영속성, 에러 임계)
  - IconCacheService (메모리 관리)
  - 예상 테스트: 50-70개 추가

- 📋 **Step 2 (계획 단계)**: 중우선순위 서비스 리팩토링 (1.5시간)
  - StabilityDetectorService
  - ViewportService
  - HarnessFacadeService
  - LoggingService
  - 및 기타 3-4개 유틸리티 서비스
  - 예상 테스트: 40-60개 추가

- 📋 **Step 3 (계획 단계)**: 최종 검증 및 통합 테스트 (1시간)
  - Service Registry 상태 검증 (20+ 서비스 등록)
  - 순환 참조 재검증 (dependency-cruiser)
  - 빌드 및 전체 테스트 검증
  - 예상 테스트: 20-30개 추가

**예상 성과**:

- BaseServiceImpl 사용률: 35% → 90%+
- 신규 테스트: 110-160개 추가 (2623 → 2730+)
- 코드 복잡도 감소: 15-25%
- 빌드 영향: <1 KB 추가 (현재 여유 5.47 KB)
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
