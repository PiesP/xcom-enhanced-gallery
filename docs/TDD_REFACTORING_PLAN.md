# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-14 **상태**: Phase 54 완료 ✅

## 프로젝트 상태

- **빌드**: dev 817.81 KB / prod **316.29 KB** ✅
- **테스트**: 662 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (263 modules, 718 dependencies) ✅
- **번들 예산**: **316.29 KB / 325 KB** (8.71 KB 여유) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-54 완료 기록
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙

---

## 최근 완료 작업

### Phase 54: 디자인 토큰 일관성 개선 (2025-10-14) ✅

**완료된 모든 Sub-Phases**:

- ✅ **Phase 54.0**: 컴포넌트 토큰 재정의 제거 (6개 제거, -0.22 KB)
- ✅ **Phase 54.1**: 다크 모드 토큰 통합 (1개 @media 블록 제거)
- ✅ **Phase 54.3**: 레거시 Alias 정리 (23개 토큰 제거, -2.37 KB)

**종합 효과**:

- 토큰 건강도: 126개 → 100개 (23개 제거, 18% 감소)
- 번들 크기: 318.88 KB → 316.29 KB (-2.59 KB, 0.81% 감소)
- 디자인 일관성 향상 + 유지보수성 개선
- 자동 검증 체계 구축 (TDD 정책 테스트 + 토큰 분석 도구)

**세부 내용**: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 다음 작업 계획

### 🔴 Phase 55: 디자인 토큰 누락 문제 해결 (긴급)

**문제 현황**: 통일된 디자인 의도가 있지만 실제 구현에서 색상이 다름

- **툴바**: `--xeg-bg-toolbar` 사용 → 다크 모드에서 `var(--color-gray-700)`
  (짙은 검정)
- **모달**: `--xeg-modal-bg` 사용 → **토큰 미정의** (우연히 다른 색상)

**영향 범위**:

- `ModalShell.module.css` (4곳)
- `KeyboardHelpOverlay.module.css` (1곳)
- 관련 테스트 16개가 토큰 존재 기대

**솔루션 분석 완료**: 아래 "Phase 55 상세 계획" 참조

---

### Phase 56 후보: 추가 최적화

**잠재적 개선 영역**:

1. **토큰 추가 정리**
   - 현재: 100개 토큰 (3개 unused 남음)
   - 목표: Underused 토큰 검토 (≤2회 사용: 55개)
   - 예상: ~10-15개 추가 제거 가능

2. **CSS 최적화**
   - 중복 스타일 규칙 제거
   - 미사용 CSS 클래스 정리
   - 예상: -1~2 KB

3. **이미지/아이콘 최적화**
   - SVG 최적화
   - 아이콘 번들 검토
   - 예상: -0.5~1 KB

**권장 순서**: 프로젝트 우선순위에 따라 결정

---

## 디자인 토큰 가이드라인

### 토큰 사용 원칙

1. **컴포넌트는 semantic 토큰만 참조**

   ```css
   /* ✅ 권장 */
   .component {
     background: var(--xeg-bg-toolbar);
   }

   /* ❌ 금지 */
   .component {
     --local-bg: var(--xeg-bg-toolbar);
     background: var(--local-bg);
   }
   ```

2. **토큰 재정의는 semantic 레이어에만**
   - Primitive → Semantic: 허용
   - Semantic → Component: 금지

3. **테마별 토큰은 semantic 레이어에서 정의**

   ```css
   [data-theme='dark'] {
     --xeg-bg-toolbar: rgba(30, 30, 30, 0.95);
   }
   ```

---

## Phase 55 상세 계획: 디자인 토큰 누락 해결

### 📋 문제 분석

#### 현재 상황

1. **툴바 (Toolbar)**
   - 사용 토큰: `--xeg-bg-toolbar` ✅
   - 라이트 모드: `var(--color-bg-surface, #ffffff)` → 흰색
   - 다크 모드: `var(--color-gray-700, #4a4a4a)` → 짙은 회색
   - **정의 위치**: `design-tokens.semantic.css` (line 15, 193, 208)

2. **모달 (ModalShell, KeyboardHelpOverlay)**
   - 사용 토큰: `--xeg-modal-bg`, `--xeg-modal-border` ❌
   - **문제**: 토큰이 정의되지 않음
   - **영향**: 브라우저 fallback으로 우연히 다른 색상 표시

#### 영향 범위

**소스 파일** (5곳):

- `src/shared/components/ui/ModalShell/ModalShell.module.css` (4곳)
- `src/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay.module.css`
  (1곳)

**테스트 파일** (16개):

