# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획

> 프로젝트 개선을 위한 TDD 기반 리팩토링 작업 관리> 프로젝트 개선을 위한 TDD
> 기반 리팩토링 작업 관리

**최근 업데이트**: 2025-10-06 **최근 업데이트**: 2025-10-06

**현재 상태**: Epic BUNDLE-SIZE-DEEP-OPTIMIZATION Phase 6 완료, 현재 활성 Epic
없음**현재 상태**: Epic BUNDLE-SIZE-DEEP-OPTIMIZATION Phase 6 완료, 현재 활성
Epic 없음

완료된 내용은
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서
확인하실 수 있습니다.완료된 내용은
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서
확인하실 수 있습니다.

---

## 프로젝트 현황## 프로젝트 현황

### 테스트 상태### 테스트 상태

- **전체 테스트**: 2931 passed | 110 skipped | 1 todo (3042 total)

- **전체 테스트**: 2931 passed | 110 skipped | 1 todo (3042 total)- **상태**: ✅
  GREEN

- **상태**: ✅ GREEN

### 번들 크기 (2025-10-06)

### 번들 크기 (2025-10-06)- **Raw**: 495.86 KB (목표: ≤473 KB, **22.86 KB 초과** ⚠️)

- **Gzip**: 123.95 KB (목표: ≤118 KB, **5.95 KB 초과** ⚠️)

- **Raw**: 495.86 KB (목표: ≤473 KB, **22.86 KB 초과** ⚠️)- **이상적 목표**: Raw
  420 KB, Gzip 105 KB

- **Gzip**: 123.95 KB (목표: ≤118 KB, **5.95 KB 초과** ⚠️)

- **이상적 목표**: Raw 420 KB, Gzip 105 KB### 최근 완료 (Phase 1-6)

- ✅ **Phase 1-3**: Tree-shaking, 중복 제거, Terser 최적화

### 최근 완료 (Phase 1-6)- ✅ **Phase 4A**: Unused Files Removal (8개 파일)

- ✅ **Phase 4B**: Delegation Wrapper 제거 (8개 파일)

- ✅ **Phase 1-3**: Tree-shaking, 중복 제거, Terser 최적화- ✅ **Phase 5**: Pure
  Annotations (교육적 가치, 번들 효과 없음)

- ✅ **Phase 4A**: Unused Files Removal (8개 파일)- ✅ **Phase 6**: Code Cleanup
  (theme-utils.ts 중복 제거)

- ✅ **Phase 4B**: Delegation Wrapper 제거 (8개 파일)

- ✅ **Phase 5**: Pure Annotations (교육적 가치, 번들 효과 없음)---

- ✅ **Phase 6**: Code Cleanup (theme-utils.ts 중복 제거)

## 현재 활성 Epic

---

**없음** - 다음 우선순위 작업은 아래 "향후 Epic 후보"에서 선택 가능합니다.

## 현재 활성 Epic

---

**없음** - 다음 우선순위 작업은 아래 "향후 Epic 후보"에서 선택 가능합니다.

### Phase 4B 완료 요약 (2025-10-06)

---

**제거된 파일** (8개):

## 향후 Epic 후보

- UnifiedSettingsModal.tsx (wrapper), vendor-api.ts (delegation)

### Epic SOLID-NATIVE-MIGRATION- core-icons.ts (delegation), event-managers.ts (unused index)

- icon-types.ts (empty), barrel.ts (re-export)

**우선순위**: Medium - BatchDOMUpdateManager.ts (delegation),
position-calculator.ts (unused util)

**난이도**: M

**예상 기간**: 3-5일**결과**:

**목표**: 레거시 `createGlobalSignal`을 SolidJS Native 패턴으로 전환- TDD: RED →
GREEN → REFACTOR 성공

- 테스트: 2899 passed (계약 테스트 추가)

**예상 효과**:- 번들: 495.86 KB (변화 없음, 이미 tree-shaken)

- 코드베이스 정리 목적 달성

- 코드 일관성 향상

- SolidJS 반응성 시스템 완전 활용**상세**:

