# Critical Fixes Plan - Browser Test Failures

**Date**: 2025-01-10 **Status**: 🔴 CRITICAL - Browser Testing Required
**Version**: v0.3.1-dev

## Executive Summary

브라우저 테스트 결과, 앞서 "해결됨"으로 판단한 4가지 문제가 **실제로는 여전히
발생**하고 있습니다. 코드 분석만으로는 불충분했으며, 런타임 동작 검증이
필요합니다.

---

## 문제 1: 네비게이션 버튼 클릭 시 화면 깜빡임 및 첫 이미지로 리셋

### 실제 증상 (브라우저 테스트)

- ❌ 이전/다음 버튼 클릭 시 currentIndex가 올바르게 변경되지 않음
- ❌ 화면이 깜빡이며 첫 번째 이미지로 돌아감
- ✅ 키보드 네비게이션 (ArrowLeft/Right)은 정상 동작

### 근본 원인 분석

#### 1.1 createEffect 과도한 재실행

**파일**: `src/features/gallery/GalleryRenderer.tsx`

```typescript
// 현재 코드 (문제)
private setupStateSubscription(): void {
  const { createEffect, createRoot, on } = getSolid();

  this.stateUnsubscribe = createRoot(dispose => {
    createEffect(
      on(
        isGalleryOpen, // isOpen 값만 추적
        isOpen => {
          if (isOpen && !this.container) {
            this.renderGallery();  // ❌ 매번 재렌더링
          } else if (!isOpen && this.container) {
            this.cleanupGallery();
          }
        },
        { defer: true }
      )
    );
    return dispose;
  });
}
```

**문제점**:

1. `renderGallery()`가 호출될 때마다 새로운 컴포넌트 인스턴스 생성
2. VerticalGalleryView 내부의 effect들이 cleanup되지 않고 누적
3. 버튼 클릭 → state 변경 → effect 재실행 → 컴포넌트 재마운트 → state 리셋

#### 1.2 VerticalGalleryView 내부 signal 충돌

**파일**:
`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`

```typescript
// 현재 코드 (문제)
const [focusedIndex, setFocusedIndex] = createSignal(
  galleryState.value.currentIndex
);

// currentIndex 변경 감지
createEffect(() => {
  const idx = currentIndex(); // galleryState.value.currentIndex 접근
  setFocusedIndex(idx);
  // ... 스크롤 로직
});
```

**문제점**:

1. `galleryState.value` 직접 접근 → 전체 state 객체 추적
2. `currentIndex()` 함수가 매번 새로운 값 반환 → effect 무한 루프 위험
3. `onPrevious`/`onNext` props가 GalleryRenderer의 `handleNavigation`과
   연결되지만, 중간에 signal 업데이트가 끊김

### 해결책 1: 컴포넌트 재렌더링 방지

**파일**: `src/features/gallery/GalleryRenderer.tsx`

```typescript
private setupStateSubscription(): void {
  const { createEffect, createRoot, on } = getSolid();

  this.stateUnsubscribe = createRoot(dispose => {
    let isInitialized = false;

    createEffect(
      on(
        isGalleryOpen,
        isOpen => {
          if (isOpen && !isInitialized) {
            // 최초 한 번만 렌더링
            this.renderGallery();
            isInitialized = true;
          } else if (!isOpen && isInitialized) {
            this.cleanupGallery();
            isInitialized = false;
          }
          // isOpen 변경 시에는 재렌더링 안 함
        },
        { defer: true }
      )
    );

    return dispose;
  });
}
```

### 해결책 2: VerticalGalleryView Signal 최적화

**파일**:
`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`

```typescript
// currentIndex를 derived signal로 변경
const currentIndex = createMemo(() => galleryState.value.currentIndex);

// focusedIndex는 currentIndex에만 의존
createEffect(() => {
  const idx = currentIndex();
  setFocusedIndex(idx);

  // 스크롤 로직 debounce 추가
  const timeoutId = setTimeout(() => {
    if (containerRef) {
      const item = containerRef.children[idx];
      item?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 100);

  onCleanup(() => clearTimeout(timeoutId));
});
```

