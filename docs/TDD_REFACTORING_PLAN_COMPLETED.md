### 2025-09-15

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

- 현 시점 활성 이슈/Phase 없음. 계획서는 최신 상태이며 활성 섹션 비어 있음.
- 품질 게이트: 타입/린트/테스트/빌드/포스트빌드 검증 GREEN 유지.
- 조치 필요 없음 — 회귀 발생 시 RED 테스트 우선으로 신규 Phase 등록 예정.

2025-09-15: PLAN-CLEANUP — 활성 계획 슬림화 및 완료 항목 이관(문서 정리)
2025-09-15: P11 — 배럴 표면 하드닝(dom/services) (완료)

- 내용: `@shared/dom` 배럴에서 `DOMEventManager`/`createEventManager` 런타임
  재노출 제거. 내부 모듈은 상대 경로로 직접 import하도록 주석 가이드 추가. 외부
  소비층은 통합 `EventManager`만 사용.
- 검증: 단위 테스트 GREEN, 배럴 스캔 가드 충돌 없음.

2025-09-15: P12 — Toolbar 애니메이션 토큰 정리 (완료)

- 내용: 컴포넌트 토큰 CSS와 주입 CSS(`css-animations.ts`)에서 `toolbar-slide-*`
  키프레임/변수 제거. 툴바 표시/숨김은 JS API(`toolbarSlideDown/Up`) 단일 경로만
  사용하도록 정리.
- 검증: 스타일/애니메이션 토큰 가드 GREEN, 회귀 없음.

2025-09-15: P13 — Postbuild Validator 확장 (완료)

- 내용: `scripts/validate-build.js`에 금지 문자열 추가 —
  `DOMEventManager`/`createEventManager` 런타임 표면 차단(기존 동적
  VendorManager, `vendor-api.ts` 가드에 추가). 내부 구현은 `DomEventManager`로
  리네이밍하고 로그 문자열을 ‘DOM EM’로 축약해 누출을 차단.
- 검증: dev/prod 빌드 및 postbuild validator GREEN(누출 문자열 미검출,
  dead-preload 미포함, 소스맵 무결성 체크 PASS). 번들 크기: raw 362.41 KB / gzip
  98.29 KB.

- 조치: `TDD_REFACTORING_PLAN.md`에서 누적된 완료 항목 대량 제거 → 본 완료
  로그로 일원화(요약만 유지).
- 남김: 활성 계획 후보(P11–P14)만 계획서에 유지 — 배럴 표면 하드닝, 툴바
  애니메이션 토큰 정리, 포스트빌드 러untime 표면 스캔 확장, 타입 전용 import
  정책 강화.
- 영향: 코드 변경 없음(문서만). 스모크 테스트 GREEN.

2025-09-15: PLAN-REFRESH (최종) — 활성 계획 문서 재정비 완료

- 내용: `TDD_REFACTORING_PLAN.md`를 "활성 계획 전용"으로 재정비. 방대한
  이력/완료 로그는 본 문서로 이관하고, 새로운 5개 과제(U4-b, SEL-OPT-01, R4-b,
  SET-MIG-01, R5-b)만 활성 유지.
- 검증: 타입/린트/테스트/빌드/포스트빌드 가드 지속 GREEN(변경은 문서 한정).

2025-09-15: SET-MIG-01 — Settings 버전 마이그레이션 하니스 (완료)

- 내용: `SettingsMigration` 헬퍼 추가 및 `SettingsService`가 이를 사용하도록
  리팩터링. 버전별 마이그레이션 훅(레지스트리)과 기본값 병합(fill) 로직 분리.
- 검증: 타입/린트/스모크 GREEN, 기존 설정 손실 없이 로드·저장이 동작.

2025-09-15: R5-b — Postbuild Drift Guard v2 (완료)

- 내용: `scripts/validate-build.js` 확장 — `onPointer*`/`PointerEvent` 문자열,
  `createAppContainer`/`AppContainer` 런타임 표면 누출 추가 가드.
- 검증: dev/prod 빌드 시 validator PASS, 기존 가드(소스맵/금지
  문자열/\_\_vitePreload)와 병행 GREEN.

2025-09-15: P11–P13 — 계획 항목 정리(완료 상태 반영)

- P11 Barrel 표면 하드닝(dom/services): `@shared/dom`에서 DOMEventManager 재노출
  제거, 외부 런타임 import 금지 스캔 통과.
- P12 Toolbar 애니메이션 토큰 정리: `toolbar-slide-*` 키프레임·변수 제거, JS API
  `toolbarSlideDown/Up`만 사용.
- P13 Postbuild Validator 확장: 위험 표면 문자열 스캔 강화(`DOMEventManager`,
  동적 VendorManager, vendor-api.ts), dev/prod GREEN.
- 현재 활성 계획에는 P14만 남음(타입 전용 import 정책 강화).

2025-09-15: P14 — 타입 전용 import 예외 정책 강화 (완료)

2025-09-15: U4-b — 배럴 표면 V2(광역) 최소화 (완료)

- 내용: shared/utils/performance 배럴에서 레거시 selector 재노출 제거. 전역
  소비처는 `@shared/utils/signalSelector`의 공식 API만 사용하도록 통일.
- 영향: 공개 API 축소 없음(정식 경로 유지). dead export 제거로 스캔/번들 표면
  감소.
- 검증: unused-exports 스캔 GREEN, 타입/린트 PASS, 전체 테스트/빌드/포스트빌드
  GREEN.

2025-09-15: R4-b — 타이머/리스너 수명주기 일원화 가드(확장) (완료)

