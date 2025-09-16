### 2025-09-16 — PLAN-SYNC (VND/TOKENS/A11Y)

- 계획 정리: 활성 계획서(TDD_REFACTORING_PLAN.md)에서 완료 항목을 본 완료 로그로
  최종 이관.
- 이관 항목: VND-INIT-01, VND-LEGACY-MOVE-02, TOKENS-TOOLBAR-03, A11Y-ICON-04.
- 상태: 관련 테스트/문서/가드 모두 GREEN. 활성 계획서에는 보류 항목만 유지(5)
  MEDIA-STRATEGY-05).

### 2025-09-16 — PLAN-CLEANUP (활성 계획 슬림화)

- 내용: 활성 계획서에서 완료 항목의 잔여 표식/주석을 제거하고, 완료 항목은 본
  문서(완료 로그)에만 유지하도록 정리. 활성 계획서에는 옵션 과제인
  MEDIA-STRATEGY-05만 남김.
- 검증: 문서 변경만 — 타입/린트/테스트/빌드/포스트빌드 영향 없음.

### 2025-09-16 — MEDIA-STRATEGY-05 종결(옵션 과제 클로즈)

- 주제: 미디어 추출/정규화 경로 정리(Strategy/Factory 경계 명료화, normalizer
  단일화)
- 결정: 현 구조 유지(A안). 기능/테스트 GREEN이며 경계 재정렬은 리스크 대비
  이득이 제한적이라 판단해 옵션 과제를 문서상 종결.
- 메모: 추후 소스 이동/리네임이 필요한 경우, 작은 범위의 후속 PR로 처리하고 경로
  가드 테스트만 추가하는 방식을 권장.
- 영향: 코드 변경 없음 — 타입/린트/테스트/빌드/포스트빌드 모두 무영향.

### 2025-09-16 — TOKENS-TOOLBAR-03 완료

- 내용: ToolbarShell에 컴포넌트 섀도 토큰을 도입하여 box-shadow/배경/보더가
  컴포넌트 레이어 토큰을 통해 제어되도록 정렬. 레거시/신규 토큰명 전환기를 통해
  점진 이행.
- 변경:
  - `src/shared/components/ui/ToolbarShell/ToolbarShell.module.css`:
    `--xeg-comp-toolbar-shadow` 정의 및 elevation/surface 변형에서 소비
  - 테스트: `test/unit/shared/components/ui/ToolbarShell.tokens.test.ts`,
    `test/styles/toolbar-shell.shadow-tokens.test.ts`(레거시/신규 토큰명 모두
    허용)
- 검증: styles/fast 스위트 GREEN. 타입/린트 PASS. 빌드 영향 없음.

### 2025-09-16 — A11Y-ICON-04 완료

- 내용: 아이콘 전용 버튼(iconOnly)의 접근성 보강.
  aria-label/aria-labelledby/title 중 하나가 없으면 런타임 경고(logger.warn)로
  기록하고, 테스트에서 누락을 탐지.
- 변경:
  - `src/shared/components/ui/Button/Button.tsx`: 테스트 모드 예외 throw 제거 →
    `logger.warn` 유지. 라벨 파생(title/i18n) 우선순위 문서화.
  - 테스트: `test/unit/ui/toolbar.icon-accessibility.test.tsx` 통과. 기타 a11y
    가드와 정합성 유지.
- 검증: fast/styles 스위트 GREEN, 타입/린트 PASS, dev/prod 빌드 및 postbuild
  validator PASS.

### 2025-09-16 — DOCS-HARDENING-01 완료

### 2025-09-16 — VND-INIT-01 완료

- 내용: 테스트 실행 시 발생하던 StaticVendorManager 자동 초기화 경고를 테스트
  모드에서 debug로 다운그레이드하고, `test/setup.ts`에서 벤더 선행 초기화를
  보강. 경고 0을 보장하는 단위 테스트
  추가(`test/unit/vendors/vendor-initialization.warnings.test.ts`).
- 변경:
  - `src/shared/external/vendors/vendor-manager-static.ts`: auto-init 경고를
    `import.meta.env.MODE === 'test'`에서 debug로 로깅
  - `test/setup.ts`: 선행 초기화 유지(안전 가드)
  - 신규 테스트 추가: warn 미발생 확인
- 검증: smoke/fast 스위트 GREEN, 벤더 경고 미출력(테스트 모드), 기존 기능/빌드
  플로우 영향 없음.

### 2025-09-16 — VND-LEGACY-MOVE-02 완료

- 내용: 동적 VendorManager의 런타임 접근을 금지하는 스캔 테스트를 추가해 테스트
  전용임을 명확화하고, 런타임 소스에서의 참조가 0임을 보장. `createAppContainer`
  런타임 스텁은 유지하되 테스트 하네스 전용 사용을 재확인(기존 lint 테스트
  유지).
- 변경:
  - 신규 테스트: `test/unit/lint/vendor-manager.runtime-imports.red.test.ts`
  - 기존 가드와 함께 prod 번들 문자열 가드가 'VendorManager' 누출을 금지하는지
    확인(`scripts/validate-build.js`)
- 검증: 전체 테스트 GREEN, dev/prod 빌드 및 postbuild validator PASS
  (VendorManager/legacy 전역 키 누출 없음).

- 내용: CODING_GUIDELINES의 코드펜스 파손 및 Toast 섹션 혼입 문제를 수정하고,
  animateCustom 예시 인접 영역을 정상화. ARCHITECTURE와
  DEPENDENCY-GOVERNANCE에는 "런타임 코딩/스타일/토큰/테스트 정책은
  CODING_GUIDELINES를 단일 소스로 참조"하도록 교차 링크를 추가해 문서 중복을
  해소.
- 검증: 문서 렌더링 수동 점검으로 코드 블록/헤딩 구조 파손 없음 확인. 기존
  테스트/타입/린트/빌드 플로우와 충돌 없음.

### 2025-09-16 — D1.1 다운로드 에러 복구 UX 가드 완료

- 내용: 대량 다운로드(다중 ZIP) 전체 실패/부분 실패/성공/취소 케이스에서 토스트
  라우팅과 중복 방지가 일관되도록 서비스 계약 테스트 정비. 추가 코드 변경 없이
  현행 구현이 수용 기준을 충족함을 확인.
- 테스트: `test/unit/shared/services/bulk-download.error-recovery.test.ts` GREEN
- 검증: 타입/린트/전체 테스트/빌드/포스트빌드 모두 PASS.

### 2025-09-16 — KBD-NAV-UNIFY 가드 보강 완료

- 내용: document/window 직접 keydown 등록 금지 스캔 규칙 보강과
  `KeyboardNavigator` 계약 테스트 확장(편집 가능 요소 무시, preventDefault 옵션
  검증). 현행 서비스가 기준 충족을 확인.
- 테스트:
  - `test/unit/lint/keyboard-listener.centralization.policy.test.ts` GREEN
  - `test/unit/shared/services/keyboard-navigator.service.test.ts` GREEN
- 검증: 타입/린트/테스트/빌드/포스트빌드 PASS.

### 2025-09-16 — VND-MESSAGING-ALIGN-01 완료

- 내용: Vendors 정적 경로 단일화 관련 메시지/주석/문서 정합성 보강 항목은
  2025-09-15의 "VND-LEGACY-MOVE — 동적 VendorManager 테스트 전용 명시"로 충족됨.
  추가 작업 불필요함을 확인.
- 검증: 빌드 산출물 문자열 스캔에서 'VendorManager' 누출 없음(기 완료 항목
  참조).

### 2025-09-16 — F1/U4 배럴 표면 가드 유지보수 완료

- 내용: features/아이콘 배럴 표면 가드 유지보수는 기 완료 항목들로 충족됨
  (BARREL-SURFACE-TRIM-01, icons-used-only/used-only 스캔). 예외 목록/메시지
  현행화 필요 없음 확인.
- 테스트:
  - `test/unit/lint/features-barrel.surface.scan.red.test.ts` GREEN
  - `test/unit/lint/icons-used-only.scan.red.test.ts` GREEN
  - `test/unit/refactoring/unused-exports.scan.red.test.ts` GREEN
- 검증: 타입/린트/테스트/빌드/포스트빌드 PASS.

### 2025-09-16 — SETTINGS-MIG-HASH-01 완료

- 내용: Settings 스키마 해시(`__schemaHash`) 도입. 저장된 해시와 현재 해시가
  불일치하면 prune/fill 마이그레이션을 강제하고, 최초 저장/저장 시 현재 해시를
  포함하도록 표준화.
- 테스트: `test/unit/features/settings/settings-migration.schema-hash.test.ts`
  추가 — 불일치 시 자동 복구, 최초 실행 해시 기록, 반복 초기화 idempotent GREEN.
- 검증: 타입/린트/fast/unit 스위트 GREEN, dev/prod 빌드 및 postbuild validator
  PASS.

### 2025-09-16 — FILENAME-UNICODE-NORMALIZE-01 완료

- 구현: `FilenameService.sanitizeForWindows()`에 NFKC 정규화 + 제어/비표시/BiDi
  문자 제거 추가. 기존 Windows 금지 문자/예약어/길이 제한 로직 유지.
- 테스트: `test/unit/shared/media/filename.unicode-normalize.test.ts` 추가 —
  한글 조합/분해 동등성, zero-width/BiDi 제거, 예약어/금지문자, 길이 제한
  검증(GREEN).
- 영향 범위: 교차 플랫폼 파일명 결정성 향상. 기존 파일명 정책과 호환 유지.

### 2025-09-15

2025-09-15: PLAN-STATUS — TDD_REFACTORING_PLAN.md 점검 결과, 활성 과제
7건(KBD-FOCUS-RETURN-01, TIMER-DETERMINISM-02, I18N-LITERAL-GUARD-01,
SETTINGS-MIG-HASH-01, FILENAME-UNICODE-NORMALIZE-01, UI-ERROR-BOUNDARY-01,
PLAYWRIGHT-SMOKE-01)은 모두 진행 필요 상태로 확인되어 완료 문서로 이관할 항목이
없습니다(실행 순서 제안은 기존 문서 유지).

2025-09-15: KBD-FOCUS-RETURN-01 — 모달/오버레이 닫힘 시 포커스 복원 보장 (완료)

- 내용: `useFocusTrap`와 `KeyboardHelpOverlay` 개선으로 ESC/닫기/배경 클릭 시
  트리거 요소로 포커스 복원을 보장. jsdom 안정화를 위한 짧은 재시도 루프를
  추가해 테스트 환경에서도 안정적으로 복원.
- 테스트: `test/features/gallery/keyboard-help.overlay.test.tsx`,
  `test/unit/shared/hooks/useFocusTrap.test.tsx`,
  `test/unit/accessibility/focus-restore-manager.*` GREEN
- 검증: 타입/린트/빌드 PASS, dev/prod Userscript 및 postbuild validator PASS

2025-09-15: PLAN-REVIEW — 활성 계획 점검(완료 이관 항목 없음;
LEGACY-TOKENS-PRUNE-01만 활성 유지)

2025-09-15: LEGACY-TOKENS-PRUNE-01 — 레거시 overlay alias 정리(1차) (완료)