### 해결책 3: Debounce 추가

**파일**: `src/features/gallery/GalleryRenderer.tsx`

```typescript
import { debounce } from '@shared/utils/performance';

private handleNavigation = debounce((direction: 'previous' | 'next'): void => {
  if (direction === 'previous') {
    navigatePrevious();
  } else {
    navigateNext();
  }
}, 300);
```

---

## 문제 2: 툴바 버튼이 보이지 않음

### 실제 증상 (브라우저 테스트)

- ❌ 툴바가 렌더링되지만 버튼이 투명하거나 보이지 않음
- ❌ 다크 모드에서 특히 심각 (다크 배경 + 다크 아이콘)
- ❌ 개발자 도구에서 `opacity: 0` 또는 `color: transparent` 확인

### 근본 원인 분석

#### 2.1 CSS 변수 초기화 타이밍 문제

**파일**: `src/styles/design-tokens.semantic.css`

```css
/* 현재 코드 (문제) */
[data-theme='dark'] {
  --xeg-color-text-primary: oklch(0.95 0.01 264);
  --xeg-icon-color: var(--xeg-color-text-primary);
}

/* 하지만 ThemeService가 <html data-theme="dark">를 설정하기 전에 */
/* CSS가 먼저 로드되어 기본값이 적용됨 */
```

**문제점**:

1. `ThemeService.init()`가 비동기로 실행 → CSS 적용 지연
2. 초기 렌더링 시 `[data-theme]` 속성 없음 → `--xeg-icon-color` undefined
3. Toolbar 버튼이 `color: var(--xeg-icon-color, currentColor)` →
   `currentColor`가 transparent

#### 2.2 Heroicons SVG stroke 속성 누락

**파일**: `src/shared/components/ui/Icon/hero/*.tsx`

```typescript
// 현재 코드 (문제)
<svg
  fill="none"
  stroke="var(--xeg-icon-color, currentColor)"  // ❌ 런타임에 계산 안 됨
  strokeWidth="var(--xeg-icon-stroke-width)"
  /* ... */
>
```

**문제점**:

1. SVG가 Solid.js JSX로 렌더링되지만, CSS 변수가 적용되기 전에 평가됨
2. `var(--xeg-icon-color)` → undefined → `currentColor` fallback → 부모 color
   상속 → 없음 → transparent

### 해결책 1: ThemeService 동기 초기화

**파일**: `src/shared/services/ThemeService.ts`

```typescript
export class ThemeService {
  constructor() {
    // 비동기 제거 - 즉시 초기화
    this.initSync();
  }

  private initSync(): void {
    const saved = this.loadTheme(); // GM_getValue 동기 호출
    const theme = saved || this.detectTheme();
    this.applyTheme(theme); // <html data-theme> 즉시 설정
  }

  private applyTheme(theme: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', theme);
    // CSS 변수가 즉시 적용되도록 강제
    document.documentElement.style.setProperty(
      '--xeg-icon-color',
      theme === 'dark' ? 'oklch(0.95 0.01 264)' : 'oklch(0.25 0.01 264)'
    );
  }
}
```

### 해결책 2: Heroicons 인라인 스타일 추가

**파일**: `src/shared/components/ui/Icon/hero/HeroChevronLeft.tsx` (모든 아이콘
동일)

```typescript
export const HeroChevronLeft: Component<HeroIconProps> = (props) => {
  const { size = 20, className = '', ...rest } = props;

  // 런타임에 CSS 변수 계산
  const iconColor = () => {
    const computed = getComputedStyle(document.documentElement);
    return computed.getPropertyValue('--xeg-icon-color') || 'currentColor';
  };

  return (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke={iconColor()}  // ✅ 동적 계산
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      class={className}
      {...rest}
    >
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
};
```

### 해결책 3: CSS Fallback 강화

**파일**: `src/shared/components/ui/Toolbar/Toolbar.module.css`

