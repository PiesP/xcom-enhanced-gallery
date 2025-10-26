# 💻 코딩 가이드라인

> **일관된 코드 스타일과 품질 보장을 위한 필수 규칙**

## 📚 관련 문서

- 구조/계층: `ARCHITECTURE.md` · 의존성: `DEPENDENCY-GOVERNANCE.md` · TDD:
  `TDD_REFACTORING_PLAN.md`

---

## 🎯 3대 핵심 원칙

### 1. Vendor Getter (필수)

```typescript
// ✅ Getter 사용 (TDZ-safe, 테스트 친화)
import { getSolid, getSolidStore } from '@shared/external/vendors';
const { createSignal, createMemo } = getSolid();

// ❌ 직접 import 금지
// import { createSignal } from 'solid-js';
```

### 2. PC 전용 이벤트

```typescript
// ✅ 허용: click, keydown/up, wheel, contextmenu, mouse*
// ❌ 금지: touchstart/move/end, pointerdown/up/move
```

### 3. CSS 디자인 토큰 (크기 + 색상)

```css
/* ✅ 크기: rem/em 토큰 사용 */
padding: var(--space-md); /* 1rem = 16px */
font-size: var(--font-size-base); /* 0.9375rem = 15px */
border-radius: var(--radius-md); /* 0.375em (폰트 비례) */

/* ✅ 색상: oklch 토큰 사용 */
color: var(--xeg-color-primary);
background: oklch(0 0 0 / var(--opacity-overlay-light));

/* ❌ 하드코딩 금지 (테스트/stylelint에서 차단) */
padding: 16px; /* rem/em 토큰 사용 */
font-size: 14px; /* rem 토큰 사용 */
border-radius: 8px; /* em 토큰 사용 */
color: #1da1f2; /* oklch 토큰 사용 */
background: rgba(0, 0, 0, 0.1); /* oklch 사용 */
```

---

## 🎨 디자인 토큰 체계 (3계층)

### 계층 구조

```css
/* 1. Primitive (design-tokens.primitive.css) */
--space-md: 1rem; /* 16px - rem (절대 크기) */
--radius-md: 0.375em; /* 6px @ 16px - em (상대 크기) */
--font-size-base: 0.9375rem; /* 15px - rem */
--color-gray-800: oklch(0.306 0.005 282);

/* 2. Semantic (design-tokens.semantic.css) */
--color-bg-elevated: var(--color-base-white);
--size-button-md: 2.5em; /* 40px @ 16px - em */
/* Semantic 레벨은 --xeg- 접두사 사용 (역할 기반 토큰) */
--xeg-modal-bg: var(--xeg-modal-bg-light);
--xeg-button-bg: var(--color-bg-surface);

/* 3. Component (design-tokens.component.css) */
/* Component 레벨은 컴포넌트별 접두사 또는 --xeg- 접두사 혼용 가능 */
--toolbar-bg: var(--xeg-bg-toolbar);
--button-border: var(--color-border-default);
--xeg-icon-size-md: var(--size-icon-md); /* 일부 component 토큰도 --xeg- 사용 */
```

### 접두사 규칙 (Prefix Rules)

**Semantic 레벨** (`design-tokens.semantic.css`):

**Component 레벨** (`design-tokens.component.css`):

### 업데이트된 가이드 (프로젝트 규칙 정리)

프로젝트는 이미 `--xeg-` 접두사를 광범위하게 사용하고 있으므로, 한 번에 대규모
리네이밍을 수행하지 않습니다. 대신 아래 가이드를 명확히 합니다:

- Semantic 레벨(`design-tokens.semantic.css`)의 권장 접두사는 `--xeg-` 입니다.
  주로 색상, 배경, 텍스트 컬러 등 전역 의미론적 토큰에 사용합니다. 예:
  `--xeg-modal-bg`, `--xeg-color-primary`.
- Component 레벨(`design-tokens.component.css`)에서는 컴포넌트 고유
  토큰(`--toolbar-`, `--button-` 등)을 권장합니다. 다만 기존 코드베이스와의
  호환성 때문에 `--xeg-` 접두사를 사용하는 component 토큰도 허용합니다. 예:
  `--xeg-icon-size-md`(허용), `--toolbar-bg`(권장).
- 우선순위 규칙: 컴포넌트에서 동일 이름의 토큰이 존재할 경우 더 좁은(scope)인
  Component 토큰이 우선합니다. (CSS cascade/사용 컨텍스트에 따름.)

실무 규칙 요약:

1. 신규 Semantic 토큰은 `--xeg-` 접두사 사용.
2. 신규 Component 토큰은 `--component-` 스타일(예: `--toolbar-`) 사용 권장. 단,
   컴포넌트에서 글로벌한 의미를 갖는 토큰이 필요하면 `--xeg-` 사용 가능.
3. 기존 토큰은 호환성을 위해 현상 유지. 리팩토링은 점진적으로,
   테스트(RED→GREEN)를 통해 수행.

이 변경은 문서화 강화로, 대규모 코드 리네임 없이 규칙을 명확히 하는 것이
목적입니다.

**신규 토큰 추가 가이드라인**:

- Semantic 레벨: 항상 `--xeg-` 접두사 사용
- Component 레벨: 기존 컴포넌트 패턴을 따를 것
  - 새로운 컴포넌트: 컴포넌트명 접두사 권장 (`--mycomponent-*`)
  - 범용 속성: `--xeg-` 접두사 사용 가능

### 크기 단위 규칙 (Size Units)

**필수 원칙**:

- **rem**: 절대 크기 (spacing, font-size, layout) - 브라우저 설정 존중
- **em**: 상대 크기 (radius, button/icon size) - 폰트 크기에 비례
- **px 금지**: 디자인 토큰 정의 파일 외 사용 금지

