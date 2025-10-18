# Browser Tests (@vitest/browser)

> Vitest Browser 모드를 사용한 실제 브라우저 환경 테스트

## 📖 개요

이 디렉터리는 **@vitest/browser**를 사용하여 실제 브라우저(Chromium) 환경에서
실행되는 테스트를 포함합니다.

JSDOM의 제약사항(Solid.js 반응성 제한, 레이아웃 계산 불가)을 극복하기 위해
도입되었습니다.

## 🎯 사용 목적

### JSDOM에서 실패하는 케이스

- ✅ **Solid.js fine-grained reactivity**: Signal/Store 변경 → DOM 즉시 업데이트
- ✅ **실제 브라우저 API**: IntersectionObserver, ResizeObserver, PointerEvent
- ✅ **CSS 레이아웃 계산**: `getBoundingClientRect()`, `offsetWidth/Height` 실제
  값
- ✅ **포커스/애니메이션**: 실제 포커스 이동, CSS 트랜지션 검증

### JSDOM로 충분한 케이스

- ⚠️ **순수 함수**: 데이터 변환, 유틸리티 함수 → `test/unit/` 사용
- ⚠️ **조건부 렌더링**: props 변경 → 요소 표시/숨김 → JSDOM으로 충분
- ⚠️ **이벤트 핸들러 호출**: `vi.fn()` 모킹 검증 → JSDOM으로 충분

## 🚀 실행 방법

```pwsh
# Browser 모드 테스트 실행
npm run test:browser

# UI 모드로 실행 (디버깅)
npm run test:browser:ui

# 특정 파일만 실행
npx vitest --project browser run test/browser/solid-reactivity.test.ts
```

## 📁 파일 구조

```
test/browser/
├── solid-reactivity.test.ts         # Solid.js 반응성 검증
├── store-reactivity.test.ts         # Store 반응성 (5 tests)
├── event-handling.test.ts           # 이벤트 처리 (8 tests)
├── focus-management.test.ts         # 포커스 관리 (8 tests)
├── layout-calculation.test.ts       # 레이아웃 계산 (8 tests)
├── animation-transitions.test.ts    # 애니메이션/트랜지션 (9 tests)
├── vertical-gallery-fit-mode.test.ts # 이미지 핏 모드 (JSDOM 마이그레이션)
└── README.md                         # 이 파일
```

### 새로 추가된 테스트 스위트 (Phase 1 완료)

#### 1. Store Reactivity (`store-reactivity.test.ts`)

Solid.js Store의 fine-grained reactivity 시스템 검증:

- ✅ 중첩 속성 추적 (nested property tracking)
- ✅ 배열 변경 및 batching (array mutations and batching)
- ✅ 조건부 렌더링 (conditional rendering with reactive stores)
- ✅ Fine-grained 업데이트 (only affected components re-render)
- ✅ Store batching (multiple updates in one tick)

**왜 브라우저 전용인가**: JSDOM은 Solid.js의 fine-grained reactivity를 Store
변경에 대해 제대로 추적하지 못합니다.

#### 2. Event Handling (`event-handling.test.ts`)

실제 브라우저 이벤트 시스템 검증:

- ✅ 클릭 이벤트 전파 (click event propagation)
- ✅ 수정자 키가 있는 키보드 이벤트 (keyboard events with modifiers:
  Ctrl/Shift/Alt/Meta)
- ✅ 이벤트 위임 패턴 (event delegation patterns)
- ✅ preventDefault() 및 stopPropagation()
- ✅ 커스텀 이벤트 및 디스패치 (custom events and dispatching)
- ✅ 휠 이벤트 (wheel events)
- ✅ 마우스 enter/leave 이벤트

**왜 브라우저 전용인가**: JSDOM의 이벤트 시스템은 불완전합니다 (적절한 버블링,
위임, 수정자 키 처리 없음).

#### 3. Focus Management (`focus-management.test.ts`)

실제 브라우저에서 포커스 관리 검증:

- ✅ 프로그래밍 방식 포커스 호출 (programmatic focus calls)
- ✅ Tab 키 내비게이션
- ✅ 모달 포커스 트랩 (modal focus trap)
- ✅ Signal을 사용한 반응형 포커스 추적 (reactive focus tracking)
- ✅ 모달 닫힌 후 포커스 복원 (focus restoration after modal close)
- ✅ 포커스 표시기 위치 계산 (focus indicator position calculation)
- ✅ 포커스 가능 vs 불가능 요소 (focusable vs non-focusable elements)
- ✅ 비활성화된 요소 처리 (disabled element handling)

**왜 브라우저 전용인가**: JSDOM은 `document.activeElement` 추적이나 실제 Tab
내비게이션을 지원하지 않습니다.

#### 4. Layout Calculation (`layout-calculation.test.ts`)

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