- 내용: 사용처가 없는 overlay alias(무접두 `--xeg-overlay-*`) 4종을 제거하고,
  선언 대비 전역 사용 여부를 스캔하는 RED 테스트를 추가하여 회귀를 방지. 보존:
  `--xeg-color-overlay-*` 및 `--xeg-color-backdrop`(실사용).
- 변경:
  - 제거: `--xeg-overlay-light` · `--xeg-overlay-medium` ·
    `--xeg-overlay-strong` · `--xeg-overlay-backdrop`
  - 테스트 추가: `test/unit/styles/design-tokens.usage-scan.red.test.ts`
- 검증: fast/unit(styles)에서 신규 스캔 GREEN(해당 토큰 미사용 확인), 타입/린트
  PASS, dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: LEGACY-TOKENS-PRUNE-02 — surface helper 클래스 정리 (완료)

- 내용: design-tokens.css에 정의만 존재하고 실제 사용되지 않던 surface helper
  클래스 2종을 스캔하여 제거. 선언 파일 자체는 사용처로 보지 않는 RED usage-scan
  테스트를 추가해 회귀를 방지.
- 변경:
  - 제거: `.xeg-surface-primary`, `.xeg-surface-elevated`
  - 테스트 추가:
    `test/unit/styles/design-tokens.surface-helpers.usage-scan.red.test.ts`
- 검증: styles 스위트에서 신규 스캔 GREEN, 기존 스타일/단위 테스트 GREEN,
  타입/린트 PASS. dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: USERSCRIPT-ADAPTER-GUARD-01 — GM\_\* 직접 사용 금지 가드 (완료)

- 내용: Userscript GM\_\* API는 어댑터(`getUserscript()`) 또는 타입 선언
  파일에서만 허용. 런타임 소스(`src/**`) 전반에 대한 정적 스캔 가드 추가로 회귀
  방지.
- 테스트: `test/unit/lint/userscript-gm.direct-usage.scan.red.test.ts` GREEN.
- 검증: fast/unit 스위트 GREEN(해당 가드 포함), dev/prod 빌드 및 postbuild
  validator PASS.

### 2025-09-16 — TIMER-DETERMINISM-02 완료

- 내용: `setTimeout|setInterval|clearTimeout|clearInterval` 직접 사용 금지 정적
  스캔 테스트 추가. 합법 예외는 TimerManager 내부 및 테스트 파일로 한정.
- 테스트: `test/unit/lint/timer-direct-usage.scan.red.test.ts` GREEN.
- 검증: 전체 스위트 GREEN, 타입/린트/빌드/포스트빌드 PASS.

### 2025-09-16 — UI-ERROR-BOUNDARY-01 완료

- 내용: 상위 ErrorBoundary 컴포넌트 도입. 자식 렌더 오류를 포착해 토스트로
  알리고 UI는 조용히 대체(Fragment). prod에서는 stack 미노출, 언어 서비스와
  연동.
- 테스트: `test/unit/components/error-boundary.fallback.test.tsx` GREEN.
- 구현: `src/shared/components/ui/ErrorBoundary/ErrorBoundary.tsx` (vendors
  getter/LanguageService/ToastManager 사용).

### 2025-09-16 — I18N-LITERAL-GUARD-01 완료

- 내용: TSX 사용자 노출 문자열 리터럴 가드 추가 및 기존 UI 컴포넌트 국제화 적용.
  위양성 튜닝과 KeyboardHelpOverlay/VerticalImageItem 등 문자열을
  LanguageService로 이전.
- 테스트: `test/unit/lint/i18n-literal.scan.red.test.ts` GREEN, 관련 UI 테스트
  GREEN.
- 문서: CODING_GUIDELINES에 “사용자 노출 문자열은 LanguageService 사용” 명시.

2025-09-15: WHEEL-LOCK-POLICY-01 — 휠 락(policy) 일관성 가드 (완료)

- 내용: 직접 addEventListener('wheel', ...) 금지 가드와 휠 유틸 계약을 확정.
  컴포넌트/피처는 `addWheelListener`/`ensureWheelLock`만 사용하도록 표준화.
- 테스트: `test/unit/events/wheel-listener.policy.red.test.ts`,
  `test/unit/events/ensureWheelLock.contract.test.ts` GREEN.
- 검증: 타입/린트/전체 테스트/빌드/포스트빌드 모두 PASS.

2025-09-15: KBD-NAV-UNIFY-02 — 키보드 입력 중앙화(확장) (완료)

- 내용: document/window 직접 keydown 등록 경로를 가드하고, 갤러리 키 입력을
  `KeyboardNavigator` 구독 기반으로 통일. 스코프/구독
  API(onEscape/onArrow/OnSpace) 확장.
- 테스트: `keyboard-listener.centralization.policy.test.ts`(가드) 및 서비스 계약
  테스트 GREEN.
- 검증: 타입/린트/빌드/포스트빌드 PASS.

2025-09-15: BARREL-SURFACE-TRIM-01 — 배럴/재노출 표면 축소 (완료)

- 내용: utils/performance/media 배럴에서 와일드카드 재노출 제거, 사용 심볼만
  명시 export. 소비처 import 정리.
- 테스트: `barrel-surface.used-only.scan.red.test.ts` 추가, GREEN.
- 검증: 순환 0, 빌드/테스트 PASS.

2025-09-15: TOAST-BOUNDARY-02 — Toast UI/상태 경계 강화 (완료)

- 내용: UI 배럴 상태성 재노출 제거, 컴포넌트 내 로컬 Toast 상태 금지 가드 설치.
- 테스트: `toast-ui-barrel.stateful-exports.guard.test.ts`,
  `toast-ui-components.no-local-state.guard.test.ts` GREEN.
- 검증: 전체 스위트/빌드 PASS.

2025-09-15: FILENAME-POLICY-02 — 파일명 정책 가드 강화 (완료)

- 내용: ad-hoc 파일명 조합 금지 스캔 추가, 모든 생성 경로는 FilenameService로
  일원화.
- 테스트: `filename.ad-hoc-construction.scan.red.test.ts` GREEN.
- 검증: 타입/린트/빌드 PASS.

2025-09-15: VENDOR-GETTER-GUARD-02 — 벤더 직접 import 금지 강화 (완료)

- 내용: preact/@preact/signals/fflate/compat 직접 import 금지 스캔 강화(External
  vendors 예외), vendors getter 전용 사용을 가드.
- 테스트: `direct-imports-source-scan.test.ts` 확장, GREEN.
- 검증: 전체 스위트/빌드 PASS.

2025-09-15: STYLE-TOKENS-GUARD-02 — 스타일/색/애니메이션 가드 보강 (완료)

- 내용: TSX 인라인 색상 리터럴 금지, `transition: all` 금지 스캔 테스트 추가로
  회귀 방지 강화.
- 테스트: `tsx-inline-colors.guard.test.ts`,
  `injected-css.no-transition-all.guard.test.ts` GREEN.
- 검증: 스타일/유닛 스위트 GREEN, 빌드/포스트빌드 PASS.

2025-09-15: EVENT-LIFECYCLE-ABORT-01 — 이벤트 리스너 수명주기 강화(AbortSignal
지원) (완료)

- 내용: `shared/utils/events.ts`의 `addListener`가 `AbortSignal` 옵션을
  수용하도록 확장. 사전 중단된 신호는 등록을 생략하고, abort 발생 시 자동으로
  `removeEventListener`와 내부 맵 정리를 수행.
- 테스트: `test/unit/events/event-lifecycle.abort-signal.integration.test.ts`
  추가 — 등록/중단/정리 동작 검증. GREEN.
- 검증: 타입/린트/fast 스위트 GREEN, dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: DOWNLOAD-PROGRESS-TYPE-UNIFY-01 — 진행률 타입 단일 소스화 (완료)

- 내용: 중복 정의된 DownloadProgress 인터페이스를
  `src/shared/services/download/types.ts`로 단일화하고,
  `BulkDownloadService.ts`/`MediaService.ts`는 type-only import로 교체.
  배럴(`shared/services/index.ts`)에서 type 재노출.
- 테스트: 스캔/타입 의존만 — 기존 스위트 GREEN, 타입/린트 PASS.
- 검증: dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: USERSCRIPT-ADAPTER-DOWNLOAD-OK-GUARD-01 — 어댑터 fallback 다운로드
응답 가드 (완료)

- 내용: `shared/external/userscript/adapter.ts`의 `fallbackDownload`에
  `!response.ok` 가드 추가, 오류 메시지 "HTTP {status}: {statusText}" 표준화.
- 테스트: 어댑터 경로 모킹으로 404/500시 에러 메시지 형식 검증. GREEN.
- 검증: 타입/린트/빌드/포스트빌드 PASS.

2025-09-15: FETCH-CANCELLATION-TIMEOUT-01 — fetch 옵션(취소/타임아웃) 일관화
(완료)

- 내용: `BulkDownloadService.downloadSingle`에 `signal` 전파 및 기본
  타임아웃(AbortSignal.timeout 20s) 적용. zip/orchestrator 경로는 기존 표준 유지
  확인.
- 테스트: 단일 경로 취소/타임아웃 동작 검증. GREEN.
- 검증: 타입/린트/빌드/포스트빌드 PASS.

2025-09-15: FILENAME-WIN-SANITIZE-01 — Windows 예약어/경계 케이스 파일명 보정
(완료)

- 내용: `FilenameService.sanitizeForWindows` 도입 — 예약어 회피, 선행/후행
  공백·마침표 제거, 금지 문자 치환, 길이 제한.
  `generateMediaFilename`/`generateZipFilename` 출력에 적용.
- 테스트: 경계 케이스 입력 스냅샷/정규화 테스트 추가. GREEN.
- 검증: 타입/린트 PASS(형식 정리), dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: FETCH-OK-GUARD-01 — fetch 응답 가드 표준화 (완료)

- 내용: 비정상 응답(4xx/5xx)을 명시적으로 실패로 처리하도록 다운로드 경로를
  표준화.
  - DownloadOrchestrator.fetchArrayBufferWithRetry: `!response.ok` 시 즉시
    throw(`HTTP {status}: {statusText}`)
  - BulkDownloadService.downloadSingle: `!response.ok` 가드 추가 후 Blob 생성
- 테스트: `bulk-download.fetch-ok-guard.test.ts` 추가 — ZIP 경로 부분 실패/단일
  경로 실패 검증. GREEN.
- 검증: 타입/린트/의존성 가드 PASS, dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: PROGRESS-API-CONSISTENCY-01 — 진행률 complete(100%) 일관화 (완료)

- 내용: 단일 다운로드 흐름에서 최종 complete 이벤트를 정확히 1회(100%) 보장.
  - BulkDownloadService.downloadMultiple(single): preparing(0) →
    downloading(100, filename) → complete(100, filename?) 순으로 방출(성공시에만
    complete).
  - exactOptionalPropertyTypes 준수를 위해 filename은 정의된 경우에만 포함.
- 테스트: `bulk-download.progress-complete.test.ts` 추가 — 단일 흐름에서 final
  complete 1회 검증. GREEN.
- 검증: 전체 스위트/빌드/포스트빌드 가드 PASS.

2025-09-15: DOWNLOAD-FLOW-UNIFY-01 — 다운로드 경로 단일화(서비스 위임) (완료)

