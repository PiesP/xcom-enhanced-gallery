# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-04 — Epic FFLATE-DEPRECATED-API-REMOVAL 완료

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

### Epic: CODEQL-LOCAL-ENHANCEMENT (MEDIUM Priority - 진행 중)

**식별자**: CODEQL-LOCAL-ENHANCEMENT **목표**: 로컬 CodeQL 워크플로 개선
(Fallback 쿼리 팩 활용) **승격일**: 2025-10-04 **예상 난이도**: S (외부 의존성
없음, 기존 스크립트 개선)

**배경**:

- Epic CODEQL-STANDARD-QUERY-PACKS (2025-10-04 부분 완료) 후속 작업
- GitHub Advanced Security 라이선스 없이도 로컬 CodeQL 활용 가능하도록 개선
- Fallback 쿼리 팩(`codeql/javascript-queries`)으로 50+ 기본 보안 규칙 적용

**작업 범위**:

#### Task 1: 로컬 스캔 스크립트 개선

- `scripts/run-codeql.mjs` 개선
  - Fallback 쿼리 팩 명시적 사용
  - 스캔 결과 상세 로깅 (쿼리 팩 종류, 규칙 수, SARIF 통계)
  - 에러 처리 개선 (표준 쿼리 팩 실패 시 graceful fallback)

#### Task 2: 테스트 조건부 수정

- Advanced Security 감지 함수 구현 (`hasAdvancedSecurity()`)
- `test/architecture/codeql-standard-packs.contract.test.ts` 개선
  - 감지 시: 엄격 모드 (400+ js/ 규칙 요구) - 기존 테스트 유지
  - 미감지 시: relaxed 모드 (Fallback 쿼리 팩 허용) - 새 테스트 추가
- 조건부 검증으로 로컬/CI 환경 자동 대응

#### Task 3: 문서화 강화

- 로컬 CodeQL 활용 가이드 작성 (`docs/CODEQL_LOCAL_GUIDE.md`)
  - 쿼리 팩 차이 설명 (표준 vs Fallback)
  - 로컬 스캔 명령어 사용법
  - SARIF 결과 해석 가이드
- `AGENTS.md` 업데이트: CodeQL 분석 섹션 확장
- `ARCHITECTURE.md` 업데이트: 보안 테스트 전략 추가

**Acceptance Criteria**:

- ✅ Task 1: `npm run codeql:scan` 실행 시 Fallback 쿼리 팩 명시적 사용, 상세
  로깅 출력
- ✅ Task 2: `hasAdvancedSecurity()` 함수 구현, 조건부 테스트 GREEN (로컬/CI
  자동 대응)
- ✅ Task 3: `docs/CODEQL_LOCAL_GUIDE.md` 작성, `AGENTS.md`/`ARCHITECTURE.md`
  업데이트
- ✅ 품질 게이트: typecheck, lint, test, build 전체 통과
- ✅ 번들 크기 회귀 없음 (±1 KB 허용 범위)

**Phase 진행 상황**:

- **Phase 1 (RED)**: 준비 중 - 조건부 테스트 작성
- **Phase 2 (GREEN)**: 대기 중 - 최소 구현
- **Phase 3 (REFACTOR)**: 대기 중 - 문서화 강화

---

### 현재 활성 Epic 없음 (이전 상태 - 아카이브)

모든 Epic이 완료되었습니다. 새로운 작업이 필요한 경우
`docs/TDD_REFACTORING_BACKLOG.md`에서 선정하여 승격하세요.

---

**현재 테스트 상태** (2025-10-04):

- Test Files: 1 failed | 420 passed | 18 skipped (439)
- Tests: 3 failed | 2612 passed | 107 skipped | 1 todo (2723)
- 실패 테스트: `test/architecture/codeql-standard-packs.contract.test.ts` (3
  tests)
  - 원인: GitHub Advanced Security 권한 제약 (로컬/CI 공통)
  - 상태: Epic CODEQL-STANDARD-QUERY-PACKS 부분 완료, Backlog HOLD 상태

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
