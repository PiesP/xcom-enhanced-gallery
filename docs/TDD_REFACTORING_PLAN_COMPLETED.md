# TDD 리팩토링 완료 기록

> **최종 업데이트**: 2025-10-14 **상태**: Phase 56 완료 ✅ **문서 정책**: 최근
> Phase만 세부 유지, 이전 Phase는 요약표로 축약 (목표: 400-500줄)

## 프로젝트 상태 스냅샷 (2025-10-14)

- **빌드**: dev 836.01 KB / prod **318.40 KB** ✅
- **테스트**: 658 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings / 0 errors ✅
- **의존성**: dependency-cruiser 0 violations (**257 modules**, **709 deps**) ✅
- **번들 예산**: **318.40 KB / 325 KB** (6.60 KB 여유) ✅
- **개선**: Phase 54-60 작업으로 코드베이스 단순화 및 불필요한 유틸리티 제거

---

## 최근 완료 Phase

### Phase 56: 고대비/접근성 토큰 정비 (2025-10-14) ✅

**목표**: 툴바 고대비 모드에서 하드코딩된 중립색 직접 참조를 토큰화하여 모달과
일관성 확보

**현재 문제**:

- `Toolbar.module.css`의 `.galleryToolbar.highContrast` 및
  `.highContrast .toolbarButton`가 `var(--xeg-color-neutral-100)`,
  `var(--xeg-color-neutral-900)` 등 중립색 직접 참조
- 모달의 고대비 토큰 (`--xeg-modal-bg-high-contrast` 등)과 명명 패턴이 다르고
  괴리 발생
- 접근성 토큰 사용 원칙이 `CODING_GUIDELINES.md`에 명시되지 않음

**TDD 접근 (RED → GREEN → REFACTOR)**:

1. **RED**: 고대비 토큰 가드 테스트 추가
   - `test/styles/token-definition-guard.test.ts`에 3개 테스트 추가:
     - 고대비 모드용 툴바 토큰 8개 존재 검증
       (`--xeg-toolbar-*-high-contrast-light/dark`,
       `--xeg-toolbar-button-*-high-contrast-light/dark`)
     - `[data-theme='light']` 블록에 라이트 변형 오버라이드 검증
     - `[data-theme='dark']` 블록에 다크 변형 오버라이드 검증
   - 테스트 실행 결과: 3개 실패 (예상대로 RED 상태)

2. **GREEN**: 고대비 토큰 정의
   - `src/shared/styles/design-tokens.semantic.css`의 `Component Scope Tokens`
     섹션에 추가:
     - 라이트 변형: `--xeg-toolbar-bg-high-contrast-light`,
       `--xeg-toolbar-border-high-contrast-light`,
       `--xeg-toolbar-button-bg-high-contrast-light`,
       `--xeg-toolbar-button-border-high-contrast-light`
     - 다크 변형: `--xeg-toolbar-bg-high-contrast-dark`,
       `--xeg-toolbar-border-high-contrast-dark`,
       `--xeg-toolbar-button-bg-high-contrast-dark`,
       `--xeg-toolbar-button-border-high-contrast-dark`
     - 기본값 (라이트 모드): `--xeg-toolbar-bg-high-contrast`,
       `--xeg-toolbar-border-high-contrast`,
       `--xeg-toolbar-button-bg-high-contrast`,
       `--xeg-toolbar-button-border-high-contrast`
   - `[data-theme='light']` 블록에 라이트 변형 오버라이드 추가
   - `[data-theme='dark']` 블록에 다크 변형 오버라이드 추가
   - 테스트 실행 결과: 10/10 passing ✅ (GREEN 상태)