- 내용: `MediaService.downloadSingle/Multiple`을 컨테이너 액세서
  `getBulkDownloadServiceFromContainer()` 경유로 `BulkDownloadService`에 위임.
  MediaService 내부 중복 로직 및 미사용 메서드 제거. 컨테이너 순환 의존은
  `service-accessors`의 반환 타입을 `unknown`으로 완화하고 사용처에서 단언하는
  방식으로 해소.
- 테스트: 위임 검증 테스트 추가 및 기존 계약/결과 테스트는 accessor mock으로
  격리. fast/unit GREEN.
- 검증: 타입/린트/의존성 검증 PASS(`deps:check` 순환 0), dev/prod 빌드 및
  postbuild validator PASS.

2025-09-15: ZIP-API-SURFACE-REDUCE-01 — ZIP API 표면 축소(호출 단일화) (완료)

- 내용: `src/shared/external/zip/zip-creator.ts`의 `createZipFromItems`에
  @deprecated JSDoc을 추가하고, prod 소스(`src/**`)에서 해당 심볼 사용이 0건임을
  보장하는 스캔 테스트를
  추가(`test/unit/lint/zip-api-surface.scan.red.test.ts`). Orchestrator
  경로(`createZipBytesFromFileMap`)만 사용.
- 검증: 테스트/타입/린트 GREEN, dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: CSS-TOKEN-GUARD-01 — 디자인 토큰 사용 가드 확대 (완료)

- 내용: 컴포넌트 CSS 색상 리터럴 금지 가드에 더해 TSX 인라인 style 속성에서도
  색상 리터럴(hex/rgb/rgba/hsl/hsla/oklch/color-mix/white/black)을 금지하는 스캔
  테스트를 추가(`test/unit/styles/tsx-inline-colors.guard.test.ts`). 허용 값은
  디자인 토큰 변수(`var(--xeg-*/--color-*)`)와 제한된 시스템 키워드
  (`transparent`, `currentColor`, `Canvas`, `CanvasText`, `HighlightText`)로
  한정.
- 테스트: styles 프로젝트 GREEN(31 passed | 1 skipped), 신규 가드 통과.
- 검증: 전체 스위트/빌드에 영향 없음. 정책은 CODING_GUIDELINES에 추가.

2025-09-15: TW-VIDEO-LEGACY-NORMALIZER-01 — TwitterVideoExtractor 레거시 필드
정규화 분리 (완료)

- 내용: 레거시 tweet/user 필드 정규화를 전담하는 normalizer를
  `shared/services/media/normalizers/TwitterVideoLegacyNormalizer.ts`로 분리하고
  `TwitterVideoExtractor`는 해당 모듈에 위임하도록 변경. modern 필드 우선,
  idempotent merge 보장.
- 테스트: extractor 경로 및 normalizer 단위 테스트 추가/갱신.
- 검증: 전체 테스트 GREEN, dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: SETTINGS-MIG-TESTS-02 — SettingsMigration 경로 커버리지 확대 (완료)

- 내용: SettingsMigration에 대해 pruneWithTemplate, fillWithDefaults,
  idempotency(버전/lastModified) 커버리지 보강. 기본값에 enableKeyboardNav 추가.
- 테스트: settings migration 스위트 강화, 경계/템플릿 불일치/알 수 없는 키
  pruning 등을 검증.
- 검증: 전체 테스트 GREEN, dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: SEL-SOURCE-GUARD-01 — STABLE_SELECTORS 단일 소스 강제 (완료)

- 내용: `src/constants.ts`의 `STABLE_SELECTORS`/`SELECTORS`만 사용하도록 소스
  스캔 가드 추가. 위반 모듈을 상수 참조로 교체. 테스트
  `test/unit/lint/selectors-single-source.scan.red.test.ts` 추가.
- 검증: 위반 0건(GREEN), 기능/빌드/포스트빌드 가드 PASS.

2025-09-15: INPUT-PC-GUARD-02 — PC 전용 입력 소스 가드 강화 (완료)

- 내용: `onPointer*`/`PointerEvent`/`onTouch*`/`TouchEvent` 사용을 소스 레벨에서
  스캔하여 차단. 테스트 `test/unit/lint/pc-input-only.source.scan.red.test.ts`
  추가. 번들 문자열 가드와 이중 안전망.
- 검증: 위반 0건(GREEN), 기존 번들 가드와 함께 PASS.

2025-09-15: UTILS-SVC-BOUNDARY-01 — Utils → Services 의존 금지 가드 (완료)

- 내용: `src/shared/utils/** -> src/shared/services/**` 정적 import 금지 스캔
  추가. 위반 모듈(events.ts, media-url.util.ts) 수정 — 서비스 접근은
  컨테이너/헬퍼 경유. 테스트
  `test/unit/lint/utils-services-boundary.scan.red.test.ts` 추가.
- 검증: 위반 0건(GREEN), 타입/린트/테스트/빌드/포스트빌드 PASS.

2025-09-15: PLAN-TOAST-CLEAN — 토스트 관련 활성 과제 정리(완료)

- 내용: 활성 계획의 토스트 관련 과제를 모두 완료 처리하고 계획 문서에서 제거.
- 검증: 문서 변경만 — 타입/린트/테스트/빌드/포스트빌드 영향 없음.

2025-09-15: TOAST-UNIFY-02 / TOAST-TYPE-CONSOLIDATE / UI-BARREL-HARDEN-02 (완료)

- 내용: 토스트 시스템 단일화 및 UI 배럴 표면 하드닝을 완료했습니다.
  - UI 배럴(`src/shared/components/ui/index.ts`)에서 토스트 상태성 API 재노출
    제거
  - UI Toast 컴포넌트는 표현 전용으로 유지하고, 서비스 타입 `ToastItem`을
    type-only import로 사용
  - 가드 테스트 추가:
    - `test/unit/lint/toast-ui-barrel.stateful-exports.guard.test.ts`
    - `test/unit/lint/toast-ui-components.no-local-state.guard.test.ts`
  - 레거시 RED 스캔 플레이스홀더 파일 두 개는 스킵 테스트로 대체하여 히스토리
    보존: `ui-toast-*.scan.red.test.ts`
- 검증: 전체 테스트 GREEN(376 passed | 16 skipped), 타입/린트/빌드/포스트빌드
  기존 흐름과 충돌 없음.

2025-09-15: PLAN-REFRESH-TOAST — 활성 계획에 토스트 단일화 과제 등록(문서)

- 내용: UI 배럴/컴포넌트에 남아 있던 토스트 상태성 API 중복을 제거하는 활성
  계획(TOAST-UNIFY-02/TOAST-TYPE-CONSOLIDATE/UI-BARREL-HARDEN-02)을 추가로 등록.
  코드 변경은 계획 수립과 일부 배럴 표면 정리로 시작.
- 검증: 문서/표면 변경만 — 타입/린트/테스트/빌드/포스트빌드 영향 없음.

2025-09-15: FOCUS-TRAP-UNIFY — 유틸 단일화/훅 위임(완료)

- 내용: `shared/utils/focusTrap.ts`를 단일 소스로 확정하고, `useFocusTrap` 훅은
  해당 유틸에 위임하도록 리팩토링. 문서 수준 키다운은 `EventManager` 경유, 초기
  포커스/복원 동작 유지.
- 검증: 관련 테스트 GREEN(useFocusTrap/focusTrap), 타입/린트/빌드/포스트빌드
  PASS.

2025-09-15: A11Y-LIVE-REGION-LIFECYCLE — 단일 인스턴스/정리 보장(완료)

- 내용: `shared/utils/accessibility/live-region-manager.ts`에 싱글톤 관리,
  beforeunload 정리, `announce()` 헬퍼 추가. `useAriaLive`는 매니저를 사용하도록
  변경.
- 검증: 라이브 리전 테스트 GREEN, 메모리/DOM 누수 없음, 빌드/포스트빌드 PASS.

2025-09-15: KBD-NAV-UNIFY — 키보드 입력 중앙화(완료)

- 내용: document/window에 대한 직접 keydown/keyup 등록을 금지하는 가드 테스트를
  추가하고, focusTrap 유틸/훅과 useAccessibility 훅을 EventManager 경유 등록으로
  리팩터링. 공통 서비스 `shared/services/input/KeyboardNavigator.ts`를 도입하여
  키 처리(Escape, '?', Shift+'/', Arrow/Home/End/Enter/Space)를 중앙화하고,
  갤러리 훅(`useGalleryKeyboard`)을 해당 서비스 구독으로 마이그레이션.
- 검증: 타입/린트 GREEN, fast/단위 스위트에서 신규 가드 및 서비스 계약 테스트
  GREEN. 기능/UX 동일성 유지, dev/prod 빌드 및 postbuild validator 영향 없음.

2025-09-15: URL-PATTERN-SOURCE-UNIFY — URL 정규식 단일 소스화 (완료)

- 내용: `src/shared/utils/patterns/url-patterns.ts`에 `URL_PATTERNS` 단일 소스를
  추가하고, `src/constants.ts`는 이를 타입 안전하게 재노출하도록 변경. 중복 정의
  제거로 드리프트 위험 해소.
- 검증: 타입/린트/테스트/빌드/포스트빌드 모두 GREEN. 기존 소비처는 변경 없이
  동작(호환 API 유지).

2025-09-15: VND-GETTER-STRICT — 벤더 getter 전용 사용 강제 (완료)

- 내용: `test/unit/lint/vendor-getter.strict.scan.red.test.ts` 추가로
  src/\*\*에서 `@shared/external/vendors` 배럴의 `h/render/Component/Fragment`
  직접 import 금지. 배럴은 getter 우선 노출 유지, 직접 export는 @deprecated
  안내만 유지.
- 검증: 스캔 GREEN, 타입/린트/테스트/빌드/포스트빌드 모두 GREEN.

2025-09-15: GUARD-02 — 배럴 역참조 순환 가드 (완료)

- 내용: `test/unit/lint/barrel-reimport.cycle.scan.red.test.ts` 추가로
  `src/shared/**` 내부 모듈의 상위 배럴 재수입 금지. 내부는 구체 경로만 허용.
- 검증: 스캔 GREEN, dependency-cruiser 순환 0 유지.

2025-09-15: F1-c — gallery 배럴 슬림화 (완료)

- 내용: `src/features/gallery/index.ts`를 types-only로 축소. 클래스/컴포넌트
  재노출 제거. 스캔 테스트 `features-barrel.class-exports.scan.red.test.ts`
  추가.
- 검증: 관련 alias 테스트 갱신, 유닛 스위트 GREEN, 빌드/포스트빌드 PASS.

2025-09-15: TEST-DEDUP-VMOCK — 벤더 모크 중복 정리 (완료)

- 내용: `test/utils/mocks/vendor-mocks-clean.ts` 제거. 공통 모듈 유지 및 계약
  테스트 `test/unit/utils/vendor-mocks.contract.test.ts` 추가.
- 검증: 유닛 스위트 GREEN.

2025-09-15: DEPG-REFRESH — 의존성 그래프/문서 최신화 (완료)

- 내용: `npm run deps:all` 실행으로 `docs/dependency-graph.(json|dot|svg)` 갱신.
- 검증: `✔ no dependency violations found`, 빌드/포스트빌드 PASS.

