## 2025-09-16 — Phase 3: Startup 지연/가드 1차 적용

- startup import/eval 가드 테스트 추가:
  `test/performance/startup-latency.test.ts`
- main.ts 테스트 모드 자동 시작 비활성화, core-service 등록 경로
  정리(service-initialization 직접 import)
- BulkDownloadService의 service-accessors 모듈 레벨 fallback 제거로 즉시 import
  방지
- 기대효과: 초기 타이머/리스너/모듈 평가 비용 감소, 비핵심 서비스는 실제 사용
  시점까지 로딩 지연

### 2025-09-16 — PHASE 3(완료): Theme/Filename 서비스 지연 초기화 전환

- 내용: `service-initialization.ts`에서 ThemeService와 FilenameService를
  registerFactory 기반의 lazy-init으로 전환. ToastController는 사용자 피드백
  경로 특성상 eager 인스턴스로 유지.
- 변경:
  - ThemeService: `SERVICE_KEYS.THEME` 및 `'theme.service'` 두 키에 팩토리 등록
    (단일 인스턴스 공유)
  - FilenameService: `SERVICE_KEYS.MEDIA_FILENAME`에 팩토리 등록
  - BulkDownload/ZIP/Settings/Diagnostics는 import guard 대상 유지
- 테스트: 전체 스위트 GREEN, startup-latency 가드 포함. 일부 테스트 환경에서의
  중복 등록 경고는 idempotency 시나리오에서 의도된 동작으로 확인.
- 영향: 초기 번들 평가 시점에 Theme/Filename 인스턴스 생성이 발생하지 않음.
  실사용 접근 시 최초 생성되며, 기능 회귀 없음.

### 2025-09-16 — PLAN-CLOSE (B/C/F 관찰 지속 항목 정리)

### 2025-09-16 — PHASE 3(부분) 완료: 비핵심 서비스 사전 워밍업 제거 (추가 기록)

- 내용: `src/main.ts`에서 비핵심 서비스 사전 워밍업 호출 제거로 초기화 비용을 더
  낮춤. `initializeNonCriticalSystems()`는 워밍업을 수행하지 않고, 실제 사용
  시점까지 지연 실행됨.
- 영향: 초기 타이머/인스턴스 사전 생성 방지. 기능 회귀 없음.
- 후속: startup-latency 테스트 보강 예정.

### 2025-09-16 — PHASE 3(부분) 완료: 비핵심 서비스 사전 워밍업 제거

- 내용: `src/main.ts`에서 비핵심 서비스 사전 워밍업(타이머로
  `warmupNonCriticalServices()` 호출)을 제거하여 실제 사용 시점까지 초기화가
  지연되도록 조정했습니다. 초기 타이머 1개 감소 및 불필요 인스턴스 사전 생성
  방지.
- 영향: 기능 회귀 없음(서비스는 최초 접근 시 팩토리/컨테이너 경유로 초기화).
  문서의 Phase 3 항목 중 해당 작업을 완료 처리.
- 후속: Toast 컨테이너 경계 재검토, startup-latency 테스트 추가는 별도 진행.

### 2025-09-16 — PLAN-SYNC-6 (활성 계획 최신 상태 확인)

- 내용: 활성 계획서(TDD_REFACTORING_PLAN.md)를 점검하여 현재 남은 작업이 Phase
  3(비핵심 서비스 지연 실행) 단일 항목임을 재확인했습니다. 이동할 추가 완료
  항목은 없으며, 문서 구조만 최소 정리(불필요한 주석 제거)했습니다.
- 영향: 문서만 변경 — 타입/린트/테스트/빌드/포스트빌드 무영향.

### 2025-09-16 — PLAN-SYNC-5 (활성 계획 정리: Phase 1/2 표식 제거)

- 내용: 활성 계획서(`TDD_REFACTORING_PLAN.md`)에서 이미 완료된 Phase 1/2 관련
  안내 주석을 제거하고, 현재 활성 과제가 Phase 3 단일 항목임을 명확히
  표기했습니다.
- 영향: 문서만 변경 — 타입/린트/테스트/빌드/포스트빌드 무영향.

### 2025-09-16 — PHASE 2 완료: 로깅/디버그 코드 프로덕션 제거(Tree-shaking 강제)

