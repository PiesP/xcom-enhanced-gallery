# Phase 100: 타입 단언 전수 조사 및 분류

> **생성일**: 2025-10-17  
> **목적**: 남은 31개 타입 단언 분석 및 제거 가능성 평가

## 📊 전체 현황

- **Phase 98 이전**: 38개
- **Phase 98 완료**: 33개 (Icon Registry 5개 제거)
- **Phase 99 완료**: 31개 (Signal 2개 제거) ✅ 수정: 7개 제거
- **Phase 100 목표**: 분류 및 우선순위 결정

## 🔍 타입 단언 분류 (31개)

### Category 1: EventListener 타입 변환 (9개) - 브라우저 API 호환성

**목적**: DOM EventListener 인터페이스 호환성 (Solid.js 이벤트 핸들러 → 표준
EventListener)

| 파일                    | 라인 | 패턴                                                    | 제거 가능성                  |
| ----------------------- | ---- | ------------------------------------------------------- | ---------------------------- |
| `viewport.ts`           | 100  | `onResize as unknown as EventListener`                  | ❌ 보류 (DOM API 필수)       |
| `keyboard-navigator.ts` | 145  | `handleKeyDown as unknown as EventListener`             | ❌ 보류 (DOM API 필수)       |
| `use-accessibility.ts`  | 33   | `handleKeyDown as unknown as EventListener`             | ❌ 보류 (DOM API 필수)       |
| `theme-service.ts`      | 104  | `onMediaQueryChange as unknown as (event: ...) => void` | ❌ 보류 (MediaQueryList API) |
| `theme-service.ts`      | 235  | `onMediaQueryChange as unknown as (event: ...) => void` | ❌ 보류 (MediaQueryList API) |
| `Button.tsx`            | 70   | `onClick?.(event as unknown as MouseEvent)`             | ⚠️ 검토 (Solid.js 이벤트)    |
| `Toolbar.tsx`           | 154  | `getFitHandler(mode)?.(event as unknown as Event)`      | ⚠️ 검토 (Solid.js 이벤트)    |
| `ToolbarView.tsx`       | 88   | `handleToolbarKeyDown as unknown as EventListener`      | ❌ 보류 (DOM API 필수)       |
| `adapter.ts`            | 126  | `{ type: 'loadend' } as unknown as ProgressEvent`       | ⚠️ 검토 (모킹용)             |

**평가**:

- 6개는 DOM API 호환성을 위해 필수 (EventListener 인터페이스)
- 3개는 Solid.js 이벤트 핸들러 관련 (타입 가드로 대체 가능성 검토)

---

### Category 2: 브라우저 API 타입 확장 (8개) - globalThis/window 접근

**목적**: 런타임 환경 감지 및 확장 API 접근

| 파일                | 라인 | 패턴                                                         | 제거 가능성                         |
| ------------------- | ---- | ------------------------------------------------------------ | ----------------------------------- |
| `schedulers.ts`     | 24   | `globalThis as unknown as GlobalLike`                        | ❌ 보류 (런타임 감지)               |
| `schedulers.ts`     | 26   | `window as unknown as GlobalLike`                            | ❌ 보류 (런타임 감지)               |
| `schedulers.ts`     | 91   | `globalThis as unknown as GlobalLike`                        | ❌ 보류 (런타임 감지)               |
| `memory-tracker.ts` | 51   | `performance as unknown as Performance & { memory: ... }`    | ❌ 보류 (Chrome 전용 API)           |
| `logger.ts`         | 85   | `window as unknown as Record<string, unknown>)['GM_info']`   | ❌ 보류 (Userscript API)            |
| `logger.ts`         | 86   | `window as unknown as Record<string, unknown>).unsafeWindow` | ❌ 보류 (Userscript API)            |
| `adapter.ts`        | 29   | `(globalThis as any)?.GM_info`                               | ✅ 제거 가능 (`as any` → 타입 가드) |
| `adapter.ts`        | 44   | `(globalThis as any)?.GM_info`                               | ✅ 제거 가능 (`as any` → 타입 가드) |
| `adapter.ts`        | 151  | `const g: any = globalThis as any`                           | ✅ 제거 가능 (`as any` → 타입 가드) |

**평가**:

- 6개는 브라우저/Userscript 확장 API 접근을 위해 보류 (명시적 타입 가드로 개선
  가능)
- **3개는 즉시 제거 가능** (`as any` → 타입 안전한 접근)

---

### Category 3: Settings 서비스 타입 단언 (5개) - 설정 경로 문자열

**목적**: 설정 키 문자열을 동적으로 처리

| 파일                      | 라인 | 패턴                                                    | 제거 가능성                |
| ------------------------- | ---- | ------------------------------------------------------- | -------------------------- |
| `VerticalGalleryView.tsx` | 303  | `'gallery.imageFitMode' as unknown as string`           | ✅ 제거 가능 (이미 string) |
| `VerticalGalleryView.tsx` | 314  | `'gallery.imageFitMode' as unknown as string`           | ✅ 제거 가능 (이미 string) |
| `VerticalGalleryView.tsx` | 325  | `'gallery.imageFitMode' as unknown as string`           | ✅ 제거 가능 (이미 string) |
| `VerticalGalleryView.tsx` | 336  | `'gallery.imageFitMode' as unknown as string`           | ✅ 제거 가능 (이미 string) |
| `settings-service.ts`     | 156  | `this.settings as unknown as Record<string, unknown>`   | ⚠️ 검토 (설계 개선 필요)   |
| `settings-service.ts`     | 220  | `this.settings as unknown as Record<string, unknown>`   | ⚠️ 검토 (설계 개선 필요)   |
| `settings-service.ts`     | 267  | `defaultSettings as unknown as Record<string, unknown>` | ⚠️ 검토 (설계 개선 필요)   |
| `settings-service.ts`     | 272  | `this.settings as unknown as Record<string, unknown>`   | ⚠️ 검토 (설계 개선 필요)   |