```css
.toolbarButton {
  /* 명시적 기본값 설정 */
  color: var(--xeg-color-text-primary, oklch(0.95 0.01 264));
  opacity: 1 !important; /* CSS 변수 override 방지 */
  pointer-events: auto !important;
}

/* 다크 모드 명시적 적용 */
[data-theme='dark'] .toolbarButton,
@media (prefers-color-scheme: dark) {
  .toolbarButton {
    color: oklch(0.95 0.01 264); /* 화이트에 가까운 색 */
  }
}
```

---

## 문제 3: 설정 모달 CSS 적용 문제

### 실제 증상 (브라우저 테스트)

- ❌ 모달이 평범한 텍스트/버튼으로 보임
- ❌ glassmorphism 효과 없음 (backdrop-filter 미적용)
- ❌ 테두리, 그림자, 애니메이션 누락

### 근본 원인 분석

#### 3.1 ModalShell createMemo 타이밍 이슈

**파일**: `src/shared/components/ui/ModalShell/ModalShell.tsx`

```typescript
// 현재 코드 (문제)
const shellClass = createMemo(() => {
  const sizeClass =
    styles[
      `modalSize${local.size.charAt(0).toUpperCase()}${local.size.slice(1)}`
    ];
  const surfaceClass =
    styles[
      `modalSurface${local.surfaceVariant.charAt(0).toUpperCase()}${local.surfaceVariant.slice(1)}`
    ];

  const classes = [styles.modalShell, sizeClass, surfaceClass];
  if (local.className) {
    classes.push(local.className);
  }
  return classes.filter(Boolean).join(' ');
});
```

**문제점**:

1. `styles` 객체가 CSS Modules에서 비동기 로드됨
2. `createMemo` 최초 실행 시 `styles.modalShell` → undefined
3. 클래스 문자열이 빈 값 또는 일부만 적용됨
4. React의 `useEffect`와 달리 Solid의 `createMemo`는 초기값에 의존

#### 3.2 CSS Modules camelCase 변환 오류

**파일**: `src/shared/components/ui/ModalShell/ModalShell.module.css`

```css
/* CSS 정의 */
.modal-shell {
  /* ... */
}
.modal-size-md {
  /* ... */
}
.modal-surface-glass {
  /* ... */
}

/* Vite CSS Modules 변환 */
.modalShell {
  /* ... */
}
.modalSizeMd {
  /* ... */
} /* ❌ 코드에서 modalSizeMedium 기대 */
.modalSurfaceGlass {
  /* ... */
}
```

**문제점**:

1. 코드에서 `modalSize${size.charAt(0).toUpperCase()}${size.slice(1)}` 사용
2. `size = 'md'` → `modalSizeMd` 기대
3. 하지만 CSS Modules가 `modal-size-md` → `modalSizeMd` 변환 (O)
4. 코드 로직이 `modalSizeMedium` 생성 시도 (X) → 클래스 누락

### 해결책 1: CSS Modules 정적 import

**파일**: `src/shared/components/ui/ModalShell/ModalShell.tsx`

```typescript
// 최상단에서 동기 import
import styles from './ModalShell.module.css';

// createMemo 내부에서 안전하게 사용
const shellClass = createMemo(() => {
  // camelCase 변환 수정
  const sizeClassKey = `modalSize${local.size.charAt(0).toUpperCase()}${local.size.slice(1)}`;
  const surfaceClassKey = `modalSurface${local.surfaceVariant.charAt(0).toUpperCase()}${local.surfaceVariant.slice(1)}`;

  const classes = [
    styles.modalShell,
    styles[sizeClassKey],
    styles[surfaceClassKey],
  ];

  if (local.className) {
    classes.push(local.className);
  }

  return classes.filter(Boolean).join(' ');
});
```

### 해결책 2: CSS 클래스 매핑 명시화

**파일**: `src/shared/components/ui/ModalShell/ModalShell.tsx`

