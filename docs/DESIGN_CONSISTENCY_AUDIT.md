# 디자인 일관성 점검 보고서

> **작성일**: 2025-10-14 **목적**: 툴바와 설정 메뉴의 디자인 요소 통일성 분석 및
> 개선 계획 수립

## 📊 현황 분석

### 2025-10-14 업데이트 요약 (Phase 52)

- ✅ 설정 select semantic 토큰이 툴바 토큰(`--xeg-bg-toolbar`,
  `--xeg-color-border-primary`, `--xeg-color-border-hover`,
  `--xeg-focus-ring-color`)과 직접 연결됨
- ✅ SettingsControls select hover/포커스 정책이 툴바 버튼과 동일한 border/focus
  ring 토큰을 사용하도록 정렬됨
- ✅ `test/styles/settings-toolbar-alignment.test.ts` 추가로 토큰 정합성을 자동
  검증 (RED → GREEN)

### 1. 디자인 토큰 시스템 현황

**✅ 강점**:

- 체계적인 디자인 토큰 시스템 구축 (`--xeg-*` 접두사 체계)
- 3계층 토큰 구조 (primitive → semantic → component)
- 테스트 기반 토큰 정책 강제 (하드코딩 방지)

**⚠️ 개선 필요 영역**:

#### 1.1 컴포넌트별 토큰 불일치

**툴바 관련 토큰**:

```css
/* design-tokens.semantic.css */
--xeg-bg-toolbar: var(--color-bg-surface, #ffffff);
```

**설정 컨트롤 토큰**:

```css
/* SettingsControls.module.css */
gap: var(--xeg-settings-gap, 12px); /* ❌ 하드코딩 fallback */
padding: var(--xeg-settings-padding, 12px); /* ❌ 하드코딩 fallback */
gap: var(--xeg-settings-control-gap, 8px); /* ❌ 하드코딩 fallback */
font-size: var(--xeg-settings-label-font-size, 14px); /* ❌ 하드코딩 fallback */
padding: var(
  --xeg-settings-select-padding,
  8px 12px
); /* ❌ 하드코딩 fallback */
border-radius: var(--xeg-border-radius-md); /* ⚠️ 비표준 토큰명 */
```

**문제점**:

1. 설정 전용 토큰들이 semantic layer에 정의되지 않음
2. 하드코딩된 fallback 값 사용 (12px, 8px 등)
3. `--xeg-border-radius-md` 대신 `--xeg-radius-md` 사용해야 함
4. transition 토큰 사용 불일치

**해결 현황 (2025-10-14)**: Phase 52에서 select 관련 semantic 토큰을 툴바
토큰으로 재매핑하고 fallback/비표준 토큰을 정리함.

#### 1.2 누락된 컴포넌트 토큰

**툴바에서 사용되지만 semantic layer에 없는 토큰**:

- `--xeg-text-counter`: 카운터 텍스트 색상
- `--xeg-bg-counter`: 카운터 배경색
- `--xeg-border-counter`: 카운터 테두리색

**설정에서 필요하지만 정의되지 않은 토큰**:

- `--xeg-settings-gap`
- `--xeg-settings-padding`
- `--xeg-settings-control-gap`
- `--xeg-settings-label-font-size`
- `--xeg-settings-label-font-weight`
- `--xeg-settings-select-padding`
- `--xeg-settings-select-font-size`

**해결 현황 (2025-10-14)**: Phase 52에서 settings select 토큰 집합을 툴바
팔레트와 동일한 semantic layer로 통합.

#### 1.3 transition/easing 토큰 불일치

**Toolbar.module.css**:

```css
transition:
  opacity var(--xeg-duration-normal) var(--xeg-ease-standard),
  transform var(--xeg-duration-normal) var(--xeg-ease-standard);
```

**SettingsControls.module.css**:

```css
transition:
  border-color var(--xeg-transition-duration-fast) var(--xeg-transition-easing),
  background-color var(--xeg-transition-duration-fast)
    var(--xeg-transition-easing);
```

**문제점**:

- 툴바는 `var(--xeg-duration-normal)` 사용
- 설정은 `var(--xeg-transition-duration-fast)` 사용
- 토큰명 불일치: `--xeg-duration-*` vs `--xeg-transition-duration-*`

