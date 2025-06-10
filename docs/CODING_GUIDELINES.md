# 🏗️ X.com Enhanced Gallery 코딩 가이드라인

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
import { getFflate, getPreact, getMotion } from '@shared/utils/vendors';

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
      <button onClick={() => onAction('example')}>
        Action
      </button>
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
```

### 4. 타입 정의

**인터페이스 명명**

```typescript
// 컴포넌트 Props
interface GalleryProps {}
interface MediaViewerProps {}

// 비즈니스 모델
interface MediaItem {}
interface DownloadOptions {}

// 서비스 인터페이스
interface IMediaExtractor {}
interface IDownloadService {}
```

**공통 타입 위치**

```
shared/types/       # 여러 레이어에서 사용
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

### 6. 서비스 및 비즈니스 로직

**싱글톤 서비스 패턴**

```typescript
export class MediaExtractorService {
  private static instance: MediaExtractorService;

  public static getInstance(): MediaExtractorService {
    if (!MediaExtractorService.instance) {
      MediaExtractorService.instance = new MediaExtractorService();
    }
    return MediaExtractorService.instance;
  }

  private constructor() {}

  public async extractMediaFromTweet(element: HTMLElement): Promise<MediaItem[]> {
    // 구현...
  }
}
```

**팩토리 패턴**

```typescript
export class ComponentFactory {
  public static createGallery(options: GalleryOptions): GalleryComponent {
    // 구현...
  }

  public static createViewer(type: MediaType): ViewerComponent {
    // 구현...
  }
}
```

## 🏷️ 명명 규칙

### 파일 및 디렉토리

```
PascalCase    - 컴포넌트 파일, 클래스 파일
kebab-case    - 일반 파일, 디렉토리
camelCase     - 유틸리티 함수 파일
UPPER_CASE    - 상수 파일
```

**예시**

```
GalleryManager.tsx     # 컴포넌트/클래스
media-extractor.ts     # 유틸리티
gallery.signals.ts     # Signal 파일
DOWNLOAD_CONSTANTS.ts  # 상수
```

### 변수 및 함수

```typescript
// 변수: camelCase
const mediaItems = [];
const selectedIndex = 0;

// 함수: camelCase
function extractMediaUrl() {}
function handleDownload() {}

// 상수: UPPER_SNAKE_CASE
const MAX_DOWNLOAD_SIZE = 100;
const DEFAULT_QUALITY = 'original';

// 타입/인터페이스: PascalCase
interface MediaItem {}
type DownloadStatus = 'pending' | 'completed';

// 컴포넌트: PascalCase
function GalleryViewer() {}
```

### CSS 클래스

```css
/* BEM 방법론 또는 camelCase */
.gallery-container {
}
.gallery__item {
}
.gallery__item--selected {
}

/* 또는 CSS 모듈에서 camelCase */
.container {
}
.mediaItem {
}
.selectedItem {
}
```

## 🔧 유틸리티 및 헬퍼

### 디렉토리 구조

```
shared/utils/
├── media/              # 미디어 관련 유틸리티
├── performance/        # 성능 최적화
├── vendors/           # 외부 라이브러리 접근
├── zip/               # ZIP 처리
└── dom/               # DOM 조작
```

### JSDoc 문서화

````typescript
/**
 * 트위터 미디어 URL에서 원본 화질 URL을 추출합니다.
 *
 * @param url - 처리할 미디어 URL
 * @param format - 원하는 포맷 ('jpg', 'png', 'webp')
 * @returns 원본 화질 URL
 *
 * @example
 * ```typescript
 * const originalUrl = getOriginalMediaUrl(
 *   'https://pbs.twimg.com/media/example.jpg:small',
 *   'jpg'
 * );
 * // 'https://pbs.twimg.com/media/example.jpg:orig'
 * ```
 */
export function getOriginalMediaUrl(url: string, format?: string): string {
  // 구현...
}
````

## 📚 API 설계 패턴

### 서비스 인터페이스

```typescript
export interface IMediaExtractor {
  extractMediaFromTweet(element: HTMLElement): Promise<MediaItem[]>;
  extractSingleMedia(element: HTMLElement): Promise<MediaItem | null>;
}

export interface IDownloadService {
  downloadSingle(item: MediaItem, options?: DownloadOptions): Promise<void>;
  downloadMultiple(items: MediaItem[], options?: DownloadOptions): Promise<void>;
}
```

### 이벤트 시스템

```typescript
// 타입 안전한 이벤트
type GalleryEvents = {
  'gallery:open': { items: MediaItem[] };
  'gallery:close': {};
  'media:select': { item: MediaItem };
};

// 이벤트 리스너
export function onGalleryEvent<K extends keyof GalleryEvents>(
  event: K,
  handler: (data: GalleryEvents[K]) => void
): void {
  // 구현...
}
```

## 🚀 성능 고려사항

### 메모이제이션

```typescript
import { useMemo } from 'preact/hooks';

export function ExpensiveComponent({ data }: Props) {
  const processedData = useMemo(() => {
    return expensiveProcessing(data);
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

## ✅ 코드 품질

### ESLint 규칙 준수

- 사용하지 않는 import 제거
- 명시적 타입 지정
- 일관된 코딩 스타일

### TypeScript 엄격 모드

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`

### 테스트 작성

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';

describe('Component', () => {
  it('should handle user interaction correctly', async () => {
    // 테스트 구현...
  });
});
```

---

> **📋 참고**: 이 가이드라인은 프로젝트의 일관성과 유지보수성을 보장하기 위한 핵심 규칙들입니다. 새로운 코드 작성 시 반드시 준수해주세요.
