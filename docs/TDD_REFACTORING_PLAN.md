# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-13 **상태**: Phase 43까지 완료 ✅

## 프로젝트 상태

- **빌드**: dev 734.31 KB / prod 322.07 KB ✅
- **테스트**: 689 passing, 1 skipped (정책 가드) ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (268 modules, 738 dependencies) ✅
- **번들 예산**: 322.07 KB / 325 KB (2.93 KB 여유) ⚠️ 예산 근접

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-43 완료 기록
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙

---

## 현재 상태

### Phase 43까지 완료 ✅

Phase 1-43의 모든 리팩토링 작업이 완료되었습니다. 세부 내역은
`TDD_REFACTORING_PLAN_COMPLETED.md`를 참조하세요.

**주요 성과**:

- ✅ ToolbarWithSettings 통합 완료
- ✅ Settings Modal 레거시 코드 완전 제거
- ✅ 테스트 커버리지 개선 (skipped 96% 감소)
- ✅ 의존성 정책 강화 및 그래프 갱신
- ✅ 문서 간소화 완료

---

## 활성 작업 계획

### Phase 44-50: Toolbar Expandable Settings (번들 최적화 전략)

**목표**: 설정 모달을 툴바 내부 확장 패널로 전환하여 번들 크기 최적화 및 UX 개선

**현황 분석**:

- 현재 번들: 322.07 KB / 325 KB (2.93 KB 여유) ⚠️
- SettingsModal 구성:
  - Lazy loading 적용 (`ToolbarWithSettings.tsx`)
  - Focus trap, scroll lock 훅 의존
  - 별도 backdrop, positioning 로직 (401줄)
- 예상 절감: ~7-10 KB (훅, 레이아웃 로직, 중복 스타일 제거)

**전략**:

1. **Inline Expansion 방식**: 모달 대신 툴바 내부 접이식 패널로 전환
2. **의존성 제거**: `useFocusTrap`, `useScrollLock`, `useModalPosition` 훅
   불필요
3. **디자인 일관성 유지**: glassmorphism 토큰 기반 스타일 유지
4. **접근성 준수**: ARIA collapse pattern, 키보드 네비게이션

---

### Phase 44: Toolbar 확장 상태 관리 추가 (TDD)

**목표**: Toolbar에 설정 패널 확장/축소 상태 및 애니메이션 지원 추가

#### Step 1: 상태 신호 추가 (RED → GREEN)

**파일**: `src/shared/state/signals/toolbar.signals.ts`

**RED 테스트** (`test/unit/state/toolbar-expandable.test.ts`):

```typescript
describe('Toolbar Expandable Settings State', () => {
  it('확장 상태 신호가 기본 false여야 함', () => {
    const { isSettingsExpanded } = getToolbarState();
    expect(isSettingsExpanded()).toBe(false);
  });

  it('토글 액션으로 확장 상태가 반전되어야 함', () => {
    const { isSettingsExpanded, toggleSettingsExpanded } = getToolbarState();
    toggleSettingsExpanded();
    expect(isSettingsExpanded()).toBe(true);
  });
});
```

**GREEN 구현**:

```typescript
// toolbar.signals.ts에 추가
export interface ToolbarState {
  // ...existing
  isSettingsExpanded: boolean;
}

const [isSettingsExpanded, setSettingsExpanded] = createSignal(false);

export const toolbarActions = {
  // ...existing
  toggleSettingsExpanded: () => setSettingsExpanded(!isSettingsExpanded()),
  setSettingsExpanded: (expanded: boolean) => setSettingsExpanded(expanded),
};
```

#### Step 2: CSS 애니메이션 토큰 추가 (RED → GREEN)

**파일**: `src/shared/styles/design-tokens.component.css`

**RED 테스트** (`test/styles/toolbar-expandable-tokens.test.ts`):

