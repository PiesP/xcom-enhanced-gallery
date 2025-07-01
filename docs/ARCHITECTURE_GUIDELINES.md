# 🏗️ X.com Enhanced Gallery - Clean Architecture Guide

> **트위터(X) 미디어 확장 프로그램 - Clean Architecture 기반 설계 및 구현 가이드**

## 📋 목차

1. [아키텍처 개요](#아키텍처-개요)
2. [레이어별 책임](#레이어별-책임)
3. [기술 스택 책임 분리](#기술-스택-책임-분리)
4. [개발 워크플로우](#개발-워크플로우)
5. [디자인 시스템](#디자인-시스템)
6. [배포 가이드](#배포-가이드)
7. [번들 최적화 및 성능 아키텍처](#번들-최적화-및-성능-아키텍처)
8. [리팩토링 및 코드 정리 가이드](#리팩토링-및-코드-정리-가이드)

---

## 🎯 아키텍처 개요

### Clean Architecture 원칙

X.com Enhanced Gallery는 Clean Architecture 원칙을 따라 다음과 같이 설계되었습니다:

```
┌─────────────────────────────────────────────────┐
│                  App Layer                      │ ← 애플리케이션 진입점
│  (애플리케이션 설정 및 부트스트래핑)              │
└─────────────────┬───────────────────────────────┘
                  │ depends on
┌─────────────────▼───────────────────────────────┐
│                Features Layer                   │ ← 비즈니스 기능
│     (gallery, media, settings)                  │
└─────────────────┬───────────────────────────────┘
                  │ depends on
┌─────────────────▼───────────────────────────────┐
│                Shared Layer                     │ ← 공통 재사용 모듈
│  (components, hooks, utils, types)              │
└─────────────────┬───────────────────────────────┘
                  │ depends on
┌─────────────────▼───────────────────────────────┐
│                 Core Layer                      │ ← 핵심 비즈니스 로직
│    (state, services, constants)                 │
└─────────────────┬───────────────────────────────┘
                  │ depends on
┌─────────────────▼───────────────────────────────┐
│            Infrastructure Layer                 │ ← 외부 의존성
│     (browser, logging, storage, i18n)           │
└─────────────────────────────────────────────────┘
```

### 의존성 규칙

- **상위 레이어**는 **하위 레이어**에만 의존할 수 있습니다
- **하위 레이어**는 **상위 레이어**를 알아서는 안 됩니다
- **외부 라이브러리**는 반드시 전용 getter를 통해 접근합니다

---

## 🏛️ 레이어별 책임

### 1. App Layer (`src/app/`)

**책임**: 애플리케이션 초기화 및 전역 설정

```
app/
└── AppBootstrapper.ts     # 애플리케이션 부트스트래핑
```

**주요 역할**:

- 애플리케이션 진입점 제공
- 전역 설정 및 초기화
- 의존성 주입 설정
- 에러 바운더리 설정

### 2. Features Layer (`src/features/`)

**책임**: 비즈니스 기능 구현

```
features/
├── gallery/              # 갤러리 뷰어 기능
│   ├── components/       # 갤러리 전용 컴포넌트
│   ├── services/         # 갤러리 비즈니스 서비스
│   └── types/           # 갤러리 관련 타입
├── media/               # 미디어 처리 기능
│   ├── extractors/      # 미디어 추출기
│   ├── processors/      # 미디어 처리기
│   └── downloaders/     # 다운로드 서비스
└── settings/            # 설정 관리 기능
    ├── components/      # 설정 UI
    └── services/        # 설정 비즈니스 로직
```

**주요 역할**:

- 사용자 인터랙션 처리
- 비즈니스 유스케이스 구현
- UI와 비즈니스 로직 연결

### 3. Shared Layer (`src/shared/`)

**책임**: 재사용 가능한 컴포넌트 및 유틸리티

```
shared/
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── Button/
│   ├── Modal/
│   └── Gallery/
├── hooks/              # 커스텀 훅
│   ├── useMediaQuery/
│   └── useDebounce/
├── utils/              # 유틸리티 함수
│   ├── external/       # 외부 라이브러리 래퍼
│   ├── media/          # 미디어 관련 유틸
│   └── performance/    # 성능 최적화 유틸
└── types/              # 공통 타입 정의
```

**주요 역할**:

- 재사용 가능한 UI 컴포넌트 제공
- 공통 비즈니스 로직 추상화
- 외부 라이브러리 래핑

### 4. Core Layer (`src/core/`)

**책임**: 핵심 비즈니스 로직 및 상태 관리

```
core/
├── state/              # Preact Signals 상태 관리
│   └── signals/        # 각 도메인별 Signal
├── services/           # 핵심 비즈니스 서비스
│   ├── MediaService/
│   └── DownloadService/
├── constants/          # 전역 상수
└── types/             # 핵심 도메인 타입
```

**주요 역할**:

- 애플리케이션 상태 관리
- 도메인 모델 정의
- 핵심 비즈니스 규칙 구현

### 5. Infrastructure Layer (`src/infrastructure/`)

**책임**: 외부 시스템과의 인터페이스

```
infrastructure/
├── browser/            # 브라우저 API 추상화
├── logging/            # 로깅 시스템
├── storage/            # 로컬 스토리지 관리
└── i18n/              # 국제화
```

**주요 역할**:

- 브라우저 API 래핑
- 외부 서비스 통신
- 인프라 관련 설정

---

## 🛠️ 기술 스택 책임 분리

### 1. Preact (UI 렌더링)

**책임**: React 호환 UI 컴포넌트 시스템

```typescript
// ✅ 올바른 사용법
import { getPreact } from '@infrastructure/external/vendors';

const { render, h } = getPreact();

function Component() {
  return h('div', { className: 'container' }, 'Hello World');
}
```

**사용 위치**:

- `src/shared/components/` - 재사용 가능한 UI 컴포넌트
- `src/features/*/components/` - 기능별 컴포넌트

**금지 사항**:

- 직접 import 금지
- 상태 관리 포함 금지 (Signals 사용)

### 2. Preact Signals (상태 관리)

**책임**: 반응형 상태 관리 및 컴포넌트 간 통신

```typescript
// Signal 정의
export const mediaItems = signal<MediaItem[]>([]);

// Action 함수로 상태 변경
export function addMediaItem(item: MediaItem) {
  mediaItems.value = [...mediaItems.value, item];
}

// 컴포넌트에서 사용
function MediaList() {
  return (
    <div>
      {mediaItems.value.map(item =>
        <MediaCard key={item.id} item={item} />
      )}
    </div>
  );
}
```

**사용 위치**:

- `src/core/state/signals/` - 모든 상태 정의
- 컴포넌트에서 상태 구독

### 3. TypeScript (타입 안전성)

**책임**: 컴파일 타임 타입 검증 및 개발 생산성

**타입 정의 위치**:

- `src/shared/types/` - 여러 레이어에서 사용하는 공통 타입
- `src/core/types/` - 비즈니스 도메인 타입
- `src/features/*/types/` - 특정 기능 전용 타입

---

## 🧠 TypeScript 코딩 패러다임

### 1. 함수형 프로그래밍 (Functional Programming)

**핵심 원칙**: 순수 함수, 불변성, 조합성

```typescript
// ✅ 순수 함수 - 부작용 없음, 동일 입력에 동일 출력
export function getOriginalMediaUrl(url: string, format: string = 'orig'): string {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL provided');
  }

  return url.replace(/:(small|medium|large)$/, `:${format}`);
}

// ✅ 불변성 - 원본 데이터 변경 없이 새로운 데이터 반환
export function addMediaItem(items: MediaItem[], newItem: MediaItem): MediaItem[] {
  return [...items, newItem];
}

// ✅ 조합성 - 작은 함수들의 조합
export const processMediaUrl = pipe(validateUrl, normalizeUrl, getOriginalUrl);
```

**적용 영역**:

- 유틸리티 함수 (`src/shared/utils/`)
- 데이터 변환 로직
- 상태 업데이트 함수

### 2. 객체지향 프로그래밍 (Object-Oriented Programming)

**핵심 원칙**: 캡슐화, 상속, 다형성, SOLID 원칙

```typescript
// ✅ 단일 책임 원칙 (SRP)
export class MediaExtractor {
  private readonly supportedTypes = ['image', 'video', 'gif'];

  public canExtract(element: HTMLElement): boolean {
    return this.hasMediaAttributes(element);
  }

  public async extract(element: HTMLElement): Promise<MediaItem[]> {
    if (!this.canExtract(element)) {
      throw new ExtractorError('Cannot extract media from element');
    }

    return this.performExtraction(element);
  }

  private hasMediaAttributes(element: HTMLElement): boolean {
    // 구현...
  }

  private async performExtraction(element: HTMLElement): Promise<MediaItem[]> {
    // 구현...
  }
}

// ✅ 개방-폐쇄 원칙 (OCP) - 인터페이스 기반 확장
export interface IMediaExtractor {
  canExtract(element: HTMLElement): boolean;
  extract(element: HTMLElement): Promise<MediaItem[]>;
}

export class ImageExtractor implements IMediaExtractor {
  // 특화된 이미지 추출 로직
}

export class VideoExtractor implements IMediaExtractor {
  // 특화된 비디오 추출 로직
}
```

**적용 영역**:

- 서비스 클래스 (`src/core/services/`)
- 컴포넌트 클래스 (`src/features/*/components/`)
- 추상화가 필요한 복잡한 로직

### 3. 전략 패턴 (Strategy Pattern)

**목적**: 알고리즘을 런타임에 선택할 수 있도록 캡슐화

```typescript
// ✅ 전략 인터페이스
export interface TweetExtractionStrategy {
  readonly name: string;
  readonly priority: number;
  extract(container: HTMLElement, context?: Element): TweetInfo | null;
}

// ✅ 구체적 전략들
export class UrlBasedStrategy implements TweetExtractionStrategy {
  readonly name = 'url-based';
  readonly priority = 1;

  extract(container: HTMLElement): TweetInfo | null {
    // URL 기반 추출 로직
  }
}

export class DataAttributeStrategy implements TweetExtractionStrategy {
  readonly name = 'data-attribute';
  readonly priority = 2;

  extract(container: HTMLElement): TweetInfo | null {
    // 데이터 속성 기반 추출 로직
  }
}

// ✅ 컨텍스트 클래스
export class TweetExtractor {
  private strategies: TweetExtractionStrategy[] = [];

  public addStrategy(strategy: TweetExtractionStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  public extract(container: HTMLElement): TweetInfo | null {
    for (const strategy of this.strategies) {
      try {
        const result = strategy.extract(container);
        if (result) {
          logger.debug(`Extraction successful with ${strategy.name}`);
          return result;
        }
      } catch (error) {
        logger.warn(`Strategy ${strategy.name} failed:`, error);
      }
    }
    return null;
  }
}
```

### 4. 싱글톤 패턴 (Singleton Pattern)

**목적**: 전역적으로 하나의 인스턴스만 존재하도록 보장

```typescript
// ✅ 표준 싱글톤 구현
export class MediaManager {
  private static instance: MediaManager | null = null;
  private mediaCache = new Map<string, MediaItem>();

  private constructor() {
    // 초기화 로직
  }

  public static getInstance(): MediaManager {
    MediaManager.instance ??= new MediaManager();
    return MediaManager.instance;
  }

  public static resetInstance(): void {
    MediaManager.instance = null;
  }

  public cacheMedia(id: string, item: MediaItem): void {
    this.mediaCache.set(id, item);
  }

  public getCachedMedia(id: string): MediaItem | undefined {
    return this.mediaCache.get(id);
  }
}

// ✅ 함수형 싱글톤 헬퍼 사용
export const getMediaManager = createSingleton(() => new MediaManager());
```

### 5. 빌더 패턴 (Builder Pattern)

**목적**: 복잡한 객체의 생성 과정을 단계별로 구성

```typescript
// ✅ 빌더 패턴으로 갤러리 설정 구성
export class GalleryConfigBuilder {
  private config: Partial<GalleryConfig> = {};

  public withTheme(theme: ThemeConfig): this {
    this.config.theme = theme;
    return this;
  }

  public withSize(width: number, height: number): this {
    this.config.size = { width, height };
    return this;
  }

  public withAutoplay(enabled: boolean): this {
    this.config.autoplay = enabled;
    return this;
  }

  public enableKeyboardNavigation(): this {
    this.config.keyboardNavigation = true;
    return this;
  }

  public build(): GalleryConfig {
    return {
      theme: this.config.theme ?? DEFAULT_THEME,
      size: this.config.size ?? DEFAULT_SIZE,
      autoplay: this.config.autoplay ?? false,
      keyboardNavigation: this.config.keyboardNavigation ?? true,
    };
  }
}

// 사용법
const config = new GalleryConfigBuilder()
  .withTheme(darkTheme)
  .withSize(800, 600)
  .enableKeyboardNavigation()
  .build();
```

### 6. 타입 안전성 최대화

**제네릭과 조건부 타입 활용**

```typescript
// ✅ 제네릭으로 타입 안전성 보장
export interface ApiResponse<T = unknown> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

export async function fetchMedia<T extends MediaItem>(
  url: string,
  transformer: (data: unknown) => T
): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  const rawData = await response.json();

  return {
    data: transformer(rawData),
    status: 'success',
  };
}

// ✅ 조건부 타입으로 유연한 API 설계
type EventHandler<T> = T extends string
  ? (message: T) => void
  : T extends MediaItem
    ? (item: T) => void
    : (data: T) => void;

export function createEventHandler<T>(callback: EventHandler<T>): EventHandler<T> {
  return callback;
}
```

### 7. 의존성 주입 (Dependency Injection)

**목적**: 느슨한 결합과 테스트 가능성 향상

```typescript
// ✅ 인터페이스 정의
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface IStorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

// ✅ 의존성 주입 받는 서비스
export class DownloadService {
  constructor(
    private readonly logger: ILogger,
    private readonly storage: IStorageService
  ) {}

  public async downloadMedia(item: MediaItem): Promise<void> {
    this.logger.info(`Starting download: ${item.id}`);

    try {
      // 다운로드 로직
      await this.storage.set(`download_${item.id}`, {
        status: 'completed',
        timestamp: Date.now(),
      });

      this.logger.info(`Download completed: ${item.id}`);
    } catch (error) {
      this.logger.error(`Download failed: ${item.id}`, error);
      throw error;
    }
  }
}

// ✅ 팩토리로 의존성 주입
export function createDownloadService(): DownloadService {
  return new DownloadService(logger, BrowserStorageService.getInstance());
}
```

### 패러다임 선택 가이드

| 상황                 | 권장 패러다임 | 이유                         |
| -------------------- | ------------- | ---------------------------- |
| 데이터 변환          | 함수형        | 순수 함수로 예측 가능한 결과 |
| 복잡한 비즈니스 로직 | 객체지향      | 캡슐화와 재사용성            |
| 알고리즘 선택        | 전략 패턴     | 런타임 유연성                |
| 전역 상태 관리       | 싱글톤        | 단일 진실의 원천             |
| 복잡한 설정          | 빌더 패턴     | 가독성과 유연성              |
| 서비스 설계          | 의존성 주입   | 테스트 가능성과 모듈성       |

---

## 🚀 번들 최적화 및 성능 아키텍처

### 외부 라이브러리 최적화 전략

**현재 상태**: 번들링 방식

- 외부 라이브러리(`preact`, `fflate` 등)를 최종 스크립트에 포함
- 안정적이지만 파일 크기 증가

**최적화 방향**: CDN 분리 방식

- `@require` 지시문을 통한 외부 라이브러리 CDN 로딩
- 핵심 코드만 번들에 포함하여 크기 최적화

```typescript
// 현재: 번들링 방식
import { getFflate, getPreact } from '@infrastructure/external/vendors';

// 최적화: CDN 분리 시 전역 객체 접근
declare global {
  const preact: typeof import('preact');
  const fflate: typeof import('fflate');
}
```

### CDN 분리 구현 계획

**1. 빌드 설정 변경**

```typescript
// vite.config.ts 수정 예시
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['preact', 'fflate', '@preact/signals-core'],
      output: {
        globals: {
          preact: 'preact',
          fflate: 'fflate',
          '@preact/signals-core': 'signals',
        },
      },
    },
  },
});
```

**2. 유저스크립트 메타블록 자동 생성**

```typescript
// scripts/build-tools.js 확장
function generateUserscriptHeader(buildMode: BuildMode): string {
  const cdnRequires = [
    '// @require      https://cdn.jsdelivr.net/npm/preact@10.26.8/dist/preact.umd.js',
    '// @require      https://cdn.jsdelivr.net/npm/@preact/signals-core@1.6.0/dist/signals-core.umd.js',
    '// @require      https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js',
  ];

  return `// ==UserScript==
// @name         X.com Enhanced Gallery${devSuffix}
// ...기존 메타데이터...
${cdnRequires.join('\n')}
// ==/UserScript==`;
}
```

**3. 점진적 마이그레이션 전략**

```typescript
// Phase 1: 하이브리드 방식 (fallback 지원)
function getExternalLibrary<T>(name: string, bundled: () => T): T {
  // CDN 버전 우선 사용, fallback으로 번들 버전
  return (window as any)[name] || bundled();
}

// Phase 2: 순수 CDN 방식
function getExternalLibrary<T>(name: string): T {
  const lib = (window as any)[name];
  if (!lib) {
    throw new Error(`External library ${name} not loaded from CDN`);
  }
  return lib;
}
```

### CSS 주입 최적화

**현재 구조 분석**

```typescript
// infrastructure/styling/CSSManager.ts 현재 방식
export class CSSManager {
  public inject(id: string, css: string): boolean {
    // 개별 <style> 태그 생성 및 주입
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }
}
```

**최적화된 구조**

```typescript
// 통합 CSS 주입 방식
export class OptimizedCSSManager {
  private static readonly UNIFIED_STYLE_ID = 'xeg-unified-styles';
  private cssModules = new Map<string, string>();
  private injected = false;

  public registerCSS(id: string, css: string): void {
    this.cssModules.set(id, css);
    this.requestInjection();
  }

  private requestInjection(): void {
    if (this.injected) return;

    // RAF을 사용하여 다음 프레임에 통합 주입
    requestAnimationFrame(() => {
      this.injectUnifiedCSS();
    });
  }

  private injectUnifiedCSS(): void {
    const unifiedCSS = Array.from(this.cssModules.values()).join('\n');

    const existingStyle = document.getElementById(OptimizedCSSManager.UNIFIED_STYLE_ID);
    if (existingStyle) {
      existingStyle.textContent = unifiedCSS;
    } else {
      const style = document.createElement('style');
      style.id = OptimizedCSSManager.UNIFIED_STYLE_ID;
      style.textContent = unifiedCSS;
      document.head.appendChild(style);
    }

    this.injected = true;
  }
}
```

---

## 🎨 CSS 스타일링 방법론 가이드

### 유저스크립트에서의 스타일링 접근법

유저스크립트 환경에서는 **두 가지 주요 스타일링 방법**을 상황에 맞게 선택적으로 사용해야 합니다:

| 방법                                         | 적용 범위   | 재사용성 | 성능               | 동적 스타일링 | 우선순위           |
| -------------------------------------------- | ----------- | -------- | ------------------ | ------------- | ------------------ |
| **CSS 주입** (`GM_addStyle`, `<style>` 태그) | 넓음 (다수) | 높음     | 효율적             | 제한적        | 높음 (유연함)      |
| **인라인 스타일** (`element.style`)          | 좁음 (단일) | 낮음     | 비효율적일 수 있음 | 매우 유연함   | 매우 높음 (고정적) |

### 1. CSS 주입 방식 (권장 - 정적 스타일)

**언제 사용하는가**: UI의 기본 구조, 레이아웃, 디자인 테마 등 **정적이고 재사용 가능한 스타일**

```typescript
// ✅ 올바른 사용 - 스타일과 로직 분리
import { CSSManager } from '@infrastructure/styling/CSSManager';

const cssManager = CSSManager.getInstance();

// 1. 스크립트 상단에서 CSS 정의 (한 번만)
cssManager.inject(
  'gallery-components',
  `
  /* 갤러리 기본 스타일 */
  .xeg-gallery-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--xeg-gallery-bg);
    z-index: var(--xeg-z-gallery);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 버튼 컴포넌트 */
  .xeg-button {
    padding: var(--xeg-spacing-sm) var(--xeg-spacing-md);
    border: 1px solid var(--xeg-color-primary);
    background: var(--xeg-bg-button);
    color: var(--xeg-text-button);
    cursor: pointer;
    transition: var(--xeg-transition-fast);
    border-radius: var(--xeg-radius-md);
  }

  .xeg-button:hover {
    background: var(--xeg-bg-button-hover);
    transform: translateY(-1px);
  }

  .xeg-button--active {
    background: var(--xeg-color-primary);
    color: white;
  }

  .xeg-button--disabled {
    opacity: var(--xeg-disabled-opacity);
    cursor: var(--xeg-disabled-cursor);
  }

  /* 의사 클래스와 미디어 쿼리 활용 */
  @media (prefers-reduced-motion: reduce) {
    .xeg-button {
      transition: none;
    }
  }
`
);

// 2. 로직 코드에서는 클래스만 제어
function createGalleryButton(text: string, isActive: boolean = false): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `xeg-button ${isActive ? 'xeg-button--active' : ''}`;
  button.textContent = text;

  // 상태 변경은 클래스 토글로
  button.addEventListener('click', () => {
    button.classList.toggle('xeg-button--active');
  });

  return button;
}
```

**장점**:

- **코드 분리**: CSS와 JavaScript 로직이 명확히 분리되어 유지보수성 향상
- **재사용성**: 정의된 클래스를 여러 요소에 적용 가능
- **CSS 기능 활용**: `:hover`, `::before`, `@media` 등 CSS의 모든 기능 사용 가능
- **성능 효율성**: 브라우저의 CSSOM을 통한 최적화된 렌더링

### 2. 인라인 스타일 방식 (동적 값 전용)

**언제 사용하는가**: **실시간으로 계속 변하는 동적인 값** (좌표, 크기, 진행률 등)

```typescript
// ✅ 올바른 사용 - 동적 값에만 인라인 스타일 사용
export class DraggablePanel {
  private element: HTMLElement;
  private isDragging = false;
  private offset = { x: 0, y: 0 };

  constructor() {
    this.element = document.createElement('div');
    // 기본 스타일은 CSS 클래스로 적용
    this.element.className = 'xeg-draggable-panel';

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.offset.x = e.clientX - this.element.offsetLeft;
      this.offset.y = e.clientY - this.element.offsetTop;

      // 드래깅 상태는 클래스로 관리
      this.element.classList.add('xeg-draggable-panel--dragging');
    });

    document.addEventListener('mousemove', e => {
      if (!this.isDragging) return;

      // ✅ 계산된 동적 값은 인라인 스타일로 적용
      const newX = e.clientX - this.offset.x;
      const newY = e.clientY - this.offset.y;

      this.element.style.left = `${newX}px`;
      this.element.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.element.classList.remove('xeg-draggable-panel--dragging');
    });
  }
}

// 프로그레스 바 예시
export class ProgressIndicator {
  private progressBar: HTMLElement;

  constructor(container: HTMLElement) {
    container.innerHTML = `
      <div class="xeg-progress-container">
        <div class="xeg-progress-bar"></div>
      </div>
    `;

    this.progressBar = container.querySelector('.xeg-progress-bar')!;
  }

  public updateProgress(percentage: number): void {
    // ✅ 동적으로 계산되는 값은 인라인 스타일로
    this.progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;

    // 상태 변화는 클래스로 관리
    if (percentage >= 100) {
      this.progressBar.classList.add('xeg-progress-bar--complete');
    } else {
      this.progressBar.classList.remove('xeg-progress-bar--complete');
    }
  }
}
```

**장점**:

- **동적 값 최적화**: JavaScript 변수 값을 직접 스타일에 할당하기 편리
- **최고 우선순위**: 복잡한 CSS 규칙을 확실하게 덮어쓸 수 있음

**단점**:

- **CSS 기능 제한**: `:hover` 같은 의사 클래스 사용 불가
- **코드 복잡성**: 많은 인라인 스타일은 코드를 지저분하게 만듦

### 3. 하이브리드 접근법 (권장 패턴)

**최선의 방법**: 두 방식을 목적에 맞게 조합하여 사용

```typescript
// ✅ 권장: 하이브리드 스타일링 패턴
export class InteractiveGallery {
  private container: HTMLElement;
  private currentIndex = 0;

  constructor() {
    // 1. CSS 주입으로 기본 구조와 테마 정의
    this.injectStyles();

    // 2. DOM 생성 시 클래스 적용
    this.container = this.createGalleryDOM();

    // 3. 동적 상호작용 설정
    this.setupInteractions();
  }

  private injectStyles(): void {
    cssManager.inject(
      'interactive-gallery',
      `
      .xeg-gallery {
        /* 기본 레이아웃과 테마 */
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: var(--xeg-spacing-lg);
        padding: var(--xeg-spacing-xl);
      }

      .xeg-gallery-item {
        /* 아이템 기본 스타일 */
        border-radius: var(--xeg-radius-lg);
        overflow: hidden;
        transition: var(--xeg-transition-normal);
      }

      .xeg-gallery-item--active {
        /* 활성화 상태 스타일 */
        transform: scale(1.05);
        box-shadow: var(--xeg-shadow-lg);
      }

      .xeg-gallery-nav {
        /* 내비게이션 버튼 기본 스타일 */
        opacity: 0.7;
        transition: var(--xeg-transition-fast);
      }

      .xeg-gallery-nav:hover {
        opacity: 1;
        transform: translateY(-2px);
      }
    `
    );
  }

  private createGalleryDOM(): HTMLElement {
    const gallery = document.createElement('div');
    gallery.className = 'xeg-gallery';

    // 정적 구조는 클래스로 스타일링
    gallery.innerHTML = `
      <button class="xeg-gallery-nav xeg-gallery-nav--prev">◀</button>
      <div class="xeg-gallery-viewport"></div>
      <button class="xeg-gallery-nav xeg-gallery-nav--next">▶</button>
    `;

    return gallery;
  }

  private setupInteractions(): void {
    const viewport = this.container.querySelector('.xeg-gallery-viewport')!;

    // 동적 위치 계산은 인라인 스타일로
    this.updateViewportPosition();

    // 내비게이션 이벤트
    this.container.addEventListener('click', e => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('xeg-gallery-nav--prev')) {
        this.navigate(-1);
      } else if (target.classList.contains('xeg-gallery-nav--next')) {
        this.navigate(1);
      }
    });
  }

  private navigate(direction: number): void {
    this.currentIndex += direction;

    // ✅ 계산된 위치는 인라인 스타일로 적용
    this.updateViewportPosition();

    // ✅ 상태 변화는 클래스로 관리
    this.updateActiveStates();
  }

  private updateViewportPosition(): void {
    const viewport = this.container.querySelector('.xeg-gallery-viewport')! as HTMLElement;
    const translateX = -this.currentIndex * 100;

    // 동적 변환 값은 인라인으로
    viewport.style.transform = `translateX(${translateX}%)`;
  }

  private updateActiveStates(): void {
    // 활성화 상태는 클래스로 관리
    const items = this.container.querySelectorAll('.xeg-gallery-item');
    items.forEach((item, index) => {
      item.classList.toggle('xeg-gallery-item--active', index === this.currentIndex);
    });
  }
}
```

### 성능 최적화 고려사항

**1. CSS 주입 최적화**

```typescript
// ✅ 효율적인 CSS 관리
export class OptimizedStyleManager {
  private static unifiedCSS = new Map<string, string>();
  private static isInjected = false;

  public static registerStyle(id: string, css: string): void {
    this.unifiedCSS.set(id, css);

    // 다음 프레임에 일괄 주입
    if (!this.isInjected) {
      requestAnimationFrame(() => this.injectUnifiedStyles());
    }
  }

  private static injectUnifiedStyles(): void {
    const combinedCSS = Array.from(this.unifiedCSS.values()).join('\n');

    // 단일 <style> 태그로 모든 CSS 주입
    const style = document.createElement('style');
    style.id = 'xeg-unified-styles';
    style.textContent = combinedCSS;
    document.head.appendChild(style);

    this.isInjected = true;
  }
}
```

**2. 인라인 스타일 최적화**

```typescript
// ✅ 배치 업데이트로 리플로우 최소화
export class BatchStyleUpdater {
  private pendingUpdates = new Map<HTMLElement, Record<string, string>>();
  private updateScheduled = false;

  public scheduleUpdate(element: HTMLElement, styles: Record<string, string>): void {
    this.pendingUpdates.set(element, { ...this.pendingUpdates.get(element), ...styles });

    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => this.applyBatchUpdates());
    }
  }

  private applyBatchUpdates(): void {
    // 모든 스타일을 한 번에 적용하여 리플로우 최소화
    for (const [element, styles] of this.pendingUpdates) {
      Object.assign(element.style, styles);
    }

    this.pendingUpdates.clear();
    this.updateScheduled = false;
  }
}
```

### 요약 및 베스트 프랙티스

1. **기본 원칙**: CSS 주입은 정적 스타일, 인라인은 동적 값만
2. **구조 분리**: 스타일 정의와 로직 코드를 명확히 분리
3. **성능 고려**: 배치 업데이트와 통합 CSS 주입으로 최적화
4. **유지보수**: 클래스 기반 상태 관리로 코드 가독성 향상
5. **CSS 기능 활용**: 의사 클래스, 미디어 쿼리 등 CSS의 강력한 기능 최대한 활용

---

## 🔧 리팩토링 및 코드 정리 가이드

### 임시 파일 정리 원칙

프로젝트에는 리팩토링 과정에서 생성된 임시 파일들이 존재할 수 있습니다:

```
src/
├── features/gallery/
│   ├── GalleryViewer.tsx        # 현재 버전
│   └── GalleryViewer.new.tsx    # 리팩토링 버전 (임시)
├── core/lifecycle/
│   ├── ApplicationLifecycleManager.ts           # 현재 버전
│   └── ApplicationLifecycleManager.refactored.ts # 리팩토링 버전 (임시)
```

**정리 프로세스**:

1. **검증 단계**: 새 버전이 모든 테스트를 통과하는지 확인
2. **마이그레이션**: 기존 파일을 새 버전으로 대체
3. **정리**: 임시 파일 제거
4. **문서 업데이트**: 변경사항 반영

```bash
# 리팩토링 완료 후 정리 스크립트
npm run clean:refactor-files
```

### 싱글톤 패턴 사용 지침

**언제 싱글톤을 사용해야 하는가?**

```typescript
// ✅ 적절한 싱글톤 사용 사례
export class GlobalConfigManager {
  // 애플리케이션 전체에서 하나의 설정만 존재해야 함
}

export class EventBus {
  // 전역 이벤트 시스템은 하나의 인스턴스만 필요
}

export class CacheManager {
  // 메모리 효율성을 위해 단일 캐시 인스턴스
}

// ❌ 싱글톤을 피해야 하는 경우
export class MediaProcessor {
  // 여러 미디어를 병렬 처리할 때는 여러 인스턴스가 유리
}

export class UserSession {
  // 테스트에서 독립적인 세션이 필요할 수 있음
}
```

**싱글톤 대안 패턴**

```typescript
// 의존성 주입으로 유연성 확보
export interface IConfigManager {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
}

export class ConfigManager implements IConfigManager {
  // 싱글톤이 아닌 일반 클래스
}

// 팩토리로 인스턴스 관리
export function createConfigManager(): IConfigManager {
  return new ConfigManager();
}

// 컨텍스트에서 의존성 주입
export class ApplicationContext {
  private static configManager: IConfigManager;

  static getConfigManager(): IConfigManager {
    return (this.configManager ??= createConfigManager());
  }

  static setConfigManager(manager: IConfigManager): void {
    this.configManager = manager;
  }
}
```
