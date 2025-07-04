# 🏗️ X.com Gallery 코딩 가이드라인

> **트위터(X) 미디어 확장 프로그램의 아키텍처 및 코딩 규칙**

## 🎯 아키텍처 원칙

### 프로젝트 구조

```
src/
├── app/              # 애플리케이션 진입점
├── features/         # 기능별 모듈 (gallery, media, download, settings)
├── shared/           # 공통 컴포넌트 및 유틸리티
├── core/             # 핵심 비즈니스 로직 및 상태 관리
├── infrastructure/   # 외부 의존성 (브라우저 API, 스토리지, 로깅)
└── assets/          # 정적 자원 (스타일, 아이콘)
```

### 의존성 규칙

```
features → shared → core → infrastructure
```

- **Features**: 비즈니스 기능 (shared, core, infrastructure 사용 가능)
- **Shared**: 재사용 가능한 컴포넌트/유틸리티 (core, infrastructure 사용 가능)
- **Core**: 핵심 로직 및 상태 (infrastructure만 사용 가능)
- **Infrastructure**: 외부 시스템 인터페이스 (자체 완결형)

## 📝 코딩 규칙

### 1. 외부 라이브러리 접근

**✅ 권장: 전용 getter 사용**

```typescript
import { getFflate, getPreact, getMotion } from '@infrastructure/external/vendors';

const { deflate } = getFflate();
const { render } = getPreact();
```

**❌ 금지: 직접 접근**

```typescript
import { deflate } from 'fflate'; // 금지
const preact = window.preact; // 금지
```

### 2. 컴포넌트 작성

**기본 패턴**

```typescript
import { signal } from '@preact/signals';
import styles from './Component.module.css';

interface ComponentProps {
  title: string;
  onAction: (id: string) => void;
}

export function Component({ title, onAction }: ComponentProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <button onClick={() => onAction('example')}>Action</button>
    </div>
  );
}
```

**배럴 export 사용**

```typescript
// components/index.ts
export { Component } from './Component';
export { AnotherComponent } from './AnotherComponent';
```

### 3. 상태 관리 (Preact Signals)

**Signal 정의**

```typescript
// signals/media.signals.ts
export const mediaItems = signal<MediaItem[]>([]);
export const selectedItem = signal<MediaItem | null>(null);

// Action 함수로 상태 변경
export function addMediaItem(item: MediaItem) {
  mediaItems.value = [...mediaItems.value, item];
}

export function selectMediaItem(item: MediaItem) {
  selectedItem.value = item;
}
```

**컴포넌트에서 사용**

```typescript
import { mediaItems, addMediaItem } from '@core/state/signals/media.signals';

export function MediaList() {
  return (
    <div>
      {mediaItems.value.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  );
}
}
```

### 4. 타입 정의 및 타입 안전성

**인터페이스 명명 규칙**

```typescript
// 컴포넌트 Props - 컴포넌트명 + Props
interface GalleryProps {
  items: MediaItem[];
  onItemSelect: (item: MediaItem) => void;
}

interface MediaViewerProps {
  item: MediaItem;
  onClose: () => void;
}

// 비즈니스 모델 - 명사형
interface MediaItem {
  readonly id: MediaId;
  readonly url: string;
  readonly type: MediaType;
  readonly metadata: MediaMetadata;
}

interface DownloadOptions {
  readonly quality: 'original' | 'high' | 'medium';
  readonly format?: string;
  readonly includeMetadata: boolean;
}

// 서비스 인터페이스 - I 접두사
interface IMediaExtractor {
  canExtract(element: HTMLElement): boolean;
  extract(element: HTMLElement): Promise<MediaItem[]>;
}

interface IDownloadService {
  downloadSingle(item: MediaItem, options?: DownloadOptions): Promise<void>;
  downloadMultiple(items: MediaItem[], options?: DownloadOptions): Promise<void>;
}
```

**브랜드 타입으로 타입 안전성 강화**

```typescript
// ID 타입들의 명확한 구분
export type MediaId = string & { readonly __brand: 'MediaId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type TweetId = string & { readonly __brand: 'TweetId' };

// 팩토리 함수로 안전한 생성
export function createMediaId(value: string): MediaId {
  if (!value || value.length === 0) {
    throw new Error('Valid media ID required');
  }
  return value as MediaId;
}

// 사용 시 타입 안전성 보장
function getMediaById(id: MediaId): Promise<MediaItem | null> {
  // MediaId 타입만 허용
}
```

