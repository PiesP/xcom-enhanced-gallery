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

## 과제 A — 키보드 입력 중앙화 정렬(KBD-NAV-UNIFY-02)

문제

- 일부 유틸이 container/document 단위로 keydown을 직접 바인딩. 정책상 허용
  범위이나, 갤러리 네비게이션/ESC 등 핵심 키 입력은 중앙
  서비스(`KeyboardNavigator`)로 일원화해야 관리·테스트 용이.

해결 옵션

1. 그대로 유지하며 문서만 보강
   - 장점: 변경 최소
   - 단점: 키 정책 분산 지속, 테스트 난이도↑
2. KeyboardNavigator를 확장(채널/스코프 추가)하고, 갤러리 관련 키는 서비스
   구독으로 일원화
   - 장점: 테스트/모킹 용이, 충돌·중복 방지, 휠락 정책과 결합 용이
   - 단점: 일부 유틸 호출부 교체 필요, 마이그레이션 비용

선택: 2)

TDD 단계

- RED: `test/unit/lint/keyboard-listener.centralization.policy.test.ts`
  - 문구: 컴포넌트/feature 레이어에서 document/window keydown 직접 등록
    금지(예외: 표준 유틸 내부)
  - KeyboardNavigator 사용 시 GREEN
- 구현: KeyboardNavigator에 구독 API 보강(onEscape/onArrow/onSpace, scope 옵션)
- 리팩토링: 갤러리 키 입력은 서비스 구독으로 교체, 유틸은 내부 캡처 이벤트 사용
  유지

수용 기준

- 갤러리 키 네비게이션 경로가 KeyboardNavigator 구독을 통해서만 작동
- 문서화: `CODING_GUIDELINES.md` 키보드 섹션에 스코프/구독 패턴 예시 추가

리스크/롤백

- 리스크: 일부 포커스 컨텍스트에서 기본 스크롤 충돌 가능 → scope 조건/예외
  테이블로 커버
- 롤백: 특정 화면만 기존 유틸 유지 허용(가드 테스트 allowlist)

---

## 과제 B — 배럴/재노출 표면 축소(BARREL-SURFACE-TRIM-01)

문제

- `shared/utils/**`에 와일드카드 재노출(`export *`)과 광범위 배럴이 존재 →
  불필요한 표면/순환 위험 증가, 트리쉐이킹 저해 가능

해결 옵션

1. 유지 + 의존성 그래프 가드만 추가
   - 장점: 변경 최소
   - 단점: 표면 축소 효과 제한
2. utils/performance/media 등 핵심 배럴은 명시적 export로 전환하고, 내부 전용은
   비노출
   - 장점: 순환 위험/표면 감소, API 명확성↑
   - 단점: import 경로 일부 수정 필요

선택: 2)

TDD 단계

- RED: `test/unit/lint/barrel-surface.used-only.scan.red.test.ts`
  - 규칙: 배럴은 외부 사용 심볼만 재노출(미사용 재노출 시 RED)
- 구현: index.ts에서 export \* 제거, 사용 심볼만 명시 export
- 리팩토링: 소비자 import를 필요한 경로로 정리

수용 기준

- dependency-cruiser 순환 경고(해당 영역) 0
- 배럴 사용처 빌드/테스트 GREEN, dead export 스캔 0

리스크/롤백

- 리스크: 광범위 경로 변경에 따른 리팩터 타이포
- 롤백: 단계적 적용(폴더 단위), CI에서 스코프별 실행(projects)

---

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

## 과제 D — Toast UI/상태 경계 강화(TOAST-BOUNDARY-02)

문제

- Toast는 `UnifiedToastManager`(단일 소스)로 관리해야 함. UI 배럴에서 상태성 API
  재노출/로컬 상태 보유 금지 가드 강화 필요

해결 옵션

1. 현행 유지
2. 두 가지 가드 테스트 추가(UI 배럴 상태성 export 금지, 로컬 상태 금지)

선택: 2)

TDD 단계

- RED-1: `test/unit/lint/toast-ui-barrel.stateful-exports.guard.test.ts`
- RED-2: `test/unit/lint/toast-ui-components.no-local-state.guard.test.ts`
- 구현: 없음(정책 가드), 필요 시 배럴/컴포넌트 정리

수용 기준

- UI 배럴에서 상태성 심볼 재노출 0, 컴포넌트 내 로컬 Toast 상태/함수 정의 0

리스크/롤백

- 낮음(가드 중심)

---

## 과제 E — 파일명 정책 가드 강화(FILENAME-POLICY-02)

문제

- 파일명은 `FilenameService`/동등 헬퍼로만 생성. 산발적 문자열 조합 회귀를
  테스트로 차단 필요

해결 옵션

1. 문서화만
2. 정적 스캔 + 단위 테스트로 가드 강화

선택: 2)

TDD 단계

- RED-Scan: `test/unit/lint/filename.ad-hoc-construction.scan.red.test.ts`
  - 규칙: `.zip|.jpg|.png` 등 suffix 조합 문자열로 직접 생성 금지(허용: 서비스
    내부)
- GREEN: 해당 없음(회귀 방지)

수용 기준

- 소스 전반 ad-hoc 파일명 조합 0

리스크/롤백

- 낮음

---

## 과제 F — 벤더 API 직접 접근 금지 가드(VENDOR-GETTER-GUARD-02)

문제

- 현재 직접 import 위반은 External 내부에 한정. 향후 회귀 방지 위해 가드 보강
  필요

해결 옵션

1. 유지
2. 정적 스캔 가드 추가(preact/@preact/signals/fflate/compat 직접 import 금지;
   예외: External vendors)

선택: 2)

TDD 단계

- RED: `test/unit/lint/direct-imports-source-scan.test.ts` 확장 또는 신규 테스트
  추가
- GREEN: 없음(가드)

수용 기준

- Features/Shared 계층에서 직접 import 0, `@shared/external/vendors` getter만
  사용

리스크/롤백

- 낮음

---

## 과제 G — 배경/색/애니메이션 토큰 가드 보강(STYLE-TOKENS-GUARD-02)

문제

- 현재 코드에는 문제가 없으나, 인라인 스타일 색상/`transition: all` 회귀를
  방지할 테스트 가드 추가 필요

해결 옵션: 테스트 가드 추가

TDD 단계

- RED-1: `test/unit/styles/tsx-inline-colors.guard.test.ts`
- RED-2: `test/unit/styles/injected-css.no-transition-all.guard.test.ts`
- GREEN: 없음(가드)

수용 기준

- TSX 인라인 색상 하드코딩 0, transition: all 0

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

- C(Userscript), F(Vendor), G(Style), H(Wheel)

Phase 2 — 입력 중앙화/표면 축소

- A(Keyboard), B(Barrel)

Phase 3 — 레거시 정리/파일명 가드

- I(Legacy tokens), E(Filename)

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

1. RED 테스트 추가: Userscript GM 직접 사용 금지, Vendor getter 강제, TSX 인라인
   색상/transition: all 금지, wheel 정책
2. KeyboardNavigator 구독 API 확장 및 갤러리 키 입력 경로 전환(최소 diff)
3. utils/performance/media 배럴 표면 축소(명시 export로 전환), 사용처 정리
4. legacy 토큰 사용처 스캔 후 미사용 제거(allowlist와 릴리즈 노트 포함)
5. 파일명 정책 스캔/가드로 회귀 방지

완료된 항목은 즉시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.
