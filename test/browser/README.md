# Browser Tests (@vitest/browser)

> Chromium 브라우저 환경에서 실행되는 통합 테스트 스위트

## 개요

**목적**: JSDOM 제약사항을 극복하고 실제 브라우저 기능을 검증하는 테스트

- Solid.js fine-grained reactivity (Signal/Store 변경 → DOM 즉시 반영)
- 브라우저 API (IntersectionObserver, ResizeObserver, Layout)
- 실제 이벤트 처리 (click, keydown, wheel, delegation, preventDefault)
- 포커스 관리, 애니메이션/트랜지션, 스크롤 체이닝

## 실행 방법

````pwsh
```bash
# 전체 테스트
npm run test:browser

# 특정 파일만
npx vitest --project browser run test/browser/solid-reactivity.test.ts

# 디버깅 UI
npm run test:browser:ui
````

## 테스트 스위트

| 파일                                              | 테스트 수 | 목적                                          |
| ------------------------------------------------- | --------- | --------------------------------------------- |
| **solid-reactivity.test.ts**                      | 3         | Solid.js Signal 반응성                        |
| **store-reactivity.test.ts**                      | 5         | Solid.js Store 반응성 및 배치                 |
| **solid-reactivity-advanced.test.tsx**            | 8         | 고급 반응성 패턴 (JSX)                        |
| **event-handling.test.ts**                        | 8         | PC 이벤트 (click, keydown, wheel, delegation) |
| **focus-management.test.ts**                      | 8         | 포커스 관리, 트래핑, 포커스 복원              |
| **layout-calculation.test.ts**                    | 8         | 레이아웃 API (getBoundingClientRect, 크기)    |
| **animation-transitions.test.ts**                 | 9         | CSS 애니메이션, 트랜지션, RAF                 |
| **mutation-observer.test.ts**                     | 9         | MutationObserver API                          |
| **resize-observer.test.ts**                       | 7         | ResizeObserver API                            |
| **vertical-gallery-fit-mode.test.ts**             | 3         | 이미지 핏 모드                                |
| **scroll-chaining-propagation.test.ts**           | 11        | 스크롤 체이닝 방지                            |
| **scroll-chaining-concurrent-input.test.ts**      | 16        | 동시 입력 처리                                |
| **scroll-chaining-gallery-resize.test.ts**        | 8         | 리사이즈 중 스크롤                            |
| **scroll-chaining-animation-interaction.test.ts** | 8         | 애니메이션 중 입력 처리                       |

**합계**: 111 tests ✅

## 핵심 기능별 테스트

### Solid.js Reactivity

```typescript
// solid-reactivity.test.ts
- Signal 변경 → DOM 자동 업데이트
- Store 중첩 속성 추적
- 배치 업데이트 (다중 업데이트 1회 렌더링)
- 조건부 렌더링
- Fine-grained 트래킹 (불필요한 업데이트 차단)
```

### Event Handling (PC-Only)

```typescript
// event-handling.test.ts
- Click 이벤트 및 전파
- Keyboard 이벤트 (modifiers: Ctrl/Shift/Alt)
- Event delegation (이벤트 위임)
- preventDefault() / stopPropagation()
- 커스텀 이벤트
- Wheel 이벤트 (스크롤)
- MouseEnter/MouseLeave
```

**주의**: Touch/Pointer 이벤트는 금지됨 (프로젝트 정책)

### Browser APIs

```typescript
// layout-calculation.test.ts
- getBoundingClientRect() (정확한 위치/크기)
- offsetWidth/Height (스크롤 포함)
- Scroll dimensions
- IntersectionObserver (가시성 감지)

// mutation-observer.test.ts
- Attribute 변경 감지
- Child node 추가/제거
- Text content 변경
- Subtree 변경 (재귀)

