# Phase 9.21.4: EFFECT-OPTIMIZATION + MODAL-DEBUG

> **작성일**: 2025-10-08 **우선순위**: Critical (P0) - 설정 모달 미표시, High
> (P1) - 불필요한 effect 재실행 **Phase 9.21.3 후속 작업**

## 배경

### Phase 9.21.3 브라우저 테스트 결과

**빌드**: `0.3.1-dev.1759926710025`

**테스트 시나리오**:

1. 타임라인에서 미디어 클릭 1번
2. 툴바에서 다음 미디어 클릭 3번
3. 툴바에서 설정 버튼 클릭 1번
4. 툴바에서 닫기 버튼 클릭 1번

**관측된 문제**:

1. ❌ **다음 미디어 1번 클릭 시 불필요한 effect 재실행**
   - 로그:
     `[GalleryRenderer] isOpen 변경 감지 {isOpen: true, hasContainer: true}`
   - `currentIndex` 변경인데 `isOpen` 변경 감지 로그 출력
2. ❌ **설정 모달이 사용자에게 보이지 않음**
   - 로그: "설정 모달 렌더링 완료 (DOM 업데이트됨)" 출력
   - 그러나 사용자 화면에는 표시 안 됨

## 근본 원인 분석

### 문제 1: 불필요한 createEffect 재실행

**로그 증거** (x.com-1759926893769.log):

```
12:34:42.606 [GalleryRenderer] isOpen 변경 감지 {isOpen: true, hasContainer: true}
```

**현재 코드** (`GalleryRenderer.tsx`):

```typescript
private setupStateSubscription(): void {
  const { createEffect, createRoot } = getSolid();

  this.stateUnsubscribe = createRoot(dispose => {
    createEffect(() => {
      const isOpen = isGalleryOpen(); // ← derived signal 호출

      if (this.isInitialSubscription) {
        this.isInitialSubscription = false;
        return;
      }

      logger.debug('[GalleryRenderer] isOpen 변경 감지', ...);

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

**`isGalleryOpen` 정의** (`gallery.signals.ts`):

```typescript
export const isGalleryOpen = createMemo(() => galleryState.value.isOpen);
```

**Solid.js createMemo의 동작 (Phase 9.21.3 가정과 실제)**:

**가정 (Phase 9.21.3)**:

1. `currentIndex` 변경 → `galleryState.value` 변경
2. `createMemo` 재실행 → 결과값 계산: `galleryState.value.isOpen`
3. 이전 결과값과 비교: `true === true` (동일)
4. **의존자(createEffect) 업데이트 안 함** ← 기대했으나 실패!

**실제 동작**:

1. `currentIndex` 변경 → `galleryState.value` 변경
2. `createMemo` 재실행 (dependency tracking)
3. **`createEffect`가 `isGalleryOpen()`을 추적 중이므로 재실행됨!**
4. 결과값이 `true === true`이지만 이미 createEffect 재실행 후

**왜 이런 일이 발생하는가?**

Solid.js의 fine-grained reactivity:

- `createEffect(() => { const x = signal(); })` 패턴은 `signal()`을 **직접
  추적**
- `signal()`이 재실행되면 effect도 재실행
- `createMemo`의 equality check는 **의존자의 의존자**까지 전파되지 않음

**해결 방법**:

**Option 1**: `on()` helper 사용 (명시적 dependency)

```typescript
import { on } from 'solid-js';

createEffect(on(isGalleryOpen, (isOpen) => {
  // isOpen 값이 실제로 변경될 때만 실행
  logger.debug('[GalleryRenderer] isOpen 변경 감지', ...);
}));
```

**Option 2**: `createSelector()` 사용 (reference equality)

```typescript
const isOpen = createSelector(
  () => galleryState.value.isOpen,
  v => v
);
// isOpen은 값이 실제로 변경될 때만 true 반환
```

**Option 3**: Manual equality check inside effect

```typescript
let prevIsOpen: boolean | undefined;

