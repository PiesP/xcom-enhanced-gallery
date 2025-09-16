# 💻 코딩 가이드라인

> **일관된 코드 스타일과 품질 보장**

문서 분리 안내: 구조/계층/경계는 `docs/ARCHITECTURE.md`, 의존성 가드 정책과 CI
강제 기준은 `docs/DEPENDENCY-GOVERNANCE.md`를 참고하세요. 이 문서는 구현
규칙/스타일/토큰/테스트 가이드에 집중합니다.

## 리팩토링/계획 이관 정책

- 모든 TDD 리팩토링 활성 계획은 완료 즉시
  `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.
- 활성 계획은 항상 최신 상태로 유지하며, 완료된 항목은 PLAN.md에서 제거합니다.

## 컴포넌트 배럴 표면 정책 (U4)

- HOC 배럴(`@shared/components/hoc`)은 실제 사용 심볼만 노출합니다.
  - 허용: `withGallery`, `type GalleryComponentProps`
  - 금지: 미사용 편의 함수/유틸(예: `withGalleryContainer`, `withGalleryItem`,
    `withGalleryOverlay`, `GalleryHOC`, `getGalleryType` 등)과 타입 도메인의
    과도한 전역 노출
- 목적: dead export를 줄여 번들/스캔 복잡도를 낮추고 경계 가드를 단순화합니다.
- 테스트: `test/unit/refactoring/unused-exports.scan.red.test.ts`가 배럴의
  미사용 export를 RED로 탐지합니다(Windows 경로 정규화 적용).

보강(2025-09-14):

- Windows 경로 정규화: 스캔 테스트는 모든 경로를 POSIX(`/`)로 정규화하여 OS에
  독립적으로 동작합니다.
- 오프너 허용목록 축소: 배럴/가드 테스트의 allowlist는 가능한 한 비워두거나 단일
  파일로 한정합니다(예: 토큰 추출기만 예외).
- 타입 전용 import 예외: 런타임 import 금지 가드에서는 type-only import는
  허용되며, 이를 제외한 모든 런타임 import는 금지됩니다.

보강(2025-09-15): Features 배럴(F1)

- features 배럴(`src/features/<feature>/index.ts`)은 동일 feature 폴더의 모듈만
  재노출합니다. shared 레이어(`@shared/**` 또는 `../../shared/**`)의 서비스나
  구현을 재노출하지 않습니다. 또한 배럴은 “UI 컴포넌트 + 타입 + Factory”로
  표면을 한정합니다. 구체 구현(Service 클래스) 재노출은 금지합니다.
- 목적: 공개 표면을 최소화하여 순환/의존성 복잡성을 줄이고 리팩토링 안전도를
  높입니다. 소비처는 필요한 경우 factory 또는 shared 레이어에서 직접 import
  하세요(정책 허용 범위 내). 예를 들어 Settings 기능은 다음과 같이 사용합니다:

```ts
// ✅ 권장: factory/type만 배럴을 통해 접근
import {
  getSettingsService,
  type ISettingsServiceFactoryShape,
} from '@features/settings';

// ❌ 금지: 구현(Service 클래스) 재노출/직접 경로를 배럴로 노출
// import { SettingsService } from '@features/settings';
// import { TwitterTokenExtractor } from '@features/settings';
```

- 가드: `test/unit/lint/features-barrel.surface.scan.red.test.ts`가 배럴에서
  금지된 경로 재노출을 RED로 탐지합니다.

보강(2025-09-15): VND-LEGACY-MOVE

- 동적 VendorManager(`vendor-manager.ts`)는 테스트 전용입니다. 프로덕션 소스는
  반드시 `@shared/external/vendors`의 TDZ-safe 정적 API(getPreact/
  getPreactSignals/getFflate/getPreactCompat 등)만 사용하세요.
- 포스트빌드 가드가 prod 번들 내 'VendorManager' 식별자/경로 문자열 누출을
  금지합니다.

## 아이콘 시스템(I2) — 사용된 아이콘만 export

- 원칙: 아이콘 배럴(`src/shared/components/ui/Icon/index.ts`)은 실제 소스
  코드에서 사용되는 아이콘만 export 합니다. 불필요한 래퍼/별칭은 추가/유지하지
  않습니다.
- 가드: `test/unit/lint/icons-used-only.scan.red.test.ts`가 배럴 export된
  아이콘이 소스 전역에서 최소 1회 이상 사용되는지 정적으로 스캔합니다(주석 제외,
  JSX 및 `h(Name, ...)` 패턴 포함). 미사용 발견 시 RED.
- 신규 아이콘 추가 시: 배럴에 추가했다면 실제 사용 코드를 함께 포함하세요.
  부득이하게 미사용 상태를 유지해야 한다면 allowlist를 신중히 사용하되, 원칙은
  “사용 추가 → 가드 GREEN”입니다.

## 🎨 코딩 스타일

### 기본 포맷팅

```typescript
// ✅ 2 spaces 들여쓰기, 세미콜론, 단일 따옴표
const config = {
  gallery: {
    autoplay: false,
  },
};

// ✅ Import 순서: 타입 → 외부 라이브러리 → 내부 모듈 → 스타일
import type { MediaItem } from '@shared/types';
import { getPreact } from '@shared/external/vendors';
import { MediaService } from '@shared/services';
import styles from './Component.module.css';
```

### 파일 네이밍

```
// 파일 및 디렉토리: kebab-case
gallery-view.tsx
media-processor.ts
components/
services/
```

### Vendor 사용 규칙 (중요)

- 외부 라이브러리(preact, @preact/signals, fflate, preact/compat 등)는 직접
  import 금지.
- 반드시 안전 getter를 사용: `@shared/external/vendors`의 `getPreact()`,
  `getPreactHooks()`, `getPreactSignals()`, `getPreactCompat()`, `getFflate()`
  등.
- 와일드카드 import(`import * as Vendors from ...`) 금지. 필요한 심볼만
  명시적으로 가져옵니다.
- Legacy 동적 API 금지: `*Legacy` 접미사, 동적 `VendorManager`, `vendor-api.ts`
  등은 테스트/마이그레이션 문맥 이외 사용 금지입니다. 프로덕션 번들에서 해당
  문자열이 검출되면 postbuild validator가 실패합니다.
- 타입도 가능하면 벤더 index에서 재export된 것을 사용합니다: `type VNode`,
  `type ComponentChildren` 등.

#### 타입 한정자 import 정책

- VNode/ComponentChildren 등 타입은 반드시 type 한정자로 import합니다.
  - 허용: `import type { VNode } from '@shared/external/vendors'` 또는
    `import { getPreact, type VNode } from '@shared/external/vendors'`
  - 금지: `import { VNode } from '@shared/external/vendors'` (type 한정자 누락)
  - 테스트: `test/unit/lint/type-only-imports.policy.red.test.ts`가 위반 시 RED.
    RED로 탐지합니다.

가드/테스트:

- 직접 import 금지 정책은 테스트에서 정적으로 스캔되어 위반 시 실패합니다.
  `test/unit/lint/direct-imports-source-scan.test.js`를 참고하세요. 반드시
  `@shared/external/vendors`의 getter로만 접근하세요.

추가 보강(2025-09-14):

- Prod 누출 가드: postbuild 검증은 StaticVendorManager는 허용하고 동적
  VendorManager 식별자를 금지합니다. 또한 `vendor-api.ts` 문자열이 산출물에
  포함되면 실패합니다.

추가(2025-09-15):

- `vendor-api.ts` 직접 import 금지(허용목록 제외). 소스 레벨 스캔 테스트
  `test/unit/lint/vendor-api.imports.scan.red.test.ts`가 위반 시 RED로
  탐지합니다.

보강(2025-09-15):

- DOM 유틸 표면: `DOMEventManager`/`createEventManager`는 내부 전용입니다. 외부
  소비자는 `@shared/services/EventManager` 어댑터만 사용하세요. 배럴
  (`@shared/dom`)에서는 더 이상 재노출하지 않습니다.
- Toolbar 애니메이션: CSS `toolbar-slide-*` 키프레임/변수는 제거되었습니다. 툴바
  show/hide는 JS API(`toolbarSlideDown/Up`)만 사용합니다.

### 로깅 정책(L2) — 프로덕션 게이트 강화

- 개발(dev) 모드에서는 `logger.debug()`가 활성화되고, 타임스탬프 및 스택
  트레이스 출력이 허용됩니다.
- 프로덕션(prod) 번들에서는 기본 로그 레벨을 `warn` 이상으로 제한하고
  `Stack trace:` 문자열이 산출물에 포함되지 않도록 합니다. 스택 트레이스 출력은
  개발 모드에서만 활성화되며, prod에서는 트리쉐이킹으로 제거됩니다.
- 가드: `scripts/validate-build.js`가 prod Userscript에서 `Stack trace:`
  문자열을 검출하면 실패 처리합니다.

## 빌드 크기 예산(B2)

- Userscript gzip 사이즈 예산을 포스트빌드에서 강제합니다.
- 임계값(2025-09-15): WARN 120 KB, FAIL 160 KB.
- 위치: `scripts/validate-build.js` — gzip 길이가 FAIL 초과면 프로세스
  종료(실패), WARN 초과면 경고 로그를 출력합니다.
- 목적: 번들 크기 회귀를 조기에 감지하고, 불가피한 증가 시 최적화/정리 우선
  검토를 유도합니다.

### 파일명 정책 (단일 소스)

- 모든 파일명 생성은 `FilenameService` 또는 동등 편의 함수
  (`generateMediaFilename`, `generateZipFilename`)를 통해서만 수행합니다.
- 소비처(서비스/유틸/컴포넌트)에서 파일명 직접 조립(문자열 연결, suffix 관리
  등)을 구현하지 않습니다. 충돌 처리(`-1`, `-2` 접미사)는 호출층(예: ZIP 단계)
  또는 서비스 내부 정책으로 일원화합니다.
- 스캔 가드: 파일명 직접 조립이 확인되면 RED로 전환하는 테스트를 유지/보강합니다
  (예: ad-hoc 파일명 패턴 탐지). 현재 구현은 MediaService/BulkDownloadService가
  FilenameService를 사용합니다.

추가 보강(2025-09-14):

- 런타임 AppContainer import 금지: 테스트 전용 하니스 이외에서
  AppContainer/createAppContainer 런타임 import 금지. 타입 전용은 허용.
- SERVICE_KEYS 직접 사용 금지: 허용된 service-accessors 경유만 사용. 직접
  import/접근은 가드 테스트에서 실패 처리.

보강(2025-09-15):

- Settings 마이그레이션: DEFAULT_SETTINGS 변경에 따른 사용자 설정 호환성은
  SettingsMigration 헬퍼를 통해 처리합니다. 서비스는 헬퍼를 호출해 누락 필드
  보완/버전 업을 수행해야 하며, 구조 변경(키 변경/삭제/리네임)은 명시적
  migration 스텝으로 추가합니다.
- Postbuild 가드 확장: PC 전용 정책 강화로 Userscript 산출물 내
  `onPointer*`/`PointerEvent` 문자열과 런타임
  `AppContainer`/`createAppContainer` 식별자 누출을 금지합니다. validator에서
  실패 처리됩니다.

### URL 패턴(정규식) 단일 소스 정책

- 정의 위치: `src/shared/utils/patterns/url-patterns.ts`의 `URL_PATTERNS`가
  유일한 소스입니다.
- 사용 규칙: 다른 레이어(예: `src/constants.ts`)에서는 이 객체를 재노출만
  수행하며, 별도의 중복 정의를 금지합니다.
- 목적: 정규식 드리프트/불일치 방지 및 테스트/가드의 단일 기준 유지.
- 테스트/가드: 정적 스캔/단위 테스트로 동등성 및 단일 소스 원칙을 검증할 수
  있습니다(위반 시 RED 권장).

보강(2025-09-15): 배럴 우회로 순환 방지

- 내부 유틸/서비스에서 상위 도메인 배럴(`index.ts`)을 참조하면 역참조 사이클이
  발생할 수 있습니다.
- 원칙: 내부 모듈 간에는 필요한 심볼을 구체 경로로 직접 import하고, 배럴은 외부
  공개 표면에 한정합니다.
- 사례: `media-url.util.ts`는 `../../media` 배럴 대신
  `../../media/FilenameService`를 직접 import하도록 수정(MEDIA-CYCLE-PRUNE-01
  완료).

예시:

```ts
// ✅ 권장
import {
  getPreact,
  getPreactHooks,
  getPreactCompat,
  getPreactSignals,
  type VNode,
} from '@shared/external/vendors';

const { h } = getPreact();
const { useEffect } = getPreactHooks();
const compat = getPreactCompat();
const { signal } = getPreactSignals();

// ❌ 금지
// import * as Vendors from '@shared/external/vendors';
// import * as preact from 'preact';
// import * as signals from '@preact/signals';
// import compat from 'preact/compat';
```

### 접근성 유틸/훅 표준화 (Focus Trap & Live Region)

- Focus Trap: 통합 유틸 `@shared/utils/focusTrap`이 단일 소스입니다. 훅
  `useFocusTrap`은 얇은 래퍼로 유틸을 위임하며, 문서 레벨 키 이벤트는 표준 DOM
  API(`document.addEventListener('keydown', ...)`, capture=true)를 사용해 직접
  등록·해제합니다. 저수준 유틸은 서비스 이벤트 매니저에 의존하지 않습니다.
- Live Region: 단일 인스턴스 매니저
  `@shared/utils/accessibility/live-region-manager`를 사용합니다. `useAriaLive`
  훅은 매니저의 `announce(message, politeness)`를 호출합니다. 매니저는
  beforeunload 리스너/DOM 노드 정리를 포함한 자체 정리 로직을 갖습니다.
- 테스트: 포커스 초기화/복원(Escape) 및 라이브 리전 싱글톤/속성 가드는 단위
  테스트로 검증됩니다.

#### Utils ↔ Services 의존성 경계 (추가 규정)

utils 레이어는 순수 도메인/플랫폼 보조 계층으로, 런타임
서비스(`@shared/services/**`)에 의존하지 않습니다. 접근성/이벤트 등 저수준
유틸은 가능한 한 표준 DOM API (`window.addEventListener`,
`document.addEventListener` 등)를 우선 사용하며, 서비스의 이벤트
중개자(`EventManager` 등)를 직접 참조하지 않습니다.

- 허용: 타입 전용 import(`import type`), 로깅(`@shared/logging`), 상수/순수
  함수(`@shared/utils/**` 내부 참조), 벤더 getter(`@shared/external/vendors`).
- 금지: 서비스 단 참조(`@shared/services/**`), 컨테이너/ServiceManager 경유
  참조, 상위 배럴을 통해 간접적으로 서비스로 연결되는 import.

이 규정은 의존성 순환(cycle) 예방과 테스트 격리를 보장하기 위한 것으로, 예를
들어 `focusTrap`/`live-region-manager`는 표준 DOM 리스너를 사용하고 서비스
이벤트 매니저에 의존하지 않습니다.

### TSX 인라인 스타일 — 색상 정책 (CSS 토큰만)

- 원칙: TSX의 inline style에서 색상 관련 속성(color/background/backgroundColor/
  borderColor/outlineColor/fill/stroke/caretColor 등)에 색상 리터럴을 직접
  사용하지 않습니다.
- 허용 값: 디자인 토큰 변수 `var(--xeg-*/--color-*)`만 사용합니다. 시스템 키워드
  `transparent`/`currentColor`/`Canvas`/`CanvasText`/`HighlightText`는
  예외적으로 허용됩니다.
- 금지 예: `'#fff'`, `'rgb(255,255,255)'`, `'hsl(0,0%,100%)'`, `'oklch(...)'`,
  `'color-mix(...)'`, `'white'`, `'black'` 등.
- 권장: 인라인 스타일 대신 CSS Modules로 옮겨 토큰을 사용하세요.
- 가드: `test/unit/styles/tsx-inline-colors.guard.test.ts`가 위반을 RED로
  검출합니다.

### 테스트 DI 가이드(U6) — ServiceHarness 사용

- 런타임에서는 AppContainer를 사용하지 않습니다. 테스트에서도 가능한
  ServiceManager + 접근자 패턴을 그대로 사용합니다.
- 테스트에서 서비스 초기화/리셋/주입이 필요할 때 `ServiceHarness`를 사용하세요.
  - `await harness.initCoreServices()`로 코어 서비스 등록
  - `harness.get/tryGet/register`로 조회/주입
  - `harness.reset()`으로 싱글톤 상태 초기화(테스트 간 격리)
- AppContainer/createAppContainer는 리팩토링 스위트 전용이며, 일반 단위
  테스트에서 금지합니다.
- 가드: `test/unit/lint/runtime-appcontainer.imports.red.test.ts`가 런타임
  import를 금지합니다(type-only 허용).

샘플(단위 테스트):

```ts
import { createServiceHarness } from '@/shared/container/ServiceHarness';
import { SERVICE_KEYS } from '@/constants';