**제네릭과 유틸리티 타입**

```typescript
// 제네릭으로 재사용 가능한 타입
export interface Repository<T, K = string> {
  findById(id: K): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: K): Promise<void>;
}

// 조건부 필수/선택 필드
export type CreateEntity<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEntity<T> = Partial<CreateEntity<T>> & { id: string };

// 사용 예시
const mediaRepository: Repository<MediaItem, MediaId> = new MediaRepository();
const createData: CreateEntity<MediaItem> = {
  url: 'https://example.com/image.jpg',
  type: 'image',
  metadata: { width: 800, height: 600 },
};
```

**공통 타입 위치**

```
shared/types/       # 여러 레이어에서 사용하는 공통 타입
core/types/         # 비즈니스 도메인 타입
features/*/types/   # 특정 기능 전용 타입
```

### 5. CSS 및 스타일링

**CSS 변수 시스템**

```css
/* assets/styles/variables.css */
:root {
  /* 색상 */
  --xeg-color-primary: #1d9bf0;
  --xeg-color-secondary: #536471;
  --xeg-color-surface: #ffffff;
  --xeg-color-surface-dark: #15202b;

  /* 간격 (8px 기반) */
  --xeg-spacing-xs: 4px;
  --xeg-spacing-sm: 8px;
  --xeg-spacing-md: 16px;
  --xeg-spacing-lg: 24px;
  --xeg-spacing-xl: 32px;

  /* 컴포넌트 크기 */
  --xeg-button-size-sm: 32px;
  --xeg-button-size-md: 40px;
  --xeg-button-size-lg: 48px;

  /* Z-index */
  --xeg-z-gallery: 9999;
  --xeg-z-modal: 10000;
  --xeg-z-tooltip: 10001;
}
```

**CSS 모듈 패턴**

```css
/* Component.module.css */
.container {
  padding: var(--xeg-spacing-md);
  background: var(--xeg-color-surface);
  border-radius: 8px;
}

.button {
  height: var(--xeg-button-size-md);
  padding: 0 var(--xeg-spacing-md);
  color: var(--xeg-color-primary);
  border: 1px solid var(--xeg-color-primary);
}

.button:hover {
  background: var(--xeg-color-primary);
  color: white;
}
```

---

## 🎨 최신 CSS 기법 및 최적화

### 1. CSS 커스텀 속성 (CSS Variables) 활용

현재 프로젝트는 우수한 CSS 변수 시스템을 갖추고 있습니다. 이를 더욱 효과적으로 활용하기 위한 고급 패턴들:

**조건부 CSS 변수**

```css
/* 테마별 조건부 변수 */
:root {
  --xeg-color-primary: #1d9bf0;
  --xeg-color-surface: #ffffff;
}

[data-theme='dark'] {
  --xeg-color-primary: #1a8cd8;
  --xeg-color-surface: #15202b;
}

[data-theme='high-contrast'] {
  --xeg-color-primary: #000000;
  --xeg-color-surface: #ffffff;
}
```

**계산된 CSS 변수**

```css
:root {
  /* 기본 스케일 */
  --xeg-scale-factor: 1;
  --xeg-base-size: 16px;

  /* 계산된 크기들 */
  --xeg-font-size-sm: calc(var(--xeg-base-size) * 0.875 * var(--xeg-scale-factor));
  --xeg-font-size-md: calc(var(--xeg-base-size) * var(--xeg-scale-factor));
  --xeg-font-size-lg: calc(var(--xeg-base-size) * 1.25 * var(--xeg-scale-factor));

  /* 반응형 간격 */
  --xeg-spacing-fluid: clamp(8px, 2vw, 24px);
}

/* 컴팩트 모드 */
[data-layout='compact'] {
  --xeg-scale-factor: 0.9;
}

/* 대형 화면 모드 */
[data-layout='large'] {
  --xeg-scale-factor: 1.1;
}
```

### 2. 최신 CSS 레이아웃 기법

**CSS Grid를 활용한 갤러리 레이아웃**

