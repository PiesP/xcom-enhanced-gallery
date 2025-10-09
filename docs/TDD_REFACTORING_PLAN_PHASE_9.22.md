# Phase 9.22: SETTINGS-THEME-INTEGRATION (Preact→Solid 리팩토링 버그 수정)

> **생성일**: 2025-10-08 **우선순위**: Critical (P0) **목표**: Preact → Solid.js
> 리팩토링 후 발생한 설정/테마 적용 버그 수정

---

## 📋 문제 분석

### 브라우저 테스트 결과 (v0.3.1-dev.1759929188276)

**테스트 시나리오**:

1. 트위터 타임라인에서 미디어 클릭 (갤러리 열기)
2. 툴바에서 다음 미디어 클릭 3번
3. 툴바의 설정 버튼 클릭
4. 설정 모달에서 테마 변경 시도
5. 닫기 버튼 클릭

**관측된 문제**:

1. ❌ **Critical**: 설정 변경이 적용되지 않음
   - 설정 모달에서 테마/언어 선택 시 아무 반응 없음
   - ThemeService.setTheme() 호출되지 않음

2. ❌ **High**: 다크모드에서 툴바 아이콘이 보이지 않음
   - 아이콘은 상호작용 가능하지만 시각적으로 보이지 않음
   - 다크 배경에 다크 아이콘으로 렌더링됨

3. ⚠️ **Medium**: 설정 모달 CSS가 무너진 것처럼 보임
   - 배경색, 텍스트 색상이 제대로 적용되지 않음

---

## 🔍 근본 원인 분석

### 문제 1: SettingsModal onChange 핸들러 미연결

**파일**: `src/shared/components/ui/ToolbarWithSettings/ToolbarWithSettings.tsx`

**현재 코드**:

```tsx
<SettingsModal
  isOpen={isSettingsOpen()}
  onClose={handleCloseSettings}
  position={modalPosition()}
  // ❌ onThemeChange, onLanguageChange가 없음!
/>
```

**원인**:

- `SettingsModal`은 `onThemeChange`, `onLanguageChange` props를 받도록 설계됨
- 그러나 `ToolbarWithSettings`가 이 props를 전달하지 않음
- 결과: 사용자가 select를 변경해도 `handlers.onThemeChange?.(value)`가
  `undefined` 호출

**영향 범위**:

- 테마 변경 불가 (auto, light, dark)
- 언어 변경 불가 (auto, ko, en, ja)
- localStorage에 설정 저장 안 됨
- `data-theme` 속성 업데이트 안 됨

---

### 문제 2: CSS에 `[data-theme]` 선택자 없음

**파일**: `src/shared/styles/design-tokens.css`, `design-tokens.semantic.css`

**현재 상황**:

```css
/* 현재 - prefers-color-scheme만 있음 */
@media (prefers-color-scheme: dark) {
  :root {
    --xeg-color-text-primary: var(--color-base-white);
    /* ... */
  }
}

/* ❌ [data-theme="dark"] 선택자가 없음! */
```

**ThemeService 동작**:

```typescript
// ThemeService.ts - applyCurrentTheme()
document.documentElement?.setAttribute('data-theme', this.currentTheme);
// → <html data-theme="dark">로 설정됨
```

**원인**:

- `ThemeService`는 `<html data-theme="dark">` 속성을 설정
- 그러나 CSS에는 `@media (prefers-color-scheme: dark)`만 있음
- `[data-theme="dark"]` 선택자가 없어서 수동 테마 변경이 CSS에 반영 안 됨

**결과**:

- 다크모드 선택 시 CSS 변수가 업데이트되지 않음
- 아이콘이 `currentColor`를 사용하므로 잘못된 색상으로 렌더링
- 라이트 모드 색상이 다크 배경에 표시되어 보이지 않음

---

## ✅ 해결 방안

### 1. ToolbarWithSettings 수정 (Critical)

**파일**: `src/shared/components/ui/ToolbarWithSettings/ToolbarWithSettings.tsx`

**변경 사항**:

```tsx
import { themeService, languageService } from '@shared/services';

export const ToolbarWithSettings: Component<
  ToolbarWithSettingsProps
> = props => {
  const { createSignal } = getSolid();
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

  // Phase 9.22: ThemeService 연동
  const handleThemeChange = (theme: 'auto' | 'light' | 'dark'): void => {
    logger.debug('[ToolbarWithSettings] 테마 변경 요청', { theme });
    themeService.setTheme(theme);
  };

  // Phase 9.22: LanguageService 연동
  const handleLanguageChange = (
    language: 'auto' | 'ko' | 'en' | 'ja'
  ): void => {
    logger.debug('[ToolbarWithSettings] 언어 변경 요청', { language });
    languageService.setLanguage(language);
  };

  // 현재 설정값 가져오기 (reactive)
  const currentTheme = () => themeService.getThemeSetting();
  const currentLanguage = () => languageService.getCurrentLanguage();

  return (
    <>
      <Toolbar {...toolbarProps()} />

      <SettingsModal
        isOpen={isSettingsOpen()}
        onClose={handleCloseSettings}
        position={modalPosition()}
        theme={currentTheme()}
        language={currentLanguage()}
        onThemeChange={handleThemeChange}
        onLanguageChange={handleLanguageChange}
        data-testid={props.settingsTestId || 'toolbar-settings-modal'}
      />
    </>
  );
};
```

**핵심 포인트**:

- `themeService`, `languageService` import
- `handleThemeChange`, `handleLanguageChange` 함수 구현
- `currentTheme()`, `currentLanguage()` getter로 현재 값 제공
- `SettingsModal`에 6개 props 전달 (isOpen, onClose, position, theme, language,
  onThemeChange, onLanguageChange, data-testid)

---

### 2. CSS `[data-theme]` 선택자 추가 (High)

**파일**: `src/shared/styles/design-tokens.semantic.css`

**변경 사항**:

```css
/* 기존 - 시스템 테마 자동 감지 */
@media (prefers-color-scheme: dark) {
  :root {
    --xeg-color-text-primary: var(--color-base-white);
    --xeg-color-text-secondary: var(--color-gray-300);
    --xeg-color-bg-primary: var(--color-gray-900);
    /* ... 모든 다크모드 변수 */
  }
}

/* Phase 9.22: 수동 테마 선택 지원 */
[data-theme='dark'] {
  --xeg-color-text-primary: var(--color-base-white);
  --xeg-color-text-secondary: var(--color-gray-300);
  --xeg-color-bg-primary: var(--color-gray-900);
  /* ... @media (prefers-color-scheme: dark)와 동일한 모든 변수 */
}

[data-theme='light'] {
  --xeg-color-text-primary: var(--color-base-black);
  --xeg-color-text-secondary: var(--color-gray-600);
  --xeg-color-bg-primary: var(--color-base-white);
  /* ... 라이트모드 변수 (명시적 선언) */
}
```

**핵심 포인트**:

- `[data-theme='dark']` 선택자 추가 (prefers-color-scheme: dark와 동일한 규칙)
- `[data-theme='light']` 선택자 추가 (명시적 라이트모드)
- `auto` 설정 시에는 `data-theme` 속성이 없고 `@media`가 적용됨
- `light`/`dark` 수동 선택 시에는 `[data-theme]`가 우선 적용됨

**우선순위 규칙**:

```
[data-theme] 선택자 (명시적 선택) > @media (prefers-color-scheme) (시스템 기본값)
```

---

## 🧪 TDD 작업 흐름

### RED: 실패 테스트 작성

**파일**:
`test/unit/shared/components/ui/toolbar-with-settings-integration.red.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { ToolbarWithSettings } from '@shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';
import { themeService } from '@shared/services';

describe('[RED] ToolbarWithSettings - ThemeService 통합', () => {
  it('설정 모달에서 테마 변경 시 ThemeService.setTheme() 호출됨', async () => {
    const setThemeSpy = vi.spyOn(themeService, 'setTheme');

    render(() => (
      <ToolbarWithSettings
        currentIndex={0}
        totalCount={5}
        onPrevious={() => {}}
        onNext={() => {}}
        onDownloadCurrent={() => {}}
        onDownloadAll={() => {}}
        onClose={() => {}}
      />
    ));

    // 설정 버튼 클릭
    const settingsButton = screen.getByLabelText('설정 열기');
    fireEvent.click(settingsButton);

    // 테마 select 찾기
    const themeSelect = await screen.findByTestId('theme-select');

    // 'dark' 선택
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    // ThemeService.setTheme('dark') 호출 확인
    await waitFor(() => {
      expect(setThemeSpy).toHaveBeenCalledWith('dark');
    });
  });

  it('설정 모달에 현재 테마가 반영됨', async () => {
    vi.spyOn(themeService, 'getThemeSetting').mockReturnValue('dark');

    render(() => (
      <ToolbarWithSettings
        currentIndex={0}
        totalCount={5}
        onPrevious={() => {}}
        onNext={() => {}}
        onDownloadCurrent={() => {}}
        onDownloadAll={() => {}}
        onClose={() => {}}
      />
    ));

    // 설정 버튼 클릭
    const settingsButton = screen.getByLabelText('설정 열기');
    fireEvent.click(settingsButton);

    // 테마 select 찾기
    const themeSelect = await screen.findByTestId('theme-select');

    // value가 'dark'인지 확인
    expect(themeSelect).toHaveValue('dark');
  });
});
```

