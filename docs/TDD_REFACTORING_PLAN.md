# TDD 리팩토링 활성 계획 (2025-10-09 갱신)

> **현재 상태**: Preact → Solid.js 마이그레이션 계획 수립 완료

---

## 프로젝트 현황 (2025-10-09 기준)

### 코드 품질 현황

- ✅ **빌드**: dev/prod 빌드 정상 동작, postbuild validator 통과
- ✅ **테스트**: 전체 테스트 스위트 GREEN (124 파일 / 584 테스트)
- ✅ **타입**: TypeScript strict 모드 100% 적용
- ✅ **린트**: ESLint 규칙 위반 0건
- ✅ **의존성**: dependency-cruiser 순환 의존성 위반 0건

### 현재 기술 스택

- **UI 프레임워크**: Preact 10.27.2
- **상태 관리**: @preact/signals 2.3.2
- **번들러**: Vite 7
- **타입시스템**: TypeScript strict
- **테스트**: Vitest 3 + JSDOM (584 테스트)

### 마이그레이션 배경

Preact + @preact/signals에서 Solid.js로 전환하여 다음 이점을 달성:

1. **성능 향상**: 진정한 fine-grained reactivity (Virtual DOM 제거)
2. **번들 크기 축소**: Solid.js의 컴파일 타임 최적화
3. **개발 경험 개선**: Signals가 1급 시민, 더 나은 TypeScript 지원
4. **아키텍처 단순화**: Preact + signals 분리 → Solid 통합 시스템

---

## 마이그레이션 전략 분석

### Option A: 점진적 마이그레이션 (Hybrid)

**장점:**

- 단계별 검증으로 위험 분산
- 부분 롤백 가능

**단점:**

- 두 라이브러리 동시 유지로 번들 크기 증가 (70KB+ 오버헤드)
- Preact/Solid 간 호환 레이어 없음 (상호운용 불가)
- 중간 상태 복잡성 증가

**실현성:** ❌ 불가능 (호환 레이어 부재)

### Option B: 빅뱅 마이그레이션 (All-at-once)

**장점:**

- 깔끔한 전환, 중간 상태 없음
- 최종 번들 크기 최소화
- 기존 vendor getter 패턴 활용 가능

**단점:**

- 큰 변경 범위 (전체 컴포넌트 + 584개 테스트)
- 높은 초기 투자 비용

**실현성:** ✅ 가능 (우수한 테스트 커버리지로 회귀 검증 가능)

### Option C: Adapter 패턴 (현재 Vendor 시스템 확장)

**장점:**

- 기존 아키텍처 유지 (getter 패턴)
- 점진적 내부 전환 가능

**단점:**

- 추상화 오버헤드
- Solid의 fine-grained reactivity 이점 제한

**실현성:** ✅ 높음

---

## 선택된 전략: **Option B + Adapter 패턴**

**근거:**

1. **기존 아키텍처 활용**: `StaticVendorManager`의 getter 패턴이 이미 잘 설계됨
2. **테스트 커버리지**: 584개 테스트로 회귀 검증 가능
3. **번들 효율성**: 단일 라이브러리 유지로 크기 최적화
4. **개념 유사성**: Solid의 `createSignal` ↔ Preact의 `signal`

---

## 활성 작업: Preact → Solid.js 마이그레이션

### Phase 1: 환경 준비 및 의존성 전환 🔴 진행 예정

**목표**: Vite 설정, 의존성, 타입 정의 전환

**작업 항목:**

1. **의존성 변경**
   - [ ] `solid-js` 설치
   - [ ] `vite-plugin-solid` 설치
   - [ ] `preact`, `@preact/signals`, `@preact/preset-vite` 제거
   - [ ] `package.json` 업데이트

2. **Vite 설정 수정**
   - [ ] `vite.config.ts`: `@preact/preset-vite` → `vite-plugin-solid`로 교체
   - [ ] JSX 컴파일 설정 변경 (`jsxImportSource: "solid-js"`)
   - [ ] Userscript 번들링 검증 (단일 파일 출력 유지)

3. **TypeScript 설정**
   - [ ] `tsconfig.json`: `jsx: "react-jsx"` → `jsx: "preserve"`
   - [ ] `jsxImportSource: "solid-js"` 추가
   - [ ] Solid 타입 정의 import

**수용 기준:**

- `npm run typecheck` 통과 (타입 오류 0건)
- `npm run build:dev` 성공 (경고 허용)
- 테스트는 Phase 2 이후 수정

**예상 영향 범위:**