const h = createServiceHarness();
await h.initCoreServices();
expect(h.get(SERVICE_KEYS.TOAST)).toBeDefined();
h.reset();
expect(h.tryGet(SERVICE_KEYS.TOAST)).toBeNull();
```

### Toast 시스템(싱글톤 매니저)

- 토스트 상태의 단일 소스는 `UnifiedToastManager`입니다. 컴포넌트/서비스는 통합
  매니저의 API를 사용하세요.
- UI 컴포넌트에서 토스트 목록을 구독해야 할 경우,
  `UnifiedToastManager.getInstance().subscribe(...)`를 사용합니다.
- 레거시 `Toast.tsx`의 `toasts` 신호를 외부에서 직접 구독/조작하지 마세요.
  브리징은 제거되었으며, 외부 소비자는 통합 매니저만 사용합니다.

가드/테스트:

- UI 배럴 표면 가드:
  `test/unit/lint/toast-ui-barrel.stateful-exports.guard.test.ts`
  - 금지: `src/shared/components/ui/index.ts`에서 `addToast`/`removeToast`/
    `clearAllToasts`/`toasts` 같은 상태성 API의 런타임 export
  - 허용: 컴포넌트(`Toast`, `ToastContainer`)와 타입(type-only)만
- UI 컴포넌트 가드:
  `test/unit/lint/toast-ui-components.no-local-state.guard.test.ts`
  - 금지: UI Toast 파일에서 로컬 상태/함수 정의(토스트 추가/삭제 등)
  - 요구: `ToastItem`은 서비스 타입을 type-only import로 사용

### Border Radius 정책 (Design Tokens)

| 용도                        | 토큰                                                | 설명                           |
| --------------------------- | --------------------------------------------------- | ------------------------------ |
| 인터랙션 (아이콘/작은 버튼) | `var(--xeg-radius-md)`                              | IconButton, 작은 액션 영역     |
| 일반 Surface / 기본 버튼    | `var(--xeg-radius-lg)`                              | Toolbar 버튼, 카드성 작은 블록 |
| 대형 Surface / 컨테이너     | `var(--xeg-radius-xl)` 또는 `var(--xeg-radius-2xl)` | 모달/토스트 등 큰 영역         |
| Pill 형태                   | `var(--xeg-radius-pill)`                            | 배지, Chip 요소                |
| 원형                        | `var(--xeg-radius-full)`                            | 원형 아바타, 원형 토글         |

규칙:

- px 직접 값 사용 금지 (테스트에서 검출)
- semantic (`--xeg-radius-*`) 토큰만 컴포넌트 CSS에 사용

#### 구현 예시 (Toast / Gallery)

```text
Toast
  .toast (container / surface large)        -> var(--xeg-radius-2xl)
  .actionButton / .closeButton (interaction)-> var(--xeg-radius-md)

Gallery
  .controlButton (interaction)              -> var(--xeg-radius-md)
  .controls (집합 pill 형태)                -> var(--xeg-radius-pill)
  .xegCloseButton / .xegNavButton (shape)   -> var(--xeg-radius-full)
  .mediaElement / .error (standard surface) -> var(--xeg-radius-lg)