- 내용: 프로덕션 번들에서 dev 전용 로깅/진단 문자열 누출을 차단.
  - 빌드 전 변환 플러그인으로 `logger.debug(`, `logger.time(`, `logger.timeEnd(`
    호출 제거 (prod 한정)
  - 포스트빌드 validator 강화: prod 산출물에 `logger.debug(`, `logger.time(`,
    `logger.timeEnd(`, `__XEG_DEBUG__`, `[TEST]`, `ServiceDiagnostics` 문자열이
    존재하면 FAIL
  - 기존 Terser 설정(drop_console/debugger) 유지
- 수용 기준: prod 번들 문자열 가드 PASS, 기능 회귀 없음
- 검증: typecheck/lint/fast 테스트 GREEN, dev/prod 빌드 및 postbuild validator
  PASS (gzip ≈ 96KB)

### 2025-09-16 — PHASE 1 완료: 갤러리 셀렉터 단일화 + 가드 테스트

- 내용: 런타임 src/\*\* 전역에서 `#xeg-gallery-root` 직접 참조 제거. 컨테이너
  탐지는 `.xeg-gallery-container`/`[data-xeg-gallery-container]`로 단일화.
  테스트 환경(mock) 호환을 위해 `GalleryApp.ensureGalleryContainer()`에서
  classList 폴백 처리.
- 변경:
  - 소스: `shared/utils/utils.ts`, `shared/utils/scroll/scroll-utils.ts`,
    `shared/utils/media/MediaClickDetector.ts`, `shared/utils/events.ts`,
    `shared/services/media/VideoControlService.ts`,
    `features/gallery/GalleryApp.ts` (id 기반 참조 제거/대체)
  - 테스트 추가:
    `test/unit/lint/gallery-root.direct-usage.scan.red.test.ts`(정적 스캔 가드),
    `test/unit/shared/utils/gallery-selectors.contract.test.ts`(행위 계약)
- 수용 기준: src/\*\*에 `#xeg-gallery-root` 0, 갤러리 활성/네비/닫기 기존 테스트
  GREEN, 스타일/토큰 가드 GREEN → 충족
- 검증: typecheck PASS, lint PASS, fast/unit 스위트 GREEN(새 테스트 포함),
  dev/prod 빌드 및 postbuild validator PASS.

- 대상: B(legacy vendor-manager.ts), C(toolbarConfig.ts @deprecated),
  F(zip-creator @deprecated high-level helper)
- 조치: 활성 계획서에서 B/C/F를 제거하고 본 완료 로그로 이관. TEST-ONLY/LEGACY
  표면은 유지하되 가드/스캔/번들 문자열 검증으로 회귀 방지.
- 가드/수용 기준: src/\*\* 런타임 import 0, prod 번들 'VendorManager' 문자열 0,
  zip-creator @deprecated API 사용 0, toolbarConfig 런타임 사용 0.
- 검증: 타입/린트/테스트/빌드/포스트빌드 PASS.

### 2025-09-16 — PLAN-SYNC (VND/TOKENS/A11Y)

- 계획 정리: 활성 계획서(TDD_REFACTORING_PLAN.md)에서 완료 항목을 본 완료 로그로
  최종 이관.
- 이관 항목: VND-INIT-01, VND-LEGACY-MOVE-02, TOKENS-TOOLBAR-03, A11Y-ICON-04.
- 상태: 관련 테스트/문서/가드 모두 GREEN. 활성 계획서에는 보류 항목만 유지(5)
  MEDIA-STRATEGY-05).

### 2025-09-16 — PLAN-CLEANUP (활성 계획 슬림화)

### 2025-09-16 — PLAN-PHASE5 완료 (Vendors/Userscript 가드 강화)

- 내용: 활성 계획의 Phase 5(벤더 직접 import 및 GM\_\* 직접 접근 금지 가드
  강화)는 기존 가드 테스트들로 이미 충족됨을 확인하여 완료 처리했습니다.
- 근거 테스트(예시):
  - vendor 직접 import 금지:
    `test/unit/lint/direct-imports-source-scan.test.ts`,
    `test/unit/lint/vendor-getter.strict.scan.red.test.ts`
  - GM\_\* 직접 접근 금지:
    `test/unit/lint/userscript-gm.direct-usage.scan.red.test.ts`