3. **REFACTOR**: Toolbar 고대비 구간 업데이트
   - `src/shared/components/ui/Toolbar/Toolbar.module.css`:
     - `.galleryToolbar.highContrast`: `var(--xeg-color-neutral-100)` →
       `var(--xeg-toolbar-bg-high-contrast)`
     - `.galleryToolbar.highContrast`: `var(--xeg-color-overlay-medium)` →
       `var(--xeg-toolbar-border-high-contrast)`
     - `[data-theme='dark'] .galleryToolbar.highContrast`:
       `var(--xeg-color-neutral-900)` → `var(--xeg-toolbar-bg-high-contrast)`
     - `[data-theme='dark'] .galleryToolbar.highContrast`:
       `var(--xeg-glass-border)` → `var(--xeg-toolbar-border-high-contrast)`
     - `.highContrast .toolbarButton`: `var(--xeg-glass-bg)` →
       `var(--xeg-toolbar-button-bg-high-contrast)`
     - `.highContrast .toolbarButton`: `var(--xeg-color-overlay-light)` →
       `var(--xeg-toolbar-button-border-high-contrast)`
     - `[data-theme='dark'] .highContrast .toolbarButton`:
       `var(--xeg-color-neutral-700)` →
       `var(--xeg-toolbar-button-bg-high-contrast)`
     - `[data-theme='dark'] .highContrast .toolbarButton`:
       `var(--xeg-glass-border)` →
       `var(--xeg-toolbar-button-border-high-contrast)`
   - `docs/CODING_GUIDELINES.md`: 접근성 토큰 사용 원칙 섹션 추가 (Phase 56)
     - 고대비 토큰 정의 패턴 (라이트/다크 변형, 기본값, 테마별 오버라이드)
     - CSS 모듈에서 사용 예시
       (`.toolbar.highContrast { background: var(--xeg-toolbar-bg-high-contrast) !important; }`)

**결과**:

- ✅ 고대비 토큰 8개 정의 완료 (라이트/다크 변형 모두)
- ✅ token-definition-guard.test.ts에 3개 가드 테스트 추가로 재발 방지
- ✅ Toolbar.module.css에서 하드코딩된 중립색 직접 참조 완전 제거
- ✅ 모달과 툴바의 고대비 토큰 명명 패턴 일관성 확보
- ✅ CODING_GUIDELINES.md에 접근성 토큰 사용 원칙 추가
- ✅ 번들 크기 미미한 증가: 316.71 KB → 318.40 KB (+1.69 KB, 여전히 예산 내 6.60
  KB 여유)
- ✅ 테스트: 658 passing 유지, 모든 품질 게이트 GREEN
- ✅ TypeScript/ESLint: 0 errors/warnings 유지

**교훈**:

- 접근성 상태(고대비, 강조 포커스 등)도 컴포넌트 토큰으로 체계화하면 일관성이
  향상됨
- 라이트/다크 변형 + 테마별 오버라이드 패턴은 모든 상태 토큰에 적용 가능
- token-definition-guard.test.ts의 가드 테스트로 토큰 누락을 조기에 감지할 수
  있음
- 번들 크기 영향이 미미하여 (1.69 KB) 접근성 개선 대비 비용이 낮음

---

### Phase 60: 미사용 유틸리티 및 편의 함수 제거 (2025-10-14) ✅

**목표**: 실제로 사용되지 않는 유틸리티 모듈과 HOC 편의 함수 제거

**현재 문제**:

- `memo.ts`: 빈 스텁 함수 (component를 그대로 반환, 10줄)
- `bundle.ts`: 테스트 전용 유틸리티가 프로덕션 번들에 포함 (32줄)
- `optimization/index.ts`: 위 파일들의 barrel export (12줄)
- `GalleryHOC.tsx` 내 5개 편의 함수: 사용되지 않는 convenience wrapper (~70줄)
  - `withGalleryContainer`, `withGalleryItem`, `withGalleryControl`
  - `withGalleryOverlay`, `GalleryHOC` (alias)

**검증**: grep 검색으로 실제 사용처 0건 확인

- `memo()` import: 0건
- `createBundleInfo/isWithinSizeTarget` import (src/): 0건
- 5개 HOC 편의 함수 호출: 0건 (정의만 존재)
- 핵심 `withGallery` 함수는 18곳에서 사용 중 → 보존

**구현 (TDD: RED → GREEN → REFACTOR)**:

1. **RED**: 파일 삭제 전 기존 테스트 통과 확인
   - 658 passing, 1 skipped ✅
   - 의존성: 260 modules, 712 dependencies

