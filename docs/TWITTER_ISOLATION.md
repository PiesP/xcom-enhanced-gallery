/\*\*

- @fileoverview Twitter 페이지 격리 문서
- @description 스크립트가 Twitter 페이지에 영향을 주지 않도록 구현된 격리
  메커니즘
- @version 1.0.0 \*/

# Twitter 페이지 격리 전략

## Phase 290: 네임스페이스 격리

### 개요

스크립트가 Twitter(X.com) 페이지에 영향을 주지 않도록 다층 격리 전략을
구현했습니다.

## 1. 전역 네임스페이스 격리

### 구현 원칙

- **단일 진입점**: 모든 전역 변수를 `window.__XEG__` 단일 네임스페이스로 통합
- **개발 환경 전용**: 프로덕션 빌드에서는 완전히 제거 (`__DEV__` 플래그 사용)
- **타입 안전성**: TypeScript 인터페이스로 타입 보장

### 네임스페이스 구조

```typescript
window.__XEG__ = {
  // 로깅 도구 (logger.ts)
  logging: {
    setLogLevel: (level: LogLevel) => void,
    getLogLevel: () => LogLevel,
    measureMemory: (label: string) => MemorySnapshot | null
  },

  // 플로우 추적 도구 (flow-tracer.ts)
  tracing: {
    start: (options?: TraceOptions) => void,
    stop: () => void,
    point: (label: string, data?: Record<string, unknown>) => void,
    status: () => { started: boolean; sinceMs: number | null }
  },

  // 메인 애플리케이션 (main.ts)
  main: {
    start: () => Promise<void>,
    createConfig: () => AppConfig,
    cleanup: () => Promise<void>,
    galleryApp?: GalleryApp
  }
}
```

### 변경 전후 비교

**변경 전 (분산된 전역 변수):**

```typescript
window.__XEG_SET_LOG_LEVEL;
window.__XEG_GET_LOG_LEVEL;
window.__XEG_MEASURE_MEMORY;
window.__XEG_TRACE_START;
window.__XEG_TRACE_STOP;
window.__XEG_TRACE_POINT;
window.__XEG_TRACE_STATUS;
window.__XEG_MAIN__;
window.__XEG_GALLERY_APP__;
```

**변경 후 (통합된 네임스페이스):**

```typescript
window.__XEG__.logging.setLogLevel();
window.__XEG__.logging.getLogLevel();
window.__XEG__.logging.measureMemory();
window.__XEG__.tracing.start();
window.__XEG__.tracing.stop();
window.__XEG__.tracing.point();
window.__XEG__.tracing.status();
window.__XEG__.main.start();
window.__XEG__.main.cleanup();
window.__XEG__.main.galleryApp;
```

**이점:**

- 전역 오염 최소화 (1개의 전역 변수만 사용)
- 네임스페이스 충돌 방지
- 구조화된 API 접근
- 타입 안전성 보장

## 2. CSS 격리

### CSS Modules

- 모든 컴포넌트 스타일은 CSS Modules 사용
- 자동 스코프 생성으로 클래스 이름 충돌 방지
- Twitter 페이지 스타일에 영향 없음

### 격리된 루트 컨테이너 (`isolated-gallery.css`)

```css
.xeg-root {
  /* 완전한 스타일 초기화 */
  all: initial !important;

  /* 스타일 격리 */
  isolation: isolate !important;
  contain: style paint !important;

  /* 고정 위치 */
  position: fixed !important;
  z-index: var(--xeg-layer-root) !important;
}
```

**격리 속성:**

- `all: initial`: 모든 상속된 스타일 초기화
- `isolation: isolate`: 새로운 stacking context 생성
- `contain: style paint`: 스타일 및 페인트 격리 (layout 제외)

**Phase 294 개선:**

- `contain: layout` 제거 → Twitter 페이지 레이아웃 재계산 최소화
- 갤러리가 고정 위치(`position: fixed`)이므로 layout containment 불필요

