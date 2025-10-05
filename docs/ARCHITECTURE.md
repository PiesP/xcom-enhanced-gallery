# xcom-enhanced-gallery 아키텍처 설계서

프로젝트 구조, 레이어 책임, 경계, 핵심 유스케이스를 정의합니다.

**관련 문서**: [코딩 가이드](CODING_GUIDELINES.md) |
[Vendors API](vendors-safe-api.md) | [실행/CI](../AGENTS.md) |
[Copilot 지침](../.github/copilot-instructions.md) |
[의존성 그래프](dependency-graph.svg)

---

## 1. 레이어 구조

```text
Features (UI/도메인)
   ↓
Shared (services/state/utils)
   ↓
External (vendors/userscript/zip)
```

**경로 별칭**: `@` → src | `@features` → src/features | `@shared` → src/shared |
`@assets` → src/assets

**핵심 규칙**:

- 외부 라이브러리는 getter 경유 (`@shared/external/vendors`)
- Userscript API는 adapter 경유 (`@shared/external/userscript/adapter`)
- Features → ServiceManager 직접 import 금지 (액세서 사용)
- 하드코딩 색상/시간/이징 금지 (디자인 토큰만)
- PC 전용 입력만 (Touch/Pointer 금지)

---

## 2. 레이어별 책임

### Features (`src/features/**`)

**책임**: UI 컴포넌트, 사용자 인터랙션 (PC 전용), 상태 구독/표시

**허용**:

- 서비스 접근: `@shared/container/service-accessors`, `service-bridge`
- 스타일: CSS Modules + 디자인 토큰
- 이벤트: click, keydown/keyup, wheel, contextmenu, mouse

**금지**:

- ServiceManager 직접 import
- solid-js, fflate 등 직접 import
- GM\_\* 직접 사용

**예**: `features/gallery/*`, `features/settings/*`

### Shared (`src/shared/**`)

**책임**: 서비스, 상태(Signals), 유틸리티, 로깅, 성능

**허용**:

- 외부 라이브러리: `@shared/external/vendors` getter만
- Userscript: `@shared/external/userscript/adapter`
- ZIP: `@shared/external/zip/zip-creator`

**금지**:

- 브라우저/Userscript API 직접 참조
- import 시점 DOM 부작용

**예**: MediaService, BulkDownloadService, ThemeService, UnifiedToastManager

### External (`src/shared/external/**`)

**책임**: 외부 종속성 캡슐화, TDZ-safe 초기화, 테스트 모킹 용이성

**공개 API**:

- Vendors: `initializeVendors()`, `getSolidCore()`, `getSolidStore()`,
  `getSolidWeb()`, `getNativeDownload()`
- Userscript: `getUserscript().download()`, `.xhr()`, `.info()`
- ZIP: `createZipFromItems()`

---

## 3. vDOM/Light DOM 전략

### SolidJS vDOM + X.com React SPA 공존

#### 마운트

- **Light DOM 전용**: `#xeg-gallery-root` 단일 컨테이너
- Shadow DOM 미사용
- 호스트 DOM 직접 수정 금지

#### 스타일 주입

- 네임스페이스: `xeg-*`, `[data-xeg-*]`
- 글로벌 변수: `window.XEG_CSS_TEXT`
- 자동 주입: `<style id="xeg-styles">` (head)
- 게이팅: `window.XEG_STYLE_HEAD_MODE` (`'auto'` | `'defer'` | `'off'`)
- 구현: `vite.config.ts` (번들) + `GalleryContainer.tsx` (런타임)

#### SPA 재마운트

- `RebindWatcher` (MutationObserver 기반)
- 컨테이너 분실 감지 → 자동 재생성/재렌더 (≤250ms)
- Feature flag: `vdomRebind`
- 정리: 언마운트 시 observer 자동 해제

#### 이벤트/수명주기

- PC 전용 입력 (상세: 코딩 가이드)
- Vendor/Userscript: getter/adapter 경유
- 리스너/타이머/Observer: `onCleanup`에서 해제

---

## 4. Bootstrap 흐름

**엔트리**: `src/main.ts`

