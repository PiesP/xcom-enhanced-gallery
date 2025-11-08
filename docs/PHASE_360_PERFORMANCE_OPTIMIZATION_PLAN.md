# Phase 360: 성능 최적화 작업 계획 및 기준선 설정

**작성 날짜**: 2025-11-07 | **상태**: 📊 기준선 설정 완료 | **버전**: 0.4.2 |
**언어 정책**: 코드 = 영어, 분석 = 한국어

---

## 📊 현재 성능 기준선 (Baseline)

### 번들 크기

```
개발 빌드:       1.3 MB  (src/main.ts + dependencies, unminified)
프로덕션 빌드:   424 KB  (minified + compressed)
압축률:          67.5% ↓ (우수)

평가:
  ✅ 프로덕션 크기 적절
  ✅ 압축 효율 좋음
  ⚠️ 개발 빌드 크기 확인 필요
```

### E2E 성능 메트릭 (기존)

```
✅ 테스트 통과율: 101/105 (96.2%)
✅ 스모크 테스트: 모두 완료
✅ 평균 응답시간: <1s (기존 E2E 기준)

현재 E2E 테스트에서 성능 관련 테스트:
- test/smoke/keyboard-interaction.spec.ts
  └─ "Memory stable after 1000 keyboard navigations" (16.7s)
  └─ 메모리 누수 없음 확인됨 ✅
```

---

## 🎯 성능 최적화 전략 (Phase 360)

### Phase 360.1: 번들 분석 (1시간)

#### 목표

- 가장 큰 모듈 식별
- Tree-shaking 가능 부분 찾기
- 중복 의존성 검출

#### 구체적 액션

```bash
# 1. 의존성 크기 확인
npm ls --depth=0 2>/dev/null | sort

# 2. 번들 분석 (기존 bundle-analysis.html 확인)
cat docs/bundle-analysis.html | grep -o '<h2>[^<]*</h2>' | head -10

# 3. 모듈 개수 및 크기 맵핑
grep -r "export " src --include="*.ts" | wc -l

# 4. 순환 의존성 확인 (이미 0 violations 확인됨)
npm run deps:check
```

#### 예상 발견사항

```
- Solid.js: ~50KB (core library, 최소화 어려움)
- Vite bundled utilities: ~100KB (대부분 tree-shake됨)
- 사용자 코드: ~200KB (최적화 가능)
- 주석/소스맵: ~70KB (개발 용도)

최적화 기회:
1. 불필요한 polyfill 제거 (~20KB 잠재력)
2. 동적 import 활용 (~30KB 잠재력)
3. 주석 최적화 (~10KB 잠재력)
```

---

### Phase 360.2: 런타임 성능 프로파일링 (2-3시간)

#### 목표

- 갤러리 초기화 시간 측정
- 다운로드 시작 시간 기준선
- 메모리 사용 패턴 분석

#### 성능 메트릭 정의

```typescript
// 측정할 메트릭 (playwright/smoke/performance.spec.ts)

interface PerformanceMetrics {
  // 갤러리 초기화
  galleryInitTime: number; // 갤러리 오픈까지의 시간 (목표: <500ms)
  toolbarRenderTime: number; // 툴바 렌더 시간 (목표: <200ms)

  // 다운로드
  downloadStartTime: number; // 다운로드 버튼 클릭 → 시작 (목표: <100ms)
  zipCreationTime: number; // ZIP 파일 생성 시간 (항목 수에 따름)

  // 메모리
  initialMemory: number; // 초기 메모리 (baseline)
  peakMemory: number; // 최대 메모리 (모니터링)
  memoryAfterCleanup: number; // 정리 후 메모리 (누수 확인)

  // UI 반응성
  keyboardLatency: number; // 키보드 입력 → 반응 시간 (목표: <16ms)
  scrollLatency: number; // 스크롤 응답 시간 (목표: <16ms 60fps)
}
```

#### E2E 성능 테스트 추가

```typescript
// test/smoke/performance.spec.ts (신규)

import { test, expect } from '@playwright/test';

test.describe('Performance Baseline', () => {
  test('Gallery initialization time', async ({ page }) => {
    const start = performance.now();
    await page.goto(TWITTER_PAGE_URL);
    // 갤러리 오픈 (클릭 또는 자동)
    const duration = performance.now() - start;

    // 기준선: 1000ms
    expect(duration).toBeLessThan(1000);
    console.log(`✅ Gallery init: ${duration.toFixed(0)}ms`);
  });

  test('Download initiation latency', async ({ page }) => {
    // 갤러리 오픈 후 다운로드 시작
    const start = performance.now();
    // 다운로드 버튼 클릭
    const duration = performance.now() - start;

    // 기준선: 200ms
    expect(duration).toBeLessThan(200);
    console.log(`✅ Download start: ${duration.toFixed(0)}ms`);
  });

  test('Memory leak detection', async ({ page }) => {
    // 1000번의 키보드 네비게이션 후 메모리 안정성 확인
    // (기존 테스트에서 확인됨 ✅)
  });
});
```

---

### Phase 360.3: 최적화 대상 식별 (1-2시간)

#### Tree-Shaking 기회