2. **GREEN**: 미사용 코드 삭제
   - `src/shared/utils/optimization/memo.ts` 삭제 (10줄)
   - `src/shared/utils/optimization/bundle.ts` 삭제 (32줄)
   - `src/shared/utils/optimization/index.ts` 삭제 (12줄)
   - `src/shared/index.ts`: `export * from './utils/optimization';` 제거
   - `src/shared/components/hoc/GalleryHOC.tsx`: 5개 편의 함수 블록 제거 (~70줄)
   - 테스트 실행: 658 passing, 1 skipped ✅ (유지, 테스트 파일 삭제 없음)

3. **REFACTOR**: 빌드 및 의존성 검증
   - 빌드: `npm run build` 성공 ✅
   - 의존성: 260 → **257 modules** (-3), 712 → **709 deps** (-3) ✅
   - 번들 크기: 316.71 KB 유지 (Dead code elimination 최적화 완료)

**결과**:

- 112+ 줄의 미사용 코드 제거 ✅
- 모듈 수 감소: 260 → 257 (-3개) ✅
- 의존성 감소: 712 → 709 (-3개) ✅
- 테스트: 658 passing 유지 (변화 없음, 테스트 파일 삭제 없었음) ✅
- 타입 에러 0건 유지 ✅
- 번들 크기: 316.71 KB (변경 없음, DCE로 이미 최적화됨) ✅
- 모든 빌드/검증 통과 ✅

**파일 변경**:

- **삭제**: 3개 파일 (54줄)
  - `src/shared/utils/optimization/memo.ts`
  - `src/shared/utils/optimization/bundle.ts`
  - `src/shared/utils/optimization/index.ts`
- **수정**: 2개 파일 (58줄 제거)
  - `src/shared/index.ts` (optimization export 제거)
  - `src/shared/components/hoc/GalleryHOC.tsx` (5개 편의 함수 블록 제거)

**코드베이스 개선**:

- Optimization 디렉터리 완전 제거 (불필요한 추상화 제거)
- HOC 패턴 단순화: 핵심 `withGallery` 함수만 유지
- 코드 가독성 향상 (불필요한 wrapper 제거)
- 프로덕션 번들에 테스트 전용 코드 포함되지 않음 보장

---

### Phase 59: Toolbar 모듈 통폐합 및 명명 규칙 재검토 (2025-10-14) ✅

**목표**: 사용되지 않는 레거시 파일 제거 및 import 경로 정리로 코드베이스 단순화

**현재 문제**:

- `ConfigurableToolbar.tsx`: 빈 스텁 파일 (null만 반환, 11줄)
- `ToolbarHeadless.tsx`: Headless UI 패턴이지만 실제 사용처 없음 (158줄)
- `UnifiedToolbar.tsx`: 단순 re-export 파일로 불필요한 간접 참조 추가 (8줄)

**구현 (TDD: RED → GREEN → REFACTOR)**:

1. **RED**: 파일 삭제 전 기존 테스트 통과 확인
   - 662 passing, 1 skipped ✅
   - grep 검색으로 import 사용처 0건 확인

2. **GREEN**: 사용되지 않는 파일 삭제
   - `src/shared/components/ui/Toolbar/ConfigurableToolbar.tsx` 삭제
   - `src/shared/components/ui/Toolbar/ToolbarHeadless.tsx` 삭제
   - `src/shared/components/ui/Toolbar/UnifiedToolbar.tsx` 삭제
   - `test/unit/components/toolbar-headless-memo.test.tsx` 삭제 (의존 테스트)
   - 테스트 실행: 658 passing, 1 skipped ✅ (4개 테스트 감소, 예상대로)

3. **REFACTOR**: Playwright 하네스 정리
   - `playwright/harness/index.ts`:
     - `ToolbarHeadless` import 제거
     - `evaluateToolbarHeadlessHarness` 함수 제거 (65줄)
   - `playwright/harness/types.d.ts`:
     - `ToolbarHeadlessResult` 타입 제거
     - `FitMode`, `ToolbarItem` import 제거
     - `XegHarness.evaluateToolbarHeadless` 메서드 제거
   - 빌드 검증: `npm run build` 성공 ✅

**결과**:

- 177+ 줄의 미사용 코드 제거 ✅
- import 경로가 `Toolbar.tsx`로 직접 참조 (기존에도 직접 import 사용 중이었음)
  ✅