1. `initializeVendors()` - 환경/벤더 초기화
2. 서비스 컨테이너 구성/등록/워밍업
3. `feature-registration.ts` - 피처 등록
4. `event-wiring.ts` - 이벤트 배선 (PC 전용)
5. 스타일 주입 게이팅 적용

**불변 조건**: import 부작용 금지

---

## 5. 핵심 유스케이스

### 갤러리 활성화

1. 트리거 → `GalleryRenderer` 활성화
2. `MediaExtractionService` - URL/메타데이터 추출
3. `MediaMappingService` - 표시 모델 정규화
4. `gallery-store` 갱신 → UI 렌더
5. 키보드/휠 네비게이션 활성화

### 다운로드

- **단일**: `getUserscript().download()` 또는 `getNativeDownload()`
- **ZIP**: `createZipFromItems()` (병렬 다운로드 + StoreZipWriter)
- 토스트: 성공/실패/취소 피드백

### 설정

1. `SettingsService` - 기본값/마이그레이션/유효성
2. JSON import - `sanitizeSettingsTree()` (prototype 침투 차단)
3. UI - `@shared/container/settings-access` 액세서
4. 테마 반영 - `ThemeService` + 스타일 토큰

---

## 6. 상태 관리 (SolidJS Native)

**권장 패턴**:

```ts
const solid = getSolidCore();
const [items, setItems] = solid.createSignal<Item[]>([]);
const firstItem = solid.createMemo(() => items()[0] ?? null);
solid.createEffect(() => {
  console.log('Items changed:', items());
});
```

**레거시**: `createGlobalSignal` (호환 레이어, 신규 코드 금지)

**규칙**:

- Signals: `shared/state/**`
- 파생값: `createMemo()` 또는 selector
- 부작용: `createEffect()`
- 불변 업데이트, 파생 연산 격리

---

## 7. 외부 통합 계약

### Vendors

- 초기화: `initializeVendors()` (TDZ-safe)
- 정리: `cleanupVendors()`, `registerVendorCleanupOnUnloadSafe()`

### Userscript

```ts
type UserscriptAPI = {
  hasGM: boolean;
  manager: 'tampermonkey' | 'greasemonkey' | 'violentmonkey' | 'unknown';
  info(): UserScriptInfo | null;
  download(url: string, filename: string): Promise<void>;
  xhr(options: GMXmlHttpRequestOptions): { abort: () => void } | undefined;
};
```

- GM\_\* 부재 시 폴백 (fetch/BlobURL/xhr)

### ZIP

- `createZipFromItems(items, zipName, onProgress?, config?)` → `Promise<Blob>`
- 파일명 충돌 시 접미사 고유화

---

## 7.5. 보안 정책

### URL 검증 (XSS/Injection 방지)

**필수 가드 함수**:

- `isTrustedTwitterMediaHostname(url)`: Twitter 미디어 URL 검증 (정확한 hostname
  체크)
- `isTrustedHostname(url, allowedHosts)`: 커스텀 허용 목록 검증

**보호 메커니즘**:

```ts
// URL 객체를 통한 정확한 hostname 추출
const urlObj = new URL(urlString);
const hostname = urlObj.hostname.toLowerCase();

// 허용된 정확한 hostname만 허용 (startsWith/includes 금지)
if (!ALLOWED_HOSTS.includes(hostname)) {
  return null; // 거부
}
```

**차단되는 공격 패턴**:

- Path injection: `https://evil.com/twimg.com/malicious.js`
- Subdomain spoofing: `https://twimg.com.evil.com/malicious.js`
- Hostname spoofing: `https://twimg-com.evil.com/malicious.js`

**구현 위치**:

- `src/shared/utils/url-safety.ts`: 검증 함수
- `src/shared/utils/media/media-url.util.ts`: 미디어 URL 검증
- `src/features/settings/services/SettingsService.ts`: Settings URL 검증

### Prototype Pollution 방지

**필수 가드 함수**:

- `sanitizeSettingsTree(obj, context)`: 외부 데이터 정화 (prototype 키 제거)

**보호 메커니즘**:

```ts
// 위험한 키 차단
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

// 재귀적으로 객체 정화
function sanitize(obj) {
  const clean = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    if (DANGEROUS_KEYS.includes(key)) continue; // 위험 키 건너뛰기
    clean[key] = typeof value === 'object' ? sanitize(value) : value;
  }
  return clean;
}
```