## 3. DOM 스코프 제한

### 원칙

- 갤러리 컨테이너(`.xeg-root`) 외부 DOM 직접 조작 금지
- `document.querySelector` 등은 갤러리 내부에서만 사용

### 허용된 전역 DOM 접근

1. **미디어 추출** (`MediaExtractor`):
   - Twitter 트윗 DOM에서 미디어 URL 추출
   - 읽기 전용, 수정 없음

2. **모달 포커스 관리** (`KeyboardHelpOverlay`):
   - `document.activeElement` 저장/복원
   - 접근성 요구사항

3. **비디오 일시정지** (`VerticalGalleryView`):
   - Twitter 페이지의 모든 비디오 일시정지
   - 갤러리 사용 중 성능 최적화

### DOM 쿼리 패턴

```typescript
// ✅ 허용: 갤러리 내부 쿼리
const container = galleryRef.querySelector('.item');

// ✅ 허용: 미디어 추출 (읽기 전용)
const mediaElements = document.querySelectorAll('[data-testid="tweet"] img');

// ❌ 금지: Twitter UI 직접 수정
document.querySelector('[aria-label="Timeline"]').style.display = 'none';
```

## 4. 이벤트 격리

### 이벤트 리스너 관리

**등록 위치:**

- `bootstrap/events.ts`: 페이지 언로드 이벤트만 (`beforeunload`, `pagehide`)
- `flow-tracer.ts`: 개발 환경 전용 추적 이벤트 (DEV만)
- 갤러리 컴포넌트: 갤러리 DOM 내부 이벤트만

**정리 보장:**

```typescript
// 등록 시 cleanup 함수 반환
export function wireGlobalEvents(onBeforeUnload: () => void): Unregister {
  const handler = () => {
    onBeforeUnload();
  };

  window.addEventListener('beforeunload', handler);
  window.addEventListener('pagehide', handler);

  // cleanup 함수 반환
  return () => {
    window.removeEventListener('beforeunload', handler);
    window.removeEventListener('pagehide', handler);
  };
}
```

**PC 전용 이벤트 정책:**

- Touch/Pointer 이벤트 금지 (모바일 지원 없음)
- PC 전용 이벤트만 사용 (click, keydown/up, wheel, contextmenu, mouse\*)

## 5. 스크립트 실행 타이밍

### `@run-at document-idle`

- Tampermonkey/Greasemonkey 보장
- DOM 준비 완료 후 실행
- Twitter 초기 렌더링 후 실행되므로 간섭 최소화

### Phase 236 개선

- DOMContentLoaded 리스너 제거
- 즉시 `startApplication()` 호출
- 불필요한 이벤트 리스너 제거로 Twitter 네이티브 페이지 간섭 최소화

## 6. 메모리 및 리소스 관리

### Cleanup 프로토콜

```typescript
async function cleanup(): Promise<void> {
  // 1. 갤러리 앱 정리
  if (galleryApp) {
    await galleryApp.cleanup();
  }

  // 2. 서비스 정리
  CoreService.getInstance().cleanup();

  // 3. Vendor 정리
  cleanupVendors();

  // 4. DOM 캐시 정리
  globalDOMCache.dispose();

  // 5. 이벤트 리스너 해제
  await Promise.all(cleanupHandlers.map(handler => handler()));

  // 6. 타이머 정리
  globalTimerManager.clearAll();
}
```

### 자동 정리 트리거

- `beforeunload` / `pagehide` 이벤트
- 페이지 전환 시 자동 정리
- 메모리 누수 방지

## 7. 성능 최적화

### Twitter 페이지 영향 최소화

1. **레이아웃 재계산 방지**
   - `position: fixed` 사용
   - `contain: style paint` (layout 제외)
2. **하드웨어 가속**
   - `transform: translateZ(0)` 사용
   - GPU 레이어 분리
3. **Lazy Initialization**
   - Feature Services 지연 등록
   - Non-Critical 시스템 백그라운드 초기화
