# 코딩 가이드라인

> 집행 가능한 규칙 중심. 세부 설계는 [`ARCHITECTURE.md`](ARCHITECTURE.md) |
> [`vendors-safe-api.md`](vendors-safe-api.md) 참조

**최근 업데이트**: 2025-10-06 **버전**: 0.2.4 **프로젝트 상태**: 테스트 2931
passed (110 skipped, 1 todo) | 번들 495.86 KB

---

## 📑 Quick Reference (빠른 참조)

### 자주 사용하는 패턴

#### 1. SolidJS Signal 생성

```typescript
import { getSolidCore } from '@shared/external/vendors';
const solid = getSolidCore();
const [count, setCount] = solid.createSignal(0);
const doubled = solid.createMemo(() => count() * 2);
```

#### 2. 서비스 접근

```typescript
import { getMediaService } from '@shared/container/service-accessors';
const mediaService = getMediaService();
```

#### 3. Userscript 다운로드

```typescript
import { getUserscript } from '@shared/external/userscript/adapter';
await getUserscript().download(url, filename);
```

#### 4. 디자인 토큰 사용

```css
.container {
  background: var(--xeg-bg-primary);
  color: var(--xeg-text-primary);
  border-radius: var(--xeg-radius-md);
  transition: var(--xeg-transition-fast);
}
```

#### 5. PC 전용 이벤트

```typescript
// ✅ 허용
element.addEventListener('click', handler);
element.addEventListener('keydown', handler);
element.addEventListener('wheel', handler);

// ❌ 금지
element.addEventListener('touchstart', handler);
element.addEventListener('pointerdown', handler);
```

---

## Decision Trees (의사결정 트리)

### 언제 어떤 상태 관리를 사용하나?

```
상태가 필요한가?
├─ YES → 범위는?
│   ├─ 컴포넌트 로컬 → createSignal()
│   ├─ 전역 상태 → shared/state/ + createSignal()
│   └─ 복잡한 객체 → createStore()
└─ NO → 파생값인가?
    ├─ YES → createMemo()
    └─ NO → 일반 상수/함수
```

### 어떤 서비스를 사용하나?

```
미디어 추출/다운로드?
├─ 추출 → MediaExtractionService
├─ 단일 다운로드 → MediaService.downloadSingle()
└─ 대량 다운로드 → BulkDownloadService

설정 관리?
└─ SettingsService (기본값/마이그레이션/유효성)

알림 표시?
└─ UnifiedToastManager (전역, 로컬 토스트 금지)

테마 변경?
└─ ThemeService
```

### 어떤 이벤트 핸들러를 사용하나?

```
사용자 입력?
├─ 클릭 → onClick, click
├─ 키보드 → onKeyDown, onKeyUp, keydown, keyup
├─ 마우스 이동 → onMouseEnter, onMouseLeave
├─ 스크롤 → wheel 이벤트
└─ 터치/포인터? → ❌ 금지 (PC 전용 설계)
```

---

## Common Pitfalls (흔한 함정)

### ❌ 함정 1: 직접 import

```typescript
// ❌ 금지
import { createSignal } from 'solid-js';
import { zip } from 'fflate';

// ✅ 권장
import { getSolidCore } from '@shared/external/vendors';
const solid = getSolidCore();
const { createSignal } = solid;
```

**이유**: TDZ-safe 초기화, 테스트 모킹 용이성

### ❌ 함정 2: Signal을 값처럼 접근

```typescript
// ❌ 금지 (Preact 스타일)
const count = createSignal(0);
count.value = 42;
console.log(count.value);

// ✅ 권장 (SolidJS Native)
const [count, setCount] = createSignal(0);
setCount(42);
console.log(count());
```

**이유**: SolidJS Native 패턴, 반응성 추적

### ❌ 함정 3: 하드코딩 스타일 값

```css
/* ❌ 금지 */
.button {
  background: #1a1a1a;
  border-radius: 8px;
  transition: all 0.2s ease;
}

/* ✅ 권장 */
.button {
  background: var(--xeg-bg-primary);
  border-radius: var(--xeg-radius-md);
  transition: var(--xeg-transition-fast);
}
```

**이유**: 테마 일관성, 접근성, 유지보수성

### ❌ 함정 4: ServiceManager 직접 사용

```typescript
// ❌ 금지 (Features 레이어에서)
import { ServiceManager } from '@shared/container/service-manager';
const service = ServiceManager.getInstance().getMediaService();

// ✅ 권장
import { getMediaService } from '@shared/container/service-accessors';
const service = getMediaService();
```

**이유**: 레이어 경계 명확화, 순환 의존성 방지

### ❌ 함정 5: Body Scroll 직접 조작

```typescript
// ❌ 금지
document.body.style.overflow = 'hidden';

// ✅ 권장
import { bodyScrollManager } from '@shared/utils/scroll/body-scroll-manager';
bodyScrollManager.lock('my-component', 5);
// cleanup
bodyScrollManager.unlock('my-component');
```

**이유**: 우선순위 관리, 원본 상태 복원, 충돌 방지

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

## 보안

### URL 검증

**필수**: 모든 Twitter/X 미디어 URL은 `isTrustedTwitterMediaHostname()` 또는
`isTrustedHostname()` 사용

```ts
import { isTrustedTwitterMediaHostname } from '@shared/utils/url-safety';

// ✅ 올바른 방법
if (src && !isTrustedTwitterMediaHostname(src)) {
  return null; // 악의적 URL 거부
}

// ❌ 금지 (불완전한 검증)
if (src && src.includes('twimg.com')) {
  // 취약: evil.com/twimg.com 또는 twimg.com.evil.com 통과 가능
}
```

