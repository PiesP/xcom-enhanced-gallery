# 📦 Archived Performance Tests

**위치**: `test/archive/performance/` | **상태**: 비활성화(CI 제외) | **마지막
업데이트**: 2025-10-25 (Phase 172)

## 📋 개요

프로젝트의 **placeholder/통합 성능 테스트** 아카이브입니다. 모든 파일은
`expect(true).toBe(true)` 패턴의 placeholder 테스트로, 실제 구현 검증이
없습니다.

**이유**: 실제 성능 테스트는 `test/unit/performance/`에서 명확하고 구체적으로
관리되고 있으므로, 이중화 방지 및 유지보수 단순화를 위해 아카이브로
이동했습니다.

---

## 📁 파일 구조

```
test/archive/performance/
├── README.md (이 파일)
├── performance.consolidated.test.ts       (80줄 - placeholder)
└── optimization/
    ├── memo-optimization.test.ts          (45줄 - placeholder)
    └── optimization.consolidated.test.ts  (76줄 - placeholder)
```

---

## 📄 파일 설명

### `performance.consolidated.test.ts` (80줄)

**목적**: Virtual Gallery, Code Splitting, Runtime Monitoring, Animation,
Network 성능 통합 테스트

**현황**:

- 5개 describe 블록
- 15개 test 케이스
- 모두 `expect(true).toBe(true)` placeholder 패턴
- 실제 구현 없음

**예시**:

```typescript
describe('Virtual Gallery Performance', () => {
  it('should maintain smooth scrolling with large datasets', async () => {
    expect(true).toBe(true);
  });
});
```

### `optimization/memo-optimization.test.ts` (45줄)

**목적**: Preact.memo 최적화 검증 (이전 프레임워크 사용)

**현황**:

- Button, Toast, ToastContainer, VerticalImageItem memo 적용 체크
- 모두 `expect(true).toBe(true)` 패턴
- **주의**: Preact 기반이나, 현재 프로젝트는 **Solid.js** 사용 → 파일 자체가
  구식

### `optimization/optimization.consolidated.test.ts` (76줄)

**목적**: Code Splitting, Component Memoization, Runtime Performance, Advanced
Optimizations, Bundle Optimization 통합 테스트

**현황**:

- 5개 describe, 15개 test 케이스
- 모두 placeholder

---

## ✨ 대안: 실제 구현 테스트

실제 성능 테스트는 **`test/unit/performance/`**에서 관리됩니다:

| 파일                                           | 목적                                   |
| ---------------------------------------------- | -------------------------------------- |
| `gallery-preload.util.test.ts`                 | 갤러리 프리로드 인덱스 계산            |
| `gallery-prefetch.viewport-weight.red.test.ts` | 뷰포트 가중치 기반 프리페치 (RED 단계) |
| `media-prefetch.raf-schedule.test.ts`          | RAF 스케줄 미디어 프리페치             |
| `media-prefetch.microtask-schedule.test.ts`    | Microtask 스케줄                       |
| `media-prefetch.idle-schedule.test.ts`         | Idle 스케줄                            |
| `media-prefetch.bench.test.ts`                 | 성능 벤치마킹                          |
| `icon-optimization.test.tsx`                   | 아이콘 컴포넌트 최적화                 |
| `signal-optimization.test.tsx`                 | Signal 메모이제이션                    |

---

## 🔄 복원 방법

만약 파일을 복구하려면:

<<<<<<< Updated upstream

```powershell
# 1. 파일 복사
Copy-Item -Path test/archive/performance -Destination test/performance -Recurse -Force
=======
```bash
# 1. 파일 복사
cp -r test/archive/performance test/performance
>>>>>>> Stashed changes

# 2. vitest.config.ts 업데이트
# include에 'test/performance/**/*.{test,spec}.{ts,tsx}' 추가

# 3. 테스트 실행
npm run test:perf
```

---

## 📚 관련 문서

- [`test/README.md`](../README.md) - 테스트 디렉터리 구조
- [`test/archive/README.md`](../README.md) - 아카이브 정책
- [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) - 성능 테스트
  전략
- [`docs/TDD_REFACTORING_PLAN.md`](../../docs/TDD_REFACTORING_PLAN.md) - Phase
  172 기록

---

## 📌 정책

- ✅ CI/로컬 테스트에서 제외됨
- ✅ `test/archive` 통합 정책 적용
- ✅ 필요시 복원 가능
- ✅ 월별 유지보수 체크에서 검토
