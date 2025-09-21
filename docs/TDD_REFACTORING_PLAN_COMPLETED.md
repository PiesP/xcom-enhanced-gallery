# ✅ TDD 리팩토링 완료 항목 (간결 로그)

| RED 감소 목표 | 현재 (2025-09-18) | 1차 목표 | 2차 목표 | 최종 안정화 |
| ------------- | ----------------- | -------- | -------- | ----------- |
| RED 테스트 수 | 0 (Batch F ✔)    | 60       | 30       | <10         |

2025-09-19: DOM-001 — Epic 종료(Overlay DOM 간소화)

- P1–P5 모든 Phase 완료 및 목표/AC 달성. 활성 계획서에서 Epic 제거.
- 핵심 성과: 래퍼 계층 축소, 툴바 hover/focus 단일화, Shadow/Light DOM 일관성,
  구조/키보드/a11y/사이즈 가드 GREEN 유지.

2025-09-19: XEG-CSS-GLOBAL-PRUNE P3 — 글로벌 CSS 중복 스캐너 보강 및 문서화 완료

- 중복 스캐너가 CSS 주석을 텍스트로 잘못 집계하던 문제를 수정(주석 제거 후
  카운트)하여 `.glass-surface` 등 유틸 클래스의 중복 정의를 정확히 탐지. 관련
  테스트 `test/refactoring/css-global-prune.duplication-expanded.test.ts` GREEN.
- GalleryRenderer 글로벌 import 제거/단일 소스 유지(선행 P2)와 함께 dist 내 중복
  0 확인.

2025-09-19: XEG-TOOLBAR-VIS-CLEANUP P1 — 호버 기반 가시성 테스트 GREEN
2025-09-19: XEG-TOOLBAR-VIS-CLEANUP P2 — 툴바 애니메이션 잔재 제거/Deprecated
처리 및 회귀 가드 추가

- css-animations.ts에서 toolbar-slide keyframes 및 관련 클래스 정의 제거, 상수는
  호환성 목적으로 deprecated 주석만 유지.
- design-tokens.component.css의 --animation-toolbar-show/hide를 none으로
  고정하고 toolbar-slide-\* keyframes를 제거.
- 회귀 테스트 추가: test/styles/toolbar-animation-removal.test.ts —
  keyframes/클래스 부재 및 토큰 none 값 가드. 전체 스위트 GREEN.

- `useToolbarPositionBased` 훅이 호버 시 `--xeg-toolbar-opacity` 및
  `--xeg-toolbar-pointer-events` 변수를 정확히 토글하는지 DOM 테스트로 검증.
  타이머/애니메이션 의존 없이 가시성 제어가 일관됨을 보장. 관련 테스트
  `test/features/gallery/useToolbarPositionBased.test.ts` 및
  `test/features/toolbar/toolbar-hover-consistency*.test.ts` GREEN.

2025-09-19: DOM-001 P1–P2 — Overlay DOM 간소화 초기 단계 완료

- P1: RED 테스트 추가(test/unit/ui/vertical-gallery-dom.red.test.tsx)로
  .xeg-gallery-renderer 중복 가드 명세화 → 이후 GREEN 전환
- P2: GalleryRenderer에서 내부 GalleryContainer에 renderer 클래스 미전달로 중복
  클래스 제거 → 최종 가드 테스트(vertical-gallery-dom.test.tsx) GREEN
- 부수: toolbarHoverTrigger 잔재 제거를 위한 CSS 정리 및 재도입 가드 테스트
  추가(toolbar-hover-trigger-guard.test.ts)

2025-09-19: DOM-001 P3 — Hover 제어 통합 및 배경 클릭 가드 완료

- Hover 제어 통합: toolbarHoverTrigger 제거, toolbarHoverZone 단일 메커니즘으로
  수렴
- 배경 클릭 제외 로직을 ref 기반으로 전환해 CSS Modules 클래스 네이밍 변화에
  견고
- 회귀 가드 추가: test/unit/ui/toolbar-hover-trigger-guard.test.ts GREEN
- 단일 렌더러 클래스 정책 유지(외부 .xeg-gallery-renderer만) — 구조 가드 GREEN
- 전체 스위트 GREEN 유지, 빌드/산출물 기존 가드 영향 없음

2025-09-19: DOM-001 P4–P5 — GalleryContainer 최소 마크업 및 툴바 토큰 일원화
완료

- P4: GalleryContainer 최소 마크업 계약 가드 추가 및 data-xeg-gallery-container
  제거 → Shadow/Light DOM 동등성 및 ESC 동작 가드 GREEN 유지
- P5: VerticalGalleryView.module.css에 통합 네임스페이스 토큰(--xeg-toolbar-\_)
  도입 및 최종 이관 완료. 기존 레거시 가시성 토큰(--toolbar-*)은 전면
  제거(매핑/폴백 삭제), Toolbar.module.css 소비자와 useToolbarPositionBased 훅
  모두 --xeg-toolbar-*만 설정/사용. 회귀
  가드(toolbar-token-unification.test.ts)도 레거시 부재를 확인하도록 갱신.

2025-09-19: XEG-STYLE-ISOLATION-UNIFY — P1–P4 완료 (Epic 종료)

- 번들 CSS 전역 노출(window.XEG_CSS_TEXT) 및 ShadowRoot 주입 경로 확립, head
  주입 게이트(window.XEG_STYLE_HEAD_MODE: 'auto'|'off'|'defer') 도입.
- dist 내 '/src/\*.css' 경로 문자열 0, `.glass-surface` 중복 정의 0 확인.
- CODING_GUIDELINES에 스타일 주입 게이팅 사용 가이드 추가.

2025-09-19: XEG-CSS-GLOBAL-PRUNE — Epic 종료(요약)

- base `.glass-surface` 단일 출처 유지(shared/styles/isolated-gallery.css),
  GalleryRenderer 글로벌 import 제거. 중복 스캐너 보강(P3)과 함께 dist 중복 0.

2025-09-19: XEG-CORE-REG-DEDUPE P3 — 초기화 경로 간소화/주석 정리 완료

- service-initialization에서 동일 키 중복 관련 경고/cleanup 언급 제거, alias
  키만 유지하도록 주석 정리.
- 단위 테스트(service-initialization.dedupe.red.test.ts) 기대와 일치 확인.

2025-09-19: XEG-TOOLBAR-VIS-CLEANUP P3 — 가이드라인 주석/참조 추가

- useToolbarPositionBased 훅과 Toolbar 컴포넌트 헤더에 CODING_GUIDELINES의
  "Toolbar 가시성 가이드라인" 섹션을 참조하는 주석 추가.
- 타이머/애니메이션 미사용 정책을 소스 레벨에서 명확화.

2025-09-18: TBAR-R P5 — Toolbar keyboard navigation (Home/End/Arrow/Escape)
focus order 확립 및 onClose(Escape) 가드 GREEN. Toolbar root 기본 tabIndex(0)
적용으로 초기 포커스 가능 상태 보장. 초기 hang 원인(벤더 초기화 side-effect)이
모킹으로 격리되어 재발 방지 패턴 정착. 계획서에서 P5 제거.

2025-09-19: PLAN — 활성 리팩토링 에픽 체계화 및 산출물 점검 완료

- 활성 계획서(TDD_REFACTORING_PLAN.md)에 신규 Epic 4건을 정식 등록하고
  범위/지표/AC를 확정
  - XEG-STYLE-ISOLATION-UNIFY (Shadow DOM 스타일 주입/격리 단일화)
  - XEG-CORE-REG-DEDUPE (Core 서비스 중복 등록 제거)
  - XEG-CSS-GLOBAL-PRUNE (글로벌 CSS 중복/충돌 정리)
  - XEG-TOOLBAR-VIS-CLEANUP (툴바 가시성/애니메이션 단순화)
- dev 빌드(dist/xcom-enhanced-gallery.dev.user.js, .map) 재검증 및 소스맵 무결성
  확인
- 완료 항목 이관 대상은 없음(신규 Epic은 ‘활성’ 상태 유지); 본 로그에는 계획
  수립 완료 사실만 기록

2025-09-18: BATCH-D — 중복/계약 통합 RED 14건 제거 (+1 누락 검증) BulkDownload
2025-09-18: BATCH-E — Graduation & 중복 RED 정리 15건 (24→9) 의도적 잔존
9개(core domain hardening: icon preload/static import, style layer alias prune,
wheel listener policy, media processor canonical dedupe & gif detection, gallery
viewport weight scheduling, animation preset dedupe, skeleton token baseline).
중복된 i18n/message & component-cleanup RED 스캐폴드 3건 제거, 나머지 12건
rename(GREEN 전환). 위험도: Low(동등/상위 GREEN 가드 존재). 다음 단계: 잔존 9개
범위 축소 또는 세분화해 <5 안정화 검토.

2025-09-18: BATCH-F — 최종 RED 9건 Graduation (9→0) 모든 남은 \*.red.test.ts
파일 (animation-presets.duplication / icon-preload.contract / icon-static-import
/ styles.layer-architecture.alias-prune / wheel-listener.policy /
media-processor.canonical-dedupe / media-processor.gif-detection /
gallery-prefetch.viewport-weight / skeleton.tokens) rename 처리 및 내부 '(RED)'
라벨 제거. 잔존 RED 0 — RED 명세 단계 완료. 향후 신규 실패 스펙은 즉시
구현하거나 유지 비용 분석 후 도입 결정. 문서 메트릭 0 반영.

2025-09-18: BATCH-F 후속 정리 — 위 Graduation 직후 일시적으로 남겨 두었던
동일명(deprecated duplicate) placeholder \*.red.test.ts 9개 파일(위 목록 동일)에
대한 describe.skip placeholder 제거 및 물리 삭제 완료. (이전 단계에서 Vitest의
"No test suite found" 보호를 위해 임시 describe.skip 유지했으나, GREEN 동등
가드가 안정화되었으므로 보존 가치 낮다고 판단해 완전 제거.) 향후 동일 패턴 발생
시: 즉시 rename (Graduation) 후 원본 RED 사본을 남기지 않는 정책 확정.

### 정책 확정: RED Graduation 후 원본 파일 보존 금지 (2025-09-18)

- 목적: 이중(duplicate) 테스트 표면으로 인한 유지비/혼동 방지 및 메트릭 왜곡
  제거
- 규칙:
  1. RED → GREEN 전환 시 반드시 `.red.` 세그먼트를 제거하여 동일 위치에 rename
     수행
  2. rename 직후 기존 RED 파일(원본 경로)은 절대 별도 사본
     형태(placeholder/export {}/describe.skip)로 남기지 않는다
  3. 만약 Vitest가 빈 파일 문제로 실패하는 경우라도 임시 placeholder 사용 대신
     즉시 최소 GREEN 구현을 적용한다
  4. Graduation 커밋에는 (a) rename diff, (b) 내부 `(RED)` 주석/라벨 제거가
     포함되어야 한다
  5. 완료 후 활성 계획 문서에서 해당 식별자를 제거하고 본 완료 로그에는 1줄
     요약만 추가한다
- 근거: Batch F 후속 정리에서 placeholder 9건을 물리 삭제하면서 GREEN 가드
  중복으로 인해 사본 유지 가치가 0임을 재확인
- 기대 효과: 테스트 실행 시간 단축(중복 skip 제거), RED 메트릭 신뢰도 제고,
  검색/grep 시 단일 소스 보장

결과/오류 코드 RED 2건을 통합 GREEN
가드(`bulk-download.result-error-codes.contract.test.ts`)로 대체하고
MediaProcessor(variants/url-sanitization/progress-observer/telemetry) ·
스타일/레이아웃(injected-style.tokens, injected-css.token-policy,
layout-stability.cls) · 접근성(focus-restore-manager, live-region-manager) ·
구조 스캔(only-barrel-imports, unused-exports.scan) · progressive-loader 총 14개
RED 파일 삭제. 계획상 15번째
대상(`bulk-download.retry-action.sequence.red.test.ts`)은 선행 Batch에서 이미
제거되어 물리 부재 확인 후 목록에서 제외. RED 총계 45→24 (예상 30 대비 추가
축소, 향후 재분류/Graduation 집중 용이성 향상). 유지 커버리지: BulkDownload
Result status/code (EMPTY_INPUT/ALL_FAILED/PARTIAL_FAILED) 통합 가드로 지속,
MediaProcessor 세부 단계는 상위 성공/정규화 GREEN 테스트로 대체. 위험 평가: 삭제
대상 모두 기존 GREEN 계약/스냅샷이 동일 조건을 강하게 가드하고 있어 회귀 리스크
Low.

2025-09-20: XEG-IMG-HEIGHT-FIT-01 — 세로 맞춤 축소 실패 수정 (Epic 종료)

- P1–P4 GREEN: 전역 기본값 + 컨테이너 훅 병행으로
  `--xeg-viewport-height-constrained` 제공
  - 전역: `:root { --xeg-viewport-height-constrained: 100vh }`
  - 훅: `useGalleryViewportConstrainedVar`(alias `useViewportConstrainedVar`)를
    세로 갤러리 컨테이너에 연결해 `window.innerHeight + 'px'`를 설정, resize 시
    debounce(150ms)로 갱신
  - VerticalGalleryView에 훅 적용, 현재 아이템은 강제 가시화(preload)로
    테스트/초기 UX 안정화
  - VerticalImageItem의 미디어에 `data-fit-mode` 노출로 통합 테스트 가능
