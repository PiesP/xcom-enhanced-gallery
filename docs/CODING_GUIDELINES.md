# 코딩 가이드라인

일관된 코드 스타일과 품질을 위한 집행 가능한 규칙만 정리합니다. 서술형 중복은
제거하고, 세부 설계는 `ARCHITECTURE.md`/`vendors-safe-api.md`를 참조하세요.

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
import { getSolidCore } from '@shared/external/vendors';
import { MediaService } from '@shared/services';
import styles from './Component.module.css';
```

### 파일 네이밍

```text
// 파일 및 디렉토리: kebab-case
gallery-view.tsx
media-processor.ts
components/
services/
```

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

## 핵심 스택 · 스크립트 · 경로 별칭

- Stack: TypeScript(strict) + Vite 7 + SolidJS 1.9 + Vitest 3(JSDOM)
- Userscript 번들: 단일 파일 산출물
  - dev: `dist/xcom-enhanced-gallery.dev.user.js` (+ `.map`)
  - prod: `dist/xcom-enhanced-gallery.user.js` (+ `.map`)
- 주요 스크립트(package.json)
  - 타입: `npm run typecheck`
  - 린트: `npm run lint` / 자동수정 `npm run lint:fix`
  - 테스트: `npm test` · 워치 `npm run test:watch` · 커버리지
    `npm run test:coverage`
  - 빌드: `npm run build:dev` · `npm run build:prod` · 전체 `npm run build`
  - 종합 검증: `npm run validate` (typecheck + lint:fix + format)
- 경로 별칭(빌드/테스트/TS 공통): `@`, `@features`, `@shared`, `@assets`

## 아키텍처 계층과 의존성 경계

- 계층 규칙(단방향)
  - Features(UI/도메인) → Shared(services/state/utils/logging) →
    External(브라우저/벤더/Userscript 어댑터)
- External 접근은 반드시 안전 getter 경유
  - 예:
    `const solid = getSolidCore(); const { createSignal, createEffect } = solid; const { zip } = getFflate();`
  - solid-js / fflate 등을 코드에서 직접 import 금지
- Userscript 통합은 `@shared/external/userscript/adapter`를 통해서만 사용

## Import 순서 · 파일/심볼 네이밍

- Import 순서: 타입 → 벤더 getter → 내부 모듈 → 스타일
- 파일/디렉터리: kebab-case (`gallery-app.tsx`, `bulk-download-service.ts`)
- 변수/함수: camelCase, 함수는 동사+명사(`extractMediaUrl`)
- 상수: SCREAMING_SNAKE_CASE (`MAX_CONCURRENCY`)
- 타입/인터페이스: PascalCase (`MediaItem`, `LoadingState`)

## 외부 의존성 접근: Vendor getters · Userscript 어댑터

- Vendor getters(`@shared/external/vendors`)
  - TDZ-safe 정적 API 사용: `initializeVendors()`, `getSolidCore()`,
    `getSolidStore()`, `getSolidWeb()`, `getFflate()`, `getNativeDownload()` 등
  - Heroicons는 어댑터 경유: `@shared/external/vendors/heroicons-react`
  - 테스트에서 모킹 가능해야 하므로 직접 import 금지(정적 스캔 가드)
- Userscript 어댑터(`@shared/external/userscript/adapter`)
  - `getUserscript().download(url, name)` / `.xhr(opts)`만 사용
  - GM\_\* 미지원 환경(JSDOM/Node)에서도 안전 폴백 제공(fetch/BlobURL 등).
    비브라우저 환경엔 no-op

간단 예시

```ts
import { getSolidCore } from '@shared/external/vendors';
import { getUserscript } from '@shared/external/userscript/adapter';

const solid = getSolidCore();
const { createSignal, createEffect, onCleanup } = solid;