```typescript
// 명시적 매핑 객체
const SIZE_CLASS_MAP = {
  sm: styles.modalSizeSm,
  md: styles.modalSizeMd,
  lg: styles.modalSizeLg,
  xl: styles.modalSizeXl,
} as const;

const SURFACE_CLASS_MAP = {
  glass: styles.modalSurfaceGlass,
  solid: styles.modalSurfaceSolid,
  elevated: styles.modalSurfaceElevated,
} as const;

const shellClass = createMemo(() => {
  const classes = [
    styles.modalShell,
    SIZE_CLASS_MAP[local.size],
    SURFACE_CLASS_MAP[local.surfaceVariant],
  ];

  if (local.className) {
    classes.push(local.className);
  }

  return classes.filter(Boolean).join(' ');
});
```

### 해결책 3: backdrop-filter Polyfill

**파일**: `src/shared/components/ui/ModalShell/ModalShell.module.css`

```css
.modal-shell {
  background: var(--xeg-modal-bg);
  border: 1px solid var(--xeg-modal-border);
  box-shadow: var(--xeg-shadow-lg);

  /* Fallback for non-supporting browsers */
  background: var(--xeg-modal-bg-fallback, var(--xeg-modal-bg));

  /* Progressive enhancement */
  @supports (backdrop-filter: blur(10px)) {
    backdrop-filter: blur(var(--xeg-glassmorphism-blur));
    -webkit-backdrop-filter: blur(var(--xeg-glassmorphism-blur));
    background: var(--xeg-modal-bg-translucent);
  }
}
```

---

## 문제 4: 언어 설정 동작 문제

### 실제 증상 (브라우저 테스트)

- ❌ 언어 선택 후 변경되지 않음 (영어로 고정)
- ❌ 페이지 새로고침 후에도 설정 유지 안 됨
- ❌ SettingsModal select onChange가 호출되지 않음

### 근본 원인 분석

#### 4.1 onChange 핸들러 바인딩 누락

**파일**: `src/shared/components/ui/SettingsModal/SettingsModal.tsx`

```typescript
// 현재 코드 (문제)
<select
  class={styles['settings-select']}
  value={internalLanguage()}  // ✅ 값은 바인딩됨
  onChange={handleLanguageChange}  // ❌ 핸들러가 호출되지 않음
  id="language-select"
>
```

**문제점**:

1. Solid.js에서 `onChange`는 input 이벤트만 감지 (React와 다름)
2. select 요소는 `onInput` 또는 `on:change` 사용해야 함
3. `handleLanguageChange`가 호출되지 않아 `languageService.setLanguage()` 실행
   안 됨

#### 4.2 LanguageService 반응성 부족

**파일**: `src/shared/services/LanguageService.ts`

```typescript
// 현재 코드 (문제)
export class LanguageService {
  private currentLanguage: LanguageCode = 'auto';

  setLanguage(language: LanguageCode): void {
    this.currentLanguage = language;
    this.saveLanguagePreference(language); // GM_setValue 호출
    // ❌ UI 업데이트 트리거 없음
  }

  getString(key: string): string {
    const language = this.detectLanguage();
    return this.resources[language][key] || key;
  }
}
```

**문제점**:

1. `setLanguage()` 호출 후 `getString()`이 새로운 값 반환하지 않음
2. Solid signal이 아닌 일반 클래스 프로퍼티 → 반응성 없음
3. 컴포넌트가 재렌더링되지 않음

### 해결책 1: onChange → onInput 변경

**파일**: `src/shared/components/ui/SettingsModal/SettingsModal.tsx`

```typescript
<select
  class={styles['settings-select']}
  value={internalLanguage()}
  onInput={handleLanguageChange}  // ✅ onChange → onInput
  id="language-select"
>
```

또는 Solid의 네이티브 이벤트 바인딩:

```typescript
<select
  class={styles['settings-select']}
  value={internalLanguage()}
  on:change={handleLanguageChange}  // ✅ on:change (네이티브)
  id="language-select"
>
```

### 해결책 2: LanguageService Signal 추가

**파일**: `src/shared/services/LanguageService.ts`

