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

스캔 결과(코드 grep/정책 키워드 기준):

- 직접 벤더 import: External
  내부(`shared/external/vendors/vendor-manager-static.ts`)에서만 발견 — External
  계층에 한해 합당
- 터치/포인터 이벤트: 사용 없음(OK)
- transition: all 사용: 소스 내 사용 없음(주석 가이드만 존재)
- TSX 인라인 색상 하드코딩: 직접 사용 정황 없음(OK). 유틸리티 내 rgb/oklch
  문자열은 계산/문서 예제 맥락
- AppContainer: features 런타임 금지, type-only import만 존재(OK)
- GM\_\* 직접 사용: 타입 선언만 존재, 실제 사용처 없음(OK) — 가드 테스트 추가
  가치 높음
- 배럴/재exports: shared/utils 다수 배럴과 와일드카드 재노출 존재 — 표면 축소
  여지 있음
- 키보드/휠: 공용 유틸과 focusTrap, wheel 유틸 존재 — “중앙 집중 가이드”와 실제
  사용 간 일치성 보강 여지

요약: 치명 위반은 없으나, “가드 강화 + 표면 축소 + 접근 경로 표준화”로 품질을
끌어올릴 수 있는 영역이 여러 개 존재.

---

<!-- 과제 A/B/D/E/F/G는 완료되어 완료 로그로 이관되었습니다. 활성 계획에서는 제거합니다. -->

## 과제 C — GM\_\* 직접 사용 금지 가드(USERSCRIPT-ADAPTER-GUARD-01)

문제

- 현재 직접 사용 정황은 없으나, 회귀 방지를 위해 GM\_\* 직접 참조를 금지하고
  adapter 사용만 허용하는 테스트 가드 필요

해결 옵션

1. 문서화만
2. 정적 스캔 테스트로 가드

선택: 2)

TDD 단계

- RED: `test/unit/lint/userscript-gm.direct-usage.scan.red.test.ts`
  - 규칙: `GM_` 접두 식별자 직접 사용 금지(예외: 타입 선언/adapter 내부)
- 구현 없음(정책 가드)

수용 기준

- 전체 소스에서 GM\_\* 직접 사용 0, adapter(getUserscript) 경유만 존재

리스크/롤백

- 낮음(가드만 추가)

---

## 과제 H — 휠 락(policy) 일관성 가드(WHEEL-LOCK-POLICY-01)

문제

- `ensureWheelLock` 유틸 존재. 갤러리/오버레이에서 일관되게 이를 통하도록 가드
  필요

해결 옵션

1. 문서화만
2. 정적 스캔 + 소규모 통합 테스트로 보강

선택: 2)

TDD 단계

- RED-Scan: `test/unit/lint/wheel-listener.policy.red.test.ts` — 직접 wheel 등록
  금지(허용: 유틸 내부)
- RED-Contract: `test/unit/utils/ensureWheelLock.contract.test.ts`
- GREEN: 기존 소비자가 유틸 사용

수용 기준

- 직접 wheel 등록(컴포넌트/feature) 0, 유틸 계약 테스트 GREEN

---

## 과제 I — 레거시 토큰 단계적 정리(LEGACY-TOKENS-PRUNE-01)

문제

- 디자인 토큰 파일에 legacy alias/호환 섹션 다수. 실제 사용처가 줄었다면
  단계적으로 제거해 번들 크기/표면 축소

해결 옵션

1. 유지, 사용처만 모니터링
2. 사용처 스캔 → 미사용만 제거(단계적)

선택: 2)

TDD 단계

- RED: `test/unit/styles/design-tokens.usage-scan.red.test.ts` — 선언됐으나 전역
  미사용 토큰 RED(allowlist 지원)
- 구현: 미사용 legacy 토큰 제거

수용 기준

- 미사용 legacy 토큰 0(allowlist 제외), CSS 빌드 GREEN

리스크/롤백

- 리스크: 외부 소비(주입 CSS 등) 오탑재 → allowlist로 관리, 릴리즈 노트 명시

---

## 실행 순서(권장)와 마일스톤

Phase 1 — 정책 가드 추가(회귀 방지 중심)

- C(Userscript GM\_\*), H(Wheel lock)

Phase 2 — 레거시 정리

- I(Legacy tokens)

각 Phase 완료 기준(DoD)

- RED→GREEN 흐름, 빌드/린트/타입 체크/스모크 테스트 PASS
- dependency-cruiser 순환 0(해당 영역), 번들 검증 스크립트(WARN/FAIL 한도) PASS
- 문서 반영(가이드/아키텍처 섹션 업데이트가 있는 경우)

---

## 품질 게이트 체크(문서 계획 단계)

- Build: N/A(문서 변경)
- Lint/Typecheck: N/A
- Tests: N/A — 이후 각 과제 진행 시 RED 테스트부터 추가 예정

요구사항 커버리지

- 정책 가드 강화(벤더/Userscript/스타일/입력/휠락): 계획에 반영됨
- 충돌/중복/분산·레거시 축소: 배럴 표면 축소, legacy 토큰 정리 포함
- 명명/UX 개선: 파일명 정책 가드, 키 입력 일관성으로 UX 안정성 향상

---

## 위험/의존성/롤백 전략

- 위험: 광범위 배럴 수정 시 경로 변경 리스크 → Phase/폴더 단위 진행 + CI project
  분할 실행
- 의존성: KeyboardNavigator 확장에 따른 소비자 수정 최소화(구독 API 호환 유지)
- 롤백: 테스트 allowlist/폴더 스코프 단위로 부분 롤백 가능하도록 구성

---

## 다음 액션(착수 순서 제안)

1. RED 테스트 추가: Userscript GM 직접 사용 금지(C), wheel 정책(H)
2. legacy 토큰 사용처 스캔 후 미사용 제거(allowlist와 릴리즈 노트 포함)(I)

완료된 항목은 즉시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.
