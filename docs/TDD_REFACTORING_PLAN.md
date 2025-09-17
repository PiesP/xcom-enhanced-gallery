# TDD 리팩토링 활성 계획 (2025-09-17 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 테스트로 고정하며, UI/UX 일관성과 안정성을 높인다. 모든 변경은 실패 테스트 →
> 최소 구현 → 리팩토링 순으로 진행한다.

- 근거 문서: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`
- 환경: Vitest + JSDOM, 기본 URL https://x.com, vendors/userscript는 getter 경유
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, CSS Modules + 디자인 토큰만

---

<!-- 2025-09-17 적용 사항 요약은 완료 로그(TDD_REFACTORING_PLAN_COMPLETED.md)로 이관했습니다. -->

## 남은 작업(우선순위 및 순서)

현재 활성 과제는 없습니다. 완료 이력은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`,
아이디어/후보 작업은 `docs/TDD_REFACTORING_BACKLOG.md`를 참조하세요.

## Phase 4 — 활성 남은 항목만

현재 활성 항목은 없습니다. 상세 이력/완료 내용은 COMPLETED 로그를 참고하세요.
