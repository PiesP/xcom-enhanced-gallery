# Phase 9.15 & 9.16 상세 검토 보고서

> 작성일: 2025-10-08  
> 작성자: AI Agent (사용자 요청)  
> 목적: Phase 9.15 (UI-SURFACE-CONSISTENCY)와 Phase 9.16
> (GLASSMORPHISM-CONDITIONAL) 실행 가능성 평가

---

## 📊 Executive Summary

| Phase    | 현재 상태 | 난이도      | 예상 시간 | 우선순위      | 권장 조치                   |
| -------- | --------- | ----------- | --------- | ------------- | --------------------------- |
| **9.15** | 95% 완료  | Trivial     | 5분       | LOW → TRIVIAL | Phase 9.14에 흡수 가능      |
| **9.16** | 설계 필요 | Medium-High | 1-2시간   | LOW → MEDIUM  | 별도 Phase로 진행 가치 있음 |

**핵심 발견**:

- ✅ **Phase 9.15 목표는 이미 달성됨**: 툴바/모달이 통일된 시맨틱 토큰 사용 중
- ⚠️ **유일한 잔여 작업**: design-tokens.semantic.css에 중복 토큰 정의 제거
  (5줄)
- ⚠️ **Phase 9.16은 새로운 기능**: 조건부 glassmorphism 활성화 시스템 구축 필요

---

## 🔍 Phase 9.15: UI-SURFACE-CONSISTENCY 상세 분석

### 1. 원래 목표

> "툴바/모달 surface 스타일 통일, 디자인 토큰 기반 일관성 확보"

### 2. 현재 달성 상태

#### ✅ 이미 완료된 사항

**2.1. 시맨틱 토큰 사용** (`design-tokens.semantic.css`)

```css
/* Line 41-42: 툴바 배경 토큰 */
--xeg-gallery-bg: var(--color-bg-primary);
--xeg-bg-toolbar: var(--color-bg-surface);

/* Line 224-232: 컴포넌트 토큰 (semantic 위임) */
--xeg-comp-toolbar-bg: var(--color-bg-surface);
--xeg-comp-toolbar-border: var(--color-border-default);
--xeg-comp-toolbar-shadow: var(--shadow-md);
--xeg-comp-toolbar-radius: var(--xeg-radius-lg);
--xeg-comp-toolbar-z-index: var(--xeg-layer-toolbar);

--xeg-comp-modal-bg: var(--xeg-modal-bg);
--xeg-comp-modal-border: var(--xeg-modal-border);
--xeg-comp-modal-shadow: var(--shadow-lg);
--xeg-comp-modal-radius: var(--xeg-radius-xl);
--xeg-comp-modal-z-index: var(--xeg-layer-modal);
```

**2.2. Toolbar 일관성** (`Toolbar.module.css` Line 7-10)

```css
.galleryToolbar {
  background: var(--xeg-bg-toolbar);
  border: 1px solid var(--color-border-default);
  border-radius: var(--xeg-radius-lg);
  /* ... */
}
```

**2.3. SettingsModal 일관성** (`SettingsModal.module.css` Line 14-16)

```css
.modal {
  /* ... */
  background: var(--xeg-modal-bg);
  border: 1px solid var(--xeg-modal-border);
}
```

**2.4. 기존 테스트 통과**

- ✅ `glass-surface-consistency.test.ts`: 18/18 PASS
- ✅ `modal-toolbar-visual-consistency.test.ts`: 포함되어 PASS
- ✅ `surface-glass-unification.test.ts`: 시맨틱 토큰 사용 검증
- ✅ `glass-surface-removal.test.ts`: 레거시 glass-surface 클래스 제거 확인

#### ⚠️ 유일한 잔여 이슈: 중복 토큰 정의

**위치**: `design-tokens.semantic.css` Line 135-147