await getUserscript().download(url, filename);
```

## 상태/컴포넌트: SolidJS 네이티브 패턴 · PC 전용 입력

- **SolidJS 네이티브 패턴 사용 (권장)**
  - 전역 상태: `getSolidCore()`의 `createSignal()` 직접 사용
  - 파생값: `createMemo()` 또는 selector 유틸 사용
  - 구독/부작용: `createEffect()`로 처리
  - 예시:
    ```ts
    const solid = getSolidCore();
    const [count, setCount] = solid.createSignal(0);
    const doubled = solid.createMemo(() => count() * 2);
    solid.createEffect(() => console.log('Count changed:', count()));
    ```

- **레거시 호환 레이어 (`createGlobalSignal`)** - 점진적 마이그레이션 중
  - 기존 코드 호환성을 위해 유지 중이나, 신규 코드에서는 사용 금지
  - Preact Signals 스타일 API (`.value`, `.subscribe()`) 제공
  - Epic SOLID-NATIVE-001 완료 후 제거 예정

- SolidJS 컴포넌트는 `getSolidCore()`, `getSolidStore()`, `getSolidWeb()`의 API
  사용

- PC 전용 입력만 사용
  - 허용: click, keydown/keyup(ArrowLeft/Right, Home/End, Escape, Space), wheel,
    contextmenu, mouseenter/leave/move/down/up
  - 금지: 모든 TouchEvent/PointerEvent 계열 (테스트로 RED)

Lint 가드

- JSX: onTouch*/onPointer* 속성 사용 금지 (ESLint no-restricted-syntax)
- addEventListener: 'touch*' / 'pointer*' 이벤트 등록 금지
- 전역 타입: TouchEvent/PointerEvent 사용은 경고로 표시(예외가 필요한 경우
  테스트/설계 문서로 근거를 남기고 제한적으로 허용)

## 스타일 가이드: CSS Modules · 디자인 토큰 · A11y

- CSS Modules + 디자인 토큰만 사용. 하드코딩 색상/시간/이징 금지
- 토큰 계층
  - 색상/표면/텍스트: `--xeg-*` 또는 프로젝트 표준 `--color-*` 계열만
  - 반경: `--xeg-radius-md|lg|xl|2xl|pill|full`
  - 간격: `--xeg-space-*` 스케일 사용, TSX 인라인 스타일 px 금지
  - 애니메이션: 시간 `--xeg-duration-*`, 이징 `--xeg-ease-*`; `transition: all`
    금지, reduced-motion 가드
- 접근성(A11y)
  - focus-visible: `outline: var(--xeg-focus-ring)` /
    `outline-offset: var(--xeg-focus-ring-offset)`
  - 대비/모션/고대비 미디어쿼리 대응 유지

반경/레이어 예시

```text
Toast          → container: --xeg-radius-2xl / action: --xeg-radius-md
Gallery        → control: --xeg-radius-md / pill group: --xeg-radius-pill
Toolbar/Modal  → z-index는 토큰(`--xeg-z-toolbar`, `--xeg-z-modal`)만 사용
```

## Userscript 통합: 스타일 주입 게이팅 · 빌드/소스맵

- 스타일 주입 게이팅(vite 플러그인에서 자동 지원)
  - 글로벌 CSS 텍스트: `window.XEG_CSS_TEXT`
  - Head 주입 모드: `window.XEG_STYLE_HEAD_MODE ∈ {'auto'|'off'|'defer'}`
  - ShadowRoot 사용 시 글로벌 CSS 텍스트를 직접 주입(@import 금지)
- 소스맵 정책
  - 공통: `build.sourcemap: true`로 dev/prod 모두 .map 파일은 생성한다.
  - 주석(//# sourceMappingURL=): 기본 정책은 dev에만 부착한다.
  - 예외: prod에서 .map을 릴리즈 아티팩트에 포함하는 경우에 한해 주석을 부착할
    수 있다(정책 택1, validator로 일관성 확인).
  - validator는 `sources/sourcesContent` 무결성과 dead-preload 제거를 검증한다.

- 단일 파일 보장(자산 인라인)
  - CSS 내 `url()` 자산(아이콘/폰트/이미지)은 data URI로 인라인한다.
  - 빌드 설정에서 `assetsInlineLimit`을 충분히 크게(사실상 Infinity) 설정한다.
  - 산출물에 dist/assets 의존이 남지 않도록 validator가 검증한다.

- 헤더 메타 체크리스트
  - 필수: `@name`, `@namespace`, `@version`, `@description`, `@author`,
    `@license`
  - 실행 범위: `@match`(x.com/_, _.x.com/_) — 필요 시 twitter.com/_ 확장 검토
  - 권한: `@grant` 최소화(GM_setValue, GM_getValue, GM_download,
    GM_xmlhttpRequest), `@connect` 도메인 화이트리스트 최신화
  - 배포: `@downloadURL`, `@updateURL`, `@supportURL`
  - 품질: `@homepageURL`, `@source`, `@icon`, `@antifeature none`

## 서비스/도메인 규칙: Settings · Toast · 다운로드/ZIP · 로그

- ServiceManager 접근
  - features → 직접 import 금지. `@shared/container/*` 액세서/브리지 사용
  - 전역 정리(cleanup)는 엔트리(`src/main.ts`)에서만 수행
- Settings
  - 저장/복원은 SettingsService 경유, 타입/기본값/마이그레이션을 중앙에서 관리
  - settings-access 키 가이드: 'download.showProgressToast' — SettingsModal에서
    setSetting/getSetting으로 저장/복원, GalleryRenderer가 getSetting으로 읽어
    BulkDownloadService.downloadMultiple(..., { showProgressToast })로 전달
- Toast
  - 전역 `UnifiedToastManager` 사용, 컴포넌트 로컬 토스트 금지
  - 기본 라우팅: info/success(live-only), warning/error(toast-only)
- 다운로드/ZIP
  - 단일 다운로드: `getUserscript().download` 또는 `getNativeDownload()`
  - ZIP 생성: `@shared/external/zip/zip-creator` 사용(중복 파일명은 접미사로
    고유화)
  - 대량 다운로드 옵션: `concurrency`, `retries`, `AbortSignal` 표준화
  - 실패 요약/오류 복구 UX는 토스트 정책 준수
- 로깅/상관관계
  - 대량 작업에 `correlationId` 적용, 범위 지정 로거 사용

## 테스트 전략(TDD) · 모킹 · 제외 규칙

- Vitest + JSDOM, 기본 URL `https://x.com`, `test/setup.ts` 자동 로드
- 포함: `test/**/*.{test,spec}.{ts,tsx}`
- 외부 의존성(Vendor/Userscript/DOM API)은 getter를 통해 주입·모킹 가능해야 함
- RED→GREEN 절차 유지, 계약 테스트로 공개 API 보호
- 임시 제외 테스트는 vitest 설정 주석을 참고해 추적 관리

추가 지침(훅/수명주기 테스트)

- useEffect/useLayoutEffect는 항상 반환(cleanup)을 제공해야 하며, 등록한
  리스너/타이머/관찰자를 해제합니다.
- 의존성 배열(deps)은 ESLint 규칙을 따르며, signal이나 ref 래퍼를 사용하는 경우
  안정 참조를 유지합니다. 깊은 객체를 deps에 직접 넣지 않습니다(필요 시 파생
  원시값으로 분해).
- 장시간 실행 시나리오(100+ 미디어 아이템)에서 메모리/리스너 누수 0을 검증하는
  테스트를 제공합니다.

## 툴바 키보드 내비 · Wheel 정책

- 툴바 포커스 흐름: Prev → Next → Fit 토글들 → 다운로드 → Settings → Close
- 키 매핑: Arrow/Home/End/Escape만 자체 처리(Tab은 브라우저 기본 순서)
- 그룹 데이터 속성: `data-toolbar-group`, `data-group-first="true"` 규약
- Wheel 정책: 전용 유틸 `ensureWheelLock` 사용, 필요 시에만 preventDefault

## 반응형 상태 최적화 가이드 (SolidJS)

- 대형 배열/맵은 불변 업데이트를 적용하고, 파생 연산은 `createMemo()` 또는
  `useSignalSelector`로 메모이즈합니다.
- 다수 구독으로 인한 리렌더 폭발을 피하기 위해, 컴포넌트에서는 selector 패턴으로
  최소 필요한 파생값만 구독합니다.
- 배치 업데이트(`batch()`)를 통해 프레임당 변경 횟수를 제한하고, 타이머/스케줄러
  유틸을 사용합니다.
- 신호 파생에서 DOM을 직접 접근하지 않습니다(부작용은 `createEffect`로 분리).

## 성능/수명주기: 프리로드 · 타이머/리스너

- 프리로드: `computePreloadIndices` 기반, 거리 우선 정렬, 스케줄
  모드(immediate/idle/raf/microtask) 지원
- 타이머/리스너: 공통 매니저를 통해 등록/정리, 종료 시 누수 0 보장

## 품질 게이트 · 빠른 체크리스트

- 커밋/PR 전
  - 타입: `npm run typecheck`
  - 린트: `npm run lint:fix`
  - 테스트: `npm test` (필요 시 `-t`로 범위 축소)
  - 빌드: `npm run build:dev && npm run build:prod` 후 산출물 검증 자동 수행
- 빠른 체크리스트
  - [ ] 벤더/Userscript는 getter로만 접근했는가?
  - [ ] PC 전용 이벤트만 사용했는가? (Touch/Pointer 금지)
  - [ ] ESLint PC-only 이벤트 가드가 위반을 탐지하는가? (onTouch*/onPointer*,
        addEventListener touch*/pointer*)
  - [ ] CSS Modules + 디자인 토큰만 사용했는가? (색상/시간/이징 하드코딩 금지)
  - [ ] features 레이어에서 ServiceManager를 직접 import하지 않았는가?
  - [ ] 테스트는 RED→GREEN로 진행했는가? 계약 테스트를 추가했는가?
  - [ ] Userscript 빌드 산출물과 소스맵 정책을 만족하는가?

---

부록) 간단 코드 예시

1. Vendor/SolidJS 네이티브 사용 (권장)

```ts
import { getSolidCore } from '@shared/external/vendors';

