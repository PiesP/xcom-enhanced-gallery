# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-05 — Epic CODEQL-SECURITY-HARDENING 활성화

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

### Epic CODEQL-LOCAL-ENHANCEMENT: 로컬 CodeQL 워크플로 개선

**승격일**: 2025-10-05 **선정 이유**: CODEQL-SECURITY-HARDENING 완료 후 로컬
개발 경험 향상 필요, 외부 의존성 없이 즉시 착수 가능 (READY 상태)

**목표**: GitHub Advanced Security 활성화 여부와 무관하게 로컬 환경에서 CodeQL을
효과적으로 활용할 수 있도록 워크플로 개선

**배경**:

- 현재: `scripts/run-codeql.mjs`가 Fallback 쿼리 팩 자동 전환 지원
- 문제: 로컬 환경 제약이 명확히 문서화되지 않아 혼란 발생
- 해결: 환경별 명확한 가이드 제공 + 상세 로깅으로 투명성 확보

**솔루션**: 옵션 A - 스크립트 개선 + 문서화

**장점**:

- Phase 1 테스트 이미 완료 (RED → GREEN 즉시 가능)
- 외부 의존성 없음 (GitHub Advanced Security 불필요)
- 기존 기능 유지하면서 점진적 개선
- 팀 전체 로컬 개발 경험 향상

**단점**:

- 표준 쿼리 팩(400+ 규칙) 활성화는 여전히 Advanced Security 필요
- Fallback 쿼리 팩은 제한된 규칙 수 (50+ vs 400+)

**Epic 구조**:

---

#### Phase 1: RED (완료 ✅)

**파일**:

- `test/architecture/codeql-local-enhancement.contract.test.ts` (18 tests)
- `test/utils/codeql-environment.ts` (환경 감지 유틸)

**검증 항목**:

- Task 1: 환경 감지 함수 구현 ✅
  - `hasAdvancedSecurity()`: 표준 쿼리 팩 실행 여부 감지
  - `detectQueryPackType()`: 'standard' | 'fallback' | 'unknown' 반환
  - `getCodeQLEnvironmentInfo()`: 환경 상세 정보 조회
- Task 2: 조건부 SARIF 검증 ✅
  - 환경별 임계값 적용 (표준: 400+ 규칙, Fallback: 50+ 규칙)
  - 테스트 쿼리만 있는 상태 감지
- Task 3: 환경 정보 로깅 ✅
  - 콘솔 출력으로 현재 환경 확인
- Task 4: 개선 계획 조건부 검증 ✅
  - "Hello, world!" 비율 제한 (50% 미만)

**상태**: ✅ 완료 (테스트 작성 완료, 유틸리티 함수 구현 완료)

---

#### Phase 2: GREEN (구현)

**Task 1**: `scripts/run-codeql.mjs` 개선

- [ ] 상세 로깅 강화
  - Fallback 전환 시점 명시적 로깅
  - 쿼리 팩 종류 출력 (표준 vs Fallback)
  - 예상 규칙 수 가이드 제공
- [ ] 에러 메시지 명확화
  - 환경별 가이드 제공 (Advanced Security 필요 여부)
  - 트러블슈팅 힌트 추가
- [ ] 쿼리 팩 통계 로깅 개선
  - SARIF 생성 후 실제 규칙 수 출력
  - js/ 보안 규칙 비율 출력

**Task 2**: 테스트 GREEN 검증

- [ ] 로컬 테스트 실행

  ```pwsh
  npm test -- test/architecture/codeql-local-enhancement.contract.test.ts
  ```

- [ ] 18/18 tests GREEN 확인
- [ ] 환경 정보 콘솔 출력 검증

**Acceptance**:

- ✅ 18/18 tests GREEN
- ✅ 스크립트 로깅 개선 완료
- ✅ 에러 메시지 명확화 완료
- ✅ `npm run typecheck` 통과
- ✅ `npm run lint:fix` 통과

---

#### Phase 3: REFACTOR (문서화 + 폴리싱)

**Task 1**: `docs/CODEQL_LOCAL_GUIDE.md` 작성

- [ ] 로컬 CodeQL 활용 가이드
  - 쿼리 팩 종류 설명 (표준 vs Fallback)
  - 환경별 제약 명확화
  - 트러블슈팅 가이드
- [ ] 실행 예제 제공
  - `npm run codeql:scan` 워크플로
  - 환경 정보 확인 방법
  - SARIF 분석 방법

**Task 2**: `AGENTS.md` 업데이트

- [ ] CodeQL 분석 섹션 강화
  - 로컬 제약 명확화
  - CI 환경과 차이점 설명
  - Fallback 쿼리 팩 설명 추가

**Task 3**: `ARCHITECTURE.md` 업데이트

- [ ] 보안 정책 섹션 강화
  - CodeQL 통합 전략 추가
  - 로컬 vs CI 환경 구분
  - Fallback 쿼리 팩 정책 설명

**Task 4**: 백로그 업데이트

- [ ] `TDD_REFACTORING_BACKLOG.md` 업데이트
  - CODEQL-LOCAL-ENHANCEMENT → COMPLETED로 이동
  - GITHUB-ADVANCED-SECURITY-INTEGRATION HOLD 상태 유지

**Task 5**: 최종 품질 게이트

- [ ] `npm run typecheck` ✅
- [ ] `npm run lint:fix` ✅
- [ ] `npm test` (전체 테스트 GREEN) ✅
- [ ] `npm run build:dev` ✅

**Acceptance**:

- ✅ 문서 3개 작성/업데이트 완료
- ✅ 전체 테스트 GREEN
- ✅ 품질 게이트 통과
- ✅ Epic 완료 로그 작성

---

**예상 결과**:

- 로컬 CodeQL 활용도 향상
- 명확한 제약 이해 (표준 vs Fallback)
- 팀 전체 보안 인식 제고
- GitHub Advanced Security 활성화 시 원활한 전환 기반 마련

**번들 영향**: 없음 (개발 도구만 수정, 런타임 코드 변경 없음)

**의존성**: 없음 (READY 상태)

---

**최근 완료**:

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
