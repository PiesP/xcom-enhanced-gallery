# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

**최근 업데이트**: 2025-10-02 — Epic ARCH-SIMPLIFY-001 완료, 신규 Epic 대기

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 "활성 Epic/작업"과 해당 Acceptance에만 집중합니다.

---

## 활성 Epic 현황

현재 활성 Epic이 없습니다. 다음 Epic 후보는 `TDD_REFACTORING_BACKLOG.md`를
참조하세요.

**최근 완료 Epic**:

- **Epic ARCH-SIMPLIFY-001** (2025-10-02 완료): 아키텍처 복잡도 간소화
  - Phase A/B/C/D 모두 완료
  - 세부 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

**후보 Epic** (백로그):

- **CSS-OPTIMIZATION**: CSS 번들 최적화 (94 KiB → 70 KiB 목표)
- **E2E-TESTING**: E2E 테스트 인프라 구축 (Playwright)
- **PERF-OPTIMIZATION**: 갤러리 렌더링 성능 개선 (LCP/FID)
- **EPIC-CLEANUP**: 이전 Epic 미완료 항목 정리
  - NAMING-001 Phase C (boolean 함수 린트 룰)
  - LEGACY-CLEANUP-001 False Positive 개선
  - 완료 Epic 문서 최종 정리

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
