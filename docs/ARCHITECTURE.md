# xcom-enhanced-gallery 아키텍처와 책임 분리 설계서

본 문서는 프로젝트의 구조와 각 레이어의 책임, 경계, 공개 표면(API), 그리고 대표
유스케이스 흐름을 정의합니다. 구현자는 이 문서를 기준으로 코드를 작성하고,
테스트와 품질 게이트는 여기에 정의된 계약을 가드합니다.

관련 문서

- 코딩 가이드: docs/CODING_GUIDELINES.md (코딩 규칙/토큰/A11y/테스트 전략)
- 의존성 그래프: docs/dependency-graph.(svg|json|dot|html)
- 실행/CI: AGENTS.md

## 1. 시스템 개요와 레이어 경계

레이어 구조(단방향 의존만 허용):

```
Features (UI/도메인)
   ↓
Shared (services/state/utils/logging)
   ↓
External (vendors/userscript/zip)
```

- Path Aliases: `@` → `src`, `@features` → `src/features`, `@shared` →
  `src/shared`, `@assets` → `src/assets`
- 외부 라이브러리 접근은 반드시 getter 경유 (`@shared/external/vendors`),
  Userscript API는 `@shared/external/userscript/adapter`

금지 규칙(핵심)

- Features → 외부 벤더 직접 import 금지, Userscript API 직접 사용 금지
- Features → `@shared/services/ServiceManager` 직접 import 금지(액세서 경유)
- Shared/Features → 하드코딩 색상/시간/이징 금지(디자인 토큰만)
- PC 전용 입력만 사용(Touch/Pointer 금지)

## 2. 레이어별 책임과 공개 표면

### 2.1 Features Layer (`src/features/**`)

책임

- UI 컴포넌트, 뷰/페이지 조립, 사용자 인터랙션 처리(PC 전용)
- 상태(Signals) 구독/표시, 서비스 호출 트리거

Must

- 서비스 접근은 액세서/브리지 경유: `@shared/container/service-accessors`,
  `@shared/container/service-bridge`
- 스타일은 CSS Modules + 디자인 토큰만 사용
- 이벤트: click/keydown/keyup(Home/End/Escape/Arrow,
  Space)/wheel/contextmenu/마우스 이벤트만

Must Not

- `@shared/services/ServiceManager` 직접 import
- `preact`, `@preact/signals`, `fflate` 등 외부 라이브러리 직접 import
- `GM_*` 직접 사용(→ `getUserscript()` 사용)

공개 표면(예)

- `features/gallery/*` UI
- `features/settings/*` UI

### 2.2 Shared Layer (`src/shared/**`)

책임

- 서비스(다운로드/미디어 추출/테마/애니메이션/토스트 등)와 상태(Signals)
- 범용 유틸리티/로깅/성능/이벤트 유틸

Must

- 외부 라이브러리는 `@shared/external/vendors`의 getter로만 사용
- Userscript 접근은 `@shared/external/userscript/adapter` 경유
- ZIP 생성은 `@shared/external/zip/zip-creator` 사용

Must Not

- 브라우저/Userscript API를 직접 전역에서 참조(어댑터/유틸 경유)
- DOM 부작용을 import 시점에 발생

공개 표면(예)

- Services: `MediaService`, `BulkDownloadService`, `ThemeService`,
  `UnifiedToastManager`, etc.
- State: `shared/state/**`, Selector 유틸: `@shared/utils/signalSelector`
- Utils: `@shared/utils/**`(events/wheel, performance schedulers, memory, etc.)

### 2.3 External Layer (`src/shared/external/**`)

책임

- 외부 종속성 캡슐화: Preact/Signals/fflate/Userscript API/ZIP
- TDZ-safe 초기화/정리, 테스트에서 모킹 용이성 보장

공개 표면

- Vendors: `@shared/external/vendors`
  - `initializeVendors()`, `getPreact()`, `getPreactSignals()`, `getFflate()`,
    `getNativeDownload()`, `getPreactCompat()` 등
- Userscript Adapter: `@shared/external/userscript/adapter`
  - `getUserscript().download(url, name)`, `.xhr(opts)`, `.info()`, `hasGM`,
    `manager`
- ZIP: `@shared/external/zip/zip-creator`

### 2.4 vDOM/Shadow DOM/SPA 공존 전략

본 프로젝트는 Preact 기반 vDOM과 X.com(내부 React SPA) DOM이 공존합니다. 충돌을
피하고 안정성을 높이기 위해 다음 원칙을 따릅니다.

- 단일 마운트 포인트: 기능 UI는 단일 컨테이너(필요 시 ShadowRoot) 아래에
  렌더링합니다. 호스트 DOM을 직접 수정하지 않습니다(데이터 속성/앵커 엘리먼트
  수준만 사용).
