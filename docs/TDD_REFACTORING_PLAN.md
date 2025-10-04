# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-04 — 테스트 현황 정리 (3 failed, 2612 passed, CodeQL
권한 제약)

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

### Epic FFLATE-DEPRECATED-API-REMOVAL

**시작일**: 2025-10-04 **유형**: 코드 정리 (Code Cleanup) **브랜치**:
`refactor/fflate-deprecated-removal`

#### 목표

`fflate` 패키지 제거 후 남은 deprecated API stub과 테스트 모킹 코드를 완전히
제거하여 코드베이스 정리 및 유지보수성 향상.

#### 배경

- **현재 상태**:
  - `fflate` 패키지는 Epic REF-LITE-V3에서 제거됨 (StoreZipWriter로 대체)
  - deprecated API stub (`getFflate()`, `createDeprecatedFflateApi()`) 존재
  - 테스트 모킹 코드에서 여전히 fflate 참조 유지
- **문제점**:
  - 사용되지 않는 deprecated 코드가 유지보수 부담 증가
  - 테스트 모킹이 실제 구현과 불일치
  - 신규 개발자 혼란 가능성 (fflate가 제거되었지만 코드에 여전히 존재)

#### 범위

**Phase 1 (RED)**: 실패하는 테스트 작성

- `test/architecture/fflate-removal.contract.test.ts` 생성
  - `getFflate()` 함수가 존재하지 않아야 함
  - `fflate-deprecated.ts` 파일이 존재하지 않아야 함
  - `vendor-manager-static.ts`에 `deprecatedFflateApi` 속성 없어야 함
  - 테스트 모킹 파일에 `createMockFflate()` 없어야 함
  - `LICENSES/fflate-MIT.txt` 파일 존재 (라이선스 보존)

**Phase 2 (GREEN)**: 최소 구현으로 테스트 통과

- `src/shared/external/vendors/fflate-deprecated.ts` 삭제
- `src/shared/external/vendors/vendor-manager-static.ts` 정리
  - `createDeprecatedFflateApi`, `warnFflateDeprecated` import 제거
  - `deprecatedFflateApi` 속성 제거
  - `getFflate()` 메서드 제거
- `src/shared/external/vendors/vendor-api-safe.ts` 정리
  - `getFflateSafe()` 함수 제거
  - deprecated import 제거
- `src/shared/external/vendors/index.ts` export 정리
  - `getFflate` export 제거
- 테스트 모킹 파일 정리
  - `test/utils/mocks/vendor-mocks.ts`: `createMockFflate()` 제거
  - `test/utils/mocks/vendor-mocks-clean.ts`: `createMockFflate()` 제거
  - `test/__mocks__/vendor.mock.ts/js`: `mockFflateAPI` 제거

**Phase 3 (REFACTOR)**: 문서화 및 정리

- `docs/ARCHITECTURE.md` 업데이트: `getFflate()` 제거
- `docs/vendors-safe-api.md` 업데이트: fflate 관련 내용 제거
- 변경 이력 문서화

#### Acceptance Criteria

- ✅ 모든 테스트 GREEN (3 CodeQL 실패 제외)
- ✅ `npm run typecheck` 오류 0
- ✅ `npm run lint:fix` 경고 0
- ✅ `npm run build` 성공 (산출물 검증 통과)
- ✅ `fflate` 관련 deprecated 코드 완전 제거
- ✅ 테스트 모킹 코드 실제 구현과 일치
- ✅ `LICENSES/fflate-MIT.txt` 보존 (기여 인정)

#### 리스크

- **Low**: fflate는 이미 사용되지 않음 (StoreZipWriter로 완전 대체)
- **Low**: deprecated stub 제거만 수행 (기능 변경 없음)
- **Mitigation**: 단계적 TDD 진행, 각 Phase별 품질 게이트 준수

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
