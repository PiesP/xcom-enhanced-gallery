# Playwright E2E 테스트 가이드

**Last Updated**: 2025-11-07 | **Phase**: 415

---

## 📋 목차

1. [개요](#개요)
2. [설정 및 구성](#설정-및-구성)
3. [테스트 실행](#테스트-실행)
4. [Harness 패턴](#harness-패턴)
5. [테스트 작성 가이드](#테스트-작성-가이드)
6. [디버깅 및 성능](#디버깅-및-성능)
7. [트러블슈팅](#트러블슈팅)

---

## 개요

### 목적

X.com Enhanced Gallery의 **E2E(End-to-End) 테스트**는:

- 🎯 전체 기능 흐름 검증 (초기화 → 렌더링 → 사용자 상호작용)
- 🖥️ 실제 Chromium 브라우저에서 실행
- ⚡ Trophy 테스트 체계의 최상층 (적지만 중요한 테스트)
- 🔍 통합 문제 감지 (JSDOM/Unit 테스트로 놓친 부분)

### 테스트 전략 (Trophy)

```
              🔝 E2E (적음, 느림, 중요)
             ┌─────────────────────┐
             │  Playwright (3s)    │ ← 여기
             │  21 tests           │
             └────────┬────────────┘
                      │
             ┌────────▼────────────┐
             │  Browser Tests      │ ← Vitest + Chromium
             │  (600ms)            │
             │  ~80 tests          │
             └────────┬────────────┘
                      │
             ┌────────▼────────────┐
             │  Unit Tests         │ ← JSDOM (가장 빠름)
             │  (100ms/file)       │
             │  2,700+ tests       │
             └────────┬────────────┘
                      │
             ┌────────▼────────────┐
             │  Static Analysis    │ ← TypeScript, ESLint
             │  (10s)              │
             └─────────────────────┘
```

### 주요 특징

| 항목            | 설명                                   |
| --------------- | -------------------------------------- | ------------------------------- |
| **Framework**   | Playwright 1.56.1                      |
| **Browser**     | Chromium (기본), Firefox/WebKit (선택) |
| **Headless**    | CI: Yes                                | Local: Yes (--debug로 비활성화) |
| **Parallelism** | 10 workers (local) / 4 workers (CI)    |
| **Timeout**     | 60초/테스트, 5초/어서션                |
| **Retries**     | 0 (local) / 2 (CI)                     |
| **Artifacts**   | Screenshots, videos, traces            |

---

## 설정 및 구성

### 파일 구조

```
playwright/
├── playwright.config.ts          # 메인 설정 (환경 변수 포함)
├── global-setup.ts               # 빌드 및 harness 주입
├── harness/
│   ├── index.ts                  # 테스트 컴포넌트 (IIFE 번들링)
│   ├── types/                    # 하네스 타입 정의
│   └── utils/                    # 헬퍼 함수
├── smoke/                        # 기본 테스트 (20개)
│   ├── *.spec.ts                 # 개별 테스트 파일
│   └── utils.ts                  # ensureHarness()
└── accessibility/                # A11y 테스트 (axe-core)
    └── *.spec.ts
```

### 환경 변수

```bash
# 테스트 디렉토리 선택
PLAYWRIGHT_TEST_DIR=smoke              # 기본 (빠른 검증)
PLAYWRIGHT_TEST_DIR=accessibility      # A11y 테스트

# 브라우저 선택
PLAYWRIGHT_BROWSERS=chromium           # 기본 (CI에서 사용)
PLAYWRIGHT_BROWSERS=firefox            # Firefox만
PLAYWRIGHT_BROWSERS=webkit             # Safari 호환성
PLAYWRIGHT_BROWSERS=all                # 모든 브라우저 (로컬용)

# 빌드 로깅
VERBOSE=true                           # global-setup 상세 로그
CI=true                                # CI 환경 감지

# 자동 설정 (global-setup에서 설정)
XEG_E2E_HARNESS_PATH                   # 빌드된 harness.js 경로
```

---

## 테스트 실행

### 기본 명령어

```bash
# Smoke 테스트 (기본, ~30초)
npm run e2e:smoke

# 접근성 테스트
npm run e2e:a11y

# 모든 E2E 테스트
npm run e2e:all

# 빌드 + E2E (CI/CD)
npm run build
```

### 고급 옵션

```bash
# 다중 브라우저 테스트
PLAYWRIGHT_BROWSERS=all npm run e2e:smoke

# Firefox만 테스트
PLAYWRIGHT_BROWSERS=firefox npm run e2e:smoke

# 특정 테스트만 실행
npm run e2e:smoke -- --grep "Gallery.*open"

# HTML 리포트 생성
npm run e2e:smoke -- --reporter=html

# 디버그 모드 (headed 브라우저)
npm run e2e:smoke -- --debug

# 추적 보기 (실패 원인 분석)
npm show-trace ./test-results/
```

### 성능 프로파일

| 환경 | 워커 | 재시도 | 예상 시간 | 용도        |
| ---- | ---- | ------ | --------- | ----------- |
| 로컬 | 10   | 0      | 30-40초   | 개발 반복   |
| CI   | 4    | 2      | 45-60초   | 모든 브랜치 |

---

## Harness 패턴

### 개념 설명

**문제**: Playwright는 실제 DOM에서만 실행 가능하지만, Solid.js는 Node.js에서도
빌드 가능

**솔루션**: Solid.js를 IIFE 번들로 빌드하여 브라우저에 주입

```
┌────────────────────────────────────────────┐
│ playwright/harness/index.ts                │ → esbuild (IIFE)
│ (Solid.js 컴포넌트, 테스트 API)           │
└────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────┐
│ playwright/.cache/harness.js               │ → about:blank에 주입
│ (번들 크기: ~500KB, 5초 내로 실행)         │
└────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────┐
│ window.__XEG_HARNESS__                      │
│ {                                          │
│   setupGalleryApp(): Promise<Result>       │
│   mountToolbar(props?): Promise<Result>    │
│   ... (더 많은 API)                        │
│ }                                          │
└────────────────────────────────────────────┘
```

### 실행 흐름

```typescript
// 1️⃣ 테스트 파일: test.beforeEach
test.beforeEach(async ({ page }) => {
  await page.goto('about:blank');
  await ensureHarness(page); // ← 하네스 로드
});

// 2️⃣ ensureHarness 함수 (playwright/smoke/utils.ts)
async function ensureHarness(page: Page) {
  const harnessPath = process.env.XEG_E2E_HARNESS_PATH; // ← global-setup에서 설정
  const isLoaded = await page.evaluate(() => {
    return typeof window.__XEG_HARNESS__ !== 'undefined';
  });

  if (!isLoaded) {
    await page.addScriptTag({ path: harnessPath }); // ← 주입
    await page.waitForFunction(
      () => typeof window.__XEG_HARNESS__ !== 'undefined'
    );
  }
}

// 3️⃣ 테스트 본문: 하네스 API 사용
test('setup gallery', async ({ page }) => {
  const result = await page.evaluate(() => {
    return window.__XEG_HARNESS__.setupGalleryApp();
  });
  expect(result.initialized).toBe(true);
});
```

### Harness API

#### 갤러리 초기화

```typescript
// 갤러리 앱 설정
const result = await harness.setupGalleryApp();
// 반환: { initialized: boolean; eventHandlersRegistered: boolean }

// 정리
await harness.setupGalleryApp.dispose();
```

#### UI 컴포넌트 마운트

```typescript
// 툴바 마운트
const result = await harness.mountToolbar({ currentIndex: 0 });
// 반환: { mounted: boolean; mediaCount: number }

// 정리
await harness.disposeToolbar();

// ⚠️ 신호 업데이트 불가 - 리마운트 사용
await harness.disposeToolbar();
await harness.mountToolbar({ currentIndex: 1 }); // ← 새로 생성
```

#### 이벤트 시뮬레이션

```typescript
// 키보드 이벤트 시뮬레이션
const result = await harness.simulateKeyboard({
  key: 'ArrowRight',
  ctrlKey: false,
  shiftKey: false,
});
// 반환: { eventFired: boolean; handled: boolean }

// 갤러리 이벤트 평가
const result = await harness.evaluateGalleryEvents({
  spacebarClicks: 2,
  arrowKeyPresses: 5,
});
// 반환: GalleryEventsResult
```

#### 성능 측정

```typescript
// 성능 메트릭
const metrics = await harness.getPerformanceMetrics();
// 반환: { paintTime: number; renderTime: number; memoryUsage: number }
```

---

## 테스트 작성 가이드

### 기본 구조

```typescript
/**
 * @file Gallery E2E Tests
 * @description 갤러리 초기화, 이벤트 정책, 열기/닫기 플로우 검증
 *
 * **테스트 범위**:
 * - 서비스 초기화 및 이벤트 핸들러 등록
 * - PC 전용 이벤트 정책 (touch/pointer 금지)
 * - 갤러리 열기/닫기 플로우
 *
 * **참조**:
 * - docs/ARCHITECTURE.md (3계층 구조)
 * - docs/CODING_GUIDELINES.md (코드 규칙)
 */

import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

test.describe('Gallery Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) return;
      try {
        await harness.disposeGalleryApp();
      } catch {
        /* cleanup error, ignore */
      }
    });
  });

  test('initializes gallery with event handlers', async ({ page }) => {
    const result = await page.evaluate(() =>
      window.__XEG_HARNESS__.setupGalleryApp()
    );

    expect(result.initialized).toBe(true);
    expect(result.eventHandlersRegistered).toBe(true);
  });
});
```

### 언어 정책

#### ✅ 코드 (영문)

```typescript
// ✅ 올바른 예
describe('Gallery Integration', () => {
  test('initializes gallery with event handlers', async ({ page }) => {
    const result = await page.evaluate(() =>
      window.__XEG_HARNESS__.setupGalleryApp()
    );
    expect(result.initialized).toBe(true);
  });
});
```

#### ✅ JSDoc 주석 (영문)

```typescript
/**
 * Test gallery initialization flow
 *
 * **Expectations**:
 * - setupGalleryApp() returns success status
 * - Event handlers registered automatically
 * - PC-only policy enforced (no touch events)
 */
test('initializes gallery', async ({ page }) => {
  // ...
});
```

#### ⚠️ 파일 헤더 주석 (영/한 혼용 허용)

```typescript
/**
 * @file Gallery E2E Tests
 * @description 갤러리 초기화, 이벤트 정책, 열기/닫기 플로우 검증
 *
 * **테스트 범위** (범위만 한글, 기술 내용은 영문):
 * - 서비스 초기화 및 이벤트 핸들러 등록
 * - PC 전용 이벤트 정책 (touch/pointer 금지)
 */
```

#### ❌ 인라인 한글 주석 금지

```typescript
// ❌ 잘못된 예
test('갤러리 초기화 테스트', async ({ page }) => {
  // 에러: 한글 코드 주석
  // 올바른 방식:
});
```

### 테스트 패턴

#### 1. 초기화 테스트

```typescript
test('initializes with correct configuration', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.__XEG_HARNESS__.setupGalleryApp()
  );

  expect(result.initialized).toBe(true);
  expect(result.eventHandlersRegistered).toBe(true);
});
```

#### 2. 이벤트 테스트

```typescript
test('fires events on keyboard input', async ({ page }) => {
  await page.evaluate(() => window.__XEG_HARNESS__.setupGalleryApp());

  const result = await page.evaluate(() =>
    window.__XEG_HARNESS__.simulateKeyboard({ key: 'ArrowRight' })
  );

  expect(result.eventFired).toBe(true);
  expect(result.handled).toBe(true);
});
```

#### 3. 렌더링 테스트

```typescript
test('renders toolbar with media items', async ({ page }) => {
  await page.evaluate(() => window.__XEG_HARNESS__.mountToolbar());

  const itemCount = await page.evaluate(() => {
    return document.querySelectorAll('[data-testid="toolbar-item"]').length;
  });

  expect(itemCount).toBeGreaterThan(0);
});
```

#### 4. 리마운트 패턴

```typescript
test('updates toolbar on remount', async ({ page }) => {
  // 첫 마운트
  await page.evaluate(() =>
    window.__XEG_HARNESS__.mountToolbar({ currentIndex: 0 })
  );

  const firstText = await page.innerText('[data-testid="current-index"]');
  expect(firstText).toContain('0');

  // 리마운트 (신호 업데이트 우회)
  await page.evaluate(() => window.__XEG_HARNESS__.disposeToolbar());
  await page.evaluate(() =>
    window.__XEG_HARNESS__.mountToolbar({ currentIndex: 5 })
  );

  const secondText = await page.innerText('[data-testid="current-index"]');
  expect(secondText).toContain('5');
});
```

---

## 디버깅 및 성능

### 디버깅 전략

#### 1. 텍스트 보고서 보기

```bash
npm run e2e:smoke
# 실시간 로그 출력 (테스트 상태 확인)
```

#### 2. HTML 리포트 생성

```bash
npm run e2e:smoke -- --reporter=html
# ./playwright-report/index.html 생성
# 실패 테스트의 스크린샷/비디오 확인
```

#### 3. 헤드 모드 (비주얼 디버깅)

```bash
npm run e2e:smoke -- --debug
# Playwright Inspector 실행
# 실시간 DOM 확인, 스텝별 실행
```

#### 4. 트레이스 보기

```bash
# 자동 저장 (on-first-retry 설정)
npm show-trace ./test-results/trace.zip

# 또는 수동 저장
npm run e2e:smoke -- --trace on
```

#### 5. 콘솔 로그 캡처

```typescript
test('logs console messages', async ({ page }) => {
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));

  await ensureHarness(page);
  // 하네스 로드 중 console 출력 확인
});
```

### 성능 최적화

#### 1. 병렬 실행 활용

```typescript
// ✅ 기본 (권장): Playwright가 자동으로 병렬화
test('test 1', async ({ page }) => {
  /* ... */
});
test('test 2', async ({ page }) => {
  /* ... */
});

// ❌ 금지: test.only() (CI에서 forbidOnly 에러)
test.only('test', async ({ page }) => {
  /* ... */
});
```

#### 2. 공유 상태 최소화

```typescript
// ✅ 각 테스트 독립 실행
test.beforeEach(async ({ page }) => {
  await ensureHarness(page);
});

// ❌ 공유 하네스 (다른 테스트 간섭)
const harness = null; // 전역 변수 사용 금지
```

#### 3. 타임아웃 최적화

```typescript
// ✅ 적절한 대기
await page.waitForFunction(
  () => document.querySelector('[data-ready="true"]'),
  { timeout: 5000 }
);

// ❌ 과도한 대기
await page.waitForTimeout(10000); // 불필요한 대기
```

---

## 트러블슈팅

### 일반적인 문제

| 문제                          | 원인                | 해결책                                |
| ----------------------------- | ------------------- | ------------------------------------- |
| `XEG_E2E_HARNESS_PATH` 미설정 | global-setup 미실행 | `npm run build` 재실행                |
| Harness 로드 타임아웃         | 빌드 실패           | `VERBOSE=true npm run e2e:smoke` 확인 |
| 플레이키한 테스트             | 타이밍 이슈         | timeout 증가, waitFor 개선            |
| 브라우저 충돌                 | 메모리 부족         | 워커 수 감소: `--workers=2`           |

### 에러 메시지

#### Error: Playwright global setup failed

```
원인: playwright/global-setup.ts 빌드 실패
해결:
  1. VERBOSE=true npm run e2e:smoke
  2. 빌드 에러 메시지 확인
  3. harness/index.ts 문법 검사
```

#### Error: timeout of 60000ms exceeded

```
원인: 테스트 실행 시간 초과
해결:
  1. 불필요한 waitForTimeout 제거
  2. timeout 값 증가: timeout: 90_000
  3. 병렬 워커 감소
```

#### Assertion failed: expected true to be false

```
원인: 테스트 로직 오류
해결:
  1. --debug 모드에서 스텝별 재실행
  2. console.log로 값 확인
  3. HTML 리포트에서 스크린샷 확인
```

### 성능 이슈

#### 테스트 실행 느림

```bash
# 현재 성능 확인
time npm run e2e:smoke

# 최적화 옵션
PLAYWRIGHT_BROWSERS=chromium npm run e2e:smoke  # 단일 브라우저
npm run e2e:smoke -- --workers=4                # 워커 감소
npm run e2e:smoke -- --grep "fast"              # 특정 테스트만
```

#### 하네스 빌드 느림

```bash
# 빌드 프로파일
time npm run e2e:smoke

# 원인 파악
VERBOSE=true npm run e2e:smoke

# 개선: harness/index.ts 크기 검사 (< 500KB)
ls -lh playwright/.cache/harness.js
```

---

## 참조

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 프로젝트 구조
- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)**: 코드 규칙
- **[AGENTS.md](../AGENTS.md)**: 개발자 가이드
- **Playwright 공식 문서**: https://playwright.dev/docs
- **axe-core 접근성**: https://github.com/dequelabs/axe-core

---

## 요약 체크리스트

테스트 작성 시 확인 사항:

- [ ] 파일 헤더에 `@file`, `@description` JSDoc 작성
- [ ] 영문 코드, 테스트 이름 사용
- [ ] `test.beforeEach`에서 `ensureHarness()` 호출
- [ ] `test.afterEach`에서 cleanup 실행
- [ ] 리마운트 패턴 사용 (신호 업데이트)
- [ ] 3개 이상의 expect() 포함 (의미 있는 어서션)
- [ ] timeout 적절히 설정 (과도하게 크지 않기)
- [ ] HTML 리포트로 스크린샷 확인
- [ ] `npm run check` 통과 (전체 검증)
