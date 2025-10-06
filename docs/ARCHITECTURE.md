# xcom-enhanced-gallery 아키텍처 설계서

> 프로젝트 구조, 레이어 책임, 경계, 핵심 유스케이스를 정의

**최근 업데이트**: 2025-10-06 **버전**: 0.2.4 **프로젝트 상태**: 테스트 2931
passed (110 skipped, 1 todo) | 번들 495.86 KB

**관련 문서**: [코딩 가이드](CODING_GUIDELINES.md) |
[Vendors API](vendors-safe-api.md) | [실행/CI](../AGENTS.md) |
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

**마운트**:

- Light DOM 전용: `#xeg-gallery-root` 단일 컨테이너
- Shadow DOM 미사용
- 호스트 DOM 직접 수정 금지

**스타일 주입**:

- 네임스페이스: `xeg-*`, `[data-xeg-*]`
- 글로벌 변수: `window.XEG_CSS_TEXT`
- 자동 주입: `<style id="xeg-styles">` (head)
- 게이팅: `window.XEG_STYLE_HEAD_MODE` (`'auto'` | `'defer'` | `'off'`)
- 구현: `vite.config.ts` (번들) + `GalleryContainer.tsx` (런타임)

**SPA 재마운트**:

- `RebindWatcher` (MutationObserver 기반)
- 컨테이너 분실 감지 → 자동 재생성/재렌더 (≤250ms)
- Feature flag: `vdomRebind`
- 정리: 언마운트 시 observer 자동 해제

**이벤트/수명주기**:

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

```typescript
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

```typescript
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

## 8. 보안 정책

### URL 검증 (XSS/Injection 방지)

**필수 가드 함수**:

- `isTrustedTwitterMediaHostname(url)`: Twitter 미디어 URL 검증
- `isTrustedHostname(url, allowedHosts)`: 커스텀 허용 목록 검증

**보호 메커니즘**:

```typescript
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

### Prototype Pollution 방지

**필수 가드 함수**:

- `sanitizeSettingsTree(obj, context)`: 외부 데이터 정화 (prototype 키 제거)

**보호 메커니즘**:

```typescript
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

---

## 9. 성능/메모리

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

### 번들 최적화 현황

**현재 상태** (2025-10-06, v0.2.4):

- Raw 번들: 495.86 KB (목표: ≤473 KB, **22.86 KB 초과** ⚠️)
- Gzip 번들: 123.95 KB (목표: ≤118 KB, **5.95 KB 초과** ⚠️)
- 이상적 목표: Raw 420 KB, Gzip 105 KB

**완료된 최적화** (Phase 1-6, 2025-10-05 ~ 2025-10-06):

1. Tree-shaking 개선: `package.json` sideEffects, Rollup treeshake 옵션
2. 코드 중복 제거: `core-utils.ts` 통합, theme-utils.ts 제거
3. Terser 압축 강화: pure_funcs, unsafe opts, mangleProps
4. Unused Files 제거: Phase 4A/4B에서 16개 파일 제거

---

## 10. 스크롤 격리 전략

### 3계층 방어 전략

1. **이벤트 수준 방어** (`ensureWheelLock`):
   - passive=false 리스너로 조건부 preventDefault
   - 갤러리 외부 스크롤 이벤트 차단
2. **스마트 판별** (`useGalleryScroll`):
   - 이벤트 출처 정확 판별 (내부/외부 구분)
   - Shadow DOM 대응 (composedPath 활용)
3. **CSS 격리** (`.xeg-*`):
   - `overflow-y: auto` (스크롤 가능 영역)
   - `contain: layout style paint` (레이아웃 격리)

### 통합 컴포넌트

**Body Scroll Manager** (`bodyScrollManager`):

- 갤러리/모달 간 body scroll 충돌 해결
- 우선순위 시스템: Settings Modal (10), Gallery (5), 기타 (0)
- 중복 lock 자동 병합, 마지막 lock 해제 시 원본 복원

**테스트**: `test/unit/utils/scroll/body-scroll-manager.test.ts` (13 tests)

---

## 11. 테스트 전략 (TDD)

- 환경: Vitest + JSDOM (`https://x.com`)
- RED → GREEN → REFACTOR
- 계약/경계/정책 테스트 가드

**예시**:

- Vendors/TDZ: `test/integration/vendor-tdz-resolution.test.ts`
- Userscript: `test/unit/shared/external/userscript-adapter.contract.test.ts`
- 휠/키보드: `test/unit/events/ensureWheelLock.contract.test.ts`
- 보안: `test/security/url-sanitization-hardening.contract.test.ts`

---

## 12. Extension Points (확장 지점)

### 새로운 Feature 추가

**체크리스트**:

1. 컴포넌트 생성 (`src/features/<feature-name>/`)
   - 서비스 접근: `@shared/container/service-accessors` 사용
   - 스타일: CSS Modules + 디자인 토큰만
   - 이벤트: PC 전용
2. 상태 관리 (필요시)
   - SolidJS Native: `getSolidCore().createSignal()`
   - 글로벌 상태: `shared/state/` 디렉터리에 생성
3. 서비스 통합 (필요시)
   - 서비스 생성: `src/shared/services/<service-name>.ts`
   - 컨테이너 등록: `src/shared/container/service-container.ts`
   - 액세서 생성: `src/shared/container/service-accessors.ts`
4. 테스트 작성 (TDD)
   - 계약 테스트: `test/features/<feature-name>/*.test.tsx`
   - RED → GREEN → REFACTOR 순서 준수

### 새로운 Service 추가

**체크리스트**:

1. 서비스 인터페이스 정의
2. 계약 테스트 작성 (RED)
3. 서비스 구현 (GREEN)
   - Vendor getter 사용: `getSolidCore()`, `getSolidStore()`
   - Userscript adapter: `getUserscript()`
4. 컨테이너 등록
5. 액세서 추가

---

## 13. Migration Patterns (패턴 전환)

### 레거시 → SolidJS Native

**Before** (Preact Signals 스타일):

```typescript
import { createGlobalSignal } from '@shared/state/createGlobalSignal';

const countSignal = createGlobalSignal(0);
countSignal.value = 42;
const current = countSignal.value;
```

**After** (SolidJS Native):

```typescript
import { getSolidCore } from '@shared/external/vendors';

const solid = getSolidCore();
const [count, setCount] = solid.createSignal(0);
setCount(42);
const current = count();
```

**체크리스트**:

- [ ] `.value` getter/setter → `signal()` / `setSignal()` 함수 호출
- [ ] `.subscribe()` → `createEffect()` 사용
- [ ] 파생값은 `createMemo()` 사용

---

## 참조 문서

- **코딩 규칙**: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)
- **Vendors API**: [`vendors-safe-api.md`](vendors-safe-api.md)
- **실행/CI**: [`../AGENTS.md`](../AGENTS.md)
- **성능 가이드**: [`PERFORMANCE_GUIDE.md`](PERFORMANCE_GUIDE.md)
- **보안 가이드**: [`SECURITY_GUIDE.md`](SECURITY_GUIDE.md)
- **의존성 그래프**: `docs/dependency-graph.(svg|html)` | 생성:
  `npm run deps:all`

---

본 설계서는 아키텍처의 단일 소스입니다. 구현/리팩토링 시 이 문서와 코딩 가이드를
함께 업데이트하고, 테스트로 경계를 지속 가드하세요.
