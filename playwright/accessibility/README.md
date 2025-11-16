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

```bash
# 접근성 테스트 실행
npm run e2e:a11y

# 특정 파일만 실행
npx playwright test playwright/accessibility/gallery-a11y.spec.ts

# 헤드풀 모드 (UI 표시)
npx playwright test --headed playwright/accessibility/

# 디버그 모드
npx playwright test --debug
```

## 📁 파일 구조

```
playwright/accessibility/
├── gallery-a11y.spec.ts           # Gallery 컴포넌트 (3 tests)
├── toolbar-a11y.spec.ts           # Toolbar 컴포넌트 (3 tests)
├── keyboard-overlay-a11y.spec.ts  # KeyboardHelpOverlay (4 tests)
├── dialog-focus-a11y.spec.ts      # Dialog/Focus 통합 (19 tests)
└── README.md                       # 이 파일
```

**총 29개 테스트** - 모두 WCAG 2.1 Level AA 기준 준수 검증

### 테스트 스위트 상세

#### 1. Gallery Accessibility (`gallery-a11y.spec.ts`)

갤러리 컴포넌트의 기본 접근성 검증:

- ✅ 전체 접근성 위반사항 없음
- ✅ 색상 대비 (cat.color)
- ✅ 의미론적 HTML 구조 (cat.semantics)

#### 2. Toolbar Accessibility (`toolbar-a11y.spec.ts`)

미디어 컨트롤 툴바 접근성 검증:

- ✅ 전체 접근성 위반사항 없음
- ✅ 키보드 탐색 가능
- ✅ ARIA role 및 레이블 적절성

#### 3. KeyboardHelpOverlay Accessibility (`keyboard-overlay-a11y.spec.ts`)

키보드 단축키 도움말 오버레이 검증:

- ✅ Dialog role 및 aria-modal 속성
- ✅ 접근 가능한 테이블 구조
- ✅ 키보드 내비게이션 (Escape, Tab)

**중요성**: 키보드 사용자를 위한 도움말이므로 완벽한 키보드 접근성 필수

#### 4. Dialog & Focus Management (`dialog-focus-a11y.spec.ts`)

다이얼로그 및 포커스 관리 통합 검증 (19 tests):

**Basic Dialog**:

- Dialog role 및 aria-modal
- 접근 가능한 닫기 버튼

**Focus Trap**:

- Tab 순방향/역방향 순환
- Escape로 닫기 및 포커스 복원
- 배경 inert 처리

**Settings Dialog**:

- 폼 컨트롤 접근성
- 버튼 레이블
- 키보드 탐색

**Focus Indicators**:

- 시각적 포커스 인디케이터 (3px 이상)
- Skip to content 링크
- 논리적 포커스 순서
- 숨겨진 요소 포커스 방지

## ✍️ 테스트 작성 가이드

### 기본 패턴

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Component Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test</title>
      </head>
      <body>
        <main>
          <h1>Test</h1>
        </main>
      </body>
      </html>
    `);
  });

  test('should have no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

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

## � 참고 자료

- [axe-core API Documentation](https://www.deque.com/axe/core-documentation/api-documentation/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [Playwright Testing](https://playwright.dev/docs/intro)

## 🚧 현재 제한사항

**정적 HTML 시뮬레이션 사용**:

- 모든 테스트가 `about:blank`에서 `setContent()`로 정적 HTML 생성
- 실제 Solid.js 컴포넌트를 테스트하지 않음

**향후 계획**:

- playwright/harness API 확장
- 실제 컴포넌트 마운트로 전환
- 동적 상태 변경 시나리오 추가

## ⚡ 최적화 팁

**실행 시간 단축**:

```bash
# 병렬 실행
npx playwright test --workers=4 playwright/accessibility/

# 특정 브라우저만
npx playwright test --project=chromium playwright/accessibility/
```

**CI 환경**:

```yaml
# GitHub Actions
- name: Run accessibility tests
  run: npm run e2e:a11y
```

## 🎓 베스트 프랙티스

1. **테스트 작성 시**:
   - 모든 테스트에 WCAG 2.1 Level AA 태그 포함
   - 위반사항은 자동으로 실패하도록 설정
   - 특정 컴포넌트 영역만 검사 (불필요한 외부 요소 제외)

2. **CI/CD 통합**:
   - 모든 PR에서 접근성 테스트 필수 실행
   - 위반사항 발견 시 빌드 실패

3. **유지보수**:
   - 새 UI 컴포넌트 추가 시 접근성 테스트도 함께 작성
   - axe-core 규칙 정기 업데이트
   - 수동 스크린 리더 테스트로 보완

---

**테스트 현황**: ✅ 33/33 passing (5개 파일)

**마지막 업데이트**: 2025-10-27

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
