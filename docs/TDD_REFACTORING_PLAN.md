# 🎨 TDD 리팩토링 계획 — 디자인 현대화(간결 버전)

> 테스트 우선(TDD)으로 유저 스크립트 소스를 모듈화·간결화하고, 타입/의존성/성능
> 기준을 일관화합니다.

## 1) 현재 상태 스냅샷 (2025-09-10)

- 디자인 시스템 핵심(B4/C1/C2: 토큰/라디우스/계약)은 완료되어 완료 로그로 이관.
- 본 문서는 “설정 모달 ↔ 툴바” 디자인 일원화에 집중합니다.
- 기준 원칙: TypeScript strict 100%, getter 함수로 외부 의존성 접근, PC 전용
  이벤트, 디자인 토큰 100% 사용.

## 2) 의사결정(Decision Log)

- D1. 번들 전략: Vite(Rollup) 단일 userscript 아티팩트 유지, 개발 시 코드 스플릿
  허용(릴리즈는 단일 파일).
  - 장점: Tampermonkey/Violentmonkey 호환성 보장, 디버깅은 개발 환경에서 용이
  - 단점: 릴리즈 시 트리셰이킹 결과 확인 필요(사이즈 예산 관리)
- D2. 의존성 격리: preact, fflate, GM\_\* 등은 vendor/tampermonkey getter로
  주입. 직접 import 금지.
  - 장점: 테스트에서 모킹 용이, 런타임 환경 차이를 격리
  - 단점: 얇은 어댑터 유지 필요
- D3. 상태/이벤트: UI는 preact + signals, 서비스 계층은 경량
  EventEmitter(커스텀) 사용. RxJS 등 신규 대형 의존성 도입 금지.
  - 장점: 번들 사이즈 최소화, 테스트 단순
  - 단점: 고급 스트림 오퍼레이터는 미지원(요구 없음)
- D4. 에러/로깅: Result 패턴 + createScopedLogger 표준화. 실패 경로 테스트 필수.
- D5. 입력 처리: PC 전용(Mouse/Keyboard/Wheel), 터치 이벤트 비사용. 키 지원은
  가이드라인 상수만 허용.

- D6. 스타일 아키텍처: CSS Modules + Semantic Tokens 우선, 컴포넌트 alias는
  과도기용만 허용.
  - 장점: 런타임 오버헤드 없음, 트리셰이킹/번들 영향 최소, 토큰 일관성 보장
  - 단점: 전역 변수 의존, 토큰 네임 충돌 시 테스트 필요
- D7. 인터랙션 컴포넌트: IconButton 패턴 통일(사이즈/호버/포커스/ARIA), 커스텀은
  합성 우선.
  - 장점: 접근성/일관성↑, 테스트/리뷰 용이
  - 단점: 기존 산발적 버튼 교체 작업 필요

## 3) 완료된 선행 작업(요약)

- 애니메이션 토큰 정규화, 테마 커버리지, 접근성 시각 피드백 TDD는 GREEN 상태로
  완료.
- 세부 사항은 `TDD_REFACTORING_PLAN_COMPLETED.md`에서 관리합니다.

## 4) 적용 가능한 솔루션 옵션과 선택

- 번들
  - 단일 번들(선택): Tampermonkey 호환 안정성↑ / 동적 로딩 제약
  - 다중 청크: 로딩 최적화 / 일부 매니저에서 import 실패 리스크
  - 결정: 단일 번들(릴리즈), 개발은 코드 스플릿 허용
- 상태 관리
  - signals(선택): 경량/반응성 / 학습비용 낮음
  - 커스텀 observable: 제로 의존성 / 재사용성↓
  - 결정: UI는 signals, 서비스는 경량 이벤트
- 다운로드 구현
  - 순수 fetch: 파일 저장 제약(Greasemonkey) / 단순
  - GM_download(선택): 저장 UX 우수 / 샌드박스 종속성
  - 결정: GM_download 1순위, fetch+xhr fallback

- 스타일링
  - CSS-in-JS: 조합성↑/동적 테마 용이 / 번들 및 런타임 오버헤드, userscript 환경
    부적합
  - 전역 CSS: 간단 / 충돌 위험, 캡슐화 약함
  - CSS Modules + Tokens(선택): 캡슐화/경량/테스트 친화 / 토큰 네임 관리 필요
  - 결정: CSS Modules + Semantic Tokens, alias는 점진 제거

## 5) 설정 모달 ↔ 툴바 디자인 일원화 (TDD 계획)

