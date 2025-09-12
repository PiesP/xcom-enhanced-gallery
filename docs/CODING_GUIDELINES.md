# 💻 코딩 가이드라인

> **일관된 코드 스타일과 품질 보장**

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

````
// 파일 및 디렉토리: kebab-case
gallery-view.tsx
media-processor.ts
components/
services/

### Border Radius 정책 (Design Tokens)

| 용도 | 토큰 | 설명 |
| ---- | ---- | ---- |
| 인터랙션 (아이콘/작은 버튼) | `var(--xeg-radius-md)` | IconButton, 작은 액션 영역 |
| 일반 Surface / 기본 버튼 | `var(--xeg-radius-lg)` | Toolbar 버튼, 카드성 작은 블록 |
| 대형 Surface / 컨테이너 | `var(--xeg-radius-xl)` 또는 `var(--xeg-radius-2xl)` | 모달/토스트 등 큰 영역 |
| Pill 형태 | `var(--xeg-radius-pill)` | 배지, Chip 요소 |
| 원형 | `var(--xeg-radius-full)` | 원형 아바타, 원형 토글 |

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
````

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
  transform: translateY(-1px); /* 또는 var(--xeg-button-lift) */
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
- 글로벌 이벤트 등록은 `bootstrap/event-wiring.ts`를 통한 함수 호출 기반으로만 수행합니다.

가드:
- `test/unit/main/side-effect-free.imports.red.test.ts` (U1) — import 시 부수효과가 없음을 검증 (RED→GREEN)

벤더 초기화/정리 규칙(확장):

- StaticVendorManager 등 벤더 브릿지는 import 시 자동 초기화/리스너 등록을 하지 않습니다.
- 초기화는 엔트리 흐름에서 명시적으로 호출합니다: `initializeVendors()` 또는 동등 API.
- 정리는 명시적 API를 사용합니다: `registerVendorCleanupOnUnload()`를 통해 beforeunload에 안전하게 등록하거나, 테스트에서는 직접 `cleanup()` 호출.
- 이유: import 부작용 제거로 테스트/모킹 안정성 확보 및 TDZ/순환 의존 문제 예방.
- 가드 테스트: `test/unit/loader/feature-side-effect.red.test.ts`, `test/unit/loader/import-side-effect.scan.red.test.ts`.

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
```

추가 규칙:
- 이징 토큰 네이밍 표준: 소비자 레이어는 `--xeg-ease-standard`/`--xeg-ease-decelerate`/`--xeg-ease-accelerate`만 사용합니다.
- CSS Modules의 `composes` 사용 금지(도구 호환성 문제). 공통 스타일은 유틸 클래스로 분리하거나 명시적으로 중복 선언합니다.

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
```

### 갤러리 프리로드 규칙 (Performance)

- 설정 `gallery.preloadCount`는 현재 인덱스를 중심으로 좌/우 이웃 항목을 우선 순위대로 프리로드합니다.
- 구현은 순수 함수 `computePreloadIndices(currentIndex, total, count)`를 사용하여 테스트 가능하게 유지합니다.
- 소비 지점: 갤러리 아이템 렌더링 시 `forceVisible`에 반영하여 초기 지연을 줄입니다.
- 경계: 인덱스/총합은 안전하게 클램프되며, 최대 카운트는 20으로 제한합니다(설정 서비스의 검증 규칙 일치).

- 예약 스케줄: 프리페치는 기본 즉시(immediate) 실행이며, 저우선 작업은 `schedule: 'idle'` 옵션을 사용하여 유휴 시간에 예약할 수 있습니다.
  - API: `mediaService.prefetchNextMedia(urls, currentIndex, { prefetchRange, maxConcurrent, schedule })`
    - schedule: 'immediate' | 'idle' | 'raf' | 'microtask' (기본: 'immediate')
  - 환경에서 `requestIdleCallback`이 없을 때는 안전하게 `setTimeout(0)`으로 폴백됩니다.
  - 유틸: 인덱스 계산은 `@shared/utils/performance/computePreloadIndices` 사용, 스케줄은 `scheduleIdle/scheduleRaf/scheduleMicrotask` 사용
  - 테스트: `test/unit/performance/media-prefetch.idle-schedule.test.ts` (idle) 및 후속 확장 테스트에서 보장합니다.
  - 벤치 하네스: `runPrefetchBench(mediaService, { urls, currentIndex, prefetchRange, modes })`로 간단 비교 가능
    - 산출: 각 모드별 elapsedMs, cacheEntries, bestMode


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
/* design-tokens.semantic.css (중앙 정의 예) */
:root {
  /* Toolbar */
  --xeg-comp-toolbar-bg: var(--xeg-bg-toolbar);
  --xeg-comp-toolbar-border: var(--color-border-default);
  --xeg-comp-toolbar-radius: var(--xeg-radius-lg);

  /* Modal */
  --xeg-comp-modal-bg: var(--xeg-modal-bg);
  --xeg-comp-modal-border: var(--xeg-modal-border);
  --xeg-comp-modal-backdrop: var(--color-overlay-backdrop);
}
```

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
```