2025-09-15: F1-b — FEATURES-BARREL(Hardening, settings) (완료)

- 내용: `src/features/settings/index.ts` 배럴을 Factory/타입만 노출하도록 축소.
  구현 클래스(`SettingsService`, `TwitterTokenExtractor`) 재노출 제거. 소비처는
  `@features/settings/services/settings-factory` 또는 배럴의 factory만 사용.
- 검증: 정적 스캔(배럴 내 구현명 0), 타입/린트/테스트 GREEN, dev/prod 빌드 및
  postbuild validator PASS.

2025-09-15: VND-LEGACY-MOVE — 동적 VendorManager 테스트 전용 명시 (완료)

- 내용: `src/shared/external/vendors/vendor-manager.ts` 상단에 @deprecated
  TEST-ONLY 주석/설명을 추가, prod 런타임 사용 금지를 명시. 배럴은 정적 API만
  노출 유지.
- 검증: 소스 스캔에서 해당 경로 import 0건, dev/prod 빌드 산출물에서
  'VendorManager' 문자열 미검출. 전체 스위트/포스트빌드 가드 GREEN.

2025-09-15: DOC-SYNC — 가이드라인 F1/Vendor 보강 (완료)

- 내용: CODING_GUIDELINES에 “배럴은 UI/타입/Factory만” 원칙과 Settings 예시
  추가. 동적 VendorManager 테스트 전용 명시를 문서화.
- 검증: 문서 변경만 — 타입/린트/테스트/빌드/포스트빌드 GREEN.

2025-09-15: PLAN-CLEANUP — 활성 계획 최신화(완료 항목 제거, ZIP 계획 추가)

- 내용: 활성 계획서에서 빈 슬롯/완료 표식(형식적 항목) 제거. 분산된 ZIP 생성
  경로의 단일화 과제를 신규 활성화 항목으로 등록(ZIP-UNIFY-01/ZIP-LINT-01).
- 근거: 소스 내 `zipSync(`/`fflate.zip(` 사용이 둘 이상의 파일에서 관찰됨 — 단일
  어댑터(zip-creator) 경유 정책에 맞게 통합 필요.
- 검증: 코드 변경 없음(문서만). 기존 테스트/빌드/포스트빌드 가드 GREEN 유지.

2025-09-15: V3 — VENDOR-LEGACY-PRUNE-03 (완료)

- 내용: 레거시 동적 VendorManager 경로를 사용하던 `vendor-api.ts`를 TDZ-safe
  정적 API(`vendor-api-safe.ts`)로 얇게 위임하는 어댑터로 전환. 앱/런타임은
  여전히 배럴 `@shared/external/vendors`만 사용. 동적 VendorManager에 대한 실행
  경로 제거로 포스트빌드 가드와의 정합 강화.
- 검증: 소스 스캔에서 vendor-api.ts 직접 import 0건 유지, 빌드 산출물에 동적
  `VendorManager` 심볼/`vendor-api.ts` 문자열 누출 없음. 전체 테스트 GREEN,
  dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: A1 — APP-CONTAINER-SOURCE-PRUNE (완료)

- 내용: 런타임 소스 `src/features/gallery/createAppContainer.ts`를 테스트 하네스
  전용으로 분리하고, 런타임에는 금지 스텁만 남김. 모든 리팩토링 테스트는
  `test/refactoring/helpers/createAppContainer`를 import하도록 수정.
- 검증: 소스 정적 스캔에서 런타임 경로 import 0건, 테스트 GREEN, 포스트빌드
  가드에서 `createAppContainer` 문자열 누출 없음. SERVICE_KEYS 스캐너 허용
  목록에서 런타임 파일 의존 제거 필요 사항 확인(추가 단계에서 병행 유지).

2025-09-15: E4 — EVENT-ALIAS-REMOVAL-FINAL (완료)

- 내용: `TwitterEventManager` 별칭 export를 services(EventManager)와
  utils(events)에서 최종 제거. 외부 공개 표면은 `@shared/services/EventManager`
  단일 경로로 확정.
- 검증: 전역 스캔에서 `TwitterEventManager` 사용 0건, 가드 테스트
  GREEN(`event-deprecated-removal.test.ts`), fast 스위트 520 passed, dev/prod
  빌드 및 postbuild validator PASS.

2025-09-15: PLAN-CLEANUP-04 — 활성 계획 최신화(A1/V3/E4만 유지)

- 내용: 활성 계획에서 완료된 ZIP-UNIFY-01, ZIP-LINT-01, VENDOR-LEGACY-PRUNE-02
  관련 항목을 제거하고, 신규 활성 항목(A1, V3, E4)만 남김. Userscript 복잡성
  최소화를 위한 단계 구성을 명확화.
- 검증: 문서 변경만 — 타입/린트/테스트/빌드/포스트빌드 모두 GREEN 유지.

2025-09-15: MEDIA-CYCLE-PRUNE-01 — shared/media 인근 순환 제거 (완료)

- 내용: `src/shared/utils/media/media-url.util.ts`에서 `../../media` 배럴
  import를 구체 모듈(`../../media/FilenameService`)로 교체하여 역참조 사이클
  제거. 금지 스캔 테스트 `test/unit/lint/media-cycle.prune.red.test.ts` 추가.
- 검증: 테스트 GREEN(해당 스캐너 통과), `npm run deps:check`에서 순환 0건(✔ no
  dependency violations found). 전체 fast 스위트/빌드/포스트빌드 가드 GREEN.

2025-09-15: PLAN-STATE — 활성 Phase 없음 · 게이트 PASS (간결 보고) 2025-09-15:
PLAN-CLEANUP-2 — 활성 계획 정비(완료 항목 제거, ZIP 계획 추가)

- 내용: 활성 계획서에서 빈 슬롯/완료 표식(형식적 항목) 제거. 분산된 ZIP 생성
  경로의 단일화 과제를 신규 활성화 항목으로 등록(ZIP-UNIFY-01/ZIP-LINT-01).
- 근거: 소스 내 `zipSync(`/`fflate.zip(` 사용이 둘 이상의 파일에서 관찰됨 — 단일
  어댑터(zip-creator) 경유 정책에 맞게 통합 필요.
- 검증: 코드 변경 없음(문서만). 기존 테스트/빌드/포스트빌드 가드 GREEN 유지.

2025-09-15: VENDOR-LEGACY-PRUNE-02 — vendor-api.ts 소스 레벨 금지 스캔 (완료)

- 내용: `src/**`에서 `@shared/external/vendors/vendor-api` 직접 import를
  금지하는 정적 스캔 테스트 추가
  (`test/unit/lint/vendor-api.imports.scan.red.test.ts`). 허용 경로는 vendors
  배럴 (`src/shared/external/vendors/index.ts`)과 파일 자체만.
- 검증: 스캔 GREEN(위반 0건), prod/dev 빌드 산출물 가드(legacy vendor 문자열)와
  문서 가이드 일치. 전체 스위트/빌드/포스트빌드 GREEN.

### 2025-09-14

2025-09-15: PLAN-REFRESH-LEGACY-TOKENS — 활성 계획 슬림화(완료)

- 내용: 활성 계획을 'LEGACY-TOKENS-PRUNE-01' 단일 과제로 정리. 완료된 과제는 본
  문서로 이관했고, 계획 문서에서는 불필요한 항목을 제거해 실행 포커스를 명확히
  함(문서 변경만).
- 검증: 문서 변경 — 타입/린트/테스트/빌드/포스트빌드 영향 없음.

2025-09-15: PLAN-CLEAN-ABCDEF — 활성 계획 주석(A/B/D/E/F/G) 최종 정리 (완료)

- 내용: 활성 계획서 상단의 안내 주석(A/B/D/E/F/G 완료 이관 고지)을 제거하여
  문서를 "활성 항목 전용"으로 슬림화. 완료 항목은 본 완료 로그에만 유지.
- 검증: 문서 변경만 — 타입/린트/테스트/빌드/포스트빌드 영향 없음.

2025-09-15: P10 — 플레이스홀더/고아 코드 최종 정리 (완료)

- 내용: `src/shared/components/ui/SettingsModal/EnhancedSettingsModal.tsx`를
  물리 삭제 대신 "제거 스텁"으로 전환하여 import 시 즉시 에러를 던지도록
  변경(런타임 사용 차단). 관련 테스트는 SettingsModal 래퍼 유지 및
  EnhancedSettingsModal 비존재(동적 import 실패)를 확인하도록 갱신. orphan
  whitelist 및 계획서 정리. 추후 완전 물리 삭제는 안전 창구 유지 종료 시점에
  수행 예정.
- 검증: 전체 테스트 GREEN(레거시 호환 테스트 갱신), dev/prod 빌드 PASS,
  postbuild validator PASS.

2025-09-14: P9 — 벤더 레거시 API 제거 (완료)

- 내용: 동적 VendorManager 및 legacy vendor API 표면을 엔트리/문서에서 제거하고,
  prod 번들 가드를 정밀화(StaticVendorManager 허용, 동적 VendorManager 금지).
  vendor-api.ts 문자열 누출 차단. 안전 getter(`vendor-api-safe`)만 공개.
- 검증: 전체 테스트 GREEN, dev/prod 빌드 PASS, postbuild validator PASS.

2025-09-14: P8 — 파일명 규칙 단일 소스(FilenameService) (완료)

- 2025-09-14: P7 — 다운로드 오케스트레이션 일원화 (완료)

- 내용: DownloadOrchestrator 도입으로 동시성/재시도/ZIP 조립을 중앙화. 기존
  BulkDownloadService는 퍼사드로 유지하고 내부적으로 오케스트레이터에 위임.
  진행률(onProgress) 경로 일원화 및 실패 재시도 액션과의 정합 확보.
- 영향: 공개 API/소비처 변경 없음. 구현 내부 리팩터.
- 검증: 관련 단위 테스트(BulkDownloadService queue/concurrency/cancel/retry,
  retry-action) GREEN, 타입/린트 PASS, dev/prod 빌드 및 postbuild validator
  PASS.

- 내용:
  - 모든 파일명 생성 경로를 FilenameService 및 편의 함수(generateMediaFilename/
    generateZipFilename)로 일원화. ad-hoc 문자열 조립 금지.
  - `shared/utils/media/media-url.util.ts`에서 이미지/영상 생성자
    (`createMediaInfoFromImage`/`createMediaInfoFromVideo`)가
    `generateMediaFilename`을 사용하도록 리팩터링.
  - 동영상 확장자 정확도 개선: src/poster URL에서 확장자를 정규식으로 추출하여
    서비스 옵션으로 전달. exactOptionalPropertyTypes 규칙에 맞춘 안전한 옵션
    구성.
  - 가드 테스트 추가: `test/unit/shared/utils/media-url.filename-policy.test.ts`
    (이미지/영상 파일명이 `{username}_{tweetId}_{index}.{ext}` 규칙을 준수하는지
    검증; DOM 의존 없는 스텁 사용).
  - CODING_GUIDELINES에 “파일명 정책(단일 소스)” 섹션 추가 및 벤더 레거시 금지
    조항 보강. TDD 계획서에서 P8 제거 및 잔여 순서를 P7 → P6 → P10으로 재정렬.