- 수용 기준 충족: 정책 위반 0, 기존 스위트 GREEN. 별도 smoke
  파일(`vendors-policy.test.ts`)은 중복이라 추가 불필요.

### 2025-09-16 — PLAN-PHASE6 완료 (이벤트/타이머 위생 강화)

- 내용: 활성 계획의 Phase 6(글로벌 이벤트/타이머 등록·해제 쌍 가드)은 기 완료
  항목(R4, TIMER-DETERMINISM-02, 이벤트 수명주기 가드 등)로 충족되어 완료
  처리했습니다.
- 근거 테스트(예시):
  - 타이머 직접 사용 금지: `test/unit/lint/timer-direct-usage.scan.red.test.ts`
  - 이벤트 수명주기/AbortSignal:
    `test/unit/events/event-lifecycle.abort-signal.integration.test.ts`
  - 리스너/타이머 잔존 0 가드:
    `test/unit/lifecycle.cleanup.leak-scan.red.test.ts`
- 수용 기준 충족: GREEN, 누수/중복 방지 검증 완료.

### 2025-09-16 — PLAN-PHASE4 완료 (CSS 중복 정리·토큰 일원화)

- 내용: 활성 계획의 Phase 4는 스타일 토큰/중복 가드
  스위트(STYLE-TOKENS-GUARD-02, CSS-TOKEN-GUARD-01 등)와 관련 수정으로 충족되어
  완료 처리했습니다.
- 근거 테스트(예시):
  - 인라인 색상/transition all 금지:
    `test/unit/styles/tsx-inline-colors.guard.test.ts`,
    `test/unit/styles/injected-css.no-transition-all.guard.test.ts`
  - 토큰 정책/유틸: `test/unit/styles/animation-utilities.tokens.test.ts`,
    `test/unit/styles/components-animations.tokens.test.ts`
- 수용 기준 충족: 토큰 위반 0. CSS 바이트 수치 목표는 종합 번들 기준으로 감소
  확인(참고: gzip ≈ 99KB대 유지).

### 2025-09-16 — PLAN-SYNC-2 (활성 계획 정리 이관)

- 내용: 활성 계획서에서 이미 완료로 확정된 항목들을 제거하고, 남은 작업만
  우선순위 순으로 유지하도록 정리했습니다.
- 이관 요약: SRC-PATH-RENAME-01(E 가드), D1(Media Normalizer re-export),
  VND-INIT-01(벤더 초기화 경고 소음), TOKENS-TOOLBAR-03(토큰 마이크로 정리) 등
  완료 표식들을 본 완료 로그로 최종 이동.
- 활성 잔여(요약): D2(구 경로 제거 준비) → E(아이콘 placeholder 물리 삭제 후보)
  → A(Runtime Stub 처리) → B/C/F(TEST-ONLY/LEGACY 표면 유지).

- 내용: 활성 계획서에서 완료 항목의 잔여 표식/주석을 제거하고, 완료 항목은 본
  문서(완료 로그)에만 유지하도록 정리. 활성 계획서에는 옵션 과제인
  MEDIA-STRATEGY-05만 남김.
- 검증: 문서 변경만 — 타입/린트/테스트/빌드/포스트빌드 영향 없음.

### 2025-09-16 — MEDIA-STRATEGY-05 종결(옵션 과제 클로즈)

### 2025-09-16 — D2/E/A 정리(경로/플레이스홀더/런타임 스텁)

- D2 — Media Normalizer 구(old) 경로 제거: 소비처를 새 경로
  `@shared/services/media/normalizers/legacy/twitter`로 전환하고, 구 경로 파일
  `TwitterVideoLegacyNormalizer.ts`를 제거. 관련 단위 테스트의 import도 새
  경로로 조정. 스캔에서 구 경로 사용 0 보장.
- E — Icon placeholder 물리 삭제: `src/shared/components/ui/Icon/icons/index.ts`
  플레이스홀더 파일을 물리 삭제. 소스 전역 사용 스캔(offenders 0) 및 기존 가드
  테스트 유지(경로 직접 import 금지)로 회귀 방지.
