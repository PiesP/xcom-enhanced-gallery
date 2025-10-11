# SolidJS Fine-Grained Reactivity 최적화 분석 리포트

> **작성일**: 2025-01-11 **프로젝트**: xcom-enhanced-gallery **목적**: React
> 습관에서 벗어나 SolidJS의 세밀 반응성을 최대한 활용하기 위한 코드 최적화
> 포인트 도출

---

## 📋 Executive Summary

현재 프로젝트는 **SolidJS의 기본 동작은 정상적으로 작동**하고 있으나, React에서
전환 시 남아있는 **불필요한 최적화 패턴**과 **비효율적인 메모이제이션 사용**이
발견되었습니다. SolidJS는 컴포넌트가 한 번만 실행되고 신호 그래프로 직접 DOM을
업데이트하므로, React의 재렌더링 방지 패턴은 오히려 복잡도를 높이고 성능을
저하시킬 수 있습니다.

### 주요 발견 사항

| 카테고리               | 이슈 수 | 우선순위  | 영향도                      |
| ---------------------- | ------- | --------- | --------------------------- |
| 불필요한 메모이제이션  | 8+      | 🔴 High   | 코드 복잡도 ↑, 유지보수성 ↓ |
| Props 직접 접근 미준수 | 5+      | 🟡 Medium | 잠재적 반응성 손실          |
| 과도한 createEffect    | 3+      | 🟡 Medium | 신호 그래프 복잡도 ↑        |
| 중복 셀렉터 유틸       | 2       | 🟠 Low    | 혼란 유발                   |

---

## 🔍 세부 분석

### 1. 불필요한 메모이제이션 (🔴 High Priority)

#### 문제점

SolidJS에서는 컴포넌트가 재실행되지 않으므로, React의 `useMemo`/`useCallback`
같은 재렌더링 방지 패턴이 **불필요**합니다. 오히려 복잡도를 높이고 디버깅을
어렵게 만듭니다.

#### 발견된 사례

##### 📁 `src/shared/components/ui/Toolbar/ToolbarHeadless.tsx` (65-70행)

```tsx
// ❌ 나쁜 예: Props를 그대로 createMemo로 감싸는 불필요한 메모이제이션
const [isDownloading, setDownloading] = createSignal<boolean>(
  !!props.isDownloading
);

createEffect(() => {
  setDownloading(!!props.isDownloading);
});

const currentIndex = createMemo(() => props.currentIndex);
const totalCount = createMemo(() => props.totalCount);
```

**문제:**

- `props.currentIndex`와 `props.totalCount`는 이미 반응형입니다
- `createMemo`로 감싸면 불필요한 중간 계층이 추가됩니다
- `isDownloading`은 signal → createEffect → 다시 signal로 복사되는 비효율적 패턴

**해결책:**

```tsx
// ✅ 좋은 예: Props를 직접 사용
const state: ToolbarState = {
  // ...
  isDownloading: () => !!props.isDownloading,
  currentIndex: () => props.currentIndex,
  totalCount: () => props.totalCount,
  // ...
};
```

##### 📁 `src/shared/components/ui/Toolbar/Toolbar.tsx` (159-160행)

```tsx
// ❌ 나쁜 예: 단순 비교 로직을 createMemo로 감싸기
const canGoNext = createMemo(() => props.currentIndex < props.totalCount - 1);
const canGoPrevious = createMemo(() => props.currentIndex > 0);
```

**문제:**

- 단순 비교 연산(< >)은 SolidJS가 자동으로 최적화합니다
- `createMemo`는 **복잡한 계산**에만 사용해야 합니다

**해결책:**

```tsx
// ✅ 좋은 예: 단순 계산은 직접 표현식으로
const canGoNext = () => props.currentIndex < props.totalCount - 1;
const canGoPrevious = () => props.currentIndex > 0;

// 또는 JSX에서 직접 사용
<button disabled={props.currentIndex >= props.totalCount - 1}>
```

##### 📁 `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx` (120-127행)

```tsx
// ❌ 나쁜 예: 간단한 변환을 createMemo로 감싸기
const memoizedMediaItems = createMemo(() => {
  const items = mediaItems();
  const itemsWithKeys = items.map((item, index) => ({
    ...item,
    _galleryKey: `${item.id || item.url}-${index}`,
    _index: index,
  }));
  return itemsWithKeys;
});
```

