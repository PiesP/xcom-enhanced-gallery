# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

**최근 업데이트**: 2025-10-01 — Epic UX-001 전체 완료 (Phase A/B/C/D/E)

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 “활성 Epic/작업”과 해당 Acceptance에만 집중합니다.

---

## 활성 Epic 현황

### Epic: UX-001 — 갤러리 사용자 경험 개선 ✅ **완료**

**목표**: 갤러리 기동 및 상호작용 시 발생하는 5가지 핵심 UX 문제 해결

**현 상태**: 전체 완료 (2025-10-01)

**메트릭 현황** (2025-10-01):

- 번들 크기: 444.46 KB raw, 112.35 KB gzip (550KB 예산 내) ✅
- 테스트: 2088 passed | 50 skipped | 1 todo ✅
- 품질 게이트: typecheck/lint/format/build **ALL GREEN** ✅

**완료된 문제**:

- ✅ 문제 1: 툴바 아이콘 렌더링 지연 (Phase A 완료)
- ✅ 문제 2: 툴바 자동 숨김 미작동 (Phase B 완료)
- ✅ 문제 3: 갤러리 스크롤 비활성 (Phase C 완료)
- ✅ 문제 4: DOM 구조 복잡도 (Phase D 완료)
- ✅ 문제 5: 설정 모달 활성 시 툴바 유지 (Phase E 완료)

**세부 내역**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 다음 사이클 준비

- 신규 Epic 제안은 백로그에 초안 등록 후 합의되면 본 문서의 활성 Epic으로
  승격합니다.
- Epic UX-001 완료 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

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