```css
/* ✅ 올바른 사용 */
.button {
  padding: 0.5em 1em; /* em: 부모 폰트에 비례 */
  font-size: var(--font-size-base); /* 0.9375rem */
  border-radius: var(--radius-md); /* 0.375em */
  margin-bottom: var(--space-md); /* 1rem */
}

/* ❌ 잘못된 사용 - stylelint에서 차단 */
.button {
  padding: 8px 16px; /* rem/em 토큰 사용 */
  font-size: 14px; /* rem 토큰 사용 */
  border-radius: 6px; /* em 토큰 사용 */
  margin-bottom: 16px; /* rem 토큰 사용 */
}
```

**rem vs em 선택 가이드**:

| 속성                       | 단위   | 이유                 |
| -------------------------- | ------ | -------------------- |
| `font-size`                | rem    | 절대 크기, 중첩 방지 |
| `padding`, `margin`, `gap` | rem/em | 컨텍스트에 따라 선택 |
| `border-radius`            | em     | 폰트 크기에 비례     |
| `width`, `height` (button) | em     | 폰트 크기에 비례     |
| `line-height`              | 무단위 | 상속 고려            |

### 색상 단위 규칙 (Color Units)

**필수 원칙**:

- **oklch 전용**: 모든 색상은 `oklch()` 사용
- **투명도**: opacity 토큰 + oklch alpha 조합
- **rgba/hex 금지**: 흑백 기본값(`#ffffff`, `#000000`) 제외 금지

```css
/* ✅ 올바른 사용 */
.overlay {
  background: oklch(0 0 0 / var(--opacity-overlay-light)); /* 검은색 + 10% */
  color: oklch(1 0 0); /* 흰색 */
  border: 1px solid oklch(0.378 0.005 286.3); /* gray-700 */
}

.glass {
  background: oklch(1 0 0 / var(--opacity-glass)); /* 흰색 + 85% */
  box-shadow: 0 4px 12px oklch(0 0 0 / 0.15); /* 그림자 */
}

/* ❌ 잘못된 사용 - 테스트/CodeQL에서 차단 */
.overlay {
  background: rgba(0, 0, 0, 0.1); /* oklch 사용 */
  color: #ffffff; /* oklch 또는 var(--color-base-white) */
  border: 1px solid #333; /* oklch 토큰 사용 */
}
```

**oklch 구문**:

```css
/* 기본 형식: oklch(lightness chroma hue / alpha) */
oklch(0.7 0.15 220)        /* 파란색 (lightness 70%, chroma 0.15, hue 220°) */
oklch(0.7 0.15 220 / 0.5)  /* 50% 투명도 */
oklch(0 0 0 / var(--opacity-overlay-light))  /* 검은색 + 토큰 opacity */

/* 흑백 (chroma 0) */
oklch(0 0 0)      /* 검은색 */
oklch(1 0 0)      /* 흰색 */
oklch(0.5 0 0)    /* 중간 회색 */
```

---

## 🎨 디자인 토큰 사용 예제

### 버튼 컴포넌트

```css
/* Button.module.css */
.button {
  /* Semantic 레벨 토큰 사용 */
  background: var(--xeg-button-bg);
  border: 1px solid var(--xeg-button-border);
  color: var(--xeg-button-text);

  /* Component 레벨 토큰 사용 */
  border-radius: var(--button-radius);
  padding: var(--button-padding-y) var(--button-padding-x);
  height: var(--button-height);

  /* 또는 xeg 접두사 component 토큰 */
  font-size: var(--xeg-text-base);
}

.button:hover {
  background: var(--xeg-button-bg-hover);
  border-color: var(--xeg-button-border-hover);
}
```

### 아이콘 컴포넌트

```css
/* Icon.module.css */
.icon {
  /* Component 레벨 토큰 (xeg 접두사 사용) */
  width: var(--xeg-icon-size-md);
  height: var(--xeg-icon-size-md);
  color: var(--xeg-icon-color);
  stroke-width: var(--xeg-icon-stroke-width);
}

.iconLarge {
  width: var(--xeg-icon-size-lg);
  height: var(--xeg-icon-size-lg);
}
```

### 컴포넌트 토큰 규칙

**필수**: 계층에 따른 토큰 참조

```css
:root {
  /* Semantic 레벨 (design-tokens.semantic.css) */
  /* Light defaults */
  --xeg-modal-bg-light: var(--color-bg-elevated);
  --xeg-modal-border-light: var(--color-border-default);
  --xeg-modal-bg: var(--xeg-modal-bg-light);
  --xeg-modal-border: var(--xeg-modal-border-light);

  /* Component 레벨 (design-tokens.component.css) */
  /* 컴포넌트별 접두사 */
  --toolbar-bg: var(--xeg-bg-toolbar);
  --button-border: var(--color-border-default);

  /* 또는 xeg 접두사 (범용 속성) */
  --xeg-icon-size-md: var(--size-icon-md);
  --xeg-text-base: var(--font-size-base);
}

[data-theme='dark'] {
  /* Dark overrides */
  --xeg-modal-bg-dark: var(--color-gray-800);
  --xeg-modal-border-dark: var(--color-border-emphasis);
  --xeg-modal-bg: var(--xeg-modal-bg-dark);
  --xeg-modal-border: var(--xeg-modal-border-dark);
}
```

**고대비 접근성**:

```css
.toolbar.highContrast {
  background: var(--xeg-toolbar-bg-high-contrast) !important;
}
```

---

## 🔧 에러 처리 패턴 (Phase 196)

### 개요

프로젝트의 에러 처리는 **3단계 계층**으로 분리됩니다:

1. **전역 브라우저 에러** (`@shared/error`): 처리하지 않은 예외, 거부된 Promise
2. **애플리케이션 로직 에러** (`@shared/utils/error-handling`): 함수 반환값,
   복구 전략
3. **Result 타입 기반** (`@shared/types/result.types.ts`): 주요 에러 흐름

### 1. Result<T> 패턴 (주요 흐름)

**모든 함수는 성공/실패를 명시적으로 반환해야 합니다**:

```typescript
// ✅ Result 타입으로 성공/실패 구분 (PRIMARY PATTERN)
import type { Result } from '@shared/types';

async function extractMediaMetadata(url: string): Promise<Result<Media[]>> {
  if (!url) {
    return { success: false, error: { code: 'invalid-url' } };
  }
  try {
    const data = await fetchMetadata(url);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: { code: 'extraction-failed', details: error },
    };
  }
}

// 호출처: 명시적 타입 검사
const result = await extractMediaMetadata(url);
if (result.success) {
  console.log(result.data); // Media[]
} else {
  console.error(result.error); // ErrorCode
}
```

### 2. 표준화된 에러 (ErrorFactory)

**특정 도메인에서 발생하는 에러는 ErrorFactory로 표준화**:

```typescript
import { ErrorFactory } from '@shared/utils/error-handling';

// 네트워크 에러
try {
  const res = await fetch(url);
} catch (error) {
  const standardized = ErrorFactory.createNetworkError(error, {
    url,
    method: 'GET',
    timeout: 5000,
  });
  // standardized: { type: 'network', severity: 'error', message, code }
}

// 검증 에러
if (!isValidUrl(url)) {
  const standardized = ErrorFactory.createValidationError('Invalid URL', {
    field: 'url',
    value: url,
  });
}

// 처리 에러
try {
  processMedia(item);
} catch (error) {
  const standardized = ErrorFactory.createProcessingError(error, {
    operation: 'media-processing',
    item: item.id,
  });
}
```

### 3. 에러 복구 전략

**에러 복구 패턴 (withRetry, withFallback)**:

```typescript
import { withRetry, withFallback } from '@shared/utils/error-handling';

// Retry: 지수 백오프 (50ms, 100ms, 150ms)
const data = await withRetry(() => fetchMediaMetadata(url), {
  maxAttempts: 3,
  delayMs: 50,
  backoffMultiplier: 1,
});

// Fallback: 기본값 제공
const settings = await withFallback(
  () => loadUserSettings(),
  () => DEFAULT_SETTINGS // 폴백 함수
);

// 조합
const robust = await withRetry(
  () =>
    withFallback(
      () => fetchData(url),
      () => getCachedData(url)
    ),
  { maxAttempts: 2, delayMs: 100 }
);
```

### 4. 에러 직렬화 (Logging/Telemetry)

**에러를 로그/원격 서버로 전송할 때 표준화**:

```typescript
import { serializeError, getErrorMessage } from '@shared/utils/error-handling';

try {
  await criticalOperation();
} catch (error) {
  // 사용자 메시지 (ui)
  const userMessage = getErrorMessage(error);
  toast.show(userMessage);

  // 로그 직렬화 (debugging)
  const serialized = serializeError(error);
  logger.error('Critical failure', {
    category: 'processing',
    error: serialized,
    context: { userId, operationId },
  });
}
```

### 5. 전역 에러 핸들러 (GlobalErrorHandler)

**처리하지 않은 예외와 거부된 Promise 인터셉트** (window 레벨):

```typescript
import { GlobalErrorHandler } from '@shared/error';

// main.ts에서 앱 시작 시
const errorHandler = GlobalErrorHandler.getInstance();
errorHandler.initialize(); // uncaught error/unhandled rejection 리스너 등록

// 앱 종료 시
errorHandler.destroy(); // 리스너 제거

// ❌ 금지: AppErrorHandler (deprecated, 호환성만 유지)
// import { AppErrorHandler } from '@shared/error';
```

### 가이드 요약

| 상황                | 패턴                    | 위치                                |
| ------------------- | ----------------------- | ----------------------------------- |
| **함수 성공/실패**  | Result<T> 반환          | 모든 async/sync 함수                |
| **도메인별 표준화** | ErrorFactory            | 네트워크/검증/처리 로직             |
| **재시도/폴백**     | withRetry, withFallback | 네트워크 요청, 데이터 로드          |
| **로깅/디버깅**     | serializeError          | catch 블록, 원격 로깅 서비스        |
| **처리 안 된 예외** | GlobalErrorHandler      | main.ts (initialize/destroy만 호출) |

---

## 🌐 Browser Utilities 사용 가이드 (Phase 194)

### 개요

프로젝트는 브라우저 글로벌 객체 (Window, Location, Navigator 등)에 대한 타입
안전한 접근을 제공합니다. 서버사이드 환경, 테스트 환경에서도 안전하게 작동하도록
설계되었습니다.

### 계층 분리

- **`@shared/browser`**: DOM/CSS 관리 서비스 (BrowserService)
  - CSS 주입/제거, 파일 다운로드, 페이지 가시성 확인
- **`@shared/utils/browser`**: 타입 안전 글로벌 접근 (17개 유틸리티)
  - 브라우저 환경 체크, 안전한 Window/Location/Navigator 접근

### 사용 예제

#### 환경 체크

```typescript
// ✅ 브라우저 환경 여부 확인 (SSR, Test 안전)
import { isBrowserEnvironment, isTwitterSite } from '@shared/utils/browser';

if (isBrowserEnvironment()) {
  const isTwitter = isTwitterSite();
  if (isTwitter) {
    // Twitter/X.com 환경에서만 실행
    setupGallery();
  }
}
```

#### 안전한 글로벌 접근

```typescript
// ✅ 안전한 Window 접근 (null-safe)
import { safeWindow, safeLocation, safeNavigator } from '@shared/utils/browser';

const win = safeWindow();
if (win) {
  const url = win.location.href;
  const viewport = win.innerWidth;
}

// ✅ Location 정보 추출
const info = getCurrentUrlInfo();
// { href: '...', pathname: '...', hostname: '...', search: '...' }

// ✅ 네비게이터 정보
const browserInfo = getBrowserInfo();
// { name: 'Chrome', version: '..', isChrome: true, ... }
```

#### 미디어 쿼리 & 접근성

