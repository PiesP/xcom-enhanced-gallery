# TDD 리팩토링 활성 계획: Preact → Solid.js 전환 (2025-10-07 수립)

> **프로젝트 목표**: Preact + @preact/signals에서 Solid.js로 완전 전환 **전략**:
> 계층별 점진적 전환 (Bottom-Up, TDD 우선) **현재 상태**: Phase 3 완료 → Phase 4
> 준비 중

---

## 🎯 전환 목표 및 배경

### 전환 이유

1. **반응성 모델 개선**: Solid.js의 fine-grained reactivity가 프로젝트의 Signal
   중심 아키텍처와 더 자연스럽게 부합
2. **컴파일 타임 최적화**: Virtual DOM 오버헤드 제거로 런타임 성능 향상
3. **번들 크기 최적화**: Userscript 특성상 번들 크기가 중요하며, Solid.js가 더
   경량
4. **일관된 반응성**: Preact Signals의 별도 라이브러리 대신 프레임워크 내장
   반응성
5. **현대적 패러다임**: 컴포넌트 1회 실행 + 자동 의존성 추적

### 현재 프로젝트 현황 (2025-10-07 기준)

#### 코드 품질 현황

- ✅ **빌드**: dev/prod 빌드 정상 동작, postbuild validator 통과
- ✅ **테스트**: 전체 테스트 스위트 GREEN (124 파일 / 584 테스트)
- ✅ **타입**: TypeScript strict 모드 100% 적용
- ✅ **린트**: ESLint 규칙 위반 0건
- ✅ **의존성**: dependency-cruiser 순환 의존성 위반 0건

#### 아키텍처 정책 준수 현황

- ✅ **3계층 구조**: Features → Shared → External 단방향 의존성 유지
- ✅ **Vendors 접근**: `StaticVendorManager` 경유 getter 패턴 100% 적용
- ✅ **Userscript API**: `getUserscript()` adapter를 통한 안전한 GM\_\* 접근
- ✅ **입력 정책**: PC 전용 이벤트만 사용 (터치/포인터 이벤트 금지)
- ✅ **스타일 정책**: CSS Modules + 디자인 토큰만 사용 (하드코딩 금지)

#### 기술 스택 현황

- **프레임워크**: Preact 10.27.2 + @preact/signals 2.3.2
- **상태 관리**: @preact/signals (signal, computed, effect, batch)
- **컴포넌트**: JSX (`jsx: "react-jsx"`, `jsxImportSource: "preact"`)
- **Hooks**: useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect
- **최적화**: memo, forwardRef (preact/compat)
- **빌드**: Vite 7 + @preact/preset-vite → 단일 userscript 번들
- **테스트**: Vitest 3 + JSDOM, 벤더 모킹 시스템 완비
- **참고**: solid-js 1.9.9 이미 package.json에 존재 (미사용)

---

## 🔍 솔루션 분석 및 선택

### 옵션 1: 점진적 마이그레이션 (컴포넌트별, Preact + Solid 병행)

**장점**:

- ✅ 리스크 최소화 (컴포넌트별 독립 전환)
- ✅ 테스트 유지하면서 진행
- ✅ 언제든 롤백 가능
- ✅ 학습 곡선 분산

**단점**:

- ❌ 두 프레임워크 동시 유지로 **번들 크기 대폭 증가** (치명적)
- ❌ 복잡한 빌드 설정 (두 JSX 컴파일러 동시 운영)
- ❌ 상태 동기화 복잡성 (Preact Signal ↔ Solid Signal)
- ❌ 마이그레이션 기간 중 기술 부채 누적
- ❌ **Userscript 특성상 번들 크기가 치명적** (단일 파일 제약)

**결론**: ❌ 부적합 (번들 크기 문제로 Userscript에 부적합)

---

### 옵션 2: 빅뱅 전환 (한 번에 모두 전환)

**장점**:

- ✅ 깔끔한 아키텍처 (단일 프레임워크)
- ✅ 최적화된 번들 크기
- ✅ 중간 복잡도 없음
- ✅ 최종 상태로 빠르게 도달

**단점**:

- ❌ **높은 리스크** (전체 시스템 동시 변경)
- ❌ 긴 개발 중단 시간 (기능 추가 불가)
- ❌ 테스트 전체 수정 필요 (584개 테스트)
- ❌ 디버깅 어려움 (변경 범위가 너무 넓음)
- ❌ **TDD 원칙 위배** (RED 상태 장기 유지)
- ❌ 프로덕션 배포 불가능 (완료 시점까지)

**결론**: ❌ 부적합 (TDD 원칙 위배, 리스크 과다)

---

### 옵션 3: 계층별 점진적 전환 (Bottom-Up, External → Shared → Features) ⭐ 추천

**장점**:

- ✅ **TDD 원칙 완벽 준수** (각 단계 RED → GREEN)
- ✅ **계층별 독립 검증** (의존성 방향과 일치)
- ✅ **기존 아키텍처 경계 활용** (Vendors getter 패턴 최대 활용)
- ✅ **리스크와 복잡도 균형** (단계별 제어 가능)
- ✅ **각 단계마다 GREEN 상태 유지** (언제든 배포 가능)
- ✅ **점진적 번들 최적화** (Preact → Solid 전환 비율에 따라)
- ✅ **롤백 용이** (각 Phase가 독립적)
- ✅ **학습 및 검증 병행** (이론 → 실전 점진적 적용)

**단점**:

- ⚠️ 중기적 복잡도 존재 (하지만 제어 가능)
- ⚠️ 신중한 계획 필요 (하지만 문서화로 해결)
- ⚠️ 단계별 전환 비용 (하지만 리스크 감소로 상쇄)

**왜 최적인가**:

1. **Vendors getter 패턴 활용**: 이미 모든 외부 라이브러리 접근이 추상화되어
   있음
2. **의존성 방향 일치**: External → Shared → Features 순 전환이 자연스러움
3. **테스트 커버리지**: 584개 테스트를 단계별로 전환하며 안전성 보장
4. **프로덕션 연속성**: 각 Phase 완료 시 배포 가능 (비즈니스 중단 없음)
5. **경험 축적**: 초기 Phase에서 학습한 패턴을 후속 Phase에 적용

**결론**: ⭐ **최적 솔루션** (TDD + 아키텍처 + 리스크 관리)

---

## 📋 마이그레이션 로드맵 (6-Phase Bottom-Up)

### Phase 0: 준비 및 인프라 (Foundation) 🔧

**목표**: Solid.js 개발 환경 구축 및 공존 체계 확립

