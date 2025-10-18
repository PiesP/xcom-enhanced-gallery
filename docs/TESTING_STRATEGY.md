# 테스트 전략 가이드 (Testing Strategy)

> xcom-enhanced-gallery 프로젝트의 테스트 책임 분리 및 실행 전략

**최종 업데이트**: 2025-10-18

---

## 📊 테스트 피라미드 (Testing Trophy)

Kent C. Dodds의 Testing Trophy 모델을 기반으로, 프로젝트는 다음과 같은 테스트
분포를 목표로 합니다:

```
          /\
         /A11y\        ← 최소: 접근성 자동 검증
        /------\
       /  E2E  \       ← 적음: 핵심 사용자 시나리오
      /----------\
     / Browser    \    ← 소량: Solid.js 반응성, 실제 API
    /--------------\
   /  Integration  \   ← 중간: 서비스 간 상호작용
  /------------------\
 /    Unit Tests     \ ← 많음: 순수 로직, 유틸리티
/----------------------\
/  Static Analysis     \  ← 가장 많음: TypeScript, ESLint, stylelint
```

**원칙**: 낮은 계층에서 빠르게 많이 테스트하고, 높은 계층에서 느리지만 신뢰도
높은 테스트를 선별적으로 실행합니다.

**테스트 계층 요약**:

1. **Static Analysis** (수초): 타입, 린트, 코딩 규칙
2. **Unit Tests** (1-2분): JSDOM, 순수 함수, 단일 컴포넌트
3. **Browser Tests** (2-5분): 실제 브라우저, Solid.js 반응성
4. **Integration Tests** (2-5분): 다중 서비스 협업
5. **E2E Tests** (5-15분): 전체 사용자 시나리오
6. **Accessibility Tests** (3-8분): WCAG 준수, axe-core 스캔

---

## 🎯 테스트 타입별 책임 분리

### 1. Static Analysis (최하층 - 가장 빠름)

**도구**: TypeScript strict mode, ESLint, stylelint, CodeQL

**책임**:

- 타입 안정성 보장
- 코딩 규칙 위반 감지 (벤더 직접 import, 터치 이벤트, 하드코딩 색상/크기)
- 보안 취약점 탐지

**실행 방법**:

```pwsh
npm run typecheck        # tsgo로 빠른 타입 체크
npm run lint             # ESLint 검증
npm run format           # Prettier 포맷팅
npm run validate         # 위 3개 일괄 실행
```

**장점**:

- 즉각적인 피드백 (수 초 내)
- 비즈니스 로직과 무관한 기초적 오류 방지
- CI/pre-commit 훅에서 자동화 가능

**단점**:

- 런타임 동작 검증 불가능
- 비즈니스 로직 정확성 보장 불가능

---

### 2. Unit Tests (JSDOM - 빠름)

**환경**: Vitest + JSDOM, `test/unit/**`

**책임**:

- **순수 함수/유틸리티 테스트** (`@shared/utils/**`)
  - `signalSelector`, `media-url-builder`, `zip-helpers` 등
- **서비스 로직 단위 테스트** (`@shared/services/**`)
  - `MediaService`, `ThemeService`, `BulkDownloadService` (API 모킹)
- **컴포넌트 단위 렌더링** (props → 렌더링 결과)
  - `@solidjs/testing-library`로 격리된 컴포넌트 테스트
  - **단, Solid.js 반응성은 JSDOM에서 제한적** (참고:
    `SOLID_REACTIVITY_LESSONS.md`)

**실행 방법**:

```pwsh
npm run test:unit        # 단위 테스트만 실행 (vitest --project unit)
npm run test:fast        # 빠른 단위 + 스모크 테스트
npm test                 # 전체 테스트 (단위 + 통합 + 성능 + 스타일)
```

**장점**:

- 빠른 실행 속도 (수백 개 테스트도 1-2분 내)
- 문제 발생 시 정확한 원인 파악 가능 (격리된 범위)
- 리팩토링 시 신속한 피드백

**단점**:

- JSDOM은 실제 브라우저가 아님 → CSS 레이아웃, IntersectionObserver,
  ResizeObserver 등 미지원
- Solid.js fine-grained reactivity는 JSDOM에서 불안정 (신호 변경 → DOM 업데이트
  누락 가능)