**평가**:

- **4개는 즉시 제거 가능** (VerticalGalleryView.tsx - 문자열 리터럴이 이미
  string)
- 4개는 settings-service.ts 설계 개선 필요 (제네릭 타입 활용)

---

### Category 4: 기타 타입 변환 (9개) - 개별 검토 필요

| 파일                     | 라인 | 패턴                                                            | 제거 가능성             |
| ------------------------ | ---- | --------------------------------------------------------------- | ----------------------- |
| `signal-selector.ts`     | 151  | `optimizedSelector as unknown as DebugSelector<T, R>`           | ❌ 보류 (디버그 전용)   |
| `events.ts`              | 76   | `getMediaServiceFromContainer() as unknown as MediaServiceLike` | ⚠️ 검토 (DI 패턴)       |
| `live-region-manager.ts` | 49   | `{ ... } as unknown as HTMLElement`                             | ⚠️ 검토 (DOM 생성)      |
| `media-service.ts`       | 688  | `(value as AnyFunc).bind(inst)`                                 | ❌ 보류 (리플렉션)      |
| `service-manager.ts`     | 239  | `registerServiceFactory as unknown as object`                   | ❌ 보류 (싱글톤 패턴)   |
| `dom-cache.ts`           | 175  | `cached.element as unknown as NodeListOf<Element>`              | ⚠️ 검토 (DOM 캐싱)      |
| `dom-cache.ts`           | 183  | `elements as unknown as Element`                                | ⚠️ 검토 (DOM 캐싱)      |
| `VerticalImageItem.tsx`  | 406  | `BaseVerticalImageItemCore as unknown as ComponentType<...>`    | ⚠️ 검토 (컴포넌트 래핑) |
| `GalleryApp.ts`          | 73   | `getMediaServiceFromContainer() as unknown as MediaService`     | ⚠️ 검토 (DI 패턴)       |

**평가**:

- 3개는 시스템 설계상 보류 (디버그, 리플렉션, 싱글톤)
- 6개는 개별 검토 필요 (DI 패턴, DOM 타입, 컴포넌트 타입)

---

## 🎯 우선순위 결정

### 🟢 Phase 101: 즉시 제거 가능 (7개) - 높은 우선순위

1. **VerticalGalleryView.tsx** (4개):
   `'gallery.imageFitMode' as unknown as string`
   - 문자열 리터럴이 이미 `string` 타입
   - 타입 단언 완전히 불필요

2. **adapter.ts** (3개): `globalThis as any` → 타입 가드
   - `hasGMInfo()` 타입 가드 함수 생성
   - `GM_info` 접근을 타입 안전하게 개선

**예상 소요**: 30분  
**위험도**: 낮음  
**영향 범위**: 2개 파일

---

### 🟡 Phase 102: 검토 후 제거 (10개) - 중간 우선순위

1. **Solid.js 이벤트 핸들러** (3개):
   - `Button.tsx`, `Toolbar.tsx` 이벤트 타입
   - Solid.js 이벤트 시스템과 표준 DOM 이벤트 호환성 검토

2. **Settings 서비스** (4개):
   - `settings-service.ts` 설계 개선
   - 제네릭 타입으로 타입 안전성 확보

3. **DI 패턴 타입 단언** (2개):
   - `events.ts`, `GalleryApp.ts`
   - 서비스 컨테이너 타입 개선

4. **DOM 관련** (3개):
   - `dom-cache.ts` (2개), `live-region-manager.ts` (1개)
   - DOM 타입 가드로 대체

**예상 소요**: 2-3시간  
**위험도**: 중간  
**영향 범위**: 7개 파일

---

### 🔴 Phase 103+: 보류 또는 대안 검토 (14개) - 낮은 우선순위

1. **EventListener 인터페이스** (6개):
   - DOM API 호환성을 위해 필수
   - 타입 래퍼 함수로 추상화 가능 (선택적)

2. **브라우저 확장 API** (6개):
   - Chrome 전용 API, Userscript API 접근
   - 타입 정의 파일로 개선 가능 (선택적)

3. **시스템 설계** (3개):
   - 디버그, 리플렉션, 싱글톤 패턴
   - 현재 설계 유지

**예상 소요**: 4-6시간 (대안 검토 포함)  
**위험도**: 높음  
**영향 범위**: 전체 시스템

---

## 📋 Phase 101 계획 (즉시 실행)

### 목표

즉시 제거 가능한 7개 타입 단언 제거 (VerticalGalleryView 4개 + adapter.ts 3개)

### 작업 순서

1. **Phase 101.1 (RED)**: 테스트 작성
   - `test/unit/features/gallery/vertical-gallery-fit-mode-types.test.ts`
   - `test/unit/shared/external/userscript-adapter-types.test.ts`

2. **Phase 101.2 (GREEN)**: 타입 단언 제거
   - VerticalGalleryView.tsx: `as unknown as string` 4개 제거
   - adapter.ts: `as any` 3개 → 타입 가드로 대체

3. **Phase 101.3 (REFACTOR)**: 검증
   - 타입 체크 통과
   - 테스트 통과
   - 빌드 성공

### 예상 결과

- 타입 단언: 31개 → **24개** (7개 제거)
- 빌드 크기: 330.23 KB 유지
- 타입 안전성: 문자열 리터럴 + GM API 타입 가드
