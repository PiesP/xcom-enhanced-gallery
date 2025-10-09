# Phase 9.21.3: GALLERY-STATE-ISOPEN-DERIVED-SIGNAL

**우선순위**: Critical (P0) **상태**: 계획 수립 중 **일자**: 2025-10-08

## 배경

Phase 9.21.2 완료 후 Critical 버그 발견:

- ✅ 빌드 성공 (0.3.1-dev.1759925303113)
- ✅ 갤러리 컨테이너 생성됨 (로그 확인)
- ❌ **갤러리가 화면에 표시되지 않음**
- ❌ "[GalleryRenderer] isOpen 변경 감지" 로그 없음

### Phase 9.21.2의 근본적 오류

```typescript
// GalleryRenderer.tsx - 현재 코드 (작동하지 않음!)
private setupStateSubscription(): void {
  const { createEffect, createRoot, untrack } = getSolid();

  this.stateUnsubscribe = createRoot(dispose => {
    createEffect(() => {
      // ❌ untrack() 내부 값은 반응성 없음!
      const currentState = untrack(() => galleryState.value);
      const isOpen = currentState.isOpen;  // ← 일반 boolean, 추적 불가

      // isOpen 변경을 감지할 수 없어서 아래 로직이 실행되지 않음
      if (isOpen && !this.container) {
        this.renderGallery();  // ← 절대 호출되지 않음!
      }
    });
    return dispose;
  });
}
```

**왜 작동하지 않는가**:

- `untrack()` 내부에서 읽은 값은 **snapshot**(스냅샷)
- `currentState`는 반응성이 없는 일반 객체
- `currentState.isOpen`도 반응성이 없는 일반 boolean
- createEffect가 **아무 것도 추적하지 않음**
- `isOpen`이 false → true로 변경되어도 effect가 재실행되지 않음

## 해결책 분석

### Option 1: createMemo (Derived Signal) ✅ **최적 솔루션**

```typescript
// gallery.signals.ts
export const isGalleryOpen = createMemo(() => galleryState.value.isOpen);

// GalleryRenderer.tsx
createEffect(() => {
  const isOpen = isGalleryOpen(); // ✅ isOpen만 추적
  if (isOpen && !this.container) {
    this.renderGallery();
  }
});
```

**장점**:

- ✅ Solid.js fine-grained reactivity 활용
- ✅ createMemo는 결과값이 같으면 의존자를 업데이트하지 않음
- ✅ currentIndex 변경 시: createMemo 재실행 → isOpen 여전히 true → effect
  재실행 안 함
- ✅ 프로젝트의 Solid.js 패턴에 부합
- ✅ 단순하고 직관적

**단점**:

- ⚠️ galleryState.value 변경 시 createMemo는 재실행됨 (하지만 결과값이 같으면
  effect는 재실행 안 함)

### Option 2: createSelector (signalSelector.ts 활용)

```typescript
import { createSelector } from '@shared/utils/signalSelector';

const isOpenSelector = createSelector(galleryState, state => state.isOpen, {
  name: 'GalleryIsOpen',
});

createEffect(() => {
  const state = galleryState.value; // ❌ 여전히 전체 추적
  const isOpen = isOpenSelector();
});
```

**장점**:

- ✅ 프로젝트에 이미 존재하는 유틸
- ✅ 디버깅/통계 기능 내장

**단점**:

- ❌ signalSelector는 **컴포넌트 내부**에서 사용하도록 설계됨
- ❌ 클래스 메서드에서 사용 시 타이밍 이슈 가능
- ❌ createSelector는 source Accessor를 받지만, galleryState는 Signal 객체

### Option 3: 별도 isOpen Signal

```typescript
const [isOpen, setIsOpen] = createSignal(false);

export function openGallery(...) {
  setGalleryState({...});
  setIsOpen(true);  // ❌ 중복 상태 관리
}
```

**장점**:

- ✅ 완전히 독립적

**단점**:

- ❌ 상태 동기화 필요 (동기화 실패 위험)
- ❌ 복잡성 증가
- ❌ 단일 진실 원천(single source of truth) 위반

### Option 4: subscribe() 메서드 + 수동 비교

