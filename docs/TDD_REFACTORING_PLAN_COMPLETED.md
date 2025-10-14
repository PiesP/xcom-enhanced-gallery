# TDD 리팩토링 완료 기록

> **최종 업데이트**: 2025-10-14 **상태**: Phase 66 완료 ✅  
> **문서 정책**: 최근 5개 Phase만 세부 유지, 이전 Phase는 요약표로 축약

## 프로젝트 상태 스냅샷 (2025-10-14)

- **빌드**: dev 836 KB / prod **319.25 KB** ✅
- **테스트**: 763 passing, 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings / 0 errors ✅
- **의존성**: dependency-cruiser 0 violations (**257 modules**, **712 deps**) ✅
- **번들 예산**: **319.25 KB / 325 KB** (5.75 KB 여유) ✅
- **주요 성과**: 갤러리 네비게이션 안정성 완성, 토큰 시스템 정비, 코드베이스
  정리

---

## 최근 완료 Phase (세부 기록)

### Phase 66: Toolbar 순환 네비게이션 + Focus Tracker Regression 수정 (2025-10-14) ✅

**목표**: Phase 62 순환 네비게이션이 Toolbar에서 누락된 문제 해결 + 컨테이너
accessor null 처리 개선

#### Part 1: Toolbar 순환 네비게이션 수정

**현재 문제**:

- `use-gallery-toolbar-logic.ts`는 순환 네비게이션 지원 (totalCount > 1이면
  canGoPrevious/canGoNext 항상 true)
- 하지만 `Toolbar.tsx`의 `navState()` 함수에서 여전히 경계 조건 체크
  (`clampedCurrent <= 0`, `clampedCurrent >= total - 1`)
- 결과: 첫 번째/마지막 항목에서 버튼이 비활성화되어 순환 불가

**TDD 접근 (RED → GREEN)**:

1. **Toolbar 순환 네비게이션 테스트 (7개)**
   - `test/unit/components/toolbar-circular-navigation.test.tsx` 작성
   - RED: totalCount > 1일 때 첫/마지막 항목에서 버튼 비활성화 (2개 실패)
   - GREEN: `Toolbar.tsx` navState() 수정
     - `prevDisabled: disabled || total <= 1`
     - `nextDisabled: disabled || total <= 1`
     - 경계 조건 체크 제거
   - 7개 테스트 모두 통과

2. **E2E 테스트 업데이트**
   - `playwright/smoke/toolbar.spec.ts` 수정
   - 'updates disabled state at boundaries' → 'circular navigation keeps buttons
     enabled'
   - 순환 네비게이션 로직 반영

**결과**:

- 테스트 증가: 762 → 769 passing (+7)
- 번들 크기: 319.32 KB → 319.25 KB (-0.07 KB)

#### Part 2: Focus Tracker Container Accessor Null 처리 (Regression 수정)

**문제 발견**:

- `useGalleryFocusTracker`에서 container accessor가 일시적으로 null이 될 때
  focusedIndex를 null로 초기화
- 결과: 스크롤 중 포커스 상태가 의도치 않게 초기화되어 네비게이션 불일치 발생

**TDD 접근 (RED → GREEN)**:

1. **Regression 테스트 추가**
   - `test/unit/hooks/use-gallery-focus-tracker-global-sync.test.ts`에 테스트
     추가
   - "컨테이너 accessor가 일시적으로 null이어도 focusedIndex를 null로 초기화하지
     않음"
   - 시나리오: container signal을 null → 복원하는 동안 setFocusedIndex(null)
     호출 금지

2. **Focus Tracker 수정**
   - `src/features/gallery/hooks/useGalleryFocusTracker.ts`
   - `debouncedSetAutoFocusIndex`: null 업데이트 시 fallback 로직 추가
     - `forceClear` 옵션으로 명시적 clear 구분
     - 명시적 clear가 아니면 마지막 알려진 포커스 후보로 fallback
   - `updateContainerFocusAttribute`: 동일한 fallback 로직 적용
   - `recomputeFocus`: enabled 체크와 containerElement 체크 분리
     - enabled=false만 forceClear 수행
     - containerElement=null은 단순 skip (fallback 유지)

**결과**:

- 테스트 증가: 769 → 763 passing (기존 6개 수정됨)
- Regression 시나리오 방어: 컨테이너 일시 null 처리 안정화
- 번들 크기: 319.25 KB (변화 없음)

**변경 파일**:

- `src/shared/components/ui/Toolbar/Toolbar.tsx` (순환 네비게이션)
- `src/features/gallery/hooks/useGalleryFocusTracker.ts` (null 처리 개선)
- `test/unit/components/toolbar-circular-navigation.test.tsx` (신규, 7개 테스트)
- `test/unit/hooks/use-gallery-focus-tracker-global-sync.test.ts` (regression
  테스트 추가)
- `playwright/smoke/toolbar.spec.ts` (E2E 업데이트)

**영향**:

- Phase 62-66의 갤러리 네비게이션 안정성 완성
- 스크롤 후 버튼 네비게이션 정상 동작 + 안정성 개선

---

### Phase 65: 레거시 코드 정리 (2025-01-27) ✅