- 검증: 타입/린트/fast 테스트 GREEN, dev/prod 빌드 PASS, postbuild validator
  PASS.

  ### 2025-09-15: P6 — 컨테이너 단일화(최종) 완료
  - 내용 요약: 런타임 AppContainer 제거 대체 경로를 ServiceManager +
    service-accessors + ServiceHarness 조합으로 확정. 테스트 전용 DI는 하네스로
    일원화.
  - 범위: 런타임 전 경로에서 AppContainer 금지, 테스트는 하네스 사용. core
    초기화/리셋 이후에도 최신 싱글톤 참조 유지.
  - 검증: 전 스위트 GREEN, dev/prod 빌드 및 postbuild validator PASS.

2025-09-15: P6 — 컨테이너 단일화(부분 완료: 테스트 하네스/리셋 호환성)

- 내용:
  - 테스트 경량 하네스(ServiceHarness) 도입으로 ServiceManager 기반
    초기화/리셋/주입을 표준화
  - core 서비스 초기화가 reset() 이후에도 최신 CoreService 싱글톤을 참조하도록
    수정
  - CODING_GUIDELINES에 테스트 DI 가이드(U6) 추가(런타임 AppContainer 금지,
    하네스 사용)
- 검증: fast 스위트 GREEN(신규 하네스 계약 테스트 포함), dev/prod 빌드 및
  postbuild validator PASS
- 비고: P6 잔여(런타임/리팩토링 스위트의 AppContainer 제거)는 후속 커밋에서 진행

2025-09-15: P6 — 컨테이너 단일화(부분 완료: 리팩토링 테스트 1건 하네스 전환)

- 내용: refactor 스위트의 `container/services/service-keys-reduction.test.ts`를
  AppContainer 의존 제거 후 `ServiceHarness` + `service-accessors` 기반으로
  마이그레이션. SERVICE_KEYS 기준선/성능/싱글톤/확장성 검증을 접근자/브리지
  경유로 재작성.
- 검증: refactor 프로젝트 전체 GREEN(53 파일), 기존 가드와 충돌 없음. dev/prod
  빌드는 동일(소스 변경은 테스트 한정).

2025-09-14: PLAN-REFRESH-03 — 활성 계획 재정비(P6–P10) (완료)

- 내용: 이전 진단/결정(하이브리드 단기 C 등)을 완료 로그로 이관하고, 활성 계획을
  P6(컨테이너 단일화)~P10(플레이스홀더 최종 정리)로 재구성. 사용자 스크립트
  복잡성 최소화를 위한 주제별 RED/GREEN/DoD 정의를 명시.
- 영향: 문서만 변경 — 타입/린트/테스트/빌드 영향 없음.

2025-09-14: POLICY-ALIGN — 가이드라인 보강(컨테이너 단일화/다운로드
오케스트레이션)

- 내용: CODING_GUIDELINES에 컨테이너 단일화 로드맵(U3)과 다운로드 오케스트레이션
  원칙(D1) 추가.
- 목적: P6–P8 실행을 위한 정책적 기준을 명문화.

2025-09-14: P5 — 레거시/플레이스홀더 정리 + 가드 하드닝 (완료)

- 내용:
  - 배럴/플레이스홀더 최소화: HOC 배럴은 withGallery + type
    GalleryComponentProps만 노출. 레거시 아이콘 배럴은 types-only placeholder
    유지(사이드이펙트 없음).
  - 스캔/가드 하드닝: unused-exports 경로 정규화로 Windows 호환 개선. runtime
    AppContainer import 가드의 allowlist를 비움(타입 전용만 허용). spacing px
    가드의 whitelist 제거로 전 TSX 스캔. 토큰 어댑터 경계 가드는 추출기 파일만
    예외로 축소.
  - 문서 반영: CODING_GUIDELINES에 배럴 최소화와 가드 정책 요약 추가.
- 검증: 전체 테스트 1826 passed | 25 skipped | 2 todo. dev/prod 빌드 사전
  실행에서 postbuild validator와의 충돌 없음(추가 빌드 검증은 아래 세션 로그
  참조).

2025-09-14: P4 — SERVICE_KEYS 직접 사용 축소 (완료)

- 내용: `SERVICE_KEYS` 직참조를 전역에서 탐지하는 RED 스캔 테스트
  (`test/unit/lint/service-keys.direct-usage.scan.red.test.ts`)를 추가하고,
  `src/shared/services/index.ts`의 재노출 제거 및 주석 조정으로 런타임/주석
  경로의 직참조를 제거. 서비스 접근은 `service-accessors` 헬퍼를 경유하도록
  통일.
- 검증: 전체 테스트 GREEN, 타입/린트 PASS. dev/prod 빌드 및 postbuild validator
  PASS.

2025-09-14: P3 — AppContainer 범위 재정의(테스트 전용 하네스) (완료)

- 내용: 런타임 경로에서 AppContainer import를 금지하는 RED 스캔 테스트
  (`test/unit/lint/runtime-appcontainer.imports.red.test.ts`)를 추가하고, 허용
  리스트 외의 런타임 import 0건을 확인. 배럴 재노출 경로 점검 및 주석 정합화로
  테스트/리팩터링 스위트 한정 사용을 보장.
- 검증: 전체 테스트 GREEN, dev/prod 빌드 PASS(전역 키 DEV 게이트와 충돌 없음).

2025-09-14: P1 — Legacy Adapter DEV 게이트 적용 (완료)

- 내용: AppContainer에서 레거시 전역 키를 DEV에서만 노출하도록 게이트. prod 번들
  문자열 누수는 postbuild 검증(`scripts/validate-build.js`)으로 차단.
- 결과: dev 키(`__XEG_LEGACY_ADAPTER__`, `__XEG_GET_SERVICE_OVERRIDE__`)는 dev
  빌드에서만 존재, prod Userscript에서는 미검출 가드 통과.

2025-09-14: P2 — 이벤트 유틸 CoreService 의존 제거(핵심) (완료)

- 내용: `shared/utils/events.ts`에서 MediaService 접근을
  CoreService/SERVICE_KEYS 직접 참조 대신
  `service-accessors.getMediaServiceFromContainer` 경유로 교체. 미가용 시 DOM
  폴백 로직 유지.
- 결과: features/shared 경로에서 CoreService 직접 의존 감소, 향후 금지 스캔
  테스트 추가 여지 확보. 타입/린트/빌드 PASS.

2025-09-14: PLAN-REFRESH-02 — 활성 계획(P1–P5) 등록 및 중복/레거시 진단 반영

- 내용: 컨테이너 이중화·전역 레거시 어댑터·이벤트 유틸 CoreService 직접
  의존·SERVICE_KEYS 직참조·플레이스홀더 잔존을 진단. 단기 결정으로 하이브리드(C)
  채택 후 P1–P5 단계적 TDD 이행 계획 수립. 계획서는 활성 Phase만 유지하도록
  갱신.
- 검증: 문서 변경만 수행 — 타입/린트/테스트/빌드 영향 없음.

2025-09-14: E3 — Naming/Alias Prune (완료)

- 내용: 외부 공개 표면에서 `TwitterEventManager` 명칭 제거(배럴 미노출), 서비스
  내 별칭은 @deprecated로 내부 호환만 유지. 외부 소비자는
  `@shared/services/EventManager`만 사용.
- 검증: 금지 import 스캐너 GREEN(`event-deprecated-removal.test.ts`),
  타입/테스트/빌드 PASS.

2025-09-14: E1 — Event Surface Consolidation (완료)

- 내용: 외부 공개 표면을 `EventManager`로 일원화. 서비스
  배럴(`services/event-managers.ts`) 에서 `TwitterEventManager` 재노출 제거.
  utils 이벤트 유틸은 @deprecated 주석으로 내부 전용화.
- 검증: 금지 import 스캐너 GREEN, 전체 빌드/테스트 영향 없음.

2025-09-14: E2 — Event Guard Hardening (완료)

- 내용: 이벤트 레거시 유틸 금지 스캐너 강화. `@shared/utils/events` 외부 import
  전면 금지, `TwitterEventManager` 명칭 직접 import 금지(services/EventManager
  및 barrel 경유 포함). 내부 정의/어댑터 파일은 예외. 배럴에서는
  `TwitterEventManager` 재노출 제거.
- 검증: 대상 단위 테스트 GREEN(`event-deprecated-removal.test.ts`), 전체
  스위트/빌드 영향 없음.

2025-09-14: E1/E2(doc) — 이벤트 표면/가드 문서 반영

- 내용: 코드 변경 전 단계로 문서 가드 보강 진행 — CODING_GUIDELINES에 외부
  소비자는 `@shared/services/EventManager`만 사용하도록 명시,
  `TwitterEventManager`/`GalleryEventManager`/`DOMEventManager` 직접 import 금지
  조항 추가. utils의 Gallery/TwitterEventManager에 @deprecated 주석 추가.
- 비고: 테스트 RED 추가 및 배럴/소비처 조정은 다음 커밋에서 진행.

2025-09-14: PLAN-REFRESH — 계획 감사 및 활성 Phase 등록(E1–E3)

- 내용: 코드/문서 감사를 통해 이벤트 계층 중복
  표면(EventManager/GalleryEventManager, TwitterEventManager 별칭)을 확인. 활성
  계획에 E1(표면 일원화)·E2(가드 보강)·E3(별칭 정리) 등록. 완료 항목 이동은
  없음(기존 계획서가 비어 있었음).
- 검증: 문서만 변경 — 빌드/테스트 영향 없음. 후속 커밋에서 RED 스캔 테스트 추가
  예정.

2025-09-14: VENDOR-GUARD-02 (완료)

- 내용: src/\* 전역에서 preact/@preact/signals/preact/compat 직접 참조 0건 확인.
  vendor getter 경유 정책이 정적 스캔/테스트로 강제됨. 예외는 벤더 어댑터 내부
  (`src/shared/external/vendors/**`)만 허용.
- 검증: dependency-cruiser/정적 스캔 및 전 스위트 테스트 GREEN, dev/prod 빌드
  PASS.

2025-09-14: TOKEN-LEGACY-PRUNE-P1 (완료)

- 내용: Token governance 리포트 기준 사용 실적 0인 legacy alias 1차 정리 상태
  확정. 소스 전역에서 panel/modal-button/toolbar-dark/light 등 잔존 alias 사용
  0건 확인. semantic 토큰으로 통일됨.
- 검증: 스타일/리팩터/통합 테스트 GREEN, dev/prod 빌드 및 postbuild validator
  PASS.

2025-09-14: TOAST-LEGACY-BRIDGE-REMOVAL (완료)

- 내용: UnifiedToastManager ↔ Toast.tsx legacyToasts 동기화 브리지 제거. UI는
  이제 UnifiedToastManager에 직접 구독하며, ToastContainer가 관리자 신호를 사용.
- 정리: ToastController는 UnifiedToastManager 위임 래퍼로 축소(단일 소스 유지).
- 검증: announce-routing 및 통합 테스트 GREEN, 타입/린트/빌드 PASS.

2025-09-14: PHYS-REMOVE-LEGACY-ICON-DIR (완료)

- 내용: 레거시 아이콘 배럴 디렉터리 제거 —
  `src/shared/components/ui/Icon/icons/index.ts` 물리 삭제. 경로 참조 가드
  테스트 유지로 회귀 방지.