```css
.gallery-grid {
  display: grid;

  /* 반응형 그리드 - 최소 250px, 최대 1fr */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

  /* 동적 행 크기 */
  grid-auto-rows: minmax(200px, auto);

  /* 최적화된 갭 */
  gap: var(--xeg-spacing-md);

  /* 밀도 조절 가능 */
  grid-auto-flow: dense;
}

/* 특별한 아이템 크기 */
.gallery-item--featured {
  grid-column: span 2;
  grid-row: span 2;
}

.gallery-item--wide {
  grid-column: span 2;
}
```

**Container Queries 활용**

```css
/* 갤러리 컨테이너 쿼리 */
.gallery-container {
  container-type: inline-size;
  container-name: gallery;
}

@container gallery (width < 480px) {
  .gallery-item {
    grid-template-columns: 1fr;
    font-size: var(--xeg-font-size-sm);
  }

  .gallery-toolbar {
    flex-direction: column;
    gap: var(--xeg-spacing-xs);
  }
}

@container gallery (width >= 768px) {
  .gallery-item {
    grid-template-columns: auto 1fr auto;
  }

  .gallery-toolbar {
    flex-direction: row;
    justify-content: space-between;
  }
}
```

### 3. 성능 최적화 CSS

**GPU 가속 애니메이션**

```css
/* 하드웨어 가속 활용 */
.gallery-item {
  transform: translateZ(0); /* GPU 레이어 생성 */
  will-change: transform, opacity; /* 브라우저 최적화 힌트 */
}

.gallery-item:hover {
  transform: translateY(-4px) translateZ(0);
  transition: transform 0.2s ease-out;
}

/* 애니메이션 완료 후 will-change 제거 */
.gallery-item:not(:hover) {
  will-change: auto;
}
```

**콘텐츠 가시성 최적화**

```css
/* 뷰포트 외부 요소 렌더링 최적화 */
.gallery-item:not(.visible) {
  content-visibility: auto;
  contain-intrinsic-size: 300px 200px;
}

/* 중요한 콘텐츠는 항상 렌더링 */
.gallery-item--priority {
  content-visibility: visible;
}
```

### 4. 접근성을 고려한 CSS

**고대비 모드 지원**

