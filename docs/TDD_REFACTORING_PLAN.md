# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-13 — 활성 Phase: FITMODE-VIEWPORT-DYNAMIC

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase

### FITMODE-VIEWPORT-DYNAMIC — 이미지 크기 조정 버튼의 뷰포트 동적 반영

- 목표: 툴바의 이미지 크기 조정 버튼(원본/가로맞춤/세로맞춤/창맞춤)이 현재
  브라우저 윈도우(또는 갤러리 컨테이너) 크기를 정확히 참조하여 이미지가 즉시
  재배치되도록 개선.
- 현 상황: CSS에서 `fitWidth`는 `max-width: 100vw`, `fitHeight/fitContainer`는
  `max-height: var(--xeg-viewport-height-constrained)`를 사용하나, 후자 토큰이
  런타임에 신뢰성 있게 설정/갱신되는 보장이 약함. 윈도우 리사이즈 시
  재계산/재적용 경로 부재 가능성.

대안 비교(요약):

1. CSS 뷰포트 유닛(100vw/100vh)만 사용
   - 장점: 단순, JS 없음, 반응 빠름
   - 단점: 실제 사용 가용 영역(툴바/패딩/스크롤바) 반영 곤란, 일부 브라우저의
     100vh 이슈(모바일) — 본 프로젝트는 PC 전용이지만 헤더/툴바 오버헤드 보정
     불가

2. JS + CSS 변수 업데이트(window resize) — 컨테이너 기준 계산
   - 장점: 가용 높이/너비(컨테이너 내부 패딩/툴바 높이 등)까지 보정 가능, 토큰
     정책 유지(`var(--xeg-*)`)
   - 단점: 리스너/옵저버 관리 필요, 스로틀/정리 필요(수명주기 매니저 권장)

3. ResizeObserver 기반 컨테이너 관찰 + CSS 변수 반영
   - 장점: 레이아웃 변동(툴바 표시/숨김, 스크롤바 등)까지 정밀 추적, 과잉
     리사이즈 이벤트 회피
   - 단점: 구형 브라우저 폴백 필요(본 userscript 대상 브라우저는 대부분 지원,
     폴백으로 2) 병행 가능)

4. Preact 상태(Signals)로 viewport 크기 보관 후 스타일 인라인 바인딩
   - 장점: 테스트 용이한 순수 함수/상태 업데이트 가능
   - 단점: 가이드의 “인라인 스타일 px 사용 금지/토큰 사용” 원칙과 충돌 소지, CSS
     변수 경유로 우회 필요

결정(채택안): 2) + 3) 혼합 — 컨테이너에 `ResizeObserver`를 등록하고, 윈도우
`resize`에도 백업 리스너를 두어 다음 CSS 변수를 갱신한다.

- `--xeg-viewport-w` / `--xeg-viewport-h`: 실측 컨테이너(또는 뷰포트) 크기
- `--xeg-viewport-height-constrained`:
  `viewportHeight - toolbarHeight - padding` 등 가용 높이
- 토큰은 컨테이너 루트(`.xeg-gallery-container`)에 설정하여 하위 아이템 CSS가
  참조

설계/계약(요약):

- 입력: containerRect(width,height), chromeOffsets(toolbar, paddings), fitMode
- 출력: CSS 변수 값 문자열(px) 및 클래스 적용 상태
- 성공 기준: 버튼 클릭/윈도우 리사이즈 시 이미지가 컨테이너 폭/가용 높이에
  정확히 맞춰 즉시 재배치; 스크롤바/툴바 높이 변화 반영; PC 전용 이벤트 정책
  준수

TDD 단계(RED → GREEN → REFACTOR):

1. 순수 유틸 테스트 추가(RED):
   `computeViewportConstraints(containerRect, chrome)` →
   `{ viewportW, viewportH, constrainedH }`
2. 구현(GREEN): 유틸 + 스로틀러(raf 기반) 작성, TimerManager/EventManager 사용
3. 훅/서비스 테스트(RED): `useViewportCssVars(containerRef)`가 CSS 변수를
   설정/해제하는지 검증(JSDOM: style attribute 검사)
4. 구현(GREEN): ResizeObserver + window resize 폴백, cleanup 포함
5. 통합 테스트(RED): VerticalImageItem에서 fitHeight/fitContainer가 변수 적용을
   사용하는지(class 존재 + 변수 설정 시 스타일 반영 여부 스모크)
6. 구현/리팩터(최소 변경): CSS에서 `100vw`를 변수 경유로 보완하거나 유지,
   `max-height`는 `--xeg-viewport-height-constrained`로 일원화

DoD:

- 타입/린트/테스트 GREEN, PC 전용 입력/토큰/사이드이펙트 가드 준수
- 리사이즈/툴바 표시 변화 시 즉시 재배치(수동 스모크), dev/prod 빌드 및 산출물
  검증 PASS
- 성능: 리사이즈 핸들러는 RAF 스로틀, 옵저버/리스너는 갤러리 unmount 시 정리

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가.

-- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
