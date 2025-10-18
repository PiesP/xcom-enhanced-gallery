# Accessibility Tests (@axe-core/playwright)

> Playwright와 axe-core를 사용한 자동화된 접근성 검증

## 📖 개요

이 디렉터리는 **@axe-core/playwright**를 사용하여 WCAG 2.1 Level AA 준수를
자동으로 검증하는 테스트를 포함합니다.

Deque Systems의 axe-core 엔진이 50+ 접근성 규칙을 실시간으로 스캔하여 위반사항을
감지합니다.

## 🎯 검증 범위

### 자동 검증 (axe-core)

- ✅ **색상 대비** (Contrast): WCAG AA 기준 4.5:1 이상
- ✅ **키보드 탐색**: Tab/Shift+Tab으로 모든 인터랙티브 요소 접근 가능
- ✅ **ARIA 레이블**: 버튼/링크의 접근 가능한 이름 존재
- ✅ **제목 계층**: h1 → h2 → h3 순서 준수
- ✅ **폼 레이블**: input과 label의 연결
- ✅ **이미지 대체 텍스트**: 의미 있는 alt, 장식용은 aria-hidden
- ✅ **랜드마크**: region, main, navigation 등 적절한 사용

### 수동 검증 필요

- ⚠️ **스크린 리더 실제 테스트**: NVDA, JAWS, VoiceOver
- ⚠️ **고대비 모드**: Windows 고대비 테마
- ⚠️ **확대/축소**: 200% 확대 시 레이아웃 깨짐 여부
- ⚠️ **동영상 자막**: 멀티미디어 콘텐츠 접근성

## 🚀 실행 방법

```pwsh
# 접근성 테스트 실행
npm run e2e:a11y

# 특정 파일만 실행
npx playwright test playwright/accessibility/gallery-a11y.spec.ts

# 헤드풀 모드 (브라우저 UI 표시)
npx playwright test playwright/accessibility --headed

# 디버그 모드 (단계별 실행)
npx playwright test playwright/accessibility --debug
```

## 📁 파일 구조

```
playwright/accessibility/
├── gallery-a11y.spec.ts           # Gallery 컴포넌트 접근성 (4 tests)
├── toolbar-a11y.spec.ts           # Toolbar 컴포넌트 접근성 (6 tests)
├── toast-a11y.spec.ts             # Toast 컴포넌트 접근성 (4 tests, NEW)
├── keyboard-overlay-a11y.spec.ts  # KeyboardHelpOverlay 접근성 (4 tests, NEW)
└── README.md                       # 이 파일
```

### 새로 추가된 테스트 스위트 (Phase 1 완료)

#### 1. Toast Accessibility (`toast-a11y.spec.ts`)

Toast 컴포넌트의 WCAG 2.1 Level AA 준수 검증:

- ✅ 접근성 위반사항 없음 (50+ axe-core 규칙)
- ✅ **aria-live 리전**: 스크린 리더에 즉시 알림
- ✅ **접근 가능한 닫기 버튼**: 명확한 라벨과 키보드 접근성
- ✅ **색상 대비**: 텍스트와 배경의 4.5:1 이상 대비

**왜 중요한가**: Toast는 사용자에게 중요한 메시지를 전달하는 컴포넌트로, 스크린
리더 사용자도 즉시 알림을 받아야 합니다.

#### 2. KeyboardHelpOverlay Accessibility (`keyboard-overlay-a11y.spec.ts`)

키보드 도움말 오버레이의 WCAG 2.1 Level AA 준수 검증:

- ✅ 접근성 위반사항 없음
- ✅ **다이얼로그 역할 및 속성**: `role="dialog"`, `aria-modal="true"`,
  `aria-labelledby`
- ✅ **접근 가능한 테이블 구조**: 키보드 단축키를 명확하게 전달
- ✅ **키보드 내비게이션**: Escape로 닫기, Tab으로 포커스 이동

**왜 중요한가**: 키보드 사용자를 위한 도움말 모달이므로, 키보드와 스크린 리더로
완벽히 접근 가능해야 합니다.

## ✍️ 테스트 작성 가이드