**문제:**

- `map` + 객체 스프레드는 충분히 가벼운 연산입니다
- `mediaItems()`가 변경될 때만 재계산되므로 `createMemo` 불필요

**해결책:**

```tsx
// ✅ 좋은 예 1: 직접 파생 함수
const itemsWithKeys = () =>
  mediaItems().map((item, index) => ({
    ...item,
    _galleryKey: `${item.id || item.url}-${index}`,
    _index: index,
  }));

// ✅ 좋은 예 2: 정말 필요하다면 복잡도 기준 적용
// 예: 수천 개 아이템 + 무거운 계산이 있을 때만 createMemo 사용
```

---

### 2. Props Destructuring 및 직접 접근 (🟡 Medium Priority)

#### 문제점

SolidJS에서는 **props를 destructuring하면 반응성을 잃습니다**. 항상 `props.xxx`
형태로 접근해야 합니다.

#### 발견된 사례

##### 📁 `src/shared/hooks/useGalleryToolbarLogic.ts` (62-63행)

```tsx
// ⚠️ 주의: 직접 할당은 반응성을 잃을 수 있음
const canGoPrevious = props.currentIndex > 0;
const canGoNext = props.currentIndex < props.totalCount - 1;
```

**문제:**

- `props.currentIndex`를 직접 읽어서 할당하면 **그 시점의 값만** 고정됩니다
- 이후 `props.currentIndex`가 변경되어도 `canGoPrevious`는 업데이트되지 않습니다

**해결책:**

```tsx
// ✅ 좋은 예: Getter 함수로 반응성 유지
const canGoPrevious = () => props.currentIndex > 0;
const canGoNext = () => props.currentIndex < props.totalCount - 1;

// 사용할 때
if (canGoPrevious()) {
  // ...
}
```

##### 📁 `src/shared/components/LazyIcon.tsx` (23-24행)

```tsx
// ⚠️ 잠재적 문제: props를 즉시 평가
const className = ['lazy-icon-loading', props.className]
  .filter(Boolean)
  .join(' ');
const style = props.size
  ? { width: `${props.size}px`, height: `${props.size}px` }
  : undefined;
```

**문제:**

- `props.className`이나 `props.size`가 동적으로 변경될 경우 반영되지 않습니다
- 컴포넌트가 한 번만 실행되므로 초기값만 고정됩니다

**해결책:**

```tsx
// ✅ 좋은 예: Getter로 변경
const className = () =>
  ['lazy-icon-loading', props.className].filter(Boolean).join(' ');
const style = () =>
  props.size
    ? { width: `${props.size}px`, height: `${props.size}px` }
    : undefined;

// JSX에서
<div class={className()} style={style()} />;
```

---

### 3. 과도한 createEffect 사용 (🟡 Medium Priority)

#### 문제점

`createEffect`는 **사이드 이펙트가 필요한 경우에만** 사용해야 합니다. 단순 상태
동기화는 파생 신호나 `createMemo`를 사용하는 것이 더 효율적입니다.

#### 발견된 사례

##### 📁 `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx` (105-112행)

```tsx
// ⚠️ 불필요한 Effect: 단순 상태 비교
createEffect(() => {
  const visible = mediaItems().length > 0;
  if (visible !== isVisible()) {
    setIsVisible(visible);
    logger.debug('VerticalGalleryView: 가시성 상태 변경', {
      wasVisible: !visible,
      nowVisible: visible,
      mediaCount: mediaItems().length,
    });
  }
});
```

**문제:**

- `mediaItems().length > 0`은 파생 계산입니다
- `createEffect`로 수동 동기화하는 것보다 파생 신호가 더 직관적입니다

**해결책:**

```tsx
// ✅ 좋은 예: 파생 신호로 자동 계산
const isVisible = () => mediaItems().length > 0;

// 로깅이 필요하다면
createEffect(() => {
  const visible = isVisible();
  logger.debug('VerticalGalleryView: 가시성 상태', {
    visible,
    mediaCount: mediaItems().length,
  });
});
```

##### 📁 `src/shared/components/ui/Toolbar/Toolbar.tsx` (176-183행)