```css
/* Line 135-140: 첫 번째 정의 */
/* Surface Glass - Unified Tokens */
--xeg-surface-glass-bg: var(--color-glass-bg);
--xeg-surface-glass-border: var(--color-glass-border);
--xeg-surface-glass-shadow: var(--shadow-lg);

/* Line 142-147: 중복 정의 (동일 내용) */
/* Surface Glass - Unified Tokens */
--xeg-surface-glass-bg: var(--color-glass-bg);
--xeg-surface-glass-border: var(--color-glass-border);
--xeg-surface-glass-shadow: var(--shadow-lg);
```

**영향**:

- ❌ CSS 파싱 시 두 번째 정의가 첫 번째를 덮어씀 (기능적으로는 동일)
- ❌ 코드 가독성 저하
- ❌ 유지보수 비용 증가 (수정 시 2곳 모두 변경 필요)

### 3. 수정 방안 (Trivial)

**RED Phase**: 중복 감지 테스트 작성

```typescript
// test/unit/lint/design-tokens-duplication.scan.red.test.ts
it('should not have duplicate token definitions', () => {
  const css = readFileSync(
    'src/shared/styles/design-tokens.semantic.css',
    'utf-8'
  );
  const tokenNames = css.match(/--[\w-]+:/g) || [];
  const uniqueTokens = new Set(tokenNames);
  expect(tokenNames.length).toBe(uniqueTokens.size);
});
```

**GREEN Phase**: 중복 제거 (5줄 삭제)

```diff
  /* Surface Glass - Unified Tokens */
  --xeg-surface-glass-bg: var(--color-glass-bg);
  --xeg-surface-glass-border: var(--color-glass-border);
  --xeg-surface-glass-shadow: var(--shadow-lg);

- /* Surface Glass - Unified Tokens */
- --xeg-surface-glass-bg: var(--color-glass-bg);
- --xeg-surface-glass-border: var(--color-glass-border);
- --xeg-surface-glass-shadow: var(--shadow-lg);
```

**예상 소요 시간**: 5분 (수정) + 1분 (테스트/빌드)

### 4. 결론: Phase 9.15

**상태**: ✅ 95% 완료 (목표 대부분 달성)  
**잔여 작업**: 중복 토큰 5줄 제거 (Trivial)  
**권장 조치**: **Phase 9.14에 흡수** 또는 **독립 Phase로 5분 처리**

---

## 🎨 Phase 9.16: GLASSMORPHISM-CONDITIONAL 상세 분석

### 1. 원래 목표

> "조건부 glassmorphism 활성화 검토 (성능/접근성 고려)"

### 2. 현재 상태 (비활성화)

#### 2.1. CSS 현황: backdrop-filter 비활성화

**Toolbar.module.css** (4곳)

```css
/* Line 313-314: prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

/* Line 389-390, 441-442, 470-471: 고대비/미디어 쿼리 */
backdrop-filter: none !important;
-webkit-backdrop-filter: none !important;
```

**SettingsModal.module.css** (1곳)

```css
/* Line 234-235: prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
```

**결론**: 현재 glassmorphism은 **완전히 비활성화** 상태

#### 2.2. 디자인 토큰은 준비됨

```css
/* design-tokens.semantic.css */
--xeg-surface-glass-bg: var(--color-glass-bg);
--xeg-surface-glass-border: var(--color-glass-border);
--xeg-surface-glass-shadow: var(--shadow-lg);
--xeg-surface-glass-bg-hover: rgba(255, 255, 255, 0.15);
--xeg-surface-glass-shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.2);
```

**문제**: 토큰은 정의되어 있지만, **활성화 메커니즘 없음**

### 3. 구현 설계 (Medium-High 난이도)

#### 3.1. 요구사항

| ID     | 요구사항                                         | 우선순위 | 난이도 |
| ------ | ------------------------------------------------ | -------- | ------ |
| **R1** | 브라우저 지원 감지 (`@supports backdrop-filter`) | High     | Low    |
| **R2** | `prefers-reduced-motion` 자동 감지 및 비활성화   | High     | Low    |
| **R3** | 사용자 수동 토글 (SettingsModal)                 | Medium   | Medium |
| **R4** | 성능 레벨별 조건부 적용                          | Low      | High   |
| **R5** | 테스트: 조건별 동작 검증                         | High     | Medium |