**차단되는 공격 패턴**:

- `{ "__proto__": { "isAdmin": true } }` → prototype chain 변조
- `{ "constructor": { "prototype": { "isAdmin": true } } }` → 생성자 변조
- 중첩 객체 내 악의적 키 주입

**구현 위치**:

- `src/features/settings/services/SettingsService.ts`: `sanitizeSettingsTree()`,
  `mergeCategory()`
- Settings import/merge 시점에 자동 적용

### CodeQL 준수

**해결된 경고**:

- js/incomplete-url-substring-sanitization: 4건 (media-url.util.ts,
  twitter-dom.mock.ts)
- js/prototype-pollution-utility: 1건 (SettingsService.ts)

**False Positive 억제**:

- CodeQL 정적 분석이 보안 함수(`isTrustedTwitterMediaHostname`,
  `sanitizeSettingsTree`)의 내부 구현을 추적하지 못해 경고 발생
- 솔루션: `lgtm[rule-id]` 주석으로 False Positive 억제
- 억제 사유: 각 위치에 Rationale 주석으로 명확히 기록
- Epic: CODEQL-FALSE-POSITIVE-SUPPRESSION (2025-10-05 완료)

**테스트 가드**:

- `test/security/url-sanitization-hardening.contract.test.ts`: 10 tests
- `test/security/prototype-pollution-hardening.contract.test.ts`: 8 tests

**보안 검증 흐름**:

1. Phase 1 (RED): 보안 계약 테스트 작성 (18 tests)
2. Phase 2 (GREEN): 보안 함수 구현 및 일관성 적용
3. Phase 3 (REFACTOR): CodeQL False Positive 억제 + 문서화

---

## 8. 성능/메모리

### 성능

- 프리로드: `computePreloadIndices` (거리 우선/클램프)
- 스케줄러: immediate/idle/raf/microtask (JSDOM 폴백)
- 동시성: `maxConcurrent` 제한

### 메모리

- 리스너/타이머/관찰자: `onCleanup` 해제
- 장시간 실행 누수 0 보장
- Vendors 정리: `cleanupVendors()` 또는 unload-safe 유틸

### DOM 구조 (Epic DOM-DEPTH-GUARD)

**최대 깊이**: 6단계

1. `#xeg-gallery-root` (GalleryRenderer)
2. `.xeg-gallery-overlay` (GalleryContainer)
3. `.shell` (SolidGalleryShell)
4. `.contentArea` (스크롤 영역)
5. `.itemsContainer` (그리드)
6. `.container` (VerticalImageItem)

**테스트**: `test/architecture/dom-depth-guard.test.ts` (5 tests)

### 번들 최적화 (Epic BUNDLE-SIZE-OPTIMIZATION)

**현재 상태** (2025-10-05):

- Raw 번들: 471.67 KB (목표: 473 KB 이하, 이상적: 420 KB)
- Gzip 번들: 117.12 KB (목표: 118 KB 이하, 이상적: 105 KB)
- 테스트 가드: `test/architecture/bundle-size-optimization.contract.test.ts` (15
  tests)

**최적화 전략**:

1. **Tree-shaking**:
   - `package.json` sideEffects: CSS 파일만 side-effect로 표시
   - Rollup treeshake 옵션: `moduleSideEffects: 'no-external'`,
     `propertyReadSideEffects: false`
   - 미사용 export 자동 제거 (dead code elimination)

2. **Code Deduplication**:
   - 중복 함수 제거: `core-utils.ts` 중복 3개 제거 (→ `utils.ts` 통합)
   - DRY 원칙 준수: 패턴 반복 20회 이하 유지

3. **Terser 압축**:
   - Pure functions: `logger.debug/trace`, `console.log/debug/trace` 제거
   - Unsafe optimizations: comps, Function, math, symbols, methods, proto,
     regexp, undefined
   - Mangle properties: `^_[a-z]` 패턴 (internal props만)
   - Module mode: ES6 최적화 활성화

4. **Orphan 파일 관리**:
   - 32개 orphan 파일 존재 (대부분 의도적 분리 모듈)
   - 향후 개선: 실제 미사용 파일만 선별 제거

