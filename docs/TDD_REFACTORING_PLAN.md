# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

**최근 업데이트**: 2025-10-01 — Epic ARCH-SIMPLIFY-001 계획 수립

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 "활성 Epic/작업"과 해당 Acceptance에만 집중합니다.

---

## 활성 Epic 현황

### Epic: ARCH-SIMPLIFY-001 — 아키텍처 복잡도 간소화 📋 **계획 중** (2025-10-01)

**목표**: 필요 이상으로 복잡한 구조를 간결하고 현대적으로 재구축하여 유지보수성
향상

**배경**:

- Epic SOLID-NATIVE-001/002, LEGACY-CLEANUP-001 등의 대규모 마이그레이션이
  완료되었으나 일부 복잡도가 여전히 잔존
- 순환 의존성 2개, Deprecated API 17개, 실패 테스트 56개 등 정리 필요 영역 존재
- 프로젝트가 성숙 단계에 접어들면서 "실용적 단순화"가 다음 단계 목표로 부상

**전체 범위 (5개 Phase)**:

1. **Phase A: Deprecated API 정리** — 17개 @deprecated 마커 제거 또는 대체
2. **Phase B: 순환 의존성 해결** — 2개 순환 고리를 공통 모듈 추출로 해소
3. **Phase C: 테스트 구조 정비** — 56개 실패 테스트 수정 및 49개 스킵 테스트
   재평가
4. **Phase D: 벤더 API 단순화** — StaticVendorManager/MockVendorManager 통합
   검토
5. **Phase E: Epic 후속 정리** — 이전 Epic들의 미완료 항목 마무리

---

## Phase A: Deprecated API 정리 (예상 1주)

**목표**: 코드베이스 내 17개 @deprecated 마커를 분석하고 제거 또는 마이그레이션
경로 제시

**솔루션 비교**:

- **Option A: Codemod 자동 제거**
  - 장점: 빠른 정리 (1주), Epic LEGACY-CLEANUP-001 인프라 재사용 가능
  - 단점: False positive 필터링 필요, 수동 검토 여전히 필요
  - 평가: ✅ **선택** (Epic SOLID-NATIVE-002 Phase B Codemod 도구 검증됨)
- **Option B: 점진적 수동 제거**
  - 장점: 높은 정확도, 컨텍스트 이해 유지
  - 단점: 시간 소요 큼 (2-3주), 사람의 실수 가능성
  - 평가: ❌ 제외 (비효율적)

**Phase A 작업 항목**:

1. **A-1: UnifiedToastManager Deprecated API 제거**
   - 타겟: `subscribe()`, `signal` 속성 (Epic SOLID-NATIVE-001 Phase G-3-4에서
     이미 deprecated 처리)
   - 전략: 사용처를 `createEffect()` + `getToasts()` Accessor로 전환
   - 산출물: UnifiedToastManager.ts 정리, 관련 테스트 업데이트
   - 예상 소요: 2일
2. **A-2: 이벤트 관리 레거시 API 제거**
   - 타겟: `shared/utils/events.ts`의 `registerKeyboardListener()`,
     `registerEvent()` (UnifiedEventManager 사용 권장)
   - 전략: 사용처를 UnifiedEventManager로 마이그레이션
   - 산출물: events.ts 정리, 사용처 5-10개 업데이트
   - 예상 소요: 2일
3. **A-3: Heroicons Vendor Shim 완전 제거**
   - 타겟: `shared/external/vendors/heroicons-react.ts` (이미 제거된 shim의 빈
     파일)
   - 전략: 파일 삭제 및 import 경로 정리
   - 산출물: heroicons-react.ts 제거, orphan 테스트 가드 업데이트
   - 예상 소요: 1일
4. **A-4: ServiceManager/BrowserService Deprecated Diagnostics 제거**
   - 타겟: `getServiceStatus()`, `getBrowserDiagnostics()` (v1.1.0에서
     UnifiedServiceDiagnostics 사용 권장)
   - 전략: 사용처를 UnifiedServiceDiagnostics로 전환 또는 제거
   - 산출물: ServiceManager.ts, BrowserService.ts 정리
   - 예상 소요: 1일
5. **A-5: 기타 Deprecated 항목 검토**
   - 타겟: `createParitySnapshot` alias, `app-state.ts` subscribe 메서드
   - 전략: 개별 영향도 분석 후 제거 또는 유예 결정
   - 산출물: 정리 리포트
   - 예상 소요: 1일

**Acceptance Criteria**:

- [ ] @deprecated 마커 17개 → 5개 이하로 감소
- [ ] 제거된 API의 모든 사용처가 대체 API로 전환됨
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN
- [ ] 번들 크기 유지 또는 감소 (450KB 미만 목표)

---

## Phase B: 순환 의존성 해결 (예상 2주)

**목표**: `docs/dependency-cycles.json`의 2개 순환 고리를 해소하여 모듈 결합도
감소

**솔루션 비교**:

- **Option A: 의존성 역전 (Dependency Inversion)**
  - 장점: 근본적인 아키텍처 개선, 테스트 용이성 증가
  - 단점: 구조 변경 범위가 큼 (14개 모듈), 높은 회귀 리스크
  - 평가: ❌ 제외 (리스크 대비 효과 불분명)
- **Option B: 공통 모듈 추출**
  - 장점: 점진적 개선 가능, 회귀 리스크 낮음, TDD로 안전하게 진행
  - 단점: 임시 해결책 성격, 장기적으로 모듈 수 증가 가능
  - 평가: ✅ **선택** (실용적이며 Epic 워크플로에 적합)

**Phase B 작업 항목**:

1. **B-1: Cycle 1 공통 타입/인터페이스 추출**
   - 타겟: 14개 모듈 순환 (shared/media, services, state, utils)
   - 전략: 순환을 유발하는 공통 타입/인터페이스를 `shared/types/core`로 이동
   - 산출물: 공통 타입 모듈 신규 생성, 순환 제거 검증
   - 예상 소요: 5일
2. **B-2: Cycle 2 UI 컴포넌트 순환 해결**
   - 타겟: 5개 모듈 순환 (SettingsModal, Toolbar, ToolbarWithSettings)
   - 전략: Props 인터페이스를 `shared/types/ui`로 분리, 컴포넌트 합성 패턴 적용
   - 산출물: UI 타입 모듈 신규 생성, 순환 제거 검증
   - 예상 소요: 3일
3. **B-3: Dependency Cruiser 규칙 강화**
   - 타겟: `.dependency-cruiser.cjs` 설정
   - 전략: 순환 의존성 0개 목표로 규칙 강화, 허용 리스트 최소화
   - 산출물: 규칙 업데이트, 신규 순환 유입 방지 가드
   - 예상 소요: 1일

**Acceptance Criteria**:

- [ ] 순환 의존성 2개 → 0개로 해소
- [ ] `npm run deps:check` GREEN (순환 없음 검증)
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN
- [ ] 의존성 그래프 문서 갱신 (`docs/dependency-graph.svg`)

---

## Phase C: 테스트 구조 정비 (예상 2주)

**목표**: 56개 실패 테스트 수정 및 49개 스킵 테스트 재평가하여 품질 게이트
신뢰도 복원

**솔루션 비교**:

- **Option A: 실패 테스트 일괄 수정**
  - 장점: 품질 게이트 즉시 복원, 신규 기능 개발 가능
  - 단점: 근본 원인 해결 없이 임시 조치 가능, 다시 실패할 위험
  - 평가: ✅ **선택** (단기 목표 달성에 적합)
- **Option B: 테스트 인프라 재설계**
  - 장점: 장기적 유지보수성 향상, 테스트 속도 개선 가능
  - 단점: 매우 큰 범위 (2249개 테스트), 높은 리스크
  - 평가: ❌ 제외 (과도한 리스크)

**Phase C 작업 항목**:

1. **C-1: 실패 테스트 원인 분석**
   - 타겟: 56개 실패 테스트
   - 전략: 실패 패턴별로 분류 (Stage D RED 가드, 환경 제약, API 변경 등)
   - 산출물: 실패 원인 분석 리포트
   - 예상 소요: 2일
2. **C-2: Stage D RED 가드 업데이트**
   - 타겟: Preact 제거 관련 RED 테스트 (~20개 예상)
   - 전략: Epic FRAME-ALT-001 Stage D 완료 사실 반영, 기대값 조정
   - 산출물: RED 가드 테스트 GREEN 전환
   - 예상 소요: 3일
3. **C-3: 환경 제약 테스트 재평가**
   - 타겟: JSDOM/SolidJS 한계로 실패하는 테스트 (~15개 예상)
   - 전략: skip 처리 또는 환경 감지 로직 추가
   - 산출물: 환경 제약 문서화, 테스트 정리
   - 예상 소요: 2일
4. **C-4: API 변경 테스트 수정**
   - 타겟: Epic 완료 후 API 변경으로 실패한 테스트 (~21개 예상)
   - 전략: 신규 API에 맞춰 테스트 업데이트
   - 산출물: 테스트 수정, GREEN 전환
   - 예상 소요: 3일
5. **C-5: 스킵 테스트 재활성화 검토**
   - 타겟: 49개 스킵 테스트
   - 전략: 스킵 사유 재검토, 재활성화 가능 항목 선별
   - 산출물: 스킵 테스트 재활성화 또는 제거 결정
   - 예상 소요: 2일

**Acceptance Criteria**:

- [ ] 실패 테스트 56개 → 10개 이하로 감소
- [ ] 스킵 테스트 49개 → 30개 이하로 감소 (재활성화 또는 제거)
- [ ] 품질 게이트: `npm test` GREEN (2200+ passed)
- [ ] 실패/스킵 테스트 사유가 문서화됨

---

## Phase D: 벤더 API 단순화 (예상 1주)

**목표**: StaticVendorManager와 MockVendorManager 간 중복 로직 제거, 초기화
복잡도 감소

**솔루션 비교**:

- **Option A: 단일 벤더 관리자 통합**
  - 장점: 초기화 로직 단순화, 유지보수 비용 감소
  - 단점: 테스트 모킹 복잡도 증가 가능, 기존 코드 수정 필요
  - 평가: ⚠️ 보류 (테스트 모킹 영향도 추가 분석 필요)
- **Option B: Facade 패턴 유지 + 정리**
  - 장점: 기존 구조 유지, 낮은 리스크, 점진적 정리 가능
  - 단점: 근본적 개선 아님
  - 평가: ✅ **선택** (안정성 우선)

**Phase D 작업 항목**:

1. **D-1: Preact Legacy Vendor 완전 제거**
   - 타겟: `shared/external/vendors/preact-legacy.ts`
   - 전략: Epic FRAME-ALT-001 Stage D 완료 사실 확인 후 파일 삭제
   - 산출물: preact-legacy.ts 제거, import 경로 정리
   - 예상 소요: 1일
2. **D-2: Vendor API 문서 갱신**
   - 타겟: `docs/vendors-safe-api.md`
   - 전략: Solid 전용 API 기준으로 문서 재작성, 예제 업데이트
   - 산출물: 최신 벤더 API 문서
   - 예상 소요: 1일
3. **D-3: Vendor 초기화 로직 간소화**
   - 타겟: `StaticVendorManager.initialize()` 메서드
   - 전략: 불필요한 검증 단계 제거, TDZ-safe 패턴 유지
   - 산출물: 초기화 로직 정리, 테스트 GREEN 유지
   - 예상 소요: 2일

**Acceptance Criteria**:

- [ ] Preact 관련 벤더 코드 0건
- [ ] Vendor API 문서가 Solid 전용 기준으로 갱신됨
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN
- [ ] 벤더 초기화 시간 측정 (성능 회귀 없음 확인)

---

## Phase E: Epic 후속 정리 (예상 1주)

**목표**: 이전 Epic들(NAMING-001, LEGACY-CLEANUP-001 등)의 미완료 항목 마무리

**Phase E 작업 항목**:

1. **E-1: Epic NAMING-001 Phase C 실행 여부 결정**
   - 타겟: 린트 룰 추가 (boolean 함수 명명 규칙 자동 검증)
   - 전략: ROI 분석 후 실행 또는 백로그 이관 결정
   - 산출물: 결정 문서 또는 린트 룰 구현
   - 예상 소요: 2일
2. **E-2: Epic LEGACY-CLEANUP-001 False Positive 개선**
   - 타겟: `scripts/scan-legacy-patterns.mjs` 스캔 정확도 향상
   - 전략: DOM 속성 `.value`, 일반 객체 속성 구분 필터 추가
   - 산출물: 스캔 도구 개선, 잘못된 감지 0건
   - 예상 소요: 2일
3. **E-3: 완료 Epic 문서 정리**
   - 타겟: `TDD_REFACTORING_PLAN_COMPLETED.md`
   - 전략: 2025-01-01 ~ 2025-10-01 완료 항목 요약, 주요 메트릭 정리
   - 산출물: 완료 Epic 요약 문서
   - 예상 소요: 1일

**Acceptance Criteria**:

- [ ] Epic NAMING-001 Phase C 실행 또는 백로그 이관 결정 완료
- [ ] 레거시 스캔 도구 False Positive 0건
- [ ] 완료 Epic 문서가 최신 상태로 유지됨

---

## 전체 Epic 메트릭 목표

| 지표             | 현재 상태    | 목표 상태   | 개선율 |
| ---------------- | ------------ | ----------- | ------ |
| @deprecated 마커 | 17개         | 5개 이하    | -70%   |
| 순환 의존성      | 2개          | 0개         | -100%  |
| 실패 테스트      | 56개         | 10개 이하   | -82%   |
| 스킵 테스트      | 49개         | 30개 이하   | -39%   |
| 번들 크기        | 440.56 KB    | <450 KB     | 유지   |
| TypeScript 파일  | 256개        | 260개 이하  | +1.6%  |
| 테스트 통과율    | 95.2% (2193) | 98%+ (2160) | +2.8%p |

---

## Epic ARCH-SIMPLIFY-001 실행 계획

- **전체 예상 소요**: 7주
- **Phase 순서**: A → B → C → D → E (순차 실행)
- **주간 체크포인트**: 매주 금요일 진행 상황 검토
- **품질 게이트**: 각 Phase 완료 시 typecheck/lint/test ALL GREEN 필수

**후속 후보 Epic**:

- CSS-OPTIMIZATION: CSS 번들 최적화 (70 KiB → 60 KiB 목표)
- E2E 테스트 인프라 구축: Playwright 기반 사용자 시나리오 테스트
- PERF-OPTIMIZATION: 갤러리 렌더링 성능 개선 (LCP/FID 최적화)

---

---

## TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

**품질 게이트 (각 Phase별)**:

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint:fix` / `npm run format` — 자동 수정 적용
- 테스트: `npm test` — 해당 Phase 테스트 GREEN
- 빌드: `npm run build:dev` — 산출물 검증 통과

---

## 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