- 외부 API/네트워크 통합은 모킹 필수

**JSDOM 제약사항 (상세)**:

- ❌ **Solid.js 반응성**: Signal getter를 컴포넌트 외부에서 생성 시 reactive
  boundary 수립 실패
- ❌ **레이아웃 계산**: `getBoundingClientRect()`, `offsetWidth/Height` 등 항상
  0 반환
- ❌ **브라우저 API**: IntersectionObserver, ResizeObserver, PointerEvent (부분
  모킹 필요)
- ✅ **적합한 테스트**: 순수 함수, 데이터 변환, 조건부 렌더링, 이벤트 핸들러
  호출 검증

**JSDOM 우회 패턴**:

```typescript
// ❌ JSDOM에서 실패하는 패턴: 전역 signal + DOM 반응성
const [globalSignal, setGlobalSignal] = createSignal(false);
// ... 컴포넌트에서 globalSignal() 사용 → DOM 업데이트 안 됨

// ✅ JSDOM에서 성공하는 패턴: 컴포넌트 내부 signal
const MyComponent = () => {
  const [localSignal, setLocalSignal] = createSignal(false);
  return <div>{localSignal() ? 'ON' : 'OFF'}</div>;
};
```

---

### 3. Browser Tests (@vitest/browser - 중간 속도)

**환경**: Vitest Browser Mode + Playwright Chromium, `test/browser/**`

**테스트 수**: **44 tests** (Phase 1 완료: 6 → 44, 7.3x 증가)

**책임**:

- **Solid.js 반응성 완전 검증**
  - JSDOM 제약 극복: fine-grained reactivity 완전 작동
  - Signal/Store 변경 → DOM 업데이트 즉시 반영
  - **Store Reactivity** (5 tests): 중첩 속성, 배열 변경, batching, fine-grained
    추적
- **실제 브라우저 API 테스트**
  - CSS 레이아웃 계산 (`getBoundingClientRect()`, `offsetWidth/Height`)
  - IntersectionObserver, ResizeObserver, requestAnimationFrame
  - **Layout Calculation** (8 tests): 크기, 경계 사각형, 스크롤, 뷰포트, 이미지
    종횡비
- **시각적 동작 검증**
  - 포커스 인디케이터, 애니메이션, 트랜지션
  - 스크롤 동작, 뷰포트 상호작용
  - **Focus Management** (8 tests): Tab 내비게이션, 모달 트랩, 반응형 추적, 복원
  - **Animation & Transitions** (9 tests): CSS 트랜지션, animationend,
    requestAnimationFrame, 트랜스폼
- **이벤트 시스템 검증**
  - **Event Handling** (8 tests): 클릭, 키보드+수정자, 위임, 커스텀 이벤트, 휠,
    마우스 enter/leave

**실행 방법**:

```pwsh
npm run test:browser     # 브라우저 모드 테스트 실행 (44 tests)
npm run test:browser:ui  # UI 모드로 실행 (디버깅)
```

**장점**:

- Solid.js 반응성 완전 작동 (JSDOM 제약 없음)
- 실제 브라우저 환경에서 검증 (CSS, 레이아웃, API)
- E2E보다 빠른 피드백 (컴포넌트 단위 테스트)

**단점**:

- JSDOM보다 느림 (브라우저 시작 오버헤드)
- 리소스 사용량 증가 (Chromium 프로세스)
- CI 환경에서 추가 설정 필요 (headless 모드)

**사용 가이드**:

```typescript
// JSDOM에서 실패하는 반응성 테스트를 Browser 모드로 이동
import { describe, it, expect } from 'vitest';
import { getSolid } from '@shared/external/vendors';

const { createSignal, createEffect } = getSolid();

describe('Solid Reactivity in Browser', () => {
  it('should update DOM when signal changes', async () => {
    const [count, setCount] = createSignal(0);
    const div = document.createElement('div');

    createEffect(() => {
      div.textContent = String(count());
    });

    expect(div.textContent).toBe('0');
    setCount(1);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(div.textContent).toBe('1'); // ✅ Browser 모드에서 성공
  });
});
```

---

### 4. Integration Tests (JSDOM + 모킹 - 중간 속도)

**환경**: Vitest + JSDOM, `test/integration/**`

**책임**:

- **다중 서비스 협업 검증**
  - `MediaService` + `BulkDownloadService` + `ZipCreator` 통합
  - `EventManager` + `GallerySignals` + `FocusTracker` 상호작용
- **상태 관리 통합**
  - `gallerySignals` + `settingsSignals` 동기화
  - 전역 상태 변경 → 다중 컴포넌트 반응 검증
- **API 모킹 기반 데이터 흐름**
  - `getUserscript().xhr()` 모킹 → `MediaService.extract()` → UI 업데이트

**실행 방법**:

```pwsh
npm run test:unit        # integration 테스트도 unit 프로젝트에 포함됨
npm test                 # 전체 실행
```

**장점**:

- 실제 서비스 간 경계 검증 (3계층 구조: Features → Shared → External)
- 단위 테스트보다 높은 신뢰도 (실제 통합 시나리오)
- E2E보다 빠른 실행 속도 (모킹으로 외부 의존성 제거)

**단점**:

- 복잡한 설정 (여러 서비스 초기화 필요)
- JSDOM 제약사항은 여전히 적용됨
- 모킹이 과도하면 실제 동작과 괴리 가능

**Integration 테스트 패턴**:

```typescript
// 예시: MediaService + BulkDownload 통합
describe('Media Download Integration', () => {
  it('should extract media and create zip', async () => {
    // Given: 트윗 HTML + 모킹된 GM_xmlhttpRequest
    const mockXhr = vi.fn().mockResolvedValue({ responseText: tweetHtml });
    vi.mocked(getUserscript().xhr).mockImplementation(mockXhr);

    // When: MediaService 추출 → BulkDownloadService 압축
    const media = await MediaService.extract(tweetUrl);
    const zipBlob = await BulkDownloadService.createZip(media);

    // Then: ZIP 파일 생성 검증
    expect(zipBlob.size).toBeGreaterThan(0);
    expect(mockXhr).toHaveBeenCalledTimes(4); // 이미지 4개
  });
});
```

---

### 4. E2E Tests (Playwright - 느림, 신뢰도 최고)

**환경**: Playwright + Chromium (실제 브라우저), `playwright/smoke/**`

**책임**:

- **핵심 사용자 시나리오 검증**
  - 갤러리 열기 → 키보드 네비게이션(ArrowLeft/Right) → 닫기
  - 설정 패널 열기 → 옵션 변경 → 닫기
  - 다운로드 버튼 클릭 → 파일 다운로드 트리거
- **Solid.js 반응성 실제 동작**
  - Signal 변경 → DOM 속성 업데이트 (`data-focused`, `aria-expanded` 등)
  - ErrorBoundary 예외 처리 → Toast 생성
- **브라우저 전용 API**
  - IntersectionObserver, ResizeObserver, focus() 실제 동작
  - CSS 레이아웃 계산, 애니메이션 검증

**실행 방법**:

```pwsh
npm run e2e:smoke        # 스모크 테스트 (약 10-15개, 5-10분)
npm run e2e:a11y         # 접근성 테스트 (axe-core 자동 스캔)
npx playwright test --headed   # 헤드풀 모드 (브라우저 UI 표시)
npx playwright test --debug    # 디버그 모드 (단계별 실행)
```

**장점**:

- 실제 브라우저에서 실행 → 프로덕션 환경과 동일한 신뢰도
- JSDOM 제약사항 없음 (모든 브라우저 API 사용 가능)
- 사용자 관점에서 전체 흐름 검증
- **접근성 자동 검증**: @axe-core/playwright로 WCAG 준수 확인

**단점**:

- 느린 실행 속도 (테스트당 3-10초, 스위트 전체 5-15분)
- 실패 시 디버깅 어려움 (여러 계층에서 문제 발생 가능)
- 인프라 복잡도 (브라우저 설치, 하네스 번들링)

**E2E 테스트 작성 원칙**:

1. **최소한의 시나리오**: 핵심 사용자 여정만 (Login → Action → Logout)
2. **Harness Pattern 활용**: `playwright/harness/` API로 컴포넌트
   마운트/언마운트
3. **Remount 대신 이벤트**: Solid.js 반응성 제약으로 props 업데이트 대신
   dispose + mount 패턴 사용 (자세한 내용은 `AGENTS.md` E2E 가이드 참고)

**E2E Harness API 예시**:

```typescript
// playwright/smoke/toolbar-settings.spec.ts
test('should toggle settings panel', async ({ page }) => {
  const harness = await page.evaluate(async () => {
    const { setupToolbarHarness } = window.__XEG_HARNESS__;
    return setupToolbarHarness({ currentIndex: 0, totalCount: 10 });
  });

  // 설정 버튼 클릭 → 패널 열림
  await page.click('[data-testid="settings-button"]');
  await expect(page.locator('[data-testid="settings-panel"]')).toBeVisible();

  // 다시 클릭 → 패널 닫힘
  await page.click('[data-testid="settings-button"]');
  await expect(page.locator('[data-testid="settings-panel"]')).toBeHidden();
});
```

---

### 5. Accessibility Tests (Playwright + axe-core - E2E의 하위 집합)

**환경**: Playwright + @axe-core/playwright, `playwright/accessibility/**`

**테스트 수**: **14 tests** (Phase 1 완료: 6 → 14, 2.3x 증가)

**책임**:

- **WCAG 2.1 Level AA 준수 자동 검증**
  - 색상 대비 (Contrast)
  - 키보드 탐색 가능성 (Keyboard Navigation)
  - ARIA 레이블 적절성 (ARIA Labels)
  - 제목 계층 구조 (Heading Hierarchy)
  - 포커스 인디케이터 (Focus Indicators)
- **스크린 리더 지원**
  - `aria-live` 영역 존재 확인 (**Toast**: 4 tests)
  - 장식용 이미지 `aria-hidden` 처리
  - 버튼/링크의 접근 가능한 이름 (**KeyboardHelpOverlay**: 4 tests)
  - 다이얼로그 역할 및 속성 (`role="dialog"`, `aria-modal="true"`)
- **자동화된 규칙 검증**
  - axe-core의 50+ 규칙 자동 실행
  - 위반사항 발견 시 상세 리포트 (**Gallery**: 4 tests, **Toolbar**: 6 tests)

**실행 방법**:

```pwsh
npm run e2e:a11y         # 접근성 테스트 실행 (14 tests)
npx playwright test playwright/accessibility --headed  # UI 모드로 실행
```

**장점**:

- **자동화된 접근성 검증**: 수동 점검 불필요
- **WCAG 준수 보장**: 법적 요구사항 충족
- **CI 통합 가능**: PR마다 접근성 회귀 방지
- **상세한 리포트**: 위반사항의 위치, 영향도, 수정 방법 제공

**단점**:

- 자동 검증의 한계: axe-core는 약 57%의 접근성 이슈만 감지
- 수동 테스트 필요: 키보드 전용 사용, 스크린 리더 실제 테스트는 별도 필요
- E2E 오버헤드: 브라우저 실행 시간 추가

**접근성 테스트 작성 예시**:

```typescript
// playwright/accessibility/gallery-a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:5173/test-harness.html');

  // Gallery 컴포넌트 마운트
  await page.evaluate(() => {
    return window.__XEG_HARNESS__?.setupGalleryApp?.({
      mediaItems: [{ url: 'https://example.com/image1.jpg', type: 'image' }],
    });
  });

  await page.waitForSelector('[role="region"]');

  // axe-core 스캔 실행 (WCAG 2.1 Level AA)
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // 위반사항이 있으면 테스트 실패
  expect(accessibilityScanResults.violations).toEqual([]);
});

test('should have proper keyboard navigation', async ({ page }) => {
  await page.goto('http://localhost:5173/test-harness.html');

  await page.evaluate(() => {
    return window.__XEG_HARNESS__?.setupGalleryApp?.({
      mediaItems: [
        { url: 'https://example.com/image1.jpg', type: 'image' },
        { url: 'https://example.com/image2.jpg', type: 'image' },
      ],
    });
  });

  const gallery = await page.locator('[role="region"]');
  await gallery.focus();

  // Tab 키로 포커스 이동
  await page.keyboard.press('Tab');

  // 포커스된 요소 확인
  const focusedElement = await page.evaluate(
    () => document.activeElement?.tagName
  );
  expect(focusedElement).toBeTruthy();

  // 키보드 접근성 검증
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

**axe-core 태그 종류**:

- `wcag2a`: WCAG 2.0 Level A
- `wcag2aa`: WCAG 2.0 Level AA
- `wcag21a`: WCAG 2.1 Level A
- `wcag21aa`: WCAG 2.1 Level AA
- `best-practice`: 모범 사례
- `cat.color`: 색상 관련 규칙
- `cat.semantics`: 의미론적 HTML 규칙
- `cat.keyboard`: 키보드 접근성 규칙

**접근성 테스트 권장 범위**:

- ✅ **모든 사용자 대면 컴포넌트**: Toolbar, Gallery, SettingsPanel, Modals
- ✅ **인터랙티브 요소**: 버튼, 링크, 폼 컨트롤
- ✅ **동적 콘텐츠**: Toast, Tooltip, Dropdown
- ⚠️ **수동 검증 필요**: 스크린 리더 실제 테스트, 고대비 모드, 확대/축소

---

## 🚀 실행 전략 (Fast Feedback Loop)

### 개발 중 (로컬)

```pwsh
# 1. 타입/린트 빠른 검증 (수 초)
npm run typecheck

