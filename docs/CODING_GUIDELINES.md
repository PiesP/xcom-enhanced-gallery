# 코딩 가이드라인

집행 가능한 규칙 중심. 세부 설계는 [`ARCHITECTURE.md`](ARCHITECTURE.md) |
[`vendors-safe-api.md`](vendors-safe-api.md) 참조.

---

## 스택 & 경로

- **스택**: TypeScript(strict) + Vite 7 + SolidJS 1.9 + Vitest 3(JSDOM)
- **산출물**: `dist/xcom-enhanced-gallery.{dev.}user.js` (+ `.map`)
- **별칭**: `@` → src | `@features` → src/features | `@shared` → src/shared |
  `@assets` → src/assets

---

## 포맷팅 & 네이밍

```typescript
// ✅ 2 spaces, 세미콜론, 단일 따옴표
// ✅ Import 순서: 타입 → 벤더 getter → 내부 모듈 → 스타일
import type { MediaItem } from '@shared/types';
import { getSolidCore } from '@shared/external/vendors';
import { MediaService } from '@shared/services';
import styles from './Component.module.css';
```

- **파일/디렉터리**: kebab-case (`gallery-app.tsx`)
- **변수/함수**: camelCase, 함수는 동사+명사 (`extractMediaUrl`)
- **상수**: SCREAMING_SNAKE_CASE (`MAX_CONCURRENCY`)
- **타입**: PascalCase (`MediaItem`)

---

## 레이어 & 의존성

```
Features → Shared → External
```

**금지**:

- Features → ServiceManager 직접 import (액세서 사용)
- solid-js, fflate 등 직접 import (getter 사용)
- GM\_\* 직접 사용 (`getUserscript()` 사용)
- 하드코딩 색상/시간/이징 (디자인 토큰만)

---

## 외부 의존성

### Vendor Getters

```ts
import { getSolidCore } from '@shared/external/vendors';
const solid = getSolidCore();
const { createSignal, createEffect, onCleanup } = solid;
```

### Userscript Adapter

```ts
import { getUserscript } from '@shared/external/userscript/adapter';
await getUserscript().download(url, filename);
```

---

## 상태 (SolidJS Native)

**권장**:

```ts
const solid = getSolidCore();
const [items, setItems] = solid.createSignal<Item[]>([]);
const firstItem = solid.createMemo(() => items()[0] ?? null);
```

**레거시** (신규 코드 금지): `createGlobalSignal`

---

## 입력 이벤트 (PC 전용)

**허용**: click, keydown/keyup, wheel, contextmenu, mouse **금지**:
Touch/Pointer 계열 (테스트로 RED)

**Lint**:

- JSX: `onTouch*`, `onPointer*` 금지
- addEventListener: `'touch*'`, `'pointer*'` 금지

---

## 스타일

### 디자인 토큰

- CSS Modules + 토큰만 사용
- 색상: `--xeg-*`, `--color-*`
- Border Radius: `--xeg-radius-{md|lg|xl|2xl|pill|full}`
- Z-index: `--xeg-z-{toolbar|modal|toast}`

**테이블**:

| 용도     | 토큰                  | 예                 |
| -------- | --------------------- | ------------------ |
| 인터랙션 | `--xeg-radius-md`     | IconButton         |
| 일반     | `--xeg-radius-lg`     | Toolbar 버튼, 카드 |
| 대형     | `--xeg-radius-xl/2xl` | 모달, 토스트       |
| Pill     | `--xeg-radius-pill`   | 배지, Chip         |
| 원형     | `--xeg-radius-full`   | 아바타, 원형 토글  |

### 접근성

- Focus: `outline: var(--xeg-focus-ring)`
- 대비: WCAG AA 준수
- 모션: `@media (prefers-reduced-motion)`

---

## Userscript 통합

### 스타일 주입

- 글로벌: `window.XEG_CSS_TEXT`
- 모드: `window.XEG_STYLE_HEAD_MODE` (`'auto'` | `'defer'` | `'off'`)
- Light DOM: `<style id="xeg-styles">` (head 주입)