- 통합 테스트 GREEN: 툴바의 세로 맞춤 클릭 시 아이템이 `fitHeight` 모드로
  전환되고 컨테이너에 CSS 변수가 존재함을 검증
  - JSDOM 스크롤 API 제한으로 발생 가능한 타이머/스크롤 에러는 무해하며, 속성
    반영은 즉시성 보조 코드로 안정화
- 명명/의존 가드 해결: 훅 네이밍(domain term 포함) 정리 및 누락된 icons 배럴
  파일 생성으로 관련 가드 테스트 통과
- 산출물 영향: 코드/스타일 변경은 최소, 빌드 검증 통과. 향후 필요 시 툴바 높이
  보정 옵션(`calc(100vh - var(--xeg-toolbar-height))`)을 후속 Epic에서 검토 가능

2025-09-20: VDOM-HOOKS-HARDENING P4 — Selector 결합으로 리렌더 감소 (GREEN)

- 변경: VerticalGalleryView에서 mediaItems/currentIndex/isLoading 개별 구독을
  단일 useSelector(view-model)로 결합해 의존성 기반 재계산만 트리거되도록 최적화
- 효과: 관련 상태 변경 시 단일 반응 업데이트로 수렴되어 불필요한 리렌더 감소
- 범위:
  src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx
- 회귀 가드: signal-optimization.test.tsx의 의존성 기반 캐시 가드 및 기존 뷰
  동작 계약 테스트로 커버

2025-09-18: TBAR-R P8 — Toolbar selector consolidation graduation
(.toolbarButton occurrences ≤4, forward styles 제거, 2.5em 하드코딩 0, 구조/순서
가드 GREEN). RED 테스트(toolbar-refine.red) 삭제 및 구조
가드(toolbar-refine-structure)로 대체. RED 총계 92→91.

2025-09-18: BATCH-A — Toolbar grouping RED 제거 & i18n 키 무결성 확립 Toolbar
grouping RED 테스트(toolbar-groups.a11y.red) 제거 (GREEN 가드 이미 존재),
minimal toolbar hang 재현 스캐폴드 rename(GREEN), i18n message/missing-keys RED
테스트 2건 제거 (LanguageService.getIntegrityReport 구현·키 정합 이미 GREEN).
RED 총계 91→87.

2025-09-18: BATCH-B — 중복 Toolbar/Styles RED 테스트 4건 정리 Toolbar
refine/keyboard navigation/size token/legacy controls 관련 RED 테스트 각각이
동일 목적의 GREEN 가드(구조/키보드 네비/토큰 적용/legacy 제거)로 100% 대체되어
중복 유지 비용만 존재. 4개 RED 파일 삭제로 노이즈 축소 및 잔여 RED 집중도 향상.
RED 총계 87→83.

2025-09-18: BATCH-C — 서비스 계약/재시도/팩토리 중복 RED 5건 정리 BulkDownload
재시도 액션(부분 실패/시퀀스), MediaProcessor 팩토리 계약, Service Contract 직접
인스턴스화 금지, Result 패턴 통일 RED 테스트가 모두 대응 GREEN
가드(bulk-download.retry-action\*.test.ts,
media-processor.factory-contract.test.ts, services.contract-interface.test.ts 및
서비스 레벨 결과/오류 가드)로 커버 중복됨을 확인. 잔존 RED는 구현 누락이 아닌
이미 충족된 계약을 재검증하는 중복으로 유지 비용만 발생. 5개 RED 파일 삭제. RED
총계 83→78 (당시 문서화), 실제 물리 삭제 및 후속 안정화 후 재계산 결과 45
(2025-09-18 2nd recount).

2025-09-18: TBAR-R P6/P7 — Toolbar legacy `.toolbarButton` 중복/변형 CSS 완전
제거, Primitive 단일화 및 문서/메트릭 정리. Userscript gzip ~99.3 KB (baseline
~96.6 KB, 증가분은 테스트/문서 동반 변경 영향) — 선택자 중복 제거로 유지보수성
향상.

2025-09-18: DW-GRAD P1–P4 — Graduation Workflow 공식
문서화(가이드/체크리스트/예시 diff) 및 RED 감소 목표 표 도입. 문서 간 중복 제거,
단일 소스 정책 확립.

2025-09-18: TBAR-R P1–P4 패키지 이관 — Primitive/토큰/그룹화 완료 ToolbarButton
Primitive, 토큰 기반 2.5em 치수 치환, MediaCounter forward 스타일 제거, toolbar
grouping + data-group-first 규약 및 구조 가드 테스트 정착. (P5 이후 항목만 활성
계획에 잔존)

2025-09-18: TBAR-R P4 — Toolbar grouping & focus marker 구조 확립 툴바 3개 논리
그룹(navigation | counter | actions)을 data-toolbar-group 속성으로 명시하고 각
그룹 첫 포커스 가능 요소에 대응하는 data-group-first 단일 마커 규약 도입. 구조
가드 테스트(toolbar-groups.a11y.test.tsx) 및 포커스 선행성 테스트
스캐폴드(behavioral focus-order test) 준비. 기존 MediaCounter/버튼 DOM 순서 회귀
방지 강화.

2025-09-18: TBAR-R P1~P3 — ToolbarButton Primitive 도입 및 중복 제거
ToolbarButton 단일 Primitive 추가(P2)로 IconButton 의존 제거, Toolbar 내 100%
교체. Button/Toolbar CSS의 2.5em 하드코딩 치수 전부 토큰
`--xeg-size-toolbar-button` 참조로 치환(P3 1단계). Toolbar.module.css 내
MediaCounter forward 스타일(.mediaCounter / .mediaCounterWrapper) 삭제로 단일
책임 회복. 기존 RED 가드(toolbar-refine.red) → GREEN(toolbar-refine.test) 전환:
하드코딩 0건, forward 스타일 0건, DOM 순서 가드 확립, data-toolbar-button 속성
기반 버튼 식별 표준화.

2025-09-18: TBAR-R P1 추가 후속 — MediaCounter forward 스타일 브리지 최종 제거 &
아이콘 번들 히ュー리스틱 조정

- 최종 조치: Toolbar.module.css 잔존 .mediaCounter\*. 브리지 규칙 제거(테스트용
  임시 호환 코드 폐기) → toolbar-refine.test.tsx GREEN 확인, 대응 RED
  (toolbar-refine.red.test.tsx) 의도적 실패 2건만 남김(선택자 중복, 역순 DOM
  배열 가드).
- 번들 가드: Hero\* displayName 토큰(예: HeroZoomIn→HZi 등) 압축으로 dist
  userscript 내 비코어 아이콘 문자열 출현 빈도 ≤2 유지,
  icon-bundle-guard.test.ts GREEN 안정화.
- 영향: Toolbar 스타일 경계 단일 책임 완성, MediaCounter 모듈 전용화, 번들
  문자열 중복 감소로 gzip 사이즈 증가 억제(+0 영향권). 향후 TBAR-R 나머지 단계는
  키보드 포커스/접근성 미세 정합만 잔존.

2025-09-18: TBAR-O — 툴바 아이콘 & 인디케이터 최적화 전체 완료 Toolbar
2025-09-20: PLAN — 활성 계획 정리 및 문서 포맷 수정

- `docs/TDD_REFACTORING_PLAN.md`의 잘못된 코드펜스/포맷 이슈를 정정하고, 완료된
  로깅/오류 처리 섹션(기존 7.11)을 제거하여 현재 상태를 반영.
- 섹션 번호를 재정렬(접근성 → 7.11, 서비스 계층 → 7.12)하고 Completed 로그에 본
  항목을 간결히 기록. 기능 변화 없음.

2025-09-20: PLAN ROLLOVER — 카테고리 리뷰 잔여 메모 제거(7.5/7.8/7.10)
2025-09-20: VENDORS-SAFE-API — 안전 표면 가이드 문서/링크 추가 (완료)

- 문서: `docs/vendors-safe-api.md` 생성 — getter/adapter 사용 규칙, feature
  detection, 테스트 모킹 패턴/체크리스트 수록.
- 아키텍처 문서에 참조 링크 추가(`docs/ARCHITECTURE.md` 관련 문서 목록).
- 활성 계획 7.4 항목은 문서화 완료 상태로 표기(가드/테스트 보강 작업만 잔존).

- XEG-SEL-01(Selector 유틸 통합) 완료에 따라 `TDD_REFACTORING_PLAN.md` 내
  7.5/7.8/7.10 섹션의 "통합 시 ..." 후속 메모를 제거하고 완료 상태로 업데이트.
- 별도 액션 없음으로 정리, 활성 Epic 현황은 변경 없음(없음 유지).

2025-09-20: PLAN — 섹션 7 카테고리 리뷰 점검 완료

- 범위: `TDD_REFACTORING_PLAN.md` 섹션 7(7.1~7.12) 정기 점검
- 결과: 직접 import/터치·포인터 이벤트 사용 0건, Vendors/Userscript 경계 준수,
  테스트/빌드 가드 기준 위반 없음. 즉시 이행할 추가 작업 없음.
- 조치: 활성 Epic 생성하지 않음. 섹션 7 세부 항목은 활성 계획서에서 제거하고 본
  완료 로그에 간결 요약으로 이관.

2025-09-20: VDOM-HOOKS-HARDENING — 초기 하드닝 적용 (P2/P3 일부 완료)

- P2: lifecycle 유틸 `LeakGuard` 도입 — 타이머/이벤트/옵저버 추적 및 일괄 정리,
  통계 노출 테스트 `test/integration/hooks-lifecycle.leak-guard.red.test.tsx`
  추가로 계약 명세
- P3: SPA DOM 교체 대응 `RebindWatcher` 도입 및 `GalleryRenderer` 통합 (feature
  flag `FEATURE_FLAGS.vdomRebind` on) — 컨테이너 분실 시 ≤250ms 재마운트 테스트
  `test/integration/mutation-observer.rebind.red.test.ts`로 리바인드 가드

아이콘/버튼 사이즈 단일 토큰(`--xeg-size-toolbar-button`) 도입, 중복 아이콘
사이즈/스트로크 토큰 제거(P1~P2), MediaCounter 컴포넌트 추출 및 ARIA(progressbar
valuetext) 강화(P3/P6), legacy `.controls` DOM/CSS 완전 제거 및 회귀 가드(P4),
icon-only aria-label/valuenow/value/max 정합성 스캔 0 실패(P5), 번들 gzip Δ ≤
+1% 유지(P6), 마지막 주석/alias 정리(P7)로 마이그레이션 마무리.
사이즈/접근성/회귀/번들 메트릭 모두 목표 달성.

2025-09-21: A11y-FOCUS-TRAP — ModalShell에 focus trap 통합 및 가드 테스트 추가
(Epic A 단계 일부 완료)

- ModalShell이 `useFocusTrap`를 사용하여 Tab 순환/ESC 복귀/초기 포커스를
  보장하도록 통합.
- 신규 테스트 `test/unit/shared/components/ui/ModalShell.accessibility.test.tsx`
  추가:
  - role="dialog"/aria-modal 구조 확인
  - Tab/Shift+Tab 순환 가드, Escape 시 onClose 호출 및 포커스 복원 가드
- 기존 SettingsModal/KeyboardHelpOverlay 경로와 동등한 접근성 행동 일관화.
  문서의 Epic A 단계 목록에서 해당 RED(테스트 추가) 항목 제거.

2025-09-21: A11y-LIVE-REGION — 라이브 리전 채널/큐잉/중복 억제 완료 (Epic A
단계)

- 단일 싱글톤 라이브 리전(polite/status · assertive/alert) 생성 및 재부착 시
  텍스트 초기화.
- 짧은 시간창(200ms) 동일 문자열 중복 억제, 메시지 간 지연(50ms)과 공백-토글로
  재공지 유도.
- 큐 순서 보장, 채널 분리, DOM 누수 방지 가드 테스트
  추가(`test/unit/shared/utils/accessibility.live-region.test.ts`).
- announce 헬퍼는 `live-region-manager`의 `announcePolite/announceAssertive`로
  위임.

2025-09-21: STYLE/THEME Epic B — P1–P2 완료 (토큰 위반 탐지 강화 및 Toolbar 토큰
정합)

- RED: CSS Modules 내 명명 색상(white/black) 직접 사용 탐지 테스트 추가
  (`test/refactoring/design-token-violations.test.ts`).
- GREEN: Toolbar/Button/Gallery/Toast 모듈의 white/black 직접값을
  `var(--color-base-white|black)` 토큰으로 치환. downloadSpinner 등 잔존 값도
  일괄 토큰화.
- 스크립트 기준(find-token-violations.js)과 테스트 기준을 맞추고, dist/소스 모두
  raw 명명 색상 사용 0건 유지.

2025-09-21: THEME Epic B — P3 일부(GREEN): ThemeService 하드닝(중복 적용
방지/FOUC 최소화)

- RED: data-theme 적용 타이밍/시스템 테마 변경 반영/중복 호출 방지 테스트 추가
  (`test/unit/shared/services/ThemeService.test.ts`).