const solid = getSolidCore();
const { createSignal, createMemo, createEffect, onCleanup } = solid;

// 상태 생성 (네이티브)
const [items, setItems] = createSignal<string[]>([]);
const firstItem = createMemo(() => items()[0] ?? null);

// 부작용/구독
createEffect(() => {
  console.log('Items changed:', items());
});
```

1-b. 레거시 호환 레이어 (신규 코드에서는 사용 금지)

```ts
import { createGlobalSignal } from '@shared/state/createGlobalSignal';

// ⚠️ 레거시 패턴 - 신규 코드에서는 사용하지 마세요
const itemsSignal = createGlobalSignal<string[]>([]);
const firstItem = () => itemsSignal.value[0] ?? null;
```

1. Userscript 어댑터 다운로드

```ts
import { getUserscript } from '@shared/external/userscript/adapter';
await getUserscript().download('https://example.com/file.jpg', 'file.jpg');
```

1. Wheel 정책 유틸

```ts
import { ensureWheelLock } from '@shared/utils/events/wheel';
const cleanup = ensureWheelLock(overlayEl, e => shouldConsume(e));
// 언마운트 시 cleanup()
```

1. ZIP 생성

```ts
import { createZipFromItems } from '@shared/external/zip/zip-creator';
const blob = await createZipFromItems(items, 'media.zip');
```

문서는 프로젝트의 단일 소스 오브 트루스로 유지됩니다. 애매하거나 누락된 규칙이
있으면 `AGENTS.md` 및 저장소의 테스트를 기준으로 보완하세요.

### Anti-Patterns

- 대규모 구조 변경과 GREEN 전환을 하나의 거대한 커밋에 혼합
- `.red.` 제거와 동시에 스펙을 변경 (추적 혼선)
- 번들/접근성/토큰 회귀 측정 없이 스타일/구조 수정
- **SolidJS 네이티브 패턴 Anti-patterns (신규 코드 작성 시 주의)**:
  - `createSignal()`의 반환값을 `.value` 속성으로 접근 (❌ `signal.value`, ✅
    `signal()`)
  - `.subscribe()` 메서드 사용 (❌ `signal.subscribe(cb)`, ✅
    `createEffect(() => cb(signal()))`)
  - `createGlobalSignal()` 신규 사용 (레거시 호환 레이어 - 점진적 제거 예정)
  - SolidJS API 직접 import (❌ `import { createSignal } from 'solid-js'`, ✅
    `getSolidCore()`)

### 예시 (아이콘 프리로드)

1. `toolbar.preload-icons.red.test.tsx` 추가 (FAIL)
2. Hybrid preload 최소 구현 (`preloadCommonIcons`)
3. 테스트 안정성 확인 후 GREEN
4. 파일 rename → `toolbar.preload-icons.test.tsx`
5. Completed 로그에 `ICN-R3 — Hybrid Preload GREEN` 1줄 요약 기록

이 워크플로는 새 Epic / 백로그 항목 설계 리뷰 시 품질 기준으로 활용된다.

### 추가 정책: Graduation 후 원본 RED 파일 보존 금지 (2025-09-18 확정)

중복/혼동/메트릭 왜곡을 방지하기 위해 `.red.test.` → `.test.` rename(Graduation)
완료 후 기존 RED 파일 사본/placeholder(빈 export, describe.skip 등)를 저장소에
남기지 않는다.

규칙 요약:

- Rename 는 git mv (동일 경로)로 수행 (복사 후 잔존 금지)
- GREEN 전환 시 테스트 내부의 `(RED)` 라벨/주석도 제거
- Vitest 가 "No test suite found"를 피하기 위한 임시 placeholder 는 사용하지
  않고, 즉시 최소 구현 또는 최소 expect 로 GREEN 상태를 만든다
- Batch Graduation 중 하나라도 구현 미완/실패 상태라면 해당 파일은 배치에서
  제외하여 독립 처리

근거: Batch F 후속 정리에서 placeholder 9건(이미 GREEN 동등 가드 존재)의 물리
삭제로 테스트 시간/검색 노이즈가 감소하고 RED 카운트 지표 신뢰도가 향상됨을
검증.

위반 발견 시: 즉시 불필요한 잔존 RED 사본 삭제 + Completed 로그에 정정 주석
추가.

---

## 🎯 이벤트 처리 규칙 (Epic DOM-EVENT-CLARITY)

### 기본 원칙

갤러리 컴포넌트 내에서 이벤트 전파는 명확하고 예측 가능해야 합니다. 중첩된
컴포넌트에서 발생하는 이벤트가 의도하지 않은 동작을 트리거하지 않도록 이벤트
경계를 명시적으로 관리합니다.

### 이벤트 격리 패턴

#### 1. data-role을 통한 이벤트 타겟 식별

인터랙티브 요소에 `data-role` 속성을 부여하여 이벤트 소스를 명확히 식별합니다.

```tsx
// ✅ 다운로드 버튼에 data-role 부여
<Button data-role='download' onClick={handleDownload}>
  Download
