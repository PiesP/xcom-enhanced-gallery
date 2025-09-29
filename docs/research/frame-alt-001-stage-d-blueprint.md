# FRAME-ALT-001 Stage D Execution Blueprint

**Last updated:** 2025-09-28

## 1. 목적과 범위

Stage D의 목표는 Preact/Signals 의존성을 완전히 제거하고 Solid 전용 런타임으로
수렴하는 것입니다. 본 문서는 활성 계획서의 Stage D readiness Acceptance 4건을
실행 가능한 설계/테스트 플로우로 구체화하여, TDD 사이클(RED → GREEN → 리팩터링)
진행 시 참조할 단일 블루프린트를 제공합니다.

- Solid-only 부트스트랩 경로를 정의하고 userscript 산출물/문서 업데이트
  요구사항을 명확히 합니다.
- Preact API 사용 인벤토리를 모듈 유형별로 분류하고, 안전한 Solid 치환 순서를
  제안합니다.
- Static/Dynamic Vendor Manager에서 Preact 관련 API를 철거하기 위한 단계별
  마이그레이션 플로우와 가드 테스트를 정리합니다.
- Signals → Solid store 브릿지 제거에 앞서 UnifiedToastManager 및 공유 state
  계층이 만족해야 할 테스트/설계를 문서화합니다.

## 2. Solid-only 부트스트랩 설계 (Acceptance #1)

### 2.1 목표 상태

1. `src/main.ts`는 Solid 경로를 기본값으로 사용하고, Preact 렌더러/신호 브리지가
   초기화 경로에 등장하지 않습니다.
2. `@/bootstrap/solid-bootstrap`은 feature flag 없이 Solid 런타임을 준비하고,
   Stage C에서 유지되던 Preact 폴백 로직은 제거됩니다.
3. Userscript 헤더(`scripts/validate-build.js`, `release/metadata.json`)와 문서
   (`docs/README.md`, `docs/CODING_GUIDELINES.md`)는 Solid-only 환경을 전제로
   갱신됩니다.

### 2.2 구현 순서

1. **Fail:** `test/unit/main/main-solid-only-bootstrap.red.test.ts` (신규)를
   추가해 Preact vendor 호출이 존재하면 RED가 되도록 명시합니다.
2. **Implement:**
   - `initializeSolidBootstrapIfEnabled` → `initializeSolidBootstrap`로
     단축하고, Solid 부트스트랩을 항상 실행하도록 변경합니다.
   - `registerGalleryRenderer`가 반환하는 렌더러를 Solid 버전(현재 Stage C의
     `renderSolidGalleryShell`)로 교체하고, 기존 Preact 브리지는 제거합니다.
   - `initializeToastContainer`에서 Solid 외 경로 제거 후 Solid toast 호스트만
     유지합니다.
3. **Refactor:** Solid-only 경로가 안정화되면 feature flag(`solidBootstrap`,
   `solidGalleryShell`, `solidToastHost`, `solidSettingsPanel`)를 런타임
   구성에서 정리하고 설정/테스트 더블을 업데이트합니다.
4. **Docs & Build:**
   - `docs/README.md`: Solid-only 경로가 기본임을 명시하고, 이전 Preact 병행
     전략 설명을 archive로 이동합니다.
   - `scripts/validate-build.js`: Solid vendor만 초기화되었는지 확인하는 검증을
     추가합니다.
   - `Clear-Host && npm run build` 실행 결과를 Stage D 시작 커밋에 기록합니다.

### 2.3 회귀 가드 및 체크리스트

- `test/integration/main/main-solid-bootstrap-only.test.ts` — Solid 렌더러만
  등록되고 Core 서비스가 cleanup 후에도 Preact 리스너를 남기지 않는지 검증.
- `test/features/gallery/solid-only-renderer.parity.test.tsx` — Solid 갤러리
  쉘이 Stage C 스냅샷과 동일한 DOM/Event 패턴을 유지.