```typescript
// 현재 상태 확인
src/shared/utils/
├── timer-management.ts   // 전체 export 확인
├── error-handling.ts     // 사용 여부 확인
├── media-url/            // 모듈 구조 확인
└── ...

// 최적화 기회:
1. 미사용 유틸리티 함수 제거 (~5KB)
2. 조건부 import 활용 (~10KB)
3. 번들 분할 (lazy loading) (~20KB)
```

#### 동적 Import 기회

```typescript
// 현재: 정적 import
import { GalleryApp } from '@/features/gallery';

// 최적화 가능: 동적 import (필요시에만 로드)
// Phase 360.4에서 구현
```

#### 주석 및 소스맵 최적화

```
현재:
- JSDoc 주석: 많음 (품질 우수 ✅)
- 소스맵: 개발용만 생성 (프로덕션 제외 ✅)

개선 기회:
- 불필요한 라인 주석 정리 (~5KB 절약)
- 재사용되는 주석 패턴화 (~3KB)
```

---

### Phase 360.4: 점진적 최적화 구현 (3-5일)

#### 단계별 개선

**1단계: 저위험 최적화** (1시간)

```typescript
// 1. 불필요한 polyfill 제거
// vite.config.ts 검토
// → @vitejs/plugin-legacy 확인

// 2. Tree-shake 불가능한 부분 정리
// src/constants.ts 정리
// → 사용되지 않는 상수 제거
```

**2단계: 중간 리스크 최적화** (2시간)

```typescript
// 1. 주석 정리
// src/shared/utils/** 검토
// → 반복되는 JSDoc 패턴화

// 2. 동적 import 도입
// src/features/gallery/
// → 초기 로드 최적화
// 예: 설정 패널은 필요시 로드
```

**3단계: 고위험 최적화** (2-3시간)

```typescript
// 1. 번들 분할 (Vite 설정)
// vite.config.ts → manualChunks 설정
// → 특정 모듈을 별도 번들로 분리

// 2. 지연 로딩 전략 (Solid.js 통합)
// src/bootstrap/bootstrap-app.ts
// → 필수 요소 먼저, 나머지 나중에

// 3. 캐싱 전략 강화
// src/shared/services/media-service.ts
// → ETag 기반 캐싱
```

---

## ✅ 검증 계획

### 각 최적화 후 검증

```bash
# 1. 타입 안전성
npm run typecheck

# 2. 코드 품질
npm run lint
npm run lint:css

# 3. 빌드 성공
npm run build

# 4. 번들 크기 확인
du -sh dist/

# 5. E2E 테스트 (회귀 테스트)
npm run e2e:smoke

# 6. 성능 메트릭
npm run test:smoke:performance  # 신규 성능 테스트
```

### 목표 지표

```
번들 크기: 424KB → 380KB (-10%)
초기 로드: <1s → <800ms (-20%)
메모리: 현재 안정 → 더 안정적 (leak 감소)
E2E 테스트: 101/105 → 101/105 (회귀 없음)
```

---

## 📋 작업 일정

| 단계     | 작업          | 기간         | 우선도  |
| -------- | ------------- | ------------ | ------- |
| 360.1    | 번들 분석     | 1시간        | 🔴 필수 |
| 360.2    | 성능 측정     | 2-3시간      | 🔴 필수 |
| 360.3    | 대상 식별     | 1-2시간      | 🔴 필수 |
| 360.4    | 점진적 최적화 | 3-5시간      | 🟡 권장 |
| **합계** | **Phase 360** | **7-11시간** |         |

---

## 🎯 최종 목표

### 이번 Phase의 성과

```
✅ 성능 기준선 설정
   - 번들 크기: 정량화됨 (424KB)
   - E2E 메트릭: 정의됨
   - 메모리 프로필: 확인됨

✅ 최적화 기회 목록화
   - Tree-shake: ~20KB 잠재력
   - 동적 import: ~30KB 잠재력
   - 기타: ~10KB 잠재력
   - 총 ~60KB 절약 가능

✅ 장기 이득
   - 사용자: 더 빠른 로드 시간 (10-20% 개선)
   - 프로젝트: 성능 기준선 확립
   - 팀: 최적화 패턴 확보
```

---

## 🚀 즉시 시작 가능

### 다음 단계 (지금 시작)

1. **Phase 360.1 시작**: 번들 분석

   ```bash
   npm run build
   # 기존 docs/bundle-analysis.html 검토
   npm run deps:check
   ```

2. **기준선 문서 작성**: PHASE_360_BASELINE.md
   - 현재 메트릭 기록
   - 개선 목표 설정

3. **성능 테스트 구조 준비**: test/smoke/performance.spec.ts
   - 메트릭 수집 코드 작성
   - 기준선 설정

---

## 📚 참고 문서

- [FINAL_DECISION_PHASE_360_ONWARDS.md](./FINAL_DECISION_PHASE_360_ONWARDS.md)
- [bundle-analysis.html](./bundle-analysis.html)
- vite.config.ts
- vitest.config.ts

---

**작성자**: AI Assistant (GitHub Copilot) **상태**: 🟢 즉시 구현 가능 **기준선
설정**: 2025-11-07 **언어 정책**: 100% 준수 (코드 = 영어, 분석 = 한국어)