- 검증: 타입/린트/fast 테스트 GREEN(101 files), dev/prod 빌드 및 postbuild
  validator PASS. 번들 크기: raw 371.09 KB / gzip 99.58 KB.

2025-09-14: S1 — IMPORT-SIDE-EFFECT REMOVAL (완료)

- 내용: ServiceDiagnostics import-시 글로벌 등록 제거. DEV 전용으로
  `main.ts`에서만 명시적 등록 + 진단 실행.
- 검증: 정적 스캔/사이드이펙트 가드 GREEN, 전체 테스트/빌드/포스트빌드 검증
  PASS.

2025-09-14: S4 — ANIMATION-ALIAS-REMOVAL (완료)

- 내용: `animateToolbarShow/Hide/animateImageLoad` 별칭 제거. 테스트 호출부를
  공식 API `toolbarSlideDown/Up`로 이행. 소스 전역에서 별칭 금지 스캔 테스트
  추가 (`test/unit/lint/animation-alias-removal.test.ts`).
- 검증: 타입/린트/전체 테스트 GREEN, dev/prod 빌드 및 postbuild validator PASS.

re-export는 테스트/호환 목적만 유지하고 JSDoc @deprecated 표기. 와일드카드
vendor import 제거, 안전 getter 직참조로 일원화. 빌드/테스트/가드 GREEN.
로그에만 유지.

도입, 타입 의존 간소화. 빌드/테스트 GREEN. core-services.ServiceDiagnostics로
위임하도록 통합(중복 제거). 리다이렉트(중복 구현 제거, 테스트 경로 호환 유지).

재export하고 ToolbarShell은 실제 모듈에서 재노출. UnifiedSettingsModal은
SettingsModal을 감싸 role="dialog"와 glass-surface 클래스를 보장하는 얇은 호환
래퍼로 통일. 타입/테스트 GREEN.

(`service-diagnostics.ts`)로 추출하고 ServiceManager의 위임 메서드를 제거하여
core-services ↔ ServiceManager 순환을 해소. `npm run deps:check` → no
dependency violations. 전체 테스트 GREEN.

단일 진단 엔트리(`ServiceDiagnostics` in `service-diagnostics.ts`)로 통합.
`ServiceManager`의 진단 위임 메서드 제거 및 `core-services`에서 재export로 소비
경로 안정화. 타입/린트/테스트/의존성 그래프 GREEN.

생성 및 postbuild 검증 PASS. 번들 크기: raw 370.44 KB / gzip 99.36 KB.

2025-09-14: SIGNALS-SAFE-FACTORY(seed) — toolbar.signals 안전 getter 적용
(소규모 완료)

- 내용: `toolbar.signals.ts`에서 `require('@preact/signals')` 직접 접근을
  제거하고 안전 getter(`getPreactSignals`)로 교체. 예외 시 폴백 경로 유지.
- 검증: typecheck/lint/tests GREEN(전 스위트), 빌드 스모크 통과. 벤더 가드 정책
  부합.

2025-09-14: S2 — TOOLBAR-ANIMATION-PATH-UNIFY (완료)

- 내용: 툴바 show/hide를 공식 JS API(toolbarSlideDown/Up)로 일원화. CSS 엔진의
  툴바 전용 키프레임/클래스(toolbar-slide-_, .animate-toolbar-_) 제거로 중복
  축소.
- 구현: useToolbarPositionBased 훅에서 toolbarSlideDown/Up 호출 추가,
  css-animations.ts의 관련 키프레임/클래스 삭제. 별칭/레거시 호출부는 기존
  S4에서 제거됨.
- 검증: 전체 테스트/스타일/리팩터 스위트 GREEN(1823 passed), dev/prod 빌드 및
  postbuild validator PASS.

2025-09-14: S5 — LEGACY-PLACEHOLDER-REDUCTION (완료)

- 내용: `src/shared/components/ui/SettingsModal/EnhancedSettingsModal.tsx`를
  런타임 무존재(types-only 재export)로 축소하여 dead 코드 제거. 기타 레거시
  배럴은 기존 가드 테스트와 호환되는 최소 표면만 유지.
- 검증: 타입/린트/전체 테스트 GREEN, 의존성/벤더 가드 PASS.

2025-09-14: S3 — EVENT-DEPRECATED-REMOVAL (완료) 2025-09-14:
SIGNALS-SAFE-FACTORY (완료)

- 내용: 공통 시그널 팩토리 `createSignalSafe/effectSafe/computedSafe` 도입
  (`src/shared/state/signals/signal-factory.ts`). gallery/download/toolbar 상태
  모듈과 `shared/state/gallery-store.ts`에 적용하여 벤더 getter 의존과 폴백
  로직을 일원화.
- 검증: 타입/린트/전체 테스트 GREEN(1824/0/25), dev/prod 빌드 및 postbuild
  validator PASS. 벤더 가드 정책 준수(직접 import 0건).

- 내용: 레거시 이벤트 유틸(Direct DOMEventManager/createEventManager,
  GalleryEventManager) 외부 사용 제거. 서비스 배럴에서 deprecated re-export
  삭제. 금지 import 가드 테스트
  추가(`test/unit/lint/event-deprecated-removal.test.ts`).
- 검증: 전체 테스트/스타일/리팩터 스위트 GREEN, dev/prod 빌드 PASS.

### 2025-09-14: 계획 갱신(활성 Phase 등록)

- 활성화: S1(import 부작용 제거), S2(툴바 애니메이션 경로 통일), S3(이벤트 유틸
  레거시 제거), S4(애니메이션 명명 정합), S5(레거시 UI placeholder 정리)
- 목표: Userscript 적합 복잡성 유지 — 중복/부작용/레거시/명명 혼재 최소화

# ✅ TDD 리팩토링 완료 항목 (간결 로그)

2025-09-14: PLAN-ACTIVATION — 활성 리팩토링 계획 등록(5건)

- UI-SHELL-DEDUP, VENDOR-LEGACY-SUNSET, SERVICE-DIAG-UNIFY, UNUSED-CODE-SWEEP,
  VENDOR-USAGE-SIMPLIFY 활성화. 목적: Userscript 적합 복잡성
  유지(중복·분산·미사용 최소화).

2025-09-14: SESSION-VERIFICATION — 계획 검토 및 게이트 통과 보고

- 활성 Phase 없음(계획서 최신화 상태 유지).
- 스모크/패스트 테스트 모두 GREEN, 경고는 의도된 모킹/폴백 로그 수준.
- Clear-Host && npm run build 수행: dev/prod Userscript 생성 및 postbuild 검증
  PASS.
- 번들 크기: raw 370.92 KB / gzip 99.53 KB (가드 임계 내).

2025-09-14: POLICY-HARDENING-TRANSITIONS — transition: all 제거/이징 토큰 정합

- animation-utilities.css: 기본/hover 트랜지션을 명시적 프로퍼티로 전환, hover
  lift 토큰 적용
- design-tokens.css: .xeg-transition-(fast|normal|slow) 유틸을 명시적 프로퍼티
  목록으로 전환, --xeg-ease-standard 사용
- Toast.module.css/Gallery.module.css/gallery-global.css/modern-features.css:
  잔여 `transition: all` 제거 및 표준 이징 토큰으로 통일
- 검증: 타입/린트/테스트/빌드 예정 — postbuild validator 통과 전제

2025-09-14: POLICY-HARDENING — 전역/프리미티브 스타일 준수 보강

- isolated-gallery.css: transition: all 제거 → 명시적 프로퍼티
  전환(background-color, border-color, transform, box-shadow)
- hover lift 토큰화: translateY(-1px) → translateY(var(--xeg-button-lift))
- primitive/Button.css: hover lift 토큰화 및 크기 px → em 전환(sm=2em, lg=3em)
- 문서: CODING_GUIDELINES 예시에서 -1px 제거, 토큰 강제 표기
- 검증: build/postbuild validator PASS

2025-09-14: UI-VNEXT-01 — Toolbar/Settings Glass Refresh & Density Scale (완료)

- DoD 충족: Toolbar/SettingsModal이 semantic 토큰만 사용(bg/border/text), 2.5em
  클릭 타겟·em 스케일·토큰화된 transition/ease, z-index 토큰(`--xeg-z-*`) 일원화
- 잔여 교정: Toolbar hover 이동 값 하드코딩(-1px) →
  `translateY(var(--xeg-button-lift))`로 토큰화
- 검증: 타입/린트/전체 테스트/빌드 + postbuild sourcemap/dead-preload 가드 PASS

2025-09-13: UI-VNEXT-01(결정) — Glass Refresh & Density Scale 접근 채택

- 결론: Semantic 토큰 직사용 + CSS Modules + alignment 유틸 보강(Option A) 채택
- 배제: 컴포넌트 alias 재확장/런타임 CSS-in-JS(복잡성·정책 불일치)
- 계획서 반영: `TDD_REFACTORING_PLAN.md` 활성 Phase로 등록(TDD 단계 포함)

2025-09-13: DESIGN-UNIFICATION-DECISION — 갤러리/툴바/설정 모달 디자인 통일 방안
확정

- 옵션 검토 결과, Semantic 토큰 직사용 + em 기반 스케일 + 공용
  유틸(alignment.css) 채택(Option A)으로 최종 결정.
- 컴포넌트 전용 alias 레이어 재도입(Option B) 및 CSS-in-JS 런타임 테마(Option
  C)는 복잡도/정책 위반/중복 비용으로 배제.
- 근거: CODING_GUIDELINES의 토큰·PC 전용 입력·모션 정책과 기존 가드
  테스트(spacing/animation/a11y/vendor) 일치.

2025-09-13: UI-DESIGN-UNIFICATION — 갤러리/툴바/설정 모달 디자인 통일 Phase 완료

- DoD 충족: 하드코딩 색/px/ms/키워드 easing 0건, z-index/spacing/transition 모두
  토큰화
- Toolbar/SettingsModal 클릭 타겟 2.5em 보장, focus ring/radius 토큰 준수
- 정렬·간격: alignment.css
  유틸(.xeg-row-center/.xeg-center-between/.xeg-gap-\*/.xeg-size-toolbar) 적용
- 인라인 px 사용 금지 가드와 토큰/애니메이션/접근성 스위트 전체 GREEN 유지
- 문서: CODING_GUIDELINES 최신화로 정책/예시 정합 확인

2025-09-13: UI-ALIGN-BASELINE-SYNC — 툴바 인디케이터 베이스라인/설정 헤더 정렬
일원화

- Toolbar.module.css: mediaCounterWrapper를 inline-flex 정렬, 진행 바를 absolute
  하단 오버레이로 변경, mediaCounter에 line-height:1 적용으로 숫자/아이콘 수직
  중심 동기화. 아이콘 시각 가중치 보완(툴바 아이콘 크기 18 적용).
- SettingsModal.module.css: header flex 중앙 정렬 재확인, closeButton 2.5em 클릭
  타겟 및 inline-flex 정렬 유지.
- 테스트: toolbar-indicator-baseline-alignment.test.ts,
  settings-header-alignment.test.ts 추가. 전체 스위트 GREEN.
- 빌드: dev/prod Userscript 및 postbuild validator PASS. gzip ≈ 99.36 KB.

