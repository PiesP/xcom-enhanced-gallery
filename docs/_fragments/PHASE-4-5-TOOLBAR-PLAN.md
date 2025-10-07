# Phase 4.5 Toolbar 시스템 구현 계획 (2025-10-07)

## 📊 현황 분석 완료

### 완료된 컴포넌트 (3/6)

- ✅ IconButton.solid.tsx (초기 + UI Button 업그레이드)
- ✅ Button.solid.tsx (8 variants, 4 sizes, 5 intents)
- ✅ ToolbarShell.solid.tsx (3 elevations, 3 surfaces, 3 positions)

### 나머지 컴포넌트 크기/복잡도 분석

| 컴포넌트                | 라인 수 | 크기   | 복잡도 | 주요 기능                            |
| ----------------------- | ------- | ------ | ------ | ------------------------------------ |
| ToolbarHeadless.tsx     | 147     | 4.4KB  | 중간   | Headless UI, render props, 상태 관리 |
| Toolbar.tsx             | 580     | 19.5KB | 높음   | 완전한 Toolbar UI, 이벤트 핸들링     |
| ToolbarWithSettings.tsx | 57      | 1.9KB  | 낮음   | Toolbar + SettingsModal 통합         |

### Git 브랜치 상태

- **현재 브랜치**: feature/phase-4-components
- **Base 브랜치**: master (bd1691e4)
- **커밋 수**: 14개 (Phase 4.1~4.5 진행 중)
- **변경 파일**: docs/dependency-graph.json (unstaged)
- **전략**: 나머지 3개 컴포넌트 완료 후 master로 병합

---

## 🎯 ToolbarHeadless.solid.tsx 구현 계획

### 원본 파일 분석 (147 lines)

**핵심 구조**:

```typescript
// 타입 정의
export type FitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';
export interface ToolbarItem { type, group, disabled?, loading?, onAction? }
export interface ToolbarState { items, currentMode, needsHighContrast, isDownloading, currentIndex, totalCount, currentFitMode }
export interface ToolbarActions { setMode, setHighContrast, setFitMode, setDownloading, updateItems }

// Props (10+ callbacks)
export interface ToolbarHeadlessProps {
  currentIndex, totalCount, isDownloading?,
  onPrevious?, onNext?, onDownloadCurrent?, onDownloadAll?, onClose?, onOpenSettings?,
  onFitOriginal?, onFitWidth?, onFitHeight?, onFitContainer?,
  children: (state, actions) => VNode
}

// 구현
- useState × 4: currentFitMode, isDownloading, highContrast, mode
- useMemo: items 배열 (10개 항목, callback 조건부 연결)
- render props pattern: children(state, actions)
```

**Solid.js 마이그레이션 포인트**:

1. useState → createSignal (4개)
2. useMemo → createMemo (items 배열)
3. render props → JSX 함수 호출
4. Props spreading: mergeProps + splitProps
5. VNode → JSX.Element

**예상 테스트** (25-30개):

- Compile & Type (3-4 tests)
- FitMode values (4 tests)
- State management (4 tests: currentFitMode, isDownloading, highContrast, mode)
- ToolbarItem generation (10 tests: 각 버튼 disabled/callback 조건)
- Render props (3-4 tests: state/actions 전달)
- Combined scenarios (2-3 tests)

**예상 시간**: 1-1.5시간

---

## 🎯 Toolbar.solid.tsx 구현 계획

### 원본 파일 분석 (580 lines)

**핵심 구조**:

```typescript
// Props (16+ 속성)
export interface ToolbarProps {
  currentIndex, totalCount, isDownloading?, disabled?, currentViewMode?, onViewModeChange?,
  onPrevious, onNext, onDownloadCurrent, onDownloadAll, onClose, onOpenSettings?,
  onFitOriginal?, onFitWidth?, onFitHeight?, onFitContainer?,
  position?, className?, data-testid?, aria-label?, aria-describedby?, role?, tabIndex?,
  onFocus?, onBlur?, onKeyDown?
}

// 구현 특징
- useToolbarState hook (상태 관리)
- IconButton 사용 (12개 버튼)
- EventManager 통합
- throttleScroll 최적화
- 복잡한 class 조합
- Position-based layout
- Animation states
```

**Solid.js 마이그레이션 포인트**:

1. useToolbarState → createToolbarState (custom primitive)
2. IconButton Preact → IconButton.solid 사용
3. EventManager 통합 유지
4. throttleScroll → Solid 이벤트 시스템 활용
5. Class composition: 함수 반환
6. mergeProps + splitProps (complex grouping)

**예상 테스트** (40-50개):

- Compile & Type (5-6 tests)
- Props (15-20 tests: 모든 callback, ARIA, data-\*)
- Buttons (12 tests: 각 버튼 props/state)
- Position (4 tests: top/bottom/left/right)
- ViewMode (4 tests)
- Disabled/Loading states (5 tests)
- Combined scenarios (5-8 tests)