```typescript
it('툴바 확장 패널 애니메이션 토큰이 정의되어야 함', () => {
  const tokens = [
    '--xeg-toolbar-panel-transition',
    '--xeg-toolbar-panel-height',
    '--xeg-toolbar-panel-max-height',
  ];
  tokens.forEach(token => {
    expect(designTokens.includes(token)).toBe(true);
  });
});
```

**GREEN 구현**:

```css
/* design-tokens.component.css에 추가 */
--xeg-toolbar-panel-transition:
  height var(--xeg-duration-normal) var(--xeg-ease-standard),
  opacity var(--xeg-duration-fast) var(--xeg-ease-standard);
--xeg-toolbar-panel-height: 0;
--xeg-toolbar-panel-max-height: 280px; /* 설정 2개 기준 */
```

#### Step 3: Toolbar CSS 확장 스타일 추가

**파일**: `src/shared/components/ui/Toolbar/Toolbar.module.css`

```css
/* 확장 가능한 설정 패널 영역 */
.settingsPanel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
  transition: var(--xeg-toolbar-panel-transition);
  background: transparent;
  border-top: 0 solid var(--xeg-modal-border);
}

.settingsPanel[data-expanded='true'] {
  height: auto;
  max-height: var(--xeg-toolbar-panel-max-height);
  opacity: 1;
  padding: var(--space-md);
  border-top-width: 1px;
}
```

**완료 조건**:

- ✅ 상태 신호 테스트 통과 (RED → GREEN)
- ✅ CSS 토큰 가드 테스트 통과
- ✅ 타입 에러 0개 유지
- ✅ 빌드 성공 (크기 변화 없음 예상)

---

### Phase 45: 설정 컨트롤 Toolbar 내부로 이동 (TDD)

**목표**: SettingsModal의 테마/언어 선택 UI를 Toolbar 확장 패널로 이동

#### Step 1: 설정 컨트롤 컴포넌트 분리 (RED → GREEN)

**파일**: `src/shared/components/ui/Settings/SettingsControls.tsx` (신규)

**RED 테스트** (`test/unit/components/settings-controls.test.tsx`):

```typescript
describe('SettingsControls', () => {
  it('테마 선택 컨트롤이 렌더링되어야 함', () => {
    const { container } = render(() => (
      <SettingsControls currentTheme="auto" onThemeChange={vi.fn()} />
    ));
    expect(container.querySelector('select[id="theme-select"]')).toBeTruthy();
  });
});
```

**GREEN 구현**:

```typescript
// SettingsControls.tsx (SettingsModal에서 추출)
export interface SettingsControlsProps {
  currentTheme: ThemeOption;
  currentLanguage: LanguageOption;
  onThemeChange: (theme: ThemeOption) => void;
  onLanguageChange: (lang: LanguageOption) => void;
  compact?: boolean; // Toolbar 내부용 컴팩트 모드
}

export function SettingsControls(props: SettingsControlsProps): JSXElement {
  // SettingsModal의 select 로직 재사용
  // compact 모드 시 레이블 간소화
}
```

#### Step 2: Toolbar에 패널 통합

**파일**: `src/shared/components/ui/Toolbar/Toolbar.tsx`

```typescript
// Toolbar 컴포넌트에 추가
const [isExpanded, setExpanded] = createSignal(false);

const handleToggleSettings = () => {
  setExpanded(!isExpanded());
  if (props.onOpenSettings) {
    props.onOpenSettings(); // 레거시 호환
  }
};

// JSX에 추가
<div class={styles.settingsPanel} data-expanded={isExpanded()}>
  <SettingsControls
    compact={true}
    currentTheme={currentTheme()}
    onThemeChange={handleThemeChange}
    /* ... */
  />
</div>;
```

**완료 조건**:

- ✅ SettingsControls 단위 테스트 통과
- ✅ Toolbar 확장 동작 E2E 검증 (Playwright)
- ✅ 접근성: ARIA expanded 속성 추가
- ✅ 번들 크기: ~320 KB 예상 (lazy loading 제거로 초기 감소)

---