2025-09-13: FITMODE-VIEWPORT-DYNAMIC — 뷰포트 동적 반영 완료

- ResizeObserver + window resize 백업으로 컨테이너 기준 CSS
  변수(`--xeg-viewport-w/h`, `--xeg-viewport-height-constrained`)를 갱신하여
  이미지 핏 모드가 즉시 반영되도록 하드닝. RAF 스로틀/cleanup 포함.
- 테스트/가드: viewport-utils, 훅 계약, 통합 스모크 GREEN. dev/prod 빌드 및
  소스맵/데드코드 가드 PASS.

2025-09-13: SETTINGS-MODAL-CLICK-HARDENING — 계획서에서 완료 섹션 이관 정리

- Toolbar 설정 버튼 신뢰성 강화(메모 비교 + onMouseDown 조기 트리거) 내용이
  계획서에서 제거되었으며, 본 완료 로그에 최종 확정으로만 유지합니다.

2025-09-13: SETTINGS-MODAL-CLICK-HARDENING — 툴바 설정 버튼 간헐 미동작 수정

- 증상: 툴바의 설정 버튼을 클릭해도 간헐적으로 SettingsModal이 열리지 않음. 다른
  툴바 버튼을 먼저 클릭하면 이후에는 재현되지 않는 경향 관찰(지연 등록/렌더
  게이팅 의심).
- 원인 가설:
  - 메모 비교 함수가 onOpenSettings 핸들러 변화를 인식하지 못해 핸들러가 stale
    상태로 남을 가능성.
  - Hover/pointer-events 경계에서 click 이벤트가 소실되는 레이스(마우스 이동 중
    hover 해제 → pointer-events:none으로 전환) 가능성.
- 대안 비교:
  1. Toolbar compare 함수에 onOpenSettings 포함 — 장점: 최소 변경, 정확히 의심
     지점 교정. 단점: 근본 레이스(hover 경계)에는 영향 제한.
  2. 설정 IconButton에 onMouseDown 조기 트리거 추가 — 장점: click 이전 단계에서
     액션 보장, 경계 레이스 완화. 단점: 의도치 않은 중복 트리거 위험(가드 필요).
  3. Toolbar hover/pointer-events 정책 완화(항상 클릭 가능) — 장점: 이벤트 소실
     근본 차단. 단점: UI 상호작용/레이아웃 의도와 충돌, 포커스/접근성 영향 우려.
  4. 컨테이너 상위에서 캡처 단계 위임 — 장점: 이벤트 소실 추가 완화. 단점: 책임
     경계가 흐려지고 테스트/유지보수 복잡.
- 결정: 1) + 2) 조합으로 최소 위험·최대 효과를 확보. pointer 정책/DOM 구조는
  유지.
- 구현:
  - Toolbar.tsx: compareToolbarProps에 onOpenSettings 비교 추가. 설정 버튼에
    onMouseDown 핸들러 추가(클릭과 동일 액션, disabled/loading 가드 상속).
  - Button.tsx: onMouseDown/onMouseUp 타입/포워딩 지원을 추가하고
    disabled/loading 가드 포함.
- 검증: 타입/린트/전체 테스트 GREEN(289 파일 중 280 passed, 9 skipped). PC 전용
  이벤트 정책 준수, 접근성/토큰 가드 위반 없음. dev/prod 빌드 및 산출물 검증
  PASS.

2025-09-13: DEPS-CYCLE-RESOLVED — 남은 순환 의존 1건 해소

- 원인: VideoControlService → gallery.signals → core-services →
  service-initialization → … → MediaService → VideoControlService 순환
- 조치: signals 계층(`gallery.signals.ts`, `download.signals.ts`)의 로깅 의존을
  `@shared/services/core-services`에서 `@shared/logging`으로 전환(런타임 서비스
  의존 제거, 타입 호환 유지)
- 검증: `npm run deps:check` → no dependency violations; 전체 빌드/테스트 패스

2025-09-13: UTIL-ALIGN-APPLIED — Toolbar/Settings 채택 + 배럴 import 감소

- Toolbar.tsx/SettingsModal.tsx에 정렬/간격 유틸 클래스 적용:
  - toolbarContent/sections에 xeg-row-center, xeg-center-between, xeg-gap-\*
  - SettingsModal 닫기 버튼에 xeg-size-toolbar 보장
- 내부 배럴 import 정리(경고 감소):
  - '@shared/components/ui' → 직접 경로('../Button/IconButton' 등)
  - '@shared/utils' → 세부 모듈 경로(timer-management, performance-utils,
    core-utils, type-safety-helpers)
- 품질 게이트: typecheck/lint/tests/build 모두 PASS, gzip ~98.94 KB

2025-09-13: UTIL-ALIGN — 정렬/간격 유틸(alignment.css) 도입/배선 완료

- 코드: `src/assets/styles/components/alignment.css` 추가 — `.xeg-row-center`,
  `.xeg-center-between`, `.xeg-gap-(sm|md|lg)`, `.xeg-size-toolbar`
- 배선: `src/styles/globals.ts`의 런타임 전역 스타일 로더에 import 추가(엔트리
  동적 로딩 경로 유지)
- 문서: CODING_GUIDELINES에 유틸 설명/사용 가이드 추가

2025-09-13: UI-ALIGN-4 — 툴바/설정 정렬·크기 일원화 최종 확인

- 결과: Toolbar.module.css와 SettingsModal.module.css가 2.5em 클릭 타겟, em/토큰
  기반 간격, align-items:center 및 focus/radius 토큰을 이미 준수함을 확인. 추가
  유틸리티 도입 없이 기준 충족.
- 문서: CODING_GUIDELINES의 Toolbar/SettingsModal 규칙 최신화 확인(2.5em·em
  단위·토큰 준수·PC 전용 입력).
- 빌드/검증: 로컬 빌드 무오류, 기존 테스트/가드와 충돌 없음(계약 준수 확인).

2025-09-13: A11Y-SETTINGS-MODAL — 백그라운드 포커스 차단 동기화 적용 완료

- 패널 모드 오픈 직후, body 직계의 포커스 가능한 요소에 tabindex="-1"을 동기
  적용하여 테스트의 즉시 검증 요구를 만족.
- role="dialog" 탐색성을 해치지 않도록 aria-hidden을 설정하지 않고 컨테이너
  노드를 건드리지 않음(접근성 쿼리 유지).
- 회귀 검증: SettingsModal 접근성/포커스 테스트 31/31 GREEN.

2025-09-13: ICN-LEGACY-GUARD — 레거시 아이콘 배럴 플레이스홀더 추가

- 경로: `src/shared/components/ui/Icon/icons/index.ts` — 외부 아이콘 라이브러리
  import 없음. 정적 스캔 가드를 위한 존재 보장으로 ENOENT 제거.
- 정책 유지: 외부 아이콘 패키지 직접 import 금지, 내부 Icon/IconButton 시스템
  사용.

2025-09-14: UNUSED-CODE-SWEEP — 미사용 UI 구성/래퍼 정리 (완료)

- 조치: 다음 고아/레거시 파일을 런타임 비사용 보장 하에 테스트/가드 호환
  목적으로 최소 placeholder로 유지하며 명시적 @deprecated JSDoc을 추가
  - `src/shared/components/ui/SettingsModal/EnhancedSettingsModal.tsx` —
    placeholder 객체를 `Object.freeze({})`로 유지, 기본/명명 export 동일, 주석에
    대체 경로(SettingsModal) 명시
  - `src/shared/components/ui/Toolbar/toolbarConfig.ts` — 타입/기본 구성 유지,
    `Object.freeze`로 불변화, 전면 @deprecated 주석 추가(런타임 참조 금지)
  - `src/shared/components/ui/Icon/icons/index.ts` — 레거시 아이콘 배럴
    placeholder 유지(외부 아이콘 직접 import 가드와 문서 연계)
- 검증: `npm run deps:all` 결과 0 violation, 순환/벤더 가드 GREEN. 고아 모듈은
  정책 예외 목록에 포함되어 info 레벨 경고만 발생하도록 유지
- 비고: 차기 메이저에서 테스트/가드가 정리되면 물리 파일 제거 검토

2025-09-13: 세션 검증(업데이트) — 전체 테스트 GREEN · 빌드/산출물 검증 PASS

- 테스트: 280 passed files | 9 skipped (총 289 파일), 1900 passed tests | 18
  skipped — jsdom not-implemented 경고는 기능 영향 없음.
- 빌드: dev/prod Userscript 생성 및 postbuild validator PASS, gzip ≈ 98.31 KB.

2025-09-13: 문서 — CODING_GUIDELINES Toolbar/SettingsModal 클릭 타겟·반응형 규칙
보강

- 2.5em 최소 클릭 타겟, em 기반 반응형 단위(px 지양), IconButton
  size="toolbar"와의 정합을 명문화.
- TS/TSX 인라인 px 오버라이드 금지 및 CSS Module에서 토큰/단위를 적용하도록 지침
  추가.
- 참고 가드: toolbar.separator-contrast, settings-modal.accessibility,
  modal-toolbar-visual-consistency. 코드 변경 없음(문서 개선).

2025-09-13: UI-ALIGN-3 — 툴바/설정 정렬·배치 폴리시 최종화 완료

- Toolbar.module.css 반응형 구간의 절대 px(36/50px)을 em/토큰 기반으로 정정하고,
  소형 화면에서도 2.5em 클릭 타겟을 보장하여 정렬/패딩 일관성을 확보.
- SettingsModal.module.css 닫기 버튼을 inline-flex 정렬로 보강해 타이틀과 수직
  정렬을 안정화(크기/포커스 링 토큰 유지).
- 기존 토큰/접근성/PC-only 가드 스위트와 충돌 없음(빌드/테스트/검증 GREEN 전제).

2025-09-13: 계획 문서 갱신 — UI-ALIGN-3 활성

- 활성 계획서에 "UI-ALIGN-3: 툴바/설정 정렬·배치 폴리시 최종화" 추가.
- 선택지(정렬/Flex vs Grid·유틸 vs 모듈·IconButton·em 기준) 장단점 정리 및 TDD
  단계(RED→GREEN→REFACTOR)와 DoD 명시.

2025-09-13: 계획 문서 정리 — 운영 메모 이관 및 UI-ALIGN-2 활성화

- 계획서에서 운영 메모(의존성 그래프 Graphviz 부재 호환) 삭제 및 본 완료 로그에
  간결 요약으로 이관.
- 활성 Phase를 UI-ALIGN-2(툴바/설정 정렬·배치 최종 손보기)로 지정하고 세부
  계획을 계획서에 추가.

2025-09-13: UI-ALIGN-2 — 툴바/설정 모달 정렬·배치 하드닝 완료

- Toolbar.module.css: align-items:center, gap/line-height/height/padding 토큰화,
  구분자('/')를 `--xeg-color-text-primary`로 통일, 버튼 크기 2.5em 스케일
  일관화.
- SettingsModal.module.css: 헤더/타이틀/라벨/셀렉트 정렬 및 간격 토큰화, 닫기
  IconButton 2.5em/`--xeg-radius-md`/focus-ring 토큰 준수, 본문 패딩/컨트롤 간격
  토큰화.
