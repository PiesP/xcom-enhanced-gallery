# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-05 — Epic BUNDLE-SIZE-OPTIMIZATION 활성화

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심
- **Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로 분할하여 단계적
  진행

---

## 2. 활성 Epic 현황

### Epic BUNDLE-SIZE-OPTIMIZATION: 번들 크기 최적화를 통한 사용자 경험 개선

**승격일**: 2025-10-05 **선정 이유**: 최근 완료된 보안/테스트 안정화 Epic 이후
사용자 경험 직접 개선 필요, 외부 의존성 없이 즉시 착수 가능 (READY 상태)

**목표**: Userscript 번들 크기를 472.49 KB → 420 KB 이하 (raw), 117.41 KB → 105
KB 이하 (gzip)로 최적화하여 초기 로딩 시간 단축 및 메모리 사용량 절감

**배경**:

- **현재 상태**:
  - Raw 크기: 472.49 KB (BUNDLE_SIZE_LIMIT: 550 KB, 여유 77.51 KB)
  - Gzip 크기: 117.41 KB (WARN_BUDGET: 120 KB, 거의 임계치)
  - 의존성: 2개 orphan 파일 (visible-navigation.ts, solid-jsx-dev-runtime.ts)
  - 최근 Epic들로 보안/테스트는 안정화 완료, 성능 최적화 단계로 진입 적기

- **문제점**:
  - Gzip 크기가 경고 임계치(120 KB)에 근접하여 향후 기능 추가 시 초과 위험
  - 사용자 초기 로딩 시간 개선 여지 (10-15% 크기 감소 시 체감 가능)
  - Orphan 파일 존재로 불필요한 코드 포함 가능성

- **해결 방향**:
  - Tree-shaking 개선 (dead code 제거)
  - 중복 코드 통합
  - Orphan 파일 해결 (사용 또는 제거)
  - Vite 빌드 설정 최적화

**솔루션 비교**:

#### 옵션 A: 점진적 최적화 (Tree-shaking + 중복 제거 + Orphan 해결)

**장점**:

- 단계적 적용으로 리스크 최소화
- 각 단계별 효과 측정 가능
- 기존 기능 영향 없음 (순수 최적화)
- TDD 적용 용이 (번들 크기 가드 테스트)
- 외부 의존성 없음 (즉시 착수 가능)

**단점**:

- 목표 달성까지 여러 단계 필요
- 효과가 점진적 (단계당 3-5% 개선 예상)

**예상 효과**:

- Phase 1 (Tree-shaking): -3% (~14 KB)
- Phase 2 (중복 제거): -4% (~19 KB)
- Phase 3 (Orphan 해결): -2% (~9 KB)
- Phase 4 (빌드 최적화): -2% (~9 KB)
- **총합**: -11% (~52 KB raw, ~12 KB gzip)

#### 옵션 B: 공격적 최적화 (Code Splitting + Lazy Loading)

**장점**:

- 큰 폭의 크기 감소 가능 (15-20%)
- 런타임 성능 개선 (필요한 코드만 로드)

**단점**:

- Userscript 환경에서 동적 로딩 제약 (inlineDynamicImports: true)
- 구현 복잡도 높음 (H 난이도)
- 테스트 범위 확대 (동적 로딩 시나리오)
- 번들 캐싱 전략 필요
- 리스크 높음 (기존 기능 영향 가능)

**예상 효과**:

- 초기 번들: -15% (~71 KB)
- 런타임 로딩 지연 발생 가능

#### 옵션 C: 의존성 교체 (경량 라이브러리로 전환)

**장점**:

- 큰 폭의 크기 감소 가능
- 번들 단순화

**단점**:

- 기존 기능 영향 큼 (HIGH 리스크)
- 마이그레이션 비용 높음
- SolidJS 생태계 이탈 위험
- 테스트 재작성 필요

**예상 효과**:

- 불확실 (라이브러리별 차이 큼)

**선택**: **옵션 A** (점진적 최적화)

**선정 이유**:

1. **리스크 최소화**: 기존 기능 영향 없이 순수 최적화만 진행
2. **측정 가능**: 각 단계별 효과를 명확히 측정하고 검증
3. **즉시 착수**: 외부 의존성 없이 즉시 시작 가능
4. **TDD 적용**: 번들 크기 가드 테스트로 회귀 방지
5. **실용적 목표**: 11% 감소로 Gzip 경고 임계치 여유 확보 (117 KB → 105 KB)
6. **확장성**: 필요 시 옵션 B/C로 확장 가능한 기반 마련

