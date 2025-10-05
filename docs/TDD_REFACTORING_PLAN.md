# TDD 리팩토링 활성 계획

> 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링 Epic 관리 문서

**최근 업데이트**: 2025-10-06 **현재 상태**: 모든 활성 Epic 완료 ✅

완료된 내용은
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서
확인하실 수 있습니다.

---

## 1. 운영 원칙

**참조 문서**:

- 코딩/스타일/입력/벤더 접근/테스트:
  [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md),
  [`vendors-safe-api.md`](vendors-safe-api.md)
- 실행/CI/빌드: [`../AGENTS.md`](../AGENTS.md)
- 아키텍처: [`ARCHITECTURE.md`](ARCHITECTURE.md)

**Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로 분할하여 단계적
진행

---

## 2. 프로젝트 현황

### 테스트 상태

- **전체 테스트**: 2873 passed | 110 skipped | 1 todo (2984)
- **상태**: ✅ GREEN

### 번들 크기

- **Raw**: 495.19 KB (목표: ≤473 KB, **22 KB 초과** ⚠️)
- **Gzip**: 123.73 KB (목표: ≤118 KB, **5.73 KB 초과** ⚠️)
- **이상적 목표**: Raw 420 KB, Gzip 105 KB

### 완료된 최적화 (2025-10-05)

- ✅ Tree-shaking 개선 (`package.json` sideEffects, Rollup treeshake 옵션)
- ✅ 중복 코드 제거 (`core-utils.ts` 중복 → `utils.ts` 통합)
- ✅ Terser 압축 강화 (pure_funcs, unsafe opts, mangleProps)
- ✅ 15개 계약 테스트 GREEN (회귀 방지)

---

## 3. 활성 Epic 현황

### 현재 활성 Epic 없음 ✅

모든 활성 Epic이 완료되었습니다. 다음 Epic을 선정하려면 아래 "향후 Epic 후보"를
참조하세요.

**최근 완료된 Epic** (2025-10-06):

- ✅ **GALLERY-UX-REFINEMENT**: 갤러리 UX 정교화 (4개 Sub-Epic 완료, 6 commits)
  - 세부 내용:
    [`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

---

## 4. 향후 Epic 후보

**목표**: 갤러리 사용자 경험 정교화 (4가지 개선)

**선정 이유**:

- **높은 가치**: 모든 사용자에게 즉각적인 UX 개선 제공
- **명확한 범위**: 4개의 독립적 Sub-Epic으로 분할 가능
- **낮은 리스크**: 기존 패턴 재사용, 기능 변경 없이 UX 개선만
- **측정 가능**: 각 Sub-Epic마다 구체적인 성공 지표 보유

**Sub-Epic 구성**:

1. **SCROLL-POSITION-REFINEMENT**: DOM 앵커 기반 스크롤 복원 정교화
2. **CONTAINER-SIZE-ADAPTIVE**: 뷰포트 반응형 컨테이너 크기 최적화
3. **TOOLBAR-HOVER-EXPANSION**: 툴바 호버 영역 확장 및 UX 개선
4. **NATIVE-API-INTEGRATION**: 트위터 네이티브 API 통합 (가능한 경우)

**예상 효과**:

- 스크롤 복원 정확도 향상 (±50px → ±10px)
- 미디어 표시 영역 확대 (5-10% 증가)
- 툴바 접근성 개선 (호버 영역 3배 확장)
- 미디어 추출 안정성 향상 (API 우선 전략)

**난이도**: M (중간) **예상 기간**: 2-3일

---

### Sub-Epic 1: SCROLL-POSITION-REFINEMENT

**목표**: 갤러리 닫을 때 타임라인 스크롤 위치를 더 정교하게 복원

**현재 상태 분석**:

✅ **완료된 구현**:

- `ScrollAnchorManager`: DOM 앵커 기반 스크롤 위치 저장/복원
  (`scroll-anchor-manager.ts`)
- Body Scroll Manager: 우선순위 기반 스크롤 잠금 (`body-scroll-manager.ts`)
- 테스트: 18개 테스트 GREEN (scroll-position-restoration.test.ts)
- 통합: `SolidGalleryShell.solid.tsx`에서 `restoreToAnchor()` 호출

**현재 문제점**:

1. **상단 여백 고정**: `TOP_MARGIN = 100px` 하드코딩
   - 다양한 화면 크기/뷰포트에 최적화되지 않음
   - 모바일/태블릿에서 과도한 여백
2. **동적 콘텐츠 대응 제한**: `offsetTop`만 사용, 레이아웃 변화 추적 부족
3. **Fallback 단순함**: 픽셀 기반 fallback만 지원, 앵커 재탐색 없음

**솔루션 옵션**:

#### 옵션 A: 뷰포트 반응형 여백 (권장 ⭐)

**구현**:

```typescript
// scroll-anchor-manager.ts 개선
private calculateTopMargin(): number {
  if (typeof window === 'undefined') return 100;

  const viewportHeight = window.innerHeight;

  // 뷰포트 높이 기반 여백 계산
  if (viewportHeight < 600) return 60;  // 모바일
  if (viewportHeight < 900) return 80;  // 태블릿
  return 100;  // 데스크톱
}

restoreToAnchor(): void {
  // ...
  const topMargin = this.calculateTopMargin();
  const targetScrollTop = Math.max(0, currentOffsetTop - topMargin);
  // ...
}
```

**테스트**:

```typescript
describe('뷰포트 반응형 여백', () => {
  it('모바일 화면에서 60px 여백 사용', () => {
    Object.defineProperty(window, 'innerHeight', { value: 500 });
    scrollAnchorManager.restoreToAnchor();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 440 }); // 500 - 60
  });

  it('데스크톱 화면에서 100px 여백 사용', () => {
    Object.defineProperty(window, 'innerHeight', { value: 1080 });
    scrollAnchorManager.restoreToAnchor();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 400 }); // 500 - 100
  });
});
```

**장점**:

- ✅ 간단한 구현 (기존 로직에 조건 추가)
- ✅ 즉시 효과 확인 가능
- ✅ 번들 크기 영향 최소 (+0.1 KB)

**단점**:

- ⚠️ 수동 임계값 설정 필요

**난이도**: S (1-2시간)

#### 옵션 B: ResizeObserver 기반 동적 추적

**구현**:

```typescript
class ScrollAnchorManager {
  private resizeObserver: ResizeObserver | null = null;