```

권장 패턴:

- Interaction 요소는 통일된 hover/active 스타일을 유지하기 위해 모두 `md` 사용
- Surface 크기 차별화: 일반(`lg`), 대형/시각적 강조(`2xl` - Toast 등)
- 형태 구분은 `pill` / `full` 만 사용하고 임의 radius 조합 지양

### 테마 토큰 시스템 (Theme Tokens) ✅ **완료된 시스템**

#### 자동 테마 대응 시스템

| 용도        | 라이트 모드 | 다크 모드   | 권장 토큰                 |
| ----------- | ----------- | ----------- | ------------------------- |
| 갤러리 배경 | 밝은 색상   | 어두운 색상 | `var(--xeg-gallery-bg)`   |
| 모달 배경   | 밝은 색상   | 어두운 색상 | `var(--xeg-modal-bg)`     |
| 모달 보더   | 중간 색상   | 밝은 색상   | `var(--xeg-modal-border)` |
| 기본 배경   | 밝은 색상   | 어두운 색상 | `var(--color-bg-primary)` |

#### 완성된 테마 토큰 사용 예시

```css
/* ✅ 갤러리 - 테마 자동 대응 */
.gallery-container {
  background: var(--xeg-gallery-bg); /* 라이트/다크 자동 전환 */
}

/* ✅ 설정 모달 - 테마별 배경/보더 (컴포넌트 토큰 금지, 테마 토큰만 사용) */
.modal {
  background: var(--xeg-modal-bg);
  border: 1px solid var(--xeg-modal-border);
}

/* ✅ 기본 인터랙션 요소 */
.button {
  background: var(
    --color-bg-primary
  ); /* (구) 문서에 있었던 --xeg-color-bg-primary 는 존재하지 않으므로 정정 */
  color: var(--xeg-color-text-primary);
}

.button:hover {
  background: var(--xeg-color-bg-hover);
}
```

#### 시스템 테마 감지 (구현 완료)

```css
/* 시스템 설정 감지 */
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) {
    --xeg-gallery-bg: var(--xeg-gallery-bg-light);
    --xeg-modal-bg: var(--xeg-modal-bg-light);
  }
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --xeg-gallery-bg: var(--xeg-gallery-bg-dark);
    --xeg-modal-bg: var(--xeg-modal-bg-dark);
  }
}

/* 수동 테마 설정 */
[data-theme='light'] {
  --xeg-gallery-bg: var(--xeg-gallery-bg-light);
  --xeg-modal-bg: var(--xeg-modal-bg-light);
  --xeg-modal-border: var(--xeg-modal-border-light);
}

[data-theme='dark'] {
  --xeg-gallery-bg: var(--xeg-gallery-bg-dark);
  --xeg-modal-bg: var(--xeg-modal-bg-dark);
  --xeg-modal-border: var(--xeg-modal-border-dark);
}
```

#### 인터랙션 상태 표준화

```css
/* ✅ 표준화된 호버 효과 */
.interactive-element:hover {
  /* hover lift는 반드시 토큰을 사용합니다. */
  transform: translateY(var(--xeg-button-lift));
  box-shadow: var(--xeg-shadow-md);
  background: var(--xeg-color-bg-hover);
}

.interactive-element:active {
  transform: translateY(0);
  box-shadow: var(--xeg-shadow-sm);
}

/* ✅ 접근성 포커스 */
.interactive-element:focus-visible {
  outline: var(--xeg-focus-ring);
  outline-offset: var(--xeg-focus-ring-offset);
}
```

규칙:

- ✅ **하드코딩 색상 사용 금지** - 모든 색상은 토큰을 통해서만 사용
- ✅ **테마 자동 대응** - `--xeg-gallery-bg`, `--xeg-modal-bg` 등 테마별 토큰
  활용
- ✅ **시스템 테마 감지** - `prefers-color-scheme` 미디어 쿼리 지원
- ✅ **접근성 보장** - 라이트/다크 모드 모두에서 적절한 대비율 유지
- ✅ **표준화된 호버/포커스** - 일관된 인터랙션 상태 스타일 사용
- ✅ **트랜지션 정책** - `transition: all` 금지. 변할 가능성이 있는 프로퍼티만
  명시적으로 나열하고, 시간/이징은 반드시 토큰(`var(--xeg-duration-*)`,
  `var(--xeg-ease-*)`)을 사용합니다.

### IconButton 사용 규칙

- 반복되는 아이콘 전용 버튼은 반드시 `<IconButton>` 사용 (토큰/hover/active
  일관)
- 사이즈: `sm(28px)`, `md(36px)`, `lg(44px)`, `toolbar` – 툴바에는 `toolbar`
  권장
- 접근성: 항상 `aria-label` 필수, variant에 관계없이 role="button" 의미 명확화
- 파괴적 액션(삭제 등)은 `intent="danger"` 사용. 단, "닫기"는 파괴적 액션이
  아니므로 중립(intent 미지정 또는 `intent="neutral"`)을 사용합니다.
- 커스텀 버튼에 동일 패턴 필요 시 확장 대신 IconButton 조합 우선

설정 모달 전용 규칙:

- SettingsModal 헤더의 닫기 버튼은 반드시 IconButton을 사용하되, intent는
  중립(미지정)으로 합니다. 테스트 표준에 따라 버튼 크기는 2.5em(약 40px)에
  맞춥니다.
- 닫기 버튼의 모양은 radius 토큰을 사용합니다:
  `border-radius: var(--xeg-radius-md)`.
- SettingsModal의 select 컨트롤은 툴바 버튼과 동일한 포커스 링/호버 체계를
  갖도록 토큰(`--xeg-*`)과 공용 변형 클래스를 사용합니다.

#### Toolbar/SettingsModal 클릭 타겟·반응형 규칙

- 최소 인터랙션 크기: Toolbar 버튼 및 SettingsModal 헤더 닫기 버튼 모두 최소
  2.5em width/height/padding 스케일을 보장합니다(접근성·일관성 기준).
- 반응형에서는 px 대신 em 단위를 사용합니다. 특히 폭/높이/min-size/padding, gap,
  font-size, 진행 표시 폭(progress bar width) 등은 em 기반으로 정의합니다.
- TS/TSX 인라인 스타일로 크기를 오버라이드하지 말고, CSS Module 클래스에서
  토큰/단위를 적용합니다.
- IconButton size="toolbar"는 2.5em 타겟과 일치하도록 설계되어 있으므로 별도 px
  고정 값을 부여하지 않습니다.
- 관련 가드(예): toolbar.separator-contrast, settings-modal.accessibility,
  modal-toolbar-visual-consistency

#### 모달 ↔ 툴바 색상/레이어 통합 정책

- 배경/보더/텍스트 색:
  - 모달: `--xeg-modal-bg`, `--xeg-modal-border`, 텍스트는 `--xeg-color-text-*`
  - 툴바: `--xeg-bg-toolbar`, `--color-border-default`, 텍스트는
    `--xeg-color-text-*` (가능하면 semantic 직접 사용, 과도기에는 alias 허용)
- 상호작용 상태(hover/active/focus):
  - 포커스 링은 `--xeg-focus-ring`/`--xeg-focus-ring-offset`을 공통 사용
  - hover lift는 변환 수치 일관 유지(툴바 기준), reduce-motion일 때 transform
    제거
- 레이어(z-index) 정책:
  - 툴바는 `--xeg-z-toolbar`, 모달은 `--xeg-z-modal`만 사용(하드코딩 금지)

## 🗺️ Sourcemap 정책 (R5)

- 빌드: 개발/프로덕션 모두 Userscript에 대해 sourcemap을 생성합니다.
  - vite 설정에서 `build.sourcemap: true` 유지
  - 소스맵에는 반드시 `sources`와 `sourcesContent`가 포함되어야 합니다
  - Userscript 말미에 `//# sourceMappingURL=<파일명>.map` 주석이 존재해야 합니다
- 검증: `scripts/validate-build.js`가 다음을 검사합니다
  - dev/prod Userscript와 대응 .map 파일의 존재 여부
  - .map JSON의 `sources`/`sourcesContent` 비어있지 않음 및 길이 일치
  - 프로덕션 번들 내 `__vitePreload` 등 dead-preload 코드가 남아 있지 않음
- 참고/주의
  - 내부 엔트리 청크에 남는 기존 sourceMappingURL 주석은 빌드 플러그인에서
    제거하고, Userscript 끝에만 하나의 주석을 추가합니다
  - 소스 경로가 절대 경로(예: C:\, /home/…)를 포함할 경우 validator가 경고를
    출력합니다 — 가능하면 상대 경로가 되도록 유지하세요
  - 모달 패널/백드롭은 Toolbar보다 위 레이어가 되어야 하며, 모달 내부 요소는
    추가 z-index를 지양

  추가 규칙 (Hardening):
  - `design-tokens.css`에서 `--xeg-modal-bg` / `--xeg-modal-border` 재정의(alias
    재매핑) 금지 — semantic 테마 토큰이 최종 authoritative.
  - 회귀 방지 테스트: `modal-token.hardening.test.ts`.

추가 토큰:

- 격리 루트(Userscript 오버레이 최상위): `--xeg-z-root` / 레이어 alias:
  `--xeg-layer-root`
- 갤러리 오버레이: `--xeg-z-gallery`(=`--xeg-z-overlay` alias)

````

### 모듈 사이드이펙트 금지 정책 (Import Safety)

- 엔트리(`src/main.ts`) 외 모듈은 import 시점에 DOM 변경/리스너 등록 등 부수효과를 발생시키지 않습니다.
- 전역 스타일도 정적 import 대신 런타임 동적 import를 사용하여 테스트/빌드 시 안전성을 보장합니다.
  - 예) `await import('./styles/globals')`를 애플리케이션 시작 흐름 내부에서 호출

### Deprecated/Placeholder 정리 정책 (P10 연계)

