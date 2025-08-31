# TDD 기반 상태관리 리팩토링 계획

> **현재 Preact Signals 기반 상태관리 시스템의 일관성 개선을 위한 체계적
> 리팩토링 계획** - Phase 3 완료 (2025.01.31)

## 📋 현재 상황 분석

### 현재 상태관리 구조

- **핵심 패턴**: Preact Signals + 도메인별 Singleton + StateManager 브리지
- **주요 파일**:
  - `src/shared/state/signals/gallery.signals.ts` - 갤러리 상태
  - `src/shared/state/signals/toolbar.signals.ts` - 툴바 상태
  - `src/shared/services/UnifiedToastManager.ts` - Toast 상태
  - `src/shared/services/StateManager.ts` - 전역 동기화 (의존성 주입 패턴 적용)
  - `src/shared/external/vendors/vendor-manager-static.ts` - 라이브러리 관리

### 해결된 문제점 ✅

1. **타입 일관성 확보**: Signal<T> 타입을 중앙집중화
   (`src/shared/types/signals.ts`)
2. **구독 규약 표준화**: 모든 subscribe가 올바른 unsubscribe 함수 반환 확인
3. **초기화 안정성**: StateManager에 의존성 주입 패턴 적용, 초기화 순서 문제
   해결

### 식별된 문제점 (해결 예정)

4. **배치 처리 미적용**: 연속 상태 변경 시 불필요한 리렌더 발생
5. **테스트 부재**: 상태관리 핵심 로직에 대한 단위 테스트 확대 필요

## 🎯 리팩토링 목표

1. **타입 안전성 강화**: 중앙화된 Signal 타입 시스템 ✅
2. **초기화 안정성**: StateManager 의존성 주입 패턴 ✅
3. **일관된 구독 패턴**: 모든 subscribe가 unsubscribe 반환 ✅
4. **안정적 초기화**: 의존성 주입과 타이밍 문제 해결 🔄
5. **성능 최적화**: batch 업데이트 적용 🔄

## 📊 진행 상황

### Phase 1: 타입 시스템 통합 ✅

- **진행률**: 100% 완료
- **상태**: GREEN - 모든 테스트 통과
- **완료된 작업**:
  - ✅ 중앙집중식 Signal 타입 정의 생성 (`src/shared/types/signals.ts`)
  - ✅ 타입 일관성 테스트 구현
  - ✅ gallery.signals.ts에 중앙집중식 타입 적용
  - ✅ toolbar.signals.ts에 중앙집중식 타입 적용
- **검증된 사항**:
  - Signal<T> 인터페이스 통일
  - subscribe 메서드 타입 일관성
  - TypeScript 컴파일 통과

### Phase 2: 구독 패턴 표준화 ✅

- **진행률**: 100% 완료 (기존 구현이 이미 표준을 준수)
- **상태**: GREEN - 모든 테스트 통과
- **완료된 작업**:
  - ✅ 구독 패턴 표준화 테스트 구현
    (`test/refactoring/phase2-subscription-patterns.spec.ts`)
  - ✅ 모든 subscribe 메서드의 unsubscribe 함수 반환 확인
  - ✅ gallery.signals, toolbar.signals, UnifiedToastManager, Toast.tsx 검증
  - ✅ 구독 해제 동작 및 메모리 누수 방지 패턴 검증
- **검증된 사항**:
  - 모든 subscribe 메서드가 `() => void` 타입의 unsubscribe 함수 반환
  - 독립적인 구독 해제 동작 확인
  - 에러 처리 및 방어적 프로그래밍 패턴 적용

5. **테스트 커버리지**: 핵심 로직 100% 테스트

## 📚 TDD 리팩토링 계획

### Phase 1: 타입 시스템 통합 (우선순위: 높음)

#### RED: 실패하는 테스트 작성

```typescript
// test/unit/signals/signal-types.spec.ts
describe('Signal Type System', () => {
  it('should have consistent Signal interface across all modules', () => {
    // 모든 signal이 동일한 타입 구조를 가져야 함
  });

  it('should return unsubscribe function from all subscribe calls', () => {
    // 모든 subscribe가 () => void 반환해야 함
  });
});
```

#### GREEN: 최소 구현

1. **중앙 타입 파일 생성**

   ```typescript
   // src/shared/types/signals.ts
   export interface Signal<T> {
     value: T;
     subscribe: (callback: (value: T) => void) => () => void;
   }

   export type SubscribeFn<T> = (callback: (value: T) => void) => () => void;
   export type UnsubscribeFn = () => void;
   ```

2. **기존 파일 타입 교체**
   - `gallery.signals.ts`: 로컬 Signal 타입 제거
   - `toolbar.signals.ts`: 로컬 Signal 타입 제거
   - `UnifiedToastManager.ts`: 타입 일관성 적용

#### REFACTOR: 코드 정리

- 중복 타입 선언 완전 제거
- import 경로 최적화
- 타입 안전성 검증 강화

### Phase 2: 구독 패턴 표준화 (우선순위: 높음)

#### RED: 실패하는 테스트 작성

```typescript
// test/unit/signals/subscription-pattern.spec.ts
describe('Subscription Pattern', () => {
  it('should unsubscribe successfully from gallery state', () => {
    const unsubscribe = galleryState.subscribe(() => {});
    expect(typeof unsubscribe).toBe('function');
    // unsubscribe 호출 후 콜백이 더 이상 호출되지 않아야 함
  });

  it('should handle subscription cleanup in Toast manager', () => {
    // ToastManager의 구독 해제가 메모리 누수 없이 동작해야 함
  });
});
```

#### GREEN: 최소 구현

1. **gallery.signals.ts 수정**

   ```typescript
   subscribe(callback: (state: GalleryState) => void): () => void {
     const { effect } = getPreactSignals();
     return effect(() => {
       callback(getGalleryStateSignal().value);
     });
   }
   ```