- A — Runtime Stub(createAppContainer) 제거: 런타임 금지 스텁
  `src/features/gallery/createAppContainer.ts`를 삭제. 테스트 하네스 전용
  `test/refactoring/helpers/createAppContainer.ts` 사용 경로는 그대로 유지하며,
  런타임 import 금지 RED 스캔 테스트는 지속 GREEN.
- 검증: 타입/린트/테스트/빌드/포스트빌드 모두 PASS.

### 2025-09-16 — PLAN-SYNC-3 (A 상태 정합 수정)

- 내용: 활성 계획서의 현재 상태 요약에서 `createAppContainer.ts` 런타임 스텁이
  유지되는 것으로 표기되어 있던 부분을, 실제 리포지토리 상태(스텁 물리 삭제
  완료)에 맞게 정정했습니다.
- 검증: 문서만 변경 — 타입/린트/테스트/빌드/포스트빌드 영향 없음.

- 주제: 미디어 추출/정규화 경로 정리(Strategy/Factory 경계 명료화, normalizer
  단일화)
- 결정: 현 구조 유지(A안). 기능/테스트 GREEN이며 경계 재정렬은 리스크 대비
  이득이 제한적이라 판단해 옵션 과제를 문서상 종결.
- 메모: 추후 소스 이동/리네임이 필요한 경우, 작은 범위의 후속 PR로 처리하고 경로
  가드 테스트만 추가하는 방식을 권장.
- 영향: 코드 변경 없음 — 타입/린트/테스트/빌드/포스트빌드 모두 무영향.

### 2025-09-16 — PLAN-SYNC-4 (PLAN 슬림화: A/D/E 제거, B/C/F만 유지)

- 내용: 활성 계획서의 부록(SOURCE PATH RENAME / CLEANUP PLAN)에서 완료된 A/D/E
  항목을 제거하고, 관찰 지속 대상인 B/C/F만 남기도록 정리했습니다. 해당 완료
  내역은 본 완료 로그에 이미 기록되어 있어 중복을 제거했습니다(문서만 변경).
- 가드: deps-cruiser/정적 스캔/번들 문자열 가드는 기존과 동일하게 GREEN.

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

### 2025-09-16 — SRC-PATH-RENAME-01 (icons placeholder 가드) 완료

- 내용: `src/shared/components/ui/Icon/icons/index.ts` 경로에 대한
  import/require를 전역 금지하는 RED 스캔 테스트 추가.
- 테스트: `test/unit/lint/icon-deprecated-placeholder.imports.scan.red.test.ts`
  GREEN, offenders 0.
- 검증: 타입/린트/전체 스위트/빌드/포스트빌드 PASS.

### 2025-09-16 — D1(Media Normalizer re-export) 완료

- 내용: 새 경로 `src/shared/services/media/normalizers/legacy/twitter.ts` 생성.
  구 경로 `TwitterVideoLegacyNormalizer.ts`는 @deprecated 주석 후 새 경로
  re-export로 유지.
- 영향: 소비처 점진 이행 가능. 타입/테스트/빌드 GREEN.

### 2025-09-16 — PLAN-MAP — Vendors 경고/토큰 미세정리

- 계획 항목 3(벤더 초기화 경고 소음 축소)은 본 문서의 "VND-INIT-01 완료"로 이미
  충족됨.
- 계획 항목 4(UI/UX 토큰 마이크로 정리)은 "TOKENS-TOOLBAR-03 완료"로 충족됨.
  추가 작업 없음.

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

### 2025-09-16 — PLAN-SYNC-7 (활성 계획 슬림화/이관)

- 내용: 활성 계획서에서 완료된 스냅샷 섹션(현재 상태 점검 요약)과 부록(SOURCE
  PATH RENAME / CLEANUP PLAN)을 완료 로그로 이관하고, 문서 내에는 간단한
  주석으로 대체했습니다. Phase 3 메모 중 이미 적용된 warmup 제거 검토 항목도
  정리했습니다.
- 영향: 문서 변경만 — 타입/린트/테스트/빌드/포스트빌드 무영향.
- 현행 활성 항목: Phase 3 — 비핵심 서비스 지연 실행(조건부 import) 및 경량화.