```typescript
let lastIsOpen = false;
galleryState.subscribe?.(newState => {
  if (newState.isOpen !== lastIsOpen) {
    lastIsOpen = newState.isOpen;
    // 렌더링 로직
  }
});
```

**장점**:

- ✅ 이미 구현된 메서드 활용

**단점**:

- ❌ 여전히 모든 속성 변경에 반응
- ❌ 수동 비교 로직 필요
- ❌ 명령형 코드, Solid.js 패턴 위배

## 최종 선택: Option 1 (createMemo)

**선택 이유**:

1. Solid.js의 fine-grained reactivity를 올바르게 활용
2. createMemo의 equality check가 불필요한 업데이트 차단
3. 단순하고 직관적이며 유지보수 용이
4. 프로젝트의 Solid.js 패턴과 일관성 유지

## 작업 범위

### 1. RED: 갤러리 렌더링 검증 테스트

**파일**:
`test/unit/features/gallery/gallery-renderer-isopen-derived.red.test.ts`

**테스트 항목**:

1. `isGalleryOpen` derived signal이 존재하는지
2. `isGalleryOpen()`이 `galleryState.value.isOpen`과 동기화되는지
3. currentIndex 변경 시 `isGalleryOpen()`의 결과가 변하지 않는지
4. isOpen 변경 시 `isGalleryOpen()`이 올바르게 업데이트되는지
5. GalleryRenderer가 isGalleryOpen을 사용하는지

### 2. GREEN: Derived Signal 구현

**파일 1**: `src/shared/state/signals/gallery.signals.ts`

```typescript
/**
 * Derived signal: isOpen만 추적
 * currentIndex 등 다른 속성 변경 시에는 재계산하지만
 * 결과값이 같으면 의존자를 업데이트하지 않음
 */
export const isGalleryOpen = createMemo(() => galleryState.value.isOpen);
```

**파일 2**: `src/features/gallery/GalleryRenderer.tsx`

```typescript
import { isGalleryOpen } from '../../shared/state/signals/gallery.signals';

private setupStateSubscription(): void {
  const { createEffect, createRoot } = getSolid();

  this.stateUnsubscribe = createRoot(dispose => {
    createEffect(() => {
      // Phase 9.21.3: isGalleryOpen derived signal 사용
      // isOpen만 추적, currentIndex 변경은 무시
      const isOpen = isGalleryOpen();

      if (this.isInitialSubscription) {
        this.isInitialSubscription = false;
        logger.debug('[GalleryRenderer] 초기 subscription 실행 스킵');
        return;
      }

      logger.debug('[GalleryRenderer] isOpen 변경 감지', {
        isOpen,
        hasContainer: !!this.container,
        timestamp: Date.now(),
      });

      if (isOpen && !this.container) {
        this.renderGallery();
      } else if (!isOpen && this.container) {
        this.cleanupGallery();
      }
    });

    return dispose;
  });
}
```

### 3. REFACTOR

- ✅ 모든 테스트 GREEN 확인
- ✅ 타입 체크 (0 오류)
- ✅ 린트 (0 경고)
- ✅ 빌드 성공
- ✅ 실제 브라우저 테스트로 갤러리 표시 확인
- ✅ 주석 업데이트 (Phase 9.21.3 명시)

## 예상 결과

**로그 변화**:

```log
// 갤러리 열기 (isOpen: false → true)
[GalleryRenderer] isOpen 변경 감지 { isOpen: true, hasContainer: false }
갤러리 컨테이너 생성됨
[Gallery] Opened with 4 items

// 다음 미디어 클릭 (currentIndex: 0 → 1)
// ← 로그 없음! (isOpen은 여전히 true, effect 재실행 안 함)

// 다음 미디어 클릭 (currentIndex: 1 → 2)
// ← 로그 없음!
```

**최종 검증**:

- ✅ 갤러리가 화면에 정상 표시
- ✅ currentIndex 변경 시 재렌더링 없음
- ✅ 설정 모달 정상 동작
- ✅ 화면 깜빡임 제거

## 타임라인

- **RED**: 30분 (테스트 작성)
- **GREEN**: 20분 (구현)
- **REFACTOR**: 20분 (검증 및 문서)
- **총 소요 시간**: 약 1시간 10분