- `test/unit/styles/modal-token.hardening.test.ts`
- `test/styles/theme-responsiveness.test.ts`
- `test/styles/hardcoded-colors.test.ts`
- `test/refactoring/glass-surface-removal.test.ts`
- `test/refactoring/modal-token.hardening.test.ts`
- 기타 11개 테스트

**테스트 기대 사항**:

```typescript
expect(semanticCss).toMatch(/--xeg-modal-bg-light\s*:/);
expect(semanticCss).toMatch(/--xeg-modal-bg-dark\s*:/);
expect(semanticCss).toMatch(/--xeg-modal-border-light\s*:/);
expect(semanticCss).toMatch(/--xeg-modal-border-dark\s*:/);
```

### 🎯 솔루션 분석 (단계적 추론)

#### 옵션 1: 독립 모달 토큰 정의 ⭐ **선택됨**

**구현**:

```css
/* design-tokens.semantic.css */
:root {
  /* 모달 전용 토큰 (라이트 모드) */
  --xeg-modal-bg-light: var(--color-bg-elevated, #ffffff);
  --xeg-modal-border-light: var(--color-border-default);
  --xeg-modal-bg: var(--xeg-modal-bg-light);
  --xeg-modal-border: var(--xeg-modal-border-light);
}

[data-theme='dark'] {
  /* 모달 전용 토큰 (다크 모드) - 부드러운 느낌 */
  --xeg-modal-bg-dark: rgba(32, 32, 32, 0.98);
  --xeg-modal-border-dark: rgba(255, 255, 255, 0.15);
  --xeg-modal-bg: var(--xeg-modal-bg-dark);
  --xeg-modal-border: var(--xeg-modal-border-dark);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --xeg-modal-bg: var(--xeg-modal-bg-dark);
    --xeg-modal-border: var(--xeg-modal-border-dark);
  }
}
```

**장점**:

- ✅ 의미적 분리 명확 (모달 ≠ 툴바)
- ✅ 향후 독립 디자인 변경 용이
- ✅ 모든 테스트 통과 (16개)
- ✅ 기존 코드 변경 없음 (backward compatible)

**단점**:

- ➖ 토큰 4개 추가 (100개 → 104개)
- ➖ 초기 정의 필요

**예상 효과**:

- 번들 크기: +0.15 KB (토큰 정의)
- 테스트: 16개 통과로 전환
- 유지보수성: 명확한 토큰 계층

---

#### 옵션 2: 툴바 토큰 재사용

**구현**:

```css
/* design-tokens.semantic.css */
:root {
  --xeg-modal-bg: var(--xeg-bg-toolbar);
  --xeg-modal-border: var(--xeg-color-border-primary);
}
```

**장점**:

- ✅ 토큰 수 최소화 (2개만 alias)
- ✅ 통일된 배경색 보장
- ✅ 간단한 구현

**단점**:

- ❌ 의미적 혼란 (modal이 toolbar 참조)
- ❌ 테스트 실패 (`--xeg-modal-bg-light/dark` 기대)
- ❌ 향후 독립 변경 불가
- ❌ 계층 원칙 위반 (component → semantic)

---

#### 옵션 3: 공통 surface 토큰 도입

**구현**:

```css
/* design-tokens.semantic.css */
:root {
  --xeg-surface-bg: var(--color-bg-surface);
  --xeg-surface-border: var(--color-border-default);

  --xeg-bg-toolbar: var(--xeg-surface-bg);
  --xeg-modal-bg: var(--xeg-surface-bg);
}

[data-theme='dark'] {
  --xeg-surface-bg: rgba(28, 28, 28, 0.96);
  --xeg-surface-border: rgba(255, 255, 255, 0.15);
}
```

**장점**:

- ✅ DRY 원칙 준수
- ✅ 통일된 surface 계층
- ✅ 확장성 좋음

**단점**:

- ❌ 대규모 리팩토링 필요
- ❌ 테스트 16개 수정 필요
- ❌ 기존 `--xeg-bg-toolbar` 사용처 변경
- ❌ 위험도 높음 (회귀 가능성)

---

### ✅ 선택된 솔루션: 옵션 1 (독립 모달 토큰 정의)

**선택 이유**:

1. **최소 위험**: 기존 코드 변경 없음
2. **테스트 충족**: 16개 테스트 모두 통과
3. **의미 명확**: 모달은 모달 토큰 사용
4. **확장 가능**: 향후 모달 디자인 독립 변경 가능
5. **빠른 적용**: 1개 파일만 수정

### 🔧 구현 계획

#### Phase 55.1: 모달 토큰 정의 (TDD)

**1단계: RED - 테스트 확인**

