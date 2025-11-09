# Browser 테스트 전략: Solid.js 반응성 확장

> Phase B1 - Browser 테스트 확장 계획
>
> **작성일**: 2025-10-21 **목적**: JSDOM에서 검증 불가능한 Solid.js fine-grained
> reactivity 시나리오 커버

---

## 현황 분석

### 기존 Browser 테스트 (103개 테스트, 13개 파일)

**반응성 테스트 (8개)**:

- `solid-reactivity.test.ts` (3개): Signal, Store, Nested Effects
- `store-reactivity.test.ts` (5개): Nested props, Array mutations, Batch
  updates, Conditional rendering, Fine-grained tracking

**기타 테스트 (95개)**:

- 스크롤 체이닝 (46개): propagation, gallery-resize, concurrent-input,
  animation-interaction
- 브라우저 API (24개): resize-observer, mutation-observer, layout-calculation
- UI 인터랙션 (22개): focus-management, event-handling, animation-transitions
- 컴포넌트 특화 (3개): vertical-gallery-fit-mode

---

## 식별된 갭

### P0 (핵심 누락 - 프로젝트에서 사용 중)

#### 1. **createMemo 메모이제이션**

- **현재 상태**: ❌ 테스트 없음
- **프로젝트 사용처**:
  - `shared/utils/signal-selector.ts` (2회)
  - `shared/utils/performance/signal-optimization.ts` (3회)
  - `shared/state/signals/signal-factory.ts` (1회)
- **테스트 필요성**: 파생 값 계산 최적화, 불필요한 재계산 방지 검증
- **예상 시나리오**:
  - Memo가 의존성 변경 시에만 재계산되는지 확인
  - 동일 입력에 대해 재계산을 건너뛰는지 확인
  - 복잡한 계산을 메모이제이션으로 최적화

#### 2. **onCleanup 정리 로직**

- **현재 상태**: ❌ 테스트 없음
- **프로젝트 사용처**:
  - `shared/utils/signal-selector.ts` (1회)
  - `shared/utils/performance/signal-optimization.ts` (2회)
  - 여러 훅에서 이벤트 리스너/타이머 정리에 사용
- **테스트 필요성**: Effect cleanup 실행 검증, 메모리 누수 방지
- **예상 시나리오**:
  - Effect 재실행 시 cleanup 호출 확인
  - 컴포넌트 언마운트 시 cleanup 실행
  - 타이머/이벤트 리스너 정리 검증

#### 3. **createRoot / batch API**

- **현재 상태**: ❌ 테스트 없음
- **프로젝트 사용처**:
  - `gallery.signals.ts` (batch 사용)
  - `toolbar.signals.ts` (createRoot 사용)
  - `signal-factory.ts` (createRoot 3회)
- **테스트 필요성**: 반응성 컨텍스트 격리, 일괄 업데이트 성능
- **예상 시나리오**:
  - createRoot로 격리된 반응성 컨텍스트
  - batch로 여러 Signal 업데이트를 하나의 Effect 실행으로 통합
  - dispose로 정리 검증

### P1 (중요 누락 - 컴포넌트에서 사용)

#### 4. **Show 조건부 렌더링**

- **현재 상태**: ⚠️ 일반 if/else는 있지만 Show 컴포넌트는 없음
- **프로젝트 사용처**: 여러 컴포넌트에서 사용 가능 (코드에서 명시적으로 확인 안
  됨)
- **테스트 필요성**: Show 컴포넌트의 반응성, fallback 처리
- **예상 시나리오**:
  - when prop 변경 시 children/fallback 전환
  - keyed prop으로 완전 재마운트
  - 비동기 조건 처리

#### 5. **For 리스트 렌더링**

- **현재 상태**: ⚠️ Array mutations는 있지만 For 컴포넌트는 없음
- **프로젝트 사용처**:
  - `VerticalGalleryView.tsx` (1회)
- **테스트 필요성**: For의 참조 안정성, 최적화 검증
- **예상 시나리오**:
  - 아이템 추가/제거 시 최소한의 DOM 업데이트
  - 참조 기반 key 관리
  - Index와의 차이점 검증

#### 6. **createResource 비동기 반응성**

- **현재 상태**: ❌ 테스트 없음
- **프로젝트 사용처**: 명시적 사용 확인 안 됨 (미래 확장 가능)
- **테스트 필요성**: 비동기 데이터 로딩 반응성
- **예상 시나리오**:
  - 비동기 fetcher 호출 및 로딩 상태
  - 재요청 트리거 (refetch)
  - 에러 처리 및 재시도

---

## 신규 테스트 계획

