# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-05 — Epic THEME-ICON-UNIFY-002 Phase B 완료 ✅

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

### 현재 활성 Epic 없음

다음 작업은 `docs/TDD_REFACTORING_BACKLOG.md`에서 선정하세요.

---

---

**최근 완료**:

- 2025-10-05: **Epic THEME-ICON-UNIFY-002 Phase B** ✅
  - 아이콘 디자인 일관성 검증 (13/13 tests GREEN)
  - Phase C는 JSDOM 제약으로 SKIP (9/9 tests)
  - Epic 목표 조정: 26/26 → 13/13 + 9 SKIP
  - .red 파일명 제거: icon-design-consistency.test.ts
  - 번들 크기 회귀 없음 (471.67 KB / 117.12 KB)
  - 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조
- 2025-10-05: **Epic BUNDLE-SIZE-OPTIMIZATION** ✅
  - 번들 크기 최적화 및 회귀 방지 (Phase 1-3 완료)
  - 15개 계약 테스트 GREEN (473 KB raw, 118 KB gzip 상한선)
  - 빌드 최적화: sideEffects, Terser 강화, treeshake 강화
  - 문서화: 3개 파일 업데이트 (ARCHITECTURE, CODING_GUIDELINES, AGENTS)
  - 번들: 472.49 KB → 471.67 KB (0.17% 감소)
  - 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조
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