createEffect(() => {
  const currentIsOpen = isGalleryOpen();
  if (prevIsOpen !== currentIsOpen) {
    prevIsOpen = currentIsOpen;
    logger.debug('[GalleryRenderer] isOpen 변경 감지', ...);
    // ...
  }
});
```

**추천**: Option 1 (`on()` helper)

- ✅ Simple and idiomatic Solid.js pattern
- ✅ Explicit dependency declaration
- ✅ Automatic equality check
- ❌ None significant

### 문제 2: 설정 모달이 보이지 않음

**로그 증거** (x.com-1759926893769.log):

```
12:34:47.990 [SettingsModal] 설정 모달 렌더링 시작
12:34:48.001 [SettingsModal] 설정 모달 렌더링 완료 (DOM 업데이트됨)
```

**코드 검증 결과**:

- ✅ `ModalShell.tsx`: `createMemo` 사용 중 (Phase 9.12 수정 유지)
- ✅ `SettingsModal.tsx`: `isOpen` prop을 `ModalShell`에 전달
- ✅ `ToolbarWithSettings.tsx`: `isSettingsOpen` signal을 `SettingsModal`에 전달

**가설**:

1. **CSS 문제**: `modal-open` 클래스가 적용되지 않음
2. **z-index 문제**: 다른 요소에 가려짐
3. **Portal 문제**: Portal이 올바른 위치에 렌더링되지 않음
4. **Timing 문제**: CSS transition이 완료되기 전에 다른 상태 변경

**디버깅 전략**:

1. 브라우저 DevTools로 DOM 구조 확인
   - `modal-backdrop` 요소 존재 여부
   - `modal-open` 클래스 적용 여부
   - CSS `opacity`, `visibility` 값 확인
2. Computed styles 확인
   - `opacity: 0` 또는 `visibility: hidden` 상태인지
3. Console에서 수동 테스트
   - `document.querySelector('.modal-backdrop')`
   - `getComputedStyle(element)`

**임시 해결책**: 추가 로깅

```typescript
// ModalShell.tsx에 추가
createEffect(() => {
  console.log('[ModalShell] isOpen:', local.isOpen);
  console.log('[ModalShell] backdropClass:', backdropClass());
  console.log('[ModalShell] shellClass:', shellClass());
});
```

## 해결 방안

### Solution 1: `on()` helper로 effect 최적화 (High Priority)

**파일**: `src/features/gallery/GalleryRenderer.tsx`

**변경**:

```typescript
import { getSolid } from '@shared/external/vendors';
const { createEffect, createRoot, on } = getSolid(); // on 추가

private setupStateSubscription(): void {
  const { createEffect, createRoot, on } = getSolid();

  this.stateUnsubscribe = createRoot(dispose => {
    // Phase 9.21.4: on() helper로 isOpen 값 변경만 추적
    createEffect(on(
      isGalleryOpen,
      (isOpen) => {
        // Phase 9.18: 초기 실행 스킵
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
      },
      { defer: true } // 초기 실행 스킵 (Phase 9.18 로직 대체 가능)
    ));
    return dispose;
  });
}
```

**Benefits**:

- ✅ `isOpen` 값이 실제로 변경될 때만 effect 실행
- ✅ `currentIndex` 변경 시 effect 재실행 안 함
- ✅ `defer: true` 옵션으로 Phase 9.18 로직 단순화 가능

### Solution 2: ModalShell 디버깅 로깅 추가 (Critical Priority)

**파일**: `src/shared/components/ui/ModalShell/ModalShell.tsx`

**변경**:

```typescript
import { logger } from '@shared/logging';

// Phase 9.21.4: 디버깅 로깅 추가
const { createEffect } = getSolid();

