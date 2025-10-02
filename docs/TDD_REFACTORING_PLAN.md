# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-01-13 — Epic THEME-ICON-UNIFY-001 Phase A 완료, Phase
B/C는 별도 Epic으로 백로그 이동

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심

---

## 2. 활성 Epic 현황

### Epic RED-TEST-001: SolidJS Gallery JSDOM URL Constructor Fix

**ID**: RED-TEST-001  
**상태**: 🟡 진행 중 (Phase 1/3)  
**우선순위**: HIGH  
**시작일**: 2025-01-13  
**예상 완료**: 2025-01-15

**배경**: JSDOM 환경에서 `URL is not a constructor` 오류로 8개 Gallery 테스트
파일이 skip 처리됨. CI 차단 해소 및 테스트 환경 안정화를 위해 최우선 해결 필요.

**목표**:

- [ ] Phase 1: JSDOM URL 폴리필 추가 또는 URL 사용 회피 방안 분석 (0.5일)
- [ ] Phase 2: URL Constructor 문제 해결 및 테스트 환경 수정 (1일)
- [ ] Phase 3: 8개 skip된 테스트 파일 GREEN 전환 검증 (0.5일)

**영향 범위**:

- Gallery/Toolbar 접근성 테스트
- DOM 정리 테스트
- Wheel 이벤트 테스트
- Shadow DOM 격리 테스트

**Acceptance Criteria**:

- ✅ JSDOM 환경에서 URL Constructor 정상 동작
- ✅ 8개 Gallery 테스트 파일 모두 GREEN 상태
- ✅ `npm test` 전체 통과 (skip 0개)
- ✅ `npm run build:dev` 검증 통과

**예상 난이도**: M (Medium)  
**예상 소요**: 1-2 days

---

## 3. TDD 워크플로

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

## 4. 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
| 벤더 API    | `docs/vendors-safe-api.md`               |
