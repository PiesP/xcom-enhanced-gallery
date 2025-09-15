# TDD 리팩토링 활성 계획 (2025-09-15 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 가드로 고정하며, UI/UX의 일관성과 안정성을 높인다. 모든 변경은 TDD로 수행한다.

- 아키텍처·정책 준수 근거: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
  `docs/DEPENDENCY-GOVERNANCE.md`
- 테스트 환경: Vitest + JSDOM, 기본 URL `https://x.com`, getter/adapter 기반
  모킹
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, 외부 의존성은 getter/adapter로만 접근, CSS Modules + 디자인 토큰만

---

## 빠른 현황 점검 요약

현재 코드베이스는 정책 위반 주요 이슈가 없으며, 활성 과제는 없습니다. 최근
진행한 레거시 토큰(overlay alias) 정리는 완료되어 본 완료 문서로 이관되었습니다.

---

## 활성 과제 없음

최근 사이클에서 대부분의 구조/가드/표면 정리가 완료되었습니다. 신규 과제 발생 시
본 문서에 추가하고, 완료 시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시
이관합니다.
