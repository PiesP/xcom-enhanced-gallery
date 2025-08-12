# 💻 코딩 가이드라인

> **일관된 코드 스타일과 품질 보장**

## � 권위 있는 소스 정책

### CSS 스타일링 우선순위

컴포넌트 스타일링은 다음 우선순위를 따릅니다:

1. **권위 있는 소스**: `컴포넌트.module.css + 디자인 토큰`

   ```css
   /* ✅ 권위 있는 소스 - Toolbar.module.css */
   .galleryToolbar {
     background: var(--xeg-glass-bg-toolbar);
     border-radius: var(--xeg-toolbar-border-radius);
   }
   ```

2. **옵션/레거시**: 베이스 클래스는 하위 호환용만 사용
   ```css
   /* ⚠️ 옵션/레거시 - design-tokens.css */
   .xeg-toolbar-base {
     /* 하위 호환/유틸 용도로만 선택적 사용 */
   }
   ```

### 스타일 중복 방지

- **ESLint 규칙**: 중복 컴포넌트 정의 방지
- **Stylelint**: CSS 중복 선택자/프로퍼티 탐지
- **토큰 시스템**: 공통 값은 디자인 토큰으로 중앙화

```bash
# 중복 검사 실행
npm run lint        # ESLint + Stylelint 통합 실행
npm run stylelint   # CSS 중복만 검사
```

## �🎨 코딩 스타일

### 기본 포맷팅

```typescript
// ✅ 2 spaces 들여쓰기, 세미콜론, 단일 따옴표
const config = {
  gallery: {
    autoplay: false,
  },
};

// ✅ Import 순서: 타입 → 외부 라이브러리 → 내부 모듈 → 스타일
import type { MediaItem } from '@shared/types';
import { getPreact } from '@shared/external/vendors';
import { MediaService } from '@shared/services';
import styles from './Component.module.css';
```

### 파일 네이밍

```
// 파일 및 디렉토리: kebab-case
gallery-view.tsx
media-processor.ts
components/
services/
```

## 🏷️ 네이밍 규칙

### 변수 및 함수

```typescript
// 변수: camelCase
const imageData = await loadImage();
const currentIndex = signal(0);

// 상수: SCREAMING_SNAKE_CASE
const MAX_IMAGE_SIZE = 1024 * 1024;

// 함수: 동사 + 명사
function processImage(data: ImageData): ProcessedImage {}
function extractMediaUrl(element: HTMLElement): string {}

// Boolean: is/has/can prefix
const isLoading = signal(false);
const hasPermission = checkPermission();
```

### 타입 정의

```typescript
// 인터페이스 & 타입: PascalCase
interface MediaItem {
  readonly id: string;
  readonly type: MediaType;
}

type MediaType = 'image' | 'video';
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 컴포넌트 Props
interface GalleryViewProps {
  readonly items: MediaItem[];
  onSelect?: (item: MediaItem) => void;
}
```

## 📘 TypeScript 패턴

### 엄격한 타입 정의

```typescript
// ✅ readonly 인터페이스
interface MediaItem {
  readonly id: string;
  readonly metadata: MediaMetadata;
}

// ✅ 유니온 타입으로 상태 관리
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ✅ 제네릭 활용
interface ServiceResponse<T> {
  readonly data: T;
  readonly error?: string;
}

// ✅ 옵셔널 체이닝
const imageUrl = mediaItem.metadata?.thumbnail?.url ?? DEFAULT_THUMBNAIL;
```