```tsx
// 금지
<div style={{ padding: '16px', gap: '8px' }} />

// 권장
<div className={styles.itemsContainer} />
```

### 외부 의존성 접근 (Vendor Getters)

- preact, @preact/signals, fflate, Userscript API(GM_*) 등 외부 의존성은 반드시 전용 getter를 통해 접근합니다.
- 직접 import 금지. 테스트에서 정적 스캔으로 차단되며, getter는 모킹이 가능해야 합니다.
- 예: `import { getPreact } from '@shared/external/vendors'; const { useEffect } = getPreact();`

#### ServiceManager 접근 규칙 (U2)

- features 레이어에서는 `@shared/services/ServiceManager`를 직접 import 하지 않습니다.
- 가능한 한 `@shared/container/service-accessors`의 헬퍼를 사용해 SERVICE_KEYS 의존을 감춥니다.
- 필요한 경우 `@shared/container/service-bridge` 또는 목적별 얇은 액세서(`@shared/container/settings-access`)를 사용합니다.
- 이유: 전역 컨테이너 의존 축소, 타입 안전한 경계 유지, 테스트/모킹 용이성 향상.
- 가드: `test/unit/lint/features-no-servicemanager.imports.red.test.ts` 가 import를 정적 스캔합니다.

예외(정리 한정):
- 애플리케이션 종료(cleanup) 시점의 전역 정리는 엔트리(`src/main.ts`)에서만 `CoreService.getInstance().cleanup()`을 호출할 수 있습니다.
- 그 외 레이어에서는 항상 `@shared/container/service-bridge` 또는 목적별 액세서를 사용하세요.

추가 규칙:
- SERVICE_KEYS 직접 참조를 점진적으로 제거합니다. 공용 접근은 다음 헬퍼를 우선 사용하세요:
  - 등록: `registerGalleryRenderer`, `registerSettingsManager`, `registerTwitterTokenExtractor`
  - 조회: `getToastController`, `getThemeService`, `getMediaServiceFromContainer`, `getGalleryRenderer` 등
  - 워밍업: `warmupCriticalServices()`, `warmupNonCriticalServices()`
  - 헬퍼가 부족할 경우 추가를 선호하고, raw 키 문자열 사용은 지양합니다.

레거시 어댑터 예외:
- `features/gallery/createAppContainer.ts` 내 LegacyServiceAdapter switch 문은 과도기 호환을 위해 SERVICE_KEYS 상수를 사용합니다. 신규 코드에서는 service-accessors 헬퍼를 사용하고, 해당 switch는 점진 제거 대상입니다.

#### Userscript(GM_*) 어댑터 경계 가드

- Userscript API는 `src/shared/external/userscript/adapter.ts`의 `getUserscript()`로만 접근합니다.
- GM_*이 없는 환경(Node/Vitest/JSDOM)에서도 안전하게 동작해야 합니다.
  - download: GM_download → 실패 시 fetch+BlobURL로 폴백, 비브라우저 환경(document/body 없음)에서는 no-op
  - xhr: GM_xmlhttpRequest → 실패/부재 시 fetch 기반 폴백(onload/onerror/onloadend 콜백 지원)
- 테스트: `test/unit/shared/external/userscript-adapter.contract.test.ts`에서 계약/폴백 동작을 가드합니다.

### 설정 저장 정책 (Settings Persistence)

- features 레이어에서 `localStorage`/`sessionStorage`에 직접 접근하지 않습니다.
- 모든 설정은 SettingsService를 통해 저장/복원하고, features에서는 목적별 액세서 `@shared/container/settings-access`의 `getSetting`/`setSetting`을 사용합니다.
- 새 설정 키 추가 시:
  - 타입: `src/features/settings/types/settings.types.ts`에 명시적 타입 추가
  - 기본값: `src/constants.ts` 또는 SettingsService의 defaults 경로에 추가(중앙 관리)
  - 마이그레이션: SettingsService의 migrate/validate가 담당 — feature 로컬 마이그레이션 로직 금지
- 가드 테스트: `test/unit/shared/services/settings-service.contract.test.ts`

### 토스트 시스템 사용 규칙 (UnifiedToastManager)