- 내용:
  Toolbar/GalleryContainer/useGalleryKeyboard/SettingsModal/useGalleryScroll
  등에서 직접 addEventListener/setTimeout 사용을 EventManager/globalTimerManager
  경유로 표준화. SettingsModal의 문서 keydown 리스너는 테스트 기대에 맞춰
  capture=true(boolean)로 등록/해제.
- 검증: 수명주기/가드 테스트 GREEN. event-deprecated-removal 가드 해결. 전체
  스위트 GREEN.

2025-09-15: BUILD — dev/prod Userscript 모두 생성 및 검증 (완료)

- 내용: `npm run build` 수행으로 개발/프로덕션 번들을 생성. 포스트빌드 검증
  스크립트 통과.
- 산출물: dist/xcom-enhanced-gallery.user.js,
  dist/xcom-enhanced-gallery.dev.user.js
- 크기: raw 362.89 KB / gzip 98.66 KB

- 내용: 벤더 배럴(`@shared/external/vendors`)에서 `VNode`/`ComponentChildren`
  타입을 가져올 때 반드시 type 한정자를 사용하도록 테스트 추가.
  - 테스트: `test/unit/lint/type-only-imports.policy.red.test.ts` (위반 시 RED)
  - 가이드: `docs/CODING_GUIDELINES.md`에 정책 및 예시 명시
- 검증: 타입/린트/테스트/빌드/포스트빌드 모두 GREEN, 단일 정책 테스트 별도 실행
  PASS
- 결과: 활성 계획 항목 없음(계획 문서 정리 완료)

2025-09-15: ZIP-UNIFY-01 — ZIP 생성 경로 단일화 (완료)

- 내용: MediaService 및 DownloadOrchestrator에서 직접 사용하던
  `fflate.zipSync`를 제거하고, `shared/external/zip/zip-creator.ts`의 새 API
  `createZipBytesFromFileMap()`로 일원화. 어댑터는 비동기 zip 우선, 환경에 따라
  zipSync 폴백을 제공.
- 검증: 단위 테스트 전체 GREEN(621 passed), zip 경로 관련 테스트(파일명 충돌,
  오류 코드/요약/재시도 시퀀스 등) PASS. 타입/린트 PASS.
- 영향: 중복 제거 및 모킹 용이성 상승. 기능/UX/성능 스모크 동일.

2025-09-15: ZIP-LINT-01 — fflate 직접 사용 금지 가드 (완료)

- 내용: zip-creator 외부에서 `fflate.zip(`/`zipSync(` 직접 사용을 금지하는 정적
  스캔 테스트 `test/unit/lint/zip-direct-usage.scan.red.test.ts` 추가. 어댑터
  단위 테스트 `zip-creator.adapter.test.ts`로 API 유효성 검증.
- 검증: 스캔 GREEN(위반 0건), 어댑터 테스트 PASS. 전체 스위트 GREEN.

2025-09-15: SEL-OPT-01(part) — Selector 채택 1단계 (ToastContainer)

- 내용: `ToastContainer`가 `UnifiedToastManager.subscribe()` 기반 수동 구독을
  중단하고, `useSelector`로 통합 시그널을 직접 선택하도록 전환. 렌더링은 토스트
  배열 변경에만 반응하도록 최적화.
- 검증: 타입/테스트(전 스위트)/dev·prod 빌드 및 postbuild validator 모두 GREEN.
- 영향: 공개 API 변화 없음. 불필요한 상태/구독 제거로 단순화.

2025-09-15: SEL-OPT-01 — 상태 selector 채택 확대(재렌더 절감) (완료)

- 내용: 주요 구독 경로를 selector 훅으로 통일하여 리렌더를 절감.
  - ToastContainer: UnifiedToastManager.signal을 useSelector로 구독
  - useGalleryScroll: isOpen 등 갤러리 상태를 useSelector로 구독해 리스너 게이트
  - VerticalGalleryView: mediaItems/currentIndex는 useSelector, 다운로드 진행은
    useCombinedSelector로 결합
- DoD: 대상 컴포넌트 3곳 이상 적용(위 3곳) 및 기능/UX 동일성 확인.
- 검증: 전체 테스트 1800+ GREEN, 타입/린트 PASS, dev/prod 빌드 및 postbuild
  validator GREEN.

2025-09-15: VENDOR-LEGACY-PRUNE-02 — vendor-api.ts 소스 레벨 금지 스캔 (완료)

- 내용: `src/**`에서 `@shared/external/vendors/vendor-api` 직접 import를
  금지하는 정적 스캔 테스트 추가
  (`test/unit/lint/vendor-api.imports.scan.red.test.ts`). 허용 경로는 vendors
  배럴 (`src/shared/external/vendors/index.ts`)과 파일 자체만.
- 검증: 스캔 GREEN(위반 0건), prod/dev 빌드 산출물 가드(legacy vendor 문자열)와
  문서 가이드 일치. 전체 스위트/빌드/포스트빌드 GREEN.

### 2025-09-14

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
- SettingsModal.module.css: 헤더 flex 정렬/간격 토큰화, 닫기 IconButton
  2.5em/`--xeg-radius-md`/focus-ring 토큰 준수, 본문 패딩/컨트롤 간격 토큰화.
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

2025-09-12: 계획 문서 정리 — '활성 Phase 없음' 상태 종료 및 신규 U1–U5 활성 계획
반영

- 내용: `TDD_REFACTORING_PLAN.md`를 현대화 리팩토링 중심(U1–U5)으로 갱신하고,
  기존 문구(활성 없음)를 제거하여 차기 사이클 시작 상태로 전환
- 결과: 완료 로그에 본 항목 기록, 계획 문서는 활성 Phase만 유지

2025-09-12: 계획 문서 단순화 — 활성 Phase 없음(전 구간 GREEN) 확정, 완료 항목을
본 로그로 이관하고 계획서는 스켈레톤만 유지