  setAnchor(element: HTMLElement | null): void {
    // ...
    if (element && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.anchor) {
          this.anchor.offsetTop = this.anchor.element.offsetTop;
        }
      });
      this.resizeObserver.observe(element);
    }
  }

  clear(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    // ...
  }
}
```

**장점**:

- ✅ 동적 콘텐츠 변화 자동 추적
- ✅ 정확도 최대화

**단점**:

- ⚠️ 복잡도 증가
- ⚠️ 번들 크기 영향 (+0.5 KB)
- ⚠️ 브라우저 호환성 체크 필요

**난이도**: M (3-4시간)

**선택한 솔루션**: **옵션 A** (뷰포트 반응형 여백)

**사유**:

- 간단하고 효과적
- 즉시 적용 가능
- 번들 크기 영향 최소
- 옵션 B는 향후 필요시 추가 검토

---

### Sub-Epic 2: CONTAINER-SIZE-ADAPTIVE

**목표**: 갤러리 컨테이너 사이즈를 동적으로 최적화하여 미디어 표시 영역 최대화

**현재 상태 분석**:

✅ **완료된 구현**:

- `viewport-calculator.ts`: 뷰포트 계산 유틸리티
- `updateViewportForToolbar()`: 툴바 가시성 기반 뷰포트 업데이트
- CSS 변수: `--xeg-media-max-height`, `--xeg-viewport-height-constrained`
- 테스트: 9개 테스트 GREEN (container-size-optimization.test.ts)

**현재 구현**:

```typescript
// viewport-calculator.ts
export function calculateViewportDimensions(
  toolbarVisible: boolean = true
): ViewportDimensions {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const toolbarHeight = toolbarVisible ? getToolbarHeightFromCSS() : 0;

  let availableHeight = height - toolbarHeight;
  availableHeight = Math.max(availableHeight, MIN_MEDIA_HEIGHT);

  return { width, height, availableHeight, toolbarHeight };
}
```

**현재 문제점**:

1. **고정된 최소 높이**: `MIN_MEDIA_HEIGHT = 400px` 하드코딩
   - 다양한 화면 크기에 최적화되지 않음
2. **툴바 높이만 고려**: 하단 패딩, 스크롤바 등 추가 요소 미고려
3. **Container Queries 미활용**: 반응형 디자인 활용도 낮음

**솔루션 옵션**:

#### 옵션 A: 뷰포트 비율 기반 계산 (권장 ⭐)

**구현**:

```typescript
// viewport-calculator.ts 개선
export function calculateAdaptiveMinHeight(viewportHeight: number): number {
  // 뷰포트 높이의 60% 최소 확보
  const ratio = 0.6;
  const calculated = Math.floor(viewportHeight * ratio);

  // 절대 최소값: 300px
  const ABSOLUTE_MIN = 300;

  return Math.max(calculated, ABSOLUTE_MIN);
}