### Result 패턴

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function loadImage(url: string): Promise<Result<HTMLImageElement>> {
  try {
    const img = new Image();
    img.src = url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    return { success: true, data: img };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## 🧩 컴포넌트 패턴

### Preact 컴포넌트

```typescript
import type { ComponentProps } from '@shared/types';
import { signal } from '@preact/signals';
import { getPreact } from '@shared/external/vendors';
import styles from './GalleryItem.module.css';

const { useCallback } = getPreact();

interface GalleryItemProps {
  readonly item: MediaItem;
  readonly className?: string;
  onSelect?: (item: MediaItem) => void;
}

export function GalleryItem({ item, className, onSelect }: GalleryItemProps) {
  const isSelected = signal(false);

  const handleClick = useCallback(() => {
    onSelect?.(item);
  }, [item, onSelect]);

  return (
    <div className={`${styles.item} ${className || ''}`} onClick={handleClick}>
      <img src={item.thumbnail} alt={item.description} />
    </div>
  );
}
```

### 상태 관리 (Signals)

```typescript
import { signal, computed } from '@preact/signals';

// Signal 정의
export const mediaItems = signal<MediaItem[]>([]);
export const selectedIndex = signal(0);

// Computed values
export const currentItem = computed(() => {
  const items = mediaItems.value;
  const index = selectedIndex.value;
  return items[index] || null;
});

// Action 함수 (직접 signal 변경 금지)
export function setMediaItems(items: MediaItem[]) {
  mediaItems.value = items;
  selectedIndex.value = 0;
}

export function selectNext() {
  if (selectedIndex.value < mediaItems.value.length - 1) {
    selectedIndex.value++;
  }
}
```

## 💻 PC 환경 전용

### 지원 이벤트

```typescript
// ✅ PC 전용 이벤트만 사용
interface PCEventHandlers {
  onClick?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onWheel?: (event: WheelEvent) => void;
  onContextMenu?: (event: MouseEvent) => void;
}

// ❌ 터치 이벤트 금지
// onTouchStart, onTouchMove, onTouchEnd
```

### 키보드 & 마우스 처리

```typescript
// 지원 키 정의
const SUPPORTED_KEYS = {
  ESCAPE: 'Escape',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  SPACE: ' ',
} as const;

function handleKeyboard(event: KeyboardEvent) {
  if (!Object.values(SUPPORTED_KEYS).includes(event.key as any)) {
    return;
  }
  event.preventDefault();
  // 키 처리 로직
}

// 마우스 휠 처리
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  if (event.deltaY > 0) {
    selectNext();
  } else {
    selectPrevious();
  }
}
```

## 🧪 테스트 패턴

### 테스트 구조

```typescript
describe('GalleryItem', () => {
  beforeEach(() => {
    // 테스트 전 설정
  });

  it('should render item correctly', () => {
    const { getByRole } = render(<GalleryItem {...defaultProps} />);
    expect(getByRole('button')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onSelect = vi.fn();
    const { getByRole } = render(
      <GalleryItem {...defaultProps} onSelect={onSelect} />
    );

    fireEvent.click(getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(defaultProps.item);
  });
});
```

---

## 🎨 스타일링 가이드라인

### 컴포넌트별 스타일 작성

```css
/* ✅ 권위 있는 소스 예시 - SettingsOverlay.module.css */
.modalOverlay {
  background: var(--xeg-glass-bg-translucent-10);
  backdrop-filter: var(--xeg-glass-blur-toolbar);
}

.modalContent {
  background: var(--xeg-glass-bg-toolbar);
  border: 1px solid var(--xeg-glass-border-light);
  border-radius: var(--xeg-toolbar-border-radius);
  max-width: var(--xeg-modal-max-width);
}
```

### 디자인 토큰 사용

```css
/* ✅ 토큰 시스템 활용 */
.component {
  padding: var(--xeg-toolbar-edge-padding);
  gap: var(--xeg-toolbar-group-gap);
  background: var(--xeg-glass-bg-toolbar);
}

/* ❌ 하드코딩 금지 */
.component {
  padding: 24px;
  gap: 16px;
  background: rgba(255, 255, 255, 0.85);
}
```

### 중복 방지 원칙

1. **선택자 중복 금지**: 동일 클래스명을 여러 곳에서 정의 금지
2. **프로퍼티 중복 최소화**: 연속된 다른 값 외에는 중복 선언 금지
3. **토큰 우선**: 공통 값은 반드시 디자인 토큰으로 추상화

**💻 일관된 코드 스타일은 팀 생산성을 높입니다.**
