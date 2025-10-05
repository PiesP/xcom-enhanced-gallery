# 성능 가이드

> 번들 최적화, 메모리 관리, 프로파일링 전략

**관련 문서**: [아키텍처](ARCHITECTURE.md) | [코딩 규칙](CODING_GUIDELINES.md) |
[테스트 가이드](TESTING_GUIDE.md)

---

## 📋 개요

이 프로젝트는 Userscript로 실행되므로 번들 크기와 런타임 성능이 사용자 경험에
직접적인 영향을 미칩니다.

### 성능 목표

| 지표                     | 목표    | 현재           | 상태 |
| ------------------------ | ------- | -------------- | ---- |
| Raw 번들 크기            | ≤473 KB | 471.67 KB      | ✅   |
| Gzip 번들 크기           | ≤118 KB | 117.12 KB      | ✅   |
| 초기 로딩 시간           | ≤500ms  | ~300ms (추정)  | ✅   |
| DOM 최대 깊이            | ≤6 단계 | 6 단계         | ✅   |
| 메모리 누수              | 0건     | 0건            | ✅   |
| Paint Flicker            | 0회     | 0회 (테스트됨) | ✅   |
| FID (입력 지연)          | ≤100ms  | ~50ms (추정)   | ✅   |
| LCP (최대 콘텐츠 렌더링) | ≤2.5s   | ~1.5s (추정)   | ✅   |

---

## 📦 번들 최적화

### 1. Tree-Shaking 준수

**package.json 설정**:

```json
{
  "sideEffects": ["**/*.css"]
}
```

**가이드라인**:

- Dead code (미사용 export) 정기적 제거
- Re-export 체인 ≤3 depth 유지
- Pure 함수 명시적 마킹

**예제**:

```typescript
// ✅ Good: Tree-shakeable
export function pureUtility(x: number): number {
  return x * 2;
}

// ❌ Bad: Side-effect 있는 export
export const config = initializeConfig(); // 항상 실행됨
```

### 2. Code Deduplication (DRY)

**원칙**: 동일 로직 2회 이상 등장 시 공통 유틸로 추출

**예제**:

```typescript
// ❌ Before: 중복 코드
// file1.ts
function validate(url: string): boolean {
  return url.startsWith('https://');
}

// file2.ts
function validate(url: string): boolean {
  return url.startsWith('https://');
}

// ✅ After: 공통 유틸
// shared/utils/url-utils.ts
export function isHttpsUrl(url: string): boolean {
  return url.startsWith('https://');
}
```

**검증**:

```pwsh
npm run deps:all  # 중복 패턴 감지
```

### 3. Pure Annotations

**목적**: Terser가 안전하게 제거할 수 있도록 표시

```typescript
// 수동 Pure 주석
const result = /*#__PURE__*/ expensiveOperation();

// 빌드 설정 (vite.config.ts)
terserOptions: {
  compress: {
    pure_funcs: [
      'console.log',
      'console.debug',
      'logger.debug',
      'logger.trace',
    ],
  },
}
```

### 4. Dynamic Imports (조건부 로딩)

**Userscript 제약**: Code Splitting 불가, 단일 번들만 가능

**대안**: 조건부 초기화 + 동적 import

```typescript
// src/features/advanced-feature/lazy-loader.ts
let featureModule: typeof import('./advanced-feature') | null = null;

export async function loadFeature(): Promise<void> {
  if (featureModule) return;

  // 번들에 포함되지만 초기화 지연
  featureModule = await import('./advanced-feature');
  featureModule.initialize();
}

// 사용: 사용자가 특정 버튼 클릭 시에만 로드
button.addEventListener('click', async () => {
  await loadFeature();
  const feature = getFeature();
  feature.doSomething();
});
```

### 5. 번들 크기 회귀 방지

**자동 검증**: `test/architecture/bundle-size-optimization.contract.test.ts`

```typescript
describe('Bundle Size Regression Guard', () => {
  it('should not exceed raw bundle limit', async () => {
    const stats = await getBundleStats();
    expect(stats.raw).toBeLessThanOrEqual(473 * 1024); // 473 KB
  });

  it('should not exceed gzip bundle limit', async () => {
    const stats = await getBundleStats();
    expect(stats.gzip).toBeLessThanOrEqual(118 * 1024); // 118 KB
  });
});
```

**빌드 시 검증**:

```pwsh
npm run build  # scripts/validate-build.js 자동 실행
```

---

## 🧠 메모리 관리

### 1. Cleanup 패턴

**원칙**: 모든 리스너/타이머는 `onCleanup`에서 해제

```typescript
import { getSolidCore } from '@shared/external/vendors';

const solid = getSolidCore();

solid.createEffect(() => {
  const handler = (e: Event) => console.log(e);
  document.addEventListener('click', handler);

  // ✅ 정리 함수 필수
  solid.onCleanup(() => {
    document.removeEventListener('click', handler);
  });
});
```

### 2. 메모리 누수 감지 테스트

```typescript
// test/integration/memory-leak-guard.test.tsx
describe('Memory Leak Guard', () => {
  it('should cleanup all listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const dispose = render(() => <MyComponent />);
    dispose(); // 언마운트

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function)
    );
  });

  it('should not leak memory after 100 mounts/unmounts', () => {
    const initialMemory = performance.memory?.usedJSHeapSize ?? 0;

    for (let i = 0; i < 100; i++) {
      const dispose = render(() => <GalleryApp items={mockItems} />);
      dispose();
    }

    const finalMemory = performance.memory?.usedJSHeapSize ?? 0;
    const delta = finalMemory - initialMemory;

    // 메모리 증가 ≤10% 허용
    expect(delta).toBeLessThan(initialMemory * 0.1);
  });
});
```