export function calculateViewportDimensions(
  toolbarVisible: boolean = true
): ViewportDimensions {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const toolbarHeight = toolbarVisible ? getToolbarHeightFromCSS() : 0;

  // 하단 패딩/스크롤바 여유 공간
  const BOTTOM_PADDING = 16;

  let availableHeight = height - toolbarHeight - BOTTOM_PADDING;

  // 동적 최소 높이 적용
  const minHeight = calculateAdaptiveMinHeight(height);
  availableHeight = Math.max(availableHeight, minHeight);

  return { width, height, availableHeight, toolbarHeight };
}
```

**테스트**:

```typescript
describe('적응형 컨테이너 크기', () => {
  it('1080p 화면에서 648px 최소 높이 적용', () => {
    Object.defineProperty(window, 'innerHeight', { value: 1080 });
    const dimensions = calculateViewportDimensions(true);
    expect(dimensions.availableHeight).toBeGreaterThanOrEqual(648); // 1080 * 0.6
  });

  it('600px 화면에서 360px 최소 높이 적용', () => {
    Object.defineProperty(window, 'innerHeight', { value: 600 });
    const dimensions = calculateViewportDimensions(true);
    expect(dimensions.availableHeight).toBeGreaterThanOrEqual(360); // 600 * 0.6
  });

  it('300px 이하로 떨어지지 않음', () => {
    Object.defineProperty(window, 'innerHeight', { value: 400 });
    const dimensions = calculateViewportDimensions(true);
    expect(dimensions.availableHeight).toBeGreaterThanOrEqual(300);
  });
});
```

**장점**:

- ✅ 뷰포트 크기에 자동 적응
- ✅ 미디어 표시 영역 5-10% 증가
- ✅ 구현 간단

**단점**:

- ⚠️ 비율 값 튜닝 필요

**난이도**: S (1-2시간)

#### 옵션 B: Container Queries 활용

**구현**:

```css
/* VerticalImageItem.module.css */
@container media-container (height > 800px) {
  .imageWrapper {
    max-height: calc(100vh - var(--xeg-toolbar-height) - 32px);
  }
}

@container media-container (height > 600px and height <= 800px) {
  .imageWrapper {
    max-height: calc(100vh - var(--xeg-toolbar-height) - 24px);
  }
}