```css
/* 고대비 모드 감지 및 대응 */
@media (prefers-contrast: high) {
  :root {
    --xeg-color-primary: #0066cc;
    --xeg-color-secondary: #004080;
    --xeg-border-width: 2px;
  }

  .gallery-item {
    border: var(--xeg-border-width) solid var(--xeg-color-primary);
  }
}

/* 모션 감소 선호 사용자 대응 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**키보드 내비게이션 향상**

```css
/* 포커스 표시 향상 */
.gallery-item:focus-visible {
  outline: 3px solid var(--xeg-color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* 터치 대상 크기 보장 */
.gallery-button {
  min-width: 44px;
  min-height: 44px;
  padding: var(--xeg-spacing-sm);
}
```

### 5. CSS 최적화 도구 연동

**PostCSS 활용 최적화**

```javascript
// postcss.config.cjs 확장
module.exports = {
  plugins: [
    // CSS 변수 보존
    require('postcss-custom-properties')({
      preserve: true,
    }),

    // 자동 vendor prefix
    require('autoprefixer'),

    // 사용하지 않는 CSS 제거
    process.env.NODE_ENV === 'production' &&
      require('@fullhuman/postcss-purgecss')({
        content: ['./src/**/*.{tsx,ts}'],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      }),

    // CSS 압축
    process.env.NODE_ENV === 'production' &&
      require('cssnano')({
        preset: [
          'default',
          {
            cssDeclarationSorter: false, // CSS 변수 순서 보존
            reduceIdents: false, // CSS 변수명 보존
          },
        ],
      }),
  ].filter(Boolean),
};
```

**CSS-in-TS 최적화**

```typescript
// styled-components 대신 최적화된 스타일 함수
export function createOptimizedStyles(theme: Theme) {
  return {
    container: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      // CSS 변수 직접 사용으로 런타임 최적화
      borderRadius: 'var(--xeg-border-radius)',
      transition: 'var(--xeg-transition-standard)',
    } as const,
  };
}

// 스타일 객체를 CSS 문자열로 변환
export function stylesToCSS(styles: Record<string, React.CSSProperties>): string {
  return Object.entries(styles)
    .map(([selector, style]) => {
      const cssProps = Object.entries(style)
        .map(([prop, value]) => `${camelToKebab(prop)}: ${value};`)
        .join('\n  ');

      return `.${selector} {\n  ${cssProps}\n}`;
    })
    .join('\n\n');
}
```

### 6. CSS 빌드 최적화

**Critical CSS 추출**

```typescript
// 중요한 CSS를 별도로 추출하여 인라인 삽입
export class CriticalCSSExtractor {
  private static readonly CRITICAL_SELECTORS = [
    '.xeg-container',
    '.xeg-gallery',
    '.xeg-button',
    '.xeg-modal',
  ];

  static extractCriticalCSS(fullCSS: string): string {
    return this.CRITICAL_SELECTORS.map(selector => this.extractSelector(fullCSS, selector))
      .filter(Boolean)
      .join('\n');
  }

  private static extractSelector(css: string, selector: string): string {
    const regex = new RegExp(`${selector}\\s*{[^}]*}`, 'g');
    return css.match(regex)?.[0] || '';
  }
}
```

**CSS 번들 최적화**

```typescript
// CSS 모듈을 런타임에 동적으로 로딩
export class DynamicCSSLoader {
  private static loadedModules = new Set<string>();

  static async loadCSS(moduleName: string): Promise<void> {
    if (this.loadedModules.has(moduleName)) {
      return;
    }

    try {
      // 동적 import로 CSS 모듈 로딩
      const cssModule = await import(`@assets/styles/${moduleName}.css`);

      // CSS 문자열을 스타일 태그로 주입
      const styleId = `dynamic-css-${moduleName}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = cssModule.default;
        document.head.appendChild(style);
      }

      this.loadedModules.add(moduleName);
    } catch (error) {
      console.warn(`Failed to load CSS module: ${moduleName}`, error);
    }
  }

  static preloadCSS(moduleNames: string[]): void {
    // 다음 프레임에 CSS 미리 로딩
    requestIdleCallback(() => {
      moduleNames.forEach(name => this.loadCSS(name));
    });
  }
}
```

### 7. 반응형 디자인 최적화

**유연한 브레이크포인트 시스템**

```css
/* 콘텐츠 기반 브레이크포인트 */
:root {
  --bp-gallery-single: 20rem; /* 320px - 단일 컬럼 */
  --bp-gallery-double: 37.5rem; /* 600px - 2컬럼 */
  --bp-gallery-triple: 56.25rem; /* 900px - 3컬럼 */
  --bp-gallery-quad: 75rem; /* 1200px - 4컬럼 */
}

/* 컨테이너 쿼리로 더 정밀한 제어 */
@container (width >= var(--bp-gallery-double)) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@container (width >= var(--bp-gallery-triple)) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**플루이드 타이포그래피**

```css
/* 뷰포트에 따라 자연스럽게 크기 조절 */
:root {
  --font-size-fluid-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-fluid-md: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
  --font-size-fluid-lg: clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem);

  /* 읽기 편한 라인 길이 유지 */
  --line-length-optimal: clamp(45ch, 50vw, 65ch);
}

.gallery-title {
  font-size: var(--font-size-fluid-lg);
  max-width: var(--line-length-optimal);
}
```

---

## 🚀 성능 고려사항

### 메모이제이션

```typescript
import { useMemo } from 'preact/hooks';

export function ExpensiveComponent({ data }: Props) {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);

  return <div>{processedData}</div>;
}
```

### 지연 로딩

```typescript
// 동적 import 사용
export async function createGallery() {
  const { GalleryManager } = await import('@features/gallery/GalleryManager');
  return new GalleryManager();
}
```

---

## 🎨 고급 CSS 스타일링 최적화

### 1. CSS 변수 시스템 최적화

**플루이드 타이포그래피와 반응형 시스템**

```css
:root {
  /* 기본 스케일링 */
  --xeg-scale-factor: 1;
  --xeg-base-size: 16px;

  /* 플루이드 크기 (viewport 기반) */
  --xeg-font-size-fluid-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --xeg-font-size-fluid-md: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --xeg-font-size-fluid-lg: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);

  /* 컨텍스트 기반 간격 */
  --xeg-spacing-container: clamp(1rem, 5vw, 3rem);
  --xeg-spacing-content: clamp(0.5rem, 2.5vw, 1.5rem);

  /* 고성능 애니메이션 변수 */
  --xeg-easing-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --xeg-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);

  /* 접근성 고려 */
  --xeg-motion-duration: 0.3s;
  --xeg-focus-ring: 2px solid var(--xeg-color-primary);
}

