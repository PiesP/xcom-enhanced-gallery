# TDD 리팩토링 활성 계획

> 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링 Epic**Phase
> 구성**:

- ✅ **Phase 1-3**: 완료 (Tree-shaking, 중복 제거, Terser 최적화)
- ✅ **Phase 4A**: 완료 (Unused Files Removal, 코드베이스 정리)
- ✅ **Phase 4B**: 완료 (Investigation-based Removal, delegation wrapper 제거)
- ✅ **Phase 5**: 완료 (Pure Annotations, 교육적 가치, 번들 효과 없음)
- ⏳ **Phase 6**: Dead Code 제거 (다음 단계, knip 기반, -45 KB 예상)
- 📋 **Phase 7**: Bundle Analyzer 도입 (계획됨, 세밀 최적화)
- ⏸️ **Phase 8**: Orphan 정리 (보류, 실제 orphan 2개뿐)**최근 업데이트**:
  2025-10-06 **현재 상태**: Epic BUNDLE-SIZE-DEEP-OPTIMIZATION Phase 4 진행 중

완료된 내용은
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서
확인하실 수 있습니다.

---

## 1. 운영 원칙

**참조 문서**:

- 코딩/스타일/입력/벤더 접근/테스트:
  [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md),
  [`vendors-safe-api.md`](vendors-safe-api.md)
- 실행/CI/빌드: [`../AGENTS.md`](../AGENTS.md)
- 아키텍처: [`ARCHITECTURE.md`](ARCHITECTURE.md)

**Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로 분할하여 단계적
진행

---

## 2. 프로젝트 현황

### 테스트 상태

- **전체 테스트**: 2873 passed | 110 skipped | 1 todo (2984)
- **상태**: ✅ GREEN

### 번들 크기

- **Raw**: 495.19 KB (목표: ≤473 KB, **22 KB 초과** ⚠️)
- **Gzip**: 123.73 KB (목표: ≤118 KB, **5.73 KB 초과** ⚠️)
- **이상적 목표**: Raw 420 KB, Gzip 105 KB

### 완료된 최적화 (2025-10-05)

- ✅ Tree-shaking 개선 (`package.json` sideEffects, Rollup treeshake 옵션)
- ✅ 중복 코드 제거 (`core-utils.ts` 중복 → `utils.ts` 통합)
- ✅ Terser 압축 강화 (pure_funcs, unsafe opts, mangleProps)
- ✅ 15개 계약 테스트 GREEN (회귀 방지)

---

## 3. 활성 Epic 현황

### Epic BUNDLE-SIZE-DEEP-OPTIMIZATION

**우선순위**: 🔥 High (번들 크기 목표 22 KB 초과) **현재 상태**: Phase 4A 완료,
Phase 4B 준비 중 **시작일**: 2025-10-06

**목표**: 번들 크기를 495 KB → 450 KB (-45 KB, -9%)로 최적화하여 목표(≤473 KB)
달성

**Phase 구성**:

- ✅ **Phase 1-3**: 완료 (Tree-shaking, 중복 제거, Terser 최적화)
- ✅ **Phase 4A**: 완료 (Unused Files Removal, 코드베이스 정리)
- ✅ **Phase 4B**: 완료 (Investigation-based Removal, delegation wrapper 제거)
- � **Phase 5**: Pure Annotations 추가 (다음 단계, -10 KB 예상)
- 📋 **Phase 6**: Advanced Tree-shaking (계획됨, -10 KB 예상)
- ⏸️ **Phase 7**: Orphan 정리 (보류, 실제 orphan 2개뿐)

---

### Phase 4B 완료 요약 (2025-10-06)

**제거된 파일** (8개):

- UnifiedSettingsModal.tsx (wrapper), vendor-api.ts (delegation)
- core-icons.ts (delegation), event-managers.ts (unused index)
- icon-types.ts (empty), barrel.ts (re-export)
- BatchDOMUpdateManager.ts (delegation), position-calculator.ts (unused util)

**결과**:

- TDD: RED → GREEN → REFACTOR 성공
- 테스트: 2899 passed (계약 테스트 추가)
- 번들: 495.86 KB (변화 없음, 이미 tree-shaken)
- 코드베이스 정리 목적 달성

**상세**:
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

---

### Phase 5 완료 요약 (2025-10-06)

**작업 내용**:

- 31개 pure 함수 식별 (4개 카테고리)
- 15개 함수에 `/*#__PURE__*/` 어노테이션 추가
- 27개 계약 테스트 작성 (RED 단계)
- 자동화 스크립트 작성 및 실행 (GREEN 단계)

**결과**:

- TDD: RED → GREEN → REFACTOR 성공
- 테스트: 2926 passed
- 번들: 495.86 KB (baseline: 495.19 KB, +0.67 KB)
- 교육적 가치: PURE 어노테이션 올바른 사용법 학습

**분석**:

- PURE 주석은 함수 정의가 아닌 함수 호출 앞에 있어야 효과적
- 모든 어노테이션 추가 함수가 실제 사용 중 (dead code 없음)
- 실제 번들 감소는 Phase 6 (Dead Code 제거)에서 기대

**상세**:
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md),
[`docs/phase5-pure-annotations-analysis.md`](phase5-pure-annotations-analysis.md)

---

### Phase 6: Dead Code 제거 - 활성

**목표**: knip 보고서 기반 미사용 코드 제거 (-45 KB, -9%) **예상 기간**: 3-4일
**현재 상태**: 준비 중

**작업 대상** (knip 보고서 분석):

- **Unused exports**: 111개
- **Unused files**: 96개
- **Unused dependencies**: 3개
- **Unused devDependencies**: 2개

**전략**:

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