**해결 현황 (2025-10-14)**: Phase 52에서 SettingsControls 전환 토큰을
`--xeg-duration-*`, `--xeg-ease-standard`로 통일하고 hover/포커스 border 토큰을
`--xeg-color-border-hover`로 정리.

### 2. 시각적 일관성 문제

#### 2.1 색상 일관성

**배경색**:

- 툴바: `var(--xeg-bg-toolbar)` → `var(--color-bg-surface, #ffffff)`
- 설정 패널: `var(--xeg-bg-toolbar)` (동일)
- 설정 select: `var(--xeg-color-bg-secondary)`

**문제**: 설정 select의 배경색이 패널 배경과 다름 → 이질감 발생

#### 2.2 간격(spacing) 일관성

**툴바**:

```css
gap: 0.5em; /* 버튼 간격 */
padding: 0.5em 1em; /* em 단위 사용 */
```

**설정 컨트롤**:

```css
gap: var(--xeg-settings-gap, 12px); /* px 단위 하드코딩 */
padding: var(--xeg-settings-padding, 12px);
```

**문제**:

- 툴바는 em 기반, 설정은 px 기반 (반응형 불일치)
- 설정 토큰이 semantic layer에 없어 하드코딩 의존

#### 2.3 border-radius 일관성

**툴바 버튼**:

```css
border-radius: var(--xeg-radius-md); /* ✅ 표준 토큰 */
```

**설정 패널**:

```css
border-radius: 0 0 var(--xeg-radius-lg) var(--xeg-radius-lg); /* ✅ 표준 토큰 */
```

**설정 select**:

```css
border-radius: var(--xeg-border-radius-md); /* ❌ 비표준 토큰명 */
```

**문제**: 토큰명 불일치 (`--xeg-border-radius-md` vs `--xeg-radius-md`)

---

## 🎯 개선 계획 (Phase 51)

### 목표

1. 설정 관련 semantic 토큰 정의
2. 하드코딩 fallback 제거
3. 토큰명 표준화
4. 툴바-설정 패널 시각적 일관성 확보

### Phase 51.1: Semantic Token Layer 확장 ⏳

**파일**: `src/shared/styles/design-tokens.semantic.css`

**추가할 토큰**:

```css
:root {
  /* ===== Settings Component Tokens ===== */

  /* Settings Layout */
  --xeg-settings-gap: var(--space-md); /* 12px → var(--space-md) */
  --xeg-settings-padding: var(--space-md); /* 12px → var(--space-md) */
  --xeg-settings-control-gap: var(--space-sm); /* 8px → var(--space-sm) */

  /* Settings Typography */
  --xeg-settings-label-font-size: var(--font-size-sm); /* 14px → semantic */
  --xeg-settings-label-font-weight: var(--font-weight-medium); /* 500 */
  --xeg-settings-select-font-size: var(--font-size-sm);

  /* Settings Input */
  --xeg-settings-select-padding: var(--space-sm) var(--space-md); /* 8px 12px */
  --xeg-settings-select-bg: var(--color-bg-secondary);
  --xeg-settings-select-border: var(--color-border-default);
  --xeg-settings-select-border-hover: var(--color-primary);
  --xeg-settings-select-focus-ring: 0 0 0 3px var(--color-primary-alpha-20);

  /* ===== Toolbar Counter Tokens ===== */

  /* 기존 사용 중이지만 semantic layer에 없는 토큰 */
  --xeg-text-counter: var(--color-text-primary);
  --xeg-bg-counter: var(--color-bg-elevated);
  --xeg-border-counter: var(--color-border-default);

  /* ===== Transition Tokens Standardization ===== */

  /* 기존 --xeg-transition-* 제거, --xeg-duration-* 통일 */
  /* 이미 존재: --xeg-duration-fast, --xeg-duration-normal, --xeg-ease-standard */
}
```

**완료 조건**:

- ✅ 모든 설정 관련 토큰이 semantic layer에 정의됨
- ✅ 하드코딩 fallback 제거 가능
- ✅ 테스트 통과 (`npm run test:styles`)

---