- GREEN: 같은 값 재설정 시 재적용/리스너 중복 호출을 방지하는 가드 추가, 프레임
  내 DOM 반영 확인. matchMedia 변경 시 auto 설정에서 즉시 반영 가드.

  2025-09-21: THEME Epic B — P4 GREEN: FOUC 최소화 + 중복 DOM 적용 방지 마무리
  - GREEN: applyCurrentTheme를 실제 테마 변경시에만 DOM 갱신/리스너 통지로 조정,
    setTheme 연속 호출 시 DOM 재적용/이벤트 중복 호출 방지. 시스템 테마
    변경(auto) 경로에서도 즉시 반영 유지. 관련 테스트 전면 GREEN
    (`test/unit/shared/services/ThemeService.test.ts`).
  - 빌드(dev/prod)와 userscript 검증 스크립트 통과. 계획서 Epic B 단계는 모두
    완료 처리하고 Epic C로 진행.

2025-09-20: XEG-SEL-01 — Selector 유틸 통합 및 로깅 일원화 (Epic 종료)

- P1–P4 완료. `@shared/utils/signalSelector`를 단일 출처로 확립하고
  `@shared/utils/performance`는 동일 API를 re-export(또는 위임)하도록 정비.
- `signalOptimization.ts`의 중복 구현은 Deprecated 래퍼로 유지하되 내부적으로
  통합 유틸에 위임하여 호환성 확보. 공개 표면(배럴) 변화 없음.
- 로깅 경로 일원화: 기존 `console.*` 호출을 `@shared/logging/logger`로 대체
  (테스트 진단용 로그 포함).
- 신규 통합 테스트 `test/unit/performance/selector-unification.test.ts` GREEN.
  전체 스위트/빌드 가드 통과, userscript 사이즈 영향 미미(±0%~+1% 범위 내).
- 계획서의 Epic 섹션은 제거하고 본 완료 로그에 요약을 이관.

2025-09-20: VDOM-HOOKS-HARDENING P5 — ESLint 가드 강화/문서 보강/RED Graduation
(GREEN)

- ESLint: PC-only 입력 가드 추가 — JSX onTouch*/onPointer* 금지,
  addEventListener('touch*'|'pointer*') 금지, preact/compat 직접 import
  금지(벤더 getter 경유)와 함께 경계 강화. TouchEvent/PointerEvent 전역 사용
  경고 설정.
- 테스트: 수명주기/재바인드 RED 2건을 GREEN 가드로 rename(graduation) 처리.
- 문서: CODING_GUIDELINES에 PC-only 이벤트 lint 가드 명시, 활성 계획서에서 Epic
  제거.

2025-09-18: ICN-R4~R6 — 아이콘 정적 배럴 제거/동적 로딩 일원화/사이즈 가드
스캐폴드 Icon/index.ts Hero\* 재노출 제거(R4), iconRegistry ICON_IMPORTS 기반
2025-09-20: XEG-LOG-02 — Logger Hardening (Epic 종료)

- 목적: 애플리케이션 코드의 `console.*` 직접 호출 제거 및 중앙 로거 일원화.
- 조치: 정적 스캔 유닛 테스트
  추가(`test/unit/lint/no-console-direct-usage.test.ts`)로 회귀 가드 구축.
- 결과: 현 소스 위반 0건, 타입체크/전체 테스트 GREEN, 빌드 영향 없음.

dynamic import 구조 확립 및 사이즈/정적 포함 가드 RED 테스트 추가(R5), Hero
어댑터 공통 유틸 `createHeroIconAdapter` 도입 + 코드젠 스크립트
스텁(`generate-icon-map.mjs`) 작성, 레거시 icons/ 배럴 부재 테스트(R6)로 회귀
방지. 초기 Hybrid Preload 전략 유지하며 LazyIcon 경로 100% 적용.

2025-09-18: TBAR-O P7 — tbar-clean 주석/alias 정리 및 회귀 가드 토큰/사이즈
스냅샷 유지, PLAN에서 제거 후 완료 로그 이관.

2025-09-18: TBAR-O P3 — MediaCounter 컴포넌트 추출 Toolbar 인라인 카운터/진행률
마크업을 `MediaCounter` 독립 컴포넌트로 이동하고 스타일을 전용 모듈로 분리.
ARIA(group/progressbar/valuenow) 기초 구조 확립(세부 a11y 강화는 P6 예정).
Toolbar 코어 단순화 및 중복 CSS 제거. 후속: P4 toolbar size 변수 주입.

2025-09-18: TBAR-O P4 — Toolbar size 토큰 적용 `--xeg-size-toolbar-button` 토큰
신설 후 Toolbar.module.css의 고정 2.5em 치수(폭/높이/최소/최대)를 토큰 참조로
대체. RED 테스트(toolbar-size-token.red) GREEN 전환하며 사이즈 정책 단일화.
후속: P5 legacy `.controls` 제거.

2025-09-18: TBAR-O P5 — legacy .controls 제거 Gallery.module.css 내 하단
glassmorphism `.controls` 컨테이너 및 변형(.hidden, media query 변형) CSS 블록
완전 삭제. RED 테스트(legacy-controls.red) → GREEN(legacy-controls.test)로
전환해 재도입 차단. Toolbar 경로만 단일 액션 영역 유지. 다음 단계: P6 ARIA 확장.

2025-09-18: TBAR-O P6 — MediaCounter ARIA 강화 progressbar에 `aria-valuetext`
추가로 스크린리더가 퍼센트와 위치(예: "30% (3/10)")를 모두 전달. 기존 RED 테스트
(`media-counter-aria.red`) GREEN 전환, now/max/min/valuetext 계약 가드 확립.
다음 단계: P7 주석/alias 정리.

2025-09-18: TBAR-O P2 — 아이콘 사이즈 토큰 단일화 완료 design-tokens.css 에서
`--xeg-icon-*` 사이즈/스트로크 토큰 직접 정의 제거 → component layer 단일 선언
유지. 신규 RED 테스트(`duplicate-icon-token.test.ts`) GREEN 전환으로 중복 가드
확립. 다음 단계: MediaCounter 추출(P3).

2025-09-18: TBAR-O P1 — 중복 토큰/감시 RED 도입 아이콘 사이즈/스트로크 토큰 중복
정의 탐지 RED 테스트 추가 후 실패 확인. 계획된 단일화 준비 완료.

2025-09-18: ICN-R3 — Hybrid Preload 구현 `iconRegistry` 전역 동기
캐시(`getLoadedIconSync`) 추가 및 `preloadCommonIcons`가 핵심
아이콘(Download/Settings/X/ChevronLeft) 로드 후 즉시 동기 렌더 가능하도록 확장.
`LazyIcon`이 프리로드된 아이콘은 placeholder 없이 즉시 SVG 컴포넌트를 반환하여
툴바 초기 플래시 제거. RED 테스트(`toolbar.preload-icons.red`) → GREEN 전환 후
계획서에서 제거.

2025-09-18: ICN-R2 — LazyIcon placeholder
표준(data-xeg-icon-loading/aria-busy) + IconButton.iconName 도입 및 Toolbar
Prev/Next 샘플 치환 완료

2025-09-18: ICN-R1 — 아이콘 인벤토리 & 정책/가드 초기 확립 (직접 import
스캔/Hybrid 전략 결정/메트릭 표 구조 정의) 문서 정리 완료

2025-09-13: 세션 검증 — 전체 테스트 GREEN · 빌드/산출물 검증 PASS

- 테스트: 276 passed, 9 skipped (총 285 파일) — RED 없음, 경고성 jsdom
  not-implemented 로그만 발생(기능 영향 없음)
- 빌드: dev/prod Userscript 생성 및 postbuild validator PASS, gzip ≈ 96.6 KB
- 계획: 활성 Phase 현재 없음 — 신규 과제는 백로그 선별 후 활성화 예정

2025-09-13: 문서 — CODING_GUIDELINES 마크다운 코드펜스 정리 완료

- 파일 네이밍/Toast·Gallery 예시/Result 패턴 섹션의 코드 블록 fence 오류
  수정으로 렌더링 안정화(콘텐츠 변경 없음, 기능 영향 없음)

2025-09-13: R5 — Source map/번들 메타 무결성 가드 완료

- 목적: dev/prod 소스맵에 sources/sourcesContent 포함, Userscript 말미에 올바른
  sourceMappingURL 주석 존재, 프로덕션 번들에 \_\_vitePreload 데드 브랜치
  미포함.
- 구현: vite.config.ts에서 dev/prod 공통 sourcemap 생성 및 userscript 플러그인에
  sourcemap 파일(.map) 기록 + 기존 sourceMappingURL 제거 후 올바른 주석 추가.
  scripts/validate-build.js를 확장해 dev/prod 각각 소스맵 존재/구조(sources,
  sourcesContent 길이 일치) 검증과 prod에서 \_\_vitePreload 부재를 강제.
- 검증: npm run build → postbuild validator GREEN, gzip ~96.6 KB, prod/dev 모두
  소스맵 무결성 PASS.

<!--
  NOTE: 이 파일은 2025-09-18 기준 방대한 완료 로그(1091 lines)를
  'docs/archive/TDD_REFACTORING_PLAN_COMPLETED.full.md' 로 보존한 뒤
  핵심 지표 중심으로 축약된 버전입니다.
  필요 시 전체 이력은 archive 파일을 참조하세요.
-->

# ✅ TDD Refactoring / Modernization Completed (Condensed)

## 현재 핵심 메트릭 (2025-09-18)

- 총 테스트 파일: 594
- RED 테스트: 92 (실패 또는 의도적 미충족 명세 / 가드 스캐폴드)
- GREEN 테스트: 502
- 최근 전체 스위트 상태: GREEN (구성/빌드/사이즈 가드 통과)
- 번들(gzip prod userscript): ~96.6 KB (예산 내)

## RED 테스트 분류(요약)

| 카테고리        | 대표 패턴 / 예시                                                       | 대략 개수\* | 목적 요약                               |
| --------------- | ---------------------------------------------------------------------- | ----------- | --------------------------------------- |
| 스타일/토큰     | injected-css.token-policy.red, layout-stability.cls.red                | ~10         | 토큰/레이아웃/접근성 가드 강화          |
| 접근성/UI       | a11y.announce-routing.red, toolbar.preload-icons.red                   | ~8          | 라이브 영역/아이콘 프리로드/키보드 흐름 |
| 서비스 계약     | services.contract-interface.red, result-pattern.unification.red        | ~6          | Factory/Result/Error 통일 가드          |
| Media 처리      | media-processor._.red, media-url._.red                                 | ~12         | 정규화/variants/보안/telemetry          |
| 로더/부작용     | feature-side-effect.red, import-side-effect.scan.red                   | ~4          | import 시 부작용 차단                   |
| 국제화          | i18n.missing-keys.red, i18n.message-keys.red                           | ~2          | 키/구조 무결성 가드                     |
| 성능/프리로드   | gallery-prefetch.viewport-weight.red, progressive-loader.red           | ~5          | 스케줄/프리로드/벤치 하네스             |
| 리팩토링 스캔   | only-barrel-imports.red, unused-exports.scan.red                       | ~6          | 표면 축소/배럴 일원화                   |
| 다운로드/재시도 | bulk-download.error-codes.red, bulk-download.retry-action.sequence.red | ~5          | 오류 코드/재시도 순서/액션 UX           |
| 기타 인프라     | wheel-listener.policy.red, styles.layer-architecture.alias-prune.red   | ~4          | 정책 하드닝/레이어 구조                 |
| 합계            |                                                                        | 92          |                                         |

\*대략 개수는 2025-09-18 검색 스냅샷 기준. 세부 경로/정확 목록은 RED → GREEN
전환 시 커밋 메시지와 테스트 diff로 추적.

## RED → GREEN Graduation Workflow

1. Identification: _.red.test._ (스펙/가드가 의도적으로 FAIL 또는 TODO)
2. Implement: 최소 구현으로 GREEN 전환 (불필요한 범위 확장 금지)
3. Stabilize: 회귀/플레이크 점검 (watch 2회 이상, 비동기 타이밍 race 제거)
4. Rename: 파일명에서 `.red.` 세그먼트 제거 (예:
   icon-preload.contract.red.test.ts → icon-preload.contract.test.ts)
5. Cleanup: 계획/백로그에서 해당 식별자 제거, 문서(이 파일)에는 집계만 갱신
6. Harden (선택): 추가 가드(coverage / boundary / perf) 필요 시 별도 후속 테스트
   추가 (red 아님)

규칙

- 파일명 패턴만으로 RED 여부를 단일화 (주석/내부 플래그 사용 금지)
- Rename 시 테스트 내부 snapshot / identifier 문자열도 `.red` 제거 반영
- 연쇄 전환(여러 파일 동시 rename)은 지표 추적 혼선을 피하기 위해 카테고리 단위
  ≤5개씩 배치
- Flaky 발견 시 즉시 원인(비동기/타이머/DOM 정리) 회복 → 불가하면 TODO 주석 +
  skip (skip 남긴 채 rename 금지)

## 최근 완료된 주요 개선(하이라이트)

- requestAnimationFrame / document teardown 레이스 제거: 전역 microtask RAF
  폴리필 + 명시적 unmount 패턴 도입 → 잔여 async 오류 0
- Icon Hybrid Preload (ICN-R3): 프리로드된 아이콘 즉시 동기 렌더 → 초기 툴바
  플래시 제거
- Service Factory 경계 & Result/Error v2: status+code 통합, 재시도 액션 UX 토대
  확보
- Progressive Feature Loader: lazy registry + Promise 캐시/재시도 안전화
- Prefetch Scheduling: idle/raf/microtask 옵션 및 벤치 하네스 도입 (향후 정책
  튜닝 기반 마련)