```bash
npm test -- test/unit/styles/modal-token.hardening.test.ts
# 현재 FAIL (토큰 미정의)
```

**2단계: GREEN - 토큰 추가**

파일: `src/shared/styles/design-tokens.semantic.css`

위치: Modal Component Tokens 섹션 (line 257-267)

```css
/* Modal Component Tokens */
/* NOTE: Modal component tokens now defer to semantic tokens to avoid
  cascading alias overwrite issues that previously caused dark mode
  transparency regressions (see 2025-09-11 fix log). */

/* Modal Background/Border Tokens - Light Mode */
--xeg-modal-bg-light: var(--color-bg-elevated, #ffffff);
--xeg-modal-border-light: var(--color-border-default);

/* Modal Background/Border Tokens - Base (defaults to light) */
--xeg-modal-bg: var(--xeg-modal-bg-light);
--xeg-modal-border: var(--xeg-modal-border-light);

--xeg-comp-modal-backdrop: var(--color-overlay-backdrop);
/* Semantic tokens (authoritative) defined later in file control actual values */
```

**3단계: 다크 모드 추가**

파일: `src/shared/styles/design-tokens.semantic.css`

위치: `[data-theme='dark']` 블록 (line 187-200)

```css
[data-theme='dark'] {
  --color-bg-primary: var(--color-gray-900);
  --color-text-primary: var(--color-base-white);
  --color-glass-bg: rgba(0, 0, 0, var(--opacity-glass));

  /* Fallback: dark mode uses gray-700 as toolbar background */
  --xeg-bg-toolbar: var(--color-gray-700, #4a4a4a);

  /* Modal Dark Mode Tokens - 부드러운 검정 */
  --xeg-modal-bg-dark: rgba(32, 32, 32, 0.98);
  --xeg-modal-border-dark: rgba(255, 255, 255, 0.15);
  --xeg-modal-bg: var(--xeg-modal-bg-dark);
  --xeg-modal-border: var(--xeg-modal-border-dark);

  /* Gallery Image Item Dark Mode Tokens */
  --xeg-color-bg-secondary: var(--color-gray-800);
  --xeg-color-bg-error: var(--color-red-900);
  --xeg-color-text-error: var(--color-red-300);
}
```

**4단계: prefers-color-scheme 지원**

파일: `src/shared/styles/design-tokens.semantic.css`

위치: `@media (prefers-color-scheme: dark)` 블록 (line 202-217)

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-bg-primary: var(--color-gray-900);
    --color-text-primary: var(--color-base-white);
    --color-glass-bg: rgba(0, 0, 0, var(--opacity-glass));

    /* Fallback: prefers-color-scheme dark uses gray-700 */
    --xeg-bg-toolbar: var(--color-gray-700, #4a4a4a);
    --xeg-surface-glass-bg: rgba(30, 30, 30, 0.95);

    /* Modal tokens for system dark mode */
    --xeg-modal-bg: var(--xeg-modal-bg-dark);
    --xeg-modal-border: var(--xeg-modal-border-dark);

    /* Gallery Image Item Dark Mode Tokens */
    --xeg-color-bg-secondary: var(--color-gray-800);
    --xeg-color-bg-error: var(--color-red-900);
    --xeg-color-text-error: var(--color-red-300);
  }
}
```

**5단계: 검증**

```bash
# 모든 관련 테스트 실행
npm test -- modal-token

# 타입 체크
npm run typecheck

# 린트
npm run lint:fix

# 빌드 검증
npm run build