4. **테스트 모드 최적화**
   - 테스트 환경에서 불필요한 초기화 건너뛰기
   - 갤러리 앱 초기화 생략 (MODE === 'test')

## 8. 검증 및 테스트

### 격리 검증 방법

```bash
# 빌드 후 검증
npm run build
node ./scripts/validate-build.js

# 전역 변수 검증
grep -r "window\.__XEG" dist/xcom-enhanced-gallery.prod.user.js
# 예상 결과: 0 matches (프로덕션에서 완전 제거)

# CSS 격리 검증
grep -r ":global" src/**/*.css
# 예상 결과: 0 matches (전역 스타일 없음)
```

### E2E 테스트

- Playwright를 통한 실제 브라우저 테스트
- Twitter 페이지와 갤러리 동시 로드
- 상호 간섭 없음 확인

## 9. 모범 사례

### 개발자 가이드라인

**전역 변수 사용:**

```typescript
// ✅ 허용: 개발 환경에서만
if (__DEV__) {
  window.__XEG__.logging.setLogLevel('debug');
}

// ❌ 금지: 프로덕션 코드에서 전역 변수 직접 사용
window.myGlobalVar = value;
```

**DOM 조작:**

```typescript
// ✅ 허용: 갤러리 컨테이너 내부
const container = document.querySelector('.xeg-root');
container.querySelector('.item');

// ❌ 금지: Twitter DOM 직접 수정
document.querySelector('[data-testid="primaryColumn"]').style.display = 'none';
```

**이벤트 리스너:**

```typescript
// ✅ 허용: cleanup 함수 제공
function registerEvents(): () => void {
  const handler = () => {};
  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
}

// ❌ 금지: cleanup 없이 등록
document.addEventListener('click', handler);
```

## 10. 트러블슈팅

### 문제: 전역 변수 충돌

**증상:** Twitter 페이지 기능 오작동 **해결:** `window.__XEG__` 네임스페이스로
통합 (Phase 290)

### 문제: CSS 스타일 충돌

**증상:** 갤러리 스타일이 Twitter에 영향 **해결:** CSS Modules +
`isolated-gallery.css` 사용

### 문제: 메모리 누수

**증상:** 페이지 전환 후에도 메모리 점유 **해결:** `cleanup()` 프로토콜 강화,
자동 정리 추가

### 문제: 이벤트 리스너 누수

**증상:** 이벤트 리스너가 계속 쌓임 **해결:** 모든 리스너에 cleanup 함수 제공,
`cleanupHandlers` 배열 관리

## 11. 참고 문서

- `docs/CODING_GUIDELINES.md`: 코딩 규칙 및 디자인 토큰
- `docs/ARCHITECTURE.md`: 3계층 구조 및 의존성 규칙
- `src/styles/globals.ts`: 전역 스타일 시스템
- `src/bootstrap/events.ts`: 이벤트 관리
- `test/guards/leaks.test.ts`: 누수 검증 테스트

## 요약

### 핵심 격리 메커니즘

1. ✅ **네임스페이스 격리**: `window.__XEG__` 단일 진입점
2. ✅ **CSS 격리**: CSS Modules + `isolated-gallery.css`
3. ✅ **DOM 스코프 제한**: 갤러리 컨테이너 내부만 조작
4. ✅ **이벤트 격리**: 명시적 cleanup 보장
5. ✅ **메모리 관리**: 자동 정리 프로토콜
6. ✅ **성능 최적화**: 레이아웃 재계산 최소화

### 영향 범위

- **Twitter 페이지**: 영향 없음 (완전 격리)
- **갤러리 기능**: 정상 작동
- **성능**: 최소 오버헤드
- **메모리**: 자동 정리로 누수 방지

### 개발 환경

- 디버깅: `window.__XEG__` API 사용
- 로깅: `window.__XEG__.logging.setLogLevel('debug')`
- 추적: `window.__XEG__.tracing.start()`
- 정리: `window.__XEG__.main.cleanup()`