### Phase 46: Glassmorphism 디자인 일관성 검증

**목표**: 확장 패널이 기존 Toolbar와 동일한 glassmorphism 스타일 적용

#### CSS 통일 검증 테스트

**파일**: `test/refactoring/toolbar-expandable-design.test.ts`

```typescript
describe('Toolbar Expandable Panel Design Consistency', () => {
  it('확장 패널이 semantic modal 토큰을 사용해야 함', () => {
    const css = readFileSync(TOOLBAR_CSS_PATH, 'utf-8');
    expect(css).toMatch(/var\(--xeg-modal-bg\)/);
    expect(css).toMatch(/var\(--xeg-modal-border\)/);
  });

  it('하드코딩된 색상 값이 없어야 함', () => {
    // 기존 hardcoded-color-values.ql 검증 재사용
  });
});
```

**완료 조건**:

- ✅ 디자인 토큰 사용 검증 통과
- ✅ 툴바/패널 색상 일관성 시각적 확인
- ✅ prefers-contrast: high 대응 확인

---

### Phase 47: 접근성 및 키보드 네비게이션

**목표**: ARIA collapse pattern 구현 및 키보드 지원

#### Step 1: ARIA 속성 추가 (RED → GREEN)

**RED 테스트** (`test/unit/toolbar-expandable-a11y.test.tsx`):

```typescript
it('설정 버튼에 aria-expanded 속성이 있어야 함', () => {
  const { container } = render(() => <Toolbar {...props} />);
  const btn = container.querySelector('[data-gallery-element="settings"]');
  expect(btn?.getAttribute('aria-expanded')).toBe('false');
});
```

**GREEN 구현**:

```typescript
<IconButton
  aria-expanded={isExpanded()}
  aria-controls="toolbar-settings-panel"
  /* ... */
/>
<div
  id="toolbar-settings-panel"
  role="region"
  aria-label="설정 패널"
  /* ... */
/>
```

#### Step 2: 키보드 네비게이션

- **Enter/Space**: 설정 버튼으로 패널 토글
- **Escape**: 패널 닫기
- **Tab**: 패널 내 컨트롤 간 이동

**완료 조건**:

- ✅ ARIA 속성 테스트 통과
- ✅ 키보드 네비게이션 E2E 검증 (Playwright)
- ✅ 스크린 리더 호환성 확인 (수동)

---

### Phase 48: SettingsModal 레거시 제거

**목표**: 독립 모달 컴포넌트 및 의존 훅 제거

#### Step 1: 사용처 전환 확인

**제거 대상**:

- `src/shared/components/ui/SettingsModal/SettingsModal.tsx` (401줄)
- `src/shared/components/ui/ToolbarWithSettings/` (통합됨)
- `src/shared/hooks/use-focus-trap.ts` (119줄)
- `src/shared/hooks/use-scroll-lock.ts` (63줄)
- `src/shared/hooks/use-modal-position.ts`

**마이그레이션 체크리스트**:

```typescript
// VerticalGalleryView.tsx 변경
- import { ToolbarWithSettings } from '@shared/components/ui/ToolbarWithSettings';
+ import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';

- <ToolbarWithSettings settingsPosition="toolbar-below" ... />
+ <Toolbar ... /> // 내부 패널로 처리
```

#### Step 2: 의존성 정리

```bash
# 제거될 파일들 영향 분석
npm run deps:all
# 의존성 그래프에서 제거 확인
```

**완료 조건**:

- ✅ SettingsModal 참조 0개 확인 (grep 검증)
- ✅ 테스트 파일 마이그레이션 완료
- ✅ 의존성 그래프 갱신 (모듈 수 감소)
- ✅ 번들 크기: ~315 KB 예상

---

### Phase 49: 테스트 마이그레이션

**목표**: SettingsModal 관련 테스트를 Toolbar 확장 패널 테스트로 전환

#### 마이그레이션 대상

**제거**:

- `test/features/settings/settings-modal.accessibility.test.tsx` (E2E 커버)
- `test/unit/shared/components/ui/settings-modal-focus.test.tsx` (jsdom 제약)
- `test/refactoring/settings-modal-*.test.ts` (디자인 일관성 → Toolbar 통합)

**변환**:

- `test/unit/shared/components/ui/ToolbarWithSettings.test.tsx` →
  `test/unit/shared/components/ui/Toolbar-expandable.test.tsx`
- 설정 상태 테스트 → `SettingsControls.test.tsx`

#### Playwright E2E 추가

**파일**: `playwright/smoke/toolbar-expandable.spec.ts`

```typescript
test('툴바 설정 버튼 클릭 시 패널이 확장되어야 함', async ({ page }) => {
  await harness.mountToolbar({ currentIndex: 0, totalCount: 5 });
  const settingsBtn = page.locator('[data-gallery-element="settings"]');
  await settingsBtn.click();
  await expect(page.locator('.settingsPanel')).toHaveAttribute(
    'data-expanded',
    'true'
  );
});
```

**완료 조건**:

- ✅ 단위 테스트 전환 완료
- ✅ E2E 스모크 테스트 추가 (Playwright)
- ✅ 테스트 통과율 100% 유지
- ✅ skipped 테스트 추가 없음

---

### Phase 50: 최적화 및 검증

**목표**: 번들 크기 검증, 성능 측정, 문서 갱신

#### Step 1: 번들 분석

```bash
npm run build:prod
node scripts/validate-build.js
# 예상: ~315 KB (10 KB 여유)
```

#### Step 2: 성능 벤치마크

**파일**: `test/performance/toolbar-expandable.bench.ts`

```typescript
bench('설정 패널 토글 애니메이션', async () => {
  const toolbar = document.querySelector('.galleryToolbar');
  await toolbarActions.toggleSettingsExpanded();
  // 16ms 미만 목표 (60fps)
});
```

#### Step 3: 문서 갱신

**업데이트 대상**:

- `AGENTS.md`: SettingsModal 제거, Toolbar 확장 패널 추가
- `ARCHITECTURE.md`: 컴포넌트 구조 다이어그램 갱신
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 44-50 기록 추가
- `README.md`: 기능 설명 업데이트

**완료 조건**:

- ✅ 번들 크기: 315 KB 이하 달성
- ✅ 성능 벤치: 토글 16ms 미만
- ✅ 의존성 그래프 재생성 (모듈 감소 반영)
- ✅ 문서-코드 일치성 검증

---

## 백로그 (선택적)

### 추가 번들 최적화 (Phase 50 이후)

**현재 예상**: 315 KB / 325 KB (10 KB 여유)

**고려 사항**:

1. CSS 최적화: 중복 토큰 제거, 미사용 규칙 정리 (예상 2-3 KB)
2. Tree-shaking: 미사용 export 확인, barrel export 최소화
3. 이미지/아이콘 최적화: SVG minify, 중복 제거

---

## 중기 계획 (향후 1-2주)

1. **성능 모니터링**: 번들 크기 추이 관찰, 빌드 시간 최적화 검토
2. **E2E 테스트 강화**: Playwright 스모크 테스트 확장, 주요 사용자 시나리오
   커버리지
3. **의존성 정리**: 미사용 devDependencies 검토, `depcheck` 실행 후 정리

---

## 프로젝트 건강도 지표

- **번들 크기**: 322.07 KB / 325 KB ⚠️ 예산 근접
- **테스트 통과율**: 100% (689/689) ✅
- **Skipped 테스트**: 1개 (정책 가드, 의도적) ✅
- **타입 안전성**: TypeScript strict mode ✅
- **코드 품질**: ESLint 0 warnings ✅
- **의존성 정책**: 0 violations ✅

**전반적 평가**: 프로젝트는 안정적이며 유지보수 가능한 상태입니다. Phase 1-43의
모든 리팩토링이 성공적으로 완료되었습니다.
