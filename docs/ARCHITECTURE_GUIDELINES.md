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

## 🎨 테마 시스템 단순화 (v2.1.0 업데이트)

### 단순화된 테마 아키텍처

기존의 복잡한 자동 테마 전환 기능을 제거하고, 투명 기조의 단순한 시스템 테마 감지 방식으로 전환했습니다.

**변경사항**:

- `AutoThemeService` → `SimpleThemeManager`로 이름 변경 및 단순화
- 복잡한 테마 전환 로직 제거
- 시스템 테마 감지만 유지 (`prefers-color-scheme` 기반)
- `data-theme` 속성을 통한 CSS 자동 적용

**새로운 테마 시스템 구조**:

```typescript
// Core Layer - Simple Theme Manager
export class SimpleThemeManager {
  // 시스템 테마 감지 및 data-theme 속성 설정
  private applySystemTheme(): void {
    const isDark = this.mediaQueryList?.matches;
    this.currentTheme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }
}

// CSS - data-theme 기반 자동 적용
[data-theme='light'] {
  --xeg-auto-surface: var(--xeg-transparent-bg-light);
  --xeg-auto-text: #1e293b;
}

[data-theme='dark'] {
  --xeg-auto-surface: var(--xeg-transparent-bg-dark);
  --xeg-auto-text: #f1f5f9;
}
```

**사용법**:

```typescript
import { themeManager } from '@core/services';

// 현재 테마 확인
const currentTheme = themeManager.getCurrentTheme(); // 'light' | 'dark'
const isDark = themeManager.isDarkMode(); // boolean

// CSS 변수는 자동으로 적용됨
```

**이점**:

- 단순하고 예측 가능한 동작
- 시스템 테마와 완벽 동기화
- 투명 기조의 일관된 디자인
- 성능 향상 (불필요한 로직 제거)

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