#### 3.2. 아키텍처 설계

**Option A: CSS-only (권장 - 단순함)**

```css
/* design-tokens.semantic.css */
:root {
  --xeg-glassmorphism-blur: 0px; /* 기본: OFF */
}

/* 브라우저 지원 + 사용자 선호 */
@supports (backdrop-filter: blur(10px)) {
  :root:not([data-reduced-motion='true']) {
    --xeg-glassmorphism-blur: 10px;
  }
}

/* 사용자 수동 비활성화 */
[data-glassmorphism='false'] {
  --xeg-glassmorphism-blur: 0px;
}

/* Toolbar/Modal 적용 */
.galleryToolbar {
  backdrop-filter: blur(var(--xeg-glassmorphism-blur));
  -webkit-backdrop-filter: blur(var(--xeg-glassmorphism-blur));
}
```

**Option B: JS-driven (복잡함)**

```typescript
// shared/services/GlassmorphismService.ts
class GlassmorphismService {
  private enabled = createSignal(false);

  constructor() {
    this.detectSupport();
    this.detectReducedMotion();
  }

  private detectSupport(): boolean {
    return CSS.supports('backdrop-filter', 'blur(10px)');
  }

  private detectReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  toggle(enabled: boolean): void {
    this.enabled[1](enabled);
    document.documentElement.dataset.glassmorphism = String(enabled);
  }
}
```

#### 3.3. TDD 사이클

**RED Phase**: 조건부 glassmorphism 테스트 작성

```typescript
// test/unit/styles/glassmorphism-conditional.test.ts
describe('Conditional Glassmorphism', () => {
  it('should disable glassmorphism when prefers-reduced-motion', () => {
    // Mock matchMedia
    window.matchMedia = vi.fn(() => ({ matches: true }));

    const computed = getComputedStyle(document.documentElement);
    expect(computed.getPropertyValue('--xeg-glassmorphism-blur')).toBe('0px');
  });

  it('should enable glassmorphism when supported and motion allowed', () => {
    window.matchMedia = vi.fn(() => ({ matches: false }));

    const computed = getComputedStyle(document.documentElement);
    expect(computed.getPropertyValue('--xeg-glassmorphism-blur')).toBe('10px');
  });
});
```

**GREEN Phase**: 최소 구현 (CSS-only, Option A)

```css
/* 1. design-tokens.semantic.css 수정 */
:root {
  --xeg-glassmorphism-blur: 0px;
}

@supports (backdrop-filter: blur(10px)) {
  :root {
    --xeg-glassmorphism-blur: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --xeg-glassmorphism-blur: 0px;
  }
}

/* 2. Toolbar.module.css 수정 */
.galleryToolbar {
  backdrop-filter: blur(var(--xeg-glassmorphism-blur));
  -webkit-backdrop-filter: blur(var(--xeg-glassmorphism-blur));
}

/* 기존 backdrop-filter: none 제거 */
```

**REFACTOR Phase**: 사용자 토글 추가

```typescript
// SettingsModal.tsx
const [glassmorphism, setGlassmorphism] = createSignal(true);

createEffect(() => {
  document.documentElement.dataset.glassmorphism = String(glassmorphism());
});

// 설정 UI 추가
<select onChange={(e) => setGlassmorphism(e.target.value === 'on')}>
  <option value="on">On (modern browsers)</option>
  <option value="off">Off (better performance)</option>
</select>
```

### 4. 리스크 분석

| 리스크                        | 영향도 | 발생 가능성 | 완화 방안                        |
| ----------------------------- | ------ | ----------- | -------------------------------- |
| 구형 브라우저 성능 저하       | High   | Medium      | `@supports` 감지로 자동 비활성화 |
| `prefers-reduced-motion` 무시 | Medium | Low         | CSS 미디어 쿼리로 강제 비활성화  |
| CSS 변수 미지원 브라우저      | Low    | Very Low    | Fallback 값 제공 (0px)           |
| 복잡도 증가                   | Medium | High        | CSS-only 옵션 선택으로 완화      |