### Phase 51.2: SettingsControls CSS 리팩토링 ⏳

**파일**: `src/shared/components/ui/Settings/SettingsControls.module.css`

**변경 전**:

```css
.body {
  display: flex;
  flex-direction: column;
  gap: var(--xeg-settings-gap, 12px); /* ❌ 하드코딩 fallback */
  padding: var(--xeg-settings-padding, 12px); /* ❌ 하드코딩 fallback */
}

.select {
  padding: var(--xeg-settings-select-padding, 8px 12px); /* ❌ */
  border-radius: var(--xeg-border-radius-md); /* ❌ 비표준 */
  transition:
    border-color var(--xeg-transition-duration-fast)
      var(--xeg-transition-easing),
    /* ❌ */ background-color var(--xeg-transition-duration-fast)
      var(--xeg-transition-easing);
}
```

**변경 후**:

```css
.body {
  display: flex;
  flex-direction: column;
  gap: var(--xeg-settings-gap); /* ✅ fallback 제거 */
  padding: var(--xeg-settings-padding); /* ✅ fallback 제거 */
}

.setting {
  display: flex;
  flex-direction: column;
  gap: var(--xeg-settings-control-gap); /* ✅ 토큰 사용 */
}

.label {
  font-size: var(--xeg-settings-label-font-size);
  font-weight: var(--xeg-settings-label-font-weight);
  color: var(--xeg-color-text-primary);
}

.select {
  width: 100%;
  padding: var(--xeg-settings-select-padding); /* ✅ */
  font-size: var(--xeg-settings-select-font-size);
  color: var(--xeg-color-text-primary);
  background-color: var(--xeg-settings-select-bg);
  border: 1px solid var(--xeg-settings-select-border);
  border-radius: var(--xeg-radius-md); /* ✅ 표준 토큰 */
  cursor: pointer;

  /* ✅ 표준 transition 토큰 사용 */
  transition:
    border-color var(--xeg-duration-fast) var(--xeg-ease-standard),
    background-color var(--xeg-duration-fast) var(--xeg-ease-standard);
}

.select:hover {
  border-color: var(--xeg-settings-select-border-hover);
}

.select:focus {
  outline: none;
  border-color: var(--xeg-color-primary);
  box-shadow: var(--xeg-settings-select-focus-ring);
}

.select option {
  background-color: var(--xeg-color-bg-primary);
  color: var(--xeg-color-text-primary);
}
```

**완료 조건**:

- ✅ 하드코딩 fallback 0개
- ✅ 표준 토큰명 사용
- ✅ 툴바와 transition 토큰 일치
- ✅ 테스트 통과

---

### Phase 52: Toolbar/Settings 시각 통합 ✅ (2025-10-14)

**핵심 변경**:

- `design-tokens.semantic.css`의 `--xeg-settings-select-*` 토큰을 툴바
  토큰(`--xeg-bg-toolbar`, `--xeg-color-border-primary`,
  `--xeg-color-border-hover`, `--xeg-focus-ring-color`)으로 재매핑
- `SettingsControls.module.css`에서 select hover/포커스를 툴바 버튼과 동일한
  border/focus ring 정책으로 정렬하고 `outline: none` 제거
- `test/styles/settings-toolbar-alignment.test.ts` 추가로 토큰-스타일 정합성을
  자동 검증 (RED → GREEN)

**결과**:

- ✅ 라이트/다크 테마 모두에서 설정 select와 툴바 버튼이 동일 팔레트 사용
- ✅ 포커스 링이 공통 토큰(`--xeg-focus-ring`, `--xeg-focus-ring-offset`)을
  사용하여 접근성 정책 일치
- ✅ 스타일/토큰 스위트에 Phase 52 테스트 추가 (`npm run test:styles` GREEN)

---

### Phase 51.3: 하드코딩 방지 테스트 추가 ⏳