**회귀 방지**:

- 번들 크기 상한선 테스트 (473 KB raw, 118 KB gzip)
- 빌드 시 자동 검증: `scripts/validate-build.js`
- CI에서 크기 변화 추적

**향후 개선 방향**:

- Pure annotations 증가: Rollup 플러그인 또는 수동 `/*#__PURE__*/` 추가
- Deep code audit: 420 KB 목표 달성 (52 KB 추가 감소 필요)
- Dynamic imports 검토: 코드 분할 가능성 (Userscript 제약 고려)

---

## 9. 스크롤 격리 전략 (Scroll Isolation)

### 3계층 방어 전략

**아키텍처 원칙**:

1. **이벤트 수준 방어** (`ensureWheelLock`):
   - passive=false 리스너로 조건부 preventDefault
   - 갤러리 외부 스크롤 이벤트 차단
   - 테스트: `test/unit/events/ensureWheelLock.contract.test.ts`

2. **스마트 판별** (`useGalleryScroll`):
   - 이벤트 출처 정확 판별 (내부/외부 구분)
   - Shadow DOM 대응 (composedPath 활용)
   - Reactive accessor 패턴으로 옵션 처리

3. **CSS 격리** (`.xeg-*`):
   - `overflow-y: auto` (스크롤 가능 영역)
   - `contain: layout style paint` (레이아웃 격리)
   - `isolation: isolate` (스택 컨텍스트 격리)

### 통합 컴포넌트

**Body Scroll Manager** (`bodyScrollManager`):

- **목적**: 갤러리/모달 간 body scroll 충돌 해결
- **우선순위 시스템**:
  - Settings Modal: 10 (최우선)
  - Gallery: 5 (중간)
  - 기타: 0 (기본값)
- **특징**:
  - 중복 lock 자동 병합 (같은 id는 우선순위 업데이트)
  - 마지막 lock 해제 시 원본 overflow 자동 복원
  - 동시 여러 컨텍스트 안전 관리

**Reactive Accessor Utilities**:

- **목적**: SolidJS MaybeAccessor 패턴 공용 헬퍼
- **함수**:
  - `resolve<T>(value)`: Reactive 값 안전 resolve
  - `resolveWithDefault<T>(value, default)`: 기본값 fallback
  - `combineAccessors<T>(values)`: Memoized 배열 accessor

**Singleton Listener Manager** (`globalListenerManager`):

- **목적**: 중복 리스너 방지 (훅 간 이벤트 타입 공유)
- **패턴**: 단일 키당 하나의 리스너만 유지
- **사용**: 키 기반 register/unregister로 자동 교체

### 구현 위치

- **Body Scroll**: `src/shared/utils/scroll/body-scroll-manager.ts`
- **Reactive Accessor**: `src/shared/utils/reactive-accessor.ts`
- **Singleton Listener**: `src/shared/utils/singleton-listener.ts`
- **갤러리 스크롤**: `src/features/gallery/hooks/useGalleryScroll.ts`
- **Settings Modal**: `src/shared/components/ui/SettingsModal/SettingsModal.tsx`

### 테스트 가드

- Body Scroll Manager: `test/unit/utils/scroll/body-scroll-manager.test.ts` (13
  tests)
- Reactive Accessor: `test/unit/utils/reactive-accessor.test.ts` (13 tests)
- Singleton Listener: `test/unit/utils/singleton-listener.test.ts` (14 tests)
- Wheel Lock: `test/unit/events/ensureWheelLock.contract.test.ts`
- Gallery Scroll: `test/features/gallery/solid-gallery-shell-wheel.test.tsx`

---

## 10. 테스트 전략 (TDD)

- 환경: Vitest + JSDOM (`https://x.com`)
- RED → GREEN → REFACTOR
- 계약/경계/정책 테스트 가드

**예시**:

- Vendors/TDZ: `test/integration/vendor-tdz-resolution.test.ts`
- Userscript: `test/unit/shared/external/userscript-adapter.contract.test.ts`
- 휠/키보드: `test/unit/events/ensureWheelLock.contract.test.ts`
- 토큰: `test/unit/styles/modal-token.hardening.test.ts`

---

## 11. 확장 가이드