@container media-container (height <= 600px) {
  .imageWrapper {
    max-height: calc(100vh - var(--xeg-toolbar-height) - 16px);
  }
}
```

**장점**:

- ✅ CSS 기반, 성능 우수
- ✅ JavaScript 계산 불필요

**단점**:

- ⚠️ 브라우저 지원 제한 (Chrome 105+, Firefox 110+)
- ⚠️ 폴백 로직 필요

**난이도**: M (2-3시간)

**선택한 솔루션**: **옵션 A** (뷰포트 비율 기반 계산)

**사유**:

- 간단하고 즉시 효과 확인 가능
- 브라우저 호환성 100%
- 옵션 B는 향후 추가 최적화로 검토

---

### Sub-Epic 3: TOOLBAR-HOVER-EXPANSION

**목표**: 화면 상단 일정 영역에서 툴바를 쉽게 표시할 수 있도록 호버 영역 확장

**현재 상태 분석**:

✅ **완료된 구현**:

- `useToolbarPositionBased`: 툴바 가시성 관리 훅 (`useToolbarPositionBased.ts`)
- Hover Zone: `.toolbarHoverZone` CSS 클래스 (`VerticalGalleryView.module.css`)
- 자동 숨김: 5초 후 자동 숨김 (`initialAutoHideDelay`)
- 테스트: 11개 테스트 GREEN (useToolbarPositionBased.test.ts)

**현재 구현**:

```css
/* VerticalGalleryView.module.css */
.toolbarHoverZone {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--xeg-hover-zone-height); /* 120px */
  z-index: calc(var(--xeg-toolbar-z-index) - 1);
  pointer-events: auto;
}
```

**현재 문제점**:

1. **고정된 호버 영역**: `120px` 하드코딩
   - 다양한 화면 크기에 최적화되지 않음
2. **시각적 피드백 부족**: 호버 영역 존재 여부 불명확
3. **접근성 제한**: 키보드 네비게이션으로 툴바 표시 불가

**솔루션 옵션**:

#### 옵션 A: 뷰포트 비율 기반 호버 영역 (권장 ⭐)

**구현**:

```typescript
// viewport-calculator.ts에 추가
export function calculateHoverZoneHeight(viewportHeight: number): number {
  // 뷰포트 높이의 15% (최소 80px, 최대 200px)
  const ratio = 0.15;
  const calculated = Math.floor(viewportHeight * ratio);

  return Math.max(80, Math.min(calculated, 200));
}

// VerticalGalleryView.tsx에서 CSS 변수 설정
createEffect(() => {
  const hoverHeight = calculateHoverZoneHeight(window.innerHeight);
  document.documentElement.style.setProperty(
    '--xeg-hover-zone-height',
    `${hoverHeight}px`
  );
});
```

**CSS**:

```css
/* VerticalGalleryView.module.css */
.toolbarHoverZone {
  height: var(--xeg-hover-zone-height);
  /* 시각적 힌트 추가 */
  background: linear-gradient(
    to bottom,
    rgba(var(--xeg-color-primary-rgb), 0.05) 0%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity var(--xeg-duration-fast) var(--xeg-easing-ease-out);
}

.toolbarHoverZone:hover {
  opacity: 1;
}
```

**테스트**:

```typescript
describe('확장된 호버 영역', () => {
  it('1080p 화면에서 162px 호버 영역 적용', () => {
    Object.defineProperty(window, 'innerHeight', { value: 1080 });
    const height = calculateHoverZoneHeight(1080);
    expect(height).toBe(162); // 1080 * 0.15
  });

  it('600px 화면에서 90px 호버 영역 적용', () => {
    const height = calculateHoverZoneHeight(600);
    expect(height).toBe(90);
  });

  it('최소 80px, 최대 200px 보장', () => {
    expect(calculateHoverZoneHeight(400)).toBe(80);
    expect(calculateHoverZoneHeight(2000)).toBe(200);
  });
});
```

**장점**:

- ✅ 화면 크기에 자동 적응
- ✅ 접근성 3배 향상 (120px → 162px)
- ✅ 시각적 피드백 제공

**단점**:

- ⚠️ CSS 변수 동적 설정 필요

**난이도**: S (1-2시간)

#### 옵션 B: 키보드 네비게이션 추가

**구현**:

```typescript
// useToolbarPositionBased.ts에 추가
createEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && enabled) {
      if (resolvedVisibility()) {
        hide();
      } else {
        show();
      }
    }
  };

  if (enabled) {
    document.addEventListener('keydown', handleKeyDown);
  }

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });
});
```

**장점**:

- ✅ 접근성 향상 (키보드만으로 제어 가능)
- ✅ PC 전용 입력 정책 준수

**단점**:

- ⚠️ Escape 키 충돌 가능 (갤러리 닫기와 구분 필요)

**난이도**: S (1시간)

**선택한 솔루션**: **옵션 A + 옵션 B 병행**

**사유**:

- 옵션 A: 즉시 효과 확인, 구현 간단
- 옵션 B: 접근성 향상, 추가 구현 간단
- 두 옵션 모두 낮은 난이도, 상호 보완적

---

### Sub-Epic 4: NATIVE-API-INTEGRATION

**목표**: 가능한 경우 트위터 네이티브 API를 직접 통합하여 미디어 추출 안정성
향상

**현재 상태 분석**:

✅ **완료된 구현**:

- `TwitterAPI`: 트위터 API 클라이언트 (`TwitterVideoExtractor.ts`)
- `TwitterAPIExtractor`: API 기반 미디어 추출기 (`TwitterAPIExtractor.ts`)
- API 우선 전략: API 추출 → DOM fallback
- 테스트: API 추출 로직 커버리지 (TwitterAPIExtractor 테스트)

**현재 구현 분석**:

```typescript
// TwitterAPI.getTweetMedias()
public static async getTweetMedias(tweetId: string): Promise<TweetMediaEntry[]> {
  const url = this.createTweetJsonEndpointUrlByRestId(tweetId);
  const json = await this.apiRequest(url);

  if (!json.data?.tweetResult?.result) {
    return [];
  }

  let tweetResult = json.data.tweetResult.result;
  if (tweetResult.tweet) {
    tweetResult = tweetResult.tweet;
  }

  const tweetUser = tweetResult.core?.user_results?.result;

  // legacy 구조와 현대적 구조 통합
  if (tweetResult.legacy) {
    tweetResult.extended_entities = tweetResult.legacy.extended_entities;
    tweetResult.full_text = tweetResult.legacy.full_text;
    tweetResult.id_str = tweetResult.legacy.id_str;
  }

  return this.extractMediaFromTweet(tweetResult, tweetUser);
}
```

**현재 문제점 및 개선 기회**:

1. **에러 처리 미흡**: API 실패 시 로깅만, 재시도 로직 없음
2. **타임아웃 하드코딩**: `10_000ms` 고정, 네트워크 상황에 따라 조정 불가
3. **캐싱 부재**: 동일 트윗 반복 요청 시 중복 API 호출
4. **Rate Limiting 미대응**: API 요청 제한 시 처리 로직 없음

**솔루션 옵션**:

#### 옵션 A: 간단한 캐싱 추가 (권장 ⭐)

**구현**:

```typescript
// TwitterAPI 클래스에 추가
class TwitterAPI {
  private static cache = new Map<
    string,
    { data: TweetMediaEntry[]; timestamp: number }
  >();
  private static CACHE_TTL = 5 * 60 * 1000; // 5분