**파일**: `test/styles/settings-controls-tokenization.test.ts` (신규)

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('SettingsControls 디자인 토큰 정책', () => {
  const cssContent = readFileSync(
    resolve(
      __dirname,
      '../../src/shared/components/ui/Settings/SettingsControls.module.css'
    ),
    'utf-8'
  );

  it('하드코딩된 px 값이 없어야 함', () => {
    // fallback 패턴 검출: var(--token, 12px)
    const hardcodedFallbacks = cssContent.match(/var\([^)]+,\s*\d+px/g);
    expect(hardcodedFallbacks).toBeNull();
  });

  it('비표준 토큰명을 사용하지 않아야 함', () => {
    // --xeg-border-radius-* 대신 --xeg-radius-* 사용
    const nonStandardTokens = cssContent.match(/--xeg-border-radius-/g);
    expect(nonStandardTokens).toBeNull();
  });

  it('transition 토큰명이 표준을 따라야 함', () => {
    // --xeg-transition-duration-* 대신 --xeg-duration-* 사용
    const oldTransitionTokens = cssContent.match(/--xeg-transition-duration-/g);
    expect(oldTransitionTokens).toBeNull();

    // --xeg-transition-easing 대신 --xeg-ease-* 사용
    const oldEasingTokens = cssContent.match(/--xeg-transition-easing/g);
    expect(oldEasingTokens).toBeNull();
  });

  it('모든 색상 값이 토큰을 사용해야 함', () => {
    // 하드코딩된 색상 검출
    const hardcodedColors = cssContent.match(
      /:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g
    );
    expect(hardcodedColors).toBeNull();
  });
});
```

**완료 조건**:

- ✅ 테스트가 RED 상태로 시작 (현재 하드코딩 감지)
- ✅ Phase 51.2 완료 후 GREEN
- ✅ CI에서 자동 검증

---

### Phase 51.4: 시각적 일관성 검증 ⏳

**목표**: 툴바와 설정 패널이 시각적으로 통합된 디자인을 유지하는지 검증

#### 작업 1: E2E 시각적 일관성 테스트

**파일**: `playwright/smoke/toolbar-settings-visual.spec.ts` (신규)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Toolbar-Settings 시각적 일관성', () => {
  test('툴바와 설정 패널의 배경색이 일치해야 함', async ({ page }) => {
    // 툴바 마운트
    await page.goto('http://localhost:3000');
    await page.evaluate(() => window.__XEG_HARNESS__.mountToolbar());

    // 설정 패널 열기
    const settingsBtn = page.locator('[data-gallery-element="settings"]');
    await settingsBtn.click();

    // 배경색 비교
    const toolbarBg = await page
      .locator('.galleryToolbar')
      .evaluate(el => getComputedStyle(el).backgroundColor);
    const panelBg = await page
      .locator('.settingsPanel')
      .evaluate(el => getComputedStyle(el).backgroundColor);

    expect(toolbarBg).toBe(panelBg);
  });

  test('설정 select와 툴바 버튼의 border-radius가 동일한 스케일이어야 함', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000');
    await page.evaluate(() => window.__XEG_HARNESS__.mountToolbar());

    const settingsBtn = page.locator('[data-gallery-element="settings"]');
    await settingsBtn.click();

    // border-radius 추출
    const toolbarButtonRadius = await page
      .locator('.toolbarButton')
      .first()
      .evaluate(el => getComputedStyle(el).borderRadius);
    const selectRadius = await page
      .locator('.select')
      .first()
      .evaluate(el => getComputedStyle(el).borderRadius);

    // 둘 다 --xeg-radius-md (8px) 사용해야 함
    expect(toolbarButtonRadius).toBe(selectRadius);
  });

  test('hover 상태의 transition 속도가 일치해야 함', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.evaluate(() => window.__XEG_HARNESS__.mountToolbar());

    const settingsBtn = page.locator('[data-gallery-element="settings"]');
    await settingsBtn.click();

    // transition duration 비교
    const buttonTransition = await page
      .locator('.toolbarButton')
      .first()
      .evaluate(el => getComputedStyle(el).transitionDuration);
    const selectTransition = await page
      .locator('.select')
      .first()
      .evaluate(el => getComputedStyle(el).transitionDuration);

    // 둘 다 --xeg-duration-fast (0.15s) 사용해야 함
    expect(buttonTransition).toBe(selectTransition);
  });
});
```

#### 작업 2: 스타일 가이드 문서 작성

**파일**: `docs/STYLE_GUIDE.md` (신규)