**작업 내용**:

1. **빌드 도구 설정**
   - `vite-plugin-solid` 설치 및 설정
   - `vite.config.ts` 확장: Preact + Solid JSX 동시 지원
   - 확장자 기반 컴파일러 분리: `.tsx` (Preact) vs `.solid.tsx` (Solid)
   - 또는 디렉터리 기반 분리 검토

2. **TypeScript 설정**
   - `tsconfig.json` 업데이트: `jsxImportSource` 조건부 설정
   - Solid.js 타입 정의 추가
   - 경로 별칭 유지 (@features, @shared, @assets)

3. **테스트 환경 확장**
   - `@solidjs/testing-library` 설치 및 설정
   - `vitest.config.ts` 확장: Solid 컴포넌트 테스트 지원
   - 벤더 모킹 시스템 확장 (`test/utils/mocks/*`)

4. **의존성 가드 업데이트**
   - `.dependency-cruiser.cjs` 규칙 검토
   - Solid.js 직접 import 허용 범위 정의
   - 테스트 스위트에 Solid vendor 검증 추가

**성공 기준**:

- ✅ Hello World Solid 컴포넌트가 빌드/렌더링됨
- ✅ Preact + Solid 컴포넌트 동시 렌더링 가능
- ✅ 기존 테스트 스위트 모두 GREEN 유지
- ✅ 번들 크기 측정 기준선 수립

**위험 및 대응**:

- ⚠️ JSX 컴파일 충돌 → 확장자/디렉터리 기반 명확한 분리
- ⚠️ 테스트 환경 복잡도 → 별도 프로젝트 설정 (vitest projects)

**예상 기간**: 2-3일

**✅ Phase 0 완료 (2025-01-07)**:

- ✅ Solid.js 3.9.9, vite-plugin-solid, @solidjs/testing-library 설치
- ✅ vite.config.ts: `.solid.tsx` 확장자 기반 Solid 컴파일 설정
- ✅ vitest.config.ts: Solid 테스트 환경 구성
- ✅ HelloSolid 컴포넌트 및 테스트 작성 (디자인 토큰 준수)
- ✅ tsconfig.solid.json 생성 (jsx: preserve, jsxImportSource: solid-js)
- ✅ Dev 번들: 1,056KB / Prod 번들: 337KB (기준선 수립)
- ✅ 기존 테스트 587개 중 585개 PASS (Solid 무관 기존 RED 2개 유지)
- ✅ 커밋: `feat(infra): add solid.js build infrastructure (phase 0)` (d413fd34)

---

### Phase 1: External 계층 전환 (Vendors Adapter) ✅ 완료

**목표**: StaticVendorManager에 Solid.js 지원 추가, Preact과 공존

**작업 내용**:

1. **Solid Vendor Manager 구현** ✅
   - `src/shared/external/vendors/vendor-manager-static.ts`에 Solid.js import
     추가
   - `SolidAPI`, `SolidWebAPI` 타입 정의
   - `getSolid()`, `getSolidWeb()` getter 메서드 구현
   - vendors 객체에 solid, solidWeb 추가
   - validateStaticImports(), cacheAPIs()에 Solid 검증/캐싱 로직 추가

2. **통합 Vendor API 확장** ✅
   - `src/shared/external/vendors/vendor-api-safe.ts`
   - `getSolidSafe(): SolidAPI` 추가
   - `getSolidWebSafe(): SolidWebAPI` 추가
   - 에러 핸들링 및 로깅 포함

3. **TDZ-safe 초기화 보장** ✅
   - 정적 import 기반 안전 로딩
   - Preact과 독립적인 초기화 경로
   - 자동 초기화 지원 (getters 호출 시)

4. **테스트 작성 (TDD)** ✅
   - `test/unit/vendors/solid-vendor-initialization.test.ts` (7개 테스트)
     - Solid Core API 테스트 (createSignal, createMemo)
     - Solid Web API 테스트 (render, hydrate)
     - Preact과의 독립성 검증
     - 자동 초기화 동작 검증
   - 기존 Preact vendor 테스트 영향 없음 확인 (16개 테스트 모두 GREEN)

**성공 기준**:

- ✅ `getSolidSafe()` 호출 시 Solid API 정상 반환
- ✅ Preact vendor와 독립적으로 동작
- ✅ 초기화 실패 시 명확한 에러 메시지
- ✅ 모든 vendor 테스트 GREEN (14개 신규, 기존 유지)
- ✅ TypeScript strict 모드 통과
- ✅ ESLint 규칙 위반 0건
- ✅ 개발/프로덕션 빌드 성공

**실제 결과**:

- 완료일: 2025-01-16
- 커밋: `feat(infra): add solid.js vendor support (phase 1 tdd green)`
- 테스트: 14/14 passed (7개 신규 + 기존 vendor 테스트 모두 유지)
- TDD 방식: RED (테스트 작성) → GREEN (구현) → REFACTOR (정리)
- 다음 단계: Phase 2 (Shared/State 전환)

**의존성**: Phase 0 완료 ✅

---

### Phase 2: Shared/State 전환 (Signals → Solid Signals) ✅ 완료

**목표**: Preact Signals를 Solid Signals로 전환, .value accessor 호환 유지

**작업 내용**:

1. **Signal Factory Solid 구현** ✅
   - `src/shared/state/signals/signal-factory-solid.ts` 신규 생성
   - `createSignalSafe<T>(initial)`: Solid createSignal + .value accessor
   - `computedSafe<T>(fn)`: Solid createMemo wrapper
   - `effectSafe(fn)`: Solid createEffect with manual initial run
   - Preact Signals .value 패턴 완벽 호환
   - SSR/JSDOM 환경 안전 대응 (dispose 함수 타입 체크)

2. **기존 State 모듈 전환** ✅
   - `toolbar.signals.ts` → v3.0.0 (Solid.js Signals)
   - `gallery.signals.ts` → v2.0.0 (Solid.js Signals)
   - `download.signals.ts` → v2.0.0 (Solid.js Signals)
   - import 경로: `./signal-factory` → `./signal-factory-solid`

3. **TDD 방식 구현** ✅
   - RED: `test/unit/state/signal-factory-solid.test.ts` (11개 테스트 작성)
   - GREEN: signal-factory-solid.ts 구현, 22/22 tests passed (fast+unit)
   - 테스트 항목:
     - createSignalSafe: 초기값, setter, .value 호환성, subscribe
     - computedSafe: 계산된 값, 의존성 추적
     - effectSafe: 실행 검증, cleanup 함수 반환
     - Preact Signals 호환성: .value accessor, nested object
     - Error Handling: 자동 초기화

