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

### 테마 토큰 시스템 (Theme Tokens) ✅ **완료된 시스템**

#### 자동 테마 대응 시스템

| 용도        | 라이트 모드 | 다크 모드   | 권장 토큰                     |
| ----------- | ----------- | ----------- | ----------------------------- |
| 갤러리 배경 | 밝은 색상   | 어두운 색상 | `var(--xeg-gallery-bg)`       |
| 모달 배경   | 밝은 색상   | 어두운 색상 | `var(--xeg-modal-bg)`         |
| 모달 보더   | 중간 색상   | 밝은 색상   | `var(--xeg-modal-border)`     |
| 기본 배경   | 밝은 색상   | 어두운 색상 | `var(--xeg-color-bg-primary)` |

#### 완성된 테마 토큰 사용 예시

```css
/* ✅ 갤러리 - 테마 자동 대응 */
.gallery-container {
  background: var(--xeg-gallery-bg); /* 라이트/다크 자동 전환 */
}

/* ✅ 설정 모달 - 테마별 배경/보더 (컴포넌트 토큰 금지, 테마 토큰만 사용) */
.modal {
  background: var(--xeg-modal-bg);
  border: 1px solid var(--xeg-modal-border);
}

/* ✅ 기본 인터랙션 요소 */
.button {
  background: var(--xeg-color-bg-primary);
  color: var(--xeg-color-text-primary);
}

.button:hover {
  background: var(--xeg-color-bg-hover);
}
```

#### 시스템 테마 감지 (구현 완료)

```css
/* 시스템 설정 감지 */
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) {
    --xeg-gallery-bg: var(--xeg-gallery-bg-light);
    --xeg-modal-bg: var(--xeg-modal-bg-light);
  }
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --xeg-gallery-bg: var(--xeg-gallery-bg-dark);
    --xeg-modal-bg: var(--xeg-modal-bg-dark);
  }
}

/* 수동 테마 설정 */
[data-theme='light'] {
  --xeg-gallery-bg: var(--xeg-gallery-bg-light);
  --xeg-modal-bg: var(--xeg-modal-bg-light);
  --xeg-modal-border: var(--xeg-modal-border-light);
}

[data-theme='dark'] {
  --xeg-gallery-bg: var(--xeg-gallery-bg-dark);
  --xeg-modal-bg: var(--xeg-modal-bg-dark);
  --xeg-modal-border: var(--xeg-modal-border-dark);
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

- ✅ **하드코딩 색상 사용 금지** - 모든 색상은 토큰을 통해서만 사용
- ✅ **테마 자동 대응** - `--xeg-gallery-bg`, `--xeg-modal-bg` 등 테마별 토큰
  활용
- ✅ **시스템 테마 감지** - `prefers-color-scheme` 미디어 쿼리 지원
- ✅ **접근성 보장** - 라이트/다크 모드 모두에서 적절한 대비율 유지
- ✅ **표준화된 호버/포커스** - 일관된 인터랙션 상태 스타일 사용

### IconButton 사용 규칙

- 반복되는 아이콘 전용 버튼은 반드시 `<IconButton>` 사용 (토큰/hover/active
  일관)
- 사이즈: `sm(28px)`, `md(36px)`, `lg(44px)`, `toolbar` – 툴바에는 `toolbar`
  권장
- 접근성: 항상 `aria-label` 필수, variant에 관계없이 role="button" 의미 명확화
- 파괴적 액션(닫기/삭제 등)은 `intent="danger"`로 의미 전달(색/상태 토큰 매핑)
- 커스텀 버튼에 동일 패턴 필요 시 확장 대신 IconButton 조합 우선

````

### 애니메이션 규칙

- transition/animation은 토큰만 사용: 시간은 `--xeg-duration-*`, 이징은 `--xeg-ease-*`
- 인라인 스타일에서도 동일 규칙 적용 (예: `opacity var(--xeg-duration-normal) var(--xeg-ease-standard)`)
- 하드코딩 숫자(ms/s)나 키워드(ease, ease-in-out 등) 직접 사용 금지
- 서비스에서 주입하는 CSS 역시 동일 토큰을 사용

추가 규칙:
- `--xeg-easing-*` vs `--xeg-ease-*` 혼용 금지. 내부 표준은 `--xeg-easing-*`, 소비자(alias) 레이어에서는 `--xeg-ease-*` 허용(중앙 매핑 존재).
- CSS Modules의 `composes` 사용 금지(도구 호환성 문제). 공통 스타일은 유틸 클래스로 분리하거나 명시적으로 중복 선언합니다.

권장 예시:

```css
/* 금지 */
.spinner { animation: xeg-spin 1s var(--xeg-easing-linear) infinite; }

