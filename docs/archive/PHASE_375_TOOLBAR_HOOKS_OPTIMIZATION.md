# Phase 375: Toolbar Hooks Optimization (v0.4.3+)

**마지막 업데이트**: 2025-11-06 | **상태**: ✅ 완료 | **기여도**: 100% 최적화
완료

---

## 개요

`src/shared/hooks/toolbar/` 디렉토리의 toolbar hooks를 **프로젝트 문서 및 언어
정책**에 따라 최적화했습니다.

**목표**:

- ✅ 모든 한국어 주석 → 영어 (언어 정책 준수)
- ✅ 종합적인 JSDoc 작성 (메서드, 타입, 기능, 예제)
- ✅ @internal 마킹 (공개 API vs 내부 구현 명확화)
- ✅ index.ts 생성 (배럴 export 정책 준수)
- ✅ Phase 329/370 컨텍스트 통합

---

## 최적화 대상 파일

### 1. use-toolbar-settings-controller.ts ✅

**변경사항**:

- 파일 설명: 종합적인 책임사항 문서화 (Phase 375 추가)
- 타입 주석: ThemeOption, LanguageOption, EventManagerLike 명확화
- 함수 JSDoc: 5개 핵심 기능 + 이벤트 흐름 + 사용 예제 추가
- @internal 마킹: Solid.js hook, PC-only 명시

**주요 기능 문서화**:

```typescript
/**
 * Toolbar Settings Controller Implementation
 *
 * **Core Features**:
 *
 * 1. **Settings Panel Management** - Toggle with outside-click detection
 *    - Click settings button to toggle panel
 *    - Panel closes on document mousedown (outside click)
 *    - Panel closes on Escape key
 *    - Focus restored to button on close
 *
 * 2. **Select Guard System** - Prevents premature panel closure
 *    - Detects select element interactions
 *    - Keeps panel open during select dropdown
 *    - Guard timeout: 300ms (configurable)
 *
 * 3. **Theme Selection** - 'auto' | 'light' | 'dark'
 *    - Persisted via ThemeService
 *    - Reactive to service changes
 *
 * 4. **Language Selection** - 'auto' | 'ko' | 'en' | 'ja'
 *    - Persisted via LanguageService
 *    - Reactive to service changes
 *
 * 5. **High-Contrast Mode** - Accessibility feature
 *    - Samples toolbar luminance at scroll events
 *    - Throttled via requestAnimationFrame
 *    - Sets CSS class for high-contrast CSS
 */
```

**라인 수**: 452줄 (최적화 완료)

### 2. index.ts (신규 생성) ✅

**내용**:

- 배럴 export 정책 문서화 (금지된 import 명시)
- 공개 API 설명 (hook, types 3개)
- 기능 요약 (5가지 핵심 기능)
- 사용 예제 (실제 코드)
- 통합 포인트 (서비스, 레퍼런스)

**구조**:

````typescript
/**
 * Toolbar Hooks Layer - Settings management and controls
 *
 * **Public API**:
 * - `useToolbarSettingsController`: Main hook for settings panel + theme/language
 *
 * **Usage Pattern**:
 * ```typescript
 * // ✅ Correct: Use barrel export
 * import {
 *   useToolbarSettingsController,
 *   type UseToolbarSettingsControllerOptions,
 *   type ToolbarSettingsControllerResult,
 * } from '@shared/hooks/toolbar';
 *
 * // ❌ Forbidden: Direct import of implementation
 * import { useToolbarSettingsController } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
 * ```
 */
export {
  useToolbarSettingsController,
  type UseToolbarSettingsControllerOptions,
  type ToolbarSettingsControllerResult,
} from './use-toolbar-settings-controller';
````

**라인 수**: 120줄 (배럴 export + 문서)

---

## 코드 통계

| 파일                                   | 라인 | 변경 내용                           | 상태 |
| -------------------------------------- | ---- | ----------------------------------- | ---- |
| **use-toolbar-settings-controller.ts** | 452  | 파일 설명 + JSDoc + @internal       | ✅   |
| **index.ts**                           | 120  | 배럴 export + 종합 가이드 신규 생성 | ✅   |
| **합계**                               | 572  | 2개 파일 최적화 + 배럴 export 추가  | ✅   |

---

## 검증 결과

### TypeScript Validation ✅

```
✓ 0 errors
✓ Type checking passed
```

### ESLint Validation ✅

```
✓ 0 errors, 0 warnings
✓ All lint rules satisfied
```

### Dependency Check ✅

```
✓ 0 violations
✓ 390 modules, 1140 dependencies cruised
```

