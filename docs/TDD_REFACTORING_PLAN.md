# 🎨 TDD 리팩토링 계획 — Userscript 소스 디자인 현대화

> 테스트 우선(TDD)으로 Userscript 소스를 더욱 간결·일관·현대적으로 개선합니다.
> 완료된 항목은 `TDD_REFACTORING_PLAN_COMPLETED.md`로만 관리합니다.

## 범위와 가드레일

- TypeScript strict 100%, 모든 함수 명시적 타입
- 외부 의존성은 getter 함수로만 접근(Preact, Signals, fflate, GM\_\*)
- PC 전용 입력만 사용(Mouse/Keyboard/Wheel)
- 디자인 토큰 100% 사용(색/시간/라디우스 하드코딩 금지)

## 적용 가능한 솔루션 비교(요약)

- 스타일 소스 오브 트루스
  - JS 상수(CSS.SPACING 등) 혼용: 컴포넌트와 스타일 레이어가 분리되어 불일치
    위험
  - CSS Semantic 토큰 단일화(선택): 디자인 의도 단일 출처, 정적 검사/테스트 용이
- 컴포넌트 표준화
  - 임의 버튼/아이콘 조합: 일관성·접근성 리스크
  - 공용 프리미티브(IconButton, Surface, ToolbarShell) 고정(선택):
    토큰/상태/포커스 일관
- 이벤트 처리
  - 분산 처리: 중복 로직·핫키 충돌 가능
  - 중앙 Keybinding/PC-only 가드(선택): 테스트/유지보수 쉬움
- 스타일 주입 방식
  - 인라인 스타일/임의 문자열 주입: 토큰 위반 탐지 어려움
  - CSS Modules + 제한적 주입(선택): 토큰/테마/감속 정책 적용 용이

## 리팩토링 단계(테스트 우선)

아래 단계는 RED → GREEN → 리팩토링 순으로 진행하며, 각 단계는 독립 병렬 가능
범위에서 작은 PR로 쪼갭니다.

1. 토큰 전용 스타일 가드 확장

- 목표: 색상/보더/라디우스/지속시간/이징이 모두 `--xeg-*` 토큰만 사용되도록 정적
  가드 강화
- RED: 스타일/JS 인라인 하드코딩 탐지 테스트 추가
  - test/unit/styles/style-token-guard.colors.red.test.ts
  - test/unit/styles/style-token-guard.radius.red.test.ts
  - test/unit/styles/style-token-guard.motion.red.test.ts
- GREEN: 위반 지점 토큰 치환 및 주입 CSS/유틸 토큰 전환
- 리팩토링: 공용 유틸 클래스(.xeg-animate-\*, 포커스 링)로 중복 제거

진행 상황:

- 모션 인라인 transition 토큰 가드(animateCustom) 완료. 세부 사항은
  `TDD_REFACTORING_PLAN_COMPLETED.md`의 2025-09-11 항목을 참조하세요. 관련
  테스트: `test/unit/shared/utils/animations.tokens.test.ts`.

2. 간격/크기 스케일 단일화(Spacing Scale)

- 목표: TS/JS 내 숫자 간격 상수 사용 제거, CSS 토큰만 사용
- RED: `src/**/*.{ts,tsx}`에서 spacing/px 하드코딩 탐지 테스트 추가
  - 예: /(?<![-\w])(?:4|8|16|24|32)(px|\b)/ 와 같은 위험 숫자 가드(허용 리스트
    예외 포함)
- GREEN: CSS 토큰으로 치환, 필요시 유틸 클래스 생성
- 리팩토링: JS 상수(`CSS.SPACING`) 삭제 또는 내부 전용으로 축소

3. Icon-only 버튼 전면 통일

- 목표: 아이콘 전용 버튼을 모두 `<IconButton>`로 통일하고 a11y 준수(aria-label
  필수)
- RED: 아이콘 전용 `<button>`/`<a>` 검색 테스트 추가 및 aria-label 누락 검출
- GREEN: IconButton로 교체, intent/size 토큰 적용, 테스트 통과
- 리팩토링: 문서/가이드라인에 예시 추가 및 샘플 코드 정리

4. 키보드 내비게이션·포커스 정합

- 목표: 갤러리/모달/툴바의 roving tabindex, ESC/Arrow/Space 처리 일관
- RED: e2e/단위 혼합 테스트로 탭 순서·핫키 동작 검증
- GREEN: 중앙 Keybinding 적용 및 각 컨테이너 포커스 관리 통합
- 리팩토링: 이벤트 유틸로 공통화, 회귀 테스트 보강

5. Modal·Toast 포커스 트랩 일원화

- 목표: 포커스 트랩/포커스 이동 경로 표준화(모달/토스트/툴바 간 충돌 방지)
- RED: 포커스 탈출/루프 실패 케이스 e2e/단위 테스트 추가
  - test/unit/shared/utils/accessibility/focus-trap-standardization.test.ts 추가
    (accessibility-utils → unified focusTrap 위임 보장)
- GREEN: 트랩 유틸 통합 및 컨테이너별 진입/탈출 규칙 정리
  - src/shared/utils/accessibility/accessibility-utils.ts의 createFocusTrap이
    @shared/utils/focusTrap로 위임하도록 통일, 즉시 activate
  - 중복 구현 제거 방향으로 테스트 보강 완료
- 리팩토링: CSS/유틸 경량화 및 문서화

6. 스타일 주입 서비스 정리(최종 표준화) — 완료, 완료 로그로 이관

주입 CSS 토큰화, reduced-motion 가드, transition: all 금지까지 마무리되어 완료
로그로 이동했습니다.

## 완료 기준(DoD)

- 각 Phase RED→GREEN, 회귀 테스트 유지
- getter-only 의존성, PC 전용 입력, 토큰 사용 위반 0건
- 문서/체인지로그 갱신 및 사이즈 예산 준수(gzip 경고 ≥ 300KB, 실패 > 450KB)

## 진행/이관 노트

- 과거 완료된 토큰/애니메이션/접근성/다운로드/추출/부트스트랩 등 1차 현대화는
  완료 로그로 이관했습니다.
- 본 문서는 상기 1–7 단계만 추적합니다.