- 테스트 감소: 662 → 658 passing (삭제된 테스트 파일로 인한 예상된 감소) ✅
- 타입 에러 0건 유지 ✅
- 번들 크기 유지: 316.71 KB (변경 없음, 사용되지 않던 코드라 영향 없음) ✅
- 모든 빌드/검증 통과 ✅

**파일 변경**:

- **삭제**: 4개 파일 (177+ 줄)
  - `src/shared/components/ui/Toolbar/ConfigurableToolbar.tsx`
  - `src/shared/components/ui/Toolbar/ToolbarHeadless.tsx`
  - `src/shared/components/ui/Toolbar/UnifiedToolbar.tsx`
  - `test/unit/components/toolbar-headless-memo.test.tsx`
- **수정**: 2개 파일
  - `playwright/harness/index.ts` (import 및 함수 제거)
  - `playwright/harness/types.d.ts` (타입 및 메서드 제거)

**Toolbar 디렉터리 최종 구조**:

```text
src/shared/components/ui/Toolbar/
├── Toolbar.tsx (661 줄) - 메인 구현
├── Toolbar.types.ts - 타입 정의
└── Toolbar.module.css - 스타일
```

**코드베이스 개선**:

- 파일 수 감소: 6개 → 3개 (50% 축소)
- 불필요한 추상화 제거 (Headless 패턴, Configurable 스텁, 재출력 래퍼)
- 테스트 유지보수 부담 감소 (의존 테스트 제거)
- 코드 가독성 향상 (import 경로가 명확해짐)

---

### Phase 58: 툴바 UI 일관성 개선 (2025-10-14) ✅

**목표**: 3가지 UI 일관성 개선

1. mediaCounter 텍스트 컨테이너의 색상을 툴바 배경색과 통일
2. 툴바의 외곽선 제거하고 전체적인 외곽선 디자인 패턴 통일
3. 이미지 오른쪽 상단의 다운로드용 버튼 제거

**현재 문제**:

- mediaCounter가 독립적인 배경색/외곽선으로 분리되어 보임
- galleryToolbar 외곽선이 과도한 시각적 구분 생성
- VerticalImageItem의 다운로드 버튼이 불필요한 UI 복잡도 추가

**구현 (TDD: RED → GREEN → REFACTOR)**:

1. **RED**: `test/refactoring/toolbar-ui-consistency.test.ts` 생성
   - 9개 테스트 작성: mediaCounter background/border, toolbar border, download
     button 제거 검증
   - 초기 5개 실패 확인 (RED 상태)
2. **GREEN**: 최소 구현으로 테스트 통과
   - `Toolbar.module.css`:
     - `.galleryToolbar`: `border: none;` (Phase 58 주석 추가)
     - `.mediaCounter`: `background: transparent;`, `border: none;`
   - `VerticalImageItem.tsx`:
     - download button 조건부 렌더링 주석 처리
     - Button/ButtonProps import 주석 처리
     - handleDownloadClick 핸들러 주석 처리
     - onDownload prop 제거
   - 전체 9개 테스트 통과 (GREEN 상태)

3. **REFACTOR**: 불필요한 코드 정리
   - `VerticalImageItem.module.css`:
     - downloadButton/downloadIcon 스타일 주석 처리 (4개 블록)
     - 미디어 쿼리 내 downloadButton 스타일 주석 처리 (3개 블록)
   - 전체 테스트 스위트 재실행: 662 passed, 1 skipped ✅

**결과**:

- mediaCounter가 툴바와 시각적으로 완전히 통합됨 ✅
- 툴바 외곽선 제거로 더 깔끔한 디자인 패턴 확립 ✅
- 갤러리 아이템의 다운로드 버튼 제거로 UI 단순화 ✅
- 번들 크기 소폭 증가 (316.29 KB → 316.71 KB, +0.42 KB)
- 여전히 325 KB 제한 이내 (8.29 KB 여유) ✅
- 모든 테스트 통과 유지 ✅

**파일 변경**:

- `src/shared/components/ui/Toolbar/Toolbar.module.css` (2곳 수정)
- `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx`
  (download button 제거)