</Button>
```

#### 2. closest()를 사용한 이벤트 필터링

부모 컨테이너의 클릭 핸들러에서 `closest()`를 사용하여 특정 역할의 요소에서
발생한 이벤트를 필터링합니다.

```tsx
// ✅ 컨테이너 클릭 핸들러
const handleContainerClick = (event: MouseEvent) => {
  // data-role="download" 요소 클릭은 무시
  if ((event.target as HTMLElement | null)?.closest('[data-role="download"]')) {
    return;
  }
  // 컨테이너 직접 클릭만 처리
  props.onClick?.();
};
```

#### 3. stopPropagation()을 사용한 이벤트 버블링 차단

인터랙티브 요소의 이벤트가 부모 컨테이너로 버블링되지 않도록 명시적으로
차단합니다.

```tsx
// ✅ 다운로드 버튼 핸들러
const handleDownloadClick = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation(); // 부모로 버블링 차단
  props.onDownload?.();
};
```

### 이벤트 전파 규칙 요약

| 이벤트              | 처리 방식                      | 전파 여부 | 설명                       |
| ------------------- | ------------------------------ | --------- | -------------------------- |
| 컨테이너 직접 클릭  | `onClick` 호출                 | ✅        | 아이템 선택 트리거         |
| 다운로드 버튼 클릭  | `stopPropagation()` + 처리     | ❌        | 다운로드만 실행, 선택 방지 |
| 이미지 컨텍스트메뉴 | `onImageContextMenu` 호출      | ✅        | 네이티브 메뉴 + 컨텍스트   |
| 기타 버튼 클릭      | `data-role` + `closest()` 체크 | ❌        | 각 버튼별 독립 동작        |

### 새 인터랙티브 요소 추가 시 체크리스트

1. **data-role 속성 추가**: 요소의 역할을 명확히 식별할 수 있는 값 부여
2. **이벤트 핸들러 작성**: `stopPropagation()` 사용하여 이벤트 격리
3. **부모 핸들러 업데이트**: `closest()` 체크에 새 data-role 추가
4. **테스트 작성**: 이벤트 전파 테스트에 새 시나리오 추가
   - 요소 클릭이 부모 동작을 트리거하지 않는지 검증
   - data-role 속성이 올바르게 설정되었는지 검증

### 테스트 요구사항

모든 새 인터랙티브 요소는 다음 테스트를 포함해야 합니다:

```tsx
// ✅ 이벤트 격리 테스트 예시
it('새 버튼 클릭이 아이템 선택을 트리거하지 않아야 한다', () => {
  let itemClickCount = 0;
  let buttonClickCount = 0;

  // 컴포넌트 렌더링 with handlers
  // ...

  const button = container.querySelector('[data-role="new-button"]');
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  expect(buttonClickCount).toBe(1);
  expect(itemClickCount).toBe(0); // 부모 클릭 핸들러 미호출
});
```

### 참고: 관련 테스트 파일

- `test/features/gallery/event-propagation.test.tsx`: 이벤트 전파 체계 검증
- 구현 파일:
  `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.solid.tsx`

---

## 🎯 포커스 상태 관리 (Epic A11Y-FOCUS-ROLES)

갤러리 아이템의 두 가지 포커스 상태를 명확히 구분하여 접근성과 사용자 경험을
향상시킵니다.

### 핵심 개념: isActive vs isFocused

| 속성        | 의미                                   | 변경 시점                            | 시각적 표현       |
| ----------- | -------------------------------------- | ------------------------------------ | ----------------- |
| `isActive`  | 사용자가 명시적으로 선택한 아이템      | 클릭, 키보드 네비게이션 시 동적 변경 | 강한 강조 (2px)   |
| `isFocused` | 갤러리 열림 시 자동 스크롤 대상 아이템 | 갤러리 열림 시 1회 설정 (정적 마커)  | 가벼운 표시 (1px) |

### 상태 역할 정의

#### `isActive: boolean` (명시적 사용자 선택)

- **용도**: 사용자가 클릭하거나 키보드 네비게이션(ArrowUp/Down, Home/End)으로
  선택한 아이템
- **동작**: 키보드/마우스 인터랙션에 따라 동적으로 변경
- **시각적 피드백**: `.active` CSS 클래스 → `--xeg-active-shadow` (2px border)
- **접근성**: 현재 사용자 조작 대상을 명확히 표시

#### `isFocused?: boolean` (자동 스크롤 대상)

- **용도**: 갤러리가 열릴 때 `startIndex`와 일치하는 아이템 (초기 스크롤 위치)
- **동작**: 갤러리 열림 시 1회만 설정, 이후 변경 없음 (정적 마커)
- **시각적 피드백**: `.focused` CSS 클래스 → `--xeg-focus-shadow` (1px border)
- **접근성**: 갤러리 시작점을 시각적으로 표시

### 동시 상태 허용

두 상태는 동시에 `true`일 수 있습니다:

```typescript
// 예: 갤러리가 startIndex=3으로 열림 (사용자가 3번째 이미지를 클릭)
<VerticalImageItem
  isActive={true}    // 초기 활성 아이템
  isFocused={true}   // 자동 스크롤 대상
  // ... 두 상태가 동시에 true