- Shadow DOM 우선: X.com 스타일과의 충돌을 피하기 위해 기본적으로 ShadowRoot
  컨테이너를 사용합니다. 글로벌 CSS 텍스트는 주입 게이팅 규약(7장)을 따릅니다.
- 관찰과 재바인딩: X.com이 DOM을 교체/패치하는 시점에 대비해 MutationObserver
  기반 감시자를 두고, 마운트 대상이 사라지면 안전하게 언마운트/재마운트를
  수행합니다(배치 스케줄러 사용). 관찰자는 엔트리/렌더러에서 등록하고, 언마운트
  시 정리합니다.
- 이벤트 경계: PC 전용 입력만 처리하며, 기본 스크롤/단축키와의 충돌을 최소화하기
  위해 목적 동작에 한해 `preventDefault()`를 적용합니다.
- Vendor/Userscript 경유: Preact/Signals/ZIP/다운로드 등 외부 의존성은 항상
  getter/어댑터를 통해 접근합니다(TDZ-safe, 모킹 가능).

## 3. 애플리케이션 시작(bootstrap) 흐름

엔트리: `src/main.ts`

1. 환경/벤더 초기화: `initializeVendors()`
2. 서비스 컨테이너 구성/등록/워밍업
3. 피처 등록: `src/bootstrap/feature-registration.ts`
4. 이벤트 배선: `src/bootstrap/event-wiring.ts` (PC 전용 입력만)
5. 스타일 주입 게이팅 준수(Head/ShadowRoot)

불변 조건

- import 부작용 금지(리스너 등록/DOM 변경은 함수 호출 시점에만)
- 개발/프로덕션 모두 소스맵 생성(vite 플러그인에서 처리)

## 4. 대표 유스케이스 흐름

### 4.1 갤러리 활성화

1. 트리거(사용자 액션/단축키) → `GalleryRenderer` 활성화
2. `MediaExtractionService`가 현재 컨텍스트에서 미디어 URL/메타데이터 추출
3. `MediaMappingService`가 표시용 모델로 정규화
4. `shared/state/gallery-store` 갱신 → UI 렌더
5. 키보드/휠 네비게이션 활성화(PC 전용), 툴바 포커스 규칙 적용

### 4.2 다운로드(단일/ZIP)

1. Toolbar 버튼 클릭 → `MediaService` 또는 `BulkDownloadService` 호출
2. 단일: `getUserscript().download` 또는 `getNativeDownload()` 경유
3. ZIP: `createZipFromItems()`로 병렬 다운로드 + fflate ZIP 생성
4. 토스트로 성공/부분 실패/전체 실패/취소 피드백

### 4.3 설정 저장·복원

1. SettingsService가 기본값/마이그레이션/유효성 관리
2. UI는 액세서(`@shared/container/settings-access`)로 읽기/쓰기
3. 토큰/테마 반영은 `ThemeService`와 스타일 토큰 레이어에서 수행

## 5. 상태 관리와 시그널 규칙

- Signals는 `shared/state/**`에 정의하고, 파생값은 selector 유틸로 메모이즈
- UI는 액션 함수를 통해 상태 변경(직접 변경 최소화)
- 경계: 큰 배열/객체는 불변 업데이트, 파생 연산은 computed/selector로 격리

## 6. 이벤트/입력 경계(PC 전용)

- 허용: click, keydown/keyup(ArrowLeft/Right, Home/End, Escape, Space), wheel,
  contextmenu, mouseenter/leave/move/down/up
- 금지: 모든 Touch/Pointer 계열
- 휠: `ensureWheelLock`/`addWheelListener` 유틸 사용, 필요 시에만 preventDefault
- 툴바 키보드 내비: 그룹 데이터 속성(`data-toolbar-group`,
  `data-group-first="true"`), Arrow/Home/End/Escape 지원, Tab은 기본 순서

## 7. 스타일 시스템 경계

- CSS Modules + 디자인 토큰만 사용(색상/반경/간격/애니메이션)
- 하드코딩 px/색/이징/시간 금지, `transition: all` 금지
- 레이어/z-index는 토큰만 사용(`--xeg-z-*`)
- 스타일 주입 게이팅: `window.XEG_CSS_TEXT`,
  `window.XEG_STYLE_HEAD_MODE`('auto'|'off'|'defer') 준수

## 8. 외부 통합 계약(Contracts)

### 8.1 Vendors API (요지)

- 초기화: `initializeVendors()` → TDZ-safe
- 접근: `getPreact()`, `getPreactSignals()`, `getFflate()`, `getPreactCompat()`,
  `getNativeDownload()`
- Clean-up: `cleanupVendors()`, `registerVendorCleanupOnUnloadSafe()`

### 8.2 Userscript Adapter API