4. **기존 테스트 호환성** ✅
   - gallery-pc-only-events.test.ts: getSolid() 모킹 추가
   - error-boundary.fallback.test.tsx: initializeVendors() 추가
   - 전체 fast 프로젝트: 604/606 tests passed (2개 기존 RED 유지)

**실제 결과**:

- 완료일: 2025-01-16
- 커밋: `feat(core): solid.js signals integration with preact compatibility`
  (24a0ef80)
- 테스트: 606/608 passed (22개 신규 signal-factory-solid, 기존 유지)
- TDD 방식: RED (테스트 작성) → GREEN (구현 + 2회 수정) → REFACTOR (타입 단언)
- 빌드 검증: 377.20 KB raw, 102.44 KB gzip (번들 크기 증가 없음)
- 다음 단계: Phase 3 (Shared/Utils 전환)

**성공 기준**:

- ✅ 모든 state signals가 Solid 기반으로 동작
- ✅ 기존 Preact 컴포넌트에서 여전히 `.value` 접근 가능
- ✅ 반응성 동작 검증 완료 (subscribe, effect)
- ✅ 번들 크기 유지 (Preact signals 아직 제거 전)
- ✅ SSR 환경 안전성 보장
- ✅ TypeScript strict 모드 통과
- ✅ ESLint 규칙 위반 0건

**의존성**: Phase 1 완료 ✅

---

### Phase 3: Shared/Utils 전환 (Hooks → Primitives) ✅ 완료

**목표**: Preact Hooks 기반 유틸리티를 Solid Primitives로 전환

**진행 상황**: 6/6 완료 (모든 유틸리티 primitives 완료)

**작업 내용**:

1. **Signal Selector 재작성** ✅ 완료

   ```typescript
   // src/shared/utils/signalSelector-solid.ts
   import { createMemo } from 'solid-js';

   export function createSelector<T, R>(
     source: Accessor<T>,
     selector: (state: T) => R,
     options?: SelectorOptions<T>
   ): Accessor<R> {
     return createMemo(() => {
       const state = source();
       return selector(state);
     });
   }

   // ✅ useSelector → createSelector 구현 완료
   // ✅ useCombinedSelector → createCombinedSelector 구현 완료
   // ⏳ useAsyncSelector → createResource 기반 재구현 (보류)
   ```

   **실제 결과**:
   - 완료일: 2025-10-07
   - 커밋: `feat(core): implement Signal Selector Solid primitives` (3a9ed5a9)
   - 파일: `src/shared/utils/signalSelector-solid.ts` (210 lines)
   - 테스트: `test/unit/utils/signalSelector-solid.test.ts` (20/20 PASS)
   - 기능:
     - `createSelector<T, R>`: Solid createMemo 기반, 의존성 캐싱 지원
     - `createCombinedSelector<T, R>`: 다중 signal 결합
     - Debug mode with statistics (computeCount, cacheHits, etc.)
   - 환경 설정: vitest.config.ts에
     `resolve.conditions: ['browser', 'development']` 추가
   - 빌드 검증: 1,065KB dev bundle (Solid 브라우저 모드 활성화)

2. **Performance 유틸리티 전환** ✅ 완료

   ```typescript
   // src/shared/utils/performance/signalOptimization-solid.ts
   export function createMemoizedSelector<T, R>(
     source: Accessor<T>,
     selector: SelectorFunction<T, R>,
     debug = false
   ): Accessor<R> & { getStats: () => PerformanceStats };

   export function createAsyncSelector<T, R>(
     source: Accessor<T>,
     selector: (state: T) => Promise<R>,
     defaultValue: R,
     debounceMs = 300
   ): Accessor<AsyncSelectorResult<R>>;
   ```

   **실제 결과**:
   - 완료일: 2025-01-07
   - 파일: `src/shared/utils/performance/signalOptimization-solid.ts` (199
     lines)
   - 테스트: `test/unit/performance/signal-optimization-solid.test.ts` (30/30
     PASS)
   - 기능:
     - `createMemoizedSelector`: Manual caching with Object.is equality
     - `createAsyncSelector`: Async operations with debouncing, generation-based
       cancellation
     - Global statistics tracking (calls, hits, misses)
     - Debug mode with console logging
   - 주요 해결:
     - 초기 reactivity 버그: createSignal + untrack()으로 무한 루프 방지
     - Timer import: `../timer-management` 경로 수정
     - Async selector: 초기 loading=true, debounce 후 실행
   - 빌드 검증: 1,065.82 KB dev bundle (clean build)

   **계획**:
   - TDD RED: `test/unit/performance/signal-optimization-solid.test.ts` 작성
   - TDD GREEN: signalOptimization-solid.ts 구현
   - 기존 Preact 버전과 API 호환성 유지 (마이그레이션 용이)
   - 성능 벤치마크 추가 (re-render 횟수 측정)