**예상 시간**: 2.5-3.5시간 (가장 복잡)

---

## 🎯 ToolbarWithSettings.solid.tsx 구현 계획

### 원본 파일 분석 (57 lines)

**핵심 구조**:

```typescript
// Props
export interface ToolbarWithSettingsProps extends Omit<ToolbarProps, 'onOpenSettings'> {
  settingsPosition?: 'center' | 'toolbar-below' | 'bottom-sheet' | 'top-right';
  settingsTestId?: string;
}

// 구현
- useState: isSettingsOpen
- useCallback × 2: handleOpenSettings, handleCloseSettings
- Fragment: Toolbar + SettingsModal 조건부 렌더링
```

**Solid.js 마이그레이션 포인트**:

1. useState → createSignal (isSettingsOpen)
2. useCallback → 일반 함수 (Solid는 자동 메모이제이션)
3. Fragment → JSX <>...</>
4. Conditional: {isSettingsOpen() && <SettingsModal />}
5. mergeProps for defaults

**예상 테스트** (12-15개):

- Compile & Type (2-3 tests)
- Props inheritance (3-4 tests: ToolbarProps 전달)
- SettingsPosition (4 tests)
- State management (2-3 tests: open/close)
- Integration (2-3 tests: Toolbar + Modal)

**예상 시간**: 30-45분 (가장 간단)

---

## 📅 전체 작업 일정

### 순서 (의존성 기반)

1. **ToolbarHeadless** (1-1.5h) - Headless UI 패턴, 상태 관리
2. **Toolbar** (2.5-3.5h) - 가장 복잡, IconButton 의존
3. **ToolbarWithSettings** (0.5-0.75h) - Toolbar + SettingsModal 통합

### 총 예상 시간: 4.5-6시간

### 체크포인트

- [ ] ToolbarHeadless: 25-30 tests GREEN
- [ ] Toolbar: 40-50 tests GREEN
- [ ] ToolbarWithSettings: 12-15 tests GREEN
- [ ] 전체 TypeScript 0 errors
- [ ] npm run build 성공
- [ ] dependency-graph 업데이트
- [ ] 3개 커밋 (각 컴포넌트별)

---

## 🔄 브랜치 전략

### 현재 상태

- feature/phase-4-components 브랜치에서 작업 중
- master로부터 14개 커밋 ahead

### 계획

1. **현재 브랜치 유지**: 나머지 3개 컴포넌트 완료
2. **최종 검증**: npm run build + validate
3. **문서 갱신**: TDD_REFACTORING_PLAN.md → COMPLETED.md 이관
4. **master 병합**: feature/phase-4-components → master (PR 또는 직접 병합)
5. **브랜치 정리**: feature/phase-4-components 삭제 또는 보관

### 병합 전 체크리스트

- [ ] 모든 테스트 GREEN (168+ Phase 0 tests)
- [ ] TypeScript 0 errors
- [ ] Build 성공 (dev + prod)
- [ ] 문서 갱신 완료
- [ ] dependency-graph 커밋

---

## 📝 문서 갱신 계획

### TDD_REFACTORING_PLAN.md 수정

- Phase 4.5 상태: 진행 중 → 완료
- 완료 내역 추가 (6개 컴포넌트 목록)
- 테스트 수 업데이트
- 커밋 SHA 기록

### TDD_REFACTORING_PLAN_COMPLETED.md 이관

- Phase 4.5 전체 섹션 이동
- 실행 로그 및 교훈 포함
- 성능 메트릭 (번들 크기, 테스트 수)

### AGENTS.md 갱신

- Phase 4.5 완료 반영
- 다음 Phase (4.6 또는 5) 준비 상태 업데이트

---

## ⚠️ 주의 사항

### 의존성

- SettingsModal.solid.tsx 필요 (ToolbarWithSettings에서 사용)
  - 확인 필요: SettingsModal Solid 버전 존재 여부
  - 없으면 Phase 4.5 범위 확장 또는 Preact 버전 임시 사용

### 테스트 범위

- Phase 0만 진행 (compile/type verification)
- 실행 테스트는 Phase 1 이후 (별도 계획 필요)

### 성능 검증

- 번들 크기 측정 (각 컴포넌트 추가 후)
- 목표: Preact 대비 유지 또는 감소

---

## 🎯 성공 기준

- ✅ Phase 4.5 완료: 6/6 컴포넌트 Solid 전환
- ✅ 총 테스트: 84+ Phase 0 tests (168+ executions)
- ✅ TypeScript: 0 errors (strict mode)
- ✅ Build: dev + prod 성공
- ✅ 문서: 간결하고 최신 상태 유지
- ✅ Git: 깨끗한 커밋 히스토리 (17개 커밋 예상)

**다음 Phase**: 4.6 기타 컴포넌트 또는 Phase 5 Features 계층
