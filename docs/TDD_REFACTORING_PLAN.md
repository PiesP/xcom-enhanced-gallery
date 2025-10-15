# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 | **상태**: Phase 76 완료 ✅

## 프로젝트 현황

- **빌드**: prod **321.52 KB / 325 KB** (3.48 KB 여유, 1.1%) ✅
- **테스트**: **159개 파일**, 987 passing / 0 failed (100% 통과율) ✅✅✅
- **Skipped**: **10개** (8개 E2E 이관 권장 + 2개 기존) ⚠️
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (261 modules, 730 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅

## 현재 상태: Phase 76 완료 ✅

**완료일**: 2025-10-15 **목표**: Performance 테스트 재활성화 **결과**: 13개
테스트 활성화, skip 15→10개로 감소

### 주요 성과

- ✅ icon-optimization.test.tsx 재활성화 (13 passed | 3 skipped E2E)
- ✅ signal-optimization.test.tsx 재활성화 (17 passed)
- ✅ vendor mock에 onCleanup 추가
- ✅ renderHook API 수정 (result.current() → result())
- ✅ Skip 테스트 15 → 10개로 감소

### 해결 내용

1. **icon-optimization.test.tsx**: describe.skip 제거, vendor mock에 onCleanup
   추가
   - LazyIcon 구조 테스트 3개는 E2E 이관 권장 (JSX 변환 시점 문제)
   - IconRegistry, preload, hooks 테스트 모두 통과
2. **signal-optimization.test.tsx**: describe.skip 제거, result.current() →
   result() API 수정
   - createSelector, useSelector, useCombinedSelector 테스트 모두 통과
   - 비동기 selector 및 성능 모니터링 검증

---

## 다음 Phase 계획

### Phase 78: 디자인 토큰 통일 (Design Token Unification)

**상태**: 진행 중 (2025-10-15)  
**트리거**: 사용자 요청 - 크기 em/rem 통일 + 색상 oklch 통일 + 강제 규칙  
**목표**: 디자인 토큰 전체를 통일하여 접근성 향상 및 유지보수성 강화  
**예상 시간**: 12-16시간  
**우선순위**: 최고 (접근성 + 일관성 + 유지보수성)

#### Phase 78 개요

**현재 상태 분석**:

- **크기 단위**: px 사용 중 (spacing, radius, font-size, button-size 등)
  - 일부 컴포넌트(Button, Toolbar)는 이미 em 사용
  - Primitive 토큰은 여전히 px 기반
- **색상 단위**: 대부분 oklch 사용 중
  - Gray scale: 100% oklch ✅
  - Toast: 100% oklch ✅
  - **rgba 45개 남음**: overlay, glass, shadow (semantic 토큰)

**통일 목표**:

1. ✅ **크기 em/rem 통일**: 접근성 향상 (사용자 브라우저 설정 존중)
2. ✅ **색상 oklch 통일**: 일관성 강화, rgba 완전 제거
3. ✅ **강제 규칙**: CodeQL + stylelint + 문서화

#### Phase 78.1: 크기 토큰 em/rem 통일 (4-5시간)

**전략**: rem (절대 크기) + em (상대 크기) 혼합 사용

```css
/* Primitive Tokens - rem (절대 크기) */
:root {
  /* Spacing - rem (16px 기준) */
  --space-xs: 0.25rem; /* 4px */
  --space-sm: 0.5rem; /* 8px */
  --space-md: 1rem; /* 16px */
  --space-lg: 1.5rem; /* 24px */
  --space-xl: 2rem; /* 32px */
  --space-2xl: 3rem; /* 48px */

  /* Font Size - rem */
  --font-size-2xs: 0.6875rem; /* 11px */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 0.9375rem; /* 15px - Twitter */
  --font-size-md: 1rem; /* 16px */
  --font-size-lg: 1.0625rem; /* 17px */
  --font-size-xl: 1.125rem; /* 18px */
  --font-size-2xl: 1.25rem; /* 20px */
  --font-size-3xl: 1.5rem; /* 24px */

  /* Border Radius - em (폰트 크기 비례) */
  --radius-xs: 0.125em;
  --radius-sm: 0.25em;
  --radius-md: 0.375em; /* 6px @ 16px */
  --radius-lg: 0.5em;
  --radius-xl: 0.75em;
  --radius-2xl: 1em;
  --radius-pill: 1.75em;

  /* Button Sizes - em (폰트 크기 비례) */
  --size-button-sm: 2em; /* 32px @ 16px */
  --size-button-md: 2.5em; /* 40px @ 16px */
  --size-button-lg: 3em; /* 48px @ 16px */
  --size-button-touch: 2.75em; /* 44px @ 16px */

  /* Icon Sizes - em */
  --size-icon-sm: 1em; /* 16px @ 16px */
  --size-icon-md: 1.25em; /* 20px @ 16px */
  --size-icon-lg: 1.5em; /* 24px @ 16px */
}
```

**변환 작업**:

- [ ] `design-tokens.primitive.css`: spacing/radius/font-size px → rem/em
- [ ] `design-tokens.semantic.css`: button/icon sizes px → em
- [ ] `design-tokens.component.css`: 참조 토큰 검증
- [ ] Legacy `design-tokens.css`: 정리 및 제거 준비

**예상 효과**:

- ✅ 접근성: 브라우저 확대/축소 지원
- ✅ 일관성: em 단위로 폰트 크기에 비례한 UI
- ✅ 번들 크기: ~0.2-0.3 KB 절감

#### Phase 78.2: 색상 토큰 oklch 통일 (3-4시간)

**전략**: Opacity 토큰화 + oklch 조합

```css
/* Primitive - Opacity 토큰 (이미 존재) */
:root {
  --opacity-overlay-light: 0.1;
  --opacity-overlay-medium: 0.3;
  --opacity-overlay-strong: 0.8;
  --opacity-glass: 0.85;
  --opacity-shadow-md: 0.15;
}

/* Semantic - oklch + opacity */
:root {
  /* Overlay - oklch(흑백 base + alpha) */
  --color-overlay-light: oklch(0 0 0 / var(--opacity-overlay-light));
  --color-overlay-medium: oklch(0 0 0 / var(--opacity-overlay-medium));
  --color-overlay-strong: oklch(0 0 0 / var(--opacity-overlay-strong));
  --color-overlay-backdrop: oklch(0 0 0 / var(--opacity-overlay-backdrop));

  /* Glass - oklch(흰색/검은색 base + alpha) */
  --color-glass-bg-light: oklch(1 0 0 / var(--opacity-glass));
  --color-glass-bg-dark: oklch(0 0 0 / var(--opacity-glass));
  --color-glass-border: oklch(1 0 0 / 0.2);

  /* Shadow - oklch(검은색 + opacity) */
  --shadow-sm: 0 1px 2px oklch(0 0 0 / var(--opacity-shadow-sm));
  --shadow-md: 0 4px 12px oklch(0 0 0 / var(--opacity-shadow-md));
  --shadow-lg: 0 8px 32px oklch(0 0 0 / var(--opacity-shadow-lg));
  --shadow-xl: 0 4px 20px oklch(0 0 0 / var(--opacity-shadow-xl));
  --shadow-thumbnail: 0 2px 8px oklch(0 0 0 / var(--opacity-shadow-thumbnail));

  /* Text on Overlay - oklch */
  --color-text-error: oklch(1 0 0 / 0.7);
  --color-text-on-overlay: oklch(1 0 0 / 0.9);
}
```

**변환 작업**:

- [ ] `design-tokens.semantic.css`: rgba(0,0,0,_) → oklch(0 0 0 / _)
- [ ] `design-tokens.semantic.css`: rgba(255,255,255,_) → oklch(1 0 0 / _)
- [ ] `gallery-global.css`: fallback rgba 제거
- [ ] `isolated-gallery.css`: glass rgba → oklch

**예상 효과**:

- ✅ 일관성: 100% oklch 색상 체계
- ✅ 번들 크기: ~0.3-0.5 KB 절감
- ✅ 미래 지향: oklch relative color 준비

#### Phase 78.3: 컴포넌트 검증 및 조정 (2-3시간)

**검증 대상**:

- [ ] Button 컴포넌트: em 단위 정상 작동 확인
- [ ] Toolbar 컴포넌트: 이미 em 사용 중, 토큰 참조 검증
- [ ] Modal/Toast: oklch 색상 정상 표시 확인
- [ ] Gallery: 배경/overlay oklch 변환 확인
- [ ] Focus ring: oklch 전환 확인

**조정 작업**:

- [ ] 컴포넌트별 미세 조정 (1px 오차 수정)
- [ ] 다크 모드 토큰 검증
- [ ] 고대비 모드 토큰 검증

#### Phase 78.4: 강제 규칙 및 문서화 (3-4시간)

**1. stylelint 설정 추가**

```json
// .stylelintrc.json (새 파일)
{
  "extends": "stylelint-config-standard",
  "rules": {
    "unit-disallowed-list": [
      ["px"],
      {
        "ignoreProperties": {
          "px": ["/^--/"] // CSS 변수 정의만 px 허용
        },
        "message": "Use design tokens (rem/em) instead of px"
      }
    ],
    "color-function-notation": "modern",
    "alpha-value-notation": "percentage"
  }
}
```

**2. CodeQL 쿼리 추가**

```ql
// codeql-custom-queries-javascript/hardcoded-size-values.ql
/**
 * @name Hardcoded size values (px)
 * @description Detects hardcoded px values outside design tokens
 * @kind problem
 * @id xeg/hardcoded-size-px
 * @problem.severity warning
 */

import javascript

from CssPropertyValue val
where
  val.getValue().matches("% [0-9]+px%") and
  not val.getFile().getBaseName().matches("%design-tokens%")
select val, "Hardcoded px value. Use design tokens (rem/em) instead."
```

**3. CODING_GUIDELINES.md 업데이트**

- [ ] 크기 단위 규칙 섹션 추가 (rem/em 사용법)
- [ ] 색상 단위 규칙 섹션 강화 (oklch 전용)
- [ ] 예제 코드 추가 (올바른 vs 잘못된)
- [ ] 금지 사항 테이블 업데이트

**4. 테스트 추가**

- [ ] `test/styles/design-tokens-units.test.ts`: rem/em 단위 검증
- [ ] `test/styles/design-tokens-colors.test.ts`: oklch 전용 검증
- [ ] 기존 스타일 테스트 업데이트

#### 마일스톤 및 검증 기준

| 단계              | 완료 조건                      | 검증 방법                                                              |
| ----------------- | ------------------------------ | ---------------------------------------------------------------------- |
| **78.1 크기**     | Primitive/Semantic 토큰 px 0개 | `grep -r ": [0-9]\\+px" src/shared/styles/design-tokens*.css` → 0 결과 |
| **78.2 색상**     | rgba 0개 (design-tokens 기준)  | `grep -r "rgba(" src/shared/styles/` → 0 결과                          |
| **78.3 컴포넌트** | 모든 UI 정상 작동              | 수동 테스트 + Playwright E2E                                           |
| **78.4 강제**     | stylelint 0 warnings           | `npm run lint:css` 통과                                                |

#### 예상 효과 및 영향

**긍정적 효과**:

- ✅ 접근성 향상: 사용자 브라우저 설정 존중 (WCAG 준수)
- ✅ 일관성 강화: 100% 토큰 기반 스타일
- ✅ 유지보수성: 하드코딩 제거로 변경 용이
- ✅ 번들 크기: 0.5-0.8 KB 절감 예상
- ✅ 미래 지향: oklch relative color 준비

**주의사항**:

- ⚠️ 학습 곡선: rem vs em 차이 이해 필요
- ⚠️ 시각적 변화: 계산 오차로 1px 차이 가능
- ⚠️ 테스트 부담: 100+ CSS 파일 영향

#### 롤백 계획

- Git 브랜치: `feature/phase-78-unified-tokens`
- 문제 발생 시: 브랜치 폐기 후 master 복귀
- 부분 적용: Phase 78.1/78.2만 적용 후 검증 가능

---

### Phase 73: 번들 최적화 (Quick Wins)

**상태**: 대기 (현재 321.52 KB, 98.9% 사용) **트리거**: 빌드 322 KB (99%) 도달
시 **목표**: 7-10 KB 절감으로 12-15 KB 여유 확보 **예상 시간**: 5-8시간

#### 최적화 전략

1. **Tree-Shaking** (events.ts, 15.41 KB → 13.5 KB 목표)
   - 미사용 exports 제거
   - MediaClickDetector, gallerySignals 의존성 최소화

2. **Lazy Loading** (twitter-video-extractor.ts, 12.73 KB)
   - 동영상 tweet에서만 필요, 조건부 import() 적용

3. **Code Splitting** (media-service.ts, 17.53 KB)
   - extraction/mapping/control 로직 분리
   - 필요 시에만 로드

---

## 완료된 Phase 기록

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

- **Phase 75** (2025-10-15): test:coverage 실패 4개 수정, E2E 이관 권장 5개 추가
  ✅
- **Phase 74.9** (2025-10-15): 테스트 최신화 및 수정 ✅
- **Phase 74.8** (2025-10-15): 린트 정책 위반 12개 수정 ✅
- **Phase 74.7** (2025-10-15): 실패/스킵 테스트 8개 최신화 ✅
- **Phase 74.6** (2025-10-14): 테스트 구조 개선 ✅
- **Phase 74.5** (2025-10-13): 중복 제거 및 통합 ✅

---

## 모니터링 지표

### 경계 조건

- **번들 크기**: 322 KB (99%) 도달 시 Phase 73 활성화
- **테스트 skipped**: 20개 이상 시 즉시 검토 (현재 15개)
- **테스트 통과율**: 95% 미만 시 Phase 74 재활성화
- **빌드 시간**: 60초 초과 시 최적화 검토
- **문서 크기**: 개별 문서 800줄 초과 시 분할 검토

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, skipped 수
- **월간**: 의존성 업데이트, 문서 최신성, 보안 취약점
- **분기**: 아키텍처 리뷰, 성능 벤치마크

---

## 참고 문서

- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md):
  완료된 Phase 상세 기록
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트