```tsx
// ⚠️ 불필요한 Effect: Props를 signal에 복사
createEffect(
  on(
    () => props.isDownloading,
    isDownloading => {
      toolbarActions.setDownloading(!!isDownloading);
    }
  )
);
```

**문제:**

- `props.isDownloading`을 내부 signal로 복사하는 것은 불필요한 동기화
  레이어입니다
- Props를 직접 사용하면 자동으로 반응합니다

**해결책:**

```tsx
// ✅ 좋은 예: Props를 직접 사용 (signal 제거)
const state: ToolbarState = {
  // ...
  isDownloading: () => !!props.isDownloading,
};
```

---

### 4. 중복 Selector 유틸리티 (🟠 Low Priority)

#### 문제점

프로젝트에 **두 개의 유사한 selector 유틸리티**가 존재합니다:

- `src/shared/utils/signalSelector.ts` (주로 사용)
- `src/shared/utils/performance/signalOptimization.ts` (거의 사용 안 됨)

이로 인해:

- 개발자가 어떤 것을 사용해야 할지 혼란
- 유지보수 비용 증가
- 일관성 부족

#### 권장 사항

1. **단일 진실 공급원(Single Source of Truth) 선택**
   - `signalSelector.ts`를 메인으로 유지 (더 많이 사용됨)
   - `signalOptimization.ts`는 deprecated 표시 후 점진적 제거

2. **SolidJS 내장 기능 우선 사용**

   ```tsx
   // ❌ 나쁜 예: 커스텀 selector 래퍼
   const value = useSelector(signal, s => s.value);

   // ✅ 좋은 예: SolidJS 네이티브
   const value = () => signal.value;

   // createMemo는 복잡한 계산에만 사용
   const expensiveValue = createMemo(() => {
     return heavyComputation(signal.value);
   });
   ```

---

## 📊 영향도 분석

### Before (현재)

```
Props → createMemo → createEffect → Signal → createMemo → 사용
         ⬆️           ⬆️              ⬆️         ⬆️
      불필요      불필요        불필요    불필요
```

**결과:**

- 불필요한 계산 레이어로 인한 오버헤드
- 디버깅 시 추적 경로 복잡
- 코드 가독성 저하

### After (최적화 후)

```
Props → 직접 사용
Signal → 직접 사용
복잡한 계산 → createMemo (선택적)
```

**예상 효과:**

- 코드 라인 수 **약 15-20% 감소**
- 신호 그래프 깊이 **평균 2-3 단계 감소**
- 유지보수성 향상
- 번들 크기 소폭 감소

---

## 🎯 액션 플랜

### Phase 1: 빠른 수정 (1-2일) 🔴

**목표:** 명백히 불필요한 메모이제이션 제거

1. **ToolbarHeadless.tsx 수정**
   - Line 65-70: `createMemo` 제거, props 직접 접근으로 변경
   - Line 65: `isDownloading` signal 복사 제거

2. **Toolbar.tsx 수정**
   - Line 159-160: 단순 비교 `createMemo` 제거
   - Line 176-183: Props → Signal 복사 Effect 제거

3. **LazyIcon.tsx 수정**
   - Line 23-24: Getter 함수로 변경

### Phase 2: 구조 개선 (3-5일) 🟡

**목표:** Props 접근 패턴 일관성 확보

1. **useGalleryToolbarLogic.ts 리팩토링**
   - 모든 props 접근을 Getter 함수로 변경
   - 테스트 케이스 추가 (props 변경 시 반응성 확인)

2. **VerticalGalleryView.tsx 최적화**
   - Line 105-112: `isVisible` Effect를 파생 신호로 변경
   - Line 120-127: `memoizedMediaItems` 필요성 재평가

### Phase 3: 통합 및 정리 (2-3일) 🟠

**목표:** 유틸리티 통합 및 문서화

1. **Selector 유틸리티 통합**
   - `signalOptimization.ts`를 deprecated 표시
   - 사용처 마이그레이션 (`grep_search`로 위치 파악)
   - 공식 가이드 작성 (언제 `createMemo`를 사용할지)

2. **가이드라인 업데이트**
   - `docs/CODING_GUIDELINES.md`에 SolidJS Best Practices 섹션 추가
   - ESLint 규칙 추가 고려 (props destructuring 경고)

