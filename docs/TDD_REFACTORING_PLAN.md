# TDD 리팩토링 활성 계획

> 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링 Epic 관리 문서

**최근 업데이트**: 2025-10-06 **현재 상태**: Epic BUNDLE-SIZE-DEEP-OPTIMIZATION
Phase 4 진행 중

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

### Phase 5: Pure Annotations 추가 - 활성

**목표**: `/*#__PURE__*/` 주석 추가로 Terser 최적화 강화 (-10 KB) **예상 기간**:
2-3일 **현재 상태**: 준비 중

**작업 대상**:

- Logger 함수들 (`logInfo`, `logError`, `logDebug`, `logWarn`)
- 헬퍼 유틸리티 (부작용 없는 순수 함수만)
- factory 함수들 (`createMediaItem`, `createServiceFactory` 등)

**예시**:

```typescript
// Before
export function createMediaItem(data: MediaData): MediaItem {
  return { ...data, id: generateId() };
}

// After
export const createMediaItem = /*#__PURE__*/ (data: MediaData): MediaItem => {
  return { ...data, id: generateId() };
};
```

**TDD 워크플로** (Phase 5):

#### 분석 단계

1. **순수 함수 식별**:

   ```pwsh
   # 로거 함수 찾기
   grep -rn "export function log" src/shared/logging/

   # factory 함수 찾기
   grep -rn "export function create" src/ --include="*.ts"

   # 헬퍼 유틸리티 찾기
   grep -rn "export function" src/shared/utils/ --include="*.ts"
   ```

2. **순수성 검증**:
   - 부작용 없음 (DOM 조작, 네트워크 요청, 전역 상태 변경 등)
   - 동일 입력 → 동일 출력
   - 외부 의존성 최소화

#### RED 단계

- 순수 함수 목록 작성
- 각 함수에 PURE annotation 추가 여부 검증 테스트
- 번들 크기 베이스라인 기록

#### GREEN 단계

- 검증된 순수 함수에 `/*#__PURE__*/` 추가
- 함수 → 화살표 함수 const로 변환 (필요시)
- 번들 크기 감소 확인

#### REFACTOR 단계

- 타입 안전성 검증
- ESLint 규칙 업데이트 (PURE annotation 권장)
- 문서화

#### Verification

- 번들 크기 -10 KB 달성
- 모든 테스트 통과
- 타입 체크 통과

---

### Phase 6 준비: Advanced Tree-shaking

**목표**: 고급 tree-shaking 기법 적용 (-10 KB) **예상 기간**: 3-4일 **Phase 5
완료 후 진행**

**작업 대상**:

- Re-export 체인 최적화 (≤3 depth 유지)
- Side-effect 명시 강화
- Dynamic import 최적화

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