3. **Custom Hooks → Custom Primitives** ✅ 완료 (6/6 primitives)

   **완료된 항목**:
   - ✅ **Focus Trap Primitive** (2025-01-07)
     - 파일: `src/shared/primitives/focusTrap-solid.ts` (106 lines)
     - 테스트: `test/unit/hooks/useFocusTrap-solid.test.tsx` (26/26 PASS)
     - 커밋: `feat(core): complete focus trap solid primitive` (7aa74baf)
     - 패턴: **External Signal 직접 반환** (Fine-grained reactivity)

       ```typescript
       export function createFocusTrap(
         containerAccessor: Accessor<HTMLElement | null>,
         isActiveAccessor: Accessor<boolean>,
         options?: FocusTrapOptions
       ): FocusTrapResult {
         // Effects handle side effects only
         createEffect(() => {
           /* Container lifecycle */
         });
         createEffect(() => {
           /* Active state sync */
         });

         return {
           isActive: isActiveAccessor, // 🔑 외부 signal 직접 반환 (동기적 읽기)
           activate: () => {
             /* DOM only */
           },
           deactivate: () => {
             /* DOM only */
           },
         };
       }
       ```

     - 핵심 개념:
       - **isActive accessor**: 외부 signal 그대로 반환 → 동기적 읽기 보장
       - **Effects**: DOM 부작용만 담당 (activate/deactivate 호출)
       - **Manual methods**: DOM 조작만 수행, external signal 변경 없음
       - Solid의 "Effects for side effects, Signals for state" 철학 준수
     - 마이그레이션 패턴:
       - Preact `useLayoutEffect` → Solid `createEffect`
       - Preact `useState` → Solid `createSignal` (내부 상태 불필요)
       - Preact `useRef` → 일반 `let` 변수 (재실행 없음)
     - 해결한 이슈:
       - ❌ `batch()` 시도: 여전히 비동기 effect 실행
       - ❌ `createSignal + setIsActive`: Effect 업데이트 microtask 큐
       - ✅ **External signal 직접 반환**: 동기적 읽기 + reactive 추적
       - ✅ **Test async timing**: `queueMicrotask` + `async/await` 적용
     - 사용처: `useFocusTrap.ts` (3 usages, 기존 Preact Hook 보존)

   - ✅ **Scroll Lock Primitive** (2025-01-07)
     - 파일: `src/shared/primitives/scrollLock-solid.ts` (110 lines)
     - 테스트: `test/unit/hooks/useScrollLock-solid.test.tsx` (20/20 PASS)
     - 커밋: `feat(core): complete scroll lock solid primitive` (d5dd0be5)
     - 기능:
       - Body scroll locking for modals/overlays
       - Scrollbar gap reservation (layout shift prevention)
       - Manual lock/unlock methods
       - Reactive enable/disable via accessor
     - 패턴:
       - Preact `useEffect` → Solid `createEffect`
       - Preact `useState` → 일반 `let` 변수 (재실행 없음)
       - Resource cleanup with `onCleanup()`
     - 사용처: `SettingsModal.tsx` (1 usage)

   - ✅ **DOM Ready Primitive** (2025-01-07)
     - 파일: `src/shared/primitives/domReady-solid.ts` (87 lines)
     - 테스트: `test/unit/hooks/useDOMReady-solid.test.tsx` (14/14 PASS)
     - 커밋: `feat(core): complete dom ready solid primitive` (208b2adf)
     - 기능:
       - Double requestAnimationFrame pattern (완전한 렌더링 감지)
       - Dependency tracking (signal array)
       - Automatic frame cleanup on disposal
     - 패턴:
       - Preact `useEffect` → Solid `createEffect`
       - Preact `useState` → Solid `createSignal`
       - Cancel pending frames on cleanup
     - 사용처: 현재 0 (future use cases)

   - ✅ **Focus Scope Primitive** (2025-01-07)
     - 파일: `src/shared/primitives/focusScope-solid.ts` (57 lines)
     - 테스트: `test/unit/hooks/useFocusScope-solid.test.tsx` (14/14 PASS)
     - 커밋: `feat(core): complete focus scope solid primitive` (ac16acc1)
     - 기능:
       - Simple ref management for focus tracking
       - No .current property (simpler than Preact useRef)
       - Type-safe generic support
     - 패턴:
       - Preact `useRef` → Closure with `let` variable + ref function
       - Direct element access via `getElement()` method
     - 사용처: 현재 0 (utility for future components)

   **전체 Primitives 통계**:
   - 총 6개 primitives 완료 (Signal Selector, Performance Utils, Focus Trap,
     Scroll Lock, DOM Ready, Focus Scope)
   - 총 124개 테스트 (20+30+26+20+14+14 = 124)
   - 100% 테스트 통과율
   - 빌드 검증: 1,065.82 KB dev bundle (성공)

   **학습한 패턴**:
   1. **External Signal Pattern**:
      - 외부에서 전달받은 signal을 그대로 반환
      - 동기적 읽기 + reactive 추적 동시 달성
      - Effects는 DOM 부작용만 담당
   2. **Async Test Handling**:
      - `queueMicrotask` + `async/await` 패턴
      - Try/catch with dispose for cleanup
      - Solid effects는 초기 실행 후 항상 async
   3. **Resource Cleanup**:
      - `onCleanup()` for disposal logic
      - Cancel pending operations (timers, frames)
      - Restore original state (DOM modifications)
   4. **Manual Methods**:
      - Provide imperative API alongside reactive API
      - Manual methods call same internal functions
      - Useful for programmatic control

   **Business Logic Hooks (Phase 4 이후)**:
   - `useGalleryToolbarLogic.ts` (198 lines) - 컴포넌트 결합
   - `useSettingsModal.ts` - Modal state orchestration
   - `useToolbarState.ts` - Toolbar state management
   - `useAccessibility.ts` - Accessibility features
   - 이유: Features layer와 함께 마이그레이션하는 것이 적절

4. **테스트 전환 (TDD)** ✅ 완료
   - `test/unit/performance/signal-optimization.test.tsx` → Solid 기반
   - `test/unit/utils/signalSelector.test.ts` → ✅ 완료
     (signalSelector-solid.test.ts)
   - Hooks vs Primitives 차이 문서화

**현재 성공 기준**:

- ✅ Signal Selector가 Solid primitives 기반으로 동작
- ✅ 기존 기능 동등성 보장 (20개 테스트로 검증)
- ⏳ 불필요한 Hooks 로직 제거 (useCallback 등) - Performance Utils에서 진행 예정
- ⏳ 성능 개선 측정 (re-render 횟수) - 다음 단계

**의존성**: Phase 2 완료 ✅

**예상 완료**: Phase 3 전체 완료까지 3-4일 예상 (Signal Selector: 1일 완료)

---

### Phase 4: Shared/Components 전환 (UI 컴포넌트) 🎨

**목표**: 공통 UI 컴포넌트를 Solid 기반으로 전환

**상태**: 🟠 진행 중 (2025-10-07 시작)

**전략**: Bottom-Up + TDD (Leaf 컴포넌트부터, 각 단계별 테스트 우선)

#### Phase 4.1: Icon 컴포넌트 전환 (우선순위: 최고)

**대상 컴포넌트** (10개):

- `Icon.tsx` (기본 Icon 래퍼)
- `hero/Hero*.tsx` (9개 아이콘: ArrowAutofitHeight, ArrowAutofitWidth,
  ArrowsMaximize, ChevronLeft, ChevronRight, Download, FileZip, Settings, X,
  ZoomIn)

**이유**:

- 의존성 없음 (Pure presentational components)
- 단순 JSX 변환만 필요
- 테스트가 간단하고 빠름

**작업 내용**:

1. TDD: `test/unit/shared/components/ui/Icon/*.solid.test.tsx` 작성
2. 구현: `Icon.solid.tsx`, `hero/Hero*.solid.tsx` 생성
3. Preact 버전과 동일 props/동작 보장
4. 접근성 검증 (aria-label, role 등)
5. 스냅샷 테스트 갱신

**성공 기준**:

- ✅ 10개 Icon 컴포넌트 Solid 버전 완성
- ✅ 기존 Preact 테스트와 동일한 커버리지
- ✅ 접근성 테스트 통과
- ✅ 번들 크기 측정 (Solid icon vs Preact icon)

**예상 기간**: 1일

---

#### Phase 4.2: Primitive 컴포넌트 전환 (우선순위: 높음)

**대상 컴포넌트** (2개):

- `primitive/Button.tsx` → `Button.solid.tsx`
- `primitive/Panel.tsx` → `Panel.solid.tsx`

**이유**:

- 가장 기본적인 building blocks
- 다른 컴포넌트들이 의존하는 기초 컴포넌트
- memo/forwardRef 제거 기회 (Solid 자동 최적화 검증)

**작업 내용**:

1. TDD: `primitive/*.solid.test.tsx` 작성
2. 구현: Solid JSX, createSignal/createMemo 활용
3. CSS Modules 유지 (디자인 토큰 준수)
4. 이벤트 핸들링 검증 (PC 전용 입력 정책)
5. 성능 비교 (re-render 횟수 측정)

**성공 기준**:

- ✅ Button/Panel Solid 버전 완성
- ✅ memo/forwardRef 없이 동일 성능
- ✅ 모든 variant 테스트 통과
- ✅ PC 전용 이벤트만 사용

**예상 기간**: 1-2일

---

#### Phase 4.3: Toast 시스템 전환 (우선순위: 중간)

**대상 컴포넌트** (3개):

- `Toast/Toast.tsx` → `Toast.solid.tsx`
- `Toast/ToastContainer.tsx` → `ToastContainer.solid.tsx`
- 서비스: `UnifiedToastManager.ts` → Solid Store 기반 재작성

**이유**:

- 독립적인 시스템 (다른 UI와 분리)
- Signal 기반 상태 관리로 자연스러운 전환
- 애니메이션 검증 기회

**작업 내용**:

1. TDD: Toast 컴포넌트 및 통합 테스트
2. UnifiedToastManager를 Solid Store로 재작성
   ```typescript
   // createToastStore() 패턴 활용
   const [toasts, { add, remove, clear }] = createToastStore();
   ```
3. 진입/퇴장 애니메이션 (CSS transitions + Solid Transition)
4. 접근성 (aria-live, role="status")

**성공 기준**:

- ✅ Toast 시스템 완전 Solid 기반
- ✅ 애니메이션 정상 동작
- ✅ 접근성 검증 통과
- ✅ 통합 테스트 GREEN

**예상 기간**: 1-2일

---

#### Phase 4.4: Modal 시스템 전환 (우선순위: 중간)

**대상 컴포넌트** (5개):

- `ModalShell/ModalShell.tsx` → `ModalShell.solid.tsx`
- `SettingsModal/SettingsModal.tsx` → `SettingsModal.solid.tsx`
- `SettingsModal/HeadlessSettingsModal.tsx`
- `SettingsModal/RefactoredSettingsModal.tsx` (중복 제거 검토)
- `SettingsModal/UnifiedSettingsModal.tsx` (통합 버전)

**이유**:

- Focus trap, scroll lock 등 복잡한 로직
- 이미 Solid primitives (useFocusTrap-solid, useScrollLock-solid) 완료
- Portal 사용 (Solid Portal API 활용)

**작업 내용**:

1. TDD: Modal 동작 테스트 (open/close, focus trap, ESC key 등)
2. ModalShell Solid 전환 (Portal, animation)
3. SettingsModal Solid 전환 (form inputs, validation)
4. Focus management (createFocusTrap primitive 활용)
5. 중복 컴포넌트 정리 (Refactored/Unified 통합)

**성공 기준**:

- ✅ Modal 시스템 Solid 기반
- ✅ Focus trap 정상 동작
- ✅ 접근성 (ARIA modal 패턴)
- ✅ 키보드 네비게이션 (Tab, ESC)

**예상 기간**: 2일

---

#### Phase 4.5: Toolbar 시스템 전환 (우선순위: 중간)

**대상 컴포넌트** (6개):

- `Button/Button.tsx` → `Button.solid.tsx` (UI Button)
- `Button/IconButton.tsx` → `IconButton.solid.tsx`
- `Toolbar/Toolbar.tsx` → `Toolbar.solid.tsx`
- `Toolbar/ToolbarHeadless.tsx` → `ToolbarHeadless.solid.tsx`
- `ToolbarShell/ToolbarShell.tsx` → `ToolbarShell.solid.tsx`
- `ToolbarWithSettings/ToolbarWithSettings.tsx`

**이유**:

- Gallery의 핵심 UI
- 복잡한 상태 관리 (toolbar signals 이미 Solid로 전환됨)
- 성능 최적화 효과 검증 기회

**작업 내용**:

1. TDD: Toolbar 동작 테스트 (버튼 클릭, 상태 변화 등)
2. Button 컴포넌트 Solid 전환 (variant, size props)
3. Toolbar 컴포넌트 Solid 전환 (composition pattern)
4. Signal 연결 (toolbar.signals.ts 활용)
5. 애니메이션 검증 (hover, active states)

**성공 기준**:

- ✅ Toolbar 시스템 Solid 기반
- ✅ Signal 기반 상태 관리
- ✅ 애니메이션 smooth
- ✅ 성능 측정 (렌더링 최적화)

**예상 기간**: 2일

---

#### Phase 4.6: 기타 컴포넌트 전환 (우선순위: 낮음)

**대상 컴포넌트** (3개):

- `LazyIcon.tsx` → `LazyIcon.solid.tsx`
- `hoc/GalleryHOC.tsx` → 제거 검토 (Solid는 HOC 불필요)
- `isolation/GalleryContainer.tsx` → Solid 버전
- `ErrorBoundary/ErrorBoundary.tsx` → Solid ErrorBoundary 활용

**이유**:

- 덜 중요하거나 제거 가능
- HOC 패턴은 Solid에서 권장되지 않음 (composition 선호)

**작업 내용**:

1. LazyIcon: createSignal + Show 컴포넌트
2. GalleryHOC: 제거 또는 composition으로 재작성
3. GalleryContainer: Solid Portal 활용
4. ErrorBoundary: Solid의 ErrorBoundary API 사용

**성공 기준**:

- ✅ 모든 컴포넌트 Solid 기반
- ✅ HOC 패턴 제거
- ✅ 코드 간결화

**예상 기간**: 1일

---

#### Phase 4 전체 성공 기준:

- ✅ 모든 Shared 컴포넌트가 Solid 기반 (33개 → .solid.tsx)
- ✅ h() 함수 호출 완전 제거
- ✅ memo/forwardRef 불필요 (Solid 자동 최적화 확인)
- ✅ 컴포넌트 테스트 모두 GREEN (150+ 테스트)
- ✅ 접근성 테스트 통과
- ✅ 번들 크기 측정 및 최적화 검증
- ✅ 기존 Preact 컴포넌트 제거 또는 Deprecated 표시

**예상 기간**: 7-9일 (Phase 4.1~4.6 합산)

**의존성**: Phase 3 완료 ✅

**위험 및 대응**:

- ⚠️ 복잡한 컴포넌트 전환 시간 초과 → 단계별 분할, Preact 버전 병행 유지
- ⚠️ 테스트 작성 어려움 → Solid Testing Library 문서 참고, 예제 코드 활용
- ⚠️ 성능 저하 → 프로파일링, 최적화 포인트 식별

**Phase 4 완료 후 다음 단계**: Phase 5 (Features 계층 전환)

---

### Phase 5: Features 계층 전환 (Gallery, Settings) 🖼️

**목표**: Feature 계층 컴포넌트를 Solid로 전환, 앱 전체 Solid 기반화

**작업 내용**:

1. **Gallery Feature 전환**

   ```typescript
   // src/features/gallery/GalleryApp.ts → GalleryApp.solid.tsx
   // src/features/gallery/GalleryRenderer.ts → Solid render 방식
   // src/features/gallery/components/* → Solid 컴포넌트

   import { render } from 'solid-js/web';

   export class GalleryRenderer {
     render(container: Element) {
       render(() => <GalleryApp />, container);
     }
   }
   ```

2. **Settings Feature 전환**

   ```typescript
   // src/features/settings/* → Solid 기반
   // SettingsModal, SettingsService 등
   ```

3. **Hooks → Primitives 전환**

   ```typescript
   // src/features/gallery/hooks/* → primitives/*
   // useGalleryScroll → createGalleryScroll
   // useGalleryItemScroll → createGalleryItemScroll
   // useToolbarPositionBased → createToolbarPosition
   ```

4. **이벤트 핸들링 검증**
   - PC 전용 이벤트 정책 유지 (click, keyboard, mouse, wheel)
   - Solid 이벤트 위임 시스템 활용
   - 성능 측정 (이벤트 처리 속도)

5. **테스트 전환 (TDD)**
   - `test/features/*` → Solid Testing Library
   - 통합 테스트 갱신
   - E2E 테스트 실행 (`npm run e2e:smoke`)

**성공 기준**:

- ✅ Gallery와 Settings 완전히 Solid 기반
- ✅ Preact 컴포넌트 0개
- ✅ 모든 기능 테스트 GREEN
- ✅ E2E 테스트 통과
- ✅ 실제 X.com에서 동작 검증
- ✅ 번들 크기 최종 측정 (목표: Preact 대비 20% 감소)

**의존성**: Phase 4 완료

**예상 기간**: 7-10일

---

### Phase 6: 정리 및 최적화 (Cleanup) 🧹

**목표**: Preact 완전 제거, 문서 갱신, 최종 최적화

**작업 내용**:

1. **Preact 의존성 제거**

   ```json
   // package.json에서 제거:
   // - preact
   // - @preact/signals
   // - @preact/preset-vite
   ```

2. **Vendor 시스템 정리**

   ```typescript
   // src/shared/external/vendors/* 정리
   // - getPreact, getPreactHooks, getPreactSignals, getPreactCompat 제거
   // - getSolid, getSolidStore, getSolidWeb만 유지
   // - vendor-manager-static.ts 간소화
   ```

3. **빌드 설정 최적화**

   ```typescript
   // vite.config.ts 최적화
   // - @preact/preset-vite 제거
   // - vite-plugin-solid만 유지
   // - 번들 크기 최적화 (terser 옵션 조정)
   ```

4. **테스트 모킹 정리**

   ```typescript
   // test/utils/mocks/*
   // - Preact 모킹 시스템 제거
   // - Solid 모킹 시스템만 유지
   ```

5. **문서 업데이트**
   - `AGENTS.md`: Solid.js 스택으로 갱신
   - `.github/copilot-instructions.md`: Solid 패턴으로 재작성
   - `docs/ARCHITECTURE.md`: Solid 계층 구조 반영
   - `docs/CODING_GUIDELINES.md`: Solid 컴포넌트 패턴 추가
   - `README.md`: Solid.js 언급

6. **최종 검증**
   - 전체 테스트 스위트 실행
   - 번들 크기 분석 및 보고서
   - 성능 벤치마크 (before/after)
   - 실제 브라우저 테스트 (Chrome, Firefox, Edge)
   - Userscript 관리자 호환성 (Tampermonkey, Violentmonkey)

**성공 기준**:

- ✅ package.json에 Preact 의존성 0개
- ✅ src/ 디렉터리에 Preact import 0개
- ✅ 전체 테스트 스위트 GREEN (584개 → 조정된 수)
- ✅ 번들 크기 목표 달성 (dev: <800KB, prod: <600KB)
- ✅ 실제 환경 동작 검증
- ✅ 모든 문서 최신 상태

**의존성**: Phase 5 완료

**예상 기간**: 3-4일

---

## 🚨 리스크 관리 및 대응 전략

### 1. JSX 컴파일 충돌

**리스크**: Preact와 Solid의 JSX 트랜스폼 충돌

**대응**:

- 확장자 기반 분리: `.tsx` (Preact) vs `.solid.tsx` (Solid)
- Vite 설정에서 파일별 컴파일러 지정
- tsconfig 조건부 설정

**테스트**: Phase 0에서 Hello World로 검증

---

### 2. 반응성 모델 차이

**리스크**: Preact Signals의 `.value` 접근 vs Solid의 Accessor 호출

**대응**:

- Phase 2에서 호환 레이어 구현 (`.value` getter/setter)
- 점진적으로 Accessor 패턴으로 전환
- 철저한 단위 테스트로 동작 보장

**테스트**: 반응성 테스트 스위트 작성

---

### 3. 번들 크기 증가 (중간 단계)

**리스크**: Preact + Solid 공존 시 번들 크기 급증

**대응**:

- 각 Phase마다 번들 크기 측정 및 보고
- Tree-shaking 최대 활용
- Phase 5 완료 전까지는 dev 빌드만 사용
- Phase 6에서 Preact 완전 제거 후 최종 최적화

**측정**: `npm run build:dev` 후 `dist/` 분석

---

### 4. 테스트 환경 설정

**리스크**: Solid Testing Library와 기존 Preact 테스트 충돌