/>
```

### CSS 디자인 토큰 사용

```css
/* 활성 상태: 사용자가 명시적으로 선택한 아이템 */
.container.active {
  box-shadow: var(--xeg-active-shadow); /* 2px border, 강한 강조 */
}

/* 포커스 상태: 자동 스크롤 대상 아이템 */
.container.focused {
  box-shadow: var(--xeg-focus-shadow); /* 1px border, 가벼운 표시 */
}
```

**디자인 토큰 정의** (`src/shared/styles/design-tokens.semantic.css`):

```css
--xeg-active-shadow: 0 0 0 2px var(--xeg-color-primary);
--xeg-focus-shadow: 0 0 0 1px var(--xeg-color-focus);
```

### 구현 가이드라인

#### 1. Props 정의 (TypeScript)

```typescript
export interface VerticalImageItemProps {
  /**
   * 사용자가 명시적으로 선택한 아이템 여부
   * @remarks 키보드 네비게이션에 따라 동적으로 변경됨
   */
  readonly isActive: boolean;

  /**
   * 갤러리 열림 시 자동 스크롤 대상 아이템 여부
   * @remarks 갤러리가 열릴 때 한 번만 설정되고 이후 변경되지 않음
   */
  readonly isFocused?: boolean;
}
```

#### 2. CSS 클래스 적용 (SolidJS)

```typescript
const { createMemo } = getSolidCore();

