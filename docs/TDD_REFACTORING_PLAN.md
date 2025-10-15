# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 | **상태**: Phase 74 완료, Phase 74.5 시작 🔄

## 프로젝트 현황

- **빌드**: prod **321.19 KB / 325 KB** (3.81 KB 여유, 1.2%) ✅
- **테스트**: **295개 파일**, 984 passing / 5 failed (98.5% 통과율) 🔄
- **Skipped**: **8개** (10 → 8개, Phase 74 완료) ✅
- **디렉터리**: **8개** (23개 → 8개, 65.2% 감소) ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (261 modules, 728 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅

## 현재 상태: Phase 74.5 시작 �

**시작일**: 2025-10-15 **목표**: Deduplication 테스트 6개 재활성화 **방법**:
Promise 기반 → async/await + vi.runAllTimers() 패턴 리팩토링

### 다음 단계

1. Phase 74.5 브랜치 생성 및 계획 문서 작성
2. Deduplication 테스트 구조 분석
3. 첫 번째 테스트(L52) 리팩토링 및 재활성화
4. 나머지 5개 테스트 순차 재활성화
5. Assertion 실패 3개 분석 및 수정
6. 문서 업데이트 및 Phase 74.5 완료

---

## 다음 Phase 계획

### Phase 74.5: Deduplication 테스트 구조 개선

**상태**: 진행 중 🔄 **목표**: 6개 deduplication 테스트 재활성화 **대상 파일**:
`test/unit/features/gallery/hooks/use-gallery-focus-tracker-deduplication.test.ts`
**예상 시간**: 3-4시간

#### 문제 정의

- Promise 기반 코드에서 fake timers 미작동
- 테스트가 10초 타임아웃으로 실패
- 현재: `await new Promise(resolve => setTimeout(...))` 패턴

#### 해결 전략

1. **패턴 전환**: Promise → async/await + vi.runAllTimers()
2. **타이머 제어**: setTimeout을 vi.runAllTimers()로 즉시 실행
3. **순차 적용**: L52 → L148 → L187 → L236 → L318 순서로 진행

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
  완료된 Phase 기록 (74, 76, 78, 75, 71, 72, 77, 33, 67, 69)
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트

---

## 히스토리

- **2025-10-15**: Phase 74.5 시작 (Deduplication 테스트 구조 개선 - 6개 목표)
- **2025-10-15**: Phase 74 완료 (Skipped 테스트 재활성화 - 2개 성공, 6개 Phase
  74.5 이관)
- **2025-10-15**: Phase 76 완료 (브라우저 네이티브 스크롤 전환)
- **2025-10-15**: Phase 78 완료 (테스트 구조 최적화 - 295개 파일, 8개 디렉터리)
- **2025-10-16**: Phase 75 완료 (Toolbar 컨테이너/뷰 분리, 하네스 보강)
- **2025-10-15**: Phase 71, 72, 77 완료 (문서 최적화 + 코드 품질 +
  NavigationSource 추적)