  public static async getTweetMedias(
    tweetId: string
  ): Promise<TweetMediaEntry[]> {
    // 캐시 확인
    const cached = this.cache.get(tweetId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      logger.debug(`[TwitterAPI] 캐시 히트: ${tweetId}`);
      return cached.data;
    }

    // API 요청
    const url = this.createTweetJsonEndpointUrlByRestId(tweetId);
    const json = await this.apiRequest(url);

    // ... (기존 로직)

    const result = this.extractMediaFromTweet(tweetResult, tweetUser);

    // 캐시 저장
    this.cache.set(tweetId, { data: result, timestamp: Date.now() });

    return result;
  }

  // 캐시 정리 (주기적으로 호출)
  public static clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}
```

**테스트**:

```typescript
describe('Twitter API 캐싱', () => {
  it('동일 트윗 ID 재요청 시 캐시 사용', async () => {
    const tweetId = '1234567890';
    const mockData = [
      /* ... */
    ];

    // 첫 번째 호출 - API 요청
    const result1 = await TwitterAPI.getTweetMedias(tweetId);
    expect(result1).toEqual(mockData);

    // 두 번째 호출 - 캐시 사용
    const result2 = await TwitterAPI.getTweetMedias(tweetId);
    expect(result2).toEqual(mockData);
    expect(result2).toBe(result1); // 동일한 참조
  });

  it('5분 후 캐시 만료', async () => {
    const tweetId = '1234567890';
    await TwitterAPI.getTweetMedias(tweetId);

    // 5분 경과 시뮬레이션
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    // 캐시 만료 후 새로운 API 요청
    await TwitterAPI.getTweetMedias(tweetId);
    // ... (API 호출 검증)
  });
});
```

**장점**:

- ✅ 중복 API 호출 방지
- ✅ 응답 속도 향상
- ✅ 구현 간단

**단점**:

- ⚠️ 메모리 사용 증가 (Map 크기 제한 필요)

**난이도**: S (1-2시간)

#### 옵션 B: 재시도 로직 개선

**구현**:

```typescript
// TwitterAPIExtractor.ts
private async fetchWithRetry<T>(
  fn: () => Promise<T>,
  { timeoutMs, maxRetries }: { timeoutMs: number; maxRetries: number }
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        ),
      ]);
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // 지수 백오프 (1s, 2s, 4s)
      const delay = Math.pow(2, attempt) * 1000;
      logger.debug(`[APIExtractor] 재시도 ${attempt + 1}/${maxRetries} (${delay}ms 대기)`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}