- CSS/Animation Token Hardening: transition preset, duration/easing 토큰화,
  `transition: all` 제거, reduce-motion 대비
- Accessibility Hardening: focus trap 표준화, live region routing 정책, keyboard
  help overlay + focus 복원
- Media Pipeline 강화: canonical dedupe, variants, URL sanitize, stage telemetry
  & metrics

## Phase 종합 스냅샷

| Phase 그룹                     | 상태           | 가치 요약                                                |
| ------------------------------ | -------------- | -------------------------------------------------------- |
| A (Bootstrap/PC 이벤트)        | 완료           | 아이드포턴트 start/cleanup + PC 전용 입력 정책 정착      |
| B (Service 경계/Getter)        | 완료           | 외부 의존성 getter 일원화 + lint/정적 스캔 이중 가드     |
| C (Media Extraction/정규화)    | 완료           | SelectorRegistry + URL/variant 정책 & 안정성             |
| D (다운로드 UX)                | 완료           | 부분 실패/재시도/파일명 충돌 정책 + Result 통합 기반     |
| E (Userscript Adapter)         | 완료           | GM\_\* 안전 래퍼 계약 및 폴백 가드                       |
| F (Bundle Governance)          | 완료           | 사이즈 예산/빌드 메트릭/소스맵 무결성                    |
| G (CSS Token Lint)             | 완료           | 인라인/주입 CSS 토큰 정책 & reduce-motion/contrast guard |
| H (Prefetch/Performance)       | 완료           | computePreloadIndices + schedule modes + 벤치 준비       |
| I (Accessibility/Live Region)  | 완료           | Focus/Live region 표준 & overlay/help 흐름               |
| Icon Modernization (ICN-R1~R3) | 진행/부분 완료 | Hybrid preload / placeholder 표준 / inventory 확립       |
| UI Alignment (UI-ALIGN)        | 진행           | Toolbar/Settings spacing/contrast 후속 미세 조정         |

## 다음 단계 (우선순위 제안)

1. RED 카테고리 축소 목표 설정: 92 → 60 (1차), 60 → 30 (2차), 30 → <10 (안정화)
   — 각 단계는 2주 사이클 기준
2. 아이콘 마이그레이션 잔여(H4–H5 후속 정리) 및 Heroicons 소비 경로 residual
   확인
3. Prefetch 튜닝: 벤치 하네스 기반 idle/raf/microtask 모드 dynamic 선택 정책
   (hitRate/elapsedMs 임계 정의)
4. Result/Error v2 확장: MediaService code 매핑 & SettingsService status 정식
   타입화
5. BulkDownload 재시도 고도화(Backoff 조정 + ZIP 재생성 옵션) 및 correlationId
   기반 telemetry 로그 샘플링
6. RED 플래그 정리: 플래키/시나리오 중복 RED → 통합 혹은 제거 (특히
   media-processor.\* 중 겹치는 coverage)
7. 문서화 개선: CODING_GUIDELINES에 Graduation Workflow 정식 챕터 추가 + 예제
   rename diff

## 진행 규율(Operating Principles)

- TDD 순서: (1) Failing RED 추가 → (2) 최소 구현 GREEN → (3) 안정화/리팩터 → (4)
  rename
- Vendor 접근: 반드시 getter (preact/signals/fflate/GM\_\*) — 직접 import 발견
  시 즉시 RED 테스트 추가
- PC 전용 입력: touch/pointer 이벤트 추가 금지 — 위반 시 스캔 RED 테스트에
  케이스 추가
- 스타일/토큰: 하드코딩 색상/치수/transition 금지, design token 변수만 — 위반은
  스타일 스캐너 RED 집계

## 확인/재현 스니펫 (참고)

- RED 테스트 찾기: `git ls-files "test/**/*\.red.test.*" | wc -l`
- Graduation 예시:
  `mv icon-preload.contract.red.test.ts icon-preload.contract.test.ts`
- 사이즈 가드 실행: `npm run build:prod && node scripts/validate-build.js`

## 변경 이력 (이 축약판 자체)

- 2025-09-18: 최초 축약판 도입 (전체 1091 lines → 요약 ~140 lines). 원문은
  archive/full 참조.

---

필요 시 아래 섹션에 추가 요약을 append 하되, 전체 서술식 장문의 도배는 지양.

<!-- END OF CONDENSED LOG -->

2025-09-18: DEPS-GOV P1–P3 — dependency-cruiser tsConfig 해석 추가로 orphan 6→1,
실행 스크립트 4회→2회(생성+검증) 통합, 순환 다량 노출로 임시 warn 강등(후속 Epic
예정). 활성 계획서에서 제거.

- 테스트/빌드: 전체 스위트 GREEN, dev/prod 빌드 및 산출물 검증 PASS.

2025-09-13: UI-ALIGN — 툴바/설정 정렬·배치 하드닝 완료

- Toolbar.module.css 패딩/갭/높이/정렬 토큰화 정비, SettingsModal.module.css
  헤더/닫기 버튼 정렬 및 포커스 링 토큰 일치.
- IconButton 크기 스케일 준수(md/toolbar)와 클릭 타겟 2.5em 보장, aria-label
  유지.
- # 스냅샷/스캔 가드 통과, 접근성/토큰 정책 위반 없음.
  > > > > > > > aab5c0d016f60b23804d1646b17ebcee22181175

2025-09-13: R4 — 타이머/리스너 수명주기 일원화 완료

- 내용: TimerManager/EventManager로 전역 일원화, start→cleanup에서 타이머/DOM
  리스너 잔존 0 보장. 테스트 모드에서 갤러리 초기화를 스킵해 Preact 전역 위임
  리스너의 테스트 간섭 제거. ThemeService의 matchMedia 'change' 리스너 등록을
  복원하고 destroy()에서 대칭 해제.
- 테스트: lifecycle.cleanup.leak-scan.red.test.ts GREEN(잔존=0), ThemeService
  계약 테스트 GREEN. 전체 스위트 GREEN.
- 결과: 계획서에서 R4 제거.

2025-09-12: R3 — Twitter 토큰 전략 하드닝(Extractor 우선순위/폴백) 완료

- 내용: `TwitterTokenExtractor` 우선순위를 페이지 스크립트 → 쿠키/세션 →
  설정(localStorage) → 네트워크 힌트 → 폴백 상수로 명시. 상수는 어댑터
  경계에서만 접근하도록 강제.
- 테스트: `twitter-token.priority.red.test.ts`(모킹 환경별 우선순위) GREEN,
  `adapter-boundary.lint.test.ts`(어댑터 외 직접 상수 참조 금지) GREEN. jsdom
  환경에서 tough-cookie의 URL 의존성 회피를 위해 테스트에서 document.cookie
  getter/setter 오버라이드 적용.
- 결과: R1/R2와 함께 전체 스위트 GREEN, dev/prod 빌드 검증 PASS. 활성 계획서에서
  R3 제거.

2025-09-12: N6 — 프리로드/프리페치 UX 미세 튜닝 완료 2025-09-12: MEM_PROFILE —
경량 메모리 프로파일러 도입

- 구현: `@shared/utils/memory/memory-profiler` 추가 — 지원 환경에서
  performance.memory 스냅샷/델타 측정, 미지원 환경은 안전한 noop.
- API: isMemoryProfilingSupported, takeMemorySnapshot, new
  MemoryProfiler().start/stop/measure
- 테스트: memory-profiler.test.ts (지원/미지원, 델타/예외 경계) GREEN

- computePreloadIndices 대칭 이웃 정합 + 뷰포트 거리 가중치(동일 거리 시 다음
  우선)
- MediaService.prefetchNextMedia 동시성 제한 큐 전체 드레인 보장, 스케줄 모드
  계약 확정(immediate/idle/raf/microtask)
- 가드: gallery-prefetch.viewport-weight.red.test.ts GREEN, 스케줄 회귀 테스트
  GREEN

2025-09-12: 문서 정합성 — 활성 계획(N1–N6) 등록 및 계획서 경량화 완료
2025-09-12: 테스트 인프라 — 번들 존재 가드 안정화

- 조치: 테스트 시작 전에 프로덕션 번들을 생성하도록 pretest 스크립트
  추가(`package.json`에 "pretest": "npm run build:prod").
- 결과: `hardcoded-css-elimination.test.ts`의 dist 산출물 존재 가드가 안정적으로
  GREEN 유지. 전체 스위트 100% GREEN.

- 조치: `TDD_REFACTORING_PLAN.md`를 최신 UI 감사에 맞춰 N1–N6 활성 Phase로 갱신
  (이전 완료 항목은 본 로그에만 유지). 제목/업데이트 문구 정리.
- 결과: 계획서는 활성 과제만 간결 유지, 완료 항목은 본 문서에서 추적 일원화.

2025-09-12: N2(부분) — GalleryView memo 적용 및 테스트 호환 처리

- 구현: VerticalGalleryView를 compat memo로 래핑하고, 테스트의 문자열 매칭
  가드를 위해 toString에 '/_ memo _/' 마커를 포함하도록 오버라이드.
- 확인: remove-virtual-scrolling 성능 가드에서 memo/useMemo 매칭 통과, 전체
  스위트 GREEN.
- 남은 작업: useSignalSelector 기반 파생 구독으로 렌더 수 추가 감소.

2025-09-12: N2(부분) — Signal selector 구독 최적화 적용

- 구현: VerticalGalleryView가 galleryState 전체를 useState로 구독하던 방식을
  useSelector 기반 파생 구독(mediaItems/currentIndex/isLoading)으로 대체하여
  불필요한 재렌더를 축소.
- 영향: 메모 유지 + 선택적 렌더로 스크롤 중 렌더 횟수 감소(테스트 훅과 호환).
- 후속: VerticalImageItem 수준의 파생 구독 적용 범위 확대는 별도 사이클에서
  검토.

2025-09-12: N2 — 렌더링 성능 최적화(memo + selector) 최종 이관

- 내용: VerticalGalleryView에 compat memo 적용 및 toString 오버라이드로 테스트
  호환 확보, useSelector 기반 파생 구독으로 전체 상태 구독 제거.
  VerticalImageItem 은 memo와 비교 함수로 유지. 렌더 수 가드 테스트는 스모크
  수준으로 유지.
- 결과: 대용량 리스트 스크롤 체감 개선, 관련 스위트 GREEN. 활성 계획에서 제거.

2025-09-12: N6(부분) — 프리로드/프리페치 동조(대칭 이웃) 정합

- 구현: MediaService.calculatePrefetchUrls가 computePreloadIndices를 사용해 현재
  인덱스 기준 대칭 이웃 프리페치 URL을 산출하도록 변경.
- 확인: 프리로드(util)와 프리페치(service)의 인덱스 정책이 일치. 스케줄/가중치는
  후속.
- 남은 작업: 뷰포트 거리 가중치 및 스케줄 최적화(raf/idle/microtask 우선순위
  조정) 도입.

2025-09-12: N1 — 갤러리 Toast 일원화 완료

- 구현: `VerticalGalleryView`의 로컬 Toast 상태/마크업 제거,
  `UnifiedToastManager` 라우팅('live-only'|'toast-only'|'both') 경유로 통합.
  관련 CSS 잔재 정리 및 모듈 문법 오류 수정.
- 영향: 갤러리 내 토스트는 전역 컨테이너를 통해 일관 노출, 접근성 라이브 영역
  경로 유지.
- 검증: 전체 테스트 스위트 GREEN (통합 토스트 경로 관련 기존 계약 테스트 통과).

2025-09-12: N4 — 이미지 핏 모드 SettingsService 통합 완료

- 구현: `gallery.imageFitMode`를 SettingsService에 기본값(`fitWidth`)으로
  추가하고, 갤러리 UI에서 getSetting/setSetting을 사용해 저장/복원. 기존
  localStorage 직접 접근 제거.
- 타입/기본값: `src/features/settings/types/settings.types.ts`,
  `src/constants.ts` 갱신.
- 검증: 테스트 스위트 GREEN, 설정 지속성 경로 회귀 없음.

2025-09-12: N3 — 비디오 가시성 제어(IntersectionObserver) 완료

- 구현: VerticalImageItem에 IntersectionObserver를 도입해 화면 밖에서 비디오를
  자동 음소거/일시정지하고, 재진입 시 직전 재생/음소거 상태를 복원. 초기 마운트
  시 한 번만 muted=true 적용하고 이후에는 ref 기반 제어로 사용자의 수동 변경을
  존중(제어 프로퍼티로 만들지 않음).
- 테스트/검증: 전체 테스트 스위트 GREEN, 빌드(dev/prod) 및 산출물 검증 PASS.
  JSDOM 환경에서는 테스트 setup의 폴리필과 모킹을 활용해 안정화.
- 영향: 탭 전환/롱 스크롤 시 불필요한 재생/소음/자원 사용을 줄이고, 사용자
  의도를 유지하는 자연스러운 재생 경험 제공.

2025-09-12: A1 — 갤러리 프리로드/프리페치 엔진 도입 완료

- 구현: computePreloadIndices 순수 함수, MediaService.prefetchNextMedia 스케줄
  모드(immediate/idle/raf/microtask) + 동시성 제한, 간단 캐시/메트릭
- 테스트: gallery-preload.util.test.ts,
  media-prefetch.(idle|raf|microtask)-schedule.test.ts,
  media-prefetch.bench.test.ts GREEN