```ts
type UserscriptAPI = {
  hasGM: boolean;
  manager: 'tampermonkey' | 'greasemonkey' | 'violentmonkey' | 'unknown';
  info(): UserScriptInfo | null;
  download(url: string, filename: string): Promise<void>;
  xhr(options: GMXmlHttpRequestOptions): { abort: () => void } | undefined;
};
```

- GM\_\* 부재 시 안전 폴백(fetch/BlobURL/xhr emulation), 비브라우저 환경에서는
  no-op

### 8.3 ZIP Creator

- `createZipFromItems(items, zipName, onProgress?, config?) → Promise<Blob>`
- 파일명 충돌 시 접미사로 고유화

## 9. 서비스 접근 경계와 액세서

- Features는 `@shared/container/service-accessors`/`service-bridge` 경유
- 전역 정리(cleanup)는 엔트리에서만 수행
- 서비스 공개 API는 계약 테스트로 가드(예: MediaService contract)

## 10. 로깅/오류/진단

- `@shared/logging` 사용, 대량 작업에 correlationId 적용
- 프로덕션 빌드에서는 Terser가 console 제거(drop_console)

## 11. 성능 설계

- 프리로드 인덱스 계산: `computePreloadIndices` (거리 우선/클램프/우측 우선
  동률)
- 스케줄러: immediate/idle/raf/microtask 지원, JSDOM 폴백
- 동시성 큐: `maxConcurrent` 제한으로 전체 대기열 소진

메모리/수명주기 가드

- 컴포넌트/훅의 모든 리스너·타이머·관찰자는 useEffect 반환(cleanup)에서
  해제합니다.
- 대용량 갤러리 시나리오에서도 장시간 실행 누수가 없도록, 마운트/언마운트 사이의
  살아있는 리스너/타이머 수가 0으로 회귀해야 합니다.
- Vendors/외부 자원 정리는 `cleanupVendors()` 또는 unload-safe 등록 유틸을
  사용합니다.

## 12. 테스트 전략(TDD) 매핑

- 환경: Vitest + JSDOM, 기본 URL https://x.com, `test/setup.ts` 자동 로드
- RED→GREEN → Refactor 절차, 계약/경계/정책을 테스트로 가드
- 예시 매핑(발췌)
  - Vendors/TDZ: `test/integration/vendor-tdz-resolution.test.ts`
  - Userscript 어댑터 계약:
    `test/unit/shared/external/userscript-adapter.contract.test.ts`
  - 휠/키보드 정책: `test/unit/events/ensureWheelLock.contract.test.ts`,
    `test/toolbar/toolbar-keyboard.navigation.test.tsx`
  - 토큰 하드닝: `test/unit/styles/modal-token.hardening.test.ts`
  - ServiceManager 경계:
    `test/unit/lint/features-no-servicemanager.imports.test.ts`
  - 훅/수명주기: 효과 의존성/클린업 계약 테스트와 장시간 실행 누수 감시 테스트를
    추가하여, 리스너·타이머·관찰자 누수 0을 가드합니다.

## 13. 빌드 산출물/소스맵/검증

- 단일 Userscript 산출(dev/prod), 소스맵은 dev/prod 공통 생성
- 플러그인에서 내부 sourceMappingURL 제거 후 Userscript 끝에만 주석 삽입
- `scripts/validate-build.js`가 .map 무결성과 dead-preload 제거를 검증

## 14. 확장/변경 가이드(Practices)

새 Feature 추가

1. 상태/서비스가 필요한지 결정 → Shared에 계약부터 작성(테스트 포함)
2. Features 컴포넌트/훅 추가 → 액세서로 서비스 사용
3. 스타일은 토큰 기반으로 CSS Modules 작성 → PC 전용 입력만

새 Service 추가

1. 인터페이스/계약 테스트 작성
2. 외부 의존은 Vendor getter/어댑터 경유
3. 컨테이너 등록/워밍업/정리 경로 포함

수용 기준(Acceptance)

- 타입/린트/테스트 GREEN, Userscript 빌드/검증 PASS
- 경계 위반(직접 import/GM\_\* 직접 사용/Touch/Pointer 사용/토큰 미사용) 없음

## 15. 부록: 의존성 그래프

- 최신 그래프: `docs/dependency-graph.svg` (정적), `docs/dependency-graph.html`
  (인터랙티브)
- 생성/검증: `npm run deps:all` (JSON/DOT/SVG 생성 + 룰 검증, CI에서도 실행)
- 로컬 뷰어: `npm run deps:view` 후 브라우저에서
  `http://localhost:8080/dependency-graph.html`

---

본 설계서는 아키텍처의 단일 소스입니다. 구현/리팩토링 시 이 문서와 코딩 가이드를
함께 업데이트하고, 관련 테스트를 통해 경계를 지속적으로 가드하세요.