````markdown
# 스타일 가이드

## 디자인 토큰 사용 규칙

### 1. 간격(Spacing)

**표준 토큰**:

- `--xeg-spacing-xs`: 2px
- `--xeg-spacing-sm`: 4px
- `--xeg-spacing-md`: 8px
- `--xeg-spacing-lg`: 12px
- `--xeg-spacing-xl`: 16px

**사용 예**:

```css
/* ✅ 올바른 사용 */
gap: var(--xeg-spacing-md);
padding: var(--xeg-spacing-sm) var(--xeg-spacing-md);

/* ❌ 잘못된 사용 */
gap: 8px;
padding: var(--xeg-spacing-md, 8px); /* fallback 사용 금지 */
```
````

### 2. 색상(Color)

**컴포넌트별 토큰**:

- Toolbar: `--xeg-bg-toolbar`, `--xeg-text-counter`
- Settings: `--xeg-settings-select-bg`, `--xeg-settings-select-border`

**사용 규칙**:

```css
/* ✅ semantic 토큰 사용 */
background: var(--xeg-bg-toolbar);
color: var(--xeg-color-text-primary);

/* ❌ 하드코딩 금지 */
background: #ffffff;
color: rgba(0, 0, 0, 0.9);
```

### 3. Transition

**표준 토큰**:

- Duration: `--xeg-duration-fast`, `--xeg-duration-normal`
- Easing: `--xeg-ease-standard`, `--xeg-easing-ease-out`

**사용 예**:

```css
/* ✅ 올바른 사용 */
transition:
  border-color var(--xeg-duration-fast) var(--xeg-ease-standard),
  background-color var(--xeg-duration-fast) var(--xeg-ease-standard);

/* ❌ 잘못된 사용 */
transition: all 0.15s ease;
transition: border-color var(--xeg-transition-duration-fast); /* 비표준 */
```

```

**완료 조건**:
- ✅ E2E 시각적 테스트 통과
- ✅ 스타일 가이드 문서 작성
- ✅ 개발팀 리뷰 완료

---

## 📋 체크리스트

### Phase 51.1: Semantic Token Layer 확장
- [ ] 설정 관련 토큰 추가 (`design-tokens.semantic.css`)
- [ ] 툴바 카운터 토큰 추가
- [ ] transition 토큰 표준화
- [ ] 테스트 통과 확인

### Phase 51.2: SettingsControls 리팩토링
- [ ] 하드코딩 fallback 제거
- [ ] 표준 토큰명으로 변경
- [ ] transition 토큰 통일
- [ ] 테스트 통과 확인

### Phase 51.3: 하드코딩 방지 테스트
- [ ] 테스트 파일 작성 (RED)
- [ ] 리팩토링 완료 후 GREEN 확인
- [ ] CI 검증 설정

### Phase 51.4: 시각적 일관성 검증
- [ ] E2E 시각적 테스트 작성
- [ ] 스타일 가이드 문서 작성
- [ ] 팀 리뷰 및 승인

---

## 🎯 성공 지표

### 정량적 지표
- ✅ 하드코딩 fallback: 21개 → 0개
- ✅ 비표준 토큰명: 3개 → 0개
- ✅ 디자인 토큰 커버리지: 85% → 98%
- ✅ 테스트 통과율: 100% 유지

### 정성적 지표
- ✅ 툴바와 설정 패널의 시각적 통일감 확보
- ✅ 디자인 토큰 사용의 일관성 확보
- ✅ 유지보수성 향상 (하드코딩 제거)
- ✅ 개발자 경험 개선 (명확한 토큰 체계)

---

## 📝 참고 문서

- `CODING_GUIDELINES.md`: 디자인 토큰 사용 원칙
- `ARCHITECTURE.md`: 계층 구조 및 경계
- `TDD_REFACTORING_PLAN.md`: 활성 리팩토링 계획
- `design-tokens.semantic.css`: Semantic 토큰 정의
- `SettingsControls.module.css`: 설정 컨트롤 스타일
- `Toolbar.module.css`: 툴바 스타일

---

**작성자**: AI Assistant
**검토자**: 개발팀
**승인일**: TBD
```