- types-only placeholder 혹은 @deprecated로만 유지되는 래퍼/배럴은 실제 소비처(코드/테스트) 참조가 0건임을 스캔 테스트로 확인한 경우 제거 대상입니다.
- 제거 순서
  1) 스캔/인벤토리 테스트를 최신 정책에 맞게 갱신하여 참조 0건을 RED→GREEN으로 확정
  2) 물리 삭제 또는 얇은 래퍼 유지(사이드이펙트 없음) 중 하나를 선택
  3) 배럴/테스트/문서 의존 정리 후 빌드/포스트빌드 validator 확인
- 여전히 테스트에서 존재 확인이 필요한 경우에는 명시적 @deprecated 주석과 사이드이펙트 없는 얇은 래퍼만 남기며, 신규 코드에서의 import는 금지합니다.
- 완료된 삭제/정리는 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 간단 요약으로 추가하고, 계획서에서는 해당 항목을 제거합니다.
- 글로벌 이벤트 등록은 `bootstrap/event-wiring.ts`를 통한 함수 호출 기반으로만 수행합니다.

가드:
- `test/unit/main/side-effect-free.imports.red.test.ts` (U1) — import 시 부수효과가 없음을 검증 (RED→GREEN)

벤더 초기화/정리 규칙(확장):

- StaticVendorManager 등 벤더 브릿지는 import 시 자동 초기화/리스너 등록을 하지 않습니다.
- 초기화는 엔트리 흐름에서 명시적으로 호출합니다: `initializeVendors()` 또는 동등 API.
- 정리는 명시적 API를 사용합니다: `registerVendorCleanupOnUnload()`를 통해 beforeunload에 안전하게 등록하거나, 테스트에서는 직접 `cleanup()` 호출.
- 이유: import 부작용 제거로 테스트/모킹 안정성 확보 및 TDZ/순환 의존 문제 예방.
- 가드 테스트: `test/unit/loader/feature-side-effect.red.test.ts`, `test/unit/loader/import-side-effect.scan.red.test.ts`.

#### 전역 표면 정책(R1)

- 프로덕션 번들에는 디버그/진단 전역 키(예: `globalThis.registerServiceFactory`)를 노출하지 않습니다.
- 개발 모드에서만 전역 노출을 허용하고, 빌드 플래그로 게이트하여 프로덕션에서는 트리쉐이킹으로 제거되도록 합니다.
- 권장 가드: `global-surface.no-leak.red.test.ts` — prod 산출물 문자열 스캔으로 전역 키 미존재 검증.

### 애니메이션 규칙

- transition/animation은 토큰만 사용: 시간은 `--xeg-duration-*`, 이징은 `--xeg-ease-*`만 사용합니다.
- Phase 2 (완료): 공통 transition 패턴은 preset 토큰 사용 권장
  - `--xeg-transition-preset-fade` → `opacity` 페이드 인/아웃
  - `--xeg-transition-preset-slide` → `transform + opacity` 조합
  - 신규 패턴 필요 시 동일 명명 규칙: `--xeg-transition-preset-<pattern>`
- 인라인 스타일에서도 동일 규칙 적용 (예: `opacity var(--xeg-duration-normal) var(--xeg-ease-standard)`).
- 하드코딩 숫자(ms/s)나 키워드(ease, ease-in, ease-in-out 등) 직접 사용 금지.
- 서비스에서 주입하는 CSS 역시 동일 토큰을 사용합니다.

주입 CSS 추가 규칙:
- `transition: all` 금지 → 성능과 예측 가능성을 위해 명시적 프로퍼티만 나열합니다.
- `@media (prefers-reduced-motion: reduce)`에서 전환/애니메이션을 비활성화합니다.
- 테스트로 가드됩니다:
  - `test/unit/styles/injected-css.token-policy.red.test.ts`
  - `test/unit/styles/injected-css.reduced-motion.guard.test.ts`
  - `test/unit/styles/injected-css.no-transition-all.guard.test.ts`

구현 가이드(animateCustom 예시):

```ts
// src/shared/utils/animations.ts
// API
animateCustom(el, keyframes, {
  durationToken: 'normal',          // fast | normal | slow
  easingToken: 'standard',          // standard | decelerate | accelerate
});

// 결과: transition 문자열 내부에 토큰 var()가 포함되어야 합니다.
// e.g. "opacity var(--xeg-duration-normal) var(--xeg-ease-standard)"
// 참고: guard 테스트는 test/unit/shared/utils/animations.tokens.test.ts 에 있습니다.
````

추가 규칙:

- 이징 토큰 네이밍 표준: 소비자 레이어는
  `--xeg-ease-standard`/`--xeg-ease-decelerate`/`--xeg-ease-accelerate`만
  사용합니다. (구 `--xeg-easing-*` 표기 금지)
- CSS Modules의 `composes` 사용 금지(도구 호환성 문제). 공통 스타일은 유틸
  클래스로 분리하거나 명시적으로 중복 선언합니다.

#### 툴바 애니메이션 경로(Phase 2 완료)

- 툴바 show/hide 전환은 JS API만 사용합니다: `shared/utils/animations.ts`의
  `toolbarSlideDown(element)`, `toolbarSlideUp(element)`.
- CSS 엔진의 툴바 전용 키프레임/클래스(`toolbar-slide-*`,
  `.animate-toolbar-*`)는 제거되었습니다. 새 코드에서 사용 금지.
- 갤러리 컨테이너 enter/exit 및 이미지 스태거 등은 CSS
  엔진(`css-animations.ts`)을 유지합니다.
- 테스트 가드: `test/refactoring/phase2-animation-simplification.test.ts`,
  `test/unit/lint/animation-alias-removal.test.ts`.

#### 이벤트 시스템(Deprecated 제거)

- 외부 소비 코드는 통합 어댑터만 사용: `@shared/services/EventManager`.
- 다음 심볼/경로는 import 금지:
  - `@shared/dom/DOMEventManager` 직접 import
  - `createEventManager` 팩토리 직접 import
  - `GalleryEventManager`를 `@shared/utils/events`에서 import
  - `TwitterEventManager` 명칭을 직접 import(서비스 내부 별칭은 예외)
  - `@shared/utils/events` 모듈을 외부 소비 계층에서 직접 import
- 가드 테스트: `test/unit/lint/event-deprecated-removal.test.ts` — 금지된
  import를 정적 스캔합니다(내부 모듈/어댑터 파일은 예외).

권장 예시:

```css
/* 금지 */
.spinner { animation: xeg-spin 1s ease-in-out infinite; }

/* 권장 */
.spinner { animation: xeg-spin var(--xeg-duration-normal) var(--xeg-ease-standard) infinite; }

/* 컴포넌트 애니메이션 정책 */
/* `src/assets/styles/components/animations.css` 내 `.xeg-animate-*`는
  `var(--xeg-duration-*)`와 `var(--xeg-ease-*)`만 사용합니다. */

/* 주입 CSS 예시 (요약) */
/* transition: all 대신 명시적 프로퍼티 사용 + reduced-motion 대응 */
.xcom-fade-in { transition: opacity var(--xeg-duration-normal) var(--xeg-ease-standard); }
.xcom-slide-in { transition: transform var(--xeg-duration-normal) var(--xeg-ease-decelerate), opacity var(--xeg-duration-normal) var(--xeg-ease-decelerate); }
@media (prefers-reduced-motion: reduce) {
  .xcom-fade-in, .xcom-slide-in { transition: none; }
}

### 정렬/간격 유틸리티 (alignment.css)

- 위치: `src/assets/styles/components/alignment.css`
- 목적: Toolbar/Settings 등에서 반복되는 정렬/간격/크기 규칙을 토큰/em 기반의 경량 유틸로 재사용
- 로딩: 전역 스타일은 엔트리 흐름에서만 동적 import됩니다(`src/styles/globals.ts` 경유) — 모듈 사이드이펙트 금지 정책 준수

클래스 목록:

- `.xeg-row-center`: `display:flex; align-items:center;`
- `.xeg-center-between`: `display:flex; align-items:center; justify-content:space-between;`
- `.xeg-gap-sm|md|lg`: `gap: var(--xeg-space-4|8|12)`
- `.xeg-size-toolbar`: `min-width/min-height: 2.5em` — 최소 클릭 타겟 보장
  - 밀도 스케일은 em 기반으로 유지하며, 인라인 px 오버라이드는 금지합니다.

가이드:

- 유틸 클래스는 CSS Modules의 `composes` 없이 병용합니다(직접 클래스 추가).
- px 고정값 대신 em/토큰을 유지하세요. 아이콘/텍스트 baseline 정렬은 `.xeg-row-center`를 우선 적용한 후 컴포넌트 특수 케이스만 국소 조정합니다.
- 포커스 링/색상은 본 유틸에 포함하지 않으며, 기존 토큰(`--xeg-focus-ring` 등)과 컴포넌트 스타일에서 관리합니다.

권장 패턴(툴바 인디케이터 베이스라인 동기화):

- 인디케이터 래퍼는 `display:inline-flex; align-items:center; min-height:2.5em;`으로 아이콘 버튼(2.5em)과 수직 중심을 맞춥니다.
- 숫자/구분자 텍스트는 `line-height:1`로 라인박스 여백을 제거하고, 필요 시 진행 표시(progress)는 absolute 하단 오버레이로 배치해 수직 중심에 영향을 주지 않습니다.