```typescript
// ✅ 시스템 설정 감지
import {
  isDarkMode,
  prefersReducedMotion,
  matchesMediaQuery,
} from '@shared/utils/browser';

const darkMode = isDarkMode(); // prefers-color-scheme: dark
const reduceMotion = prefersReducedMotion(); // prefers-reduced-motion: reduce
const tablet = matchesMediaQuery('(max-width: 768px)');
```

#### 뷰포트 & 타이머

```typescript
// ✅ 뷰포트 크기 (레이아웃 계산용)
import { getViewportSize, getDevicePixelRatio } from '@shared/utils/browser';

const { width, height } = getViewportSize();
const dpr = getDevicePixelRatio(); // e.g., 2 on Retina

// ✅ 안전한 타이머 (메모리 관리 연동)
import { safeSetTimeout, safeClearTimeout } from '@shared/utils/browser';

const timerId = safeSetTimeout(() => {
  console.log('Delayed action');
}, 1000);

// 나중에 정리
safeClearTimeout(timerId);
```

#### DOM/CSS 관리 (BrowserService)

```typescript
// ✅ CSS 주입/제거
import { BrowserService } from '@shared/browser';

const service = new BrowserService();

// CSS 주입
service.injectCSS(
  'my-styles',
  `
  .my-class {
    color: var(--xeg-color-primary);
  }
`
);

// 페이지 가시성 확인
if (service.isPageVisible()) {
  // 페이지가 활성 상태
}

// 정리 (언마운트 시)
service.cleanup();
```

### 주의사항

- ❌ 직접 `window` 접근 금지 → `safeWindow()` 사용
- ❌ `location.href` 하드코딩 금지 → `getCurrentUrlInfo()` 또는 `safeLocation()`
  사용
- ❌ 타이머 직접 생성 금지 → `safeSetTimeout()`/`safeClearTimeout()` 사용
- ✅ 타입 안전성 확보 (모든 함수 null-safe)
- ✅ 테스트 친화적 (Mock 가능)
- ✅ 서버사이드 안전 (Node.js 환경에서도 작동)

### 호환성 경로

레거시 코드에서 이전 경로를 사용하는 경우:

```typescript
// ⚠️ 이전 경로 (계속 작동하지만 권장 X)
import { isTwitterSite } from '@shared/browser/utils/browser-utils';

// ✅ 권장 새 경로
import { isTwitterSite } from '@shared/utils/browser';
```

원본 경로는 재내보내기로 유지되므로 기존 코드는 영향 없습니다 (점진적
마이그레이션 가능).

---

## 🔧 DOM Utilities 사용 가이드 (Phase 195)

### 개요

프로젝트는 DOM 쿼리 최적화, 선택자 추상화, 기본 DOM 조작을 위한 계층화된
유틸리티를 제공합니다.

### 계층 분리

- **`@shared/dom/dom-cache`**: DOM 쿼리 캐싱 (성능 최적화)
  - TTL 기반 자동 만료, 적응형 정리
- **`@shared/dom/selector-registry`**: 선택자 추상화 (STABLE_SELECTORS 기반)
  - 우선순위 관리, 테스트 가능한 구조
- **`@shared/dom/utils`**: 기본 DOM 함수형 유틸리티
  - 요소 선택, 생성, 제거, 타입 가드

### 사용 예제

#### 캐시된 DOM 쿼리

```typescript
// ✅ 반복 쿼리에 캐시 사용 (성능 향상)
import {
  cachedQuerySelector,
  cachedQuerySelectorAll,
  cachedStableQuery,
} from '@shared/dom';

// 기본 쿼리 (캐시 20초)
const button = cachedQuerySelector('.action-button');

// 모든 요소 선택 (캐시 적용)
const items = cachedQuerySelectorAll('.list-item');

// STABLE_SELECTORS 기반 우선순위 쿼리
const tweets = cachedStableQuery(STABLE_SELECTORS.TWEET_CONTAINERS);
```

#### 선택자 레지스트리

```typescript
// ✅ 선택자 추상화로 테스트 가능한 구조
import { createSelectorRegistry } from '@shared/dom';
import { STABLE_SELECTORS } from '@/constants';

const selectors = createSelectorRegistry();

// 첫 번째 일치 요소 (캐시 연동)
const first = selectors.findFirst(STABLE_SELECTORS.TWEET_CONTAINERS);

// 모든 일치 요소
const all = selectors.findAll(STABLE_SELECTORS.MEDIA_CONTAINERS);

// 상위 컨테이너 찾기
const parent = selectors.findClosest(
  STABLE_SELECTORS.TWEET_CONTAINERS,
  element
);

// 도메인 특화 메서드
const tweet = selectors.findTweetContainer();
const media = selectors.findMediaPlayer();
```

#### 기본 DOM 유틸리티

```typescript
// ✅ 안전한 요소 선택
import {
  querySelector,
  querySelectorAll,
  elementExists,
  createElement,
  removeElement,
  isElement,
  isElementVisible,
} from '@shared/dom';

// 요소 선택 (invalid 선택자도 null 반환)
const elem = querySelector<HTMLButtonElement>('.btn-primary');
const allItems = querySelectorAll('.item');

// 요소 존재 확인
if (elementExists('.modal')) {
  closeModal();
}

// 안전한 요소 생성
const div = createElement('div', {
  classes: ['container', 'active'],
  attributes: { 'data-id': '123', 'aria-label': 'Gallery' },
  textContent: 'Hello World',
  styles: { paddingTop: 'var(--space-md)' },
});

// 요소 제거
removeElement(elem);

// 타입 가드
if (isElement(obj)) {
  // Element 타입 안전성
}

// 요소 가시성 확인
if (isElementVisible(elem)) {
  // 요소가 뷰포트 내에 표시됨
}
```

#### 이벤트 관리