/* 모션 감소 선호 사용자 대응 */
@media (prefers-reduced-motion: reduce) {
  :root {
    --xeg-motion-duration: 0.01s;
    --xeg-easing-spring: linear;
    --xeg-easing-smooth: linear;
  }
}

/* 고대비 모드 대응 */
@media (prefers-contrast: high) {
  :root {
    --xeg-color-primary: #000000;
    --xeg-bg-primary: #ffffff;
    --xeg-focus-ring: 3px solid #000000;
  }
}
```

### 2. 최신 CSS 레이아웃 기법

**Container Queries를 활용한 컴포넌트 기반 반응형**

```css
/* 갤러리 컨테이너 쿼리 */
.xeg-gallery-container {
  container-type: inline-size;
  container-name: gallery;
}

/* 컨테이너 크기에 따른 레이아웃 */
@container gallery (width < 480px) {
  .xeg-gallery-grid {
    grid-template-columns: 1fr;
    gap: var(--xeg-spacing-sm);
  }

  .xeg-gallery-toolbar {
    flex-direction: column;
    padding: var(--xeg-spacing-xs);
  }
}

@container gallery (width >= 768px) {
  .xeg-gallery-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--xeg-spacing-lg);
  }

  .xeg-gallery-toolbar {
    flex-direction: row;
    justify-content: space-between;
  }
}

@container gallery (width >= 1200px) {
  .xeg-gallery-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--xeg-spacing-xl);
  }
}
```

**CSS Grid와 Subgrid 활용**

```css
.xeg-media-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--xeg-spacing-sm);
}

/* 복잡한 카드 레이아웃 */
.xeg-media-card--detailed {
  grid-template-areas:
    'thumbnail title    actions'
    'thumbnail metadata actions'
    'thumbnail tags     actions';
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto 1fr;
}

.xeg-media-thumbnail {
  grid-area: thumbnail;
}
.xeg-media-title {
  grid-area: title;
}
.xeg-media-metadata {
  grid-area: metadata;
}
.xeg-media-tags {
  grid-area: tags;
}
.xeg-media-actions {
  grid-area: actions;
}
```

### 3. 성능 최적화된 애니메이션

**GPU 가속과 레이어 최적화**

```css
/* 하드웨어 가속 활용 */
.xeg-gallery-item {
  /* GPU 레이어 생성 */
  transform: translateZ(0);

  /* 브라우저 최적화 힌트 */
  will-change: transform, opacity;

  /* 효율적인 속성만 애니메이션 */
  transition:
    transform var(--xeg-motion-duration) var(--xeg-easing-smooth),
    opacity var(--xeg-motion-duration) var(--xeg-easing-smooth);
}

.xeg-gallery-item:hover {
  transform: translateY(-4px) translateZ(0);
}

/* 애니메이션 완료 후 will-change 제거 */
.xeg-gallery-item:not(:hover):not(:focus) {
  will-change: auto;
}

/* 고성능 키프레임 애니메이션 */
@keyframes xegSlideInUp {
  from {
    transform: translateY(100%) translateZ(0);
    opacity: 0;
  }
  to {
    transform: translateY(0) translateZ(0);
    opacity: 1;
  }
}

.xeg-slide-in-up {
  animation: xegSlideInUp var(--xeg-motion-duration) var(--xeg-easing-spring);
}
```

### 4. 콘텐츠 가시성 최적화

**Intersection Observer와 CSS 조합**

```css
/* 뷰포트 외부 요소 렌더링 최적화 */
.xeg-lazy-content {
  content-visibility: auto;
  contain-intrinsic-size: 300px 200px;
}

/* 중요한 콘텐츠는 항상 렌더링 */
.xeg-priority-content {
  content-visibility: visible;
}

/* 스크롤 성능 최적화 */
.xeg-scroll-container {
  /* 스크롤 스냅 */
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;

  /* 스크롤바 스타일링 */
  scrollbar-width: thin;
  scrollbar-color: var(--xeg-color-neutral-400) transparent;
}

