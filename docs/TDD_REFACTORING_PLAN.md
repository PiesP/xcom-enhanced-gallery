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

**우선순위**: 🔥 High (번들 크기 목표 22 KB 초과) **현재 상태**: Phase 4 진행 중
**시작일**: 2025-10-06

**목표**: 번들 크기를 495 KB → 450 KB (-45 KB, -9%)로 최적화하여 목표(≤473 KB)
달성

**Phase 구성**:

- ✅ **Phase 1-3**: 완료 (Tree-shaking, 중복 제거, Terser 최적화)
- 🚀 **Phase 4**: Unused Exports Removal (진행 중, -8~12 KB 예상)
- 📋 **Phase 5**: Pure Annotations 추가 (계획됨, -10 KB 예상)
- 📋 **Phase 6**: Advanced Tree-shaking (계획됨, -10 KB 예상)
- ⏸️ **Phase 7**: Orphan 정리 (보류, 실제 orphan 2개뿐)

---

### Phase 4 상세 계획: Unused Exports Removal

**배경**:

- 원래 계획: Phase 4 "Orphan 파일 정리 (-5 KB)"
- **문제 발견** (2025-10-06): `npm run deps:all` 실행 결과 orphan 파일 2개만
  존재
  - `src/shared/polyfills/solid-jsx-dev-runtime.ts` (DEV 전용, intentionally
    kept)
  - `src/shared/utils/visible-navigation.ts` (future use, intentionally kept)
- **대안 분석**: knip 5.64.1로 Unused Exports 분석 실행 → 96개 미사용 파일 +
  111개 미사용 exports 발견
- **솔루션**: Unused Exports Removal (Option D) + Pure Annotations (Option A)
  통합 접근

**분석 도구 및 결과**:

- **도구**: knip 5.64.1 (2025-10-06 실행)
- **명령어**: `npx knip --exports --reporter json`
- **전체 결과**:
  - 미사용 파일 (files): 96개
    - test/_, scripts/_: ~78개 (번들에 미포함)
    - **src/\*: 18개** (번들 영향 ⚠️)
  - 미사용 exports (issues): ~111개
    - types/interfaces: ~90% (런타임 영향 없음)
    - 중복 exports (duplicates): ~10개
    - 실제 구현체: 소수

**src/\* 내 미사용 파일 (18개)**:

1. `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`
   (레거시 스텁, 즉시 제거 가능)
2. `src/features/gallery/solid/createParitySnapshot.ts` (테스트 헬퍼, 즉시 제거
   가능)
3. `src/features/gallery/types.ts` (타입만, 검토 필요)
4. `src/features/settings/solid/createParitySnapshot.ts` (테스트 헬퍼, 즉시 제거
   가능)
5. `src/shared/components/ui/SettingsModal/UnifiedSettingsModal.tsx` (wrapper,
   검토 필요)
6. `src/shared/external/vendors/vendor-api.ts` (검토 필요)
7. `src/shared/interfaces/ServiceInterfaces.ts` (타입, 낮은 우선순위)
8. `src/shared/polyfills/solid-jsx-dev-runtime.ts` (DEV 전용, **보존 필수**)
   9-18. 서비스/유틸리티 파일들 (상세 분석 필요)

**번들 크기 영향 추정**:

- **즉시 제거 가능 (Phase 4A)**: ~4-6 KB
  - createParitySnapshot.ts (2개): ~2-3 KB
  - VerticalGalleryView.tsx (레거시 스텁): ~1-2 KB
  - 기타 검증된 미사용: ~1 KB

- **신중 검토 후 제거 (Phase 4B)**: ~4-6 KB
  - 레거시 컴포넌트/서비스
  - Dynamic import로 인한 오탐 제외 후

- **총 예상 감축**: ~8-12 KB

---

### Phase 4A: 즉시 제거 가능 항목 (Safe-to-Delete)

**목표**: 검증된 미사용 파일 제거 (-4~6 KB) **예상 기간**: 1-2일

**작업 대상**:

1. **createParitySnapshot.ts** (2개)
   - `src/features/gallery/solid/createParitySnapshot.ts`
   - `src/features/settings/solid/createParitySnapshot.ts`
   - **확인**: `grep -r 'createParitySnapshot' src/` → 사용처 0개
   - **목적**: Solid 마이그레이션 테스트 헬퍼 (개발 전용)
   - **제거 가능**: ✅ (프로덕션 코드 미사용)

2. **VerticalGalleryView.tsx** (레거시 제거 스텁)
   - `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`
   - **내용**: `throw new Error('Legacy component removed')` 만 포함
   - **확인**: `grep -r 'VerticalGalleryView' src/` → import 없음 (index.ts
     주석만)
   - **제거 가능**: ✅ (의도적으로 에러 던지는 스텁)

**TDD 워크플로** (Phase 4A):

#### RED 단계

```typescript
// test/architecture/bundle-size-unused-removal.test.ts
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';

describe('Phase 4A: Unused File Removal', () => {
  it('should remove createParitySnapshot from gallery', () => {
    const filePath = 'src/features/gallery/solid/createParitySnapshot.ts';
    expect(existsSync(filePath)).toBe(false); // RED: 파일 존재
  });

  it('should remove createParitySnapshot from settings', () => {
    const filePath = 'src/features/settings/solid/createParitySnapshot.ts';
    expect(existsSync(filePath)).toBe(false); // RED: 파일 존재
  });

  it('should remove legacy VerticalGalleryView stub', () => {
    const filePath =
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx';
    expect(existsSync(filePath)).toBe(false); // RED: 파일 존재
  });
});
```

#### GREEN 단계

1. **파일 제거**:

   ```pwsh
   Remove-Item src/features/gallery/solid/createParitySnapshot.ts
   Remove-Item src/features/settings/solid/createParitySnapshot.ts
   Remove-Item src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx
   ```

2. **Import 정리**:
   - `src/features/gallery/components/vertical-gallery-view/index.ts` 확인
   - 기타 re-export 제거

3. **테스트 실행**:

   ```pwsh
   npm run typecheck  # 타입 체크
   npm test           # 전체 테스트 GREEN 확인
   npm run build:dev  # 빌드 성공 확인
   ```

4. **번들 크기 측정**:
   ```pwsh
   npm run build:prod
   Get-ChildItem dist -File | Select-Object Name, @{Name="SizeKB";Expression={[math]::Round($_.Length/1KB, 2)}}
   ```

#### REFACTOR 단계

- barrel exports 정리 (index.ts 파일들)
- 미사용 import 제거
- 주석 업데이트

#### Verification

- ✅ 타입 체크 통과
- ✅ 전체 테스트 GREEN
- ✅ 번들 크기 -4~6 KB 확인
- ✅ 소스맵 유효성 검증

---

### Phase 4B: 신중 검토 후 제거 (Needs Investigation)

**목표**: 의심되는 미사용 파일 검증 후 제거 (-4~6 KB) **예상 기간**: 2-3일

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

#### 분석 단계

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

#### RED 단계

- 파일별로 제거 테스트 작성 (Phase 4A 패턴 유사)
- 각 파일의 영향 범위 문서화

#### GREEN 단계

- 검증된 미사용 파일만 제거
- 단계별 테스트 실행 (파일 1개 제거 → 테스트 → 다음 파일)

#### REFACTOR 단계

- 타입 정의 통합 (여러 파일에 분산된 타입 정리)
- barrel exports 최적화

#### Verification

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

**다음 액션**: Phase 4A RED 단계 시작 → 테스트 작성