2. **toolbar.signals.ts 폴백 개선**
   ```typescript
   // 폴백 시에도 명시적 unsubscribe 반환
   subscribe: callback => {
     logger.warn('Signals not available, subscription disabled');
     return () => {}; // 명시적 unsubscribe
   };
   ```

#### REFACTOR: 메모리 누수 방지

- 모든 구독 지점에서 cleanup 검증
- 컴포넌트 언마운트 시 자동 해제 패턴 적용

### Phase 3: StateManager 초기화 안정화 ✅

- **진행 상태**: 완료 - 의존성 주입 패턴 구현 완료, 모든 테스트 통과
- **목표**: StateManager의 초기화 순서 문제 해결 및 안정성 향상
- **완료 일자**: 2025-01-31

#### RED: 실패하는 테스트 작성

```typescript
// test/unit/services/state-manager.spec.ts
describe('StateManager Initialization', () => {
  it('should handle delayed global signals availability', async () => {
    // window.gallery.signals가 나중에 생성되는 시나리오
  });

  it('should retry signal sync initialization', async () => {
    // 초기화 실패 시 재시도 로직 검증
  });
});
```

#### GREEN: 최소 구현

1. **대기 로직 추가**

   ```typescript
   // StateManager.ts
   private async waitForGlobalSignals(timeout = 2000): Promise<boolean> {
     // window.gallery.signals 준비까지 대기
   }

   private async initializeSignalSync(): Promise<void> {
     const available = await this.waitForGlobalSignals();
     if (!available) {
       logger.warn('Global signals not available, some sync features disabled');
       return;
     }
     // 기존 초기화 로직
   }
   ```

#### REFACTOR: 의존성 주입 패턴

- 전역 의존성을 명시적 주입으로 변경
- 테스트 가능한 구조로 개선

### Phase 4: 배치 업데이트 최적화 (우선순위: 중간)

#### RED: 성능 테스트 작성

```typescript
// test/performance/batch-updates.spec.ts
describe('Batch Updates Performance', () => {
  it('should minimize re-renders with batch updates', () => {
    // 여러 상태 변경이 단일 렌더로 처리되는지 검증
  });
});
```

#### GREEN: batch 적용

1. **gallery.signals.ts 최적화**
   ```typescript
   export function openGallery(
     items: readonly MediaInfo[],
     startIndex = 0
   ): void {
     const { batch } = getPreactSignals();
     batch(() => {
       galleryState.value = {
         ...galleryState.value,
         isOpen: true,
         mediaItems: items,
         currentIndex: validIndex,
         error: null,
       };
     });
   }
   ```

#### REFACTOR: 성능 최적화

- 모든 다중 상태 변경에 batch 적용
- 성능 메트릭 추가

### Phase 5: 테스트 커버리지 완성 (우선순위: 낮음)

#### 통합 테스트 추가

```typescript
// test/integration/state-management.spec.ts
describe('State Management Integration', () => {
  it('should sync between signals and StateManager', () => {
    // Signal 변경이 StateManager를 통해 전파되는지 검증
  });

  it('should handle concurrent state changes', () => {
    // 동시성 문제 없이 상태 변경이 처리되는지 검증
  });
});
```

## 📅 실행 일정

### Week 1: Foundation (Phase 1-2)

- [ ] Day 1-2: 타입 시스템 통합
- [ ] Day 3-4: 구독 패턴 표준화
- [ ] Day 5: 테스트 작성 및 검증

### Week 2: Stability (Phase 3)

- [ ] Day 1-3: StateManager 초기화 개선
- [ ] Day 4-5: 의존성 주입 패턴 적용

### Week 3: Optimization (Phase 4-5)

- [ ] Day 1-2: 배치 업데이트 적용
- [ ] Day 3-5: 통합 테스트 및 성능 검증

## 🔍 검증 기준

### 기능 검증

- [ ] 모든 기존 기능이 정상 동작
- [ ] 타입 에러 없음 (strict mode)
- [ ] 메모리 누수 없음

### 성능 검증

- [ ] 상태 변경 시 불필요한 리렌더 최소화
- [ ] 초기화 시간 2초 이내
- [ ] 메모리 사용량 증가 없음

### 코드 품질

- [ ] 테스트 커버리지 90% 이상
- [ ] ESLint/TypeScript 에러 0개
- [ ] 일관된 코딩 스타일

## 🚨 위험 요소 및 대응

### 높은 위험

1. **기존 기능 회귀**: 철저한 테스트로 검증
2. **성능 저하**: 단계별 성능 측정

### 중간 위험

1. **타입 호환성**: 점진적 마이그레이션
2. **초기화 타이밍**: 폴백 메커니즘 유지

### 낮은 위험

1. **개발 환경 영향**: 개발/프로덕션 분리
2. **번들 크기**: 최소한의 변경으로 제한

## 📊 성공 메트릭

- **타입 안전성**: TypeScript strict 모드 통과
- **성능**: 상태 변경 응답 시간 < 16ms
- **안정성**: 메모리 누수 0건, 초기화 실패 0건
- **유지보수성**: 코드 중복 50% 감소
- **테스트**: 상태관리 로직 커버리지 90%+

## 🔄 롤백 계획

각 Phase별로 Git 태그 생성하여 단계별 롤백 가능:

- `refactor/phase1-types`: 타입 시스템 통합 완료
- `refactor/phase2-subscriptions`: 구독 패턴 표준화 완료
- `refactor/phase3-initialization`: 초기화 안정화 완료

---

**작성일**: 2025-08-31 **작성자**: TDD State Management Refactoring Team **검토
필요**: Phase 1 시작 전 팀 리뷰 필수