### 새 Feature

1. 계약 테스트 작성 (Shared)
2. 컴포넌트/훅 추가 (액세서로 서비스 사용)
3. CSS Modules + 토큰 + PC 전용 입력

### 새 Service

1. 인터페이스/계약 테스트
2. Vendor getter/어댑터 경유
3. 컨테이너 등록/워밍업/정리

**수용 기준**: 타입/린트/테스트 GREEN, 경계 위반 없음

---

## 11. Extension Points (확장 지점)

### 새로운 Feature 추가

**체크리스트**:

1. **컴포넌트 생성** (`src/features/<feature-name>/`)
   - 서비스 접근: `@shared/container/service-accessors` 사용
   - 스타일: CSS Modules + 디자인 토큰만
   - 이벤트: PC 전용 (click, keydown/keyup, wheel, contextmenu, mouse)

2. **상태 관리** (필요시)
   - SolidJS Native: `getSolidCore().createSignal()`
   - 글로벌 상태: `shared/state/` 디렉터리에 생성
   - 파생값: `createMemo()` 또는 `signalSelector` 활용

3. **서비스 통합** (필요시)
   - 서비스 생성: `src/shared/services/<service-name>.ts`
   - 컨테이너 등록: `src/shared/container/service-container.ts`
   - 타입 추가: `src/shared/container/service-types.ts`
   - 액세서 생성: `src/shared/container/service-accessors.ts`

4. **테스트 작성** (TDD)
   - 계약 테스트: `test/features/<feature-name>/*.test.tsx`
   - 통합 테스트: `test/integration/<feature-name>-integration.test.ts`
   - RED → GREEN → REFACTOR 순서 준수

**예제**: 새로운 필터 기능 추가

```typescript
// src/features/filter/FilterPanel.tsx
import { getSolidCore } from '@shared/external/vendors';
import { getMediaService } from '@shared/container/service-accessors';
import styles from './FilterPanel.module.css';

export const FilterPanel = () => {
  const solid = getSolidCore();
  const [filterType, setFilterType] = solid.createSignal<'all' | 'image' | 'video'>('all');

  const mediaService = getMediaService();
  const filteredItems = solid.createMemo(() => {
    const items = mediaService.getAllItems();
    return filterType() === 'all'
      ? items
      : items.filter(item => item.type === filterType());
  });

  return (
    <div class={styles.container}>
      <button onClick={() => setFilterType('all')}>All</button>
      <button onClick={() => setFilterType('image')}>Images</button>
      <button onClick={() => setFilterType('video')}>Videos</button>
    </div>
  );
};
```

### 새로운 Service 추가

**체크리스트**:

1. **서비스 인터페이스 정의** (`src/shared/services/`)
   - 타입 안전성 보장
   - 외부 의존성은 getter/adapter 경유만

2. **계약 테스트 작성** (RED)

   ```typescript
   // test/unit/services/my-service.contract.test.ts
   describe('MyService Contract', () => {
     it('should implement required interface', () => {
       const service = new MyService();
       expect(service.doSomething).toBeDefined();
     });
   });
   ```

3. **서비스 구현** (GREEN)
   - Vendor getter 사용: `getSolidCore()`, `getSolidStore()`
   - Userscript adapter: `getUserscript()`
   - 로깅: `@shared/logging` 사용

4. **컨테이너 등록**

   ```typescript
   // src/shared/container/service-container.ts
   export function configureServiceContainer(): ServiceContainer {
     const myService = new MyService();
     return {
       // ... 기존 서비스
       myService,
     };
   }
   ```

5. **액세서 추가**
   ```typescript
   // src/shared/container/service-accessors.ts
   export function getMyService(): MyService {
     return getServiceContainer().myService;
   }
   ```

**예제**: 캐싱 서비스 추가

```typescript
// src/shared/services/CacheService.ts
import { logInfo, logWarn } from '@shared/logging';

export class CacheService {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly ttl = 5 * 60 * 1000; // 5분

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      logWarn('Cache expired', { key });
      this.cache.delete(key);
      return null;
    }

    logInfo('Cache hit', { key });
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    logInfo('Cache set', { key });
  }

  clear(): void {
    this.cache.clear();
    logInfo('Cache cleared');
  }
}
```