```

**장점**:

- ✅ 일시적 네트워크 오류 대응
- ✅ 안정성 향상

**단점**:

- ⚠️ 응답 지연 가능 (최대 7초)

**난이도**: S (1시간)

#### 옵션 C: Rate Limiting 대응

**구현**:

```typescript
class TwitterAPI {
  private static requestQueue: Array<() => Promise<void>> = [];
  private static isProcessing = false;
  private static readonly MAX_REQUESTS_PER_SECOND = 5;

  private static async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
      }

      // Rate limiting: 200ms 간격 (초당 5요청)
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.isProcessing = false;
  }

  public static async getTweetMedias(
    tweetId: string
  ): Promise<TweetMediaEntry[]> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.getTweetMediasInternal(tweetId);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      void this.processQueue();
    });
  }
}
```

**장점**:

- ✅ API 제한 초과 방지
- ✅ 안정적 운영

**단점**:

- ⚠️ 복잡도 증가
- ⚠️ 응답 지연 가능

**난이도**: M (2-3시간)

**선택한 솔루션**: **옵션 A + 옵션 B 병행**

**사유**:

- 옵션 A: 즉시 효과 확인, 성능 향상
- 옵션 B: 안정성 향상, 구현 간단
- 옵션 C: 복잡도 대비 효과 낮음, 향후 필요시 추가

---

## 4. 구현 로드맵

### Phase 1: Sub-Epic 1-2 (병렬 진행 가능)

**목표**: 스크롤 복원 + 컨테이너 크기 최적화

**예상 기간**: 0.5일

**Task 1-1**: SCROLL-POSITION-REFINEMENT 구현

- [ ] RED: 뷰포트 반응형 여백 테스트 작성
- [ ] GREEN: `calculateTopMargin()` 구현
- [ ] REFACTOR: 기존 테스트 GREEN 확인

**Task 1-2**: CONTAINER-SIZE-ADAPTIVE 구현

- [ ] RED: 뷰포트 비율 기반 최소 높이 테스트 작성
- [ ] GREEN: `calculateAdaptiveMinHeight()` 구현
- [ ] REFACTOR: CSS 변수 연동 확인

### Phase 2: Sub-Epic 3 (호버 영역 확장)

**목표**: 툴바 접근성 향상

**예상 기간**: 0.5일

**Task 2-1**: 호버 영역 동적 계산

- [ ] RED: 뷰포트 비율 기반 호버 영역 테스트 작성
- [ ] GREEN: `calculateHoverZoneHeight()` 구현
- [ ] REFACTOR: CSS 연동 및 시각적 힌트 추가

**Task 2-2**: 키보드 네비게이션 추가

- [ ] RED: Escape 키 툴바 토글 테스트 작성
- [ ] GREEN: `handleKeyDown` 이벤트 핸들러 구현
- [ ] REFACTOR: 이벤트 정리 로직 확인

### Phase 3: Sub-Epic 4 (API 통합 개선)

**목표**: 미디어 추출 안정성 향상

**예상 기간**: 1일

**Task 3-1**: 캐싱 구현

- [ ] RED: 캐시 히트/미스 테스트 작성
- [ ] GREEN: `TwitterAPI` 캐싱 로직 구현
- [ ] REFACTOR: 메모리 관리 최적화

**Task 3-2**: 재시도 로직 개선

- [ ] RED: 지수 백오프 재시도 테스트 작성
- [ ] GREEN: `fetchWithRetry` 개선
- [ ] REFACTOR: 타임아웃 설정 동적화

### Phase 4: 통합 테스트 및 검증

**목표**: 전체 시나리오 검증

**예상 기간**: 0.5일

**Task 4-1**: 통합 시나리오 테스트

- [ ] 갤러리 열기 → 스크롤 → 갤러리 닫기 → 위치 복원
- [ ] 다양한 뷰포트 크기에서 컨테이너 크기 확인
- [ ] 호버 영역 확장 동작 확인
- [ ] API 캐싱 효과 확인

**Task 4-2**: 품질 게이트

- [ ] 전체 테스트 GREEN (2980 tests)
- [ ] 번들 크기 회귀 없음 (+1 KB 이하)
- [ ] 타입 체크 통과
- [ ] 린트 통과

---

## 5. 성공 지표

### 정량적 지표

1. **스크롤 복원 정확도**:
   - 현재: ±50px
   - 목표: ±10px
   - 측정: 통합 테스트 시나리오
2. **미디어 표시 영역 증가**:
   - 현재: 기준선
   - 목표: 5-10% 증가
   - 측정: CSS 변수 값 비교
3. **툴바 접근성**:
   - 현재: 120px 호버 영역
   - 목표: 162px (1080p 기준)
   - 측정: CSS 변수 값 확인
4. **API 응답 속도**:
   - 현재: 평균 500ms
   - 목표: 캐시 히트 시 <10ms
   - 측정: 로그 분석

### 정성적 지표

1. **사용자 경험**: 갤러리 닫기 후 스크롤 위치 복원 자연스러움
2. **접근성**: 툴바 표시 용이성 향상
3. **안정성**: API 실패 시 fallback 동작 확인

---

## 6. 리스크 및 완화 전략

### 리스크 1: 뷰포트 계산 오버헤드

**가능성**: LOW **영향도**: LOW

**완화 전략**:

- createEffect + throttle 사용
- 계산 결과 캐싱
- 불필요한 재계산 방지

### 리스크 2: 캐싱 메모리 누수

**가능성**: MEDIUM **영향도**: MEDIUM

**완화 전략**:

- Map 크기 제한 (최대 100개 항목)
- TTL 기반 자동 정리
- clearExpiredCache() 주기적 호출

### 리스크 3: 브라우저 호환성

**가능성**: LOW **영향도**: LOW

**완화 전략**:

- 기본 JavaScript/CSS 기능만 사용
- 폴백 로직 항상 제공
- 테스트 환경에서 사전 검증

---

## 7. 참조 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |

---

**다음 단계**: Phase 1 Task 1-1부터 TDD 사이클 시작

## 4. 향후 Epic 후보

### Epic BUNDLE-SIZE-DEEP-OPTIMIZATION (Phase 4-7 실행)

**우선순위**: High (번들 크기 목표 초과) **현재 상태**: 분석 완료, 실행 대기

**Phase 구성**:

1. **Phase 4**: Deep Code Audit (2-3일, -20 KB)
   - 111개 unused exports 제거
   - Re-export 체인 단순화 (≤2 depth)
   - Dead code 제거
2. **Phase 5**: Pure Annotations (1-2일, -10 KB)
   - 50+ pure annotations 추가
   - Terser 최적화 강화
3. **Phase 6**: Advanced Tree-shaking (2-3일, -10 KB)
   - Barrel export 최소화 (≤10 files)
   - Side-effect 세분화
4. **Phase 7**: Orphan 파일 정리 (1-2일, -5 KB)
   - 37개 orphan 분류/제거

**예상 효과**:

- 번들 크기: 495 KB → 450 KB (-45 KB, -9%)
- Gzip: 124 KB → 112 KB (-12 KB, -10%)
- 목표 달성: ✅ ≤473 KB raw, ✅ ≤118 KB gzip

**시작 조건**:

- 전체 테스트 스위트 GREEN 확인
- 번들 크기 baseline 측정 완료
- Phase별 독립 브랜치 전략 수립

---

## 5. TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Document**: Completed 로그에 이관

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build` (산출물 검증 통과)

---

## 6. 참조 문서

- **아키텍처**: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- **코딩 가이드**: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)
- **벤더 API**: [`vendors-safe-api.md`](vendors-safe-api.md)
- **실행/CI**: [`../AGENTS.md`](../AGENTS.md)
- **완료된 Epic**:
  [`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

---

본 문서는 활성 Epic만 관리합니다. 완료된 Epic은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 자동 이관됩니다.
