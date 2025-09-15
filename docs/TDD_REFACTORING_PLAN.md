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

현재 코드베이스는 정책 위반 주요 이슈가 없으며, 활성 과제는 "레거시 토큰 정리"
단일 항목으로 축소되었습니다. 다른 영역의 가드/표면 축소 과제는 완료되어 본 완료
문서로 이관되었습니다.

---

## 과제 I — 레거시 토큰 단계적 정리(LEGACY-TOKENS-PRUNE-01)

문제

- 디자인 토큰 파일에 legacy alias/호환 섹션 다수. 실제 사용처가 줄었다면
  단계적으로 제거해 번들 크기/표면 축소

해결 옵션

1. 유지하며 사용처만 모니터링
2. 사용처 스캔 → 미사용만 제거(단계적)

선택: 2

TDD 단계

- RED: `test/unit/styles/design-tokens.usage-scan.red.test.ts` — 선언됐으나 전역
  미사용 토큰을 식별(allowlist 지원)
- GREEN: 미사용 legacy 토큰 제거(점진), 회귀 시 allowlist로 예외 관리

수용 기준

- 미사용 legacy 토큰 0(allowlist 제외), CSS 빌드 GREEN

리스크/롤백

- 리스크: 외부 소비(주입 CSS 등) 오탑재 → allowlist로 관리, 릴리즈 노트 명시

---

## 실행 순서(권장)와 마일스톤

Phase 1 — 레거시 정리

- I(Legacy tokens)

각 Phase 완료 기준(DoD)

- RED→GREEN 흐름, 빌드/린트/타입 체크/스모크 테스트 PASS
- dependency-cruiser 순환 0(해당 영역), 번들 검증 스크립트(WARN/FAIL 한도) PASS
- 문서 반영(가이드/아키텍처 섹션 업데이트가 있는 경우)

---

## 품질 게이트 체크(문서 계획 단계)

- Build: N/A(문서 변경)
- Lint/Typecheck: N/A
- Tests: N/A — 본 과제 진행 시 RED 테스트부터 추가 예정

요구사항 커버리지

- 정책 가드 강화(벤더/Userscript/스타일/입력/휠락): 계획에 반영됨
- 충돌/중복/분산·레거시 축소: 배럴 표면 축소, legacy 토큰 정리 포함
- 명명/UX 개선: 파일명 정책 가드, 키 입력 일관성으로 UX 안정성 향상

---

## 위험/의존성/롤백 전략

- 위험: 토큰 제거로 인한 외부(injected CSS 등) 의존성 파손 → allowlist로 관리,
  릴리즈 노트에 명시
- 의존성: 스타일 토큰을 소비하는 CSS Modules/유틸 스크립트
- 롤백: allowlist(토큰 키) 단위로 부분 롤백 가능하도록 구성

---

## 다음 액션(착수 순서 제안)

1. legacy 토큰 사용처 스캔 자동화(테스트) 추가 → RED
2. 미사용 토큰 제거(allowlist 적용) → GREEN
3. 릴리즈 노트에 변경 토큰 목록/마이그레이션 안내 추가

완료된 항목은 즉시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.