목표: 설정 모달의 헤더/버튼/컨트롤/표면이 툴바의 디자인 요소(IconButton,
상태·포커스 토큰, radius/spacing/shadow)와 1:1로 정합되도록 리팩토링하고,
테스트로 회귀를 방지합니다.

대상 파일(초기):

- `src/shared/components/ui/SettingsModal/SettingsModal.tsx`
- `src/shared/components/ui/SettingsModal/SettingsModal.module.css`
- `src/shared/components/ui/Toolbar/Toolbar.module.css` (참조)
- `src/shared/components/ui/Button/IconButton` (재사용)

옵션 비교:

- A) CSS 재사용만으로 통일(현행처럼 Toolbar CSS 클래스만 가져다 쓰기)
  - 장점: 변경 범위 작고 리스크 낮음
  - 단점: 컴포넌트 레벨 행태(ARIA, 상태, 포커스) 불일치가 남을 수 있음, 중복
    로직 지속
- B) 공용 프리미티브 재구성(IconButton 강제 사용 + Modal 헤더 프리미티브 +
  표면/토큰 정합)
  - 장점: 실질적 일관성·재사용성 확보, 향후 변경 비용↓
  - 단점: 교체 범위가 다소 넓음(헤더/버튼 교체), 테스트 보완 필요
- C) 테스트 기반 정책 강화(토큰/컴포넌트 사용 가드)
  - 장점: 회귀 방지, 코드리뷰 부담↓
  - 단점: 초기 테스트 작성 비용

선택: B + C (단계적 적용, Red→Green→Refactor)

Red — 실패하는 테스트 먼저 작성

- 스타일 정책 테스트
  - `test/unit/styles/settings-modal.tokens.test.ts`
    - .modal/.panel/.select/.closeButton에서 하드코딩 색상/지속시간 금지,
      `--xeg-*` 토큰만 사용
    - 헤더 구분선/텍스트 색상이 semantic 토큰(`--xeg-modal-border`,
      `--xeg-color-text-*`) 사용
- 컴포넌트 정합성 테스트
  - `test/unit/components/settings-modal.toolbar-consistency.test.tsx`
    - 헤더 닫기 버튼이 `IconButton` 사용(ARIA 라벨, 사이즈 md, intent='danger')
    - select 컨트롤이 툴바 버튼 크기/포커스 링과 일치(.toolbarButton 또는 변형
      클래스)
  - `test/unit/components/settings-modal.a11y.test.tsx`
    - Escape로 닫힘, 포커스 트랩 유지, PC 전용 키 이벤트만 처리

Green — 최소 구현으로 통과 (완료, 완료 로그 참조)

Refactor — 가독성/재사용성 개선

- `ModalHeader`(프리미티브) 도입 검토: 제목 슬롯 + 오른쪽 액션 슬롯(IconButton)
- select용 작은 프리미티브(`ToolbarSelect` 변형 클래스) 도입 검토
- 내부 상수/유틸 분리, 의존성은 getter 함수 사용(테스트 모킹 확보)

타입/의존성/이벤트 정책

- TypeScript strict 모드로 작성, 모든 함수/컴포넌트에 명시적 타입 지정
- 외부 라이브러리 접근은 getter 함수 사용하여 모킹 가능하게 유지
- PC 전용 이벤트만 처리(Keyboard/Mouse/Wheel), 터치 이벤트 비사용

완료 기준(Definition of Done)

- 신규 테스트 3종 GREEN, 기존 토큰/테마/접근성 테스트 GREEN 유지
- 설정 모달 헤더/버튼/컨트롤 시각·행태가 툴바와 일치(사이즈, 포커스 링,
  호버/액티브 피드백)
- 하드코딩 색/지속시간/px radius 사용 0건
- 문서화 반영(본 계획서 업데이트)

## 6) 품질 게이트

- Build PASS, Lint PASS(Strict, getter 강제 룰), Test PASS(단위+스모크)
- 사이즈 예산(릴리즈): gzip 기준 경고/실패 임계치 설정
- 접근성: 포커스/대비 스모크 확인

## 7) 진행 현황 표기(간결)

- B/C 단계 완료분은 완료 로그 참조. 본 계획은 “설정 모달 ↔ 툴바” 정합에 한정.

---

요약: Tampermonkey 호환 단일 번들 + 의존성 getter + IconButton/토큰 표준을
기반으로 설정 모달과 툴바의 디자인을 TDD로 일원화합니다.