---

## 📚 SolidJS Best Practices (추가 권장 사항)

### ✅ Do's

1. **Props는 항상 직접 접근**

   ```tsx
   // ✅ 좋음
   <div>{props.name}</div>;

   // ❌ 나쁨
   const { name } = props;
   <div>{name}</div>;
   ```

2. **createMemo는 무거운 계산에만 사용**

   ```tsx
   // ✅ 좋음
   const filtered = createMemo(() =>
     largeArray().filter(complexPredicate).map(expensiveTransform)
   );

   // ❌ 나쁨
   const double = createMemo(() => count() * 2);
   ```

3. **createEffect는 외부 시스템 동기화에만**

   ```tsx
   // ✅ 좋음
   createEffect(() => {
     localStorage.setItem('theme', theme());
   });

   // ❌ 나쁨
   createEffect(() => {
     setDerived(count() * 2); // 이건 파생 신호로 하세요
   });
   ```

### ❌ Don'ts

1. **React 스타일 메모이제이션 사용 금지**

   ```tsx
   // ❌ SolidJS에서는 불필요
   import { memo, useCallback, useMemo } from 'preact/compat';
   ```

2. **불필요한 중간 signal 생성 금지**

   ```tsx
   // ❌ 나쁨
   const [local, setLocal] = createSignal(props.value);
   createEffect(() => setLocal(props.value));

   // ✅ 좋음
   const local = () => props.value;
   ```

3. **의존성 배열 사용 금지**

   ```tsx
   // ❌ React 스타일 (SolidJS에서는 무시됨)
   createMemo(() => compute(a(), b()), [a, b]);

   // ✅ SolidJS 스타일 (자동 추적)
   createMemo(() => compute(a(), b()));
   ```

---

## 🧪 검증 방법

### 1. 성능 측정

```typescript
// Before/After 비교
import { createRoot } from 'solid-js';

const { dispose } = createRoot(() => {
  const start = performance.now();
  // 컴포넌트 마운트
  const end = performance.now();
  console.log('Mount time:', end - start);
});
```

### 2. 반응성 테스트

```typescript
// Props 변경 시 UI 업데이트 확인
it('should update when props change', () => {
  const [count, setCount] = createSignal(0);
  const { container } = render(() => <Component count={count()} />);

  expect(container.textContent).toBe('0');
  setCount(1);
  expect(container.textContent).toBe('1'); // 즉시 업데이트되어야 함
});
```

### 3. 번들 크기

```bash
# 빌드 전후 비교
npm run build:prod
ls -lh dist/xcom-enhanced-gallery.user.js
```

---

## 📖 참고 자료

1. **공식 SolidJS 가이드**
   - [Reactivity Basics](https://www.solidjs.com/tutorial/introduction_basics)
   - [Props vs Signals](https://www.solidjs.com/guides/reactivity)

2. **커뮤니티 논의**
   - [SolidJS vs React: Performance Patterns](https://github.com/solidjs/solid/discussions)
   - [When to use createMemo?](https://discord.com/channels/722131463138705510)

3. **프로젝트 내부 문서**
   - `docs/CODING_GUIDELINES.md` (업데이트 예정)
   - `.github/copilot-instructions.md` (SolidJS 규칙 섹션)

---

## 💡 결론

현재 프로젝트는 **기능적으로 잘 작동**하고 있으나, React에서 전환 시 남아있는
최적화 패턴들이 **불필요한 복잡도**를 유발하고 있습니다. SolidJS의 철학인
**"간결함과 직접성"**을 따라 코드를 단순화하면:

- 🎯 **유지보수성 향상**: 코드 추적이 쉬워짐
- ⚡ **성능 개선**: 불필요한 계산 레이어 제거
- 📚 **학습 곡선 감소**: 신규 개발자가 이해하기 쉬운 구조
- 🐛 **버그 감소**: 반응성 손실 방지

**추천 우선순위**: Phase 1 → Phase 2 → Phase 3 순으로 진행하되, 각 단계마다
테스트를 통해 반응성이 유지되는지 확인하세요.

---

**작성자**: GitHub Copilot **검토 필요**: 프로젝트 리드, SolidJS 전문가 **다음
단계**: Phase 1 실행 후 성능 측정 및 팀 리뷰