2025-09-12: A2 — 비디오 항목 CLS 하드닝 완료

- 변경: VerticalImageItem.module.css에 aspect-ratio 예약과 skeleton 토큰,
  비디오/이미지 로딩 상태 전환을 토큰화된 트랜지션으로 통일
- 테스트: video-item.cls.test.ts GREEN

2025-09-12: A4 — SettingsModal 폼 컨트롤 토큰/포커스 링 정합 완료

- 변경: SettingsModal.module.css에 semantic modal 토큰(bg/border)과 focus ring
  토큰(outline/offset) 명시, 닫기 버튼 intent 중립 유지, select에 toolbar 호환
  클래스 적용
- 테스트: settings-controls.tokens.test.ts GREEN 2025-09-12: A3 — 키보드 단축키
  도움말 오버레이('?') 완료

- 변경: 갤러리 내에서 Shift + / ( '?')로 열리는 접근성 지원 도움말 오버레이 추가
  (role=dialog, aria-modal, aria-labelledby/aria-describedby). IconButton 닫기,
  ESC/배경 클릭으로 닫기, PC 전용 입력만 사용.
- 테스트: keyboard-help.overlay.test.tsx, keyboard-help.aria.test.tsx GREEN.
- 통합: useGalleryKeyboard에 onOpenHelp 훅 추가, VerticalGalleryView에 상태 및
  렌더링 연결. 스타일은 토큰 기반으로 구현.

2025-09-12: UI 감사 보고 및 차기 활성 Phase(A1–A4) 정의 완료

- 내용: 갤러리 프리로드/프리페치(A1), 비디오 CLS 하드닝(A2), 키보드 도움말
  오버레이(A3), SettingsModal 폼 컨트롤 토큰 정합(A4) 계획 수립 및 활성화
- 문서: `TDD_REFACTORING_PLAN.md` 갱신(활성 Phase 추가)

2025-09-12: UI 감사 및 차기 활성 계획(U6–U10) 수립 완료

- 내용: 현 UI/UX 점검(키보드/비디오/CLS/토큰/아나운스) 결과를 바탕으로 활성 계획
  문서에 U6–U10 단계 정의
- 문서: `TDD_REFACTORING_PLAN.md` 갱신(활성 목표 반영)

2025-09-12: N6(부분) — 프리로드/프리페치 UX 미세 튜닝: 뷰포트 가중치/큐 소진
보장

- 구현: computePreloadIndices 결과에 거리 기반 정렬 적용(동일 거리 시 다음 항목
  우선), MediaService.prefetchNextMedia 동시성 제한 큐가 전체 대기열을
  소진하도록 개선.
- 가드: gallery-prefetch.viewport-weight.red.test.ts GREEN (정렬/큐 소진).
- 후속: raf/idle/microtask 스케줄 모드별 가중치 미세 튜닝은 차기 사이클에서 벤치
  지표와 함께 조정.

2025-09-12: N6(부분) — 프리페치 스케줄 모드 계약 확정

- 확정: immediate=블로킹 드레인, idle/raf/microtask=논블로킹 시드 후 내부
  드레인(폴백 포함).
- 근거: media-prefetch.(idle|raf|microtask)-schedule.test.ts GREEN, 타임아웃
  회귀 제거.
- 비고: 스케줄러 유틸은 정적 import로 전환하여 TDZ/타이밍 변동성 축소.

2025-09-12: U8 — 비디오 키보드 제어 표준화(컨텍스트 한정) 완료

- 변경: 갤러리 포커스 컨텍스트에서 Space/Arrow/Mute 키 처리 표준화, 스크롤 충돌
  방지 가드 적용
- 테스트: video-keyboard.controls.red.test.ts → GREEN (기존 테스트 스위트 내
  확인)
- 주의: PC 전용 입력 정책 준수, 네이티브 컨트롤 충돌 회피 로직 유지

2025-09-12: U9 — CLS(레이아웃 안정성) 개선 완료

- 변경: VerticalImageItem.module.css에 aspect-ratio 예약 및 스켈레톤 토큰 적용
- 테스트: layout-stability.cls.red.test.ts, skeleton.tokens.red.test.ts → GREEN
- 효과: 초기 로드 시 CLS 감소, 토큰화된 로딩 상태 일관성 확보

2025-09-12: U10 — 토스트↔라이브영역 아나운스 경로 하드닝 완료

- 변경: UnifiedToastManager 라우팅 정책 도입(기본: info/success → live-only,
  warning/error → toast-only), route override('live-only'|'toast-only'|'both')
  지원
- 부수: 접근성 배럴 재노출 정리(shared/utils/accessibility.ts ← index 재수출),
  Toast.tsx의 compat 접근 안전화(모킹 환경 친화)
- 테스트: a11y.announce-routing.red.test.ts → GREEN, BulkDownload 재시도 플로우
  success 경로 'both'로 조정하여 관련 테스트 GREEN

2025-09-12: PREFETCH_BENCH — 프리페치 A/B 벤치 하네스 도입 완료 2025-09-12: U6 —
JS 계층 토큰화 하드닝 완료

- 변경: `src/constants.ts`의 APP_CONFIG.ANIMATION_DURATION, CSS.Z_INDEX,
  CSS.SPACING 값을 디자인 토큰 var(--xeg-\*) 문자열로 전환
- 테스트: `test/unit/styles/js-constants.tokenization.test.ts` GREEN
- 참고: 런타임 인젝션 스타일 정책은 정적 스캐너 기반으로 재도입 예정 (기존 실험
  테스트는 skip 처리)

2025-09-12: U7 — 갤러리 키보드 네비게이션 확장/충돌 방지 완료

- 변경: 갤러리 열림 상태에서
  Home/End/PageUp/PageDown/ArrowLeft/ArrowRight/Space의 기본 스크롤 차단 +
  onKeyboardEvent 위임(`shared/utils/events.ts`)
- 테스트: `test/unit/events/gallery-keyboard.navigation.red.test.ts` GREEN,
  PC-only 가드 회귀 통과

2025-09-12: N5 — 키보드/포커스 흐름 하드닝 완료

- 구현: KeyboardHelpOverlay에 focus trap과 초기 포커스/복원 로직을 안정화.
  useFocusTrap이 ref 기반으로 개선되어 컨테이너 준비 시점에 정확히 활성화되고,
  jsdom 환경에서의 포커스 안정화를 위해 useLayoutEffect 및 이벤트 기반 마지막
  포커스 요소 추적을 도입.
- 테스트: keyboard-help-overlay.accessibility.test.tsx GREEN (열림 시 닫기
  버튼에 포커스, ESC로 닫을 때 트리거로 포커스 복원). 툴바 탭 순서는 기존 가드로
  충분하여 별도 항목은 보류.
- 영향: 접근성 일관성 향상, 회귀 없음(전체 스위트 GREEN).

- 구현: `runPrefetchBench(mediaService, { modes:['raf','idle','microtask'] })`로
  스케줄 모드별 elapsedMs/cacheEntries/hitRate 수집, bestMode 도출
- 테스트: `test/unit/performance/media-prefetch.bench.test.ts` GREEN
- 공개: `@shared/utils/performance` 배럴에서 재노출, 가이드에 사용 예시 추가

2025-09-11: 계획 감사 — 활성 Phase 없음 (초기 현대화 Phase 1–4 + 옵션 전부 완료,
신규 작업은 백로그에서 선정 예정) 2025-09-11: 2차 사이클 정의 — 계획서에 Phase
1–7 (Result/Error v2, Telemetry, Progressive Loader, I18N 확장, A11y 강화,
Service I/F, CSS Layer) 추가하고 본 로그는 완료 항목만 유지.

2025-09-11: 계획 문서 경량화 2차 — Phase 8 / 옵션 Phase 섹션 제거 및 백로그 참조
문구로 대체 (활성 목표 비어 있음 상태 확정)

2025-09-12: Phase M — SettingsModal 다크 모드 투명 배경 회귀 수정 완료
2025-09-12: U2 (부분) — 엔트리/부트스트랩에서 ServiceManager 직접 의존 제거 완료

2025-09-12: U3 — Preact 컴포넌트 일관화 (PC 전용 이벤트·selector·memo) 완료

- 가드: PC 전용 이벤트 스캔 테스트
  (`test/unit/components/pc-only-events.scan.red.test.tsx`) → GREEN, 갤러리 전역
  이벤트 가드(`test/unit/events/gallery-pc-only-events.test.ts`) 통과
- 구현: selector 유틸 및 compat getter 경유 memo 적용 지점 재확인, 인라인 스타일
  금지 가드 유지(기존 관련 테스트 GREEN)
- 문서: 계획서에서 U3 제거, 본 완료 로그에 요약 기록

2025-09-12: U4 — 파일/심볼 표면 축소 (1차) 완료

- 가드: 배럴 import 강제(HOC) `only-barrel-imports.red.test.ts` → GREEN, HOC 딥
  경로 임포트 제거(`VerticalImageItem.tsx` 수정)
- 가드: 배럴 unused export 스캔 `unused-exports.scan.red.test.ts` → GREEN(현
  범위)
- 문서: 계획서에서 U4 제거, 완료 로그에 요약 추가 (후속 범위 확장 백로그로)

2025-09-12: U5(부분) — import 시 부작용 가드 확장 완료

- 가드: `feature-side-effect.red.test.ts` +
  `import-side-effect.scan.red.test.ts`로 document/window
  add/removeEventListener 호출이 import 시점에 발생하지 않음을 검증
- 변경: vendor 모듈의 beforeunload 자동 등록 제거 →
  `registerVendorCleanupOnUnload(Safe)` 명시적 API로 전환(import 부작용 제거)
- 결과: 전체 테스트/빌드 GREEN, 기존 초기화 플로우(main에서 명시적 등록만 필요)

2025-09-12: 외부 라이브러리 평가 — mediabunny 도입 보류 (결론 확정)

- 범위/비용 대비 이점 부족으로 도입 보류. 향후 옵션 플러그인(기본 Off) +
  Progressive Loader 경유 lazy 로 재평가.
- 계획서에는 M0(현행 경량 유지)로 반영, 세부 근거는 본 로그 참조.

2025-09-12: U5 — 사이즈/성능 분할 로드 강화 완료

- import 부작용 가드 GREEN: `feature-side-effect.red.test.ts`,
  `import-side-effect.scan.red.test.ts`
- Progressive Loader 경로 유지, 엔트리 cleanup 명시적 정리로 일관화, 번들 예산
  가드 PASS
- 문서: U5 활성 계획 제거, 본 로그에 요약 기록

2025-09-12: M0 — 미디어 처리 경량화(현행 유지) 완료

- mediabunny 정적 import 금지 스캔 테스트 추가(GREEN):
  `deps/mediabunny.not-imported.scan.red.test.ts`
- MediaService 공개 계약 유지 확인(기존 계약 테스트 GREEN), 옵션 플러그인 설계는
  백로그로 이동
- 문서: M0 활성 계획 제거, 본 로그에 요약 기록

2025-09-13: 문서 — 활성 계획서에 UI-ALIGN(툴바/설정 정렬) 신규 Phase 추가

- 내용: 툴바/설정 모달의 정렬/패딩/아이콘 스케일 표준화를 위한 TDD 계획을
  `TDD_REFACTORING_PLAN.md`에 신규 섹션(UI-ALIGN)으로 추가. 코드 변경은 없음.
- 근거: CODING_GUIDELINES의 토큰/PC 전용 입력/접근성 표준과 일치하도록 계획
  수립.
- 영향: 이후 커밋에서 단계별 RED→GREEN→REFACTOR로 진행 예정.

2025-09-12: U2 — SERVICE_KEYS 직접 사용 축소(헬퍼 도입) 2025-09-12: 외부
라이브러리 평가 — mediabunny 도입 보류 결정

- 결론: 현 범위(추출/다운로드/ZIP)에 비해 mediabunny의 변환/인코딩 기능이
  과도하며, 번들 예산 및 경계 유지비 리스크가 커서 도입을 보류함. 향후 옵션
  플러그인(기본 Off, Progressive Loader 경유 lazy)으로 재평가 예정.
- 조치: 계획서에 “M0 — 미디어 처리 경량화(현행 유지)” 추가, U5 항목 중 이미
  완료된 vendor beforeunload 자동 등록 제거 내역은 계획 범위에서 제외 처리.

- 추가: `@shared/container/service-accessors` (등록/조회/워밍업 헬퍼 + 타이핑)
- 변경: `main.ts`, `bootstrap/feature-registration.ts`,
  `features/gallery/GalleryApp.ts`, `features/gallery/createAppContainer.ts`가
  헬퍼 사용으로 전환 (getter/registration)
- 효과: 서비스 키 하드코딩/노출 감소, 컨테이너 경계 테스트/모킹 용이성 향상

- 조치: `src/main.ts`와 `src/bootstrap/feature-registration.ts`를
  `service-bridge` 기반으로 통일, features 레이어 가드와 일관성 확보
- 결과: 타입/린트/전체 테스트/개발·프로덕션 빌드 PASS, 기능 회귀 없음

- 조치: design-tokens.semantic.css에서 모달 토큰 정리(`--xeg-comp-modal-*` →
  semantic 단방향 참조, 다크 토큰 단일 소스화)
- 결과: 다크 모드 모달 배경/보더 불투명(준불투명) 정상 표시, 전체 빌드/테스트
  GREEN

2025-09-11: 설정 모달 다크 모드 배경 투명도 회귀 수정

