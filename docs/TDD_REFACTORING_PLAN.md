# TDD 리팩토링 활성 계획 (2025-09-16 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 테스트로 고정하며, UI/UX 일관성과 안정성을 높인다. 모든 변경은 실패 테스트 →
> 최소 구현 → 리팩토링 순으로 진행한다.

- 근거 문서: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
  `docs/DEPENDENCY-GOVERNANCE.md`
- 환경: Vitest + JSDOM, 기본 URL https://x.com, vendors/userscript는
  getter/adapter로 모킹
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, CSS Modules + 디자인 토큰만

---

## 0) 현재 상태 점검 요약

- 품질 게이트: typecheck, lint, smoke/fast 테스트 모두 GREEN. 빌드 가드는 별도
  실행 시 유지될 것으로 예상됨(포스트빌드 밸리데이터 존재).
- Vendors: 정적 매니저(`StaticVendorManager`) 경유 사용 OK. 다만 테스트 로그에
  “StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.”
  경고가 자주 출력됨(신호 초기화 타이밍 개선 여지).
- PC-only 입력: 금지 이벤트(touch/pointer) 소스 스캔 결과 없음. 키보드 리스너
  중앙 집중 정책 테스트 GREEN.
- 토큰/스타일: 주요 CSS/JS 토큰 정책 테스트 GREEN. 일부 컴포넌트 CSS에서
  `var(--color-*)` 직접 사용이 남아 있으나 허용 범주(테마/기초 색상)로 보이며,
  컴포넌트 섀도 토큰 강화의 여지는 있음.
- 레거시 표면: 동적 VendorManager(`vendor-manager.ts`)는 TEST-ONLY로 남아 있고,
  `features/gallery/createAppContainer.ts` 런타임 스텁이 존재(실행 시 예외). 둘
  다 런타임 접근 금지 테스트/포스트빌드 가드로 보호되나, 소스에서 제거/이전 시
  리스크 감소 가능.

---

<!-- 1) VND-INIT-01 — 완료: COMPLETED 문서로 이동 -->

---

## 2) VND-LEGACY-MOVE-02: 동적 VendorManager/런타임 컨테이너 스텁의 테스트 전용 이전

- 문제 신호: `src/shared/external/vendors/vendor-manager.ts`(TEST-ONLY),
  `src/features/gallery/createAppContainer.ts`(런타임 예외 스텁)가 소스에 남아
  있음. 포스트빌드 가드가 있으나 소스 표면 축소가 더 안전.
- 해결 옵션:
  - A. 현 상태 유지: 가드와 트리셰이킹에 의존. Pros: 변경 최소. Cons: 코드
    검색/오인 사용 위험 지속, 번들 누출 가드에 장기 의존.
  - B. 테스트 폴더로 완전 이전: 테스트 하네스/모킹으로 대체하고 소스에서는 제거.
    Pros: 런타임 표면 축소, 정책 단순화. Cons: 일부 테스트 경로/모듈 해석 조정
    필요.
- 결정: B 선택(점진 이전 → 제거).
- TDD 단계:
  1. RED: “런타임 소스에서 vendor-manager.ts/createAppContainer.ts 모듈을
     import하면 실패해야 한다” 스캔/가드 테스트 강화.
  2. 최소 구현: 테스트 하네스(`test/__mocks__/vendors` 등)로 동적 매니저 대체,
     갤러리 컨테이너 생성 헬퍼는 테스트 유틸로 이동.
  3. 리팩토링: 소스에서 해당 파일 제거 또는 테스트 전용 플래그 주석/빌드 제외
     설정.
- 수용 기준:
  - 소스 트리에서 동적 VendorManager/런타임 컨테이너 스텁이 제거되거나 빌드
    제외.
  - 전체 테스트 GREEN, 포스트빌드 검증에서 'VendorManager' 식별자 미노출 유지.

---

## 3) TOKENS-TOOLBAR-03: Toolbar/ToolbarShell 컴포넌트 섀도 토큰 강화

- 문제 신호: Toolbar 관련 CSS 일부가 `var(--color-*)`(기초/테마 토큰) 직접 사용.
  현재 정책상 허용이지만, 컴포넌트 레이어에서는 섀도 토큰(`--xeg-toolbar-*`)을
  우선 사용하면 테마 교체/리그레션 가드가 용이.
- 해결 옵션:
  - A. 유지: 테마 토큰만 사용. Pros: 단순. Cons: 컴포넌트별 음영/상태 스타일
    일관성 관리 비용.
  - B. 섀도 토큰 도입/보강: Toolbar/Toast/Modal 등 주요 UI에 컴포넌트 섀도
    토큰을 일관 적용. Pros: 커스텀 용이, 회귀 가드 간단. Cons: 토큰 정의/문서화
    작업 필요.