---

### Epic 구조

#### Phase 1: RED — 번들 크기 가드 테스트 작성

**목표**: 번들 크기 회귀 방지 테스트 및 최적화 기준점 설정

**파일**:

- `test/architecture/bundle-size-optimization.contract.test.ts` (신규, 12-15
  tests)
- `test/architecture/dependency-orphan-resolution.test.ts` (보강)

**검증 항목**:

**Task 1**: 번들 크기 상한선 테스트 (3 tests)

- Raw 크기 ≤ 420 KB (현재 472 KB, 목표 11% 감소)
- Gzip 크기 ≤ 105 KB (현재 117 KB, 목표 10% 감소)
- Brotli 크기 추가 검증 (참고용)

**Task 2**: Tree-shaking 효율성 테스트 (4 tests)

- Dead code 탐지 (미사용 export 함수 감지)
- Side-effect 없는 pure 함수 검증
- 동적 import 패턴 검증 (Userscript 제약)
- Re-export 체인 깊이 제한 (≤3 depth)

**Task 3**: 중복 코드 탐지 테스트 (3 tests)

- 동일 로직 중복 함수 탐지 (유사도 ≥85%)
- 중복 유틸리티 통합 검증
- 중복 타입 정의 제거 검증

**Task 4**: Orphan 파일 해결 테스트 (2-3 tests)

- `visible-navigation.ts` 사용처 검증 또는 제거
- `solid-jsx-dev-runtime.ts` 필요성 검증
- 의존성 그래프 orphan 0개 달성

**Task 5**: 빌드 설정 검증 테스트 (2-3 tests)

- Vite minification 설정 최적화
- Terser 옵션 검증 (unsafe 옵션 안전성)
- CSS 최적화 검증 (미사용 선택자 제거)

**Acceptance**:

- ✅ 12-15 tests RED (목표 미달 상태)
- ✅ `npm run typecheck` 통과
- ✅ `npm run lint:fix` 통과

---

#### Phase 2: GREEN — 점진적 최적화 구현

**Task 1**: Tree-shaking 개선 (예상 효과: -3%, ~14 KB raw)