- `package.json` (1개)
- `vite.config.ts` (1개)
- `tsconfig.json` (1개)

---

### Phase 2: Vendor 어댑터 전환 🔴 대기 중

**목표**: `StaticVendorManager`를 Solid.js 기반으로 재구현

**작업 항목:**

1. **Vendor Manager 재작성**
   - [ ] `vendor-manager-static.ts`: Solid.js import로 교체

     ```ts
     // Before
     import * as preact from 'preact';
     import * as preactSignals from '@preact/signals';

     // After
     import { render, createSignal, createEffect, createMemo, ... } from 'solid-js';
     import { createStore } from 'solid-js/store';
     ```

   - [ ] API 인터페이스 매핑 정의:
     - `getSolid()`: render, createComponent, Show, For 등
     - `getSolidSignals()`: createSignal, createEffect, createMemo, batch
     - `getSolidStore()`: createStore, produce (복잡한 상태용)

2. **Getter 함수 재작성**
   - [ ] `vendor-api-safe.ts`: Solid API 노출
   - [ ] 기존 `getPreact()` → `getSolid()`로 교체
   - [ ] 기존 `getPreactSignals()` → `getSolidSignals()`로 교체
   - [ ] 기존 `getPreactCompat()` 제거 (Solid에서 불필요)

3. **타입 정의 갱신**
   - [ ] `PreactAPI` → `SolidAPI` 인터페이스 재정의
   - [ ] `PreactSignalsAPI` → `SolidSignalsAPI`
   - [ ] `VNode` → Solid의 `JSX.Element`로 교체

**수용 기준:**

- `npm run typecheck` 통과
- Vendor getter 호출 시 Solid API 반환
- 테스트 모킹 준비 (Phase 5)

**예상 영향 범위:**

- `src/shared/external/vendors/*` (5개 파일)

---

### Phase 3: Signals 레이어 마이그레이션 🔴 대기 중

**목표**: `src/shared/state/signals/*`의 모든 signal을 Solid의 `createSignal`로
전환

**작업 항목:**

1. **Signal 팩토리 전환**
   - [ ] `signal-factory.ts`: `createSignalSafe` → Solid 기반으로 재작성

     ```ts
     // Before
     const { signal } = getPreactSignals();
     export const mySignal = signal(initialValue);

     // After
     const { createSignal } = getSolidSignals();
     export const [myValue, setMyValue] = createSignal(initialValue);
     ```

2. **Computed 값 전환**
   - [ ] `computed()` → `createMemo()` 교체
   - [ ] 반응성 의존성 자동 추적 검증

3. **Effect 전환**
   - [ ] `effect()` → `createEffect()` 교체
   - [ ] 클린업 함수 패턴 통일

4. **Batch 업데이트**
   - [ ] `batch()` → Solid의 `batch()` 교체

**수용 기준:**

- 모든 signals 파일 타입 오류 0건
- Signal 구독/변경 동작 유지
- Phase 5에서 통합 테스트

**예상 영향 범위:**

- `src/shared/state/signals/*` (약 10개 파일)
- `src/shared/utils/signalSelector.ts` (selector 유틸)

---

### Phase 4: 컴포넌트 마이그레이션 🔴 대기 중

**목표**: 모든 Preact 컴포넌트를 Solid.js 컴포넌트로 전환

**작업 항목:**

1. **Hooks → Primitives 매핑**
   - [ ] `useState` → `createSignal`
   - [ ] `useEffect` → `createEffect`
   - [ ] `useMemo` → `createMemo`
   - [ ] `useCallback` → 불필요 (Solid는 자동 메모이제이션)
   - [ ] `useRef` → 직접 변수 사용 또는 signal
   - [ ] `useContext` → `useContext` (Solid도 동일 API)

2. **JSX 패턴 변경**
   - [ ] `className` → `class`
   - [ ] 이벤트 핸들러: `onClick` → `onClick` (동일하나 바인딩 방식 확인)
   - [ ] 조건부 렌더링: `{condition && <Component />}` →
         `<Show when={condition}><Component /></Show>`
   - [ ] 리스트 렌더링: `.map()` → `<For each={items}>{item => ...}</For>`

3. **컴포넌트별 전환**
   - [ ] `src/features/gallery/*` (Gallery 기능)
   - [ ] `src/features/settings/*` (Settings 기능)
   - [ ] `src/shared/components/*` (공통 컴포넌트)

4. **Props 타입 정의**
   - [ ] `ComponentProps` → Solid의 `JSX.IntrinsicElements` 기반으로 재정의