```typescript
// ✅ 이벤트는 BrowserService 또는 DomEventManager 사용
import { BrowserService } from '@shared/browser';

const browserService = new BrowserService();

// CSS 주입 (DOM 레벨)
browserService.injectCSS(
  'my-styles',
  `
  .custom-class { color: red; }
`
);

// CSS 제거
browserService.removeCSS('my-styles');

// ❌ 직접 addEventListener 금지 (이전 패턴)
// import { addEventListener } from '@shared/dom'; // 제거됨

// ✅ 권장: 클래스 기반 관리
import { DomEventManager } from './dom-event-manager'; // 상대 경로

const eventManager = new DomEventManager();
eventManager.addEventListener(button, 'click', handleClick);
// 정리 (자동)
eventManager.dispose();
```

### 캐시 성능

```typescript
// 캐시 통계 확인
import { globalDOMCache } from '@shared/dom';

const stats = globalDOMCache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
// Output: Hit rate: 85.50%

// 캐시 무효화 (필요시)
globalDOMCache.invalidate('*'); // 전체 무효화
globalDOMCache.invalidate('.item'); // 특정 선택자 무효화
```

### 주의사항

- ❌ 이벤트 관리: 직접 `addEventListener` 금지 → BrowserService 또는
  DomEventManager 사용
- ❌ 선택자 하드코딩: STABLE_SELECTORS 또는 SelectorRegistry 사용
- ✅ 캐시 활용: 반복 쿼리에는 `cachedQuerySelector()` 사용
- ✅ 타입 안전: 모든 함수는 null-safe이며 invalid 선택자도 처리

---

## 📂 스타일 파일 구조

프로젝트의 CSS 파일은 계층별로 정리되어 있습니다.

### 파일 구조 개요

```
src/
├── assets/styles/
│   ├── base/
│   │   └── reset.css (v4.1)        ← 브라우저 리셋
│   ├── tokens/
│   │   ├── animation-tokens.css    ← 애니메이션 토큰 (duration/easing/delay/perf)
│   │   └── animation.css           ← deprecated (호환성 유지, 리다이렉트)
│   └── utilities/
│       ├── animations.css (v2.1)   ← @keyframes + 유틸 클래스
│       └── layout.css (v2.0)       ← Flexbox + Gap + Size 유틸
├── shared/styles/
│   ├── design-tokens.primitive.css ← 기본 토큰 (색상/크기/간격)
│   ├── design-tokens.semantic.css  ← 의미 토큰 (역할 기반)
│   ├── design-tokens.component.css ← 컴포넌트 토큰
│   ├── design-tokens.css           ← 3계층 통합 임포트
│   ├── isolated-gallery.css        ← 격리된 갤러리 스타일
```

---

## 📂 스타일 파일 구조

프로젝트의 CSS 파일은 계층별로 정리되어 있습니다.

### 파일 구조 개요

```
src/
├── assets/styles/
│   ├── base/
│   │   └── reset.css (v4.1)        ← 브라우저 리셋
│   ├── tokens/
│   │   ├── animation-tokens.css    ← 애니메이션 토큰 (duration/easing/delay/perf)
│   │   └── animation.css           ← deprecated (호환성 유지, 리다이렉트)
│   └── utilities/
│       ├── animations.css (v2.1)   ← @keyframes + 유틸 클래스
│       └── layout.css (v2.0)       ← Flexbox + Gap + Size 유틸
├── shared/styles/
│   ├── design-tokens.primitive.css ← 기본 토큰 (색상/크기/간격)
│   ├── design-tokens.semantic.css  ← 의미 토큰 (역할 기반)
│   ├── design-tokens.component.css ← 컴포넌트 토큰
│   ├── design-tokens.css           ← 3계층 통합 임포트
│   ├── isolated-gallery.css        ← 격리된 갤러리 스타일
│   ├── modern-features.css         ← 모던 CSS 기능
│   └── (기타 로직/테마)
└── styles/
    └── globals.ts                  ← CSS 임포트 진입점
```

### 파일별 책임

| 파일                    | 책임                                   | 사용 위치         |
| ----------------------- | -------------------------------------- | ----------------- |
| base/reset.css          | 브라우저 기본 스타일 초기화            | 항상 로드         |
| tokens/animation-tokens | @keyframes 없는 토큰만 (duration/ease) | 토큰 참조         |
| utilities/animations    | @keyframes + 유틸 클래스               | 클래스 적용 (+JS) |
| utilities/layout        | Flexbox + Gap + Size 유틸 클래스       | 클래스 적용       |
| shared/design-tokens.\* | 색상/크기/간격 토큰 (3계층)            | 토큰 참조         |
| shared/isolated-gallery | X.com과 격리된 갤러리 스타일           | 항상 로드         |

### 임포트 순서 (src/styles/globals.ts)

```typescript
// 1. 글로벌 격리 스타일
import '@shared/styles/isolated-gallery.css';

// 2. 통합 디자인 토큰 (Primitive → Semantic → Component)
import '@shared/styles/design-tokens.css';

// 3. 애니메이션 토큰 (duration/easing/delay/perf)
import '@assets/styles/tokens/animation-tokens.css';

// 4. 모던 CSS 기능 (상대 색상 등)
import '@shared/styles/modern-features.css';

// 5. 브라우저 리셋
import '@assets/styles/base/reset.css';

// 6. 유틸 클래스 (정렬/간격/크기)
import '@assets/styles/utilities/layout.css';

// 7. 유틸 클래스 (@keyframes + 애니메이션)
import '@assets/styles/utilities/animations.css';
```

---

## � 로깅 시스템 가이드

### 개요

Centralized logging infrastructure (`@shared/logging`)는 일관된 로깅 인터페이스,
환경별 최적화, 상관관계 추적을 제공합니다.

**원칙**:

- **항상 사용**: 디버깅/에러/성능 측정 필요시 logger 사용
- **정규 Import**: `import { logger } from '@shared/logging'` (축약형)
- **범위별 로거**: 여러 서비스에서는 `createScopedLogger()` 사용
- **tree-shaking**: 프로덕션 빌드에서 debug 호출 자동 제거