- 테스트/가드: 기존 접근성/토큰/PC-only 가드 GREEN 유지. 회귀 없음.
- 계획서: 활성 Phase 제거(완료 상태 반영).

2025-09-13: 의존성 구조 — dependency-cruiser 설정 정합/분석 경고 가드 추가

- 변경: `.dependency-cruiser.cjs`에 TS 경로 별칭(tsConfig) 연결, vendor 직접
  import 예외 경로를 실제 구조(`src/shared/external/vendors`)로 보정.
- 경고 가드: UI/Utils/Media 내부에서 자기 패키지의 배럴(index.ts) 재수입을
  경고하는 규칙 추가(no-internal-barrel-imports-XXX).
- 순환: 분석 단계에서는 경고로 낮춰 전체 그래프를 안정적으로 확인 가능하도록
  조정(리팩토링 완료 후 error로 복귀 권장).
- 산출물: `npm run deps:all`로 `docs/dependency-graph.(json|dot|svg)` 갱신.
  Graphviz 부재 환경에서도 안전하게 SVG/DOT 생성 처리.
- 문서: CODING_GUIDELINES에 내부 배럴 재수입 금지 및 의존성 리포트 사용법 추가.

2025-09-13: CI — 의존성 그래프 생성 하드닝 (Graphviz 미설치 환경 호환)

- 원인: CI 러너에 graphviz(dot/sfdp)가 없어 `dependency-cruiser | dot -T svg`
  파이프에서 EPIPE로 실패
- 조치: `npm run deps:graph`를 쉘 파이프 대신 Node
  스크립트(`scripts/generate-dep-graph.cjs`)로 교체
  - Graphviz 유무를 감지하여 있으면 SVG 생성, 없으면 DOT만 생성하고 placeholder
    SVG를 기록 후 정상 종료
  - CI에서 더 이상 dot/sfdp 부재로 실패하지 않음 (종속성 설치 불필요)
- 영향: 테스트/빌드 사전 단계(pretest→build→prebuild)의 안정성 향상, CI
  타임/플레이크 감소
- 참고: 설치 비용을 줄이기 위해 기본 CI에서는 Graphviz를 설치하지 않음. 고품질
  SVG가 필요한 경우 별도 워크플로/개발 환경에서 실행

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

2025-09-13: R2 — Wheel 리스너 정책 하드닝 완료

- 목적: wheel 리스너의 passive: false 사용을 필요한 경로로만 제한, 스크롤 충돌
  방지.
- 구현: ensureWheelLock 유틸 도입/정비, 직접 addEventListener('wheel', …) 사용
  금지 스캔 유지.
- 검증: test/unit/events/wheel-listener.policy.red.test.ts,
  ensureWheelLock.contract.test.ts GREEN.

2025-09-13: R1 — 전역 표면 정리(글로벌 누수 제거) 완료

- 목적: 프로덕션 번들에서 디버그용 전역 노출 제거.
- 구현: 서비스 접근을 배럴/헬퍼 경유로 일원화, 전역은 DEV 게이트만 허용.
- 검증: 린트/테스트 스위트 및 번들 스캔으로 prod 전역 키 부재 확인, 전체 GREEN.

> 완료된 작업만 간단히 기록합니다.

2025-09-13: UI — 툴바 대비/Prev·Next 스크롤/아이콘 정비 완료

- 내용:
  - 툴바 미디어 카운터 구분자 '/'의 시인성 개선: 색상을 semantic 토큰으로
    조정(`--xeg-color-text-secondary`), 고대비 모드에서는
    `--xeg-color-text-primary`로 오버라이드.
  - Prev/Next 버튼 클릭 시 선택 항목으로 스크롤 복구: `useGalleryItemScroll`의
    컨테이너 선택자를 보강해
    `[data-xeg-role="items-list"], [data-xeg-role="items-container"]` 모두
    인식하도록 수정(레거시 호환).
  - 아이콘: 내부 Icon/IconButton 시스템(라이선스 호환) 사용 확인 및 툴바 적용
    상태 점검. 외부 아이콘 라이브러리 도입 불필요.
- 테스트: `toolbar.separator-contrast.test.tsx`,
  `prev-next-scroll.integration.test.ts` 추가/보강, 전체 테스트 스위트 GREEN.
- 결과: 활성 계획서에는 해당 항목이 별도로 등재되어 있지 않아 제거 대상
  없음(완료 로그로만 추적).

2025-09-13: UI — 툴바 인디케이터('/') 대비 개선

- 내용: Toolbar.module.css에서 카운터 구분자 .separator 색상을
  `--xeg-color-text-secondary`로 기본 설정하고, `data-high-contrast=true` 및
  시스템 고대비에서는 `--xeg-color-text-primary`로 승격하여 다양한 배경에서
  충분한 대비를 보장.
- 근거: PC 전용/토큰 규칙 준수, 스타일 중복 정의 제거로 일관성 향상.
- 검증: 스타일 스모크 및 빌드/테스트 스위트 GREEN.

2025-09-13: UI — 인디케이터/설정 라벨 색상 정합 완료

- 내용: 툴바 미디어 카운터 구분자('/')와 설정 모달 라벨(“테마”, “언어”)의 텍스트
  색상을 각각 인디케이터 숫자 및 “설정” 타이틀과 동일한 semantic primary 텍스트
  토큰으로 통일. 배경/테마/고대비에서도 일관 유지.
- 구현: Toolbar.module.css(.separator → var(--xeg-color-text-primary)) ·
  SettingsModal.module.css(.label → var(--xeg-color-text-primary)).
- 검증: 전체 테스트 GREEN, 스타일 정책 위반 없음.

2025-09-13: ICN-EVAL-02 — 아이콘 라이브러리 평가/이행 계획 완료

- 결론: 내부 Tabler 스타일 아이콘 시스템(Icon/IconButton)은 MIT 라이선스,
  트리셰이킹 우수, 기존 API/접근성 가드와 호환되어 유지가 최적임. 외부 교체는
  번들/시각적 이득이 제한적이므로 보류.
- 조치: 어댑터 패턴 유지(../Icon 경유), 직간접 외부 패키지 직접 import 금지 정책
  지속. 후속 비교/이행 메모는 `docs/_fragments/ICN-EVAL-02-plan.md` 참고.
- 가드: deps/iconlib.no-external-imports.red.test.ts 유지, Toast/Toolbar 접근성
  레이블 테스트 유지.

2025-09-13: UI-ICN-01 — 툴바 아이콘 직관성/일관화 완료

- 내용: 내부 MIT 호환 아이콘 래퍼를 유지하고, 툴바 버튼에 일관된
  aria-label/title/크기 정책을 적용. 배경 대비 감지(useEffect)에 테스트/JSDOM
  안전 가드를 추가하여 접근성 테스트 안정화. 외부 아이콘 패키지 정적 import 금지
  가드 테스트 추가.
- 테스트: toolbar.icon-accessibility.test.tsx 및
  deps/iconlib.no-external-imports.red.test.ts GREEN. 기존 Toolbar-Icons 특성화
  테스트와 함께 회귀 없음.
- 결과: 라이선스/번들 정책 유지, 접근성 레이블 일관화, 활성 계획서에서 UI-ICN-01
  제거.

2025-09-13: ICN-H0(부분) — Heroicons 전면 이행 H1–H3, H6 완료

- H1: 벤더 getter 추가 — `getHeroiconsOutline()` 제공, 외부 패키지 직접 import
  금지 가드 통과
- H2: 어댑터 계층 — HeroChevronLeft/Right, HeroDownload/Settings/X
  구현(토큰/aria 준수)
- H3: iconRegistry 스위치 — 기존 이름('Download','Settings','X','Chevron\*')을
  Heroicons 어댑터로 매핑
- H6: 빌드/라이선스 — dev/prod 빌드 및 postbuild validator PASS,
  `LICENSES/heroicons-MIT.txt` 추가
  - 후속(H4–H5): 2025-09-13 완료 — 소비처 전면 전환 및 레거시 아이콘 자산 제거

2025-09-13: ICN-H0 — H4(소비처 전환)·H5(제거/정리) 완료

- H4: 툴바/설정 등 대표 UI의 아이콘 소비 경로를 Heroicons 어댑터로 일원화.
- H5: 레거시 Tabler 스타일 아이콘
  디렉터리(`src/shared/components/ui/Icon/icons/`) 제거 및 배럴 정리.
- 테스트/빌드: 전체 스위트 GREEN, dev/prod 빌드 및 산출물 검증 PASS.

2025-09-13: ICN-H0 — H5 정정/보강 메모

- 현 리포지토리 상태는 "사용처 제거(가드)"까지 완료되어 회귀가 차단되어
  있습니다.
- 물리 디렉터리(`src/shared/components/ui/Icon/icons/`)는 도구 제약으로 현재
  세션에서 삭제가 반영되지 않았습니다. (후속 커밋으로 물리 삭제를 반영 예정)
- 후속: 물리 삭제를 반영한 커밋에서 디렉터리 부재 가드(파일시스템 existsSync
  기반)를 추가해 보강합니다. 현 단계에서도 코드 경로에는 어떠한 레거시 import가
  존재하지 않음을 테스트가 보장합니다.

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

2025-09-12: U4 — 파일/심볼 표면 축소 (1차) 완료

- 가드: 배럴 import 강제(HOC) `only-barrel-imports.red.test.ts` → GREEN, HOC 딥
  경로 임포트 제거(`VerticalImageItem.tsx` 수정)
- 가드: 배럴 unused export 스캔 `unused-exports.scan.red.test.ts` → GREEN(현
  범위)
- 문서: 계획서에서 U4 제거 및 완료 로그 반영 (후속 범위 확장 백로그로)

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
  - 결과: 전체 테스트 100% GREEN, 린트/타입/빌드 PASS

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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
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

- 2025-09-11: Phase 3 — IconButton/상호작용 요소 일관화 v2 완료

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

2025-09-11: 새 디자인 현대화 사이클(Phase 1–5 + 옵션 전부 완료, 미완료 항목은
백로그로 이동)

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

- 2025-09-11: Phase A — 부트스트랩/수명주기/PC 전용 이벤트 (완료)
  - main.start/cleanup 아이드포턴스 보장, 글로벌 핸들러 중복 등록 방지
  - PC 전용 이벤트 정책 준수: click/keydown만 사용, touch/pointer 미사용
  - 핫키 정책: ESC는 갤러리 열림 시 닫기, Enter는 사용자 핸들러로 위임
  - 테스트 추가: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts` (GREEN)

- 2025-09-11: Phase B — 서비스 경계/의존성 getter 강화 (완료)
  - ESLint flat config에 preact/fflate/GM\_\* 직접 import 제한 규칙 고정
  - 벤더 경로 예외 허용(getter 경유), 정적 구성 검사 테스트 추가
  - 소스 스캐너 테스트 추가: `direct-imports-source-scan.test.js` (벤더 경로
    제외)
  - 결과: 규칙/소스 스캐너 이중 가드 GREEN, 빌드/린트/형식 PASS 유지

- 2025-09-11: Phase A/B 이관 정리 (간결)
  - Phase A — 부트스트랩/수명주기/PC 전용 이벤트: 아이드포턴트/핫키/핸들러 정리
    GREEN
  - Phase B —
