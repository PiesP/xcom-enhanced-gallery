# TDD 리팩토링 계획

> xcom-enhanced-gallery 프로젝트의 활성 리팩토링 진행 상황 **현재 Phase**: 164
> (테스트 안정화 및 빌드 최적화) **마지막 업데이트**: 2025-10-24

---

## 📊 현황 요약

| 항목           | 상태           | 세부                                           |
| -------------- | -------------- | ---------------------------------------------- |
| Build (prod)   | ⚠️ 미빌드      | 빌드 필요 (제한: 337.5 KB)                     |
| 전체 테스트    | ⚠️ 3209/3234   | 25개 실패 (bundle/signal/service/event policy) |
| E2E 테스트     | ❓ 미확인      | Playwright 스모크 테스트 실행 필요             |
| Typecheck/Lint | ✅ PASS        | 모든 검사 완료, CodeQL 통과                    |
| 의존성         | ✅ OK          | 0 violations                                   |
| **현재 Phase** | 🔄 164 진행 중 | 테스트 안정화 우선 (2-4시간)                   |

---

## � Phase 164: 테스트 안정화 및 빌드 최적화 (진행 중)

### 목표

1. **테스트 안정화**: 25개 실패 테스트 → 0개 (우선순위별 해결)
2. **빌드 최적화**: 프로덕션 빌드 생성 및 337.5 KB 이하 달성
3. **E2E 검증**: Playwright 스모크 테스트 전체 통과

### 현재 테스트 상태 (2025-10-24)

**전체**: 3209 passed / 3234 total (25 failed)

**실패 분류**:

1. **Bundle Size Policy** (2개) - events.ts 크기 초과
   - `events.ts` 크기: 29.43 KB (제한 28 KB 초과)
   - `events.ts` 라인: 962줄 (제한 940줄 초과)
   - 원인: Phase 158 debounce 추가 후 미조정

2. **Signal Accessor Wrapper** (2개) - galleryState Signal 인터페이스
   - `galleryState` 구조 검증 실패
   - `useSelector` 직접 선언 검증 실패
   - 원인: `getSolid()` getter 모킹 누락

3. **CoreService** (11개) - ServiceManager 전체 기능
   - getInstance/resetInstance 실패
   - 서비스 등록/조회 실패
   - 진단/정리 작업 실패
   - 원인: `CoreService` 클래스 import 누락 또는 리팩토링 반영 안됨

4. **Event Policy** (10개) - Touch/Pointer 이벤트 차단
   - Touch 이벤트 4개 (touchstart/move/end/cancel)
   - Pointer 이벤트 6개 (pointerdown/move/up/cancel/enter/leave)
   - 원인: 이벤트 차단 로직 미구현 또는 테스트 환경 설정 오류

### 🎯 해결 방안 (우선순위)

#### **Priority 1: CoreService 테스트 수정** (30분, High Impact)

**문제**: ServiceManager 리팩토링 후 테스트 미업데이트

**조치**:

1. `CoreService` import 경로 확인 및 수정
2. `resetInstance()` 메서드 존재 확인
3. 테스트 모킹 구조 갱신

**예상 결과**: 11개 테스트 복구

---

#### **Priority 2: Signal Accessor Wrapper 수정** (20분, Medium Impact)

**문제**: `getSolid()` getter 모킹 누락

**조치**:

1. `test/setup.ts`에서 `getSolid()` 모킹 추가
2. `createSignal()` 반환값 정의
3. Signal 인터페이스 검증 로직 재확인

**예상 결과**: 2개 테스트 복구

---

#### **Priority 3: Event Policy 구현 확인** (1-2시간, Critical Feature)

**문제**: Touch/Pointer 이벤트 차단 정책 미작동

**조치**:

1. `src/shared/utils/event-policy.ts` 구현 확인
2. `addEventListener` wrapper 검증
3. 테스트 환경 이벤트 리스너 추적 설정

**예상 결과**: 10개 테스트 복구

---

#### **Priority 4: Bundle Size Policy 조정** (15분, Policy Update)

