# TDD 리팩토링 활성 계획

최종 업데이트: 2025-10-22

---

## 현황 요약 (읽기 전 10초 요약)

- Build: prod 329.20 KB / 335 KB (여유 5.80 KB), gzip 88.69 KB
- 최적화: 프로덕션 소스맵 제거 완료
- Tests: **2457 passed** + 5 skipped (unit+browser+E2E+a11y) GREEN
- Note: **Phase B3 완료** — 상위 3개 파일 커버리지 100% 달성 (108개 테스트 추가)
- 정적 분석: Typecheck/ESLint/Stylelint/CodeQL 모두 PASS
- 의존성: 265 modules, 746 deps, 순환 0
- 완료 이력은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 활성 작업

### Phase A5: 아키텍처 개선 (진행 중 🔄)

**목표**: Service Layer 정리, State Management 패턴 통일, Error Handling 전략
개선

**진행 상황**:

- ✅ **분석 완료**: Service Layer (23개 서비스), State Management (Signal 패턴),
  Error Handling (AppError 30-40% 사용)
- ✅ **Step 1.1 완료**: AnimationService 리팩토링 (initialize/destroy 생명주기
  추가, commit 46563f19)
- ✅ **Step 1.2 완료**: ThemeService 리팩토링 (BaseServiceImpl 패턴, commit
  8169949a)
- ✅ **Step 1.3 완료**: LanguageService 리팩토링 (BaseServiceImpl 패턴, commit
  69513d40)
- ✅ **Phase A5.1 완료**: 순환 참조 해결 및 빌드 검증 (commit 2862a265)
- ✅ **Phase A5.2 완료**: Service Registry 중앙화 (commit 5c93e3e5)
  - service-manager.ts에 BaseService 생명주기 관리 메서드 추가
  - service-bridge.ts, service-accessors.ts 강화
  - main.ts에서 initializeCoreBaseServices 호출 (Animation → Theme → Language)
  - IconRegistry는 factory pattern으로 유지 (WeakMap 메모리 효율)
  - 빌드: prod 329.20 KB (목표 335 KB) ✓
  - 테스트: 2457 passed + 5 skipped ✓
  - E2E/a11y: 94 tests passed ✓
- 🔄 **Phase A5.3 진행 중**: State Management 패턴 통일
  - **목표**: Signal 생성 패턴 표준화, State Machine 확대 적용, signalSelector
    일관 적용
  - **분석 완료**: docs/temp/A5_3_STATE_MANAGEMENT_ANALYSIS.md ✓
  - **Step 1 (P1) 진행 중**: Signal 패턴 표준화 (createSignalSafe 통일)
    - ✅ toolbar.signals.ts (commit c9d5e222)
      - lazy initialization → immediate initialization
      - createSignal → createSignalSafe
      - 에러 처리 개선
      - 테스트 21개 추가, 모두 통과
      - 기존 2478개 테스트 통과
    - 🔄 다음 16개 파일 (use-gallery-toolbar-logic.ts, stability-detector.ts 등)
    - 예상: 1-2시간 (총 1시간 남음)
  - **Step 2 (P2)**: State Machine 확대 (3개 추가)
    - Download: idle → queued → processing → complete|error
    - Toast: idle → showing → waiting → hidden
    - Settings: closed → opening → open → closing
    - 소요: 2-3시간
  - **Step 3 (P3 선택)**: signalSelector 일관 적용 (파생값 캐싱)
    - 소요: 1시간
  - **예상 남은 소요**: 3-6시간 (Step 1 마무리 + Step 2/3)

**분석 결과** (상세: docs/temp/PHASE_A5_IMPLEMENTATION_PLAN.md):

1. **Service Layer 현황**
   - 23개 서비스 파일 (services/, media/, download/, input/, storage/ 등)
   - BaseServiceImpl 패턴 사용률: 30% → 35% (AnimationService, ThemeService,
     LanguageService)
   - Service Registry: service-manager에서 중앙화 (Phase A5.2 완료)
   - 다음 단계: 나머지 서비스 BaseServiceImpl 확대 (목표: 90%+)

2. **State Management 현황**
   - Signal 생성 패턴: createSignal, createSignalSafe 혼용
   - State Machine 활용: navigation만 사용 (목표: 확대 적용)
   - 파생값 메모이제이션: 규칙 없음 (목표: signalSelector 일관 적용)

3. **Error Handling 현황**
   - AppError 사용률: 30-40% (목표: 70%+)
   - 에러 경로 커버리지: 60-70% (목표: 75%+)

**예상 결과** (A5 완료 시):

- 서비스 코드 복잡도 감소: 20-30%
- State 관리 일관성 증대: 90%+
- 에러 처리 커버리지: 60% → 75%+

---

### Phase B3: 커버리지 개선 (완료 ✅)

**완성 상태**: 3개 파일 모두 **100% 커버리지** 달성

**완료 파일** (실제 결과):

1. **solid-helpers.ts** ✅
   - 최종 커버리지: **100%** (44/44 lines)
   - 추가 테스트: 10개 (`solid-helpers.test.ts`)
   - 내용: toAccessor, isAccessor, isHTMLElement 모든 케이스 테스트

2. **focus-trap.ts** ✅
   - 최종 커버리지: **100%** (215/215 lines)
   - 추가 테스트: 45개 (`focus-trap.test.tsx`)
   - 내용: Focus trap 초기화, Tab/Escape 핸들링, focusable 요소 필터링, 에러
     처리

3. **vendor-manager-static.ts** ✅
   - 최종 커버리지: **100%** (536/536 lines)
   - 추가 테스트: 53개 (`vendor-manager-coverage.test.ts`)
   - 내용: 싱글톤 패턴, 초기화, Solid.js API, Store API, 호환성 함수

**결과 요약**:

- 추가 테스트: **108개** (10 + 45 + 53)
- 전체 테스트: **2457개** (기존 2349 + 108 신규, 5 skipped)
- 전체 커버리지: **69.95% → 70%** (+0.05%)
- 빌드 상태: ✅ PASS (327.44 KB, 88.18 KB gzip)
- 모든 검증: ✅ PASS (typecheck, lint, CodeQL, E2E, a11y)

---

## 백로그 (후순위 제안)

### 1. 번들 최적화 (Phase C1 후속)

- **Hero 아이콘 최적화** (안전)
  - 배럴 파일 경유 제거, 직접 import로 변경
  - 예상 효과: tree-shaking 개선, 수 KB 절감
- **번들 분석기 도입**
  - rollup-plugin-visualizer로 실제 번들 구성 시각화
  - 큰 의존성 식별 및 대안 탐색
- **조건부 컴파일 실험**
  - FEATURE 플래그 기반 디버그/진단 코드 제거

### 2. 커버리지 개선 (Phase B3)

- 80% 미만 파일: 13개 남음
- 우선순위: 사용 빈도/중요도 기반 (상위 3개부터)
- 예상 테스트: 300-400개 추가

### 3. 테스트 강화

- Browser 테스트 확장 (Solid.js 반응성 검증)
- E2E 시나리오 추가 (하네스 패턴 활용)
- Performance 테스트 강화

### 4. 접근성 강화

- ARIA 패턴 검증 확대
- 스크린 리더 테스트
- WCAG 2.1 Level AA 완전 준수

### 5. 아키텍처 개선

- Service Layer 리팩토링 검토
- State Management 패턴 정리
- Error Handling 전략 통일

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