### 소스맵

- **공통**: dev/prod 모두 `.map` 생성
- **주석**: dev만 `//# sourceMappingURL=` 추가
- **검증**: `sources/sourcesContent` 무결성, dead-preload 제거

### 헤더

**필수**: `@name`, `@namespace`, `@version`, `@description`, `@author`,
`@license` **권한**: `@grant`
(GM_setValue/GM_getValue/GM_download/GM_xmlhttpRequest), `@connect` (x.com,
pbs.twimg.com 등) **배포**: `@downloadURL`, `@updateURL`, `@supportURL`

---

## UI 컴포넌트

### 아이콘 고유성 원칙

각 아이콘은 **단일 목적**으로만 사용합니다:

- **QuestionMark**: 키보드 단축키 도움말 전용
- **Settings**: 설정 모달 열기 전용
- **Download**: 다운로드 액션 전용
- **Close**: 닫기 액션 전용

**테스트 강제**: `test/architecture/icon-semantic-uniqueness.test.ts`가 아이콘
중복 사용을 RED로 방지합니다.

**등록 위치**:

1. `src/assets/icons/xeg-icons.ts`: SVG 정의 + XEG_ICONS 객체 export
2. `src/shared/services/iconRegistry.ts`: CORE_ICONS + ICON_IMPORTS 추가
3. `src/shared/components/ui/Icon/icons/registry.ts`: iconComponentMap에
   createSvgIcon 등록

### ContextMenu ARIA 원칙

ContextMenu는 WCAG 2.1 Level AA를 준수하는 접근성 속성을 제공합니다:

**필수 ARIA 속성**:

- `role="menu"` (컨테이너)
- `role="menuitem"` (각 항목)
- `aria-label` (메뉴 전체 레이블)
- `aria-orientation="vertical"` (수직 방향 명시)
- `aria-activedescendant` (현재 포커스된 항목 ID 동적 바인딩)
- 각 menuitem에 고유한 `id` 속성

**선택적 ARIA 속성**:

- `ariaLabelledBy?: string` (ContextMenuAction 타입) - 외부 요소로 레이블링

**키보드 네비게이션**:

- Arrow Up/Down: 포커스 순환 이동
- Enter: 항목 실행
- Escape: 메뉴 닫기

**테스트 강제**: `test/architecture/contextmenu-aria-enhancement.test.ts`가 ARIA
완전성을 검증합니다.

### Tooltip 사용 원칙

Tooltip 컴포넌트는 키보드 단축키 시각적 강조 및 추가 설명을 제공합니다:

**기본 사용**:

```tsx
import { Tooltip } from '@shared/components/ui/Tooltip';

<Tooltip content='간단한 설명' show={isHovered} delay={500}>
  <button>Hover me</button>
</Tooltip>;
```

**키보드 단축키 강조** (`<kbd>` 마크업):

```tsx
<Tooltip
  content={
    <>
      Press <kbd>←</kbd> or <kbd>→</kbd> to navigate
    </>
  }
  show={isHovered}
  delay={500}
  placement='top'
>
  <button>Navigate</button>
</Tooltip>
```

**필수 원칙**:

- **PC 전용**: mouseenter/focus, mouseleave/blur만 사용 (Touch/Pointer 금지)
- **ARIA**: `role="tooltip"`, `aria-describedby` 자동 설정
- **디자인 토큰**: CSS Modules + 토큰만 사용 (하드코딩 금지)
- **포지셔닝**: 동적 계산 (뷰포트 경계 회피)

**Props**:

- `content`: 문자열 또는 JSX (필수)
- `show`: 표시 여부 (필수)
- `delay`: 지연 시간 (기본값: 500ms)
- `placement`: 위치 (기본값: 'top', 옵션: 'top' | 'bottom')
- `id`: 커스텀 tooltip ID (aria-describedby 연결용)

