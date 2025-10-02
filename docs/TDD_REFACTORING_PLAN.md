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

### Epic RED-TEST-CONSOLIDATE: Skip된 테스트 검증 및 재활성화

**ID**: RED-TEST-001 (재정의)  
**상태**: 🟡 진행 중 (Phase 1/3)  
**우선순위**: HIGH  
**시작일**: 2025-01-13  
**예상 완료**: 2025-01-15

**배경**: 현재 22개 테스트 파일이 `describe.skip` 상태로 비활성화되어 있음. 실제
실행 결과 많은 테스트가 GREEN 상태임에도 불구하고 skip 처리되어 테스트 커버리지
저하. 각 파일을 검증하여 GREEN 테스트는 재활성화하고, 실제 RED 테스트는 별도
Epic으로 분류 필요.

**목표**:

- [ ] Phase 1: Gallery/접근성 테스트 6개 검증 및 활성화 (0.5일)
  - solid-shell-ui, gallery-renderer-solid-keyboard-help, solid-gallery-shell
  - solid-gallery-shell-wheel, gallery-close-dom-cleanup, gallery-toolbar-parity
- [ ] Phase 2: Service/Toast 테스트 7개 검증 및 분류 (1일)
  - service-diagnostics, bulk-download-progress-toast, test-consolidation
  - toast-system-integration, unified-toast-manager-native 등
- [ ] Phase 3: 기타 테스트 9개 검증 및 정리 (0.5일)
  - Container, Performance, Tooling 관련 테스트

**검증 방법**:

- 각 skip 파일을 개별 실행: `npm test -- <파일경로>`
- GREEN 확인 시: `describe.skip` → `describe` 변경
- RED 발견 시: BACKLOG로 이동 (새 Epic 정의)

**Acceptance Criteria**:

- ✅ GREEN 테스트는 describe.skip 제거하여 활성화
- ✅ RED 테스트는 BACKLOG로 이동 및 Epic 분류
- ✅ skip 파일 수: 22개 → 10개 이하로 감소
- ✅ 전체 테스트 통과율 향상 (375/409 → 380/409 이상)
- ✅ `npm run build:dev` 검증 통과

**예상 난이도**: M (Medium)  
**예상 소요**: 2 days

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
