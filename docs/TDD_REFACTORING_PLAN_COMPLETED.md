# ✅ TDD 리팩토링 완료 항목 (간결 로그)

> 완료된 작업만 간단히 기록합니다.

2025-09-11: 계획 감사 — 활성 Phase 없음 (초기 현대화 Phase 1–4 + 옵션 전부 완료,
신규 작업은 백로그에서 선정 예정) 2025-09-11: 2차 사이클 정의 — 계획서에 Phase
1–7 (Result/Error v2, Telemetry, Progressive Loader, I18N 확장, A11y 강화,
Service I/F, CSS Layer) 추가하고 본 로그는 완료 항목만 유지.

2025-09-11: 계획 문서 경량화 2차 — Phase 8 / 옵션 Phase 섹션 제거 및 백로그 참조
문구로 대체 (활성 목표 비어 있음 상태 확정)

2025-09-12: Phase M — SettingsModal 다크 모드 투명 배경 회귀 수정 완료

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
  - 공통 타입:
    `BaseResultStatus = 'success' | 'partial' | 'error' | 'cancelled'`
  - BulkDownloadService / MediaService 반환 객체에 `status` 필드 추가, 부분
    실패시 'partial', 취소시 'cancelled'
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

2025-09-11: U1 — 엔트리/부트스트랩 슬림화 완료

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

2025-09-12: 계획 문서 정리 — '활성 Phase 없음' 상태 종료 및 신규 U1–U5 활성 계획
반영

- 내용: `TDD_REFACTORING_PLAN.md`를 현대화 리팩토링 중심(U1–U5)으로 갱신하고,
  기존 문구(활성 없음)를 제거하여 차기 사이클 시작 상태로 전환
- 결과: 완료 로그에 본 항목 기록, 계획 문서는 활성 Phase만 유지
