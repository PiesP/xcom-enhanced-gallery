# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

**최근 업데이트**: 2025-10-01 — Epic LEGACY-CLEANUP-001 완료 및 종료

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 "활성 Epic/작업"과 해당 Acceptance에만 집중합니다.

---

## 활성 Epic 현황

**현재 활성 Epic**: 없음

**최근 완료**:

- Epic NAMING-001 Phase A (2025-01-22) - 명명 규칙 스캐너 개발 및 전수 스캔 완료
- Epic LEGACY-CLEANUP-001 (2025-10-01) - 레거시 패턴 정리 완료

**백로그 후보**:

- Epic NAMING-001 Phase B/C: 명명 규칙 리네이밍 실행
  (`TDD_REFACTORING_BACKLOG.md` 참조)
- CSS-OPTIMIZATION: CSS 번들 최적화
- E2E 테스트 인프라 구축

---

## 다음 사이클 준비

- 현재 Epic: **없음** (모든 활성 작업 완료)
- 완료 Epic: NAMING-001 Phase A, LEGACY-CLEANUP-001, SOLID-NATIVE-002, UX-001,
  UX-002 (`TDD_REFACTORING_PLAN_COMPLETED.md` 참조)
- 다음 후보:
  - Epic NAMING-001 Phase B: HIGH priority 46건 리네이밍
  - CSS-OPTIMIZATION: CSS 번들 최적화
  - E2E 테스트 인프라 구축

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