### 기본 사용

```typescript
import { logger } from '@shared/logging';

// ✅ 정보 메시지
logger.info('User action:', { userId: 123, action: 'download' });

// ✅ 경고
logger.warn('High memory usage detected', { usage: 512, limit: 1024 });

// ✅ 에러 (with context)
logger.error('Failed to extract media', { code: 500, mediaId: '123' });

// ✅ 디버그 (개발 모드만)
logger.debug('Processing media...');
```

### 범위별 로거

**여러 메서드를 가진 서비스에서 사용**:

```typescript
import { createScopedLogger } from '@shared/logging';

class MediaExtractor {
  private log = createScopedLogger('MediaExtractor');

  async extract(url: string) {
    this.log.info('Extracting from:', url);
    try {
      const media = await this.fetchMedia(url);
      this.log.debug('Media fetched:', { count: media.length });
      return media;
    } catch (error) {
      this.log.error('Extraction failed', { url, error });
      throw error;
    }
  }
}

// 출력: [XEG] [MediaExtractor] [INFO] Extracting from: ...
// 출력: [XEG] [MediaExtractor] [ERROR] Extraction failed ...
```

### 상관관계 ID로 요청 추적

**비동기 작업 체인에서 관련 로그 연결** (BulkDownload 등):

```typescript
import {
  createScopedLoggerWithCorrelation,
  createCorrelationId,
} from '@shared/logging';

async function bulkDownload(items: string[]) {
  const correlationId = createCorrelationId();
  const log = createScopedLoggerWithCorrelation('BulkDownload', correlationId);

  log.info('Download started', { itemCount: items.length });

  for (const item of items) {
    try {
      log.info('Processing:', { item });
      await downloadFile(item);
      log.info('Completed:', { item });
    } catch (error) {
      log.error('Failed:', { item, error });
    }
  }

  log.info('Download finished');
}

// 출력 예시:
// [XEG] [BulkDownload] [cid:abc123] [INFO] Download started ...
// [XEG] [BulkDownload] [cid:abc123] [INFO] Processing: ...
// [XEG] [BulkDownload] [cid:abc123] [ERROR] Failed: ...
// [XEG] [BulkDownload] [cid:abc123] [INFO] Download finished
```

### 성능 측정

**함수 실행 시간 측정** (개발 모드에서만):

```typescript
import { measurePerformance } from '@shared/logging';

// ✅ 비동기 함수
const results = await measurePerformance('extract-all-media', async () => {
  return await extractMediaFromPage();
});
// 출력 (dev): [XEG] [debug] extract-all-media: 245ms

// ✅ 동기 함수
const parsed = await measurePerformance('parse-dom', () => {
  return parsePageDOM();
});
```

### 구조화된 에러 로깅

**에러와 컨텍스트를 표준화하여 로깅**:

```typescript
import { logError } from '@shared/logging';

try {
  await downloadFile(url);
} catch (error) {
  // 구조화된 로깅 (Error 객체 + context + source)
  logError(error, { fileId: '123', retryCount: 2, url }, 'FileDownloader');
}

// 또는 logger.error() 직접 사용
logger.error('Download failed', {
  error: error instanceof Error ? error.message : String(error),
  fileId: '123',
  retry: 2,
});

// 출력 (dev 모드):
// [XEG] [ERROR] Error in FileDownloader: Network timeout
// Stack trace: Error: Network timeout
//     at downloadFile (file.ts:123)
```

### 로깅 레벨 정책

| 레벨  | 사용 시점   | Dev | Prod | 예시                       |
| ----- | ----------- | --- | ---- | -------------------------- |
| debug | 상세 추적   | ✅  | ❌   | 함수 진입, 변수값, 루프    |
| info  | 주요 이벤트 | ✅  | ✅   | 초기화 완료, 다운로드 시작 |
| warn  | 경고 상황   | ✅  | ✅   | 메모리 부족, 폴백 사용     |
| error | 에러 발생   | ✅  | ✅   | 네트워크 실패, 파싱 오류   |

### ❌ 금지 사항

```typescript
// ❌ console 직접 사용 금지
console.log('Debug info'); // 금지
console.debug('Info'); // 금지

// ❌ 직접 경로로 import 금지
import { logger } from '@shared/logging/logger'; // 금지

// ✅ 올바른 사용
import { logger } from '@shared/logging';

// ❌ 상관관계 ID 없이 수동으로 prefix 추가 금지
logger.info('[BulkDownload]' + message); // 금지

// ✅ 올바른 사용
const log = createScopedLoggerWithCorrelation('BulkDownload', cid);
log.info(message);
```

### 개발/프로덕션 자동 분기

```typescript
import { logger } from '@shared/logging';

// 자동으로 개발/프로덕션 모드 분기
// 개발: logger.debug(...) → console에 출력
// 프로덕션: logger.debug(...) → noop (코드 제거됨)

logger.debug('Detailed info'); // dev만
logger.info('Important event'); // dev + prod
```

---

## �🚀 Bootstrap 패턴 (초기화)

### 개요

Bootstrap 파일들은 애플리케이션 시작 시 한 번만 실행되는 초기화 로직을 담습니다.

**원칙**:

- 동적 import 사용 (트리셰이킹 최적화)
- 사이드이펙트 최소화 (호출 시에만 실행)
- 에러 처리 필수 (실패해도 앱 작동)
- 구조화된 로깅 (`[module-name]` 패턴)

### 파일 구조

```
src/bootstrap/
├── environment.ts          ← Vendor 라이브러리 초기화
├── events.ts              ← 전역 이벤트 (beforeunload/pagehide)
├── features.ts            ← Features 레이어 서비스 지연 등록
└── initialize-theme.ts    ← 테마 초기화 (시스템/localStorage/DOM)
```

### 사용 방법