### 새로운 External Integration 추가

**예제**: 새로운 외부 라이브러리 통합

```typescript
// src/shared/external/my-library/adapter.ts
import type { MyLibrary } from 'my-library';

let myLibraryInstance: MyLibrary | null = null;

export async function initializeMyLibrary(): Promise<void> {
  if (typeof window === 'undefined') {
    // Node/테스트 환경
    return;
  }

  // TDZ-safe 초기화
  const { default: MyLibrary } = await import('my-library');
  myLibraryInstance = new MyLibrary();
}

export function getMyLibrary(): MyLibrary {
  if (!myLibraryInstance) {
    throw new Error(
      'MyLibrary not initialized. Call initializeMyLibrary() first.'
    );
  }
  return myLibraryInstance;
}

// 테스트 모킹
export function __resetMyLibraryForTest(): void {
  myLibraryInstance = null;
}
```

**테스트 모킹**:

```typescript
// test/unit/external/my-library-adapter.test.ts
import { vi } from 'vitest';
import * as adapter from '@shared/external/my-library/adapter';

describe('MyLibrary Adapter', () => {
  it('should provide mocked instance', () => {
    const mockLib = { doSomething: vi.fn() };
    vi.spyOn(adapter, 'getMyLibrary').mockReturnValue(mockLib);

    const lib = adapter.getMyLibrary();
    lib.doSomething();

    expect(mockLib.doSomething).toHaveBeenCalled();
  });
});
```

---

## 12. Migration Patterns (패턴 전환 가이드)

### 레거시 → SolidJS Native 마이그레이션

**문제**: `createGlobalSignal` (Preact Signals 스타일)

**솔루션**: SolidJS Native Signals

**Before**:

```typescript
import { createGlobalSignal } from '@shared/state/createGlobalSignal';

const countSignal = createGlobalSignal(0);

// Preact 스타일 접근
countSignal.value = 42;
const current = countSignal.value;
countSignal.subscribe(value => console.log(value));
```

**After**:

```typescript
import { getSolidCore } from '@shared/external/vendors';

const solid = getSolidCore();
const [count, setCount] = solid.createSignal(0);

// SolidJS Native 패턴
setCount(42);
const current = count();
solid.createEffect(() => console.log(count()));
```

**체크리스트**:

- [ ] `.value` getter/setter → `signal()` / `setSignal()` 함수 호출
- [ ] `.subscribe()` → `createEffect()` 사용
- [ ] 파생값은 `createMemo()` 사용
- [ ] 테스트에서 모킹 패턴 변경 (`vi.spyOn(vendors, 'getSolidCore')`)

### ServiceManager 직접 import → 액세서 패턴

**문제**: Features에서 ServiceManager 직접 import

**Before**:

```typescript
// ❌ 금지
import { ServiceManager } from '@shared/container/service-manager';

const mediaService = ServiceManager.getInstance().getMediaService();
```

**After**:

```typescript
// ✅ 권장
import { getMediaService } from '@shared/container/service-accessors';

const mediaService = getMediaService();
```

**이유**:

- 레이어 경계 명확화 (Features → Shared)
- 테스트에서 쉽게 모킹 가능
- 순환 의존성 방지

---

## 13. Advanced Patterns (고급 패턴)

### Lazy Loading (지연 로딩)

**Userscript 제약**: 코드 분할(Code Splitting) 불가, 단일 번들만 가능

**대안**: 조건부 초기화 + 동적 import

```typescript
// src/features/advanced-feature/lazy-loader.ts
import { getSolidCore } from '@shared/external/vendors';

let advancedFeatureModule: typeof import('./advanced-feature') | null = null;

export async function loadAdvancedFeature(): Promise<void> {
  if (advancedFeatureModule) return;

  // 동적 import (번들에 포함되지만 초기화 지연)
  advancedFeatureModule = await import('./advanced-feature');
  advancedFeatureModule.initialize();
}

export function getAdvancedFeature() {
  if (!advancedFeatureModule) {
    throw new Error(
      'Advanced feature not loaded. Call loadAdvancedFeature() first.'
    );
  }
  return advancedFeatureModule;
}
```

**사용 예**:

```typescript
// 사용자가 특정 버튼 클릭 시에만 로드
button.addEventListener('click', async () => {
  await loadAdvancedFeature();
  const feature = getAdvancedFeature();
  feature.doSomething();
});
```

### Memoization & Caching

**성능 최적화**: 비용이 큰 연산 결과 캐싱

```typescript
import { getSolidCore } from '@shared/external/vendors';

const solid = getSolidCore();

// 계산 비용이 큰 파생값
const expensiveComputation = solid.createMemo(() => {
  const items = getAllItems();
  return items
    .map(item => heavyTransformation(item))
    .filter(item => complexCondition(item))
    .sort((a, b) => expensiveSorting(a, b));
});

// 사용
const result = expensiveComputation(); // 캐싱된 결과 반환
```

### Error Boundaries

**목적**: 에러 격리 및 복구

```typescript
// src/shared/utils/error-boundary.ts
import { getSolidCore } from '@shared/external/vendors';
import { logError } from '@shared/logging';

export function createErrorBoundary<T>(
  component: () => T,
  fallback: (error: Error) => T
): () => T {
  const solid = getSolidCore();
  const [error, setError] = solid.createSignal<Error | null>(null);

  return () => {
    try {
      if (error()) {
        return fallback(error()!);
      }
      return component();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      logError('Component error', { error: errorObj });
      setError(errorObj);
      return fallback(errorObj);
    }
  };
}
```

**사용 예**:

```typescript
import { createErrorBoundary } from '@shared/utils/error-boundary';

const SafeGallery = createErrorBoundary(
  () => <GalleryApp />,
  (error) => <ErrorFallback message={error.message} />
);
```

---

## 14. Performance Monitoring (성능 모니터링)

### 번들 크기 회귀 방지

**자동 검증**: `test/architecture/bundle-size-optimization.contract.test.ts`

**상한선**:

- Raw: ≤473 KB (현재: 471.67 KB)
- Gzip: ≤118 KB (현재: 117.12 KB)

**CI 통합**: `scripts/validate-build.js`에서 빌드 후 자동 검증

### 메모리 누수 감지

**패턴**: 모든 리스너/타이머는 `onCleanup`에서 해제

```typescript
import { getSolidCore } from '@shared/external/vendors';

const solid = getSolidCore();

solid.createEffect(() => {
  const handler = (e: Event) => console.log(e);
  document.addEventListener('click', handler);

  // 정리 함수 필수
  solid.onCleanup(() => {
    document.removeEventListener('click', handler);
  });
});
```

**테스트 검증**:

```typescript
describe('Memory Leak Guard', () => {
  it('should cleanup all listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const dispose = render(() => <MyComponent />);
    dispose(); // 언마운트

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });
});
```

### DOM 깊이 가드

**최대 깊이**: 6단계 (Epic DOM-DEPTH-GUARD)

**테스트**: `test/architecture/dom-depth-guard.test.ts`

```typescript
it('should not exceed max DOM depth', () => {
  const container = document.createElement('div');
  render(() => <GalleryApp />, container);

  const deepestElement = container.querySelector('.container'); // VerticalImageItem
  const depth = getDOMDepth(deepestElement);

  expect(depth).toBeLessThanOrEqual(6);
});
```

---

## 부록

**의존성 그래프**: `docs/dependency-graph.(svg|html)` | 생성: `npm run deps:all`

**관련 문서**:

- 코딩 규칙: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)
- Vendors API: [`vendors-safe-api.md`](vendors-safe-api.md)
- 실행/CI: [`../AGENTS.md`](../AGENTS.md)
- Copilot 지침:
  [`../.github/copilot-instructions.md`](../.github/copilot-instructions.md)
- 테스트 가이드: [`TESTING_GUIDE.md`](TESTING_GUIDE.md) (예정)
- 성능 가이드: [`PERFORMANCE_GUIDE.md`](PERFORMANCE_GUIDE.md) (예정)
- 보안 가이드: [`SECURITY_GUIDE.md`](SECURITY_GUIDE.md) (예정)

본 설계서는 아키텍처의 단일 소스입니다. 구현/리팩토링 시 이 문서와 코딩 가이드를
함께 업데이트하고, 테스트로 경계를 지속 가드하세요.