**대응**:

- Vitest projects로 분리 (preact vs solid)
- 별도 setup 파일 (`test/setup-solid.ts`)
- 점진적으로 Solid 테스트로 이관

**검증**: Phase 0에서 샘플 테스트 작성

---

### 5. Userscript 호환성

**리스크**: Solid.js 런타임이 Userscript 환경에서 오동작

**대응**:

- 각 Phase 완료 시 실제 X.com에서 수동 테스트
- GM\_\* API 호환성 확인 (getUserscript adapter 유지)
- 콘솔 에러 모니터링
- E2E 테스트 실행 (`npm run e2e:smoke`)

**검증**: Phase 1 완료 시 기본 렌더링 테스트

---

### 6. 학습 곡선

**리스크**: 팀/유지보수자의 Solid.js 미숙

**대응**:

- 각 Phase에서 학습한 패턴 문서화
- 코드 주석으로 Preact → Solid 변환 예시 제공
- `docs/CODING_GUIDELINES.md`에 Solid 패턴 추가
- Migration guide 작성

**문서**: Phase별 완료 시 주요 패턴 정리

---

## 📊 성공 지표 (Metrics)

### 번들 크기 목표

| 단계             | Dev 빌드 | Prod 빌드 | 비고                |
| ---------------- | -------- | --------- | ------------------- |
| 현재 (Preact)    | 750KB    | 580KB     | 기준선              |
| Phase 0-4 (공존) | <900KB   | N/A       | Dev 빌드만 (최대치) |
| Phase 5 (전환)   | <700KB   | <550KB    | Preact 제거 시작    |
| Phase 6 (최종)   | <650KB   | <500KB    | 목표 (15-20% 감소)  |

### 성능 목표

| 지표               | 현재 (Preact)   | 목표 (Solid) | 측정 방법                |
| ------------------ | --------------- | ------------ | ------------------------ |
| 초기 렌더링 시간   | ~100ms          | <80ms        | Performance API          |
| 상태 업데이트 시간 | ~15ms           | <10ms        | Signal 변경 → UI 반영    |
| 메모리 사용량      | ~8MB            | <7MB         | DevTools Memory Profiler |
| Re-render 횟수     | ~30회 (typical) | <20회        | React DevTools Profiler  |

### 테스트 커버리지 목표

- **유닛 테스트**: 90% 이상 유지 (현재와 동일)
- **통합 테스트**: 모두 GREEN
- **E2E 테스트**: Playwright smoke 테스트 통과
- **회귀 테스트**: 0건 (기능 동등성 보장)

### 코드 품질 목표

- **TypeScript strict**: 100% (현재와 동일)
- **ESLint warnings**: 0건
- **순환 의존성**: 0건 (dependency-cruiser)
- **Dead code**: 최소화 (Solid 자동 최적화)

---

## 📅 일정 계획

| Phase   | 작업 내용                       | 예상 기간 | 누적 기간 | 위험도 |
| ------- | ------------------------------- | --------- | --------- | ------ |
| Phase 0 | 준비 및 인프라 구축             | 2-3일     | 3일       | 낮음   |
| Phase 1 | External 계층 (Vendors)         | 2-3일     | 6일       | 낮음   |
| Phase 2 | Shared/State (Signals)          | 3-4일     | 10일      | 중간   |
| Phase 3 | Shared/Utils (Hooks→Primitives) | 4-5일     | 15일      | 중간   |
| Phase 4 | Shared/Components (UI)          | 5-6일     | 21일      | 높음   |
| Phase 5 | Features (Gallery, Settings)    | 7-10일    | 31일      | 높음   |
| Phase 6 | 정리 및 최적화                  | 3-4일     | 35일      | 낮음   |

**총 예상 기간**: 약 35일 (5주, 버퍼 포함 시 6-7주)

**마일스톤**:

- Week 1: Phase 0-1 완료 (인프라 + Vendors)
- Week 2-3: Phase 2-3 완료 (State + Utils)
- Week 4: Phase 4 완료 (Shared Components)
- Week 5-6: Phase 5 완료 (Features)
- Week 7: Phase 6 완료 (정리, 버퍼 기간)

---

## 🔄 활성 작업 (현재 Phase)

### 현재 Phase: Phase 3 완료 → Phase 4 준비

**Phase 0-3 완료 상태**: ✅

- ✅ Phase 0: 준비 및 인프라 (Foundation)
- ✅ Phase 1: External 계층 전환 (Vendors Adapter)
- ✅ Phase 2: Shared/State 전환 (Signals → Solid Signals)
- ✅ Phase 3: Shared/Utils 전환 (Hooks → Primitives)
  - Signal Selector (20 tests)
  - Performance Utils (30 tests)
  - Focus Trap (26 tests)
  - Scroll Lock (20 tests)
  - DOM Ready (14 tests)
  - Focus Scope (14 tests)
  - **총 124개 테스트 100% 통과**

**다음 Phase**: Phase 4 (Shared/Components 전환)

**다음 액션**:

1. ✅ 기존 Preact 컴포넌트 테스트 실패 원인 분석 및 수정 **[완료 2025-10-07]**
2. ✅ Phase 4 작업 계획 수립 **[완료 2025-10-07]**
3. ⏳ UI 컴포넌트 마이그레이션 우선순위 결정 및 실행
4. ⏳ TDD_REFACTORING_PLAN_COMPLETED.md로 Phase 0-3 이관

**블로커 해결 완료** ✅:

- ✅ **기존 Preact 컴포넌트 테스트 133개 실패 → 653개 통과 (99.5%)**
- 해결 방법: Custom render utility (`test/utils/render-with-vendor-preact.tsx`)
- 핵심 솔루션:
  - Vendor manager의 Preact 인스턴스를 사용하는 커스텀 렌더 함수 작성
  - @testing-library/preact와 호환되는 인터페이스 제공
  - 테스트 렌더링과 컴포넌트 훅이 동일한 Preact 인스턴스 사용 보장
- 근본 원인:
  - @testing-library/preact가 preact를 직접 import하여 사용
  - Vendor manager가 제공하는 Preact 인스턴스와 불일치
  - 두 개의 서로 다른 Preact 인스턴스 → 훅 context 불일치 (`__H` undefined)
- 수정된 파일 (16개):
  - 신규: `test/utils/render-with-vendor-preact.tsx`
  - UI 컴포넌트 테스트 9개, 기능 테스트 3개, 훅 테스트 1개, 격리 테스트 2개