- 결정: B 선택(보강하되 최소 diff, 상위 테마 토큰을 내부에서 재참조).
- TDD 단계:
  1. RED: “ToolbarShell/Toolbar CSS는 배경/보더/hover/active/focus 상태에
     컴포넌트 섀도 토큰을 사용해야 한다” 스캔 테스트 추가.
  2. 최소 구현: `ToolbarShell.module.css`/`Toolbar.module.css`에
     `--xeg-toolbar-*` 섀도 토큰 정의·적용.
  3. 리팩토링: 디자인 토큰 문서/테스트 업데이트(범위: Toolbar 한정).
- 수용 기준:
  - 스캔 테스트 GREEN, 기존 스타일 회귀 없음(시각 회귀 테스트는 스코프 밖이므로
    단위 검증으로 대체).

---

## 4) A11Y-ICON-04: 아이콘 전용 버튼 접근성 정책 강화

- 문제 신호: 현재 아이콘 전용 버튼이 aria-label 미지정 시 경고 로그를 남김. 경고
  수준을 높이고, 기본 라벨 파생 규칙(title/i18n 키 기반)을 표준화하면 접근성
  향상.
- 해결 옵션:
  - A. 현 경고 유지. Pros: 비파괴적. Cons: 일관성 미흡, 누락 가능성.
  - B. 기본 라벨 파생 + 테스트 가드 강화. Pros: a11y 개선. Cons: 일부 컴포넌트
    수정 필요.
- 결정: B 선택.
- TDD 단계:
  1. RED: “iconOnly=true일 때 aria-label이 비어 있으면 테스트 실패” 가드
     추가(컴포넌트/스토리 최소 셋).
  2. 최소 구현: `IconButton/UnifiedButton`에서
     `aria-label ?? title ?? i18n(labelKey)` 우선순위 적용.
  3. 리팩토링: 문서/주석에 정책 명시, 경고 → assert(테스트 환경 한정)로 상향.
- 수용 기준:
  - 관련 테스트 GREEN, 런타임에서 aria-label이 항상 존재.

---

## 5) MEDIA-STRATEGY-05: 미디어 추출/정규화 경로 정리(옵션)

- 문제 신호: 이미지/비디오 경로에 legacy 정규화 브릿지가 공존. 현재 GREEN이나
  전략/팩토리 경계 명료화로 유지보수성 개선 여지.
- 해결 옵션:
  - A. 유지: 현 구조 유지. Pros: 리스크 0. Cons: 전략 경계 추론 비용.
  - B. 추출 Strategy/Factory 경계 명확화 및 normalizer 단일 모듈화. Pros:
    테스트/확장 용이. Cons: 변경 범위 크고 회귀 위험.
- 결정: A 유지, B는 백로그로 보류. 소스 이동/리네임은 후속 PR에서 작은 단위로
  진행.
- TDD 단계(보류):
  - 핵심 리트라이/타임아웃/DOM 폴백 테스트는 유지. 회귀 방지용 리네임/모듈 이동
    시 경로 가드만 추가.
- 수용 기준: N/A(보류 항목, 추후 스코프 축소 후 활성화).

---

## 실행 순서 및 리스크/롤백

1. VND-INIT-01 → 2) VND-LEGACY-MOVE-02 → 3) TOKENS-TOOLBAR-03 → 4) A11Y-ICON-04
   (5는 보류)

- 공통 리스크: 테스트 경로/모킹 조정 필요. 해결: `test/setup.ts`에서 중앙화.
- 롤백 전략: 각 단계는 독립 브랜치/PR로 나누고, 실패 시 해당 커밋만 리버트
  가능하도록 최소 diff 유지.

---

## 품질 게이트 (작업 중 반복 확인)

- 타입/린트/포맷: `npm run validate` GREEN 유지
- 테스트: smoke/fast 먼저, 필요 시 unit 전체. 경고 소음 카운트 테스트 포함
- 빌드: dev/prod 빌드 + `scripts/validate-build.js`(gzip 예산/문자열 가드)

---

## 참고/정책 고지

- Vendors: getter만 사용, 동적 매니저는 테스트 전용으로 이전
- Userscript: `getUserscript()` 어댑터 경유, a[href] 직접 다운로드 금지
- 입력: PC 전용 이벤트만 사용, 문서화된 네비 키만 처리
- 스타일: CSS Modules + 디자인 토큰(가능하면 컴포넌트 섀도 토큰) 사용