createEffect(() => {
  logger.debug('[ModalShell] Reactivity check', {
    isOpen: local.isOpen,
    backdropClass: backdropClass(),
    shellClass: shellClass(),
    timestamp: Date.now(),
  });
});
```

**Benefits**:

- ✅ `local.isOpen` 변경이 `backdropClass()`에 반영되는지 확인
- ✅ CSS 클래스 계산 로직 검증
- ✅ 반응성 문제 조기 발견

## RED → GREEN → REFACTOR

### RED: 테스트 작성

**파일**:
`test/unit/features/gallery/gallery-renderer-effect-optimization.red.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('RED: GalleryRenderer effect optimization', () => {
  const filePath = join(
    process.cwd(),
    'src/features/gallery/GalleryRenderer.tsx'
  );
  const content = readFileSync(filePath, 'utf-8');

  it('RED: setupStateSubscription should use on() helper', () => {
    expect(content).toContain("import { on } from 'solid-js'");
    expect(content).toContain('createEffect(on(');
    expect(content).toContain('isGalleryOpen,');
  });

  it('RED: on() should have defer: true option', () => {
    expect(content).toContain('{ defer: true }');
  });

  it('RED: isInitialSubscription logic should be removed or simplified', () => {
    // defer: true로 대체 가능하므로 제거 또는 단순화
    const hasDefer = content.includes('{ defer: true }');
    const hasIsInitial = content.includes('isInitialSubscription');

    // defer: true를 사용하면 isInitialSubscription 불필요
    if (hasDefer) {
      expect(hasIsInitial).toBe(false);
    }
  });
});

describe('RED: ModalShell debug logging', () => {
  const filePath = join(
    process.cwd(),
    'src/shared/components/ui/ModalShell/ModalShell.tsx'
  );
  const content = readFileSync(filePath, 'utf-8');

  it('RED: ModalShell should have debug logging for isOpen', () => {
    expect(content).toContain("logger.debug('[ModalShell]");
    expect(content).toContain('isOpen: local.isOpen');
  });

  it('RED: ModalShell should log backdropClass and shellClass', () => {
    expect(content).toContain('backdropClass: backdropClass()');
    expect(content).toContain('shellClass: shellClass()');
  });
});
```

### GREEN: 최소 구현

1. **GalleryRenderer.tsx**에 `on()` helper 적용
2. **ModalShell.tsx**에 디버깅 로깅 추가
3. 테스트 PASS 확인

### REFACTOR: 빌드 및 브라우저 테스트

1. `npm run build` 실행
2. Dev build로 브라우저 테스트
3. 로그 분석:
   - `[GalleryRenderer] isOpen 변경 감지` 로그가 다음 미디어 클릭 시 출력되지
     않는지
   - `[ModalShell] Reactivity check` 로그에서 `isOpen: true`, `backdropClass`
     확인
4. 설정 모달이 화면에 표시되는지 확인

## 수용 기준

### Acceptance Criteria

1. **Effect 최적화**:
   - ✅ 다음 미디어 클릭 시 `[GalleryRenderer] isOpen 변경 감지` 로그 **출력 안
     됨**
   - ✅ 갤러리 열기/닫기 시에만 로그 출력 (isOpen: false → true, true → false)
   - ✅ `on()` helper 사용으로 명시적 dependency 선언

2. **설정 모달 표시**:
   - ✅ 설정 버튼 클릭 시 사용자에게 모달 표시
   - ✅ `[ModalShell] Reactivity check` 로그에서 `isOpen: true` 확인
   - ✅ `backdropClass`에 `modal-open` 클래스 포함 확인

3. **빌드**:
   - ✅ 타입체크 통과
   - ✅ 린트 통과
   - ✅ Dev/Prod 빌드 성공
   - ✅ 번들 크기 예상 범위 내 (Prod ~337 KB)

4. **브라우저 테스트**:
   - ✅ 갤러리 정상 표시
   - ✅ 다음 미디어 버튼 클릭 시 깜빡임 없음
   - ✅ 설정 모달 정상 표시 및 동작

## 예상 결과

- **Effect 재실행**: 0회 (currentIndex 변경 시)
- **설정 모달**: 정상 표시
- **빌드 크기**: Dev ~1,055 KB, Prod ~337 KB

## 관련 Phase

- **Phase 9.21.3**: GALLERY-STATE-ISOPEN-DERIVED-SIGNAL (선행 작업)
- **Phase 9.12**: MODAL-REACTIVITY-FIX (ModalShell createMemo 수정)
- **Phase 9.18**: GALLERY-SUBSCRIPTION-INITIAL-SKIP (초기 실행 스킵 로직)

## 참고 자료

- Solid.js `on()` helper: https://www.solidjs.com/docs/latest/api#on
- Solid.js `defer` option: https://www.solidjs.com/docs/latest/api#createeffect
- Phase 9.21.3 로그: `x.com-1759926893769.log`