- features 레이어는 로컬 Toast UI/상태를 렌더하지 않습니다. 전역 `ToastContainer` 1개와 `UnifiedToastManager`만 사용합니다.
- 라우팅 정책(기본):
  - info/success → live-only
  - warning/error → toast-only
  - 필요 시 route='both' 허용(예: 재시도 플로우의 성공 알림)
- 사용 방법: `UnifiedToastManager.show({ level, message, route? })` — 컴포넌트 내 임의 DOM 토스트 생성 금지
- 스타일: 로컬 `.toastContainer` 등 스타일 선언 금지. 공용 컴포넌트의 토큰 기반 스타일만 사용합니다.
- 가드 테스트: `test/unit/shared/services/toast-manager.contract.test.ts`, `test/unit/a11y/announce-routing.red.test.ts`

### 오류 복구 UX 표준 (Error Recovery UX)

BulkDownloadService / MediaService 다운로드 흐름에서 사용자 피드백은 토스트로 통일합니다.

정책 (Phase I 1차 구현 상태):
- 단일 다운로드 성공: 토스트 생략 (소음 최소화)
- 단일 다운로드 실패: error 토스트 (제목: "다운로드 실패")
- 다중 ZIP 전체 실패: error 토스트 ("모든 항목을 다운로드하지 못했습니다.")
- 다중 ZIP 부분 실패: warning 토스트 ("n개 항목을 받지 못했습니다.")
- 다중 ZIP 전체 성공: 토스트 생략
- 사용자 취소(Abort): info 토스트 ("다운로드 취소됨") — 중복 방지를 위해 1회만 표시

구현 세부:
- 중복 취소 방지 플래그: BulkDownloadService.cancelToastShown
- 부분 실패 요약: DownloadResult.failures: { url, error }[] (0 < length < total 인 경우 warning)
- 전체 실패: success=false & error 메시지 + error 토스트

향후(추가 고도화 계획):
- warning 토스트 재시도 고도화: 재시도 후 남은 실패 상세/CorrelationId 표시
- error 토스트: [자세히] 액션으로 Dev 모드 상세 로그/CorrelationId 표시
- 국제화(I18n) 어댑터: 메시지 키 기반 전환 (예: download.error.allFailed)

관련 테스트:
- `test/unit/shared/services/bulk-download.error-recovery.test.ts`
- 재시도 액션: `bulk-download.retry-action.test.ts`, `bulk-download.retry-action.sequence.test.ts`

가드 원칙:
- 토스트 메시지는 간결하고 중복을 최소화
- Action 버튼은 실패/재시도 컨텍스트에서만 노출
- 동일 세션 내 중복 error/warning 방지(불필요한 반복 표시 지양)

### PC 전용 입력 정책 강화

- 애플리케이션은 PC 전용 이벤트만 사용합니다: click/keydown/wheel/contextmenu
- 터치/포인터 계열 이벤트(onTouchStart/PointerDown 등)는 금지합니다. 테스트에서 RED로 검출됩니다.

## 🏷️ 네이밍 규칙

### 내보내기(Export) 심볼 네이밍

- 테스트 정책상 특정 금지어가 포함된 이름은 export 심볼로 사용하지 않습니다(예: "unified").
- 필요 시 내부 구현 함수/컴포넌트 이름을 변경하고, default export로 호환을 유지하세요.
- 예) 내부 이름: `InternalToolbarUnified` → `export default InternalToolbarUnified;`
  - 임포트 측: `import Toolbar from './UnifiedToolbar';` (기존 경로/기본 임포트 유지)

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
````

### 타입 정의

```typescript
// 인터페이스 & 타입: PascalCase
interface MediaItem {
  readonly id: string;
  readonly type: MediaType;
}

type MediaType = 'image' | 'video';
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 컴포넌트 Props
interface GalleryViewProps {
  readonly items: MediaItem[];
  onSelect?: (item: MediaItem) => void;
}
```

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

### 서비스 계약/Result 가드

- 공개 서비스(API)는 계약 테스트로 보호합니다.
  - MediaService 공개 메서드/기본 동작 가드: `test/unit/shared/services/media-service.contract.test.ts`
  - 다운로드 Result shape 가드: `test/unit/shared/services/media-service.download-result.test.ts`
- 실패 경로는 `{ success: false, error }`를 일관되게 반환합니다.
- 성공 경로는 `{ success: true, ... }`로 데이터/파일명 등 필수 정보를 제공합니다.
```

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
import { signal } from '@preact/signals';
import { getPreact } from '@shared/external/vendors';
import styles from './GalleryItem.module.css';

const { useCallback } = getPreact();

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
import { signal, computed } from '@preact/signals';

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