const containerClass = createMemo(() => {
  const classes = [styles.container];
  if (props.isActive) classes.push(styles.active);
  if (props.isFocused) classes.push(styles.focused);
  return classes.join(' ');
});

<div class={containerClass()}>
  {/* 컨텐츠 */}
</div>
```

#### 3. 키보드 네비게이션 핸들러

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    // isActive 상태를 다음 아이템으로 이동
    setActiveIndex(prev => Math.min(prev + 1, maxIndex));
    e.preventDefault();
  } else if (e.key === 'ArrowUp') {
    // isActive 상태를 이전 아이템으로 이동
    setActiveIndex(prev => Math.max(prev - 1, 0));
    e.preventDefault();
  }
  // isFocused는 변경하지 않음 (정적 마커)
};
```

### 테스트 요구사항

모든 포커스 상태 구현은 다음을 검증해야 합니다:

1. **isActive 동적 변경**: 키보드 네비게이션 시 active 상태가 올바르게
   이동하는지
2. **isFocused 정적 마커**: 갤러리 열림 후 focused 상태가 변경되지 않는지
3. **동시 상태 허용**: `isActive`와 `isFocused`가 동시에 true일 수 있는지
4. **CSS 클래스 적용**: `.active`와 `.focused` 클래스가 정확히 적용되는지
5. **접근성**: 키보드 전용 사용자가 현재 위치를 식별할 수 있는지

### 참고: 관련 테스트 파일

- `test/features/gallery/focus-state-roles.test.tsx`: 포커스 상태 역할 검증
- 구현 파일:
  - `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.types.ts`
  - `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css`

---