// resize-observer.test.ts
- Element 크기 변경 감지
- contentBoxSize / borderBoxSize
- display:none, visibility:hidden 처리
```

## JSDOM vs Browser 선택 가이드

| 테스트                    | 환경        | 이유                         |
| ------------------------- | ----------- | ---------------------------- |
| 순수 함수, 유틸리티       | JSDOM       | 빠름, 불필요한 복잡성 없음   |
| 조건부 렌더링             | JSDOM       | DOM 존재 여부만 검증 필요    |
| 이벤트 핸들러 호출 (모킹) | JSDOM       | 함수 호출 검증만 필요        |
| **Signal/Store 반응성**   | **Browser** | JSDOM은 추적 미지원          |
| **레이아웃 계산**         | **Browser** | JSDOM은 0 반환               |
| **포커스 이동**           | **Browser** | JSDOM은 activeElement 미지원 |
| **CSS 애니메이션**        | **Browser** | JSDOM은 트랜지션 없음        |
| **실제 이벤트 전파**      | **Browser** | JSDOM은 불완전               |

## 파일 구조 및 개선 사항

### 현대화 진행 상황

- ✅ solid-reactivity.test.ts: 간결한 JSDoc, afterEach 추가
- ✅ store-reactivity.test.ts: 명확한 코멘트, 나열식 명명
- ✅ event-handling.test.ts: PC-only 정책 명시, 중복 코드 제거
- 🔄 나머지 파일: 자동화 가능한 구조 (큰 파일부터 우선순위)

### 향후 계획

1. **코드 통합**: 공통 헬퍼 함수 추출 (e.g., createTestContainer)
2. **문서**: 반응성 제약사항과 해결책 명시
3. **CI 최적화**: 병렬 실행으로 테스트 시간 단축

## 참고 문서

- **[TESTING_STRATEGY.md](../docs/TESTING_STRATEGY.md)**: 테스트 전략 및 선택
  기준
- **[AGENTS.md](../AGENTS.md)**: E2E 하네스 패턴
- **[CODING_GUIDELINES.md](../docs/CODING_GUIDELINES.md)**: PC-only 이벤트 정책
  내비게이션을 지원하지 않습니다.

### 4. Layout Calculation (`layout-calculation.test.ts`)

CSS 레이아웃 계산 검증:

- ✅ 요소 크기 (offsetWidth/Height, clientWidth/Height)
- ✅ 경계 사각형 (getBoundingClientRect)
- ✅ IntersectionObserver (lazy loading, viewport detection)
- ✅ 스크롤 크기 (scrollWidth/Height, scrollTop/Left)
- ✅ 반응형 레이아웃 (미디어 쿼리 변경)
- ✅ 뷰포트 위치
- ✅ 숨겨진 요소 크기
- ✅ 이미지 종횡비 계산

**왜 브라우저 전용인가**: JSDOM은 모든 레이아웃 속성에 대해 0을 반환합니다 (CSS
엔진 없음).

#### 5. Animation & Transitions (`animation-transitions.test.ts`)

CSS 애니메이션 및 트랜지션 검증:

- ✅ CSS 트랜지션 (opacity, transform)
- ✅ transitionend 이벤트 발생
- ✅ CSS 애니메이션 (@keyframes)
- ✅ animationend 이벤트 발생
- ✅ requestAnimationFrame 타이밍
- ✅ 트랜스폼 조합 (translate + rotate)
- ✅ 투명도 페이드 애니메이션
- ✅ 여러 동시 애니메이션
- ✅ 애니메이션 취소 (display: none)

**왜 브라우저 전용인가**: JSDOM은 애니메이션/트랜지션 이벤트를 발생시키지 않고
requestAnimationFrame을 지원하지 않습니다.

## ✍️ 테스트 작성 가이드

### 기본 패턴

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getSolid } from '@shared/external/vendors';

const { createSignal, createEffect } = getSolid();

describe('Browser Test', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should update DOM when signal changes', async () => {
    const [count, setCount] = createSignal(0);
    const div = document.createElement('div');
    container.appendChild(div);

    createEffect(() => {
      div.textContent = String(count());
    });

    expect(div.textContent).toBe('0');

    setCount(1);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(div.textContent).toBe('1'); // ✅ Browser 모드에서 성공
  });
});
```

### 주의사항

1. **브라우저 환경**: `window`, `document`, 모든 DOM API 사용 가능
2. **비동기 처리**: Effect는 microtask로 실행되므로 `setTimeout(0)` 필요
3. **Clean-up**: `beforeEach`/`afterEach`에서 DOM 정리
4. **타입 오류**: 경로 별칭은 실행 시 해결됨 (컴파일 타임 오류 무시)

## 🔄 JSDOM → Browser 마이그레이션

기존 JSDOM 테스트를 Browser 모드로 마이그레이션할 때:

### 1. 파일 위치 변경

```
test/unit/features/gallery/VerticalGalleryView.fit-mode.test.tsx
→
test/browser/vertical-gallery-fit-mode.test.ts
```

### 2. Setup 파일 변경

- JSDOM: `./test/setup.ts` (폴리필, GM\_\* 모킹)
- Browser: `./test/setup-browser.ts` (최소 설정)

### 3. 모킹 제거

브라우저 환경에서는 실제 API가 제공되므로 모킹 불필요:

```typescript
// ❌ JSDOM: scrollIntoView 모킹 필요
const scrollIntoViewMock = vi.fn();
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: scrollIntoViewMock,
});

// ✅ Browser: 실제 API 사용
element.scrollIntoView({ behavior: 'smooth' });
```

## 📊 성능 고려사항

- **실행 속도**: JSDOM(1-2분) vs Browser(2-5분)
- **리소스**: Chromium 프로세스 메모리 사용
- **CI 영향**: 병렬 실행 시 CPU 부하 증가

**권장 사용 시나리오**:

- ✅ Solid.js 반응성 테스트
- ✅ 브라우저 API 통합 테스트
- ✅ 레이아웃/스크롤 동작 검증
- ❌ 단순 유틸리티 함수 (JSDOM으로 충분)
- ❌ 순수 로직 테스트 (unit 테스트 사용)

## 🔗 관련 문서

- [TESTING_STRATEGY.md](../../docs/TESTING_STRATEGY.md) - 전체 테스트 전략
- [SOLID_REACTIVITY_LESSONS.md](../../docs/SOLID_REACTIVITY_LESSONS.md) -
  Solid.js 반응성 제약
- [AGENTS.md](../../AGENTS.md) - 테스트 실행 가이드

---

**마지막 업데이트**: 2025-10-18