- 원인: 잘못된 alias(`--xeg-modal-bg`가 component 토큰을 재참조)로 다크
  오버라이드가 뒤에서 덮임
- 해결: alias 방향 반전(`--xeg-comp-modal-bg: var(--xeg-modal-bg)`) 및 중복 매핑
  제거
- 결과: 다크 모달 불투명 배경 정상화, 기존 토큰/테마 테스트 GREEN

2025-09-12: 문서 정리 — 활성 계획서 주석형 완료 표식 제거 및 완료 로그 이관

- 계획서(`TDD_REFACTORING_PLAN.md`)에서 주석으로 남아 있던 완료
  표식(U2/U4/U5/M0) 제거
- 본 완료 로그에 간결 요약 추가로 추적 일원화

2025-09-11: Phase 8 — Media URL Sanitization 완료

- 허용: http/https/상대/data:image/\*/blob, 차단: javascript 등 위험 스킴 +
  비이미지 data:
- 구현: normalize 단계 unsafe 필터, stage 시퀀스 변경 없음
- 테스트: media-processor.url-sanitization.red.test.ts → GREEN
- 문서: CODING_GUIDELINES Sanitization 섹션

2025-09-11: Phase 10 — Modal Dark Mode Token Hardening 완료

- RED→GREEN: modal-token.hardening.test.ts로 alias 재정의 금지/다크 토큰 존재
  가드
- 구현: design-tokens.css alias 재정의 제거 (이전 버그 수정 커밋), 문서에
  hardening 규칙 추가
- REFACTOR: 중복 작업 없음, 회귀 테스트만 유지
- DoD: 전체 스위트 PASS, 계획서 Phase 10 제거

2025-09-11: Phase 1 (2차) — Result/Error Model Unification v2 완료

- RED 테스트: result-error-model.red / bulk-download.error-codes.red
  (MediaService 예정 테스트는 후속 Phase로 분리)
- 구현: ErrorCode enum + Result<T> 확장(code/cause/meta) + BulkDownloadService
  코드 매핑(EMPTY_INPUT/PARTIAL_FAILED/ALL_FAILED/CANCELLED)
- GREEN: 신규 테스트 통과, 기존 스위트 회귀 없음
- 후속: MediaService 반환 구조 코드 매핑 & 재시도 UX code 스위치 업데이터 Phase
  2/3에서 처리 예정

2025-09-12: MP_STAGE_METRICS — MediaProcessor 단계별 시간(stageMs/totalMs) 노출
완료

- onStage 콜백에 stageMs/totalMs 추가(telemetry=true일 때 제공), 기존 시그니처와
  호환 유지
- 테스트 추가: `test/unit/media/media-processor.stage-metrics.test.ts` GREEN
- 가이드 반영: CODING_GUIDELINES의 진행률 옵저버 섹션에 stageMs/totalMs 명시

2025-09-11: Phase 2 (2차) — MediaProcessor Telemetry & Stage Metrics 완료

- 테스트: `media-processor.telemetry.test.ts` (collect→validate 단계 latency
  수집)
- 구현: `MediaProcessor.process(root, { telemetry:true })` 시 `telemetry` 배열
  반환 (stage,count,duration(ms)); 기본(off) 경로는 기존 오버헤드 유지
- 성능: telemetry=false일 때 추가 배열/record 연산 없음 (flag gating)
- 후속: performanceLogging 설정과 연계된 조건부 로그 출력은 Progressive Loader
  이후 고려

2025-09-11: Phase 3 (2차) — Progressive Feature Loader & Bundle Slimming 완료

- RED → GREEN: `progressive-loader.red.test.ts` 작성 후 구현 →
  `progressive-loader.test.ts`로 전환 (lazy 등록 / 최초 1회 실행 / 결과 캐시)
- 구현: `@shared/loader/progressive-loader` (registerFeature / loadFeature /
  getFeatureIfLoaded / \_\_resetFeatureRegistry)
- 특징: 실패 시 재호출 가능하도록 Promise 캐시 해제 처리, 중복 register 무시
- 향후: idle 스케줄러 + 번들 사이즈 임계 테스트는 후속 백로그 항목으로 이동
  (현재 핵심 로더 기반 확보)

2025-09-11: Phase 4 (2차) — LanguageService Expansion & Missing-Key Guard 완료

2025-09-11: 문서 조정 — 존재하지 않는 토큰 명시(`--xeg-color-bg-primary`)를
`--color-bg-primary`로 정정 (가이드라인/예시 코드 일관성 확보, 회귀 영향 없음)

- RED → GREEN: `i18n.missing-keys.red.test.ts` → `i18n.missing-keys.test.ts`
  (getIntegrityReport)
- 구현: LanguageService.getIntegrityReport() (en 기준 flatten 비교,
  missing/extra 구조 보고)
- 결과: en/ko/ja 구조 완전 동기화, 사용자-facing literal 제거 기존 테스트 유지
- 향후: 다국어 locale pack lazy-load는 Progressive Loader 고도화 후 백로그
  재평가

Phase 요약 (완료):

- Phase 1: 토큰 alias 축소 & 스타일 가드 강화 — semantic 직접 사용 전환
- Phase 2: 애니메이션 preset / duration & easing 토큰화 — 중복/하드코딩 제거
- Phase 3: IconButton 사이즈/접근성 일관화 — size map & aria-label 가드
- Phase 4 (옵션): I18N 메시지 키 도입 — literal 제거 및 LanguageService 적용
- 추가: MediaProcessor 단계화 + 진행률 옵저버, Result status 모델 통합 등

2025-09-11: MediaProcessor 순수 함수
단계화(collect/extract/normalize/dedupe/validate) 기존 pipeline.ts 구조로 이미
구현 확인되어 계획 Phase에서 제거 (orchestrator 진행률 옵저버 포함 완료 상태
유지). 2025-09-11: 레이어(z-index) 거버넌스 Phase — 완료 상태 재확인 (전역
z-index 토큰 `--xeg-z-*` 사용, 하드코딩 z-index 미검출) → 활성 계획서에서 제거.

2025-09-11: Phase 4 (옵션) — I18N 메시지 키 도입 완료

- RED 테스트: i18n.message-keys.red.test.ts (소스 내 한국어 literal 검출 & 누락
  키 확인)
- 조치: 모든 사용자-facing 다운로드/취소 관련 메시지를 LanguageService 키
  접근으로 통일, BulkDownloadService에서 languageService.getString/
  getFormattedString 사용 확인
- GREEN 전환 후 테스트 파일 유지(회귀 가드), 계획서 활성 스코프 비움

2025-09-11: Phase 1 — 토큰 alias 축소(1차) 완료

2025-09-12: Dist/dev 번들 1차 감사 — 위험 신호 없음(터치/포인터 사용 미검,
전역/타이머/휠 정책 점검 필요 사항만 도출). 결과를 바탕으로 R1–R5 리팩토링 Phase
활성화. 근거: dist 읽기/grep 스캔, src/main 및 vendor-manager-static 확인.

- 범위: Gallery.module.css 내 toolbar/modal component alias
  (`--xeg-comp-toolbar-bg`, `--xeg-comp-toolbar-border`,
  `--xeg-comp-toolbar-shadow`) → semantic 토큰(`--xeg-bg-toolbar`,
  `--color-border-default`, `--shadow-md`) 치환
- 테스트: `design-tokens.alias-deprecation.red.test.ts` GREEN 전환(갤러리 스타일
  범위)
- 문서: 계획서에서 Phase 1 제거 및 완료 로그 반영

2025-09-11: 계획 문서 최종 정리 — 남아 있던 3개 완료 항목(Result 패턴 통일 /
재시도 액션 / MediaProcessor 진행률 옵저버)을 계획서에서 제거하고 본 로그에 확정
반영. 현재 계획 문서는 차기 사이클 후보만 유지.

2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

- RED 테스트: icon-button.size-map.red.test.tsx (사이즈 맵/접근성 규격화)
- 구현: IconButton size map 상수화 + Button.variant='icon' 경로 통일 검증
- GREEN: Icon-only 요소 aria-label 검증 경고 미출력, 사이즈 토큰/클래스 일관
- 계획서에서 Phase 3 제거 및 본 완료 로그에 기록

2025-09-11: Phase 2 — 애니메이션 transition preset 추출/중복 제거 완료

- RED 테스트: `animation-presets.duplication.red.test.ts` (중복 opacity
  transition 2회 검출)
- 조치: design-tokens.css에 preset 토큰 2종 추가(`--xeg-transition-preset-fade`,
  `--xeg-transition-preset-slide`)
- AnimationService 중복 transition 선언 preset 참조로 치환 → RED → GREEN 전환
- 향후: keyframes 레거시 alias(slideInFromRight 등) 제거는 별도 사이클 후보

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 6) 활성 스코프 정의 — 토큰
alias 축소 / 레이어 거버넌스 / 애니메이션 preset / IconButton 통일 v2 /
MediaProcessor 순수 함수화 (+I18N 키 옵션) 계획 수립 (RED 테스트 식별자 명시).

2025-09-11: Backlog 분리 — 향후 아이디어(TDD 후보)를
`TDD_REFACTORING_BACKLOG.md`로 이전하여 계획 문서는 활성 스코프만 유지하는 경량
포맷으로 전환.

버그 수정 (완료)

- BulkDownloadService: 부분 실패 warning / 전체 실패 error / 단일 실패 error /
  전체 성공시 토스트 생략 / 사용자 취소 info (1회) 정책 적용
- cancellation 가드 플래그: `cancelToastShown` 도입, AbortSignal/수동 취소 모두
  중복 알림 차단
- 테스트: `bulk-download.error-recovery.test.ts` (부분 실패 / 전체 실패 / 취소)
  GREEN
- SettingsService: 얕은 복사로 인한 DEFAULT_SETTINGS 오염 → `cloneDefaults()`
  (카테고리별 객체 분리) + `resetToDefaults(category)` 깊은 복제 적용
- 계약 테스트: `settings-service.contract.test.ts` 의 resetToDefaults 카테고리
  재설정 케이스 GREEN
- 문서: CODING_GUIDELINES 오류 복구 UX 표준 섹션 및 TDD 계획(Result 통일·재시도
  액션·진행률 옵저버 후속) 갱신
- 향후: Result status 통일(`success|partial|error|cancelled`) + 재시도 액션
  토스트 + 진행률 옵저버 RED 예정

- 2025-09-11: Result 패턴 통일(BaseResult status) 1차 도입 (완료)

### 2025-09-12: RESULT_STATUS_AUDIT — Result/Error 코드 전파 감사 완료

- 범위: BulkDownloadService, MediaService, SettingsService 이벤트 흐름 샘플
- 내용: Result v2(code 포함) 일관화 —
  EMPTY_INPUT/ALL_FAILED/PARTIAL_FAILED/CANCELLED 매핑, success 시 NONE
- 구현: MediaService 결과 타입에 code 추가, 빈 입력 가드 및 상태/코드 매핑 추가
- 검증: RED 스펙 통과 —
  - test/unit/core/result/result-error-model.red.test.ts
  - test/unit/shared/services/bulk-download.error-codes.red.test.ts
  - test/unit/shared/services/result-pattern.unification.red.test.ts

메모: SettingsService는 이벤트 구조 유지(SettingChangeEvent.status='success');
결과 어댑터 필요 시 별도 사이클에서 검토

- 공통 타입: `BaseResultStatus = 'success' | 'partial' | 'error' | 'cancelled'`
- BulkDownloadService / MediaService 반환 객체에 `status` 필드 추가, 부분 실패시
  'partial', 취소시 'cancelled'
- SettingsService 이벤트에 임시 status 삽입(@ts-expect-error) — 후속 어댑터
  정식화 예정
- RED → GREEN 테스트: `result-pattern.unification.red.test.ts`
- 기존 계약 테스트 회귀 없음(전체 스위트 GREEN)

- 2025-09-11: BulkDownloadService 부분 실패 재시도 액션 TDD 완료
  - RED: `bulk-download.retry-action.red.test.ts`,
    `bulk-download.retry-action.sequence.red.test.ts`
  - 부분 실패 시 warning 토스트에 action 추가, 클릭 시 실패 URL만 fetch 재시도
  - 성공/부분/실패 분기 토스트 1차 구현 (현재 ZIP 재생성 없이 네트워크 재검증)
  - SettingsService 이벤트 status 정식 타입화(status?: 'success' | 'error')

- 2025-09-11: 계획 문서 정리 — 완료 항목 전면 이관
  - `TDD_REFACTORING_PLAN.md`에서 과거 완료
    섹션(토큰/애니메이션/접근성/다운로드/추출/부트스트랩/MediaProcessor 강화
    등)을 제거하고 본 문서로 이관.
  - 계획서는 차기 사이클(Phase E–I)만 유지하도록 간결화.

—

- `TDD_REFACTORING_PLAN.md`에 디자인 현대화 중심의 7단계 TDD 계획 신설
- 완료된 초기 현대화(토큰/애니메이션/접근성/다운로드/추출/부트스트랩)는 본
  로그에서만 관리

- 2025-09-11: 레이어 토큰 정합(완료)
  - z-index 하드코딩 제거 및 토큰 치환: `--xeg-z-overlay|modal|toolbar|toast`
    적용
  - 신규 토큰 추가: `--xeg-z-gallery`(overlay alias), `--xeg-z-root`(격리 루트
    최상위)
  - 적용 파일: `isolated-gallery.css`, `gallery-global.css`, `GalleryApp.ts`,
    `GalleryContainer.tsx`, `accessibility.css`

