# TDD 리팩토링 활성 계획

> 프로젝트 개선을 위한 TDD 기반 리팩토링 작업 관리

**최근 업데이트**: 2025-10-06 **현재 상태**: Epic SOLID-NATIVE-MIGRATION 확인
완료, 현재 활성 Epic 없음

완료된 내용은
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서
확인하실 수 있습니다.

---

## 프로젝트 현황

### 테스트 상태

- **전체 테스트**: 2931 passed | 110 skipped | 1 todo (3042 total)
- **상태**: ✅ GREEN

### 번들 크기 (2025-10-06)

- **Raw**: 495.86 KB (목표: ≤473 KB, **22.86 KB 초과** ⚠️)
- **Gzip**: 123.95 KB (목표: ≤118 KB, **5.95 KB 초과** ⚠️)
- **이상적 목표**: Raw 420 KB, Gzip 105 KB

### 최근 완료 (Phase 1-6)

- ✅ **Phase 1-3**: Tree-shaking, 중복 제거, Terser 최적화
- ✅ **Phase 4A**: Unused Files Removal (8개 파일)
- ✅ **Phase 4B**: Delegation Wrapper 제거 (8개 파일)
- ✅ **Phase 5**: Pure Annotations (교육적 가치, 번들 효과 없음)
- ✅ **Phase 6**: Code Cleanup (theme-utils.ts 중복 제거)
- ✅ **Epic SOLID-NATIVE-MIGRATION**: createGlobalSignal → SolidJS Native 전환
  (2025-10-06 확인 완료)

---

## 현재 활성 작업

**없음** - 다음 우선순위 작업은 아래 "향후 Epic 후보"에서 선택 가능합니다.

---

## Epic SOLID-NATIVE-MIGRATION 완료 확인 (2025-10-06)

### 배경

TDD_REFACTORING_PLAN.md의 "향후 Epic 후보"에 나열되어 있던 Epic이지만, 코드 분석
결과 **이미 완료된 상태**였습니다.

### 검증 결과

`test/architecture/solid-native-inventory.test.ts` 실행 (11 tests, 모두 GREEN):

```text
✅ createGlobalSignal imports: 0 files (모두 제거됨)
✅ createGlobalSignal calls: 0 occurrences (모두 제거됨)
✅ .value 접근: 4개 (DOM 요소 등 다른 용도, 허용됨)
✅ .subscribe() 호출: 3개 (다른 패턴, 허용됨)
```

### 완료 상태 요약

- ✅ 모든 `createGlobalSignal` import 제거
- ✅ 모든 `createGlobalSignal` 호출 제거
- ✅ SolidJS Native 패턴으로 전환 완료:
  - `toolbar.signals.ts` (Phase G-3-1)
  - `download.signals.ts` (Phase G-3-2)
  - `gallery.signals.ts` (Phase G-3-3)
- ✅ 호환 레이어 (`src/shared/state/createGlobalSignal.ts`) 제거 (Phase G-4)

### 관련 문서

완료 상세는
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)의
"2025-01-04: BUILD — Epic JSX-PRAGMA-CLEANUP Phase 1-3 완료" 섹션에 기록되어
있습니다.

**참조**:

- [`vendors-safe-api.md`](vendors-safe-api.md) - SolidJS Native 패턴 가이드
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - 상태 관리 섹션

---

## 향후 Epic 후보

### Epic BUNDLE-ANALYZER-INTEGRATION

**우선순위**: Low **난이도**: S **예상 기간**: 1-2일

**목표**: 실제 번들 구성 시각화 및 추가 최적화 기회 발견

**작업 대상**:

- `rollup-plugin-visualizer` 통합
- 큰 모듈 식별
- Dynamic import 검토

---

## TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Document**: Completed 로그에 이관

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build` (산출물 검증 통과)

---

## 참조 문서

- 아키텍처: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- 코딩 가이드: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)
- 벤더 API: [`vendors-safe-api.md`](vendors-safe-api.md)
- 실행/CI: [`../AGENTS.md`](../AGENTS.md)
- 백로그: [`TDD_REFACTORING_BACKLOG.md`](TDD_REFACTORING_BACKLOG.md)