```typescript
// src/main.ts에서 호출
import { initializeEnvironment } from '@/bootstrap/environment';
import { wireGlobalEvents } from '@/bootstrap/events';
import { registerFeatureServicesLazy } from '@/bootstrap/features';
import { initializeTheme } from '@/bootstrap/initialize-theme';

async function startApplication() {
  // 1. 환경 초기화 (Vendor 설정)
  await initializeEnvironment();

  // 2. 테마 초기화 (동기, 렌더링 전)
  initializeTheme();

  // 3. 글로벌 이벤트 (정리 핸들러)
  const unregisterEvents = wireGlobalEvents(() => {
    // 페이지 언로드 시 정리
  });

  // 4. Features 서비스 등록 (지연)
  await registerFeatureServicesLazy();
}
```

### 패턴: 동적 Import + Async/Await

**이유**: 프로덕션 번들 크기 최소화

```typescript
// ✅ 올바른 방식 (동적 import)
export async function initializeFeatures(): Promise<void> {
  const { setupFeatures } = await import('@features/setup');
  await setupFeatures();
}

// ❌ 피해야 할 방식 (정적 import)
// import { setupFeatures } from '@features/setup';
```

### 패턴: 정리 함수 반환

**이유**: 메모리 누수 방지, 테스트 정리

```typescript
// ✅ 올바른 방식 (정리 함수 반환)
export function wireGlobalEvents(onCleanup: () => void): () => void {
  window.addEventListener('beforeunload', onCleanup);

  return () => {
    window.removeEventListener('beforeunload', onCleanup);
  };
}

// 사용
const cleanup = wireGlobalEvents(() => {
  // 정리 로직
});

// 테스트/언마운트 시
cleanup();
```

### 로깅 패턴

**규칙**: `[module-name] 메시지`

```typescript
// ✅ 올바른 패턴
logger.debug('[environment] ✅ Vendors initialized');
logger.debug('[events] 🧩 Global events wired');
logger.debug('[features] Feature services registered');
logger.info('[theme] ✅ Theme initialized: dark');

// ❌ 피해야 할 패턴
logger.debug('✅ 초기화 완료'); // 모듈 불명확
logger.debug('[initializeModule] 메시지'); // 너무 길음
```

---

## 🧪 TDD 워크플로

```typescript
// 1. RED: 실패하는 테스트 작성
describe('MediaService', () => {
  it('should extract 4 images', () => {
    const result = service.extract(tweetData);
    expect(result).toHaveLength(4); // ❌ 실패
  });
});

// 2. GREEN: 최소 구현
class MediaService {
  extract(data: unknown) {
    return extractImages(data); // ✅ 통과
  }
}

// 3. REFACTOR: 개선
class MediaService {
  extract(data: TweetData): MediaItem[] {
    return this.strategy.extract(data);
  }
}
```

---

## 📦 파일 네이밍 (kebab-case 필수)

```text
✅ 올바른 파일명
gallery-view.tsx
media-processor.ts
bulk-download-service.ts

✅ Semantic Suffix 허용
app.types.ts             # 타입 정의
gallery.test.ts          # 테스트
button.module.css        # CSS Modules

❌ 잘못된 파일명
GalleryView.tsx          # PascalCase 금지
mediaProcessor.ts        # camelCase 금지
```

**자동 검증**: Phase 24 테스트 스위트가 강제 **Regex**:
`/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z]+)?\.(?:ts|tsx)$/`

---

## � 타입 정의 (Type Definitions)

### 파일 위치 규칙

**전역 빌드 환경 변수**: `types/` 루트

```typescript
// types/env.d.ts - Vite define 플러그인으로 주입되는 전역 변수
declare const __DEV__: boolean; // 개발 모드
declare const __PROD__: boolean; // 프로덕션 모드
declare const __VERSION__: string; // 패키지 버전
```

**도메인 비즈니스 타입**: `src/shared/types/` (패턴: `*.types.ts`)

```typescript
// ✅ 올바른 배치
src / shared / types / app.types.ts; // 앱 전역 타입
src / shared / types / media.types.ts; // 미디어 관련
src / shared / types / core / extraction.types.ts; // 핵심 추출 로직

// ✅ Features 특화 타입도 shared로 중앙화 가능
src / shared / types / settings.types.ts; // Settings 기능 타입

// ❌ 피해야 할 패턴
src / features / gallery / types.ts; // gallery 내부 타입 정의 (shared로 이동)
```

### 타입 정의 원칙

- **도메인별 분리**: 기능이 명확히 분리된 타입은 separate 파일 생성
  (`media.types.ts` ≠ `app.types.ts`)
- **Core 타입 세분화**: 코어 로직(추출, 매핑, 서비스)은 `core/` 하위 구조화
- **재사용성 우선**: 여러 파일에서 사용하는 타입은 shared로, 단일 파일만
  사용하면 파일 내 정의 검토
- **명시적 export**: 배럴 export 최소화, 필요한 타입만 명시 export

```typescript
// ✅ 좋은 예: 명시적 정의, 단일 책임
// src/shared/types/media.types.ts
export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  dimensions?: { width: number; height: number };
}

export type MediaList = MediaItem[];
```

---

## �📂 Import 순서

```typescript
// 1. 타입
import type { MediaItem, GalleryState } from '@shared/types';

// 2. 외부 라이브러리 (Vendor getter)
import { getSolid } from '@shared/external/vendors';

// 3. 내부 모듈 (경로 별칭 사용)
import { MediaService } from '@shared/services';
import { GalleryApp } from '@features/gallery';

// 4. 스타일
import styles from './Component.module.css';
```

---

## 🏗️ 아키텍처 경계

```text
Features (UI/기능)
    ↓
Shared (서비스/상태/유틸)
    ↓
External (어댑터/벤더)
```

- **단방향 의존만 허용**: Features → Shared → External
- **순환 참조 금지**: dependency-cruiser로 강제
- **배럴 표면 최소화**: 필요한 심볼만 export