### 3. ObjectURL 관리

```typescript
import { ObjectURLManager } from '@shared/utils/memory/object-url-manager';

const manager = new ObjectURLManager();

// 생성
const url = manager.create(blob);

// 자동 정리 (타이머 기반)
manager.startCleanup(); // 주기적으로 미사용 URL 정리

// 수동 정리
manager.revoke(url);
manager.revokeAll();
```

---

## ⚡ 런타임 최적화

### 1. Memoization

**SolidJS createMemo**:

```typescript
import { getSolidCore } from '@shared/external/vendors';

const solid = getSolidCore();
const [items, setItems] = solid.createSignal<Item[]>([]);

// ✅ 비용 큰 연산은 memo화
const expensiveComputation = solid.createMemo(() => {
  return items()
    .map(item => heavyTransformation(item))
    .filter(item => complexCondition(item))
    .sort((a, b) => expensiveSorting(a, b));
});

// 사용 (캐싱된 결과 반환)
const result = expensiveComputation();
```

**커스텀 Memoization**:

```typescript
// src/shared/utils/performance/memoization.ts
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// 사용
const expensiveFn = memoize((x: number) => {
  // 비용 큰 계산
  return x ** 100;
});
```

### 2. Debounce & Throttle

**Debounce** (마지막 호출만 실행):

```typescript
import { debounce } from '@shared/utils/performance/schedulers';

const handleResize = debounce(() => {
  console.log('Resize handled');
}, 300);

window.addEventListener('resize', handleResize);
```

**Throttle** (일정 간격으로 실행):

```typescript
import { throttle } from '@shared/utils/performance/schedulers';

const handleScroll = throttle(() => {
  console.log('Scroll handled');
}, 100);

window.addEventListener('scroll', handleScroll);
```

### 3. Idle Scheduling

```typescript
import { scheduleIdleCallback } from '@shared/utils/performance/idleScheduler';

// 비긴급 작업을 idle 시간에 실행
scheduleIdleCallback(() => {
  performNonCriticalWork();
});
```

### 4. Progressive Loading (프리로드)

```typescript
import { computePreloadIndices } from '@shared/utils/performance/preload';

// 거리 우선 프리로드
const indicesToPreload = computePreloadIndices({
  currentIndex: 5,
  totalCount: 20,
  preloadCount: 3,
  direction: 'forward',
});

// [5, 6, 7] → 현재 + 다음 2개
```

---

## 📊 프로파일링

### 1. 번들 분석

```pwsh
npm run build:prod
# dist/ 폴더에서 .map 파일 분석
```

**도구**:

- [source-map-explorer](https://www.npmjs.com/package/source-map-explorer)
- Chrome DevTools → Performance → Load `.map`

### 2. Runtime Performance

**Chrome DevTools**:

1. Performance 탭 열기
2. 녹화 시작
3. 갤러리 활성화/네비게이션 수행
4. 녹화 중지
5. Flame Chart 분석

**체크 포인트**:

- FP (First Paint): ≤200ms
- FCP (First Contentful Paint): ≤500ms
- TTI (Time to Interactive): ≤2s
- Long Tasks: 0건 (≥50ms)

### 3. 메모리 프로파일링

**Chrome DevTools**:

1. Memory 탭 열기
2. Heap Snapshot 촬영
3. 갤러리 열기/닫기 반복
4. Snapshot 비교
5. Detached DOM 확인

---

## 🎯 성능 베스트 프랙티스

### DOM 조작

```typescript
// ❌ Bad: 반복적 DOM 조작
for (const item of items) {
  container.appendChild(createItemElement(item));
}

// ✅ Good: 배치 DOM 조작
const fragment = document.createDocumentFragment();
for (const item of items) {
  fragment.appendChild(createItemElement(item));
}
container.appendChild(fragment);
```

### CSS 최적화

```css
/* ✅ Good: GPU 가속 */
.animated {
  transform: translateX(10px); /* GPU 가속 */
  will-change: transform; /* 최적화 힌트 */
}

/* ❌ Bad: Reflow 유발 */
.animated {
  left: 10px; /* Reflow */
  width: 50%; /* Reflow */
}
```

### Image Optimization

```typescript
// Progressive Image Loading
export function useProgressiveImage(src: string) {
  const [currentSrc, setCurrentSrc] = solid.createSignal<string | null>(null);
  const [isLoading, setIsLoading] = solid.createSignal(true);

  solid.createEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };
    img.src = src;
  });

  return { currentSrc, isLoading };
}
```

---

## 📏 성능 회귀 방지

### CI 통합

```yaml
# .github/workflows/ci.yml
- name: Build and Validate
  run: |
    npm run build
    # scripts/validate-build.js가 자동 실행
```

### 로컬 검증

```pwsh
npm run build
npm run test:coverage
npm run deps:all
```

---

## 📚 참고 문서

- 아키텍처 (번들 최적화):
  [`ARCHITECTURE.md`](ARCHITECTURE.md#번들-최적화-epic-bundle-size-optimization)
- 테스트 가이드: [`TESTING_GUIDE.md`](TESTING_GUIDE.md)
- 빌드 검증 스크립트: `scripts/validate-build.js`
- 번들 메트릭: `metrics/bundle-metrics.json`

---

본 가이드는 성능 최적화 전략의 단일 소스입니다. 새로운 최적화 기법이 발견되면 이
문서를 업데이트하고, 테스트로 회귀를 방지하세요.