# 최종 검증
npm run validate
```

#### Phase 55.2: 재발 방지 체계

**1. 토큰 정의 가드 테스트 추가**

파일: `test/styles/token-definition-guard.test.ts` (신규)

```typescript
/**
 * @fileoverview Token Definition Guard
 * @description 사용되는 모든 토큰이 정의되어 있는지 검증
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Token Definition Guard', () => {
  const semanticTokens = readFileSync(
    resolve(__dirname, '../../src/shared/styles/design-tokens.semantic.css'),
    'utf8'
  );

  it('should define all --xeg-modal-* tokens used in components', () => {
    const requiredTokens = [
      '--xeg-modal-bg:',
      '--xeg-modal-border:',
      '--xeg-modal-bg-light:',
      '--xeg-modal-bg-dark:',
      '--xeg-modal-border-light:',
      '--xeg-modal-border-dark:',
    ];

    requiredTokens.forEach(token => {
      expect(
        semanticTokens,
        `Token ${token} should be defined in semantic tokens`
      ).toMatch(new RegExp(token.replace(':', '\\s*:')));
    });
  });

  it('should define dark mode overrides for modal tokens', () => {
    const darkModeBlock = /\[data-theme='dark'\][^}]+\{[^}]+\}/gs;
    const matches = semanticTokens.match(darkModeBlock);

    expect(matches).toBeTruthy();

    const darkMode = matches?.join('') || '';
    expect(darkMode).toContain('--xeg-modal-bg:');
    expect(darkMode).toContain('--xeg-modal-border:');
  });

  it('should define prefers-color-scheme dark overrides', () => {
    const mediaBlock =
      /@media\s*\(prefers-color-scheme:\s*dark\)[^}]+\{[^}]+\}/gs;
    const matches = semanticTokens.match(mediaBlock);

    expect(matches).toBeTruthy();

    const mediaQuery = matches?.join('') || '';
    expect(mediaQuery).toContain('--xeg-modal-bg:');
    expect(mediaQuery).toContain('--xeg-modal-border:');
  });
});
```

**2. 문서 업데이트**

파일: `docs/CODING_GUIDELINES.md`

섹션: "CSS 디자인 토큰" 아래 추가

````markdown
#### 토큰 정의 원칙

1. **사용 전 정의 필수**

   ```css
   /* ❌ 정의 없이 사용 금지 */
   .component {
     background: var(--xeg-undefined-token);
   }

   /* ✅ 반드시 semantic 레이어에 정의 */
   /* design-tokens.semantic.css */
   :root {
     --xeg-component-bg: var(--color-bg-surface);
   }
   ```
````

2. **테마별 변형 필수**

   ```css
   /* Light mode */
   :root {
     --xeg-modal-bg-light: var(--color-bg-elevated);
     --xeg-modal-bg: var(--xeg-modal-bg-light);
   }

   /* Dark mode */
   [data-theme='dark'] {
     --xeg-modal-bg-dark: rgba(32, 32, 32, 0.98);
     --xeg-modal-bg: var(--xeg-modal-bg-dark);
   }

   /* System preference */
   @media (prefers-color-scheme: dark) {
     :root:not([data-theme='light']) {
       --xeg-modal-bg: var(--xeg-modal-bg-dark);
     }
   }
   ```

3. **자동 검증**
   ```bash
   # 토큰 정의 누락 확인
   npm test -- token-definition-guard
   ```

````

**3. CI 검증 추가**

파일: `.github/workflows/ci.yml`

```yaml
# 기존 테스트 단계에 자동 포함 (별도 수정 불필요)
# token-definition-guard.test.ts가 자동으로 실행됨
````

### 📊 예상 효과

**토큰 건강도**:

- 사용 중인 토큰: 100% 정의 보장 (현재 95%)
- 누락 토큰: 0개 (현재 4개)

**번들 크기**:

- 토큰 정의 추가: +0.15 KB
- 총 번들: 316.44 KB (예산 325 KB 내)

**테스트 커버리지**:

- 통과율: 100% (현재 96%, 16개 스킵 해소)
- 신규 가드 테스트: 3개 추가

**유지보수성**:

- 명확한 토큰 계층 구조
- 자동 검증으로 재발 방지
- 문서화된 베스트 프랙티스

### ✅ 완료 조건

1. ✅ `--xeg-modal-bg*`, `--xeg-modal-border*` 토큰 정의
2. ✅ 다크 모드 및 system preference 지원
3. ✅ 16개 관련 테스트 모두 통과
4. ✅ 토큰 정의 가드 테스트 추가
5. ✅ 문서 업데이트 (CODING_GUIDELINES.md)
6. ✅ 빌드 검증 (npm run build)
7. ✅ 번들 예산 준수 (325 KB 이내)

---

### 검증 방법

```bash
# 자동 검증
npm test -- test/styles/component-token-policy.test.ts

# 수동 검증
grep -rn "^\s*--xeg-[a-z-]*:\s*var(--xeg-" src/**/components/**/*.module.css
```

---

## 백로그

### 테스트 파일 정리

**정리 완료**:

- JSDOM 제한으로 제거: Toolbar Settings 테스트 (11개)
- E2E 커버: `playwright/smoke/toolbar-settings.spec.ts`
- Glassmorphism 테스트 디렉터리 제거

### 접근성 개선 (향후)

- 키보드 네비게이션 개선
- 스크린 리더 지원 강화
- 고대비 모드 최적화

---

## 이전 Phase 요약

세부 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조:

- **Phase 53** (2025-10-14): Button Fallback 제거
- **Phase 51-52** (2025-01-14): Settings/Toast 토큰화
- **Phase 44-50** (2025-01-13): SettingsModal → Toolbar 전환
- **Phase 1-43** (2025-01 이전): 아키텍처 정립
