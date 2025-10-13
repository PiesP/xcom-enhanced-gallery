# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-13> **최종 업데이트**: 2025-10-13

> >

> **상태**: Phase 44-50 진행 중 🚧> **상태**: 프로젝트 안정화 완료 �

## 프로젝트 상태## 프로젝트 상태

- **빌드**: dev 734.31 KB / prod 322.07 KB ✅- **빌드**: dev 734.31 KB / prod
  322.07 KB ✅

- **테스트**: 689 passing, 1 skipped (정책 가드) ✅- **테스트**: 689 passing, 1
  skipped (정책 가드) ✅

- **타입**: TypeScript strict, 0 errors ✅- **타입**: TypeScript strict, 0
  errors ✅

- **린트**: ESLint 0 warnings ✅- **린트**: ESLint 0 warnings ✅

- **의존성**: 0 violations (268 modules, 738 dependencies) ✅- **의존성**: 0
  violations (268 modules, 738 dependencies) ✅

- **번들 예산**: 322.07 KB / 325 KB (2.93 KB 여유) ⚠️ 예산 근접- **번들 예산**:
  322.07 KB / 325 KB (2.93 KB 여유) ⚠️ 예산 근접

## 참고 문서## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로- `AGENTS.md`: 개발 환경 및 워크플로

- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-43 완료 기록-
  `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-43 완료 기록

- `ARCHITECTURE.md`: 아키텍처 구조- `ARCHITECTURE.md`: 아키텍처 구조

- `CODING_GUIDELINES.md`: 코딩 규칙- `CODING_GUIDELINES.md`: 코딩 규칙

---

## 현재 진행 중: Toolbar Expandable Settings (Phase 44-50)## 현재 상태

### 목표### Phase 43까지 완료 ✅

설정 모달을 독립된 모달/패널 형태에서 **툴바 내부 확장** 형태로 재구성하여:Phase
1-43의 모든 리팩토링 작업이 완료되었습니다. 세부 내역은

`TDD_REFACTORING_PLAN_COMPLETED.md`를 참조하세요.

1. **번들 크기 최적화**: SettingsModal의 과도한 로직(focus trap, scroll lock,
   modal positioning 등) 제거

2. **UI/UX 개선**: 설정이 툴바와 한 곳에서 관리되어 더 직관적인 사용자
   경험**주요 성과**:

3. **코드 간소화**: ToolbarWithSettings 통합 컴포넌트를 단순화하거나 제거

- ✅ ToolbarWithSettings 통합 완료

### 솔루션 선택: 하이브리드 패턴 (Toolbar 확장 + 경량 Settings)- ✅ Settings Modal 레거시 코드 완전 제거

- ✅ 테스트 커버리지 개선 (skipped 96% 감소)

**선택 이유**:- ✅ 의존성 정책 강화 및 그래프 갱신

- ✅ 문서 간소화 완료

- 번들 크기가 매우 타이트함 (2.93 KB 여유만 남음)

- SettingsModal의 복잡한 모달 로직(focus trap, scroll lock, backdrop 등)은 툴바
  내부 확장에는 과도함---

- lazy loading도 제거 가능 (툴바와 함께 로드되므로)

- glassmorphism 디자인 일관성 유지 가능## 다음 단계 (선택적)

- 더 가벼운 구조로 재설계 가능

### 번들 크기 최적화 (권장 시점: 323 KB 초과 시)

**대안 검토**:

**현재**: 322.07 KB / 325 KB (2.93 KB 여유)

| 솔루션 | 장점 | 단점 | 선택 여부 |

|--------|------|------|-----------|**고려 사항**:

| A. 아코디언 패턴 (단순 확장) | 가장 간단, 자연스러운 애니메이션 | Toolbar
복잡도 증가, 반응형 처리 | ❌ |

| B. 드롭다운 패널 (컴포넌트 분리) | 테스트 격리 쉬움, 기존 로직 재사용 | 번들
크기 개선 효과 적음 | ❌ |1. CSS 최적화: 중복 토큰 제거, 미사용 규칙 정리 (예상
2-3 KB)

| C. 하이브리드 (경량 설정 통합) ⭐ | 번들 크기 최적화 극대화, UI/UX 일관성 |
대규모 리팩토링 필요, 테스트 재작성 | ✅ |2. Tree-shaking: 미사용 export 확인,
barrel export 최소화

3. 대형 컴포넌트 분석: 50 KB 초과 컴포넌트 타겟팅

---

### 백로그 항목

## Phase 44: ToolbarExpandable 기본 구조 (TDD) 🔄

**접근성**:

**목표**: Toolbar에 확장/축소 상태 관리 및 애니메이션 추가

- ARIA labels 확장

### Step 1: 상태 관리 추가- 키보드 네비게이션 개선

- 스크린 리더 지원 강화

- [ ] `useToolbarState`에 `settingsExpanded` 상태 추가

- [ ] `toggleSettings`, `expandSettings`, `collapseSettings` 액션 구현**성능**:

- [ ] 테스트: 상태 전환 로직 검증

- Intersection Observer 최적화

### Step 2: 확장 영역 UI 구조- 이미지 lazy loading 개선

- 메모리 사용량 프로파일링

- [ ] Toolbar 컴포넌트에 `expandableSection` 마크업 추가

- [ ] 초기 상태: `height: 0`, `overflow: hidden`**코드 품질**:

- [ ] 테스트: 확장 영역이 접힌 상태에서 렌더링되는지 검증

- 복잡도 높은 함수 리팩토링

### Step 3: 애니메이션 구현- 타입 추론 개선

- 중복 코드 추가 제거

- [ ] CSS transition으로 `height` 애니메이션 처리

- [ ] `max-height` 또는 실제 높이 계산 로직 구현---

- [ ] 테스트: 상태 변경 시 클래스 적용 검증

## 중기 계획 (향후 1-2주)

### Step 4: 설정 버튼 연결

1. **성능 모니터링**: 번들 크기 추이 관찰, 빌드 시간 최적화 검토

- [ ] 설정 버튼 클릭 시 `toggleSettings` 호출2. **E2E 테스트 강화**: Playwright
      스모크 테스트 확장, 주요 사용자 시나리오

- [ ] `aria-expanded` 속성 동적 설정 커버리지

- [ ] 테스트: 버튼 클릭 시 상태 변경 검증3. **의존성 정리**: 미사용
      devDependencies 검토, `depcheck` 실행 후 정리

**수용 기준**:---

- 설정 버튼 클릭 시 툴바가 아래로 확장됨## 프로젝트 건강도 지표

- 재클릭 시 축소됨

- 애니메이션이 자연스럽게 작동 (200-300ms transition)- **번들 크기**: 322.07 KB
  / 325 KB ⚠️ 예산 근접

- PC 전용 이벤트만 사용 (click, keydown)- **테스트 통과율**: 100% (689/689) ✅

- **Skipped 테스트**: 1개 (정책 가드, 의도적) ✅

---- **타입 안전성**: TypeScript strict mode ✅

- **코드 품질**: ESLint 0 warnings ✅

## Phase 45: Settings 패널 통합 🔄- **의존성 정책**: 0 violations ✅

**목표**: SettingsModal의 핵심 기능만 추출하여 Toolbar 내부에 통합**전반적
평가**: 프로젝트는 안정적이며 유지보수 가능한 상태입니다. Phase 1-43의

모든 리팩토링이 성공적으로 완료되었습니다.

### Step 1: 설정 UI 구조 설계

- [ ] Theme select/Language select를 Toolbar 확장 영역에 배치
- [ ] 기존 `SettingsModal.module.css`에서 필요한 스타일만 추출
- [ ] 테스트: 설정 UI가 확장 영역에 렌더링되는지 검증

### Step 2: useSettingsModal 로직 통합

- [ ] `useSettingsModal` 훅을 Toolbar 컴포넌트 내부로 이동
- [ ] ThemeService/LanguageService 의존성 주입
- [ ] 테스트: 테마/언어 변경 로직이 올바르게 작동하는지 검증

### Step 3: 불필요한 훅 제거

- [ ] `useFocusTrap` 제거 (툴바 내부는 focus trap 불필요)
- [ ] `useScrollLock` 제거 (modal이 아니므로 불필요)
- [ ] `useModalPosition` 제거 (고정 위치)
- [ ] 테스트: 제거된 훅 없이도 정상 작동하는지 검증

### Step 4: 이벤트 핸들러 정리

- [ ] 백드롭 클릭 로직 제거
- [ ] 간소화된 `onClose` 로직 (Escape 키만 처리)
- [ ] 테스트: Escape 키로 설정 영역이 축소되는지 검증

**수용 기준**:

- Theme/Language select가 확장 영역에 올바르게 표시됨
- 테마/언어 변경이 정상 작동함
- focus trap, scroll lock 등 과도한 로직이 제거됨
- 번들 크기가 최소 5-10 KB 감소함

---

## Phase 46: 스타일 및 디자인 일관성 🔄

**목표**: glassmorphism 디자인 유지 및 디자인 토큰 준수

### Step 1: 디자인 토큰 준수

- [ ] 모든 색상을 `--xeg-*` 토큰으로 변경
- [ ] `border-radius`, `padding`, `gap` 등 spacing 토큰 사용
- [ ] 테스트: 하드코딩된 색상/값이 없는지 검증

### Step 2: glassmorphism 효과 유지

- [ ] 확장 영역에 `backdrop-filter: blur()` 적용
- [ ] 반투명 배경 (`rgba` with opacity)
- [ ] 테스트: glassmorphism 관련 CSS 속성 존재 검증

### Step 3: 반응형 디자인

- [ ] 모바일 뷰포트에서 확장 영역 레이아웃 조정
- [ ] 최소 클릭 타겟 크기 유지 (2.5em)
- [ ] 테스트: 미디어 쿼리 정의 검증

**수용 기준**:

- `design-token-usage.test.ts` 통과
- `settings-modal-design-consistency.test.ts` 통과
- glassmorphism 효과가 툴바와 일관되게 적용됨

---

## Phase 47: 접근성 및 키보드 네비게이션 🔄

**목표**: ARIA 속성 및 키보드 네비게이션 구현

### Step 1: ARIA 속성 추가

- [ ] 설정 버튼에 `aria-expanded` 속성 동적 설정
- [ ] 확장 영역에 `role="region"` 또는 `role="group"` 추가
- [ ] `aria-labelledby`로 설정 버튼과 영역 연결
- [ ] 테스트: ARIA 속성이 올바르게 설정되는지 검증

### Step 2: 키보드 네비게이션

- [ ] Escape 키로 설정 영역 축소
- [ ] Tab 키로 설정 내 요소 간 이동
- [ ] 테스트: 키보드 이벤트 핸들러 검증

### Step 3: 포커스 관리

- [ ] 설정 확장 시 첫 번째 select로 포커스 이동 (선택적)
- [ ] 설정 축소 시 설정 버튼으로 포커스 복귀
- [ ] 테스트: 포커스 흐름 검증

**수용 기준**:

- `settings-modal.accessibility.test.tsx` 관련 테스트 통과
- PC 전용 이벤트만 사용 (touch/pointer 이벤트 없음)
- 키보드만으로도 모든 설정 접근 가능

---

## Phase 48: SettingsModal 레거시 제거 🔄

**목표**: 기존 SettingsModal 관련 파일 및 의존성 정리

### Step 1: ToolbarWithSettings 단순화

- [ ] `ToolbarWithSettings.tsx`에서 SettingsModal import 제거
- [ ] lazy loading 로직 제거
- [ ] 필요 시 ToolbarWithSettings를 완전히 제거하고 Toolbar만 사용
- [ ] 테스트: Toolbar 단독으로 설정 기능 작동 검증

### Step 2: SettingsModal 파일 제거

- [ ] `src/shared/components/ui/SettingsModal/*` 파일 삭제
- [ ] `src/shared/components/ui/index.ts`에서 SettingsModal export 제거
- [ ] 테스트: import 오류 없는지 검증

### Step 3: 관련 훅 정리

- [ ] `use-settings-modal.ts` 제거 또는 Toolbar로 통합
- [ ] `use-focus-trap.ts`, `use-scroll-lock.ts`, `use-modal-position.ts` 사용처
      확인 후 정리
- [ ] 테스트: 의존성 그래프에서 사라졌는지 검증

### Step 4: 의존성 그래프 업데이트

- [ ] `npm run deps:all` 실행
- [ ] 제거된 파일이 그래프에서 사라졌는지 확인
- [ ] 테스트: dependency-cruiser 정책 위반 없는지 검증

**수용 기준**:

- SettingsModal 관련 파일이 완전히 제거됨
- 의존성 위반 없음 (0 violations)
- 번들 크기가 목표치 이하로 감소 (예상: 315-318 KB)

---

## Phase 49: 테스트 마이그레이션 🔄

**목표**: 기존 SettingsModal 테스트를 Toolbar 테스트로 통합

### Step 1: 단위 테스트 통합

- [ ] `settings-modal.accessibility.test.tsx` → `toolbar.test.tsx`로 병합
- [ ] `settings-modal-design-consistency.test.ts` → `toolbar-styles.test.ts`로
      병합
- [ ] 테스트: 모든 테스트 케이스가 통과하는지 검증

### Step 2: E2E 테스트 업데이트

- [ ] Playwright harness에서 SettingsModal 관련 API 제거
- [ ] Toolbar 확장/축소 시나리오 추가
- [ ] 테스트: E2E 스모크 테스트 통과

### Step 3: 커버리지 유지

- [ ] `npm run test:coverage` 실행
- [ ] 커버리지가 기존 수준 유지되는지 확인 (최소 80%+)
- [ ] 테스트: 커버리지 리포트 검토

**수용 기준**:

- 689개 이상의 테스트가 통과함
- E2E 테스트 포함 모든 테스트 GREEN
- 커버리지가 기존 수준 유지됨

---

## Phase 50: 최적화 및 검증 🔄

**목표**: 번들 크기 측정, 성능 프로파일링, 문서 업데이트

### Step 1: 번들 크기 측정

- [ ] `npm run build:prod` 실행
- [ ] 번들 크기 비교 (before: 322.07 KB → after: ?)
- [ ] 목표: 315 KB 이하 (7 KB+ 절약)

### Step 2: 성능 프로파일링

- [ ] 확장/축소 애니메이션 FPS 측정
- [ ] 메모리 사용량 프로파일링
- [ ] 테스트: 성능 저하 없는지 검증

### Step 3: 문서 업데이트

- [ ] `ARCHITECTURE.md`: Toolbar expandable settings 구조 반영
- [ ] `CODING_GUIDELINES.md`: 필요 시 업데이트
- [ ] `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 44-50 완료 기록 이관

### Step 4: 최종 검증

- [ ] `npm run validate` (typecheck + lint + format)
- [ ] `npm test` (전체 테스트)
- [ ] `npm run build` (dev + prod)
- [ ] `npm run maintenance:check` (프로젝트 건강도)

**수용 기준**:

- 번들 크기가 325 KB 예산 이하로 유지됨
- 모든 품질 게이트 통과 (typecheck, lint, test, build)
- 문서가 최신 상태로 업데이트됨

---

## 예상 효과

### 번들 크기

- **Before**: 322.07 KB (2.93 KB 여유)
- **After**: ~315 KB 예상 (10 KB 여유)
- **절약**: ~7 KB (SettingsModal 로직 제거 + lazy loading 제거)

### 코드 품질

- Toolbar 컴포넌트가 self-contained됨
- 불필요한 modal 관련 훅 제거로 복잡도 감소
- 테스트 격리 개선

### 사용자 경험

- 설정이 툴바와 한 곳에서 관리되어 더 직관적
- 모달 오버레이 없이 자연스러운 확장/축소
- 애니메이션이 더 부드러움

---

## 다음 단계 (Phase 50 이후)

### 백로그 항목

**접근성**:

- ARIA live regions 확장
- 스크린 리더 안내 개선

**성능**:

- Intersection Observer 최적화
- 이미지 lazy loading 개선

**코드 품질**:

- 복잡도 높은 함수 리팩토링
- 타입 추론 개선

---

## 프로젝트 건강도 지표

- **번들 크기**: 322.07 KB / 325 KB ⚠️ 예산 근접 (Phase 44-50으로 개선 예정)
- **테스트 통과율**: 100% (689/689) ✅
- **Skipped 테스트**: 1개 (정책 가드, 의도적) ✅
- **타입 안전성**: TypeScript strict mode ✅
- **코드 품질**: ESLint 0 warnings ✅
- **의존성 정책**: 0 violations ✅

**전반적 평가**: Phase 44-50을 통해 번들 크기 최적화 및 코드 간소화를 진행
중입니다.