# 2. 관련 단위 테스트만 워치 모드로 실행 (즉시 피드백)
npm run test:watch -- -t "MyFunction"

# 3. 전체 단위 + 통합 테스트 (1-2분)
npm run test:unit

# 4. 전체 스모크 (초고속) + fast (빠른 단위) (30초)
npm run test:smoke && npm run test:fast
```

### Pre-Push (Git Hook)

```pwsh
# Husky pre-push 훅이 자동 실행 (XEG_PREPUSH_SCOPE 환경변수로 조정 가능)
# 기본: smoke 프로젝트만 (10-20초)
git push

# 전체 스위트 실행 (로컬에서 수동으로 실행 권장, 5-10분)
$env:XEG_PREPUSH_SCOPE = 'full'
git push
```

### CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    - npm run typecheck
    - npm run lint
    - npm test # 전체 JSDOM 테스트 (Node 22: 커버리지 포함)
    - npm run e2e:smoke # E2E 스모크 테스트 (Chromium 설치)
    - npm run build # dev + prod 빌드 검증
```

**CI 최적화 전략**:

- Node 22/24 매트릭스로 호환성 검증
- 커버리지는 Node 22에서만 실행 (중복 방지)
- E2E는 Chromium만 실행 (Firefox/WebKit 제외로 시간 단축)
- 캐시: npm modules, Playwright 브라우저

---

## 📦 Vitest Projects (병렬 실행)

`vitest.config.ts`에서 projects 필드로 테스트를 분할하여, 필요한 범위만 선택
실행할 수 있습니다:

| Project         | 범위                                  | 실행 시간 | 명령어                  |
| --------------- | ------------------------------------- | --------- | ----------------------- |
| **smoke**       | 구성/토큰 가드, 초고속 스모크         | 10-20초   | `npm run test:smoke`    |
| **fast**        | 빠른 단위 테스트 (RED/벤치/성능 제외) | 30-60초   | `npm run test:fast`     |
| **unit**        | 전체 단위 테스트                      | 1-2분     | `npm run test:unit`     |
| **styles**      | 스타일/토큰/정책 전용                 | 20-40초   | `npm run test:styles`   |
| **performance** | 성능/벤치마크 전용                    | 40-80초   | `npm run test:perf`     |
| **phases**      | 단계별(phase-\*)/최종 스위트          | 1-2분     | `npm run test:phases`   |
| **refactor**    | 리팩토링 진행/가드                    | 30-60초   | `npm run test:refactor` |

**사용 예시**:

```pwsh
# 특정 프로젝트만 실행
vitest --project smoke run

# 여러 프로젝트 조합
vitest --project smoke --project fast run

# 특정 파일만 실행 (프로젝트 무시)
npx vitest run test/unit/utils/signal-selector.test.ts
```

---

## 🔍 테스트 선택 가이드 (Decision Tree)