### 기본 패턴

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Component Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/test-harness.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have no accessibility violations', async ({ page }) => {
    // 컴포넌트 마운트
    await page.evaluate(() => {
      return window.__XEG_HARNESS__?.mountComponent?.();
    });

    await page.waitForSelector('[role="region"]');

    // axe-core 스캔 실행
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // 위반사항 발견 시 상세 정보 출력
    if (accessibilityScanResults.violations.length > 0) {
      console.error('Accessibility violations found:');
      accessibilityScanResults.violations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description}`);
        console.error(`  Impact: ${violation.impact}`);
        console.error(
          `  Nodes:`,
          violation.nodes.map(n => n.html)
        );
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### axe-core 태그

```typescript
// WCAG 준수 레벨
.withTags(['wcag2a', 'wcag2aa'])          // WCAG 2.0 Level A + AA
.withTags(['wcag21a', 'wcag21aa'])        // WCAG 2.1 Level A + AA

// 카테고리별
.withTags(['cat.color'])                  // 색상 관련 규칙
.withTags(['cat.keyboard'])               // 키보드 접근성
.withTags(['cat.semantics'])              // 의미론적 HTML
.withTags(['cat.name-role-value'])        // ARIA 레이블

// 모범 사례
.withTags(['best-practice'])              // 권장사항
```

### 특정 요소만 검사

```typescript
// 포함: 특정 요소만 검사
const results = await new AxeBuilder({ page })
  .include('[role="toolbar"]')
  .analyze();

// 제외: 특정 요소 건너뛰기
const results = await new AxeBuilder({ page })
  .exclude('[data-testid="external-widget"]')
  .analyze();
```

## 📊 접근성 규칙 예시

### 색상 대비 (color-contrast)

```typescript
test('should have sufficient color contrast', async ({ page }) => {
  await page.goto('http://localhost:5173/test-harness.html');

  await page.evaluate(() => {
    return window.__XEG_HARNESS__?.mountToolbar?.();
  });

  const results = await new AxeBuilder({ page })
    .withTags(['cat.color'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### 키보드 탐색 (keyboard-navigation)

```typescript
test('should support keyboard navigation', async ({ page }) => {
  await page.goto('http://localhost:5173/test-harness.html');

  await page.evaluate(() => {
    return window.__XEG_HARNESS__?.setupGalleryApp?.();
  });

  const gallery = await page.locator('[role="region"]');
  await gallery.focus();

  // Tab 키로 포커스 이동
  await page.keyboard.press('Tab');

  const focusedElement = await page.evaluate(
    () => document.activeElement?.tagName
  );
  expect(focusedElement).toBeTruthy();
});
```

### ARIA 레이블 (aria-labels)

```typescript
test('should have proper ARIA labels', async ({ page }) => {
  await page.goto('http://localhost:5173/test-harness.html');

  await page.evaluate(() => {
    return window.__XEG_HARNESS__?.mountToolbar?.();
  });

  const toolbar = await page.locator('[role="toolbar"]');

  // aria-label 또는 aria-labelledby 확인
  const hasLabel =
    (await toolbar.getAttribute('aria-label')) !== null ||
    (await toolbar.getAttribute('aria-labelledby')) !== null;

  expect(hasLabel).toBe(true);

  // 버튼들의 접근 가능한 이름 확인
  const buttons = await toolbar.locator('button').all();
  for (const button of buttons) {
    const ariaLabel = await button.getAttribute('aria-label');
    const textContent = await button.textContent();
    expect(ariaLabel || textContent?.trim()).toBeTruthy();
  }
});
```

## 🎯 테스트 대상 우선순위

### 필수 (Critical)

- ✅ Toolbar (버튼, 네비게이션)
- ✅ Gallery (이미지 표시, 키보드 네비게이션)
- ✅ SettingsPanel (폼 컨트롤, 레이블)
- ✅ Modals (포커스 트랩, 닫기 버튼)

### 권장 (High)

- ✅ Toast (aria-live 영역)
- ✅ Tooltip (role="tooltip", aria-describedby)
- ✅ Dropdown (aria-expanded, aria-haspopup)

### 선택 (Medium)

- ⚠️ 장식용 요소 (aria-hidden="true" 확인)
- ⚠️ 동적 콘텐츠 (aria-live 업데이트)

## 🔄 CI 통합

GitHub Actions에서 자동 실행:

```yaml
# .github/workflows/ci.yml
- name: Run accessibility tests
  run: npm run e2e:a11y

- name: Upload accessibility report
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: accessibility-report
    path: playwright-report/
```

## 📈 접근성 점수 목표

- **자동 검증**: 100% (위반사항 0개)
- **수동 검증**: 분기별 스크린 리더 테스트
- **회귀 방지**: PR마다 자동 스캔

## 🔗 관련 문서

- [TESTING_STRATEGY.md](../../docs/TESTING_STRATEGY.md) - 전체 테스트 전략
- [axe-core Documentation](https://www.deque.com/axe/core-documentation/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**마지막 업데이트**: 2025-10-18
