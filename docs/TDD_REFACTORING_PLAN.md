# TDD 리팩토링 활성 계획 (2025-09-16 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 가드로 고정하며, UI/UX의 일관성과 안정성을 높인다. 모든 변경은 TDD로 수행한다.

- 아키텍처·정책 준수 근거: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
  `docs/DEPENDENCY-GOVERNANCE.md`
- 테스트 환경: Vitest + JSDOM, 기본 URL `https://x.com`, getter/adapter 기반
  모킹
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, 외부 의존성은 getter/adapter로만 접근, CSS Modules + 디자인 토큰만

---

## 활성 과제

현재 활성 과제는 없습니다. 모든 계획 항목이 완료되어 GREEN 상태입니다.

향후 과제 발생 시 본 섹션에 최소 컨텍스트(파일 경로/타입/제약/수용 기준)와 함께
추가합니다.

---

## 리스크/롤백

- 포커스 복원: 특정 브라우저에서의 focus 관리 차이 → feature flag로 단계적
  활성화 가능
- 스캔 테스트: 초기 위양성 발생 시 허용 리스트를 협의·보강
- 파일명 정규화: 소수 edge case에서 시각적 파일명 변화 가능 → 실제 저장 전
  미리보기/로그 확인 옵션 검토

---

## 품질 게이트(변경 후)

- Build: dev/prod Userscript 생성 + postbuild validator(GREEN 유지)
- Lint/Typecheck: `npm run typecheck` · `npm run lint:fix`(변경 범위 한정)
- Tests: fast/unit/styles/performance/refactor 스위트 GREEN, e2e 스모크 1건 통과

---

## 참고

- 모든 새 테스트는 vendor/userscript/DOM 의존을 getter/adapter로 주입 가능하게
  작성합니다.
- PC 전용 이벤트 원칙 유지. CSS는 CSS Modules + 디자인 토큰만 사용.