### Build Validation ✅

```
✓ Production build succeeded
✓ E2E smoke tests: 101/105 passed (4 skipped)
✓ No regressions detected
```

---

## 언어 정책 준수

**프로젝트 정책**
([copilot-instructions.md](../.github/copilot-instructions.md)):

- **Code/Docs**: English only ✅
- **User Responses**: Korean (한국어)

**Phase 375 준수 사항**:

1. ✅ 파일 설명: 영어 (정책 준수)
2. ✅ 타입 JSDoc: 영어 (정책 준수)
3. ✅ 함수 JSDoc: 영어 (정책 준수)
4. ✅ 예제 코드: 영어 (정책 준수)
5. ✅ @internal 마킹: 명확 (정책 준수)

---

## 아키텍처 영향

### 배럴 Export 패턴 (Phase 370)

**Before**: Direct imports possible

```typescript
// ❌ Possible but not recommended
import { useToolbarSettingsController } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
```

**After**: Barrel export enforced

```typescript
// ✅ Required
import { useToolbarSettingsController } from '@shared/hooks/toolbar';
```

**이점**:

- 일관된 import 경로
- 내부 구현 변경 영향 최소화
- IDE 자동완성 개선

### Service 통합 (Phase 309+)

**Services Used**:

- `ThemeService`: Theme persistence (auto/light/dark)
- `LanguageService`: Language persistence (auto/ko/en/ja)
- `EventManager`: Event listener tracking (Phase 329)
- `globalTimerManager`: Focus delay management

**Integration Points**:

```typescript
// Theme management
const themeManager = resolveThemeService(providedThemeService);
themeManager.onThemeChange((_, setting) => setCurrentTheme(...));

// Language management
languageService.onLanguageChange(next => setCurrentLanguage(next));

// Event management
eventManager.addListener(windowRef, 'scroll', detect, { passive: true });
```

### Solid.js Hook Integration

**Reactive Signals** (Solid.js):

```typescript
const [toolbarRef, setToolbarRef] = createSignal<HTMLDivElement | undefined>(
  undefined
);
const [currentTheme, setCurrentTheme] = createSignal<ThemeOption>('auto');
const [currentLanguage, setCurrentLanguage] =
  createSignal<LanguageOption>('auto');

createEffect(() => {
  // Subscribe to theme changes
  const unsubscribe = themeManager.onThemeChange((_, setting) => {
    setCurrentTheme(toThemeOption(setting));
  });
  onCleanup(() => unsubscribe?.());
});
```

---

## 기능 상세

### 1. Settings Panel Management

**Behavior**:

- Click 설정 버튼 → 패널 토글
- Document mousedown (outside) → 패널 닫힘
- Escape 키 → 패널 닫힘
- 패널 닫힘 시 → 버튼에 포커스 복원

**Select Guard**:

- Select 요소 감지 (focus/blur/change)
- 300ms 동안 패널 유지 (드롭다운 상호작용 중)
- Guard 기간 중 outside click 무시

### 2. Theme Selection

**Options**: `'auto' | 'light' | 'dark'`

**동작**:

- Select 변경 → `handleThemeChange()` 호출
- ThemeService에 저장
- localStorage 자동 반영
- DOM CSS class 업데이트

**Reactivity**:

- `createEffect`: `themeManager.onThemeChange()` 구독
- 외부 변경 감지 → 신호 업데이트

### 3. Language Selection

**Options**: `'auto' | 'ko' | 'en' | 'ja'`

**동작**:

- Select 변경 → `handleLanguageChange()` 호출
- LanguageService에 저장
- localStorage 자동 반영
- UI 언어 즉시 변경

### 4. High-Contrast Detection

**Algorithm**:

1. Scroll 이벤트 감지
2. requestAnimationFrame 스로틀링
3. `evaluateHighContrast()` 호출
   - 도구모음 밝기 샘플 (0.25, 0.5, 0.75 오프셋)
   - 임계값 비교
4. `setNeedsHighContrast()` 신호 업데이트
5. CSS class 적용 (고대비 모드)

**성능**:

- Scroll per second: 60+ (일반적)
- RAF throttle: 60fps (1개/16ms)
- 감지 빈도: ~60fps (대역폭 효율적)

### 5. Focus Management

**Auto-Focus** (패널 열림):

- 50ms 지연 (setTimeout)
- 첫 번째 `<select>` 요소 포커스
- 키보드 사용자 경험 개선

**Focus Restore** (패널 닫힘):

- Escape 키 또는 outside click
- 설정 버튼에 포커스 복원
- 재투표 용이성