- `test/features/settings/solid-only-panel.parity.test.tsx` — 설정 패널 Solid
  경로 유지 가드.
- Userscript 헤더 validator(`scripts/validate-build.js`)가 `@source`와 dist 파일
  해시를 Solid-only 환경 기준으로 재검증.

## 3. Preact API 철거 순서 (Acceptance #2, #4)

### 3.1 인벤토리 요약

`test/architecture/preact-usage-inventory.test.ts`가 고정 리스트로 추적하는 56개
모듈을 다음 4개 그룹으로 나눕니다.

| 그룹 | 범위                   | 대표 모듈                                                   | 치환 전략                                                        |
| ---- | ---------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| A    | Feature Shell & Hooks  | `features/gallery/**`, `features/settings/**`               | Stage C Solid 컴포넌트를 canonical로 승격하고 Preact 버전을 제거 |
| B    | Shared UI 컴포넌트     | `shared/components/ui/**`, `shared/components/isolation/**` | Solid 컴포넌트로 포팅 후 기존 props 계약을 보존                  |
| C    | Shared Hooks/Utilities | `shared/hooks/**`, `shared/utils/signalSelector.ts`         | Solid `createEffect`, `createMemo` 기반 헬퍼로 대체              |
| D    | State & Services       | `shared/state/**`, `UnifiedToastManager`                    | Solid store 도입 후 Signals bridge 제거                          |

### 3.2 단계별 전환 플로우

1. **Phase A — Feature Shell 정리**
   - 테스트: `test/features/gallery/preact-shell-regression.red.test.tsx`를
     RED로 추가해 더 이상 Preact 컴포넌트가 렌더링 트리에 등장하지 않음을
     확인합니다.
   - 구현: Stage C의 Solid shell을 default export로 승격,
     `features/gallery/GalleryRenderer.ts` 에서 Preact 렌더러 제거.
2. **Phase B — Shared UI Solid 포팅**
   - 우선순위: `Toolbar`, `Toast`, `SettingsModal`, `LazyIcon`, `ModalShell`.
   - 각 컴포넌트는 `.solid.tsx` 변형을 도입한 뒤 `index.tsx`를 Solid 버전으로
     통합.
   - 테스트: 기존 접근성/DOM 가드(`test/features/toolbar/**/*.test.tsx`,
     `test/features/settings/**`)를 Solid 경로로 업데이트.
3. **Phase C — Hooks & Utils**
   - `@shared/hooks`에서 `createSignal` 대신 Solid `createSignal` 사용.
   - `signalSelector.ts`는 Solid store를 직접 구독하도록 리팩터링하고, Stage
     C에서 사용한 compat memo 유틸을 제거합니다.
   - 테스트: `test/unit/shared/hooks/**/*`와
     `test/unit/shared/utils/signal-selector.test.ts` 를 갱신하여 Solid 기반
     동작을 가드.
4. **Phase D — State & Services**
   - `shared/state/gallery-store.ts`, `signals/*.ts`를 Solid store로 재작성하고,
     `UnifiedToastManager` 등 서비스의 의존성을 Solid store로 교체.
   - 테스트: `test/unit/shared/state/gallery-store.solid.test.ts`를 추가하고,
     기존 Signals 기반 테스트는 archive로 이동.
5. **Inventory Gate 제거**
   - `test/architecture/preact-usage-inventory.test.ts`를 Solid 치환 완료 시
     삭제하고, `test/tooling/no-preact-usage.scan.test.ts`에서 정적/동적 import
     모두 0건임을 가드.

### 3.3 문서 및 체크리스트

- 각 Phase 완료 시 `TDD_REFACTORING_PLAN.md`에 Stage D 하위 섹션을 업데이트하고,
  Completed 로그에 요약 추가.
- `docs/CODING_GUIDELINES.md` > “프레임워크 계층” 섹션을 Solid-only 기준으로
  갱신합니다.
