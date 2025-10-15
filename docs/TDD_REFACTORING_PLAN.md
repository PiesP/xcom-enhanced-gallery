# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 | **상태**: Phase 76 완료 ✅

## 프로젝트 현황

- **빌드**: prod **321.19 KB / 325 KB** (3.81 KB 여유, 1.2%) ✅
- **테스트**: **295개 파일**, 984 passing / 5 failed (98.5% 통과율) 🔄
- **Skipped**: **8개** (2개 재활성화 완료, 6개 Phase 74.5로 이관) 🔄
- **디렉터리**: **8개** (23개 → 8개, 65.2% 감소) ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (261 modules, 728 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅

## 현재 상태: Phase 74 진행 중 🔄

**시작일**: 2025-10-15 **목표**: Skipped 테스트 재활성화 (10 → 8개) **중간
결과**: 2개 성공, 6개 Phase 74.5 이관, 3개 assertion 수정 필요

### 완료된 작업 ✅

#### 스크롤 로직 단순화 (2025-10-15)

- ✅ VerticalGalleryView: scrollBy 수동 호출 제거
- ✅ 경계 조건 처리(clamping) 제거
- ✅ scrollDelta 계산 로직 제거
- ✅ TDD 테스트 7개 작성: 모두 통과 (100%)

#### 검증 결과

- ✅ 테스트: 984 passed / 3 failed (98.7%, Phase 76 테스트 +7개)
- ✅ 빌드: 321.19 KB (87.98 KB gzipped, -0.21 KB)
- ✅ 타입 체크: 0 errors
- ✅ wheel-scroll 테스트 업데이트 완료

### Phase 76 최종 성과

| 항목              | 시작      | 완료      | 개선     |
| ----------------- | --------- | --------- | -------- |
| **테스트 통과**   | 977/990   | 984/997   | +7개     |
| **프로덕션 빌드** | 321.40 KB | 321.19 KB | -0.21 KB |
| **코드 줄 수**    | ~484줄    | ~460줄    | -24줄    |

### Phase 74 진행 사항 (2025-10-15)

#### 목표

- 10개 skipped 테스트 재활성화
- 테스트 통과율 98.7% → 99%+ 향상

#### 현재 결과

- ✅ 2개 재활성화 완료 (10 → 8 skipped)
  - use-gallery-focus-tracker-events: auto focus delay (L270)
  - use-gallery-focus-tracker-global-sync: 컨테이너 null, debounce 여러 변경
- 🔄 3개 assertion 수정 중
  - use-gallery-focus-tracker-global-sync L108: setFocusedIndex(null) assertion
  - use-gallery-focus-tracker-events L181, L219: manualFocusIndex,
    IntersectionObserver
- ➡️ 6개 Phase 74.5로 이관 (deduplication 테스트)
  - 원인: Promise 기반 코드에서 fake timers 미작동
  - 해결: 별도 구조 리팩토링 필요
- ⏸️ 2개 유지 (정당한 skip)
  - toolbar-layout-stability L80: E2E 이관 완료
  - toolbar-focus-indicator L65: Solid.js 패턴 적용 필요

#### 다음 단계

1. assertion 3개 수정
2. toolbar-focus-indicator 1개 처리 (Solid.js 패턴)
3. Phase 74 완료 및 문서 이관
4. Phase 74.5 계획 수립 (deduplication 6개)

---

## 다음 Phase 계획

### Phase 74.5: Deduplication 테스트 구조 개선

**상태**: 계획 중 **목표**: 6개 deduplication 테스트 재활성화 **방법**: Promise
기반 코드 → async/await + vi.runAllTimers() 패턴으로 리팩토링 **예상**: 3-4시간

### Phase 73: 번들 최적화 재평가

**상태**: 대기 **트리거**: 빌드 322 KB (99%) 도달 시 **예상 효과**: ~8-10 KB
절감

---

## 모니터링 지표

### 경계 조건

- **번들 크기**: 322 KB (99%) 도달 시 Phase 73 활성화
- **테스트 skipped**: 15개 이상 시 즉시 검토
- **테스트 통과율**: 95% 미만 시 Phase 74 활성화
- **빌드 시간**: 60초 초과 시 최적화 검토
- **문서 크기**: 개별 문서 800줄 초과 시 분할 검토

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, skipped 수
- **월간**: 의존성 업데이트, 문서 최신성, 보안 취약점
- **분기**: 아키텍처 리뷰, 성능 벤치마크

---

## 참고 문서

- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md):
  완료된 Phase 기록 (76, 78, 75, 71, 72, 77, 33, 67, 69)
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트

---

## 히스토리

- **2025-10-15**: Phase 74 진행 중 (Skipped 테스트 재활성화 - 2개 완료, 6개
  Phase 74.5 이관)
- **2025-10-15**: Phase 76 완료 (브라우저 네이티브 스크롤 전환 - 7개 TDD 테스트
  통과, 빌드 0.21 KB 감소)
- **2025-10-15**: Phase 78 완료 (테스트 구조 최적화 - 295개 파일, 8개 디렉터리)
- **2025-10-16**: Phase 75 완료 (Toolbar 컨테이너/뷰 분리, 하네스 보강)
- **2025-10-15**: Phase 71, 72, 77 완료 (문서 최적화 + 코드 품질 +
  NavigationSource 추적)
- **2025-10-14**: Phase 33, 67, 69 완료 → 유지보수 모드 전환