### 5. 예상 작업량

**Minimum Viable Product (CSS-only)**:

- [ ] RED: 테스트 작성 (20분)
- [ ] GREEN: CSS 변수 + @supports + 미디어 쿼리 (30분)
- [ ] REFACTOR: 기존 backdrop-filter: none 제거 (10분)
- [ ] 검증: 빌드/테스트 (10분)
- **합계**: ~1시간

**Full Implementation (JS-driven + 사용자 토글)**:

- [ ] MVP (1시간)
- [ ] GlassmorphismService 작성 (30분)
- [ ] SettingsModal UI 추가 (20분)
- [ ] 추가 테스트 (JS 로직) (20분)
- **합계**: ~2시간

### 6. 결론: Phase 9.16

**상태**: ⚠️ 설계 필요 (현재 비활성화)  
**난이도**: Medium-High (CSS-only 선택 시 Medium으로 하향)  
**예상 시간**: 1-2시간  
**권장 조치**: **별도 Phase로 진행** (기능 추가이므로 가치 있음)

**권장 구현 순서**:

1. **Phase 9.16.1: MVP (CSS-only)** - 1시간, High Priority
2. **Phase 9.16.2: 사용자 토글** - 30분, Medium Priority (Optional)

---

## 🎯 최종 권장 사항

### Immediate Actions (높은 우선순위)

1. **Phase 9.15: 중복 토큰 제거 (5분)**
   - 방법 1: Phase 9.14에 흡수 (지금 즉시)
   - 방법 2: 독립 Phase로 5분 처리
   - **권장**: 방법 1 (Phase 9.14 마무리 단계)

2. **Phase 9.16.1: Conditional Glassmorphism MVP (1시간)**
   - CSS-only 구현 (Option A)
   - `@supports` + `prefers-reduced-motion` 자동 감지
   - 기존 테스트 확장 (조건부 동작 검증)
   - **권장**: 다음 Phase로 진행

### Future Work (낮은 우선순위)

3. **Phase 9.16.2: 사용자 Glassmorphism 토글 (30분)**
   - SettingsModal UI 추가
   - Optional (MVP만으로도 충분한 가치 제공)

---

## 📋 체크리스트

### Phase 9.15 완료 조건

- [ ] design-tokens.semantic.css 중복 토큰 제거 (Line 142-147)
- [ ] 중복 감지 테스트 작성 (Optional)
- [ ] 빌드 검증 (npm run build)
- [ ] 기존 18개 테스트 PASS 유지

### Phase 9.16.1 MVP 완료 조건

- [ ] RED: glassmorphism-conditional.test.ts 작성
- [ ] GREEN: CSS 변수 + @supports + prefers-reduced-motion
- [ ] REFACTOR: Toolbar/Modal에서 backdrop-filter: none 제거
- [ ] 빌드 검증 + 시각적 확인 (Chrome/Firefox)
- [ ] 접근성 검증 (reduced-motion 존중)

---

## 📖 참고 자료

**관련 파일**:

- `src/shared/styles/design-tokens.semantic.css` (토큰 정의)
- `src/shared/components/ui/Toolbar/Toolbar.module.css` (Toolbar 스타일)
- `src/shared/components/ui/SettingsModal/SettingsModal.module.css` (Modal
  스타일)
- `test/refactoring/glass-surface-consistency.test.ts` (기존 테스트)
- `test/refactoring/modal-toolbar-visual-consistency.test.ts` (일관성 테스트)

**MDN 문서**:

- [backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [@supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports)
- [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

**브라우저 지원**:

- Chrome 76+ (2019년 7월)
- Firefox 103+ (2022년 7월)
- Safari 9+ (2015년 9월, -webkit- prefix)
- Edge 79+ (2020년 1월)

---

**문서 이력**:

- 2025-10-08: 초안 작성 (Phase 9.14 완료 후 검토)