```

### 뷰포트 CSS 변수 정책 (Fit 모드)

동적 리사이즈 시 이미지/비디오의 fit 모드가 정확히 현재 창 크기를 반영하도록,
컨테이너 수준의 CSS 변수를 단일 소스로 사용합니다.

- 단일 소스 변수 (container-level)
  - `--xeg-viewport-w`
  - `--xeg-viewport-h`
  - `--xeg-viewport-height-constrained` — 툴바 등 상단 크롬을 제외한 실제 가용
    높이

- 산출/적용 방법
  - 구현: `src/shared/utils/viewport.ts`
    - `observeViewportCssVars(el, getChrome)`가
      `ResizeObserver + window resize`에 기반해 변수를 갱신합니다.
    - `computeViewportConstraints()`는 컨테이너 rect와 크롬 오프셋을 모두
      정수(px)로 내림 처리하여 일관성을 보장합니다.
  - 통합 지점: `VerticalGalleryView`가 갤러리 컨테이너에 위 변수를
    설정합니다(툴바 높이를 `getBoundingClientRect().height`로 크롬 오프셋에
    포함).

- 사용 규칙
  - TSX 인라인 스타일로 px 고정 금지. 토큰/변수만 사용합니다.
  - 이미지/비디오의 `fitHeight`/`fitContainer`는 반드시
    `max-height: var(--xeg-viewport-height-constrained)`를 사용합니다.
  - 동일 계산을 다른 컴포넌트에서 재구현하지 않습니다. 상위 컨테이너에 설정된
    변수를 참조하세요.

- 수명주기/성능
  - 관측자는 rAF 스로틀링됩니다. 언마운트 시 정리 필수: 내부적으로
    `TimerManager.cleanup()`로 누수 0을 보장합니다.

- 테스트 가드
  - `test/unit/viewport-utils.test.ts`가 산출 값(정수화/비음수), CSS 변수 적용,
    리스너 정리를 검증합니다.

- 참고 예시 (이미 구현됨)
  - `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css`
    - 이미지/비디오 `fitHeight`/`fitContainer` 클래스가
      `--xeg-viewport-height-constrained`를 사용합니다.

```

### 갤러리 프리로드 규칙 (Performance)

- 설정 `gallery.preloadCount`는 현재 인덱스를 중심으로 좌/우 이웃 항목을 우선 순위대로 프리로드합니다.
- 구현은 순수 함수 `computePreloadIndices(currentIndex, total, count)`를 사용하여 테스트 가능하게 유지합니다.
- 소비 지점: 갤러리 아이템 렌더링 시 `forceVisible`에 반영하여 초기 지연을 줄입니다.
- 경계: 인덱스/총합은 안전하게 클램프되며, 최대 카운트는 20으로 제한합니다(설정 서비스의 검증 규칙 일치).

- 예약 스케줄: 프리페치는 기본 즉시(immediate) 실행이며, 저우선 작업은 `schedule: 'idle'` 옵션을 사용하여 유휴 시간에 예약할 수 있습니다.
  - API: `mediaService.prefetchNextMedia(urls, currentIndex, { prefetchRange, maxConcurrent, schedule })`
    - schedule: 'immediate' | 'idle' | 'raf' | 'microtask' (기본: 'immediate')
  - 스케줄 모드별 동작(계약):
    - immediate: 호출 스레드에서 "블로킹"으로 동시성 제한 큐를 끝까지 드레인합니다(완료까지 대기, Promise는 모든 작업 종료 후 resolve).
    - idle/raf/microtask: 호출 시점에는 대기열만 시드하고 즉시 반환하는 "논블로킹" 동작입니다. 내부적으로 해당 스케줄러를 통해 동시성 제한 큐를 끝까지 드레인합니다.
    - 비고: JSDOM 등 테스트 환경에서 `requestIdleCallback` 부재 시 안전하게 `setTimeout(0)`으로 폴백합니다. 애니메이션 프레임/마이크로태스크도 유틸 레이어를 통해 폴백 처리됩니다.
  - 유틸: 인덱스 계산은 `@shared/utils/performance/computePreloadIndices` 사용, 스케줄은 `scheduleIdle/scheduleRaf/scheduleMicrotask` 사용(정적 import 권장, 동적 import 지양).
  - 정렬 정책: 현재 인덱스와의 거리 오름차순으로 정렬하며, 동일 거리일 경우 다음 항목(오른쪽)을 우선합니다.
  - 동시성 큐: `maxConcurrent` 제한 하에 전체 대기열를 끝까지 소진하도록 실행합니다(1개 동시성에서도 순차 실행 보장).
  - 테스트: `test/unit/performance/gallery-prefetch.viewport-weight.red.test.ts` (거리 정렬/큐 소진),
    `test/unit/performance/media-prefetch.idle-schedule.test.ts`/`media-prefetch.raf-schedule.test.ts`/`media-prefetch.microtask-schedule.test.ts` 등에서 보장합니다.
  - 벤치 하네스: `runPrefetchBench(mediaService, { urls, currentIndex, prefetchRange, modes })`로 간단 비교 가능
    - 산출: 각 모드별 elapsedMs, cacheEntries, bestMode

### 타이머/리스너 수명주기 일원화(R4)

- 타이머/리스너는 공통 매니저를 통해 등록/정리합니다.
- API 예시: `TimerManager#setTimeout/clearAll`, `EventManager#on/offAll`.
- 종료 시 `clearAll`/`offAll` 호출로 누수 0 보장. 테스트: `lifecycle.cleanup.leak-scan.red.test.ts`.

### 빌드 산출물/소스맵 가드(R5)

- dev: 소스맵 `sources`/`sourcesContent` 필수.
- prod: 디버그 전용 프리로드/헬퍼 코드는 트리쉐이킹으로 제외.
- 테스트: `build-artifacts.sourcemap.guard.test.ts`, `bundle-deadcode.preload-scan.test.ts`.


### 접근성 스모크 규칙 (A11y)

- focus-visible: 모든 인터랙션 요소는 `outline: var(--xeg-focus-ring)` 및 `outline-offset: var(--xeg-focus-ring-offset)`을 사용합니다.
- high contrast: 디자인 토큰 레이어에서 `@media (prefers-contrast: high)`를 지원해야 합니다.
- reduced motion: 애니메이션/트랜지션은 `@media (prefers-reduced-motion: reduce)`에서 최소화/비활성화됩니다.
- 금지: 임의 색상/하드코딩 outline/키워드 이징 사용. 항상 토큰 기반으로 정의합니다.
- 테스트: 관련 스위트에서 자동 검증되므로, 규칙 위반 시 바로 RED가 됩니다.

### Component vs Semantic 토큰

- 소스 오브 트루스는 Semantic 토큰(`--xeg-modal-bg`, `--xeg-color-*`, `--xeg-radius-*`).
- 컴포넌트 토큰은 중앙 매핑(alias)만 허용: `--xeg-comp-foo-*` → `var(--xeg-foo-*)`.
- 컴포넌트 CSS에서는 가능하면 Semantic 토큰 직접 사용, 과도기에는 alias 허용.
- 새 컴포넌트 추가 시 alias는 공용 토큰 파일에서만 정의(로컬 정의 금지).

#### 권장 매핑 예시(중앙 토큰 파일에서만 정의)

```

/_ design-tokens.semantic.css (중앙 정의 예) _/ :root { /_ Toolbar _/
--xeg-comp-toolbar-bg: var(--xeg-bg-toolbar); --xeg-comp-toolbar-border:
var(--color-border-default); --xeg-comp-toolbar-radius: var(--xeg-radius-lg);

/_ Modal _/ --xeg-comp-modal-bg: var(--xeg-modal-bg); --xeg-comp-modal-border:
var(--xeg-modal-border); --xeg-comp-modal-backdrop:
var(--color-overlay-backdrop); }

````

컴포넌트 CSS에서는 semantic 또는 위 alias만 사용하세요. 인라인 스타일/주입 CSS도 동일 규칙이 적용됩니다.

### Spacing 스케일 정책

- px를 TS/TSX 컴포넌트의 인라인 스타일에서 직접 사용하지 않습니다. 여백/간격은 CSS Module 클래스와 디자인 토큰으로만 정의합니다.
- 권장 토큰(예): `var(--xeg-space-2)`, `var(--xeg-space-4)`, `var(--xeg-space-8)`, `var(--xeg-space-12)`, `var(--xeg-space-16)`, `var(--xeg-space-24)`, `var(--xeg-space-32)`
- 컴포넌트에서는 margin/padding/gap을 CSS로 이동하고, JS 문자열 기반 스타일 주입은 지양합니다(불가피할 경우 유틸리티 모듈로 한정).
- 자동 가드: `test/unit/styles/spacing-scale.guard.test.ts`가 TSX의 인라인 style에서 px 사용을 차단합니다.

예시(권장):

```css
.itemsContainer {
  gap: var(--xeg-space-8);
  padding: var(--xeg-space-16);
}
````

### 메모리 프로파일링 유틸리티 (선택 기능)

- 목적: 대량 처리/성능 회귀 조사 시 JS 힙 사용량 스냅샷과 델타를 측정합니다.
- 지원 환경: Chromium 계열 등 `performance.memory` 제공 환경에서만 동작하며, 그
  외 환경(Node/Vitest/JSDOM)은 안전하게 noop으로 폴백합니다.
- API 위치: `@shared/utils/memory/memory-profiler` (배럴:
  `@shared/utils/memory`)
- 공개 API:
  - `isMemoryProfilingSupported(): boolean`
  - `takeMemorySnapshot(): MemorySnapshot | null`
  - `new MemoryProfiler().start(): boolean` /
    `.stop(): MemoryProfileResult | null` /
    `.measure(fn): Promise<MemoryProfileResult>`
- 데이터 구조:
  - `MemorySnapshot { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit, timestamp }`
  - `MemoryProfileResult { start, end, delta: { usedJSHeapSize, totalJSHeapSize }, durationMs }`
- 사용 가이드:
  - import 시 부작용이 없어야 하며, 측정이 필요한 코드 경계에서만 호출합니다.
  - 테스트에서는 지원 환경을 모킹하여 스냅샷/델타 계산을 검증합니다.
  - 미지원 환경에서 API는 null/false/zero 결과를 반환하므로 호출부에서 분기 없이
    안전하게 사용할 수 있습니다.

```tsx
// 금지
<div style={{ padding: '16px', gap: '8px' }} />

// 권장
<div className={styles.itemsContainer} />
```

### 외부 의존성 접근 (Vendor Getters)

- preact, @preact/signals, fflate, Userscript API(GM\_\*) 등 외부 의존성은
  반드시 전용 getter를 통해 접근합니다.
- 직접 import 금지. 테스트에서 정적 스캔으로 차단되며, getter는 모킹이 가능해야
  합니다.
- 예:
  `import { getPreact } from '@shared/external/vendors'; const { useEffect } = getPreact();`