**테스트 강제**: `test/shared/components/ui/tooltip-component.test.tsx` (16
tests)가 PC 전용 정책, 디자인 토큰, ARIA 완전성을 검증합니다.

---

## 서비스

- **접근**: `@shared/container/*` 액세서/브리지
- **Settings**: SettingsService 경유, 타입/기본값/마이그레이션 중앙 관리
- **Toast**: UnifiedToastManager (전역), 로컬 토스트 금지
- **다운로드**: `getUserscript().download()` 또는 `getNativeDownload()`
- **ZIP**: `@shared/external/zip/zip-creator`
- **로깅**: `@shared/logging`, correlationId 적용

---

## 테스트 (TDD)

- **환경**: Vitest + JSDOM (`https://x.com`)
- **포함**: `test/**/*.{test,spec}.{ts,tsx}`
- **타임아웃**: 테스트 20s, 훅 25s
- **절차**: RED → GREEN → REFACTOR
- **외부 의존성**: getter/adapter 경유 (모킹 가능)

### 수명주기

- 훅: `onCleanup` 필수 (리스너/타이머/관찰자 해제)
- 의존성 배열: ESLint 규칙, 안정 참조 유지
- 누수 검증: 장시간 실행 시나리오 (100+ 아이템)

---

## 툴바 키보드

- **포커스 흐름**: Prev → Next → Fit → 다운로드 → Settings → Close
- **키 매핑**: Arrow/Home/End/Escape (Tab은 브라우저 기본)
- **그룹**: `data-toolbar-group`, `data-group-first="true"`

---

## 성능

- **프리로드**: `computePreloadIndices` (거리 우선)
- **스케줄러**: immediate/idle/raf/microtask
- **타이머**: `globalTimerManager` (등록/정리, 누수 0)

---

## 품질 게이트

**커밋/PR 전**:

```pwsh
npm run typecheck
npm run lint:fix
npm test
npm run build
```

**체크리스트**:

- [ ] Vendor/Userscript getter/adapter 경유
- [ ] PC 전용 입력 (Touch/Pointer 금지)
- [ ] 디자인 토큰 사용 (하드코딩 금지)
- [ ] SolidJS Native 패턴 (`createGlobalSignal` 금지)
- [ ] 소스맵 정책 준수

---

## 코드 예시

### Vendor/SolidJS Native

```ts
import { getSolidCore } from '@shared/external/vendors';
const solid = getSolidCore();
const { createSignal, createMemo, createEffect, onCleanup } = solid;

const [items, setItems] = createSignal<string[]>([]);
const firstItem = createMemo(() => items()[0] ?? null);

createEffect(() => {
  console.log('Items:', items());
});
```

### Userscript 다운로드

```ts
import { getUserscript } from '@shared/external/userscript/adapter';
await getUserscript().download('https://example.com/file.jpg', 'file.jpg');
```

### Wheel 정책

```ts
import { ensureWheelLock } from '@shared/utils/events/wheel';
const cleanup = ensureWheelLock(overlayEl, e => shouldConsume(e));
// onCleanup: cleanup()
```

### ZIP 생성

```ts
import { createZipFromItems } from '@shared/external/zip/zip-creator';
const blob = await createZipFromItems(items, 'media.zip');
```

---

## Anti-Patterns

❌ **금지**:

- `.red.` 제거와 스펙 변경 동시 진행
- 번들/접근성/토큰 회귀 측정 없이 구조 수정
- `signal.value` 접근 (SolidJS는 `signal()` 호출)
- `createGlobalSignal` 사용 (레거시, 신규 코드 금지)
- 직접 `solid-js`, `fflate` import (getter 사용 필수)
- 직접 `GM_*` API 호출 (adapter 사용 필수)
- 색상/시간/이징 하드코딩 (디자인 토큰 필수)
- Touch/Pointer 이벤트 사용 (PC 전용 설계)

---

본 문서는 프로젝트의 단일 소스입니다. 누락 규칙은 [`AGENTS.md`](../AGENTS.md) 및
테스트 기준으로 보완하세요.