**수용 기준:**

- 모든 `.tsx` 파일 타입 오류 0건
- 컴포넌트 렌더링 로직 동일 동작
- Phase 5에서 E2E 검증

**예상 영향 범위:**

- `src/features/**/*.tsx` (약 30개 파일)
- `src/shared/components/**/*.tsx` (약 20개 파일)

---

### Phase 5: 테스트 수정 및 검증 🔴 대기 중

**목표**: 584개 모든 테스트를 Solid.js 기반으로 수정하고 GREEN 달성

**작업 항목:**

1. **테스트 유틸 전환**
   - [ ] `@testing-library/preact` → `@testing-library/solid` 교체
   - [ ] `renderHook` → Solid 버전으로 교체
   - [ ] Mock vendors: `mockPreactAPI` → `mockSolidAPI`

2. **테스트 패턴 수정**
   - [ ] Signal 테스트: `signal.value` 접근 → `[value, setValue]` 패턴
   - [ ] Effect 테스트: 반응성 추적 검증
   - [ ] 컴포넌트 마운트: `render()` 호출 방식 확인

3. **테스트 파일 일괄 수정**
   - [ ] `test/unit/**/*.test.{ts,tsx}` (약 50개)
   - [ ] `test/integration/**/*.test.{ts,tsx}` (약 30개)
   - [ ] `test/components/**/*.test.{ts,tsx}` (약 20개)
   - [ ] 나머지 테스트 파일 (24개)

4. **분할 검증**
   - [ ] `npm run test:smoke` GREEN
   - [ ] `npm run test:fast` GREEN
   - [ ] `npm run test:unit` GREEN
   - [ ] `npm run test:full` GREEN (584개 전체)

**수용 기준:**

- 모든 테스트 스위트 GREEN
- 커버리지 유지 또는 개선
- 회귀 버그 0건

**예상 영향 범위:**

- `test/**/*.{test,spec}.{ts,tsx}` (124개 파일)

---

### Phase 6: 문서 갱신 및 최종 검증 🔴 대기 중

**목표**: 문서 업데이트, 라이선스, 빌드 검증, 릴리즈 준비

**작업 항목:**

1. **개발 문서 갱신**
   - [ ] `AGENTS.md`: Preact → Solid.js 스택 명시
   - [ ] `docs/ARCHITECTURE.md`: Vendor 시스템 설명 갱신
   - [ ] `docs/CODING_GUIDELINES.md`: 컴포넌트 패턴 예시 교체
   - [ ] `.github/copilot-instructions.md`: Solid.js 규칙 추가

2. **라이선스 문서**
   - [ ] `LICENSES/preact-MIT.txt` 제거
   - [ ] `LICENSES/preact-signals-MIT.txt` 제거
   - [ ] `LICENSES/solid-js-MIT.txt` 추가

3. **빌드 및 배포**
   - [ ] `npm run build:dev` 검증
   - [ ] `npm run build:prod` 검증
   - [ ] `node ./scripts/validate-build.js` 통과
   - [ ] Userscript 메타데이터 갱신 (버전, 설명)

4. **종합 품질 검증**
   - [ ] `npm run validate` 통과
   - [ ] `npm run deps:all` 통과
   - [ ] `npm test` 전체 통과
   - [ ] E2E 스모크 테스트: `npm run e2e:smoke`

**수용 기준:**

- 모든 문서가 Solid.js 기준으로 갱신됨
- 빌드 산출물이 정상 동작 (dev/prod)
- 라이선스 준수

**예상 영향 범위:**

- `docs/**/*.md` (5개)
- `LICENSES/*` (3개)
- `README.md` (1개)

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

## 리팩토링 원칙 (참고)

1. **TDD 우선**: 실패 테스트 → 최소 구현 → 리팩토링
2. **최소 diff**: 변경 범위를 최소화하여 리뷰 가능하게 유지
3. **단계별 진행**: 큰 작업은 여러 단계로 분할하여 검증
4. **문서화**: 완료 시 `TDD_REFACTORING_PLAN_COMPLETED.md`에 이관

---

## 참고 문서

- **아키텍처**: `docs/ARCHITECTURE.md` — 3계층 구조, 의존성 경계
- **코딩 가이드**: `docs/CODING_GUIDELINES.md` — 스타일, 토큰, 테스트 정책
- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` — 의존성 규칙, CI 강제
- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` — 완료된 작업 이력
- **실행 가이드**: `AGENTS.md` — 개발 환경, 스크립트, 워크플로