**보호 대상**:

- Path injection: `https://evil.com/twimg.com/malicious.js`
- Subdomain spoofing: `https://twimg.com.evil.com/malicious.js`
- Hostname spoofing: `https://twimg-com.evil.com/malicious.js`

### Prototype Pollution 방지

**필수**: 외부 데이터 병합 시 `sanitizeSettingsTree()` 사용

```ts
import { sanitizeSettingsTree } from '@features/settings/services/SettingsService';

// ✅ 올바른 방법
const sanitized = sanitizeSettingsTree(externalData, ['mergeContext']);
for (const [key, value] of Object.entries(sanitized)) {
  target[key] = value;
}

// ❌ 금지 (prototype pollution 취약)
for (const [key, value] of Object.entries(externalData)) {
  target[key] = value; // __proto__, constructor 키 차단 없음
}
```

**차단 대상**:

- `__proto__` 키를 통한 프로토타입 변조
- `constructor` 키를 통한 생성자 변조
- `prototype` 키를 통한 프로토타입 체인 오염
- 중첩 객체 내 악의적 키

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

### ContextMenu ARIA 원칙

ContextMenu는 WCAG 2.1 Level AA를 준수하는 접근성 속성을 제공합니다:

**필수 ARIA 속성**:

- `role="menu"` (컨테이너)
- `role="menuitem"` (각 항목)
- `aria-label` (메뉴 전체 레이블)
- `aria-orientation="vertical"` (수직 방향 명시)
- `aria-activedescendant` (현재 포커스된 항목 ID 동적 바인딩)
- 각 menuitem에 고유한 `id` 속성

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

## 스크롤 & 이벤트

### Body Scroll 제어

**필수**: 모든 body overflow 조작은 `bodyScrollManager` 사용

```typescript
import { bodyScrollManager } from '@shared/utils/scroll/body-scroll-manager';

// ✅ 올바른 방법
bodyScrollManager.lock('my-component', 5);
// ... cleanup
bodyScrollManager.unlock('my-component');

// ❌ 금지 (직접 조작)
document.body.style.overflow = 'hidden';
```

**우선순위**:

- 모달/Settings: 10
- 갤러리: 5
- 기타: 0 (기본값)

### Reactive Accessor

**권장**: 범용 resolve 함수는 `@shared/utils/reactive-accessor` 사용

```typescript
import { resolve, resolveWithDefault } from '@shared/utils/reactive-accessor';

// ✅ 올바른 방법
const value = resolve(maybeAccessor);
const safeValue = resolveWithDefault(optional, defaultValue);

// ❌ 금지 (각 파일에 중복 구현)
function resolve<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? value() : value;
}
```

### Singleton Listener

**패턴**: 여러 훅이 동일 이벤트 타입을 공유할 때 사용

```typescript
import { globalListenerManager } from '@shared/utils/singleton-listener';

// ✅ 올바른 방법
export function useMyHook() {
  const cleanup = ensureWheelLock(document, handler);
  globalListenerManager.register('my-hook-wheel', cleanup);

  onCleanup(() => globalListenerManager.unregister('my-hook-wheel'));
}

// ❌ 금지 (훅별 독립 싱글톤)
let activeCleanup: (() => void) | null = null;
export function useMyHook() {
  if (activeCleanup) {
    activeCleanup();
  }
  activeCleanup = cleanup;
}
```

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

## 번들 최적화

### 크기 목표 (회귀 방지)

- **Raw**: ≤473 KB (현재: 495.19 KB, **22 KB 초과** ⚠️)
- **Gzip**: ≤118 KB (현재: 123.73 KB, **5.73 KB 초과** ⚠️)
- **이상적**: Raw 420 KB, Gzip 105 KB
- **테스트**: `test/architecture/bundle-size-optimization.contract.test.ts` (15
  tests)

### 최적화 가이드라인

**Tree-shaking 준수**:

- `package.json` sideEffects에 CSS만 명시
- Dead code (미사용 export) 정기적 정리
- Re-export 체인 ≤3 depth 유지

**코드 중복 제거 (DRY)**:

- 동일 로직 2회 이상 등장 시 공통 유틸로 추출
- 타입 정의 중복 금지 (barrel export 활용)
- 패턴 반복 ≤20회 유지

**Pure 함수 활용**:

- 부작용 없는 함수는 `/*#__PURE__*/` 주석 추가
- Terser가 안전하게 제거 가능하도록 보장
- 목표: 50+ pure annotations (현재: 0, 향후 개선)

**Orphan 파일 최소화**:

- 미사용 파일은 주석 처리보다 제거 우선
- 의도적 분리 모듈은 문서화 (예: visible-navigation.ts)
- 의존성 그래프 정기적 점검 (`npm run deps:all`)

### 빌드 설정 (vite.config.ts)

**현재 최적화**:

- Terser: pure*funcs (logger, console), unsafe opts, mangleProps (`^*[a-z]`)
- Treeshake: moduleSideEffects: 'no-external', propertyReadSideEffects: false
- CSS: modules hashing, PostCSS 최적화

**금지 사항**:

- 번들 크기 증가시키는 라이브러리 추가 전 검토 필수
- Dead code를 주석 처리로 방치 (제거 권장)
- Side-effect 있는 모듈을 sideEffects: false로 표시

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
