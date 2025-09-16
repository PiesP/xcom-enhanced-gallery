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

<!-- 3) TOKENS-TOOLBAR-03 — 완료: COMPLETED 문서로 이동 -->

---

<!-- 4) A11Y-ICON-04 — 완료: COMPLETED 문서로 이동 -->

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

1. VND-INIT-01 → 2) VND-LEGACY-MOVE-02 → 3) TOKENS-TOOLBAR-03 → 4) (완료) (5는
   보류)

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