/* 권장 */
.spinner { animation: xeg-spin var(--xeg-duration-normal) var(--xeg-easing-linear) infinite; }

컴포넌트 애니메이션 정책:
- `src/assets/styles/components/animations.css` 내 `.xeg-animate-*` 클래스는 `var(--xeg-duration-*)`와 `var(--xeg-easing-*)`(또는 alias `--xeg-ease-*`)만 사용합니다.
- 하드코딩된 지속시간(예: `1s`, `200ms`) 금지 — 전용 테스트로 검증됩니다.
```

### Component vs Semantic 토큰

- 소스 오브 트루스는 Semantic 토큰(`--xeg-modal-bg`, `--xeg-color-*`, `--xeg-radius-*`).
- 컴포넌트 토큰은 중앙 매핑(alias)만 허용: `--xeg-comp-foo-*` → `var(--xeg-foo-*)`.
- 컴포넌트 CSS에서는 가능하면 Semantic 토큰 직접 사용, 과도기에는 alias 허용.
- 새 컴포넌트 추가 시 alias는 공용 토큰 파일에서만 정의(로컬 정의 금지).

#### 권장 매핑 예시(중앙 토큰 파일에서만 정의)

```
/* design-tokens.semantic.css (중앙 정의 예) */
:root {
  /* Toolbar */
  --xeg-comp-toolbar-bg: var(--xeg-bg-toolbar);
  --xeg-comp-toolbar-border: var(--color-border-default);
  --xeg-comp-toolbar-radius: var(--xeg-radius-lg);

  /* Modal */
  --xeg-comp-modal-bg: var(--xeg-modal-bg);
  --xeg-comp-modal-border: var(--xeg-modal-border);
  --xeg-comp-modal-backdrop: var(--color-overlay-backdrop);
}
```

컴포넌트 CSS에서는 semantic 또는 위 alias만 사용하세요. 인라인 스타일/주입 CSS도 동일 규칙이 적용됩니다.

## 🏷️ 네이밍 규칙

### 내보내기(Export) 심볼 네이밍

- 테스트 정책상 특정 금지어가 포함된 이름은 export 심볼로 사용하지 않습니다(예: "unified").
- 필요 시 내부 구현 함수/컴포넌트 이름을 변경하고, default export로 호환을 유지하세요.
- 예) 내부 이름: `InternalToolbarUnified` → `export default InternalToolbarUnified;`
  - 임포트 측: `import Toolbar from './UnifiedToolbar';` (기존 경로/기본 임포트 유지)

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

## ⬇️ 다운로드 동작 가이드

### ZIP 내 파일명 충돌 정책

- 동일한 기본 파일명이 ZIP에 여러 번 추가될 수 있습니다. 이때 덮어쓰지 않고 다음
  규칙으로 고유화를 보장합니다.
  - 첫 번째 파일은 그대로 유지: alice_100_1.jpg
  - 이후 충돌 파일은 접미사 -1, -2, ... 를 확장자 앞에 붙입니다:
    alice_100_1-1.jpg, alice_100_1-2.jpg
- 구현 위치: BulkDownloadService 및 MediaService의 ZIP 경로에서 충돌 감지 및
  접미사 부여
- 테스트로 보장: test/unit/shared/services/bulk-download.filename-policy.test.ts

### 실패 요약 수집 정책

- 다중 다운로드(ZIP) 중 일부 항목이 실패해도 가능한 항목은 계속 진행합니다(부분
  성공 허용).
- 실패 항목은 다음 구조로 수집되어 결과에 포함됩니다.
  - DownloadResult.failures?: Array<{ url: string; error: string }>
- 성공/실패 요약은 UI/로그/알림에서 사용자에게 상황을 알리기 위한 최소 정보를
  제공합니다.