#### ZIP 생성 정책 (Adapter)

- ZIP 생성은 반드시 전용 어댑터를 통해 수행합니다:
  `@shared/external/zip/zip-creator.ts`의
  `createZipBytesFromFileMap(files, config?)`.
- `fflate.zip`/`zipSync`를 어댑터 외부에서 직접 호출하는 것은 금지입니다.
  서비스/오케스트레이터는 어댑터만 사용하세요.
- 사유: 실행 환경에 따라 async/sync 지원 차이를 어댑터에서 흡수하고, 테스트에서
  벤더를 안전하게 모킹하기 위함입니다.
- 가드/테스트: `test/unit/lint/zip-direct-usage.scan.red.test.ts`가 어댑터
  외부의 직접 사용을 RED로 탐지합니다.

보강(2025-09-15):

- `vendor-api.ts` 직접 import 금지(허용목록 제외). 벤더 접근은
  `@shared/external/vendors` 배럴과 getter를 통해서만 수행하세요.
- 가드/테스트: `test/unit/lint/vendor-api.imports.scan.red.test.ts`가 위반 시
  RED로 탐지합니다.

#### 아이콘 라이브러리(Heroicons) 정책

- Heroicons는 React 컴포넌트 형태이므로 반드시 전용 getter를 통해 접근합니다:
  `@shared/external/vendors/heroicons-react.ts`
- 컴포넌트 소비부에서는 내부 `Icon` 래퍼 규격(디자인 토큰/접근성)을 유지해야
  하므로 Heroicons 컴포넌트를 직접 사용하지 말고 어댑터를 통해 감쌉니다 (예:
  `src/shared/components/ui/Icon/hero/HeroChevronLeft.tsx`).
- `iconRegistry`의 동적 import 경로를 사용해 코드 스플리팅/캐시 일관성을
  유지합니다.

### 의존성 구조 가이드(Dependency Graph)

- 내부 디렉터리에서는 동일 디렉터리의 배럴(index.ts)을 통해 재수입하지
  않습니다(순환 유발 방지).
  - 금지 예: `src/shared/utils/media/image-filter.ts` →
    `src/shared/utils/index.ts`
  - 권장: 필요한 모듈을 상대 경로로 직접 import (`../events`,
    `../css-animations` 등)
- UI/Utils/Media 패키지 내부 배럴 재수입은 리포트 경고 대상입니다.
- 순환 참조는 금지입니다. 분석 단계에서는 경고로 표기될 수 있으나, 리팩토링 완료
  후 에러로 승격됩니다.
- 의존성 리포트/그래프 생성:
  - 전체 생성: `npm run deps:all` (JSON/DOT/SVG + 규칙 검증)
  - 검증만: `npm run deps:check`
  - 산출물: `docs/dependency-graph.(json|dot|svg)`
  - CI/로컬에서 Graphviz가 없어도 실패하지 않도록 안전하게 처리됩니다.

#### ServiceManager 접근 규칙 (U2)

- features 레이어에서는 `@shared/services/ServiceManager`를 직접 import 하지
  않습니다.
- 가능한 한 `@shared/container/service-accessors`의 헬퍼를 사용해 SERVICE_KEYS
  의존을 감춥니다.
- 필요한 경우 `@shared/container/service-bridge` 또는 목적별 얇은
  액세서(`@shared/container/settings-access`)를 사용합니다.
- 이유: 전역 컨테이너 의존 축소, 타입 안전한 경계 유지, 테스트/모킹 용이성 향상.
- 가드: `test/unit/lint/features-no-servicemanager.imports.red.test.ts` 가
  import를 정적 스캔합니다.

예외(정리 한정):

- 애플리케이션 종료(cleanup) 시점의 전역 정리는 엔트리(`src/main.ts`)에서만
  `CoreService.getInstance().cleanup()`을 호출할 수 있습니다.
- 그 외 레이어에서는 항상 `@shared/container/service-bridge` 또는 목적별
  액세서를 사용하세요.

추가 규칙:

- SERVICE_KEYS 직접 참조를 점진적으로 제거합니다. 공용 접근은 다음 헬퍼를 우선
  사용하세요:
  - 등록: `registerGalleryRenderer`, `registerSettingsManager`,
    `registerTwitterTokenExtractor`
  - 조회: `getToastController`, `getThemeService`,
    `getMediaServiceFromContainer`, `getGalleryRenderer` 등
  - 워밍업: `warmupCriticalServices()`, `warmupNonCriticalServices()`
  - 헬퍼가 부족할 경우 추가를 선호하고, raw 키 문자열 사용은 지양합니다.

레거시 어댑터 예외:

- `features/gallery/createAppContainer.ts` 내 LegacyServiceAdapter switch 문은
  과도기 호환을 위해 SERVICE_KEYS 상수를 사용합니다. 신규 코드에서는
  service-accessors 헬퍼를 사용하고, 해당 switch는 점진 제거 대상입니다.

#### AppContainer 범위 정책 (P3)

- 목적: AppContainer는 테스트/샌드박스 하네스 전용입니다. 런타임 코드에서의
  import를 금지합니다.
- 규칙:
  - 런타임 엔트리/피처/서비스 경로에서 `features/gallery/createAppContainer` 및
    `AppContainer` 관련 심볼의 import 금지
  - 타입 전용 import(`import type { ... }`)는 테스트 도구/리팩토링 문맥에서만
    허용
  - DEV 전용 레거시 어댑터 전역 키(`__XEG_LEGACY_ADAPTER__`,
    `__XEG_GET_SERVICE_OVERRIDE__`)는 개발 모드에서만 존재하며, 프로덕션 번들
    문자열 누수는 금지됩니다
- 가드 테스트: `test/unit/lint/runtime-appcontainer.imports.red.test.ts` — 허용
  리스트 외의 런타임 import를 정적 스캔합니다.

#### 컨테이너 단일화 로드맵 (U3)

- 목표: 런타임/테스트 모두 `ServiceManager` + `service-accessors` 패턴으로
  단일화합니다.
- 테스트 하네스: 기존 `AppContainer`는 제거 대상이며, 테스트에서는 경량
  `ServiceHarness`(팩토리/리셋 API 제공) 패턴으로 대체합니다.
- 전역 키: DEV 전용 레거시 어댑터 전역 키는 최종 폐기 대상이며, 프로덕션 번들
  문자열 누수는 금지됩니다.
- 가드/DoD:
  - 런타임 AppContainer import 금지 스캔(확장) — 전 경로 금지
  - prod 번들 문자열 스캔 — 전역 키 누수 0건
  - 접근자는 `@shared/container/service-accessors`만 사용합니다.

#### 다운로드 오케스트레이션 원칙 (D1)

- 동시성/재시도/스케줄/ZIP은 오케스트레이터 서비스(`DownloadOrchestrator`)에서
  중앙화합니다.
- 기존 `BulkDownloadService` / `GalleryDownloadService`는 얇은 위임 래퍼로
  유지하여 외부 API를 안정화합니다.
- 스케줄: 즉시(immediate) 기본, 유휴 예약은 `schedule: 'idle'` 옵션으로
  노출합니다.
- 테스트 기준(요약):
  - 동시성 상한 준수, 오류 발생 시 제한 횟수 재시도, idle 스케줄 지연 실행
  - 파일명은 `MediaFilenameService`를 통해서만 생성(소비처 직접 조립 금지)

#### SERVICE_KEYS 직접 사용 금지 (P4)

- 목적: 서비스 키 상수에 대한 직접 의존을 제거하고 타입 안전 액세서로
  일원화합니다.
- 규칙:
  - 다음 모듈을 제외하고 `SERVICE_KEYS` 직접 참조 금지: 상수 정의 파일,
    `@shared/container/service-accessors`, 서비스 초기화/부트스트랩, 서비스
    진단, 그리고 과도기 예외로 `features/gallery/createAppContainer.ts`
  - 일반 소비 경로(features/shared 등)는 반드시
    `@shared/container/service-accessors`의 등록/조회 헬퍼를 사용합니다
  - 주석/문자열로도 키 이름을 노출하지 않습니다(빌드/스캔 가드 회피 목적)
- 가드 테스트: `test/unit/lint/service-keys.direct-usage.scan.red.test.ts` —
  승인된 범위 외 직접 참조를 정적으로 스캔합니다.

#### Userscript(GM\_\*) 어댑터 경계 가드

- Userscript API는 `src/shared/external/userscript/adapter.ts`의
  `getUserscript()`로만 접근합니다.
- GM\_\*이 없는 환경(Node/Vitest/JSDOM)에서도 안전하게 동작해야 합니다.
  - download: GM_download → 실패 시 fetch+BlobURL로 폴백, 비브라우저
    환경(document/body 없음)에서는 no-op
  - xhr: GM_xmlhttpRequest → 실패/부재 시 fetch 기반
    폴백(onload/onerror/onloadend 콜백 지원)
- 테스트: `test/unit/shared/external/userscript-adapter.contract.test.ts`에서
  계약/폴백 동작을 가드합니다.

#### Twitter 토큰 추출 우선순위(R3)

- 우선순위: 페이지 컨텍스트 → 쿠키/세션 → 게스트 토큰(최후 폴백)
- `GUEST_AUTHORIZATION` 등 상수 접근은 어댑터 레이어로 한정합니다. 서비스/피처
  레이어는 추출기 결과만 소비합니다.
- 가드: `twitter-token.extractor.priority.test.ts`,
  `adapter.no-direct-constant.red.test.ts`

### 설정 저장 정책 (Settings Persistence)

- features 레이어에서 `localStorage`/`sessionStorage`에 직접 접근하지 않습니다.
- 모든 설정은 SettingsService를 통해 저장/복원하고, features에서는 목적별 액세서
  `@shared/container/settings-access`의 `getSetting`/`setSetting`을 사용합니다.
- 새 설정 키 추가 시:
  - 타입: `src/features/settings/types/settings.types.ts`에 명시적 타입 추가
  - 기본값: `src/constants.ts` 또는 SettingsService의 defaults 경로에 추가(중앙
    관리)
  - 마이그레이션: SettingsService의 migrate/validate가 담당 — feature 로컬
    마이그레이션 로직 금지