- `metrics/bundle-metrics.json`을 Solid-only 기준으로 재측정하고,
  `test/optimization/bundle-budget.test.ts` 공차를 재설정합니다.

## 4. Vendor Manager Solid 전용화 (Acceptance #2)

### 4.1 목표

- `@shared/external/vendors`에서 `getPreact*` API를 제공하지 않고도 모든 Solid
  런타임이 초기화되도록 합니다.
- Static/Dynamic Vendor Manager의 캐시/초기화 시퀀스를 단일 Solid 경로로
  단순화합니다.

### 4.2 단계별 플로우

1. **Preparatory Failures**
   - `test/tooling/vendor-manager-preact-export.red.test.ts` — `getPreact*`
     export가 존재하면 RED.
   - `test/unit/shared/external/vendors/vendor-initialization.solid-only.test.ts`
     — Solid vendor getter만 초기화되었을 때 GREEN.
2. **Implementation**
   - `vendor-api-safe.ts`/`vendor-manager-static.ts`에서 Preact 관련 getter
     제거, Solid store/renderer getter만 남깁니다.
   - `vendor-api.ts` Legacy 경로는 Stage D 종료 시 삭제합니다.
   - `StaticVendorManager` 초기화 로직을 Solid 전용으로 재작성하고,
     `validateVendors` 가 Preact 의존성 없이도 GREEN이어야 합니다.
3. **Cleanup & Docs**
   - `docs/vendors-safe-api.md`에 Solid-only getter 목록 업데이트.
   - `test/tooling/no-preact-usage.scan.test.ts`에서 vendor 계층 예외 제거.

## 5. Signals → Solid Store 브릿지 제거 (Acceptance #4)

### 5.1 현황

- Stage C에서 도입한 `@shared/state/solid-adapter.ts`, `solidSignalBridge.ts`는
  Preact signal을 Solid accessor로 포장합니다.
- Stage D에서는 Solid store(`solid-js/store`)를 canonical로 채택하고 브릿지를
  제거해야 합니다.

### 5.2 실행 계획

1. **Fail:** `test/unit/shared/state/solid-bridge-deprecation.red.test.ts`를
   추가해 Solid store가 아닌 Preact signal을 사용하는 경로를 탐지합니다.
2. **Implement:**
   - `shared/state/gallery-store.ts` → Solid store 기반 `createRootStore`로
     재작성.
   - `UnifiedToastManager`는 Solid store/`createSignal`을 직접 사용하고, dispose
     시 Solid cleanup만 호출하도록 변경.
   - `features/notifications/solid/renderSolidToastHost`는 브릿지 없이 Solid
     store를 구독.
3. **Refactor:**
   - `solid-adapter.ts`, `solidSignalBridge.ts` 삭제.
   - 관련 테스트(`test/research/solid-foundation.test.ts`)는 Solid store
     기준으로 갱신.
4. **Verification:**
   - `test/unit/shared/services/unified-toast-manager.solid.test.ts` — Solid
     store 구독 및 dispose 동작 가드.
   - `test/features/gallery/solid-toast-regression.test.tsx` — 토스트 UX가 Stage
     C와 동일한지 확인.

## 6. 롤아웃 & 품질 게이트

1. 각 Phase(2~5) 완료 시 `Clear-Host && npm run build`로 종합 게이트를 검증하고,
   빌드 로그를 Completed 파일에 요약합니다.
2. Solid-only Stage 진입 직후 `npm run validate`, `npm test`,
   `npm run build:prod` + `node scripts/validate-build.js`를 연속 실행해 CI와
   동일한 신뢰성을 확보합니다.
3. Stage D 종료 커밋에서는 Tampermonkey 스모크 스크립트를 재실행하여 Solid-only
   번들이 정상 동작함을 확인하고, 결과를 `docs/release/` 메모에 남깁니다.

---

본 문서는 Stage D 실행 중 지속적으로 갱신되며, 하위 작업이 완료될 때마다 TDD
활성 계획서와 Completed 로그를 동기화합니다.
