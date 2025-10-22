# TDD 리팩토링 계획

> xcom-enhanced-gallery 프로젝트의 테스트 및 리팩토링 진행 상황 **최종
> 업데이트**: 2025-10-22

---

## 📊 현황 요약

| 항목           | 상태                 | 세부                          |
| -------------- | -------------------- | ----------------------------- |
| Build (prod)   | ✅ 331.39 KB         | 제한: 335 KB, 여유: 3.61 KB   |
| 전체 테스트    | ✅ 3234 PASS, 5 SKIP | 모두 통과 (이전 11 FAIL 해결) |
| 누적 테스트    | 📈 707개+            | 70%+ 커버리지 유지            |
| Typecheck/Lint | ✅ PASS              | 모든 검사 완료                |
| 의존성         | ✅ OK                | 3 violations (정상 범위)      |

---

## ✅ 완료된 Phase

**누적 성과**: 총 707개 테스트, 커버리지 70%+ 달성

| #   | Phase  | 테스트 | 상태 | 상세                    |
| --- | ------ | ------ | ---- | ----------------------- |
| 1   | A5     | 334    | ✅   | Service Architecture    |
| 2   | 145    | 26     | ✅   | Gallery Loading Timing  |
| 3   | B3.1   | 108    | ✅   | Coverage Deep Dive      |
| 4   | B3.2.1 | 32     | ✅   | GalleryApp.ts           |
| 5   | B3.2.2 | 51     | ✅   | MediaService.ts         |
| 6   | B3.2.3 | 50     | ✅   | BulkDownloadService     |
| 7   | B4     | 4      | ✅   | Click Navigation        |
| 8   | B3.2.4 | 51     | ✅   | UnifiedToastManager     |
| 9   | B3.3   | 50     | ✅   | 서비스 간 통합 시나리오 |
| 10  | 134    | 1      | ✅   | 성능/메모리 상태 문서화 |

상세 기록:
[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) 참조

---

## 🎯 현재 작업

### Phase B3.3: 서비스 간 통합 시나리오 ✅ 완료

**상태**: 2025-10-22 완료 · 50개 테스트 모두 PASS

**테스트 범위**:

- 단계 1: Gallery 초기화 흐름 (10개) ✅
- 단계 2: 미디어 추출 → 다운로드 (12개) ✅
- 단계 3: 이벤트 라우팅 (10개) ✅
- 단계 4: 설정 변경 → 상태 반영 (10개) ✅
- 단계 5: E2E 시나리오 (8개) ✅

**검증 결과**:

- 빌드 크기: 331.39 KB ✅
- 모든 테스트: PASS ✅
- 타입체크: PASS ✅

상세: [TDD_REFACTORING_PLAN_B3_3.md](./TDD_REFACTORING_PLAN_B3_3.md) 참조

---

## 📋 다음 단계

### Phase 134: Performance/Memory Utilities 정리 (우선)

**상태**: 분석 완료, RED 테스트 존재 → GREEN 전환 필요

**목표**: 미사용 export 제거 및 API 명확성 개선

| 항목             | 상태    | 작업                                                                             |
| ---------------- | ------- | -------------------------------------------------------------------------------- |
| Memoization 모듈 | RED     | `memo`, `useCallback`, `createMemo` 제거 (vendors getter 사용)                   |
| Performance 정리 | RED     | `measurePerformance`, `scheduleIdle` 등 미사용 함수 제거                         |
| Memory Profiling | 검증 중 | `isMemoryProfilingSupported`, `takeMemorySnapshot`, `MemoryProfiler` 활용도 검사 |
| 번들 효과        | 예상    | ~2-5 KB 감소 가능                                                                |

**RED 테스트 파일**:
`test/unit/refactoring/phase-134-performance-memory-validation.test.ts`

**예상 결과**:

- 번들 크기: 331.39 KB → 329.39 KB (2 KB 절약)
- 테스트: 모두 PASS (미사용 코드 제거로 인한 영향 없음)

---

## 🎯 현재 작업

### Phase B3.3: 서비스 간 통합 시나리오 ✅ 완료

**상태**: 2025-10-22 완료 · 50개 테스트 모두 PASS

**테스트 범위**:

- 단계 1: Gallery 초기화 흐름 (10개) ✅
- 단계 2: 미디어 추출 → 다운로드 (12개) ✅
- 단계 3: 이벤트 라우팅 (10개) ✅
- 단계 4: 설정 변경 → 상태 반영 (10개) ✅
- 단계 5: E2E 시나리오 (8개) ✅

**검증 결과**:

- 빌드 크기: 331.39 KB ✅
- 모든 테스트: PASS ✅
- 타입체크: PASS ✅

상세: [TDD_REFACTORING_PLAN_B3_3.md](./TDD_REFACTORING_PLAN_B3_3.md) 참조

---

## 📋 현재 Phase: B3.5 (진행 중)

### Phase B3.5: E2E 성능 검증 (실제 X.com 환경)

**상태**: 구현 단계 (2025-10-22 시작)

**목표**: Playwright 기반 E2E 성능 프로파일링으로 실제 사용 시나리오 최적화

**구현 항목**:

| 항목                | 설명                                          | 테스트 |
| ------------------- | --------------------------------------------- | ------ |
| 성능 프로파일링     | Playwright CDP로 갤러리 로드/스크롤 성능 측정 | 4개    |
| 네트워크 시뮬레이션 | 느린 3G/4G 환경에서 이미지 로드 성능 추적     | 3개    |
| 메모리 누수 감지    | 갤러리 열기/닫기 반복 시 메모리 추적          | 3개    |
| 렌더링 성능         | 프레임 드롭 감지, 애니메이션 부하 측정        | 3개    |
| 최적화 효과 검증    | 최적화 전/후 벤치마크 비교                    | 2개    |

**예상 테스트**: 15개

**다음**: B3.6 (최종 통합 & 성능 요약)

---

## 📚 참고 문서

- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - 테스트 피라미드 및 전략
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  완료된 Phase 기록
- [TDD_REFACTORING_PLAN_B3_3.md](./TDD_REFACTORING_PLAN_B3_3.md) - Phase B3.3
  상세