- 가드 테스트: `test/unit/shared/services/settings-service.contract.test.ts`

### 토스트 시스템 사용 규칙 (UnifiedToastManager)

- features 레이어는 로컬 Toast UI/상태를 렌더하지 않습니다. 전역
  `ToastContainer` 1개와 `UnifiedToastManager`만 사용합니다.
- 라우팅 정책(기본):
  - info/success → live-only
  - warning/error → toast-only
  - 필요 시 route='both' 허용(예: 재시도 플로우의 성공 알림)
- 사용 방법: `UnifiedToastManager.show({ level, message, route? })` — 컴포넌트
  내 임의 DOM 토스트 생성 금지
- 스타일: 로컬 `.toastContainer` 등 스타일 선언 금지. 공용 컴포넌트의 토큰 기반
  스타일만 사용합니다.
- 가드 테스트: `test/unit/shared/services/toast-manager.contract.test.ts`,
  `test/unit/a11y/announce-routing.red.test.ts`

### 오류 복구 UX 표준 (Error Recovery UX)

BulkDownloadService / MediaService 다운로드 흐름에서 사용자 피드백은 토스트로
통일합니다.

정책 (Phase I 1차 구현 상태):

- 단일 다운로드 성공: 토스트 생략 (소음 최소화)
- 단일 다운로드 실패: error 토스트 (제목: "다운로드 실패")
- 다중 ZIP 전체 실패: error 토스트 ("모든 항목을 다운로드하지 못했습니다.")
- 다중 ZIP 부분 실패: warning 토스트 ("n개 항목을 받지 못했습니다.")
- 다중 ZIP 전체 성공: 토스트 생략
- 사용자 취소(Abort): info 토스트 ("다운로드 취소됨") — 중복 방지를 위해 1회만
  표시

구현 세부:

- 중복 취소 방지 플래그: BulkDownloadService.cancelToastShown
- 부분 실패 요약: DownloadResult.failures: { url, error }[] (0 < length < total
  인 경우 warning)
- 전체 실패: success=false & error 메시지 + error 토스트

향후(추가 고도화 계획):

- warning 토스트 재시도 고도화: 재시도 후 남은 실패 상세/CorrelationId 표시
- error 토스트: [자세히] 액션으로 Dev 모드 상세 로그/CorrelationId 표시
- 국제화(I18n) 어댑터: 메시지 키 기반 전환 (예: download.error.allFailed)

관련 테스트:

- `test/unit/shared/services/bulk-download.error-recovery.test.ts`
- 재시도 액션: `bulk-download.retry-action.test.ts`,
  `bulk-download.retry-action.sequence.test.ts`

가드 원칙:

- 토스트 메시지는 간결하고 중복을 최소화
- Action 버튼은 실패/재시도 컨텍스트에서만 노출
- 동일 세션 내 중복 error/warning 방지(불필요한 반복 표시 지양)

### PC 전용 입력 정책 강화

- 애플리케이션은 PC 전용 이벤트만 사용합니다: click/keydown/wheel/contextmenu
- 터치/포인터 계열 이벤트(onTouchStart/PointerDown 등)는 금지합니다. 테스트에서
  RED로 검출됩니다.

#### 키보드 입력 중앙화(KBD-NAV-UNIFY)

- 원칙: document/window에 직접 `addEventListener('keydown'|'keyup', ...)`를
  등록하지 않습니다. UI/훅/컴포넌트 층에서는 반드시 EventManager/서비스를
  경유합니다.
- 구현: `shared/services/input/KeyboardNavigator`를 통해 구독합니다. 이 서비스는
  - EventManager로 document keydown을 단일 지점에서 등록(capture: true, context
    tag 포함)
  - 편집 가능한 대상(INPUT/TEXTAREA/contentEditable)에서는 기본적으로 무시(가드)
  - 처리된 키에 대해 preventDefault/stopPropagation을 수행(옵션으로 비활성화
    가능)
- 금지: features/컴포넌트/훅에서
  `document.addEventListener('keydown'|'keyup', ...)` 또는
  `window.addEventListener('keydown'|'keyup', ...)` 사용
- 가드 테스트:
  `test/unit/lint/keyboard-listener.centralization.policy.test.ts`가 위반 시
  RED로 탐지합니다.

예시(권장):

```ts
import { keyboardNavigator } from '@shared/services/input/KeyboardNavigator';

const unsubscribe = keyboardNavigator.subscribe({
  onEscape: () => onClose(),
  onHelp: () => onOpenHelp(),
});

// ...언마운트 시
unsubscribe();
```

## 🏷️ 네이밍 규칙

### 내보내기(Export) 심볼 네이밍

- 테스트 정책상 특정 금지어가 포함된 이름은 export 심볼로 사용하지 않습니다(예:
  "unified").
- 필요 시 내부 구현 함수/컴포넌트 이름을 변경하고, default export로 호환을
  유지하세요.
- 예) 내부 이름: `InternalToolbarUnified` →
  `export default InternalToolbarUnified;`
  - 임포트 측: `import Toolbar from './UnifiedToolbar';` (기존 경로/기본 임포트
    유지)

### 변수 및 함수

```typescript
// 변수: camelCase
const imageData = await loadImage();
const currentIndex = signal(0);

// 상수: SCREAMING_SNAKE_CASE
const MAX_IMAGE_SIZE = 1024 * 1024;

// 함수: 동사 + 명사
function processImage(data: ImageData): ProcessedImage {}
function extractMediaUrl(element: HTMLElement): string {}

// Boolean: is/has/can prefix
const isLoading = signal(false);
const hasPermission = checkPermission();
```

### Toast 시스템(단일 소스 강화)

- 단일 소스: `UnifiedToastManager`가 토스트 상태와
  API(addToast/removeToast/clearAllToasts, toasts)를 단독으로 소유합니다.
- UI 계층(컴포넌트/배럴)에서는 토스트 상태성 함수/신호를 재노출하거나 소유하지
  않습니다.
  - 금지: `src/shared/components/ui/Toast/Toast.tsx` 내 로컬 `toasts`
    신호/`addToast` 등의 구현과 배럴 재노출
  - 허용: `Toast`(표현 컴포넌트), `ToastContainer`(구독/표시)와 타입(type-only
    import)만 export
- 타입 단일화: `ToastItem` 타입은 서비스에서 type-only import하여 사용합니다.
- 가드(권장): 스캔 테스트로 UI 배럴의 토스트 상태성 함수 export 금지 및 UI
  경로에서의 로컬 토스트 상태 사용 금지를 검증합니다.

## 📘 TypeScript 패턴

### 엄격한 타입 정의

```typescript
// ✅ readonly 인터페이스
interface MediaItem {
  readonly id: string;
  readonly metadata: MediaMetadata;
}

// ✅ 유니온 타입으로 상태 관리
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ✅ 제네릭 활용
interface ServiceResponse<T> {
  readonly data: T;
  readonly error?: string;
}

// ✅ 옵셔널 체이닝
const imageUrl = mediaItem.metadata?.thumbnail?.url ?? DEFAULT_THUMBNAIL;
```

