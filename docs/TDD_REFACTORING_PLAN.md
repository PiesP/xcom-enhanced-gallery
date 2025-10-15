# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 | **상태**: Phase 76 완료 ✅

## 프로젝트 현황

- **빌드**: prod **321.52 KB / 325 KB** (3.48 KB 여유, 1.1%) ✅
- **테스트**: **159개 파일**, 987 passing / 0 failed (100% 통과율) ✅✅✅
- **Skipped**: **10개** (8개 E2E 이관 권장 + 2개 기존) ⚠️
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (261 modules, 730 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅

## 현재 상태: Phase 76 완료 ✅

**완료일**: 2025-10-15 **목표**: Performance 테스트 재활성화 **결과**: 13개
테스트 활성화, skip 15→10개로 감소

### 주요 성과

- ✅ icon-optimization.test.tsx 재활성화 (13 passed | 3 skipped E2E)
- ✅ signal-optimization.test.tsx 재활성화 (17 passed)
- ✅ vendor mock에 onCleanup 추가
- ✅ renderHook API 수정 (result.current() → result())
- ✅ Skip 테스트 15 → 10개로 감소

### 해결 내용

1. **icon-optimization.test.tsx**: describe.skip 제거, vendor mock에 onCleanup
   추가
   - LazyIcon 구조 테스트 3개는 E2E 이관 권장 (JSX 변환 시점 문제)
   - IconRegistry, preload, hooks 테스트 모두 통과
2. **signal-optimization.test.tsx**: describe.skip 제거, result.current() →
   result() API 수정
   - createSelector, useSelector, useCombinedSelector 테스트 모두 통과
   - 비동기 selector 및 성능 모니터링 검증

---

## 다음 Phase 계획

### Phase 73: 번들 최적화 (Quick Wins)

**상태**: 대기 (현재 321.52 KB, 98.9% 사용) **트리거**: 빌드 322 KB (99%) 도달
시 **목표**: 7-10 KB 절감으로 12-15 KB 여유 확보 **예상 시간**: 5-8시간

#### 최적화 전략

1. **Tree-Shaking** (events.ts, 15.41 KB → 13.5 KB 목표)
   - 미사용 exports 제거
   - MediaClickDetector, gallerySignals 의존성 최소화

2. **Lazy Loading** (twitter-video-extractor.ts, 12.73 KB)
   - 동영상 tweet에서만 필요, 조건부 import() 적용

3. **Code Splitting** (media-service.ts, 17.53 KB)
   - extraction/mapping/control 로직 분리
   - 필요 시에만 로드

---

## 완료된 Phase 기록

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

- **Phase 75** (2025-10-15): test:coverage 실패 4개 수정, E2E 이관 권장 5개 추가
  ✅
- **Phase 74.9** (2025-10-15): 테스트 최신화 및 수정 ✅
- **Phase 74.8** (2025-10-15): 린트 정책 위반 12개 수정 ✅
- **Phase 74.7** (2025-10-15): 실패/스킵 테스트 8개 최신화 ✅
- **Phase 74.6** (2025-10-14): 테스트 구조 개선 ✅
- **Phase 74.5** (2025-10-13): 중복 제거 및 통합 ✅

---

## 모니터링 지표

### 경계 조건

- **번들 크기**: 322 KB (99%) 도달 시 Phase 73 활성화
- **테스트 skipped**: 20개 이상 시 즉시 검토 (현재 15개)
- **테스트 통과율**: 95% 미만 시 Phase 74 재활성화
- **빌드 시간**: 60초 초과 시 최적화 검토
- **문서 크기**: 개별 문서 800줄 초과 시 분할 검토

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, skipped 수
- **월간**: 의존성 업데이트, 문서 최신성, 보안 취약점
- **분기**: 아키텍처 리뷰, 성능 벤치마크

---

## 참고 문서

- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md):
  완료된 Phase 상세 기록
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트