- 유지보수성
  개선[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

**참조**: [`vendors-safe-api.md`](vendors-safe-api.md)---

---### Phase 5 완료 요약 (2025-10-06)

### Epic BUNDLE-ANALYZER-INTEGRATION**작업 내용**:

**우선순위**: Low - 31개 pure 함수 식별 (4개 카테고리)

**난이도**: S - 15개 함수에 `/*#__PURE__*/` 어노테이션 추가

**예상 기간**: 1-2일- 27개 계약 테스트 작성 (RED 단계)

- 자동화 스크립트 작성 및 실행 (GREEN 단계)

**목표**: 실제 번들 구성 시각화 및 추가 최적화 기회 발견

**결과**:

**작업 대상**:

- TDD: RED → GREEN → REFACTOR 성공

- `rollup-plugin-visualizer` 통합- 테스트: 2926 passed

- 큰 모듈 식별- 번들: 495.86 KB (baseline: 495.19 KB, +0.67 KB)

- Dynamic import 검토- 교육적 가치: PURE 어노테이션 올바른 사용법 학습

---**분석**:

## TDD 워크플로- PURE 주석은 함수 정의가 아닌 함수 호출 앞에 있어야 효과적

- 모든 어노테이션 추가 함수가 실제 사용 중 (dead code 없음)

1. **RED**: 실패 테스트 추가 (최소 명세)- 실제 번들 감소는 Phase 6 (Dead Code
   제거)에서 기대

2. **GREEN**: 최소 변경으로 통과

3. **REFACTOR**: 중복 제거/구조 개선**상세**:

4. **Document**: Completed 로그에
   이관[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md),

[`docs/phase5-pure-annotations-analysis.md`](phase5-pure-annotations-analysis.md)

**품질 게이트**:

---

- ✅ `npm run typecheck` (strict 오류 0)

- ✅ `npm run lint:fix` (자동 수정 적용)### Phase 6: Dead Code 제거 - 활성

- ✅ `npm test` (해당 Phase GREEN)

- ✅ `npm run build` (산출물 검증 통과)**목표**: knip 보고서 기반 미사용 코드
  제거 (-45 KB, -9%) **예상 기간**: 3-4일

**현재 상태**: 준비 중

---

**작업 대상** (knip 보고서 분석):

## 참조 문서

- **Unused exports**: 111개

- 아키텍처: [`ARCHITECTURE.md`](ARCHITECTURE.md)- **Unused files**: 96개

- 코딩 가이드: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)- **Unused
  dependencies**: 3개

- 벤더 API: [`vendors-safe-api.md`](vendors-safe-api.md)- **Unused
  devDependencies**: 2개

- 실행/CI: [`../AGENTS.md`](../AGENTS.md)

- 백로그: [`TDD_REFACTORING_BACKLOG.md`](TDD_REFACTORING_BACKLOG.md)**전략**:

1. **분석 단계**: 각 항목의 실제 사용 여부 검증 (grep, semantic search)
2. **RED 단계**: 제거 대상 테스트 작성 (absence verification)
3. **GREEN 단계**: 안전 제거 (단계별 커밋)
4. **REFACTOR 단계**: 의존성 그래프 재검증, import 정리

**우선순위**:

- **High**: Unused files (큰 번들 영향)
- **Medium**: Unused exports (tree-shaking 개선)
- **Low**: Unused dependencies (package.json 정리)

---

### Phase 7 준비: Bundle Analyzer 도입

**목표**: 실제 번들 구성 시각화 및 세밀 최적화 (-10 KB) **예상 기간**: 2-3일
**Phase 6 완료 후 진행**

**작업 대상**:

- `rollup-plugin-visualizer` 통합
- 큰 모듈 식별 및 최적화
- Dynamic import 전환 (필요 시)

---

## 4. 최근 완료된 Epic

### ✅ GALLERY-UX-REFINEMENT (2025-10-06)

**성과**: 갤러리 UX 정교화 완료 (4개 Sub-Epic, 8 commits) **상세 내용**:
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

---

## 5. 향후 Epic 후보

### Epic SOLID-NATIVE-MIGRATION

**우선순위**: Medium **난이도**: M **예상 기간**: 3-5일

**목표**: 레거시 `createGlobalSignal`을 SolidJS Native 패턴으로 전환

**예상 효과**:

- 코드 일관성 향상
- SolidJS 반응성 시스템 완전 활용
- 유지보수성 개선

---

## 6. TDD 워크플로

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

**다음 액션**: Phase 4B 분석 단계 시작 → 미사용 파일 검증