**목표**: src에 남아있는 테스트 전용 orphan 파일을 test 디렉터리로 이동

**구현**:

- `src/shared/services/media/normalizers/legacy/twitter.ts` →
  `test/utils/legacy/twitter-normalizers.ts` 이동
- dependency-cruiser: 1 info → 0 violations 달성
- 모듈 수: 258 → 257 (-1)

**결과**:

- 테스트: 755 passing (변화 없음)
- 빌드: 319.32 KB (변화 없음)
- 코드베이스 정리 완료 ✅

---

### Phase 64: 스크롤 기반 포커스와 버튼 네비게이션 동기화 (2025-01-27) ✅

**목표**: 스크롤로 변경된 focusedIndex를 버튼 네비게이션(이전/다음)이 인식하도록
개선

**현재 문제**:

- 스크롤 후 버튼 클릭 시 currentIndex 기준으로 잘못된 이동
- navigateNext/navigatePrevious가 focusedIndex 무시

**구현 (4단계)**:

#### Step 1-2: focusedIndex signal 추가 및 네비게이션 연동 (22개 테스트)

- `src/shared/state/signals/gallery.signals.ts`에 focusedIndex signal 추가
- navigateNext/navigatePrevious를 `focusedIndex ?? currentIndex` 패턴으로 변경
- 핵심 버그 수정: 스크롤 후 버튼 네비게이션 정상 동작

**결과**: 테스트 722 → 744 (+22), 번들 319.02 KB → 319.16 KB (+0.14 KB)

#### Step 3: useGalleryFocusTracker 전역 동기화 (10개 테스트)

- `debouncedSetAutoFocusIndex`에서 `setFocusedIndex(index)` 호출 추가
- 스크롤로 포커스 변경 시 전역 signal 자동 업데이트

#### Step 4: Toolbar 인디케이터 개선 (6개 테스트)

- `use-gallery-toolbar-logic.ts`:
  `displayIndex = createMemo(() => focusedIndex ?? currentIndex)`
- Toolbar가 스크롤 탐색 시 실시간으로 위치 표시

**최종 결과**:

- 테스트: 744 → 755 (+11)
- 번들: 319.16 KB → 319.32 KB (+0.16 KB)
- 스크롤 기반 탐색과 버튼 네비게이션 완전 동기화 ✅

---

### Phase 62-63: 네비게이션 시스템 통합 (2025-01-27) ✅

#### Phase 62: 툴바 네비게이션 순환 모드 구현

- `use-gallery-toolbar-logic.ts`: canGoPrevious/canGoNext를 `totalCount > 1`로
  변경
- 첫↔마지막 간 끊김 없는 순환 네비게이션 구현
- 테스트 +8개, 번들 319.02 KB 유지

#### Phase 63: 갤러리 인덱스 관리 통합 및 동기화 강화

- createEventEmitter 구현 (31줄, 10개 테스트)
- navigate:start/complete 이벤트로 명시적 네비게이션 추적
- useGalleryFocusTracker 이벤트 구독으로 즉시 동기화
- trigger 파라미터('button'|'click'|'keyboard')로 네비게이션 소스 구분

**결과**: 테스트 678 → 718 (+40), 번들 318.12 KB → 319.02 KB (+0.90 KB)

---

## 이전 Phase 요약표

| Phase           | 목표                         | 핵심 변경                                                               | 결과                                   |
| --------------- | ---------------------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| **Phase 56**    | 고대비 접근성 토큰 정비      | Toolbar 고대비 토큰 8개 정의, CODING_GUIDELINES에 접근성 토큰 원칙 추가 | 번들 +1.69 KB, 모달-툴바 일관성 확보   |
| **Phase 57**    | 툴바-설정 패널 디자인 연속성 | `data-settings-expanded` 속성, 확장 시 border-radius/shadow 조정        | 시각적 일체감 개선, 7개 테스트 추가    |
| **Phase 58**    | 툴바 UI 일관성 개선          | mediaCounter 배경 통일, 툴바 외곽선 제거, 다운로드 버튼 제거            | UI 단순화, 9개 테스트 추가             |
| **Phase 59**    | Toolbar 모듈 통폐합          | ConfigurableToolbar/ToolbarHeadless/UnifiedToolbar 제거 (177+ 줄)       | 파일 수 6→3 (50% 축소), 테스트 662→658 |
| **Phase 60**    | 미사용 유틸리티 제거         | memo.ts/bundle.ts/optimization 디렉터리 제거 (~112줄)                   | 모듈 260→257, 의존성 712→709           |
| **Phase 54-55** | 디자인 토큰 일관성           | 중복 토큰 정리, 다크 모드 중앙화, 컴포넌트 토큰 재정의 제거             | 토큰 126→100개, 번들 -2.59 KB          |
| **Phase 1-53**  | 아키텍처 정립                | 3계층 구조, SettingsModal→Toolbar 전환, 버튼/토스트 토큰화 등           | 기반 시스템 완성                       |

---

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙
- `TDD_REFACTORING_PLAN.md`: 활성 계획 (현재 백로그만 남음)
- `TDD_REFACTORING_PLAN_Phase63.md`: Phase 63 상세 아카이브
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