```
┌─────────────────────────────────────────────────────────────┐
│ 무엇을 테스트하려는가?                                         │
└─────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   타입/린트?    순수 함수?   브라우저 동작?
        │           │           │
     Static     Unit(JSDOM)   E2E(Playwright)
     Analysis
        │           │           │
        │      ┌────┴────┐      │
        │      │         │      │
        │   단일 서비스  다중 서비스  전체 사용자 시나리오
        │      │         │      │
        │    Unit    Integration  E2E
        │
        └───────────────┴────────┴──────────────────────────────┐
                                                                 │
    📊 비용/시간 트레이드오프:                                    │
    Static < Unit < Integration < E2E                           │
    (수 초)  (1-2분) (2-5분)      (5-15분)                       │
                                                                 │
    💡 신뢰도:                                                    │
    Static < Unit < Integration < E2E                           │
    (타입)   (로직)  (통합)        (실제 환경)                    │
└─────────────────────────────────────────────────────────────┘
```

**예시 매핑**:

| 테스트 대상                        | 권장 타입        | 이유                                 |
| ---------------------------------- | ---------------- | ------------------------------------ |
| `signalSelector()` 함수            | Unit (JSDOM)     | 순수 함수, 브라우저 API 불필요       |
| `MediaService.extract()`           | Unit (JSDOM)     | 네트워크는 모킹, 로직만 검증         |
| `ThemeService` + `gallerySignals`  | Integration      | 다중 서비스 상호작용, 상태 동기화    |
| 키보드 네비게이션(ArrowLeft/Right) | E2E (Playwright) | focus() 실제 동작, DOM 업데이트 필수 |
| ErrorBoundary → Toast 생성         | E2E (Playwright) | Solid.js 반응성, 예외 처리 전체 흐름 |
| 디자인 토큰 하드코딩 검사          | Static (CodeQL)  | 코드 정적 분석으로 충분              |

---

## 🛠️ 추천 도구 및 라이브러리

### 현재 사용 중

- **Vitest**: 빠른 단위/통합 테스트, Vite 네이티브 통합
- **@solidjs/testing-library**: Solid.js 컴포넌트 테스트 (JSDOM)
- **Playwright**: E2E 테스트, Chromium/Firefox/WebKit 지원
- **JSDOM**: 빠른 DOM 시뮬레이션 (단위/통합 테스트)
- **@vitest/coverage-v8**: 코드 커버리지 (v8 엔진)

### 향후 도입 검토 (선택적)

- **MSW (Mock Service Worker)**: 네트워크 요청 인터셉트 (브라우저/Node 공통)
  - 현재는 `vi.mocked(getUserscript().xhr)`로 모킹 중
  - MSW 도입 시 더 현실적인 API 응답 시뮬레이션 가능
- **@testing-library/user-event**: 더 현실적인 사용자 이벤트 시뮬레이션
  - 현재는 `fireEvent.click()` 사용 중
  - user-event는 실제 사용자 동작(hover → focus → click)을 순차적으로 시뮬레이션
- **Vitest Browser Mode** (실험적): JSDOM 대신 실제 브라우저에서 단위 테스트
  실행
  - JSDOM 제약사항을 우회하면서 E2E보다 빠른 피드백
  - 현재는 안정성 문제로 Playwright E2E 사용 중

---

## 📚 참고 문서

- [AGENTS.md](../AGENTS.md): 개발 워크플로, E2E 테스트 가이드, 하네스 패턴
- [SOLID_REACTIVITY_LESSONS.md](./SOLID_REACTIVITY_LESSONS.md): Solid.js 반응성
  시스템 교훈, JSDOM 제약사항
- [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md): 활성 리팩토링 계획,
  Phase 82 E2E 마이그레이션
- [Kent C. Dodds - Testing Trophy](https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests):
  테스트 피라미드 vs 트로피
- [Vitest Documentation](https://vitest.dev/): Vitest 공식 문서, Browser Mode
  안내
- [Playwright Best Practices](https://playwright.dev/docs/best-practices):
  Playwright 모범 사례

---

## 🎓 핵심 원칙 요약

1. **빠른 피드백 우선**: 타입/린트 → 단위 → 통합 → E2E 순서로 점진적 검증
2. **적절한 도구 선택**: JSDOM 제약사항을 이해하고, 브라우저 동작 필수 시 E2E
   사용
3. **테스트 피라미드 준수**: 단위 테스트가 가장 많고, E2E는 핵심 시나리오만
4. **TDD 우선**: RED(실패 테스트) → GREEN(최소 구현) → REFACTOR(리팩토링) 순서
5. **문서화**: 테스트는 코드의 사양서 역할 (명확한 describe/it 작성)
