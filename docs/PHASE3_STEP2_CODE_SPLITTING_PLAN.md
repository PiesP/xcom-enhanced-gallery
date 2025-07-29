# Phase 3 Step 2: 코드 분할 대상 식별 및 구현 계획

## 📋 식별된 코드 분할 대상

### 1. 우선순위 1: Motion One 라이브러리 지연 로딩

**현재 상태**: 즉시 로딩 **목표**: 애니메이션 사용 시에만 동적 로딩 **예상 크기
절약**: ~15-20KB

#### 구현 방법:

```typescript
// LazyMotionService.ts 생성
export async function loadMotionWhenNeeded() {
  const { getMotion } = await import('@shared/external/vendors');
  return getMotion();
}

// 사용 예시
const handleAnimationTrigger = async () => {
  const motion = await loadMotionWhenNeeded();
  motion.animate(element, { opacity: [0, 1] });
};
```

### 2. 우선순위 2: 고급 최적화 모듈들 지연 로딩

**대상 모듈들**:

- `OptimizedLazyLoadingService` (~8KB)
- `VirtualScrollManager` (~6KB)
- `AdvancedMemoization` (~4KB)
- `WorkerPoolManager` (~5KB)
- `MemoryPoolManager` (~3KB)

**총 예상 절약**: ~26KB

#### 구현 방법:

```typescript
// LazyOptimizationService.ts 생성
export class LazyOptimizationService {
  private static optimizedLazyLoading: any;
  private static virtualScrollManager: any;

  static async getOptimizedLazyLoading() {
    if (!this.optimizedLazyLoading) {
      const module = await import(
        '@shared/services/OptimizedLazyLoadingService'
      );
      this.optimizedLazyLoading = module.OptimizedLazyLoadingService;
    }
    return this.optimizedLazyLoading;
  }

  static async getVirtualScrollManager() {
    if (!this.virtualScrollManager) {
      const module = await import(
        '@shared/utils/virtual-scroll/VirtualScrollManager'
      );
      this.virtualScrollManager = module.VirtualScrollManager;
    }
    return this.virtualScrollManager;
  }
}
```

### 3. 우선순위 3: 개발용 유틸리티 Production 제외

**대상 모듈들**:

- `BundleOptimizer` (개발 전용)
- `PerformanceProfiler` (디버깅 전용)
- 복잡한 debugging utilities

**구현 방법**: Tree-shaking과 환경별 조건부 import

## 🎯 구현 전략

### Phase 3.2.1: Motion One 지연 로딩 구현

1. `LazyMotionService.ts` 생성
2. 애니메이션 트리거 포인트에서 동적 로딩
3. 캐싱을 통한 중복 로딩 방지

### Phase 3.2.2: 고급 최적화 모듈 지연 로딩

1. `LazyOptimizationService.ts` 생성
2. 필요시점에서만 로딩 (대용량 갤러리, 고성능 모드 등)
3. 메모리 효율적인 모듈 관리

### Phase 3.2.3: 번들 크기 측정 및 검증

1. 각 단계별 번들 크기 측정
2. 초기 로딩 성능 개선 확인
3. 실제 사용자 시나리오에서 성능 검증

## 📊 예상 성과

### 번들 크기 최적화:

- **현재**: 382.47 KB
- **Motion 지연 로딩 후**: ~362 KB (-20KB)
- **고급 모듈 지연 로딩 후**: ~336 KB (-26KB 추가)
- **최종 목표**: ~336 KB (목표 400KB 대비 64KB 여유)

### 성능 개선:

- 초기 로딩 시간 단축: 20-30% 개선 예상
- 메모리 사용량 최적화: 필요시에만 로딩
- 사용자 경험 향상: 더 빠른 갤러리 시작

## 🔧 구현 우선순위

1. **즉시 구현**: Motion One 지연 로딩 (가장 큰 효과)
2. **다음 단계**: 고급 최적화 모듈 지연 로딩
3. **최종 검증**: 전체 빌드 및 성능 테스트

## 🚦 다음 작업

다음은 **Motion One 지연 로딩 구현**부터 시작하여 단계별로 진행합니다.

각 단계마다 TDD 방식으로 테스트 작성 → 구현 → 검증을 반복하여 안정성을
보장합니다.