- `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css`
  (미사용 스타일 주석 처리)
- `test/refactoring/toolbar-ui-consistency.test.ts` (신규, 9개 테스트)

**디자인 원칙 강화**:

- 컴포넌트 내부 요소는 컴포넌트 배경과 통일 (mediaCounter)
- 과도한 외곽선 제거로 시각적 noise 감소
- 불필요한 인터랙션 요소 제거로 UX 단순화

---

### Phase 57: 툴바-설정 패널 디자인 연속성 개선 (2025-10-14) ✅

**목표**: 툴바에서 설정 버튼 클릭 시 패널이 자연스럽게 확장되도록 시각적 연속성
개선

**구현**:

- `Toolbar.tsx`: `data-settings-expanded` 속성 추가로 확장 상태를 CSS에 노출
- `Toolbar.module.css`:
  - 확장 시 툴바 하단 border-radius 제거
    (`var(--xeg-radius-lg) var(--xeg-radius-lg) 0 0`)
  - 통합 그림자 적용 (`var(--xeg-shadow-lg)`)으로 패널과 일체감 형성
  - 설정 패널은 상단 border만 미세하게 유지해 구분 제공
- `test/refactoring/toolbar-settings-panel-continuity.test.ts`:
  - 7개 테스트로 시각적 연속성, 애니메이션 smoothness, reduced-motion 지원 검증

**DOM 구조 결정**:

- 인디케이터 DOM 중첩 검토 결과, 현재 3-level 구조(wrapper > counter > spans +
  absolute progressBar)가 overlay 패턴에 최적임을 확인
- 변경 불필요 판단

**결과**:

- 툴바와 설정 패널이 시각적으로 하나의 컴포넌트처럼 보임 ✅
- 디자인 토큰 기반 스타일로 일관성 유지 ✅
- 모바일/다크 모드/reduced-motion 모두 대응 ✅
- 번들 영향 미미 (<1KB 증가, 8.71 KB 여유 유지)
- 전체 테스트 통과 (662 passed, 1 skipped) ✅

**파일 변경**:

- `src/shared/components/ui/Toolbar/Toolbar.tsx` (+1 line)
- `src/shared/components/ui/Toolbar/Toolbar.module.css` (+8 lines)
- `test/refactoring/toolbar-settings-panel-continuity.test.ts` (NEW, 105 lines)

### Phase 55: 모달/툴바 토큰 정합성 복구 (2025-10-14) ✅

- `design-tokens.semantic.css`: 툴바·설정·모달이 동일한 컴포넌트 토큰을
  공유하도록 경계/배경 토큰 정리
- `Toolbar.module.css`: 기본/모바일/감속 상태와 설정 패널을
  `--xeg-comp-toolbar-*` 토큰으로 통일, 다크 전용 배경 오버라이드 제거
- `test/styles/token-definition-guard.test.ts`: 모달 토큰 정의 검증을 강화해
  회귀를 방지
- 결과: 툴바·모달·설정 패널이 동일한 색조를 유지하고 접근성 모드에서도 토큰 기반
  표현 유지 (번들 영향 미미)

### Phase 54: 디자인 토큰 일관성 개선 (2025-10-14) ✅

- 컴포넌트 레벨 토큰 재정의 제거, 다크 모드 토큰 중앙화, 레거시 alias 정리로
  토큰 건강도 126 → 100개
- 자동 정책 테스트 추가로 재발 건을 차단, 번들 316.29 KB 유지 (-2.59 KB 개선)

## 누적 Phase 요약

- Phase 1-53: 아키텍처 정립, SettingsModal → Toolbar 전환, 버튼/토스트 토큰화 등
  (세부는 `TDD_REFACTORING_PLAN.md.bak` 참조)
- Phase 54-55: 디자인 토큰 체계 안정화 및 고대비 대응 준비

## 참고 자료

- `docs/TDD_REFACTORING_PLAN.md`: 활성 계획
- `docs/ARCHITECTURE.md`: 구조 가이드
- `docs/CODING_GUIDELINES.md`: 코딩 규칙 및 디자인 토큰 정책
- `docs/TDD_REFACTORING_PLAN.md.bak`: 이전 상세 계획 보관본