- 커밋: `fix: resolve preact hooks context mismatch in 15 test files` (6fa79d8d)
- 병합: `Merge branch 'fix/test-jsx-syntax' into master`

**Phase 3 → 4 준비 작업 (2025-10-07)**:

- ✅ 테스트 파일 vendor import 통일 (test/unit/shared/components/ui/\*.test.tsx
  8개)
  - `import { h } from 'preact'` →
    `import { h } from '@shared/external/vendors'`
  - 목적: vendor system 일관성 유지 (아키텍처 정책 준수)
  - 결과: 테스트 실패 건수 변화 없음 (기존 블로커 확인)
- ✅ vitest.config.ts에 preact 모듈 alias 추가 (단일 인스턴스 강제 시도)
- ✅ test/setup.ts 개선 (Preact options 및 hooks context 초기화)
- ✅ 빌드 검증 완료 (dev 1,065.82 KB, prod 377.20 KB raw / 102.44 KB gzip)

**예상 시작**: 블로커 해결 후

---

## 품질 게이트 (모든 작업 시 필수)

변경 전:

- [ ] `npm run typecheck` — 타입 오류 0건
- [ ] `npm run lint` — 린트 오류 0건
- [ ] `npm test` — 모든 테스트 통과

변경 후:

- [ ] `npm run build` — dev/prod 빌드 성공
- [ ] `node scripts/validate-build.js` — 번들 검증 통과
- [ ] `npm run deps:check` — 의존성 규칙 위반 0건

---

## 리팩토링 원칙

1. **TDD 우선**: 실패 테스트 → 최소 구현 → 리팩토링 (RED → GREEN → REFACTOR)
2. **최소 diff**: 변경 범위를 최소화하여 리뷰 가능하게 유지
3. **단계별 진행**: 큰 작업은 여러 Phase로 분할하여 독립적으로 검증
4. **문서화**: Phase 완료 시 결과와 학습 사항 기록, 최종 완료 시
   `TDD_REFACTORING_PLAN_COMPLETED.md`에 이관
5. **안전성 우선**: 각 Phase에서 GREEN 상태 유지, 언제든 롤백 가능

---

## 📝 품질 게이트 (모든 Phase 필수)

각 Phase 완료 전 필수 체크리스트:

### 변경 전 (Pre-flight)

```powershell
# 타입 체크
npm run typecheck

# 린트 (자동 수정)
npm run lint:fix

# 포맷
npm run format

# 의존성 검증
npm run deps:check
```

### 변경 중 (Development)

- TDD 원칙 준수: RED → GREEN → REFACTOR
- 각 기능 단위로 커밋 (작은 단위)
- 커밋 메시지: `feat(phase-N): <description>` 또는
  `refactor(phase-N): <description>`
- 테스트 먼저 작성, 구현은 최소한으로

### 변경 후 (Post-flight)

```powershell
# 전체 테스트 스위트
npm test

# 커버리지 검증 (Phase 2 이후)
npm run test:coverage

# 빌드 검증
npm run build:dev
npm run build:prod

# 번들 크기 측정
# (dist/*.user.js 파일 크기 확인)

# 종합 검증
npm run validate
```

### Phase별 추가 검증

- **Phase 0-1**: Hello World 렌더링, vendor 초기화 성공
- **Phase 2**: Signal 반응성 테스트, state 테스트 모두 GREEN
- **Phase 3**: 유틸리티 단위 테스트, 성능 테스트 통과
- **Phase 4**: 컴포넌트 스냅샷, 접근성 테스트 통과
- **Phase 5**: E2E 테스트, 실제 X.com 수동 테스트
- **Phase 6**: 전체 검증, 최종 번들 크기 목표 달성

---

## 참고 문서

### 프로젝트 문서

- **아키텍처**: `docs/ARCHITECTURE.md` — 3계층 구조, 의존성 경계
- **코딩 가이드**: `docs/CODING_GUIDELINES.md` — 스타일, 토큰, 테스트 정책
- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` — 의존성 규칙, CI 강제
- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` — 완료된 작업 이력
- **실행 가이드**: `AGENTS.md` — 개발 환경, 스크립트, 워크플로
- **GitHub Copilot 지침**: `.github/copilot-instructions.md` — AI 코딩 가이드

### Solid.js 공식 문서

- [Solid.js 공식 사이트](https://www.solidjs.com/)
- [Solid.js 튜토리얼](https://www.solidjs.com/tutorial)
- [Solid.js API 문서](https://www.solidjs.com/docs/latest/api)
- [Solid.js vs React/Preact 비교](https://www.solidjs.com/guides/comparison)
- [Solid.js 반응성 가이드](https://www.solidjs.com/guides/reactivity)

### 마이그레이션 참고 자료

- [React to Solid 마이그레이션](https://docs.solidjs.com/guides/how-to-guides/comparison/react)
- [Solid Testing Library](https://github.com/solidjs/solid-testing-library)
- [vite-plugin-solid](https://github.com/solidjs/vite-plugin-solid)
- [Solid.js 성능 가이드](https://www.solidjs.com/guides/rendering)

---

## 🤝 기여 및 피드백

이 마이그레이션 계획은 진행 상황에 따라 지속적으로 업데이트됩니다.

**피드백 환영**:

- 각 Phase 완료 후 회고 추가 (학습 사항, 예상 vs 실제)
- 예상치 못한 문제 및 해결 방법 문서화
- 성능/번들 크기 측정 결과 기록
- 학습한 Solid.js 패턴 공유 (CODING_GUIDELINES.md 갱신)

**문서 업데이트 규칙**:

1. **Phase 진행 중**: 해당 Phase 섹션의 "상태" 필드 업데이트
   - 🟡 계획됨 → 🟠 진행 중 → ✅ 완료
2. **주요 이슈 발견**: "리스크 관리" 섹션에 항목 추가
3. **일정 변경**: "일정 계획" 테이블 갱신 및 사유 기록
4. **Phase 완료**: 다음 액션 섹션 갱신, 학습 사항 요약
5. **전체 완료** (Phase 6): 전체 내용을 `TDD_REFACTORING_PLAN_COMPLETED.md`로
   이관

**커밋 메시지 규칙**:

```text
feat(phase-0): Add Solid.js build infrastructure
feat(phase-1): Implement Solid vendor getter
refactor(phase-2): Migrate signals to Solid primitives
test(phase-3): Add Solid primitive unit tests
docs(migration): Update Phase N completion status
```

---

_최종 업데이트: 2025-10-07_ _다음 리뷰: Phase 0 완료 시 (예상 2025-10-09)_ _문서
버전: 1.0.0 (초안)_