### Result 패턴

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function loadImage(url: string): Promise<Result<HTMLImageElement>> {
  try {
    const img = new Image();
    img.src = url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    return { success: true, data: img };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### 서비스 계약/Result 가드

- 공개 서비스(API)는 계약 테스트로 보호합니다.
  - MediaService 공개 메서드/기본 동작 가드:
    `test/unit/shared/services/media-service.contract.test.ts`
  - 다운로드 Result shape 가드:
    `test/unit/shared/services/media-service.download-result.test.ts`
- 실패 경로는 `{ success: false, error }`를 일관되게 반환합니다.
- 성공 경로는 `{ success: true, ... }`로 데이터/파일명 등 필수 정보를
  제공합니다.

### 로깅 상관관계 ID(correlationId)

- 체인 단위 추적이 필요한 작업(예: 대량 다운로드)은 `createCorrelationId()`로
  ID를 생성하고, `createScopedLoggerWithCorrelation(scope, id)`를 사용합니다.
- 로그 출력 예: `[XEG] [BulkDownload] [DEBUG] [cid:abcd1234] message`

### 이미지 디코딩/로딩 속성

- 성능 기본값으로 이미지에는 `loading="lazy"`, `decoding="async"`를 부여합니다.
- 컴포넌트와 테스트 모두 이 속성을 가정합니다.

## 🧩 컴포넌트 패턴

### Preact 컴포넌트

```typescript
import type { ComponentProps } from '@shared/types';
import { getPreact, getPreactSignals } from '@shared/external/vendors';
import styles from './GalleryItem.module.css';

const { useCallback } = getPreact();
const { signal } = getPreactSignals();

interface GalleryItemProps {
  readonly item: MediaItem;
  readonly className?: string;
  onSelect?: (item: MediaItem) => void;
}

export function GalleryItem({ item, className, onSelect }: GalleryItemProps) {
  const isSelected = signal(false);

  const handleClick = useCallback(() => {
    onSelect?.(item);
  }, [item, onSelect]);

  return (
    <div className={`${styles.item} ${className || ''}`} onClick={handleClick}>
      <img src={item.thumbnail} alt={item.description} />
    </div>
  );
}
```

### 상태 관리 (Signals)

```typescript
import { getPreactSignals } from '@shared/external/vendors';

const { signal, computed } = getPreactSignals();

// Signal 정의
export const mediaItems = signal<MediaItem[]>([]);
export const selectedIndex = signal(0);

// Computed values
export const currentItem = computed(() => {
  const items = mediaItems.value;
  const index = selectedIndex.value;
  return items[index] || null;
});

// Action 함수 (직접 signal 변경 금지)
export function setMediaItems(items: MediaItem[]) {
  mediaItems.value = items;
  selectedIndex.value = 0;
}

export function selectNext() {
  if (selectedIndex.value < mediaItems.value.length - 1) {
    selectedIndex.value++;
  }
}
```

#### Signals ↔ Services 의존성 경계 (중요)

signals 모듈은 순수 상태 계층으로, 런타임 서비스에 절대 의존하지 않습니다. 이는
의존성 순환(cycle)과 테스트 격리 실패를 방지하기 위함입니다.

- 허용되는 import (signals 파일에서):
  - 타입 전용: `import type {...} from '@shared/types'` 등
  - 벤더 getter: `import { getPreactSignals } from '@shared/external/vendors'`
  - 순수 유틸/상수: `@shared/utils/*`, `@/constants`
  - 로깅: `import { logger } from '@shared/logging'` (서비스 경유 금지)
- 금지되는 import (signals 파일에서):
  - 모든 `@shared/services/**` 및 `@shared/services/core-services` (런타임
    서비스 의존 금지)
  - 외부 라이브러리 직접 import (`preact`, `@preact/signals` 등) → 반드시 vendor
    getter 사용

패턴 가이드:

- 서비스가 signals를 구독/호출하는 것은 가능하지만, signals가 서비스를 호출하는
  방향은 금지합니다.
- 서비스 기능이 필요하면 의존성 역전: action 함수에 콜백을 주입하거나(호출자
  제공), 서비스 쪽에서 signals 변경을 구독하여 반응하세요.
- 서비스 타입이 필요하면 타입 전용 import만 사용하세요(`import type`) — 런타임
  심볼 사용 금지.

스니펫 예시:

```ts
// ✅ 벤더 getter를 통해 Signals API 접근
import { getPreactSignals } from '@shared/external/vendors';
import { logger } from '@shared/logging';

const { signal, computed } = getPreactSignals();

export const count = signal(0);
export const doubled = computed(() => count.value * 2);

export function increment() {
  count.value += 1;
  logger.debug('[signals] count incremented', { value: count.value });
}

// ❌ 금지: services 런타임 의존 (예시)
// import { defaultLogger } from '@shared/services/core-services';
// import { MediaService } from '@shared/services/media/MediaService';
```

검증:

- 의존성 순환은 `npm run deps:check`에서 자동 검출됩니다.
- signals 파일은 테스트에서 독립적으로 import되어도 동작해야 합니다(Vitest +
  JSDOM).

## 💻 PC 환경 전용

### 지원 이벤트

```typescript
// ✅ PC 전용 이벤트만 사용
interface PCEventHandlers {
  onClick?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onWheel?: (event: WheelEvent) => void;
  onContextMenu?: (event: MouseEvent) => void;
}

// ❌ 터치 이벤트 금지
// onTouchStart, onTouchMove, onTouchEnd
```

### MediaProcessor 진행률 옵저버 (Progress Observer)

- 파이프라인 단계: collect → extract → normalize → dedupe → validate → complete
- 사용: `new MediaProcessor().process(root, { onStage: e => ... })`
- 콜백 시그니처:
  `{ stage: 'collect'|'extract'|'normalize'|'dedupe'|'validate'|'complete', count?: number, stageMs?: number, totalMs?: number }`
  - count는 해당 단계 처리 직후 누적(또는 최종) 아이템 수
  - stageMs/totalMs는 `telemetry: true`일 때 제공됩니다(기본 off).
- 오류 발생 시에도 `complete` 이벤트는 항상 1회 방출 (count=0 또는 partial 결과
  수)
- 계약 테스트: `media-processor.progress-observer.test.ts`
- 향후 고도화(옵션): duration(ms) 측정, 메모리 사용량 샘플링, stage별 latency
  로깅

### 키보드 & 마우스 처리

```typescript
// 지원 키 정의
const SUPPORTED_KEYS = {
  ESCAPE: 'Escape',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  SPACE: ' ',
} as const;

function handleKeyboard(event: KeyboardEvent) {
  if (!Object.values(SUPPORTED_KEYS).includes(event.key as any)) {
    return;
  }
  event.preventDefault();
  // 키 처리 로직
}

// 마우스 휠 처리
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  if (event.deltaY > 0) {
    selectNext();
  } else {
    selectPrevious();
  }
}
```

정책 보강(갤러리 컨텍스트):

- 갤러리가 열린 상태에서만 네비게이션
  키(Home/End/PageUp/PageDown/ArrowLeft/ArrowRight/Space)를 활성화하고, 페이지
  스크롤/페이지 이동을 방지하기 위해 기본 동작을 차단합니다.
- 갤러리가 닫힌 상태에서는 위 키들에 대한 전역 차단을 하지 않습니다(페이지 기본
  동작 유지).
- ESC는 갤러리 열림 상태에서 닫기 동작을 수행하며 기본 동작을 차단합니다.
- 이 정책은 통합 이벤트 유틸(`shared/utils/events.ts`)에서 강제되며,
  테스트(`test/unit/events/gallery-keyboard.navigation.red.test.ts`)로
  가드됩니다.

#### Wheel 이벤트 정책(R2)

- 기본: wheel 리스너는 원칙적으로 `passive: true`입니다. 단, 의도적 소비가
  필요할 때만 `passive: false`로 등록합니다.
- 직접 `addEventListener('wheel', ...)` 호출은 지양하고 전용 유틸을 사용합니다.
- 유틸 계약(ensureWheelLock):
  - `ensureWheelLock(target, onWheel, { signal? }) => cleanup`
  - `onWheel(e)`가 `true`를 반환할 때만 `e.preventDefault()` 수행
  - 반환된 cleanup 또는 AbortSignal로 정리 보장
- 예시:
  ```ts
  const cleanup = ensureWheelLock(overlayEl, e => {
    if (!isGalleryOpen()) return false; // 기본 스크롤 유지
    return shouldConsumeWheel(e); // true일 때만 preventDefault
  });
  // 닫힘/언마운트 시
  cleanup();
  ```
  테스트: `wheel-listener.policy.red.test.ts`,
  `ensureWheelLock.contract.test.ts`.

## 🧪 테스트 패턴

### 테스트 구조

```typescript
describe('GalleryItem', () => {
  beforeEach(() => {
    // 테스트 전 설정
  });

  it('should render item correctly', () => {
    const { getByRole } = render(<GalleryItem {...defaultProps} />);
    expect(getByRole('button')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onSelect = vi.fn();
    const { getByRole } = render(
      <GalleryItem {...defaultProps} onSelect={onSelect} />
    );

    fireEvent.click(getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(defaultProps.item);
  });
});
```

---

**💻 일관된 코드 스타일은 팀 생산성을 높입니다.**

## ⬇️ 다운로드 동작 가이드

### ZIP 내 파일명 충돌 정책

- 동일한 기본 파일명이 ZIP에 여러 번 추가될 수 있습니다. 이때 덮어쓰지 않고 다음
  규칙으로 고유화를 보장합니다.
  - 첫 번째 파일은 그대로 유지: alice_100_1.jpg
  - 이후 충돌 파일은 접미사 -1, -2, ... 를 확장자 앞에 붙입니다:
    alice_100_1-1.jpg, alice_100_1-2.jpg
- 구현 위치: BulkDownloadService 및 MediaService의 ZIP 경로에서 충돌 감지 및
  접미사 부여
- 테스트로 보장: test/unit/shared/services/bulk-download.filename-policy.test.ts

### 실패 요약 수집 정책

- 다중 다운로드(ZIP) 중 일부 항목이 실패해도 가능한 항목은 계속 진행합니다(부분
  성공 허용).
- 실패 항목은 다음 구조로 수집되어 결과에 포함됩니다.
  - DownloadResult.failures?: Array<{ url: string; error: string }>
- 성공/실패 요약은 UI/로그/알림에서 사용자에게 상황을 알리기 위한 최소 정보를
  제공합니다.

### 대량 다운로드 서비스 옵션 표준

- 동시성(concurrency)
  - 의미: 동시에 진행할 네트워크 요청 수 (기본 2, 최소 1, 최대 8)
  - 사용: `downloadMultiple(items, { concurrency: 2 })`
- 재시도(retries)
  - 의미: 네트워크 오류 등 실패 시 항목별 재시도 횟수 (기본 0)
  - 사용: `downloadMultiple(items, { retries: 1 })`
- 취소(AbortSignal)
  - 의미: 진행 중인 일괄 다운로드 취소
  - 사용: `downloadMultiple(items, { signal: controller.signal })`
  - 취소 시: 진행 중 작업 중단, 서비스는 정리 후 `isDownloading() === false`

### 미디어 추출(Extraction) 재시도/타임아웃 표준

- API 우선 추출은 다음 기본값을 따른다:
  - 재시도: 기본 3회(총 4회 시도), 옵션 `maxRetries`
  - 타임아웃: 기본 10s, 옵션 `timeoutMs`
- 실패 시 DOM 백업 추출을 자동 시도하며, 가능한 미디어만 반환한다.
- URL 정규화: 트위터 미디어 도메인(`pbs.twimg.com/media/...`)에 한해 이미지
  URL은 항상 `name=orig`를 강제한다(png/webp/jpg 유지). 그 외 도메인/상대/data:
  URL은 원본을 보존한다.

### Media URL Sanitization (Phase 8 완료)

- 허용 스킴 / 형태:
  - http:, https:
  - // (프로토콜 상대), / (루트 상대), ./, ../ (상대 경로)
  - data:image/\* (이미지 MIME 한정)
  - blob:
  - 스킴 없는 relative 경로 (e.g. images/pic.png)
- 차단 스킴:
  - javascript:, vbscript:, file:, ftp:, chrome-extension:, about:, mailto:,
    tel:
  - data: 중 image/\* MIME 이외 (text/html, application/javascript 등)
- 처리 정책:
  - MediaProcessor.normalize 단계에서 unsafe URL 은 descriptor 생성 전 필터링
  - stage 이벤트 시퀀스는 기존(collect→extract→normalize...) 유지 (추가 stage
    미노출) — 회귀 최소화
  - telemetry 옵션은 sanitize 오버헤드를 별도 stage 로 기록하지 않음(간결성)
- 테스트 가드: `media-processor.url-sanitization.red.test.ts` (RED 파일 유지,
  구현 후 GREEN 상태)
- 문서 반영: 본 섹션 (Phase 8 완료 시점 2025-09-11)

```

```