---

## 🚀 빌드 & 검증

```bash
# 빠른 검증
npm run validate      # typecheck + lint + format

# 테스트
npm run test:smoke    # 스모크 테스트 (빠름)
npm run test:fast     # 단위 테스트
npm run e2e:smoke     # E2E 스모크

# 빌드
npm run build:dev     # 개발 빌드 (sourcemap 포함)
npm run build:prod    # 프로덕션 빌드

# 종합 검증
npm run build         # dev + prod + validate-build
```

---

## 🚫 금지 사항

| 항목            | ❌ 금지                            | ✅ 허용                                                     |
| --------------- | ---------------------------------- | ----------------------------------------------------------- |
| **Vendor**      | `import { createSignal } from...`  | `const { createSignal } = getSolid()`                       |
| **이벤트**      | `onTouchStart`, `onPointerDown`    | `onClick`, `onKeyDown`, `onWheel`                           |
| **크기**        | `padding: 16px; font-size: 14px;`  | `padding: var(--space-md); font-size: var(--font-size-sm);` |
| **색상**        | `color: #1da1f2; rgba(0,0,0,0.1);` | `color: var(--xeg-color-*); oklch(0 0 0 / 0.1);`            |
| **경로**        | `import from '../../../shared'`    | `import from '@shared'`                                     |
| **서비스 접근** | `ServiceManager` 직접 import       | `@shared/container/service-accessors` 헬퍼 사용             |
| **파일명**      | `GalleryView.tsx`, `media_util.ts` | `gallery-view.tsx`, `media-util.ts`                         |

**강제 도구**:

- **stylelint**: px 하드코딩 차단 (디자인 토큰 외)
- **CodeQL**: 하드코딩 색상/크기 감지
- **테스트**: 토큰 사용 강제 검증
- **Prettier**: 코드 포맷 자동화

---

## 📝 커밋 규칙 (Conventional Commits)

```bash
# 타입: 설명
feat: 새로운 기능
fix: 버그 수정
docs: 문서 변경
style: 코드 스타일 (포맷, 세미콜론 등)
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드/도구 변경

# 예시
git commit -m "feat: add keyboard navigation to gallery"
git commit -m "fix: resolve memory leak in media loader"
```

---

## 🔍 코드 리뷰 체크리스트

- [ ] Vendor getter 사용 (직접 import 없음)
- [ ] PC 전용 이벤트만 사용
- [ ] CSS 디자인 토큰 사용 (하드코딩 없음)
- [ ] 경로 별칭 사용 (`@shared`, `@features` 등)
- [ ] 파일명 kebab-case 준수
- [ ] 타입 명시 (TypeScript strict)
- [ ] 테스트 추가/수정 (TDD)
- [ ] 린트/포맷 통과
- [ ] 빌드 성공

---

## 📌 사례 연구: Gallery Hooks 정책 적용

### 배경

`src/features/gallery/hooks/` 디렉터리는 Solid.js 반응성을 활용한 갤러리
스크롤/포커스 관리 훅 세트입니다. 2025년 초반 개발 단계에서 누적된 Phase 주석을
정리하여 현재 코드 품질 정책을 적용하는 사례입니다.

### 적용 과정 (Phase 19A)

**전**:

- Phase 주석 15+ 개 (Phase 150.3, 21.1, 64 등) → 혼란스러운 코드 유지보수성
- 한글/영문 섞인 주석 → 일관성 부족
- 실제 동작 설명 주석 부재 → 신규 기여자 온보딩 어려움

**정책 적용**:

1. **Phase 주석 제거**: 개발 역사 기록은 Git history에 남김

```typescript
// ❌ 제거 대상
// Phase 150.3: 포커스 추적 중단 검사

// ✅ 교체됨
// Abort focus tracking if another tracking is already in progress
```

1. **주석 영문화**: 팀 협업 및 코드 일관성

```typescript
// ❌ 혼합 (한글 Phase + 영문 코드)
// Phase 21.1: 폴링 재시도 메커니즘

// ✅ 통일
// Retry mechanism with exponential backoff (50ms, 100ms, 150ms)
```

1. **기능 설명 강화**: 코드 의도 명확화

- 왜 이 로직이 필요한가?
- 언제 실패할 수 있는가?
- 어떤 제약사항이 있는가?

### 결과

| 파일                      | 전    | 후    | 변화 | 상태    |
| ------------------------- | ----- | ----- | ---- | ------- |
| useGalleryFocusTracker.ts | 688줄 | 680줄 | -8줄 | ✅ 완료 |
| useGalleryItemScroll.ts   | 442줄 | 438줄 | -4줄 | ✅ 완료 |
| useGalleryScroll.ts       | 259줄 | 259줄 | -    | ✅ 양호 |

**검증**:

- ✅ `npm run typecheck`: 0 errors
- ✅ `npm run lint:fix`: 0 warnings
- ✅ `npm run test:smoke`: 9/9 passing

### 교훈

1. **정기적 정리**: Phase 주석은 개발 임시 마크로, 최종 배포 전 정리 필수
2. **주석 표준화**: 팀 규모 확대 시 일관된 주석 정책이 중요
3. **Git History**: 상세 개발 기록은 커밋 메시지에 남겨 코드는 간결 유지

---

## 🎯 성능 & 품질 목표

### 번들 크기

- **Dev**: ~730 KB (sourcemap 포함)
- **Prod**: ~320 KB (예산: 325 KB)
- **Gzip**: ~88 KB

### 접근성

- **focus-visible**: 모든 인터랙션 요소
- **high contrast**: 디자인 토큰으로 지원
- **reduced motion**: 애니메이션 최소화

### 테스트

- **커버리지**: 주요 경로 >80%
- **타임아웃**: 테스트 20s, 훅 25s
- **격리**: 각 테스트는 독립 실행

---

**💻 일관된 코드 스타일은 개발 생산성을 높입니다.**
