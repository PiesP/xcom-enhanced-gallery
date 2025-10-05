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
- 🚀 **Phase 4B**: Needs Investigation (다음 단계, -4~6 KB 예상)
- 📋 **Phase 5**: Pure Annotations 추가 (계획됨, -10 KB 예상)
- 📋 **Phase 6**: Advanced Tree-shaking (계획됨, -10 KB 예상)
- ⏸️ **Phase 7**: Orphan 정리 (보류, 실제 orphan 2개뿐)

---

### Phase 4A 완료 요약 (2025-10-06)

**제거된 파일**:

- createParitySnapshot.ts (gallery, settings) - 미사용 테스트 헬퍼
- VerticalGalleryView.tsx + CSS - 레거시 에러 스텁

**결과**:

- TDD: RED → GREEN → REFACTOR 성공
- 테스트: 2890 passed (계약 테스트 추가)
- 번들: 495.19 KB → 495.86 KB (미미한 증가, 코드베이스 정리 목적 달성)

**상세**:
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

---

### Phase 4B: 신중 검토 후 제거 (Needs Investigation) - 활성

**목표**: 의심되는 미사용 파일 검증 후 제거 (-4~6 KB) **예상 기간**: 2-3일
**현재 상태**: 준비 중

**작업 대상**:

1. **UnifiedSettingsModal.tsx**
   - `src/shared/components/ui/SettingsModal/UnifiedSettingsModal.tsx`
   - **분석 필요**: SettingsModal wrapper, 실제 사용 여부 확인
   - **검증 방법**: `grep -r 'UnifiedSettingsModal' src/`, 동적 import 확인

2. **vendor-api.ts**
   - `src/shared/external/vendors/vendor-api.ts`
   - **분석 필요**: 벤더 타입 정의, tree-shaking 가능 여부
   - **검증 방법**: 타입만 포함 시 런타임 영향 없음

3. **서비스 파일들** (5개)
   - `src/shared/services/core-icons.ts`
   - `src/shared/services/event-managers.ts`
   - `src/shared/services/icon-types.ts`
   - `src/shared/services/media-mapping/MediaMappingService.ts`
   - `src/shared/services/media-mapping/MediaTabUrlDirectStrategy.ts`
   - **분석 필요**: dynamic import로 인한 오탐 가능성
   - **검증 방법**: ServiceContainer 등록 여부, 런타임 사용 추적

4. **유틸리티 파일들** (6개)
   - `src/shared/utils/accessibility/barrel.ts`
   - `src/shared/utils/dom/BatchDOMUpdateManager.ts`
   - `src/shared/utils/position-calculator.ts`
   - `src/shared/utils/styles/style-utils.ts`
   - `src/shared/styles/theme-utils.ts`
   - `src/features/gallery/types.ts`
   - **분석 필요**: 타입 vs 구현체 구분, 실제 사용처 확인

**TDD 워크플로** (Phase 4B):

#### 분석 단계 (Phase 4B)

1. **사용처 검색**:

   ```pwsh
   foreach ($file in @('UnifiedSettingsModal', 'vendor-api', 'core-icons', 'event-managers')) {
     Write-Host "`n=== $file ===" -ForegroundColor Cyan
     grep -rn "$file" src/ --include="*.ts" --include="*.tsx" | Select-String -Pattern "import"
   }
   ```

2. **동적 import 확인**:

   ```pwsh
   grep -rn "import(" src/ --include="*.ts" --include="*.tsx"
   ```

3. **ServiceContainer 확인**:

   ```pwsh
   grep -rn "register.*Service" src/shared/container/ --include="*.ts"
   ```

#### RED 단계 (Phase 4B)

- 파일별로 제거 테스트 작성 (Phase 4A 패턴 유사)
- 각 파일의 영향 범위 문서화

#### GREEN 단계 (Phase 4B)

- 검증된 미사용 파일만 제거
- 단계별 테스트 실행 (파일 1개 제거 → 테스트 → 다음 파일)

#### REFACTOR 단계 (Phase 4B)

- 타입 정의 통합 (여러 파일에 분산된 타입 정리)
- barrel exports 최적화

#### Verification (Phase 4B)

- 각 파일 제거 후 즉시 검증
- 누적 번들 크기 감축 확인

---

### Phase 5 준비: Pure Annotations 추가

**목표**: `/*#__PURE__*/` 주석 추가로 Terser 최적화 강화 (-10 KB) **예상 기간**:
2-3일 **Phase 4 완료 후 즉시 진행**

**작업 대상**:

- Logger 함수들 (`logInfo`, `logError`, etc.)
- 헬퍼 유틸리티 (순수 함수만)
- factory 함수들

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