- Dead code 제거 (미사용 export 함수)
- Side-effect 명시 (package.json sideEffects)
- Pure 함수 annotation 추가 (/_#**PURE**_/)
- Re-export 체인 단순화

**Task 2**: 중복 코드 통합 (예상 효과: -4%, ~19 KB raw)

- 중복 유틸리티 함수 통합
- 중복 타입 정의 제거
- 공통 로직 추출 (DRY 원칙)

**Task 3**: Orphan 파일 해결 (예상 효과: -2%, ~9 KB raw)

- `visible-navigation.ts` 활용 또는 제거
- `solid-jsx-dev-runtime.ts` 검증 및 처리
- 의존성 그래프 정리

**Task 4**: 빌드 설정 최적화 (예상 효과: -2%, ~9 KB raw)

- Vite minification 강화 (mangleProps, pure_funcs)
- Terser unsafe 옵션 검증 후 적용
- CSS 최적화 (PurgeCSS 또는 미사용 선택자 제거)
- 소스맵 크기 최적화 (names 제거)

**Task 5**: 테스트 GREEN 검증

- 12-15 tests GREEN 확인
- 번들 크기 목표 달성 확인 (≤420 KB raw, ≤105 KB gzip)
- 기존 2664개 테스트 모두 GREEN 유지

**Acceptance**:

- ✅ 12-15 tests GREEN
- ✅ Raw 크기: 472 KB → ≤420 KB (11% 감소)
- ✅ Gzip 크기: 117 KB → ≤105 KB (10% 감소)
- ✅ 전체 테스트 2664개 모두 GREEN
- ✅ 기능 영향 없음 (회귀 테스트 통과)
- ✅ `npm run typecheck` 통과
- ✅ `npm run lint:fix` 통과
- ✅ `npm run build:dev` / `npm run build:prod` 통과

---

#### Phase 3: REFACTOR — 문서화 + 모니터링

**Task 1**: 문서 업데이트

- `docs/ARCHITECTURE.md` 번들 최적화 전략 섹션 추가
- `docs/CODING_GUIDELINES.md` 번들 크기 가이드라인 추가
- `AGENTS.md` 번들 크기 검증 명령어 추가

**Task 2**: 모니터링 개선

- `scripts/build-metrics.js` 강화 (단계별 크기 추적)
- CI에서 번들 크기 자동 리포트
- PR 코멘트에 번들 크기 변화 표시

**Task 3**: 백로그 업데이트

- `TDD_REFACTORING_BACKLOG.md` 업데이트
- 향후 최적화 기회 문서화 (옵션 B/C 참고)

**Task 4**: 최종 품질 게이트

- ✅ `npm run typecheck`
- ✅ `npm run lint:fix`
- ✅ `npm test` (전체 테스트 GREEN)
- ✅ `npm run build` (dev + prod 모두 성공)
- ✅ 번들 크기 검증 (목표 달성 확인)

**Acceptance**:

- ✅ 문서 3개 업데이트 완료
- ✅ 모니터링 스크립트 개선
- ✅ 전체 품질 게이트 통과
- ✅ Epic 완료 로그 작성

---

**예상 결과**:

- **번들 크기**: 472.49 KB → 420 KB 이하 (11% 감소, 52 KB 절감)
- **Gzip 크기**: 117.41 KB → 105 KB 이하 (10% 감소, 12 KB 절감)
- **사용자 경험**: 초기 로딩 시간 10-15% 단축 (네트워크 환경 따라 체감)
- **메모리**: 런타임 메모리 사용량 약간 감소 (미사용 코드 제거)
- **개발 경험**: 빌드 시간 단축 (Tree-shaking 효율 향상)
- **향후 확장**: Gzip 경고 임계치 여유 확보 (15 KB)

**번들 영향**: -11% raw, -10% gzip (긍정적 영향)

**의존성**: 없음 (READY 상태, 즉시 착수 가능)

**리스크**: LOW (순수 최적화, 기능 영향 없음, TDD로 회귀 방지)

---

현재 활성 Epic 없음. 다음 Epic은 `docs/TDD_REFACTORING_BACKLOG.md`에서
우선순위를 고려하여 선정하세요.

---

**최근 완료**:

- 2025-10-05: **Epic CODEQL-LOCAL-ENHANCEMENT** ✅
  - 로컬 CodeQL 워크플로 개선 (Phase 2-3 완료)
  - 스크립트 로깅 강화 + 1,010줄 가이드 문서 작성
  - 15개 테스트 GREEN, 번들 영향 없음
  - 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조
- 2025-10-05: **Epic CODEQL-SECURITY-HARDENING** ✅
  - CodeQL 보안 경고 5건 해결 (URL Sanitization 4건, Prototype Pollution 1건)
  - 3-Phase TDD 완료 (RED → GREEN → REFACTOR)
  - 18개 보안 계약 테스트 + 2664개 전체 테스트 GREEN
  - 번들 크기 변화 없음 (472.49 KB)
  - 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 3. 최근 완료 Epic (요약)

최근 완료된 Epic들은 모두 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로
이관되었습니다.

**주요 Epic (2025-01-09 ~ 2025-10-04)**:

- **FFLATE-DEPRECATED-API-REMOVAL** (2025-10-04): deprecated fflate API 완전
  제거 ✅
  - Breaking Change: `getFflate()` API 제거
  - Phase 1-3 완료, 16/16 contract tests PASS
  - 15 files changed (1 deleted, 14 modified)
- **TEST-FAILURE-ALIGNMENT-PHASE2** (2025-01-09): 29/29 tests GREEN ✅
  - Signal Native pattern, Toolbar CSS, Settings/Language, Integration 테스트
    정렬
- **TEST-FAILURE-FIX-REMAINING** (2025-10-04): 테스트 실패 38→29개 개선 ✅
  - Bundle budget, Tooltip 타임아웃, Hardcoded values, LanguageService 싱글톤
- **CODEQL-STANDARD-QUERY-PACKS** (2025-10-04): 부분 완료 ⚠️
  - 로컬/CI CodeQL 권한 제약으로 Backlog HOLD 상태

**이전 Epic (2025-01-04 ~ 2025-01-08)**:

- CUSTOM-TOOLTIP-COMPONENT, UI-TEXT-ICON-OPTIMIZATION, JSX-PRAGMA-CLEANUP,
  GALLERY-NAV-ENHANCEMENT, SOLIDJS-REACTIVE-ROOT-CONTEXT 등

전체 상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

---

## 4. TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Rename**: `.red.` 파일명 제거 → 가드 전환
5. **Document**: Completed 로그에 1줄 요약

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build:dev` (산출물 검증 통과)

---

## 5. 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
| 벤더 API    | `docs/vendors-safe-api.md`               |