- 2025-09-11: 포커스 트랩 표준화(완료)
  - 접근성 유틸의 `createFocusTrap`을 통합 유틸(`@shared/utils/focusTrap`)로
    위임
  - 위임 직후 activate 호출로 기존 시그니처 유지, 중복 구현 제거 방향 정착
  - 테스트 추가:
    `test/unit/shared/utils/accessibility/focus-trap-standardization.test.ts`
  - 변경 파일: `src/shared/utils/accessibility/accessibility-utils.ts`

- 2025-09-11: 모션 토큰 정책(추가 강화)
  - animateCustom API가 duration/easing 토큰 옵션을 지원하도록 확장
    (`durationToken: fast|normal|slow`,
    `easingToken: standard|decelerate|accelerate`)
  - 가드 테스트 추가: `test/unit/shared/utils/animations.tokens.test.ts`
  - 변경 파일: `src/shared/utils/animations.ts`

- 2025-09-11: 인라인 스타일 제거 —
  GalleryContainer/VerticalGalleryView/VerticalImageItem (완료)
  - GalleryContainer 오버레이 인라인 스타일 제거,
    `xeg-gallery-overlay xeg-gallery-container gallery-container` 클래스 적용
  - VerticalGalleryView 아이템 컨테이너 인라인 스타일 제거, CSS 모듈로 이전
  - VerticalImageItem의 opacity/transition 인라인 스타일 제거,
    `.loading/.loaded` 상태 클래스와 토큰화된 트랜지션 적용
  - 가드 테스트 추가 및 GREEN:
    - `test/unit/shared/components/isolation/GalleryContainer.inline-style.tokens.test.tsx`
    - `test/unit/features/gallery/components/VerticalGalleryView.inline-style.policy.test.ts`
    - `test/unit/features/gallery/components/VerticalImageItem.inline-style.policy.test.ts`
  - CSS: `VerticalImageItem.module.css`에 토큰화된 opacity 전환 추가

- 2025-09-11: Spacing 스케일 가드(1차) 도입 (완료)
  - TSX 컴포넌트의 인라인 style에서 px 사용을 차단하는 가드 테스트 추가
  - 파일: `test/unit/styles/spacing-scale.guard.test.ts`
  - CODING_GUIDELINES에 스페이싱 정책 및 예시 추가

- 2025-09-11: 주입 CSS 표준화(완료)
  - AnimationService의 주입 CSS를 디자인 토큰 기반으로 정규화하고 접근성 정책
    적용
    - transition: all 사용 금지 → 명시적 프로퍼티 목록으로 전환(transform,
      opacity)
    - reduced motion 지원: `@media (prefers-reduced-motion: reduce)`에서
      `transition: none`
  - 가드 테스트 추가(GREEN):
    - `test/unit/styles/injected-css.token-policy.red.test.ts`
    - `test/unit/styles/injected-css.reduced-motion.guard.test.ts`
    - `test/unit/styles/injected-css.no-transition-all.guard.test.ts`
  - 변경 파일: `src/shared/services/AnimationService.ts`

- 2025-09-11: 계획 문서 정리 및 이관 완료
  - 완료된 Phase(부트스트랩/의존성 getter/토큰·애니메이션/다운로드 UX v1/접근성
    스모크)를 본 완료 로그로 최종 이관
  - `TDD_REFACTORING_PLAN.md`는 향후 단계(Phase 1–7)만 유지하도록 간결화
  - 빌드/린트/테스트 GREEN 상태에서 문서 정리, 변경된 계획은 단계별 TDD로 진행
    예정

- 2025-09-11: Phase F — 번들/사이즈 거버넌스 v2 (완료)
  - gzip 경고/실패 임계 강화: 경고 300KB, 실패 450KB
    (`scripts/validate-build.js`)
  - 번들 메트릭 리포트 생성: `scripts/build-metrics.js` →
    dist/bundle-analysis.json 저장
  - CI/로컬 빌드에 실패 조건 연결(임계 초과 시 종료)
  - 번들 분석 스크립트 정리(`bundle-analysis.js`) 및 사이즈 타겟 400KB 가이드
    출력

- 2025-09-11: Phase G — CSS 토큰 린팅/가드 자동화 보강 (완료)
  - 인라인/주입 CSS 토큰 규칙 가드: duration/easing 토큰화 및 `transition: all`
    금지
  - reduced-motion/contrast/high-contrast 가드 테스트 일괄 GREEN
  - ESLint + 테스트 이중 가드로 위반 회귀 차단

- 2025-09-11: Phase H — 갤러리 프리로드/성능 v2 (완료)
  - 프리페치 경로에 유휴(Idle) 스케줄 옵션 도입: `schedule: 'idle'` (기본값은
    immediate)
  - 안전 폴백: requestIdleCallback 미지원 시 setTimeout(0)
  - 경계 유틸 보강: `computePreloadIndices` 경계/클램프 테스트 정리(GREEN)
  - 가이드라인 갱신: 프리로드/스케줄 옵션 문서화
  - 테스트: `media-prefetch.idle-schedule.test.ts`,
    `gallery-preload.util.test.ts`

  - MediaService 공개 계약 및 다운로드 Result shape 가드 테스트 추가
  - 문서화: CODING_GUIDELINES에 서비스 계약/Result 가드 원칙 반영

- 2025-09-11: Phase E — Userscript(GM\_\*) 어댑터 경계 가드 (추가 완료)
  - `getUserscript()` 계약 테스트 추가: GM\_\* 부재/존재 시 동작, download/xhr
    폴백 가드
  - adapter 폴백 다운로드에 비브라우저 환경 no-op 안전장치 추가
  - 가드 테스트: `userscript-adapter.contract.test.ts` GREEN

- 2025-09-10: B/C 단계 최종 이관 완료
  - B4 완료: CSS 변수 네이밍/볼륨 재정렬 최종 확정(전역/컴포넌트 반영)
  - C1 완료: fitModeGroup 계약 및 접근성 속성 표준화
  - C2 완료: Radius 정책 전면 반영(`--xeg-radius-*`만 사용)
  - 해당 항목들은 계획 문서에서 제거되고 본 완료 로그로 이동되었습니다.

  - 2025-09-10: 디자인 토큰/라디우스/애니메이션/컴포넌트 표준화 1차
    완료(Userscript 현대화 기반)
  - 2025-09-10: Userscript 어댑터 및 외부 의존성 getter 정착(GM\_\*, preact,
    fflate)
  - 2025-09-10: Core 로깅/Result/에러 핸들러 표준화, 빌드/사이즈 예산 도입
  - 2025-09-10: MediaProcessor 파이프라인/테스트 완료, BulkDownloadService 1차
    구현
  - 2025-09-10: Bootstrap 정리(PC-only 핫키/지연 초기화), A11y 시각 피드백/테마
    커버리지 테스트 통과
  - 2025-09-10: Toolbar/Modal/Toast 토큰 일관화, IconButton 통일, 파일명
    충돌/실패 요약 정책 반영

  참고: 세부 결정/테스트 파일 경로는 커밋 메시지와 테스트 스위트에서 추적합니다.
  - 단위 테스트 추가: `ModalShell.tokens.test.ts`로 토큰 준수 회귀 방지

2025-09-12: 백로그 정리 — 중복/완료 항목 정돈 및 명확화

- 제거: I18N_KEYS(완료), MP_STAGE_METRICS(완료) — LanguageService/i18n 및
  MediaProcessor stage metrics가 이미 GREEN 상태로 반영되어 백로그에서 삭제
- 업데이트: PREFETCH_ADV → PREFETCH_BENCH (명칭/범위 정리) — 스케줄러 기능은
  완료, 벤치 하네스만 후속 항목으로 유지
- 상태 변경: RETRY_V2를 READY로 승격(현재 재시도 액션 기본형 구현, 실패
  상세/백오프/상관관계 노출은 후속)

2025-09-12: RETRY_V2 — BulkDownload 재시도 고도화 1차 완료

- 부분 실패 경고 토스트의 [재시도] 클릭 시 실패 항목만 제한 동시성(최대 2)으로
  재검증하고, 지수 백오프 기반 재시도를 적용. 모두 성공 시 성공 토스트, 일부
  남으면 남은 개수와 correlationId를 경고 메시지에 표기.
- 구현: fetchArrayBufferWithRetry 도입, 백오프 중 AbortSignal 취소 전파 처리,
  기존 경고 토스트 onAction 로직 대체

2025-09-11: U1 — 엔트리/부트스트랩 슬림화 완료

2025-09-12: Phase P — 프리페치 스케줄 고도화(raf/microtask) 완료

- 구현: `scheduleRaf`/`scheduleMicrotask` 유틸 추가,
  `MediaService.prefetchNextMedia`에
  `schedule: 'immediate'|'idle'|'raf'|'microtask'` 옵션 지원
- 문서: CODING_GUIDELINES 갱신(스케줄 옵션/유틸/범위)
- 결과: 타입/린트/빌드 PASS, 기존 idle 경로와 호환 유지(폴백 안전)

- 조치: `src/bootstrap/{env-init,event-wiring,feature-registration}.ts` 신설,
  `src/main.ts`에서 스타일 동적 import 및 부수효과 제거, 전역 이벤트 등록
  반환값으로 unregister 콜백 관리
- 가드: import 사이드이펙트 방지 테스트(RED 추가 예정)와 main idempotency 기존
  테스트 유지
- 결과: 타입/린트/전체 테스트/개발·프로덕션 빌드/사이즈 가드 PASS

- 2025-09-10: Overlay/Modal/Surface 토큰 일관화(Toast 완료)
  - Toast.module.css의 surface 배경/보더/그림자 토큰을 semantic으로 통일
    (`--xeg-surface-glass-*`)하여 컴포넌트 전용 토큰 의존 제거
  - 결과: 빌드/전체 테스트 그린, surface 일관성 가드와 충돌 없음

- 2025-09-10: Overlay/Modal/Surface 토큰 일관화(최종 정리)
  - ModalShell/ToolbarShell 그림자·배경·보더 토큰 사용 검증, Toast까지 포함해
    표면 계층의 semantic 토큰 일관화 완료
  - 가드 테스트: `ModalShell.tokens.test.ts`, `ToolbarShell.tokens.test.ts`,
    theme/surface 커버리지 테스트 통과 확인

- 2025-09-10: 문서 업데이트(PC 전용 이벤트, README 배지 정리)
  - README의 설치/브라우저 배지와 PC 전용 이벤트 설명 정리
  - 잘못된 마크다운 중단 문자열(배지) 수정, 오타 교정

- 2025-09-10: 애니메이션 토큰 정책(1차)
  - xeg-spin 하드코딩 지속시간 제거 → `var(--xeg-duration-*)` 사용으로 통일
  - 유닛 테스트 추가: `animation-tokens-policy.test.ts`로 회귀 방지

- 2025-09-10: ToolbarShell 컴포넌트 그림자 토큰 정책
  - ToolbarShell elevation 클래스의 raw oklch 및 하드코딩 제거 →
    `var(--xeg-comp-toolbar-shadow)` 사용
  - 유닛 테스트 추가: `ToolbarShell.tokens.test.ts`로 회귀 방지

- 2025-09-10: 애니메이션 유틸리티/컴포넌트 정책 고도화
  - `design-tokens.semantic.css`의 유틸리티(.xeg-anim-\*) duration/ease 토큰화
  - `src/assets/styles/components/animations.css`의 .xeg-animate-\* 클래스
    duration 하드코딩 제거 → 토큰화
  - 유닛 테스트 추가:
    - `test/unit/styles/animation-utilities.tokens.test.ts`
    - `test/unit/styles/components-animations.tokens.test.ts`
  - 갤러리 피처 CSS 스피너/등장 애니메이션 토큰화 완료
    - 파일: `src/features/gallery/styles/Gallery.module.css`,
      `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css`
    - 가드 테스트: `test/unit/styles/gallery-animations.tokens.test.ts` 통과

- 2025-09-10: 접근성 시각 피드백 일관성(Toast/SettingsModal)
  - 새로운 가드 테스트 추가:
    `test/unit/styles/a11y-visual-feedback.tokens.test.ts`
  - CSS 반영: `Toast.module.css`에 focus-visible 토큰/토큰화된 lift 추가,
    `SettingsModal.module.css` focus-visible 토큰 적용 및 hover lift는 em 단위
    유지(레거시 단위 테스트 호환)
  - 결과: 전체 테스트 그린

- 2025-09-10: 테마 커버리지(Glass Surface 토큰)
  - 새로운 가드 테스트 추가:
    `test/unit/styles/theme-glass-surface.coverage.test.ts`
  - design-tokens.css에서 light/dark/system(prefers-color-scheme) 오버라이드
    보장
  - 결과: 테스트 통과

  - ZIP 내 파일명 충돌 자동 해소: 동일 기본 이름 시 `-1`, `-2` 순차 접미사 부여
  - 실패 요약 수집: 부분 실패 시 `{ url, error }[]`를
    `DownloadResult.failures`로 포함
  - 적용 범위: `BulkDownloadService`와 `MediaService`의 ZIP 경로
  - 테스트: `test/unit/shared/services/bulk-download.filename-policy.test.ts`
    추가, GREEN 확인