.xeg-scroll-item {
  scroll-snap-align: start;
}
```

### 5. 테마 시스템과 다크 모드

**동적 테마 전환**

```css
/* 라이트 테마 (기본) */
:root {
  --xeg-color-scheme: light;
  --xeg-text-primary: #0f1419;
  --xeg-bg-primary: #ffffff;
  --xeg-shadow-color: rgba(15, 23, 42, 0.1);
}

/* 다크 테마 */
[data-theme='dark'] {
  --xeg-color-scheme: dark;
  --xeg-text-primary: #e7e9ea;
  --xeg-bg-primary: #15202b;
  --xeg-shadow-color: rgba(0, 0, 0, 0.3);
}

/* 시스템 선호도에 따른 자동 다크 모드 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --xeg-color-scheme: dark;
    --xeg-text-primary: #e7e9ea;
    --xeg-bg-primary: #15202b;
    --xeg-shadow-color: rgba(0, 0, 0, 0.3);
  }
}

/* 테마 전환 애니메이션 */
* {
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
```

### 6. 스크롤 관리 (ScrollManager)

**통합 스크롤 관리 시스템**

```typescript
// ✅ 스크롤 관리자 import 및 사용
import { scrollManager } from '@core/services/scroll/ScrollManager';

// 갤러리 진입 시 페이지 스크롤 보호
function openGallery() {
  const savedPosition = scrollManager.lockPageScroll();
  console.log('스크롤 잠금 적용:', savedPosition);
}

// 갤러리 종료 시 스크롤 복원
function closeGallery() {
  scrollManager.unlockPageScroll();
  console.log('스크롤 위치 복원 완료');
}

// 갤러리 내부 아이템으로 스크롤
function scrollToItem(containerElement: HTMLElement, itemIndex: number) {
  scrollManager.scrollToGalleryItem(containerElement, itemIndex, {
    behavior: 'smooth',
    offset: -10, // 약간의 여백
  });
}
```

**스크롤 보호 Hook 패턴**

```typescript
// ✅ 갤러리 스크롤 보호 커스텀 훅
import { useGalleryScrollProtection } from '@features/gallery/hooks';

function GalleryComponent() {
  const { scrollToCurrentImageSafely, isScrollProtected } = useGalleryScrollProtection({
    isGalleryOpen: true,
    currentIndex: 0,
    containerRef: galleryRef,
    mediaItems: items,
  });

  return (
    <div ref={galleryRef}>
      {/* 갤러리 내용 */}
    </div>
  );
}
```

**스크롤 관리 모범 사례**

```typescript
// ✅ 안전한 스크롤 관리 - 에러 처리 포함
function handleGalleryClose() {
  try {
    scrollManager.unlockPageScroll();
    logger.debug('스크롤 정상 복원');
  } catch (error) {
    logger.warn('스크롤 복원 실패, 강제 복원 시도:', error);

    // 비상 복원 시도
    try {
      scrollManager.forceRestoreScrollPosition();
      logger.debug('강제 스크롤 복원 성공');
    } catch (forceError) {
      logger.error('강제 스크롤 복원 실패:', forceError);
    }
  }
}

// ✅ 스크롤 상태 진단 (디버깅용)
function debugScrollState() {
  const diagnostics = scrollManager.getDiagnostics();
  console.log('스크롤 상태 진단:', diagnostics);
}
```

**❌ 금지사항**

```typescript
// ❌ 직접 window.scrollTo 사용 금지
window.scrollTo(0, 0); // 금지

// ❌ 개별 스크롤 보호 구현 금지
document.body.style.overflow = 'hidden'; // 금지

// ❌ 중복 스크롤 서비스 생성 금지
class MyScrollService {} // 금지 - ScrollManager 사용
```

**CSS 스크롤 잠금 클래스**

```css
/* ✅ ScrollManager가 사용하는 CSS 클래스 */
body.xeg-scroll-locked {
  position: fixed !important;
  width: 100% !important;
  overflow: hidden !important;
  touch-action: none;
  overscroll-behavior: none;
}

/* 모바일 최적화 */
@media (hover: none) and (pointer: coarse) {
  body.xeg-scroll-locked {
    top: var(--xeg-scroll-lock-top, 0) !important;
    left: var(--xeg-scroll-lock-left, 0) !important;
    height: 100% !important;
    -webkit-overflow-scrolling: touch;
  }
}
```
