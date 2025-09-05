# 💻 코딩 가이드라인

> **일관된 코드 스타일과 품질 보장**

## 🎨 코딩 스타일

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

````
// 파일 및 디렉토리: kebab-case
gallery-view.tsx
media-processor.ts
components/
services/

### Border Radius 정책 (Design Tokens)

| 용도 | 토큰 | 설명 |
| ---- | ---- | ---- |
| 인터랙션 (아이콘/작은 버튼) | `var(--xeg-radius-md)` | IconButton, 작은 액션 영역 |
| 일반 Surface / 기본 버튼 | `var(--xeg-radius-lg)` | Toolbar 버튼, 카드성 작은 블록 |
| 대형 Surface / 컨테이너 | `var(--xeg-radius-xl)` 또는 `var(--xeg-radius-2xl)` | 모달/토스트 등 큰 영역 |
| Pill 형태 | `var(--xeg-radius-pill)` | 배지, Chip 요소 |
| 원형 | `var(--xeg-radius-full)` | 원형 아바타, 원형 토글 |

규칙:
- px 직접 값 사용 금지 (테스트에서 검출)
- semantic (`--xeg-radius-*`) 토큰만 컴포넌트 CSS에 사용

#### 구현 예시 (Toast / Gallery)

```text
Toast
  .toast (container / surface large)        -> var(--xeg-radius-2xl)
  .actionButton / .closeButton (interaction)-> var(--xeg-radius-md)

Gallery
  .controlButton (interaction)              -> var(--xeg-radius-md)
  .controls (집합 pill 형태)                -> var(--xeg-radius-pill)
  .xegCloseButton / .xegNavButton (shape)   -> var(--xeg-radius-full)
  .mediaElement / .error (standard surface) -> var(--xeg-radius-lg)
````

권장 패턴:

- Interaction 요소는 통일된 hover/active 스타일을 유지하기 위해 모두 `md` 사용
- Surface 크기 차별화: 일반(`lg`), 대형/시각적 강조(`2xl` - Toast 등)
- 형태 구분은 `pill` / `full` 만 사용하고 임의 radius 조합 지양

### 테마 토큰 시스템 (Theme Tokens)

#### 다크/라이트 모드 자동 대응

| 용도      | 라이트 모드 | 다크 모드   | 권장 토큰                         |
| --------- | ----------- | ----------- | --------------------------------- |
| 기본 배경 | 밝은 색상   | 어두운 색상 | `var(--xeg-color-bg-primary)`     |
| 호버 배경 | 약간 어두움 | 약간 밝음   | `var(--xeg-color-bg-hover)`       |
| 텍스트    | 어두운 색상 | 밝은 색상   | `var(--xeg-color-text-primary)`   |
| 보더      | 중간 색상   | 중간 색상   | `var(--xeg-color-border-primary)` |

#### 테마별 토큰 사용 예시

```css
/* ✅ 권장: 테마 자동 대응 토큰 */
.button {
  background: var(--xeg-color-neutral-100, rgba(0, 0, 0, 0.05));
  color: var(--xeg-color-text-primary, rgba(0, 0, 0, 0.8));
  border: 1px solid var(--xeg-color-border-primary, rgba(0, 0, 0, 0.1));
}

.button:hover {
  background: var(--xeg-color-neutral-200, rgba(0, 0, 0, 0.1));
  color: var(--xeg-color-text-primary, rgba(0, 0, 0, 0.9));
}

/* ✅ 다크 모드 특별 처리가 필요한 경우 */
[data-theme='dark'] .button:hover {
  background: var(--xeg-color-neutral-800, rgba(64, 64, 64, 0.8));
}

/* ❌ 피할 것: 하드코딩된 색상 */
.button {
  background: rgba(255, 255, 255, 0.1); /* 테마 변경 불가 */
  color: #333; /* 다크 모드에서 문제 */
}
```

#### 인터랙션 상태 표준화

```css
/* ✅ 표준화된 호버 효과 */
.interactive-element:hover {
  transform: translateY(-1px); /* 또는 var(--xeg-button-lift) */
  box-shadow: var(--xeg-shadow-md);
  background: var(--xeg-color-bg-hover);
}

.interactive-element:active {
  transform: translateY(0);
  box-shadow: var(--xeg-shadow-sm);
}

/* ✅ 접근성 포커스 */
.interactive-element:focus-visible {
  outline: var(--xeg-focus-ring);
  outline-offset: var(--xeg-focus-ring-offset);
}
```

규칙:

- CSS 변수에 폴백값 제공 (브라우저 호환성)
- 다크 모드에서 라이트 모드 토큰(neutral-100, neutral-200) 사용 금지
- 인터랙션 요소는 표준화된 transform/shadow 효과 사용

### IconButton 사용 규칙

- 반복되는 아이콘 전용 버튼은 `<IconButton>` 사용 (토큰/hover/active 일관)
- 사이즈: `sm(28px)`, `md(36px)`, `lg(44px)` – 레이아웃 밀도에 맞게 선택
- 접근성: 항상 `aria-label` 필수, variant에 관계없이 role="button" 의미 명확화
- 커스텀 버튼에 동일 패턴 필요 시 확장 대신 IconButton 조합 우선

````

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
````

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

**💻 일관된 코드 스타일은 팀 생산성을 높입니다.**