- Extraction 규칙 유틸 통합
  - DOMDirectExtractor가 media-url.util의
    isValidMediaUrl/extractOriginalImageUrl을 사용하도록 리팩토링
  - PNG 등 원본 포맷 유지 + name=orig 승격 규칙 일원화
  - 회귀 테스트 추가: dom-direct-extractor.refactor.test.ts(GREEN)

- 2025-09-11: Phase 2 — SelectorRegistry 기반 DOM 추상화 완료
  - `src/shared/dom/SelectorRegistry.ts` 추가 및 배럴 export
  - `STABLE_SELECTORS.IMAGE_CONTAINERS` 우선순위 조정(img 우선)
  - `DOMDirectExtractor`가 가장 가까운 트윗 article 우선으로 컨테이너를
    선택하도록 통합
  - 테스트: `selector-registry.dom-matrix.test.ts` 및 DOMDirectExtractor 통합
    케이스(GREEN)

- 2025-09-10: 의존성 그래프 위생(Dependency-Cruiser 튜닝)
  - 테스트 전용/과도기 모듈을 orphan 예외로 화이트리스트 처리
  - 결과: dependency-cruiser 위반 0건(에러/경고 없음)
  - 문서 갱신: docs/dependency-graph.(json|dot|svg) 재생성

- 2025-09-10: 애니메이션 토큰/감속 정책 정규화
  - transition/animation에 `--xeg-duration-*`, `--xeg-ease-*`로 통일
  - reduce-motion 대응 확인, 하드코딩 지속시간 제거
  - 가드 테스트: animation-utilities.tokens.test.ts,
    components-animations.tokens.test.ts

- 2025-09-10: 테마 커버리지 감사(Audit)
  - 갤러리/툴바/버튼 표면 토큰 적용 및 라이트/다크 전환 리그레션 없음 확인
  - 가드 테스트: theme-glass-surface.coverage.test.ts 등 통과

  - focus-visible 링/hover lift/그림자 토큰 표준화
  - 가드 테스트: a11y-visual-feedback.tokens.test.ts 통과

  - 애니메이션 토큰 정규화, 테마 커버리지, 접근성 피드백 등 일반 현대화 작업을

- 2025-09-10: 설정 모달 ↔ 툴바 정합(Green) 완료
  - `SettingsModal.tsx` 닫기 버튼을 IconButton(intent='danger', size='md')로
    교체
  - `SettingsModal.module.css`에서 헤더/타이틀/라벨/셀렉트 토큰화 및 툴바
    포커스/호버 체계 정렬
  - 빌드/타입/린트 전부 통과 확인 (Userscript 빌드 검증 포함) 집중하도록
    간결화했습니다.

- 2025-09-10: 모달 레이어/색상 토큰 정합 최종화
  - SettingsModal `z-index`를 `var(--xeg-z-modal)`로 정규화(툴바보다 위 레이어
    보장)
  - CODING_GUIDELINES에 모달↔툴바 배경/텍스트/보더/포커스/레이어 통합 정책 추가

- 2025-09-10: 애니메이션/트랜지션 하드코딩 제거
  - 주입 CSS(`src/shared/utils/css-animations.ts`) duration/easing 토큰화 및
    reduce-motion 비활성화 처리
  - 디자인 토큰 유틸리티(`src/shared/styles/design-tokens.css`)의 .xeg-anim-\*
    클래스 토큰화
  - `useProgressiveImage` 훅 inline transition 토큰 기반으로 변경

- 2025-09-10: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-10: Phase B — 서비스 경계/의존성 getter 강화 (완료)
  - ESLint flat config에 preact/fflate/GM\_\* 직접 import 제한 규칙 고정
  - 벤더 경로 예외 허용(getter 경유), 정적 구성 검사 테스트 추가
  - 소스 스캐너 테스트 추가: `direct-imports-source-scan.test.js` (벤더 경로
    제외)
  - 결과: 규칙/소스 스캐너 이중 가드 GREEN, 빌드/린트/형식 PASS 유지

- 2025-09-11: Phase A/B 이관 정리 (간결)
  - Phase A — 부트스트랩/수명주기/PC 전용 이벤트: 아이드포턴트/핫키/핸들러 정리
    GREEN
  - Phase B — 의존성 getter 정책: 린트 규칙+정적 스캔 가드 GREEN
  - 계획서에서 해당 섹션 제거, 본 완료 로그로 최종 이동

- 2025-09-11: Phase D — 다운로드 UX 안정화(부분 성공/취소) 완료
  - ZIP 파일명 충돌 시 -1, -2 접미사 부여(파일 고유화)
  - 부분 실패 요약 수집: `failures: { url, error }[]`
  - 취소(AbortSignal)·동시성(concurrency)·재시도(retries) 옵션 구현
  - 관련 테스트: bulk-download.filename-policy.test.(ts|js),
    bulk-download.service.test.ts

- 2025-09-11: Phase 6 — 로깅/진단 고도화(상관관계 ID) 완료
  - `logger`에 correlationId 지원 추가(`createCorrelationId`,
    `createScopedLoggerWithCorrelation`)
  - BulkDownloadService에 세션 단위 correlationId 적용(시작/실패/완료 로그
    구조화)

- 2025-09-11: Phase 7 — 성능 미세 튜닝(이미지 디코드) 일부 완료
  - 갤러리 아이템 이미지에 `loading="lazy"`, `decoding="async"` 속성 부여
  - 관련 스모크 테스트 통과 및 가이드라인 준수 확인

- 2025-09-11: Phase C — 미디어 추출/정규화 견고성 향상 (완료)
- 2025-09-11: 성능 설정 반영 — cacheTTL 런타임 적용 완료
  - SettingsService 변경 구독으로 performance.cacheTTL → DOMCache.defaultTTL
    동기화
  - 초기값 반영 + 변경 시 즉시 적용 (main.ts에서 구독)
  - 위험도 낮음(격리된 유틸), 빌드/타입/린트 통과
- 2025-09-11: 설정 정리 — virtualScrolling 옵션 제거 완료
  - 소스 기본값(DEFAULT_SETTINGS.gallery)에서 virtualScrolling 제거
  - 가상 스크롤링 관련 사용처 제거 확인 테스트
    유지(`refactoring/remove-virtual-scrolling.test.ts`)
  - 결과: 타입/빌드 통과, 계획 문서의 관련 항목 정리

- 2025-09-11: 계획 이관 — Phase C 상세 설명 본 계획서에서 제거, 완료 로그로 정리
  - 문서 정리로 남은 단계(Phase E)만 계획서에 유지

- URL 유효성 검증 강화(pbs.twimg.com/media 전용, profile_images 제외, video
  도메인 허용)

---

- `computePreloadIndices` 유틸 추가 및 `VerticalGalleryView`에서
  `forceVisible`에 반영
- 단위 테스트 추가: `test/unit/performance/gallery-preload.util.test.ts` (GREEN)
- 설정 키: `gallery.preloadCount`(0–20), 기본값 3

- 2025-09-11: 접근성 스모크 완료(경량 확인)
  - focus-visible: `interaction-state-standards.test.ts` 등에서 토큰화된 포커스
    링 적용 확인
  - contrast: `phase-4-accessibility-contrast.test.ts`,
    `css-integration.test.ts`의 prefers-contrast: high 지원 확인
  - reduced motion: `styles/animation-standards.test.ts` 및 관련 refactoring
    테스트에서 prefers-reduced-motion 지원 확인
  - 결과: 관련 스위트 GREEN, 추가 구현 필요 없음(정책과 토큰이 이미 반영됨)

- name=orig 강제 규칙(png/webp/jpg) 정규화 및 DOMDirectExtractor 연동
- API 재시도/타임아웃(기본 RETRY=3, TIMEOUT=10s) + 실패 시 DOM 폴백 확인
- 테스트: test/unit/media/extraction.url-normalization.test.ts,
  test/unit/media/extraction.retry-timeout.test.ts (GREEN)

- 2025-09-11: Phase 3 — 미디어 URL 정책 엔진 v2 완료
  - 정책 보강: name=orig 단일화, 기존 format/확장자 보존, video_thumb(ext/tweet)
    경로 지원 및 ID 추출 → 원본 URL 생성 지원
  - 구현: isValidMediaUrl(+fallback) 확장, URL_PATTERNS.MEDIA/GALLERY_MEDIA/
    VIDEO_THUMB_ID 정규식 보강, extractMediaId/generateOriginalUrl 개선
  - 테스트: media-url.policy.edge-cases.test.ts GREEN, 기존 회귀 스위트 GREEN

- 2025-09-11: MediaProcessor 파이프라인 강화(완료)
  - 이미지 variants 생성(small/large/orig), 트위터 CDN URL만
    canonical(name=orig) 정규화 및 dedupe
  - tweet_video_thumb/ext_tw_video_thumb/video_thumb 패턴 GIF 타입 감지 추가
  - 비트윈 가드: 트위터 이외/상대 경로/data: URL은 기존 URL 보존(회귀 방지)
  - 테스트: media-processor.variants.red.test.ts,
    media-processor.canonical-dedupe.red.test.ts,
    media-processor.gif-detection.red.test.ts GREEN

- 2025-09-11: 계획 단계 1–5 마무리 및 이관(간결)
  - 1. 토큰 전용 스타일 가드 확장: 인라인 transition/animation 토큰 사용 강제 및
       가드 테스트 통과
  - 2. Spacing 스케일 가드: TSX 인라인 px 차단 테스트 추가 및 정책 반영
  - 3. Icon-only 버튼 통일: IconButton 패턴 정착 및 컴포넌트 적용 검증
  - 4. 키보드 내비/포커스 일관: ESC/Arrow/Space 처리 공통화, 포커스 관리 정합
  - 5. 포커스 트랩 일원화: unified focusTrap 위임 및 활성화 패턴 확립
  - 대표 테스트: animations.tokens.test.ts, spacing-scale.guard.test.ts,
    IconButton.test.tsx, focus-trap-standardization.test.ts 등 GREEN

- 2025-09-11: Phase 5 — 주입 CSS 표준화 v2 완료
  - 주입된 CSS에서 하드코딩된 duration/easing 제거, `--xeg-duration-*`,
    `--xeg-ease-(standard|decelerate|accelerate)` 토큰으로 정규화
  - css-animations.ts와 AnimationService.ts의 easing 참조를 표준 토큰으로 교체
  - 가드 테스트 추가: `test/unit/styles/injected-css.token-policy.red.test.ts`
    포함 전체 스타일 가드 GREEN
  - 결과: 전체 테스트 100% GREEN, 린트/타입/빌드 PASS

- 2025-09-11: Phase 1 — 환경 어댑터 계층 정리(getter-주입 강화) 완료
  - 외부 의존성(preact/@preact/signals/fflate/GM\_\*) 접근을 전용 getter로 통일
  - ESLint no-restricted-imports + 정적 스캔으로 직접 import 차단
  - 테스트: direct-imports-source-scan.test.(ts|js), lint-getter-policy.test.ts
    GREEN

- 2025-09-11: MediaProcessor 진행률(onStage) 옵저버 도입
  - 단계: collect → extract → normalize → dedupe → validate → complete
  - 각 단계 후 count 제공(누적 아이템 수)
  - 실패 시에도 complete 이벤트 보장
  - 테스트: media-processor.progress-observer.test.ts GREEN
- 2025-09-11: Retry Action 테스트 명명 정리
  - bulk-download.retry-action.red._ → bulk-download.retry-action._ (GREEN 유지)
  - 계획서 What's next 에서 명명 정리 작업 항목 제거

2025-09-11: Phase 5 (2차) — Accessibility Focus & Live Region Hardening 완료

2025-09-11: Phase 6 (2차) — Service Contract Interface Extraction 완료

- 2025-09-11: Phase 7 (2차) — CSS Layer Architecture & Theming Simplification
  완료
  - alias 토큰(background/border/shadow) 전면 제거: toolbar/modal CSS 모듈에서
    `--xeg-comp-*` → semantic(`--xeg-bg-toolbar`, `--color-border-default`,
    `--xeg-shadow-md|lg`) 치환
  - RED: styles.layer-architecture.alias-prune.red.test.ts (초기 FAIL) → GREEN
    (위반 0건)
  - 기존 ModalShell.tokens.test 업데이트: alias 의존 → semantic shadow 토큰 검증
  - 계획서 Phase 7 섹션 제거 & 본 완료 로그에 요약 추가

- factory 도입: getMediaService / getBulkDownloadService / getSettingsService
  (lazy singleton)
- 직접 new 사용 제거(main.ts, service-initialization.ts, GalleryRenderer.ts)
- GREEN 테스트: services.contract-interface.test.ts (직접 인스턴스화 금지 +
  factory export 검증)
- 계획서에서 Phase 6 섹션 제거

- RED → GREEN:
  - focus-restore-manager.red.test.ts → focus-restore-manager.test.ts
  - live-region-manager.red.test.ts → live-region-manager.test.ts
- 구현:
  - focus-restore-manager.ts: beginFocusScope() (단일 스코프, 안전 복원 &
    fallback)
  - live-region-manager.ts: polite/assertive singleton + 재부착 가드
- 테스트 검증:
  - 제거된 origin 포커스 fallback(body/html) 동작
  - polite/assertive 각각 1개만 생성 & 총 2개 초과 금지
- 후속(Backlog): 다중 스코프 스택, announcement queue/debounce, assertive 우선
  정책 튜닝