```typescript
import { createSignal, createEffect } from 'solid-js';

export class LanguageService {
  private languageSignal = createSignal<LanguageCode>('auto');
  private [getLanguage, setLanguageInternal] = this.languageSignal;

  setLanguage(language: LanguageCode): void {
    this.setLanguageInternal(language);
    this.saveLanguagePreference(language);
  }

  getString(key: string): string {
    const language = this.getLanguage();  // ✅ Signal에서 읽기
    return this.resources[language][key] || key;
  }
}
```

### 해결책 3: 컴포넌트 재렌더링 강제

**파일**: `src/shared/components/ui/SettingsModal/SettingsModal.tsx`

```typescript
const handleLanguageChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value as 'auto' | 'ko' | 'en' | 'ja';

  setInternalLanguage(value);
  handlers.onLanguageChange?.(value);

  // 강제 재렌더링 (임시 방편)
  requestAnimationFrame(() => {
    // 다음 프레임에서 DOM 업데이트 보장
    const allLabels = document.querySelectorAll('[data-i18n]');
    allLabels.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = languageService.getString(key);
      }
    });
  });
};
```

---

## 통합 수정 계획

### Phase 1: 긴급 핫픽스 (1-2 시간)

1. ✅ Toolbar 아이콘 색상 인라인 스타일 추가
2. ✅ SettingsModal onChange → onInput 변경
3. ✅ ThemeService 동기 초기화

### Phase 2: 네비게이션 수정 (2-3 시간)

1. GalleryRenderer 재렌더링 방지 로직 추가
2. VerticalGalleryView signal 최적화
3. Debounce 추가

### Phase 3: CSS/반응성 개선 (3-4 시간)

1. CSS Modules 클래스 매핑 명시화
2. LanguageService Signal 통합
3. backdrop-filter Polyfill

### Phase 4: 통합 테스트 (1 시간)

1. 로컬 빌드 → Tampermonkey 설치
2. 4가지 시나리오 브라우저 테스트
3. 로그 분석 및 최종 검증

---

## 브라우저 테스트 체크리스트

### 테스트 환경

- [ ] Chrome 최신 버전
- [ ] Firefox 최신 버전
- [ ] Tampermonkey 확장 설치
- [ ] X.com 계정 로그인

### 시나리오 1: 네비게이션

- [ ] 갤러리 열기 (미디어 포스트 클릭)
- [ ] 이전 버튼 클릭 3회 → 부드러운 전환 확인
- [ ] 다음 버튼 클릭 3회 → 깜빡임 없음 확인
- [ ] 키보드 ArrowLeft/Right → 정상 동작 확인

### 시나리오 2: 툴바 가시성

- [ ] 라이트 모드 → 툴바 버튼 보임 확인
- [ ] 다크 모드 전환 → 툴바 버튼 보임 확인 (흰색 아이콘)
- [ ] 호버 시 버튼 하이라이트 확인

### 시나리오 3: 설정 모달

- [ ] 설정 버튼 클릭 → 모달 열림
- [ ] 모달 스타일 확인 (테두리, 그림자, glassmorphism)
- [ ] 테마 선택 → 즉시 적용 확인
- [ ] ESC 키 → 모달 닫힘 확인

### 시나리오 4: 언어 설정

- [ ] 언어 선택 → 한국어
- [ ] 모달 텍스트 한국어로 변경 확인
- [ ] 페이지 새로고침 → 언어 유지 확인
- [ ] 토스트 메시지 한국어 확인

---

## 다음 단계

1. **즉시 수정**: 위 Phase 1 핫픽스 적용
2. **브라우저 테스트**: 실제 X.com에서 검증
3. **로그 수집**: 개발자 도구 콘솔 로그 캡처
4. **추가 분석**: 로그 기반 추가 문제 식별

**중요**: 코드 분석만으로는 부족합니다. 반드시 실제 브라우저에서 테스트하고
로그를 확인해야 합니다.

---

**작성자**: GitHub Copilot **검토 필요**: 개발팀, QA팀 **우선순위**: 🔴 CRITICAL
