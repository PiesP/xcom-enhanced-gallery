# 💻 X.com Enhanced Gallery - Coding Guidelines

> **실무 코딩 규칙 및 베스트 프랙티스**
>
> **PC 환경 전용 - TypeScript 기반 개발 가이드**

## 📋 목차

1. [코드 스타일 가이드](#코드-스타일-가이드)
2. [네이밍 규칙](#네이밍-규칙)
3. [TypeScript 패턴](#typescript-패턴)
4. [컴포넌트 작성 규칙](#컴포넌트-작성-규칙)
5. [PC 환경 최적화 코딩](#pc-환경-최적화-코딩)
6. [외부 라이브러리 사용](#외부-라이브러리-사용)
7. [테스트 작성 가이드](#테스트-작성-가이드)
8. [실무 체크리스트](#실무-체크리스트)

## 🎨 코드 스타일 가이드

### 포맷팅 규칙

```typescript
// ✅ 권장: 명확한 들여쓰기 (2 spaces)
const config = {
  gallery: {
    autoplay: true,
    controls: true,
  },
};

// ✅ 권장: 세미콜론 사용
const result = processImage(data);

// ✅ 권장: 단일 따옴표 사용
const message = 'Processing completed';

// ✅ 권장: trailing comma
const items = [
  'image',
  'video', // trailing comma
];
```

### 파일 구조 규칙

```typescript
// 파일 상단: imports 그룹핑
// 1. 타입 imports
import type { ComponentProps, MouseEvent } from '@/types';

// 2. 외부 라이브러리 (getter 함수 사용)
import { getPreact } from '@/infrastructure/external/vendors';

// 3. 내부 모듈
import { Button } from '@/shared/components';
import { useGalleryState } from '@/core/state';

// 4. 스타일
import styles from './Component.module.css';

// 파일 하단: exports
export { Component };
export type { ComponentProps };
```

## �️ 네이밍 규칙

### 파일 및 디렉토리 네이밍

```typescript
// ✅ 파일명: kebab-case
gallery - view.tsx;
media - processor.ts;
user - settings.types.ts;

// ✅ 디렉토리명: kebab-case
components / services / media -
  extraction /
    // ✅ 컴포넌트 파일명: PascalCase
    GalleryView.tsx;
MediaPlayer.tsx;
DownloadButton.tsx;
```

### 변수 및 함수 네이밍

```typescript
// ✅ 변수: camelCase
const imageData = await loadImage();
const userSettings = getUserSettings();

// ✅ 상수: SCREAMING_SNAKE_CASE
const MAX_IMAGE_SIZE = 1024 * 1024;
const DEFAULT_GALLERY_CONFIG = {
  autoplay: false,
};

// ✅ 함수: 동사 + 명사 (camelCase)
function processImage(data: ImageData): ProcessedImage {}
function validateInput(input: string): boolean {}
function extractMediaUrl(element: HTMLElement): string {}

// ✅ Boolean: is/has/can prefix
const isLoading = signal(false);
const hasPermission = checkPermission();
const canDownload = validateDownload();
```

### 클래스 및 인터페이스 네이밍

```typescript
// ✅ 클래스: PascalCase
class GalleryRenderer {
  render(): void {}
}

class MediaProcessor {
  process(): void {}
}

// ✅ 인터페이스: PascalCase (I prefix 사용 안 함)
interface MediaItem {
  id: string;
  type: MediaType;
}

interface GalleryConfig {
  autoplay: boolean;
  controls: boolean;
}

// ✅ 타입: PascalCase
type MediaType = 'image' | 'video';
type GalleryState = 'loading' | 'ready' | 'error';
```

### 금지된 네이밍 패턴

```typescript
// ❌ 불명확한 수식어
Enhanced, Advanced, Simple, Basic, New, Old
Unified, Generic, Common, Util, Helper

// ❌ 너무 일반적인 이름
Manager, Handler, Controller, Service (필요한 경우에만 제한적 사용)
Data, Info, Item, Object, Thing

// ❌ 축약어 (명확한 경우 제외)
btn, img, vid, cfg, mgr
// ✅ 허용되는 축약어
url, id, api, css, html
```

## 📘 TypeScript 패턴

### 타입 정의 패턴

```typescript
// ✅ 엄격한 타입 정의
interface MediaItem {
  readonly id: string;
  readonly type: 'image' | 'video';
  readonly url: string;
  readonly metadata: {
    readonly width: number;
    readonly height: number;
    readonly size: number;
    readonly format: string;
  };
}

// ✅ 유니온 타입 활용
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
type MediaFormat = 'jpg' | 'png' | 'gif' | 'webp' | 'mp4' | 'webm';

// ✅ 제네릭 타입
interface ServiceResponse<T> {
  readonly data: T;
  readonly status: 'success' | 'error';
  readonly message?: string;
}
```

### 함수 타입 패턴

```typescript
// ✅ 함수 시그니처
type EventHandler<T> = (event: T) => void;
type AsyncProcessor<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

// ✅ 함수 오버로드
function processMedia(item: ImageItem): Promise<ProcessedImage>;
function processMedia(item: VideoItem): Promise<ProcessedVideo>;
function processMedia(item: MediaItem): Promise<ProcessedMedia> {
  // 구현
}

// ✅ 옵셔널 체이닝과 nullish coalescing
const imageUrl = mediaItem.metadata?.thumbnail?.url ?? DEFAULT_THUMBNAIL;
```

### 에러 처리 패턴

```typescript
// ✅ Result 패턴
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function loadImage(url: string): Promise<Result<HTMLImageElement>> {
  try {
    const image = await loadImageFromUrl(url);
    return { success: true, data: image };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// ✅ 사용 예시
const result = await loadImage(imageUrl);
if (result.success) {
  // result.data는 HTMLImageElement 타입
  displayImage(result.data);
} else {
  // result.error는 Error 타입
  console.error('Failed to load image:', result.error.message);
}
```

## 🧩 컴포넌트 작성 규칙

### Preact 컴포넌트 패턴

```typescript
import type { ComponentProps } from '@/types';
import { signal, computed } from '@preact/signals';
import { getPreact } from '@/infrastructure/external/vendors';
import styles from './GalleryItem.module.css';

const { useEffect, useCallback } = getPreact();

interface GalleryItemProps {
  readonly item: MediaItem;
  readonly isActive: boolean;
  readonly onSelect: (id: string) => void;
  readonly onLoad?: () => void;
  className?: string;
}

export function GalleryItem({
  item,
  isActive,
  onSelect,
  onLoad,
  className
}: GalleryItemProps) {
  // ✅ Signal 사용
  const isLoading = signal(true);
  const hasError = signal(false);

  // ✅ Computed signal
  const containerClasses = computed(() => [
    styles.container,
    isActive && styles.active,
    isLoading.value && styles.loading,
    className
  ].filter(Boolean).join(' '));

  // ✅ 이벤트 핸들러
  const handleClick = useCallback((event: MouseEvent) => {
    event.preventDefault();
    onSelect(item.id);
  }, [item.id, onSelect]);

  const handleImageLoad = useCallback(() => {
    isLoading.value = false;
    onLoad?.();
  }, [onLoad]);

  // ✅ PC 전용 키보드 이벤트
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(item.id);
    }
  }, [item.id, onSelect]);

  return (
    <div
      className={containerClasses.value}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Select ${item.type}: ${item.id}`}
    >
      {item.type === 'image' ? (
        <img
          src={item.url}
          alt={`Image ${item.id}`}
          onLoad={handleImageLoad}
          onError={() => hasError.value = true}
          className={styles.media}
        />
      ) : (
        <video
          src={item.url}
          className={styles.media}
          onLoadedData={handleImageLoad}
          onError={() => hasError.value = true}
        />
      )}
    </div>
  );
}
```

### 훅 작성 패턴

```typescript
// ✅ 커스텀 훅 패턴
import { signal, computed } from '@preact/signals';
import { getPreact } from '@/infrastructure/external/vendors';

const { useEffect, useCallback } = getPreact();

interface UseGalleryKeyboardOptions {
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onToggleFullscreen?: () => void;
}

export function useGalleryKeyboard({
  onPrevious,
  onNext,
  onClose,
  onToggleFullscreen,
}: UseGalleryKeyboardOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNext();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'f':
        case 'F':
          if (onToggleFullscreen) {
            event.preventDefault();
            onToggleFullscreen();
          }
          break;
      }
    },
    [onPrevious, onNext, onClose, onToggleFullscreen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleKeyDown };
}
```

## 💻 PC 환경 최적화 코딩

### 지원되는 이벤트 타입

```typescript
// ✅ PC 환경에서 지원하는 이벤트
interface PCEventHandlers {
  onClick?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onMouseMove?: (event: MouseEvent) => void;
  onWheel?: (event: WheelEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onContextMenu?: (event: MouseEvent) => void;
}

// ❌ 제거된 터치 이벤트 (사용 금지)
// onTouchStart, onTouchMove, onTouchEnd, onTouchCancel
```

### 키보드 인터랙션 패턴

```typescript
// ✅ 권장: 핵심 키만 지원
const SUPPORTED_KEYS = {
  ESCAPE: 'Escape', // 갤러리 닫기
  ARROW_LEFT: 'ArrowLeft', // 이전 이미지
  ARROW_RIGHT: 'ArrowRight', // 다음 이미지
  SPACE: ' ', // 동영상 재생/정지
  ENTER: 'Enter', // 선택/확인
  F: 'f', // 전체화면
} as const;

function handleKeyboard(event: KeyboardEvent) {
  switch (event.key) {
    case SUPPORTED_KEYS.ESCAPE:
      closeGallery();
      break;
    case SUPPORTED_KEYS.ARROW_LEFT:
      event.preventDefault();
      previousImage();
      break;
    case SUPPORTED_KEYS.ARROW_RIGHT:
      event.preventDefault();
      nextImage();
      break;
    default:
      // 지원하지 않는 키는 무시
      break;
  }
}
```

### 마우스 인터랙션 패턴

```typescript
// ✅ 마우스 휠 스크롤 처리
function handleWheel(event: WheelEvent) {
  event.preventDefault();

  const direction = event.deltaY > 0 ? 'down' : 'up';

  if (direction === 'down') {
    nextImage();
  } else {
    previousImage();
  }
}

// ✅ 드래그 앤 드롭 (PC 전용)
function handleMouseDown(event: MouseEvent) {
  const startX = event.clientX;
  const threshold = 50; // px

  function handleMouseMove(moveEvent: MouseEvent) {
    const deltaX = moveEvent.clientX - startX;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        previousImage();
      } else {
        nextImage();
      }
      cleanup();
    }
  }

  function cleanup() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', cleanup);
  }

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', cleanup);
}
```

## 📦 외부 라이브러리 사용

### 라이브러리 접근 규칙

```typescript
// ❌ 직접 import 금지
import { deflate } from 'fflate';
import { render } from 'preact';
import { signal } from '@preact/signals';

// ✅ 전용 getter 함수 사용
import {
  getFflate,
  getPreact,
  getPreactSignals,
} from '@/infrastructure/external/vendors';

const { deflate } = getFflate();
const { render, useEffect, useCallback } = getPreact();
const { signal, computed } = getPreactSignals();
```

### 허용된 라이브러리 목록

```typescript
// ✅ 허용된 라이브러리 (MIT 라이센스)
const ALLOWED_LIBRARIES = {
  preact: '10.x.x', // UI 라이브러리
  '@preact/signals': '1.x.x', // 상태 관리
  fflate: '0.8.x', // 압축 라이브러리
} as const;
```

### 상태 관리 패턴 (Preact Signals)

```typescript
// ✅ Signal 정의
import { signal, computed } from '@preact/signals';

export const mediaItems = signal<MediaItem[]>([]);
export const selectedIndex = signal(0);

// ✅ Computed values
export const currentItem = computed(() => {
  const items = mediaItems.value;
  const index = selectedIndex.value;
  return items[index] || null;
});

// ✅ Action 함수
export function selectNext() {
  const maxIndex = mediaItems.value.length - 1;
  selectedIndex.value = Math.min(selectedIndex.value + 1, maxIndex);
}

export function selectPrevious() {
  selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
}
```

## 🧪 테스트 작성 가이드

### 테스트 파일 구조

```typescript
// ✅ 테스트 파일 네이밍
ComponentName.test.tsx; // 컴포넌트 테스트
utils.test.ts; // 유틸리티 함수 테스트
media - processor.test.ts; // 서비스 테스트

// ✅ 테스트 구조
describe('ComponentName', () => {
  beforeEach(() => {
    // 각 테스트 전 초기화
  });

  describe('when props are provided', () => {
    it('should render correctly', () => {
      // 테스트 구현
    });

    it('should handle user interactions', () => {
      // 인터랙션 테스트
    });
  });

  describe('when error occurs', () => {
    it('should handle errors gracefully', () => {
      // 에러 처리 테스트
    });
  });
});
```

### 컴포넌트 테스트 패턴

```typescript
import { render, fireEvent } from '@testing-library/preact';
import { signal } from '@preact/signals';
import { GalleryItem } from './GalleryItem';

describe('GalleryItem', () => {
  const defaultProps = {
    item: {
      id: 'test-1',
      type: 'image' as const,
      url: 'https://example.com/image.jpg',
      metadata: { width: 800, height: 600, size: 102400, format: 'jpg' }
    },
    isActive: false,
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render image correctly', () => {
    const { getByRole } = render(<GalleryItem {...defaultProps} />);

    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Select image: test-1');
  });

  it('should call onSelect when clicked', () => {
    const { getByRole } = render(<GalleryItem {...defaultProps} />);

    fireEvent.click(getByRole('button'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith('test-1');
  });

  it('should handle keyboard navigation', () => {
    const { getByRole } = render(<GalleryItem {...defaultProps} />);

    fireEvent.keyDown(getByRole('button'), { key: 'Enter' });

    expect(defaultProps.onSelect).toHaveBeenCalledWith('test-1');
  });
});
```

### 훅 테스트 패턴

```typescript
import { renderHook, act } from '@testing-library/preact';
import { useGalleryKeyboard } from './useGalleryKeyboard';

describe('useGalleryKeyboard', () => {
  const mockHandlers = {
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onClose when Escape is pressed', () => {
    renderHook(() => useGalleryKeyboard(mockHandlers));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(mockHandlers.onClose).toHaveBeenCalledTimes(1);
  });

  it('should ignore other keys', () => {
    renderHook(() => useGalleryKeyboard(mockHandlers));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });

    expect(mockHandlers.onClose).not.toHaveBeenCalled();
  });
});
```

## ✅ 실무 체크리스트

### 코드 작성 전 체크리스트

- [ ] 타입 정의가 명확한가?
- [ ] 함수명이 동작을 명확히 설명하는가?
- [ ] PC 전용 이벤트만 사용하는가?
- [ ] 외부 라이브러리를 getter로 접근하는가?
- [ ] 에러 처리가 포함되어 있는가?

### 컴포넌트 작성 체크리스트

- [ ] Props 타입이 readonly로 정의되어 있는가?
- [ ] 이벤트 핸들러가 useCallback으로 최적화되어 있는가?
- [ ] 접근성 속성(aria-label, role 등)이 포함되어 있는가?
- [ ] CSS 모듈을 사용하고 있는가?
- [ ] Signal을 적절히 사용하고 있는가?

### 성능 최적화 체크리스트

- [ ] 불필요한 리렌더링이 없는가?
- [ ] 메모리 누수 가능성은 없는가?
- [ ] 이벤트 리스너가 적절히 해제되는가?
- [ ] 이미지 로딩이 최적화되어 있는가?
- [ ] 번들 크기에 영향을 주지 않는가?

### 테스트 작성 체크리스트

- [ ] 주요 기능에 대한 테스트가 있는가?
- [ ] 에러 케이스에 대한 테스트가 있는가?
- [ ] 사용자 인터랙션 테스트가 있는가?
- [ ] PC 전용 이벤트 테스트가 있는가?
- [ ] 모킹이 적절히 사용되었는가?

### 코드 리뷰 체크리스트

- [ ] 코딩 가이드라인을 준수하는가?
- [ ] 보안 이슈가 없는가?
- [ ] 성능에 문제가 없는가?
- [ ] 문서화가 충분한가?
- [ ] 테스트 커버리지가 적절한가?

---

## 📚 참고 자료

- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Preact Documentation](https://preactjs.com/guide/v10/)
- [Testing Library](https://testing-library.com/docs/preact-testing-library/intro/)
- [CSS Modules](https://github.com/css-modules/css-modules)
- [Vitest](https://vitest.dev/guide/)

---

<div align="center">

**💻 Clean code is not about rules. It's about professionalism. - Robert C.
Martin**

</div>
        logger.warn('Error handling keyboard', { error });
      }
    },
    [enableKeyboardShortcuts, handleUserActivity]
  );

useEffect(() => { // PC 전용 이벤트 리스너 등록 if (enableKeyboardShortcuts) {
document.addEventListener('keydown', handleKeyDown, { capture: true }); }

    if (enableMouseTracking) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (enableKeyboardShortcuts) {
        document.removeEventListener('keydown', handleKeyDown, true);
      }

      if (enableMouseTracking) {
        document.removeEventListener('mousemove', handleMouseMove);
      }
    };

}, [ enableKeyboardShortcuts, enableMouseTracking, handleKeyDown,
handleMouseMove, ]); }

````

#### PC 전용 스크롤 관리

**✅ 권장: 네이티브 스크롤 활용**

```typescript
// features/gallery/hooks/useGalleryScroll.ts
export function useGalleryScroll({
  container,
  onScroll,
  enabled = true,
}: UseGalleryScrollOptions) {
  const scrollToItem = useCallback(
    (index: number) => {
      if (!container) return;

      const items = container.querySelectorAll(
        '[data-xeg-role="gallery-item"]'
      );
      const targetItem = items[index] as HTMLElement;

      if (targetItem) {
        targetItem.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }
    },
    [container]
  );

  const scrollToTop = useCallback(() => {
    if (!container) return;

    container.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [container]);

  return { scrollToItem, scrollToTop };
}
````

### 6. 타입 정의 및 타입 안전성

**인터페이스 명명 규칙**

```typescript
// 컴포넌트 Props - 컴포넌트명 + Props
interface GalleryProps {
  items: MediaItem[];
  onItemSelect: (item: MediaItem) => void;
  // ❌ 터치 관련 props 제거됨
  // onTouchStart?: (event: TouchEvent) => void;
}

interface MediaViewerProps {
  item: MediaItem;
  onClose: () => void;
}

// PC 전용 이벤트 핸들러 타입
interface PCEventHandlers {
  onKeyDown?: (event: KeyboardEvent) => void;
  onClick?: (event: MouseEvent) => void;
  onMouseMove?: (event: MouseEvent) => void;
  onWheel?: (event: WheelEvent) => void;
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
  downloadMultiple(
    items: MediaItem[],
    options?: DownloadOptions
  ): Promise<void>;
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

### 5. CSS 및 스타일링 시스템

**통합 CSS 아키텍처**

X.com Enhanced Gallery는 **CSS Modules 기반의 통합 스타일 시스템**을 사용합니다:

```typescript
// 스타일 시스템 진입점
import {
  combineClasses,
  getCSSVariable,
  createResponsiveClassName,
  StyleStateManager,
} from '@shared/styles';
```

**CSS 모듈 타입 안전성**

```typescript
// types/css-modules.d.ts - 향상된 타입 정의
declare module '*.module.css' {
  interface CSSModuleClasses {
    readonly [key: string]: string;
  }
  const classes: CSSModuleClasses;
  export = classes;
}

// BEM 유틸리티 타입
type BEMElement<B extends string, E extends string> = `${B}__${E}`;
type BEMModifier<B extends string, M extends string> = `${B}--${M}`;
```

**스타일 유틸리티 함수 사용법**

```typescript
import {
  combineClasses,
  getCSSVariable,
} from '@shared/utils/styles/style-utils';

// ✅ 클래스 안전 결합
const itemClass = combineClasses(
  styles.item,
  isActive && styles.itemActive,
  hasError && styles.itemError
);

// ✅ CSS 변수 접근 (fallback 지원)
const primaryColor = getCSSVariable('--color-primary', '#1da1f2');

// ✅ 상태 기반 스타일 관리
const styleManager = new StyleStateManager();
styleManager.setState('active', true);
const dynamicClass = styleManager.getClassForState(
  styles.button,
  'active',
  styles.buttonActive
);
```

**CSS 변수 시스템**

```css
/* 디자인 토큰 기반 변수 시스템 */
:root {
  /* 색상 팔레트 */
  --color-primary: #1da1f2;
  --color-secondary: #14171a;
  --color-accent: #1991da;
  --color-success: #17bf63;
  --color-warning: #ffad1f;
  --color-error: #e0245e;

  /* 간격 시스템 (8px 기반) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* 타이포그래피 */
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;

  /* 그림자 시스템 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);

  /* Z-index 레이어 */
  --z-gallery: 9999;
  --z-modal: 10000;
  --z-tooltip: 10001;
}
```

**CSS 모듈 패턴**

```css
/* Gallery.module.css - 모던 glassmorphism 디자인 */
.gallery {
  --gallery-bg: rgba(0, 0, 0, 0.8);
  --gallery-backdrop: blur(20px);
  --gallery-border: 1px solid rgba(255, 255, 255, 0.1);

  background: var(--gallery-bg);
  backdrop-filter: var(--gallery-backdrop);
  border: var(--gallery-border);
  border-radius: 12px;

  /* 반응형 그리드 */
  display: grid;
  gap: var(--spacing-md);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.mediaItem {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.mediaItem:hover {
  transform: scale(1.02);
}

.mediaItem--active {
  border: 2px solid var(--color-primary);
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.2);
}

/* BEM 네이밍 컨벤션 */
.gallery__header {
}
.gallery__body {
}
.gallery__footer {
}
.gallery--fullscreen {
}
```

**컴포넌트에서 사용법**

```typescript
import { getFunctionalPreact } from '@infrastructure/external/vendors';
import { combineClasses } from '@shared/utils/styles/style-utils';
import styles from './Gallery.module.css';

const { h } = getFunctionalPreact();

interface GalleryProps {
  items: MediaItem[];
  isFullscreen?: boolean;
  className?: string;
}

export function Gallery({ items, isFullscreen, className }: GalleryProps) {
  const galleryClass = combineClasses(
    styles.gallery,
    isFullscreen && styles.galleryFullscreen,
    className
  );

  return h('div', { className: galleryClass }, [
    h('div', { className: styles.gallery__header }, 'Gallery Header'),
    h(
      'div',
      { className: styles.gallery__body },
      items.map(item =>
        h(
          'div',
          {
            className: combineClasses(
              styles.mediaItem,
              item.isActive && styles.mediaItemActive
            ),
            key: item.id,
          },
          item.content
        )
      )
    ),
  ]);
}
```

---

## 🎨 CSS 시스템 최적화 및 고급 기법

### 1. 통합 CSS 빌드 최적화

**Vite 기반 CSS 처리**

```typescript
// vite.config.ts - CSS 최적화 설정
css: {
  modules: {
    localsConvention: 'camelCase',
    generateScopedName: '[name]__[local]___[hash:base64:5]',
  },
  postcss: {
    plugins: [
      // CSS 변수 fallback 플러그인
      cssVariablesFallbackPlugin(),
      // 사용하지 않는 CSS 제거
      purgecss({
        content: ['./src/**/*.{ts,tsx}'],
        safelist: ['gallery-*', 'twitter-*']
      })
    ],
  },
}
```

**런타임 CSS 주입 최적화**

```typescript
// 통합 CSS 관리자
export class OptimizedCSSManager {
  private static readonly UNIFIED_STYLE_ID = 'xeg-unified-styles';
  private cssModules = new Map<string, string>();
  private injected = false;

  public registerCSS(id: string, css: string): void {
    this.cssModules.set(id, css);
  }

  public injectAll(): void {
    if (this.injected) return;

    const unifiedCSS = Array.from(this.cssModules.values()).join('\n');

    const existingStyle = document.getElementById(
      OptimizedCSSManager.UNIFIED_STYLE_ID
    );
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

### 2. 고급 CSS 변수 활용

**동적 CSS 변수 시스템**

```typescript
// CSS 변수 동적 관리
import { getCSSVariable } from '@shared/utils/styles/style-utils';

export class ThemeManager {
  private static readonly ROOT_ELEMENT = document.documentElement;

  public static setTheme(theme: 'light' | 'dark' | 'auto'): void {
    ThemeManager.ROOT_ELEMENT.setAttribute('data-theme', theme);

    // CSS 변수 동적 업데이트
    if (theme === 'dark') {
      ThemeManager.setCSSVariable('--color-primary', '#1a8cd8');
      ThemeManager.setCSSVariable('--color-surface', '#15202b');
    } else {
      ThemeManager.setCSSVariable('--color-primary', '#1da1f2');
      ThemeManager.setCSSVariable('--color-surface', '#ffffff');
    }
  }

  public static setCSSVariable(name: string, value: string): void {
    ThemeManager.ROOT_ELEMENT.style.setProperty(name, value);
  }

  public static getCSSVariable(name: string, fallback?: string): string {
    return getCSSVariable(name, fallback);
  }
}
```

**조건부 CSS 변수**

```css
/* 테마별 조건부 변수 */
:root {
  --color-primary: #1da1f2;
  --color-surface: #ffffff;
  --color-text: #0f1419;
}

[data-theme='dark'] {
  --color-primary: #1a8cd8;
  --color-surface: #15202b;
  --color-text: #f7f9fa;
}

[data-theme='high-contrast'] {
  --color-primary: #000000;
  --color-surface: #ffffff;
  --color-text: #000000;
}

/* 사용자 선호도 기반 자동 테마 */
@media (prefers-color-scheme: dark) {
  [data-theme='auto'] {
    --color-primary: #1a8cd8;
    --color-surface: #15202b;
    --color-text: #f7f9fa;
  }
}
```

**계산된 CSS 변수**

```css
:root {
  /* 기본 스케일 */
  --scale-factor: 1;
  --base-size: 16px;

  /* 계산된 크기들 */
  --font-size-sm: calc(var(--base-size) * 0.875 * var(--scale-factor));
  --font-size-md: calc(var(--base-size) * var(--scale-factor));
  --font-size-lg: calc(var(--base-size) * 1.25 * var(--scale-factor));

  /* 반응형 간격 */
  --spacing-fluid: clamp(8px, 2vw, 24px);
  --gallery-width: clamp(320px, 90vw, 1200px);
}

/* 컴팩트 모드 */
[data-layout='compact'] {
  --scale-factor: 0.9;
}

/* 대형 화면 모드 */
[data-layout='large'] {
  --scale-factor: 1.1;
}
```

### 3. 최신 CSS 레이아웃 기법

**CSS Grid를 활용한 갤러리 레이아웃**

```css
.gallery-grid {
  display: grid;

  /* 반응형 그리드 - 최소 200px, 최대 1fr */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

  /* 동적 행 크기 */
  grid-auto-rows: minmax(150px, auto);

  /* 최적화된 갭 */
  gap: var(--spacing-md);

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

/* 반응형 그리드 조정 */
@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-sm);
  }

  .gallery-item--featured,
  .gallery-item--wide {
    grid-column: span 1;
    grid-row: span 1;
  }
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
    font-size: var(--font-size-sm);
  }

  .gallery-toolbar {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
}

@container gallery (width > 1200px) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}
```

### 4. 성능 최적화 CSS 패턴

**GPU 가속 활용**

```css
.gallery-item {
  /* GPU 레이어 생성 */
  will-change: transform;
  transform: translateZ(0);

  /* 하드웨어 가속 트랜지션 */
  transition: transform 0.2s ease;
}

.gallery-item:hover {
  /* GPU에서 처리되는 변환 */
  transform: translateZ(0) scale(1.02);
}

/* 애니메이션 완료 후 will-change 제거 */
.gallery-item:not(:hover) {
  will-change: auto;
}
```

**CSS Containment 활용**

```css
.gallery-item {
  /* 레이아웃 격리 */
  contain: layout style paint;
}

.gallery-item__content {
  /* 페인트 격리 */
  contain: paint;
}

.gallery-item__thumbnail {
  /* 엄격한 격리 */
  contain: strict;
}
```

현재 프로젝트는 우수한 CSS 변수 시스템을 갖추고 있습니다. 이를 더욱 효과적으로
활용하기 위한 고급 패턴들:

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
  --xeg-font-size-sm: calc(
    var(--xeg-base-size) * 0.875 * var(--xeg-scale-factor)
  );
  --xeg-font-size-md: calc(var(--xeg-base-size) * var(--xeg-scale-factor));
  --xeg-font-size-lg: calc(
    var(--xeg-base-size) * 1.25 * var(--xeg-scale-factor)
  );

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
export function stylesToCSS(
  styles: Record<string, React.CSSProperties>
): string {
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
    return this.CRITICAL_SELECTORS.map(selector =>
      this.extractSelector(fullCSS, selector)
    )
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

## 🚫 PC 전용 사용 금지 패턴

### 완전 금지: 터치 관련 코드

```typescript
// ❌ 완전 금지 - 터치 이벤트 핸들러
interface ProhibitedTouchHandlers {
  onTouchStart?: never;
  onTouchMove?: never;
  onTouchEnd?: never;
  onTouchCancel?: never;
}

// ❌ 완전 금지 - 터치 관련 훅 사용
const touchHandlers = useGalleryTouch({}); // 사용 금지

// ❌ 완전 금지 - 터치 관련 CSS
.prohibited-touch {
  touch-action: manipulation;           /* 사용 금지 */
  -webkit-overflow-scrolling: touch;    /* 사용 금지 */
}
```

### 제한적 사용: 키보드 이벤트

```typescript
// ❌ 금지 - 복잡한 키보드 네비게이션
const PROHIBITED_KEYBOARD = {
  ArrowLeft: 'previous',
  ArrowRight: 'next',
  ArrowUp: 'scrollUp',
  ArrowDown: 'scrollDown',
  Space: 'togglePlay',
  Home: 'scrollToTop',
  End: 'scrollToBottom',
};

// ✅ 허용 - Esc 키만
const ALLOWED_KEYBOARD = {
  Escape: 'close', // 유일한 허용 키
};
```

---

## ✅ 최종 권장 패턴

```typescript
// ✅ PC 전용 갤러리 컴포넌트 예시
export function PCOptimizedGallery() {
  // Esc 키만 지원
  useGalleryKeyboard({ onClose: closeGallery });

  // 마우스 이벤트 핸들러
  const handleBackgroundClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      closeGallery();
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    const isInTopArea = event.clientY <= 100;
    if (isInTopArea) {
      toggleUI(true);
    }
  };

  return (
    <div
      className={styles.gallery}
      onClick={handleBackgroundClick}
      onMouseMove={handleMouseMove}
      onKeyDown={(e) => e.key === 'Escape' && closeGallery()}
    >
      {/* 갤러리 내용 */}
    </div>
  );
}
```

---

이 가이드라인을 통해 **236개의 포괄적 테스트**로 프로젝트의 안정성과 신뢰성을
보장하고 있습니다.