**문제**: Phase 158 debounce 추가 후 정책 미조정

**조치**:

1. `test/unit/policies/bundle-size-policy.test.ts` 제한값 갱신
   - 28 KB → 30 KB (또는 events.ts 코드 정리)
   - 940줄 → 970줄 (또는 리팩토링)
2. Phase 158 변경사항 문서화

**예상 결과**: 2개 테스트 복구 (정책 조정) 또는 코드 리팩토링 (근본 해결)

---

#### **Priority 5: 빌드 및 E2E 검증** (30분, Final Check)

**조치**:

1. `npm run build:prod` 실행
2. 빌드 크기 확인 (≤ 337.5 KB 목표)
3. `npm run e2e:smoke` 실행
4. 모든 검증 통과 확인

**예상 결과**: 프로덕션 준비 완료

---

### 📅 실행 계획 (총 3-4시간)

**즉시 실행** (1.5시간):

1. CoreService 테스트 수정 (30분)
2. Signal Accessor Wrapper 수정 (20분)
3. Bundle Size Policy 조정 (15분)
4. 중간 검증: `npm test` (5분)

**후속 작업** (1.5-2시간):

1. Event Policy 구현 확인 및 수정 (1-2시간)
2. 최종 검증: `npm test` + `npm run build` + `npm run e2e:smoke` (30분)

**성공 조건**:

- ✅ 전체 테스트 3234/3234 PASS (100%)
- ✅ 프로덕션 빌드 ≤ 337.5 KB
- ✅ E2E 스모크 테스트 전체 통과

---

## 📋 Phase 163: vitest Projects 분리 (완료됨 ✅)

**완료 항목**:

- vitest.config.ts에 `raf-timing` 프로젝트 추가
- npm scripts 추가: `test:raf`, `test:raf:watch`
- RAF/포커스 테스트 격리 (7개 테스트)
- 빠른 CI 피드백을 위한 테스트 분할 구조 확립

**미해결**:

- vitest fake timers ↔ Solid.js 반응성 호환성 (장기 과제)
- 일부 테스트 실패는 Phase 164에서 해결 예정

**상세 기록**: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 📈 성공 기준 (Phase 164)

| 항목          | 목표             | 현재      | 상태 |
| ------------- | ---------------- | --------- | ---- |
| 테스트 통과율 | 100% (3234/3234) | 3209/3234 | ⚠️   |
| 빌드 크기     | ≤337.5 KB        | 미빌드    | ⚠️   |
| E2E 테스트    | 전체 PASS        | 미확인    | ❓   |
| 타입 에러     | 0                | 0         | ✅   |
| 린트 에러     | 0                | 0         | ✅   |

**실패 테스트 상세**:

- Bundle Size Policy: 2개 (events.ts 크기/라인 초과)
- Signal Accessor: 2개 (getSolid 모킹 누락)
- CoreService: 11개 (ServiceManager 테스트 전체)
- Event Policy: 10개 (Touch/Pointer 차단 검증)

---

## 📚 참고 문서

- [AGENTS.md](../AGENTS.md) - E2E 하네스 패턴, Solid.js 제약사항
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - 테스트 피라미드 및 vitest
  projects
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  Phase 159-163 완료 기록

---

## 🎯 다음 단계

**즉시 실행 권장** (Priority 1-2, 총 50분):

1. CoreService 테스트 수정 → 11개 복구
2. Signal Accessor Wrapper 수정 → 2개 복구
3. Bundle Size Policy 조정 → 2개 복구

**목표**: 15/25개 테스트 복구하여 95%+ 통과율 달성

**후속 작업** (Priority 3-5):

- Event Policy 구현 확인 (Critical Feature, 1-2시간)
- 빌드 및 E2E 최종 검증 (30분)

**Phase 164 완료 기준**:

- ✅ 전체 테스트 100% PASS (3234/3234)
- ✅ 프로덕션 빌드 생성 및 크기 검증 (≤ 337.5 KB)
- ✅ E2E 스모크 테스트 전체 통과
