# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 | **상태**: Phase 74.5 완료, Phase 74.6 계획 중
> 🔄

## 프로젝트 현황

- **빌드**: prod **321.19 KB / 325 KB** (3.81 KB 여유, 1.2%) ✅
- **테스트**: **295개 파일**, 988 passing / 7 failed (99.1% 통과율) ✅
- **Skipped**: **2개** (10 → 2개, 80% 감소) ✅✅✅
- **디렉터리**: **8개** (23개 → 8개, 65.2% 감소) ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (261 modules, 728 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅

## 현재 상태: Phase 74.5 완료 ✅

**완료일**: 2025-10-15  
**목표**: Deduplication 테스트 6개 재활성화  
**결과**: 5개 성공, 2개 Phase 74.6 이관

### 주요 성과

- ✅ Skipped 테스트: 10개 → 2개 (80% 감소)
- ✅ Passing 테스트: 984개 → 988개 (+4개)
- ✅ Phase 74: 2개 재활성화
- ✅ Phase 74.5: 5개 재활성화
- ⏳ Phase 74.6: 2개 autoFocus 타이밍 이슈 (보류)

---

## 다음 Phase 계획

### Phase 74.6: AutoFocus 타이밍 수정 (선택적)

**상태**: 계획 중 ⏳  
**목표**: 2개 autoFocus 타이밍 테스트 재활성화  
**대상 파일**:
`test/unit/features/gallery/hooks/use-gallery-focus-tracker-deduplication.test.ts`  
**예상
시간**: 2-3시간

#### 문제 정의

- L95 (다른 인덱스 autoFocus 재적용): `focusSpy1.mock.calls.length` remains 0
- L302 (통합 - 스크롤 중 중복 방지): 복잡한 forceSync + autoFocus 상호작용
- 현재 패턴: vi.runAllTimers() 타이밍 이슈

#### 해결 전략

1. **실패 로그 상세 분석**: focus() 호출이 안 되는 정확한 시점 파악
2. **구현 검토**: useGalleryFocusTracker autoFocus 로직 재분석
3. **타이밍 시퀀스 디버깅**: vi.advanceTimersByTimeAsync() 재도입 고려
4. **통합 테스트 분리**: L302는 E2E로 이관 고려

#### 리스크

- 복잡한 async 로직으로 높은 시간 소모 가능
- autoFocus 로직 자체의 구조적 문제 가능성
- 투입 대비 효과 낮을 수 있음 (이미 99.1% 통과율)

### Phase 73: 번들 최적화 재평가

**상태**: 대기  
**트리거**: 빌드 322 KB (99%) 도달 시  
**예상 효과**: ~8-10 KB 절감

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
  완료된 Phase 기록 (74.5, 74, 76, 78, 75, 71, 72, 77, 33, 67, 69)
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트

---

## 히스토리

- **2025-10-15**: Phase 74.5 완료 (Deduplication 테스트 5개 재활성화, 2개 Phase
  74.6 이관)
- **2025-10-15**: Phase 74 완료 (Skipped 테스트 재활성화 - 2개 성공, 6개 Phase
  74.5 이관)
- **2025-10-15**: Phase 76 완료 (브라우저 네이티브 스크롤 전환)
- **2025-10-15**: Phase 78 완료 (테스트 구조 최적화 - 295개 파일, 8개 디렉터리)
- **2025-10-16**: Phase 75 완료 (Toolbar 컨테이너/뷰 분리, 하네스 보강)
- **2025-10-15**: Phase 71, 72, 77 완료 (문서 최적화 + 코드 품질 +
  NavigationSource 추적)