**파일**: `test/unit/styles/data-theme-selector.red.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('[RED] CSS [data-theme] 선택자', () => {
  it('[data-theme="dark"] 적용 시 CSS 변수가 다크모드로 변경됨', () => {
    const html = document.documentElement;
    html.setAttribute('data-theme', 'dark');

    const styles = window.getComputedStyle(html);
    const textColor = styles
      .getPropertyValue('--xeg-color-text-primary')
      .trim();

    // 다크모드에서는 텍스트가 밝은 색상이어야 함
    expect(textColor).toContain('255, 255, 255'); // white or similar
  });

  it('[data-theme="light"] 적용 시 CSS 변수가 라이트모드로 변경됨', () => {
    const html = document.documentElement;
    html.setAttribute('data-theme', 'light');

    const styles = window.getComputedStyle(html);
    const textColor = styles
      .getPropertyValue('--xeg-color-text-primary')
      .trim();

    // 라이트모드에서는 텍스트가 어두운 색상이어야 함
    expect(textColor).toContain('0, 0, 0'); // black or similar
  });
});
```

---

### GREEN: 최소 구현

**1단계**: `ToolbarWithSettings.tsx` 수정

- `themeService`, `languageService` import
- `handleThemeChange`, `handleLanguageChange` 구현
- `SettingsModal` props 추가

**2단계**: `design-tokens.semantic.css` 수정

- `[data-theme='dark']` 선택자 추가
- `[data-theme='light']` 선택자 추가
- 모든 색상 변수 복사

---

### REFACTOR: 검증 및 정리

1. **타입/린트/빌드 검증**: `npm run build`
2. **브라우저 테스트**:
   - 갤러리 열기
   - 설정 모달 열기
   - 테마 auto → dark → light 변경
   - 아이콘 색상 변화 확인
   - 모달 CSS 정상 표시 확인
3. **로그 확인**:
   ```
   [ToolbarWithSettings] 테마 변경 요청 {theme: "dark"}
   [ThemeService] Theme setting changed: dark
   [ThemeService] Theme applied: dark (setting: dark)
   ```
4. **문서 갱신**: Phase 9.22 완료를 COMPLETED.md로 이관

---

## 📊 예상 결과

### 수정 전 (버그)

```log
❌ 설정 모달에서 테마 선택 → 아무 일도 일어나지 않음
❌ 다크모드에서 툴바 아이콘 보이지 않음
❌ 설정 모달 CSS 무너짐
```

### 수정 후 (정상)

```log
✅ 설정 모달에서 테마 선택 → ThemeService.setTheme() 호출
✅ <html data-theme="dark"> 속성 설정
✅ [data-theme="dark"] CSS 선택자 적용
✅ 툴바 아이콘 색상 정상 (currentColor 올바르게 상속)
✅ 설정 모달 CSS 정상 표시
✅ localStorage에 설정 저장
```

---

## 🎯 체크리스트

### RED Phase

- [ ] `toolbar-with-settings-integration.red.test.ts` 작성
- [ ] `data-theme-selector.red.test.ts` 작성
- [ ] 테스트 실행 → FAIL 확인

### GREEN Phase

- [ ] `ToolbarWithSettings.tsx` 수정 (onChange 핸들러 연결)
- [ ] `design-tokens.semantic.css` 수정 ([data-theme] 선택자 추가)
- [ ] 테스트 실행 → PASS 확인

### REFACTOR Phase

- [ ] 타입체크 (`npm run typecheck`)
- [ ] 린트 (`npm run lint`)
- [ ] 빌드 (`npm run build`)
- [ ] 브라우저 테스트 (설정 변경, 테마 적용, 아이콘 표시)
- [ ] 로그 분석 (ThemeService 호출 확인)

### 문서화

- [ ] Phase 9.22 완료를 COMPLETED.md로 이관
- [ ] PLAN.md에서 Phase 9.22 제거
- [ ] AGENTS.md "최근 완료된 작업" 업데이트

---

## 📚 참고 문서

- `docs/CODING_GUIDELINES.md`: 디자인 토큰 규칙
- `docs/ARCHITECTURE.md`: 3계층 구조, 서비스 경계
- `src/shared/services/ThemeService.ts`: 테마 서비스 API
- `src/shared/services/LanguageService.ts`: 언어 서비스 API