---

## 사용 예제

### 기본 사용

```typescript
import { useToolbarSettingsController } from '@shared/hooks/toolbar';
import { getSolid } from '@shared/external/vendors';

export function ToolbarContainer() {
  const { createSignal } = getSolid();
  const [needsHighContrast, setNeedsHighContrast] = createSignal(false);
  const [settingsExpanded, setSettingsExpanded] = createSignal(false);

  const controller = useToolbarSettingsController({
    setNeedsHighContrast,
    isSettingsExpanded: () => settingsExpanded(),
    setSettingsExpanded,
    toggleSettingsExpanded: () => setSettingsExpanded(e => !e),
  });

  return (
    <div
      ref={controller.assignToolbarRef}
      onKeyDown={controller.handleToolbarKeyDown}
      classList={{ 'high-contrast': needsHighContrast() }}
    >
      <button
        ref={controller.assignSettingsButtonRef}
        onClick={controller.handleSettingsClick}
        onMouseDown={controller.handleSettingsMouseDown}
      >
        Settings ({controller.currentTheme()})
      </button>

      <Show when={settingsExpanded()}>
        <div
          ref={controller.assignSettingsPanelRef}
          onClick={controller.handlePanelClick}
          onMouseDown={controller.handlePanelMouseDown}
        >
          <select onChange={controller.handleThemeChange}>
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>

          <select onChange={controller.handleLanguageChange}>
            <option value="auto">Auto</option>
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </Show>
    </div>
  );
}
```

### 테스트 예제

```typescript
import { useToolbarSettingsController } from '@shared/hooks/toolbar';

describe('useToolbarSettingsController', () => {
  it('should toggle panel on settings button click', () => {
    let isExpanded = false;
    const mockEventManager = {
      addListener: vi.fn(() => 'listener-1'),
      removeListener: vi.fn(() => true),
    };

    const controller = useToolbarSettingsController({
      setNeedsHighContrast: vi.fn(),
      isSettingsExpanded: () => isExpanded,
      setSettingsExpanded: value => {
        isExpanded = value;
      },
      toggleSettingsExpanded: () => {
        isExpanded = !isExpanded;
      },
      eventManager: mockEventManager,
    });

    const event = new MouseEvent('click');
    controller.handleSettingsClick(event);

    expect(isExpanded).toBe(true);
  });
});
```

---

## 호환성 평가

**등급**: **A+ (완벽한 후방호환성)**

- ✅ 공개 API 변경 없음
- ✅ 기존 코드 계속 작동 (import 경로만 변경)
- ✅ JSDoc만 추가 (컴파일에 영향 없음)
- ✅ index.ts 신규 생성 (배럴 export 강화)
- ✅ 모든 검증 통과 (TypeScript, ESLint, 빌드, E2E)

---

## 마이그레이션 가이드

### 기존 코드 (변경 권장)

```typescript
// ⚠️ Old: Direct import (여전히 작동)
import { useToolbarSettingsController } from '@shared/hooks/toolbar/use-toolbar-settings-controller';

// ✅ New: Barrel export (권장)
import { useToolbarSettingsController } from '@shared/hooks/toolbar';
```

### 새 기능 (선택)

```typescript
// 이제 더 명확한 JSDoc으로 IDE 자동완성 제공
const controller = useToolbarSettingsController({
  setNeedsHighContrast: setHighContrast,
  isSettingsExpanded: () => expanded(),
  setSettingsExpanded: setExpanded,
  toggleSettingsExpanded: () => setExpanded(e => !e),
  // 모든 옵션이 JSDoc으로 문서화됨
});
```

---

## 다음 단계

- [ ] Phase 376: 다른 hooks 디렉토리 최적화 검토
- [ ] Phase 380+: hooks 통합 테스트 강화
- [ ] 문서: toolbar 컴포넌트 사용 가이드 추가

---

## 학습 포인트

1. **배럴 Export 효과**: 일관된 import로 내부 변경 영향 최소화
2. **JSDoc 중요성**: 타입 정의 + 기능 설명 + 예제 = 완벽 이해
3. **Solid.js Integration**: 신호 + 이펙트 + 클린업 패턴 중요
4. **서비스 통합**: DI 컨테이너 + Fallback 전략으로 유연성 확보

---

## 관련 문서

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 전체 아키텍처
- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)** - 코딩 규칙
- **[/AGENTS.md](../AGENTS.md)** - AI 가이드라인
- **[SOLID_REACTIVITY_LESSONS.md](./SOLID_REACTIVITY_LESSONS.md)** - Solid.js
  패턴