### 신규 파일: `test/browser/solid-reactivity-advanced.test.ts`

**6개 신규 테스트**:

1. **createMemo should memoize derived values efficiently**

   ```typescript
   // 복잡한 계산을 createMemo로 최적화
   // 의존성 미변경 시 재계산 건너뛰기 검증
   // 계산 횟수 카운터로 메모이제이션 확인
   ```

2. **onCleanup should execute cleanup logic correctly**

   ```typescript
   // Effect 재실행 시 cleanup 호출
   // 타이머/이벤트 리스너 정리 검증
   // 메모리 누수 방지 확인
   ```

3. **createRoot should isolate reactivity context**

   ```typescript
   // 격리된 반응성 컨텍스트 생성
   // dispose로 전체 트리 정리
   // 부모 Effect에 영향 없음 확인
   ```

4. **batch should optimize multiple signal updates**

   ```typescript
   // 여러 Signal을 batch로 일괄 업데이트
   // Effect가 1회만 실행되는지 검증
   // 성능 향상 측정 (개별 업데이트 vs batch)
   ```

5. **For should render lists with reference stability**

   ```typescript
   // For 컴포넌트로 리스트 렌더링
   // 아이템 추가 시 기존 DOM 유지 검증
   // Index 컴포넌트와 비교
   ```

6. **Show should handle conditional rendering reactively**

   ```typescript
   // Show 컴포넌트 when prop 반응성
   // fallback prop 동작 확인
   // keyed prop으로 재마운트 검증
   ```

---

## 우선순위 및 일정

### Phase B1 범위

- **P0 (필수)**: createMemo, onCleanup, createRoot/batch (4개 테스트)
- **P1 (권장)**: For, Show (2개 테스트)
- **총 6개 신규 테스트** → 103개 + 6개 = **109개 Browser 테스트**

### Phase B2 이후 (선택)

- **P2**: createResource (비동기 반응성)
- **P2**: Portal (DOM 이동 시 반응성 유지)
- **P2**: ErrorBoundary (에러 복구 후 반응성)

---

## 구현 가이드라인

### 테스트 패턴

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getSolid } from '@shared/external/vendors';

const { createSignal, createMemo, createEffect, onCleanup } = getSolid();

describe('Solid.js Advanced Reactivity in Browser', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  // 각 테스트...
});
```

### 검증 포인트

- ✅ DOM 업데이트가 실제로 발생하는지 확인 (textContent, classList 등)
- ✅ Effect/Memo 실행 횟수를 카운터로 추적
- ✅ 비동기 업데이트는 `await new Promise(resolve => setTimeout(resolve, 0))` 후
  검증
- ✅ Cleanup은 플래그 변수로 실행 여부 확인
- ✅ Performance는 실행 횟수 비교 (batch vs individual)

### JSDOM vs Browser 차이점

- **JSDOM**: Solid.js 반응성이 제한적, microtask 처리 불완전
- **Browser (Vitest + Chromium)**: 완전한 반응성 시스템, 실제 렌더링 파이프라인
- **본 테스트는 Browser에서만 실행** (`vitest.config.ts`의 `browser` project)

---

## 성공 기준

### Phase B1 완료 조건

- [x] 현재 테스트 현황 분석 완료 (103개 테스트 파악)
- [ ] 신규 테스트 파일 생성 (`solid-reactivity-advanced.test.ts`)
- [ ] 6개 신규 테스트 구현 (P0 4개 + P1 2개)
- [ ] 모든 신규 테스트 PASS (Browser project)
- [ ] 기존 103개 테스트도 여전히 PASS (회귀 없음)
- [ ] 전체 109개 Browser 테스트 실행 시간 < 2분 (현재 1분 30초 예상)

### 품질 검증

- 각 테스트는 독립적으로 실행 가능해야 함
- cleanup이 완전히 수행되어 테스트 간 간섭 없어야 함
- 타임아웃 없이 안정적으로 PASS해야 함

---

## 참고 문서

- [docs/SOLID_REACTIVITY_LESSONS.md](../../docs/SOLID_REACTIVITY_LESSONS.md) -
  Phase 80.1 경험 기반 교훈
- [docs/TESTING_STRATEGY.md](../../docs/TESTING_STRATEGY.md) - JSDOM vs Browser
  선택 기준
- [test/browser/README.md](./README.md) - Browser 테스트 실행 가이드
- [Solid.js Reactivity Docs](https://www.solidjs.com/docs/latest/api#reactivity) -
  공식 API 레퍼런스

---

**작성자**: AI Assistant **검토자**: (Phase B1 완료 시 기록) **마지막
업데이트**: 2025-10-21
