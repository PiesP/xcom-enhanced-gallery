# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-01-08 — Epic UI-TEXT-ICON-OPTIMIZATION 완료, 새로운 활성
Epic 준비 중

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심
- **Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로 분할하여 단계적
  진행

---

## 2. 활성 Epic 현황

### 현재 활성 Epic

#### Epic CUSTOM-TOOLTIP-COMPONENT (활성화: 2025-01-08)

**목적**: 커스텀 툴팁 컴포넌트 구현 — 키보드 단축키 시각적 강조 (`<kbd>`) +
브랜드 일관성 + 완전한 다국어 지원

**우선순위**: P2 (Medium Impact) — 사용자 경험 개선, 브랜드 정체성 강화
**난이도**: M (Medium, 5-6 files, ~300 lines) **의존성**: Epic
UI-TEXT-ICON-OPTIMIZATION 완료 ✅

**배경**:

- 현재: 네이티브 `title` 속성 사용 (단순 텍스트, 브라우저 기본 스타일)
- 문제: 키보드 단축키를 `<kbd>←</kbd>` 형태로 강조 표시 불가능
- 기회: Epic UI-TEXT-ICON-OPTIMIZATION에서 i18n 인프라 완성 (`*WithShortcut`
  패턴)

**전략**:

- **Option A 선택**: 커스텀 Tooltip 컴포넌트 (Controlled)
  - 키보드 단축키 `<kbd>` 마크업 지원
  - 디자인 토큰 기반 스타일 (`--radius-md`, `--xeg-shadow-md`)
  - PC 전용 이벤트 (`mouseenter`, `focus` / `mouseleave`, `blur`)
  - WCAG 2.1 Level AA 준수 (`role="tooltip"`, `aria-describedby`)
- **Option B 거부**: 네이티브 title + CSS (HTML 마크업 불가능)
- **Option C 거부**: Hybrid (일관성 저하)

**영향 범위**:

- 새 컴포넌트: `src/shared/components/ui/Tooltip/`
- 수정: `ToolbarButton.tsx` (Tooltip 래핑)
- 테스트: `test/shared/components/ui/tooltip-*.test.tsx` (12-15 tests)
- i18n: LanguageService 기존 `*WithShortcut` 키 활용

**예상 번들 영향**: +2.5 KB raw (+0.5%), +0.8 KB gzip (+0.7%)

---

#### Phase 1: RED (컴포넌트 계약 테스트)

**목표**: Tooltip 컴포넌트 계약 테스트 작성 (12-15 tests, 모두 RED)

**테스트 파일**: `test/shared/components/ui/tooltip-component.test.tsx`

**테스트 범위**:

1. **렌더링 및 기본 동작** (4 tests):
   - `mouseenter` 시 툴팁 표시
   - `mouseleave` 시 툴팁 숨김
   - `focus` 시 툴팁 표시 (키보드 네비게이션)
   - `blur` 시 툴팁 숨김

2. **콘텐츠 렌더링** (3 tests):
   - 단순 텍스트 렌더링
   - `<kbd>` 마크업 포함 JSX 렌더링
   - `aria-describedby` 연결 검증

3. **포지셔닝** (2 tests):
   - `placement='top'` 기본값 적용
   - `placement='bottom'` 커스텀 적용

4. **지연 시간** (2 tests):
   - 기본 500ms 딜레이 적용
   - 커스텀 딜레이 적용 (`delay={300}`)

5. **PC 전용 정책** (2 tests):
   - Touch 이벤트 무시 (`touchstart` 리스너 없음)
   - Pointer 이벤트 무시 (`pointerdown` 리스너 없음)

6. **접근성** (2 tests):
   - `role="tooltip"` 속성
   - `aria-hidden="true"` (숨김 상태)

7. **디자인 토큰** (1 test):
   - 하드코딩 스타일 없음 (CSS 클래스만)

**Acceptance Criteria**:

- [ ] 12-15 tests 작성 완료
- [ ] 모두 RED 상태 (컴포넌트 미구현)
- [ ] TypeScript 0 errors (인터페이스 정의)
- [ ] PC 전용 이벤트만 테스트 (Touch/Pointer 배제)

---

#### Phase 2: GREEN (최소 구현)

**목표**: Tooltip 컴포넌트 구현 + ToolbarButton 통합 (12-15 tests → GREEN)

**작업 항목**:

1. **Tooltip 컴포넌트 생성** (`src/shared/components/ui/Tooltip/Tooltip.tsx`):

   ```typescript
   export interface TooltipProps {
     readonly content: string | JSX.Element;
     readonly trigger: JSX.Element;
     readonly placement?: 'top' | 'bottom' | 'left' | 'right';
     readonly delay?: number; // 기본 500ms
     readonly disabled?: boolean;
   }
   ```

2. **이벤트 핸들러** (PC 전용):
   - `mouseenter`: 지연 후 표시
   - `mouseleave`: 즉시 숨김
   - `focus`: 지연 후 표시
   - `blur`: 즉시 숨김

3. **포지셔닝 로직**:
   - 트리거 요소 기준 위치 계산
   - 뷰포트 충돌 회피 (간단한 fallback)

4. **스타일** (`Tooltip.module.css`):
   - 디자인 토큰 사용:
     - Border Radius: `--radius-md`
     - Background: `--color-bg-elevated`
     - Shadow: `--xeg-shadow-md`
     - Animation: `--xeg-transition-preset-fade`

5. **ToolbarButton 통합**:
   - `title` prop 제거
   - `<Tooltip>` 래퍼 추가
   - `*WithShortcut` 키를 `<kbd>` 마크업으로 변환

**Acceptance Criteria**:

- [ ] 12-15 tests 모두 GREEN
- [ ] TypeScript 0 errors
- [ ] PC 전용 이벤트만 사용 (Touch/Pointer 배제)
- [ ] 하드코딩 색상/시간 없음 (디자인 토큰만)
- [ ] `role="tooltip"`, `aria-describedby` 적용
- [ ] ToolbarButton 12개 버튼에 Tooltip 적용

---

#### Phase 3: REFACTOR (최적화 및 문서화)

**목표**: 포지셔닝 개선 + 문서 업데이트 + 회귀 방지

**작업 항목**:

1. **포지셔닝 최적화**:
   - 뷰포트 경계 감지 강화
   - 자동 placement 전환 (top → bottom, left → right)

2. **애니메이션 개선**:
   - Fade-in 부드럽게 (`--xeg-transition-preset-fade`)
   - Prefers-reduced-motion 지원

3. **문서 업데이트**:
   - `docs/CHANGELOG.md`: 변경 사항 기록
   - `docs/CODING_GUIDELINES.md`: Tooltip 사용 가이드 추가

4. **회귀 방지 테스트**:
   - Toolbar 기존 기능 정상 동작 (4 tests)
   - 키보드 네비게이션 유지 (2 tests)

**Acceptance Criteria**:

- [ ] 포지셔닝 안정성 개선 (경계 충돌 0건)
- [ ] 모든 테스트 GREEN 유지 (16-19 tests)
- [ ] 문서 업데이트 완료
- [ ] 번들 크기 목표 준수 (+2.5 KB raw 이하)
- [ ] TypeScript 0 errors, ESLint clean

---

**최근 완료**: Epic UI-TEXT-ICON-OPTIMIZATION (2025-01-08)

- Sub-Epic 1: ICON-SEMANTIC-FIX ✅
- Sub-Epic 2: I18N-TOOLBAR-LABELS ✅
- Sub-Epic 3: ARIA-TITLE-SEPARATION ✅ (Sub-Epic 2에서 달성)
- Sub-Epic 4: CONTEXTMENU-ARIA-ENHANCEMENT ✅

---

## 3. 최근 완료 Epic

### Epic UI-TEXT-ICON-OPTIMIZATION (완료: 2025-01-08)

**목적**: Toolbar 및 UI 컴포넌트의 텍스트/아이콘 최적화 — 완전한 다국어 지원 +
접근성 개선 + 아이콘 의미론적 명확성

**완료 Phase**: 4개 Sub-Epic 완료 (ICON-SEMANTIC-FIX, I18N-TOOLBAR-LABELS,
ARIA-TITLE-SEPARATION, CONTEXTMENU-ARIA-ENHANCEMENT)

**결과**: ✅ 33 tests GREEN, i18n 커버리지 100%, ARIA 강화 완료, 번들 +0.70%

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-08 섹션 참조)

---

### Epic JSX-PRAGMA-CLEANUP Phase 1-3 (완료: 2025-01-04)

**목적**: esbuild JSX pragma 경고 제거 및 SolidJS 설정 표준화

**완료 Phase**: Phase 1 (RED, 6 tests), Phase 2 (GREEN, 6/6 passing), Phase 3
(REFACTOR, 문서화 + 커밋)

**결과**: ✅ 6/6 tests GREEN, 빌드 경고 0개, TypeScript 0 errors, 번들 크기 동일
(781.20 KB)

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-04 섹션 참조)

---

### Epic GALLERY-NAV-ENHANCEMENT Phase 1-2 (완료: 2025-01-04)

**목적**: 갤러리 네비게이션 UX 개선 - 좌우 네비게이션 버튼 구현

**완료 Phase**: Phase 1 (RED, 17 tests), Phase 2 (GREEN + Integration, 17/17
passing)

**결과**: ✅ 17/17 tests GREEN, 번들 +3.15 KB (+0.68%), NavigationButton
컴포넌트 구현 완료

**남은 작업**: Phase 3 (키보드 도움말 오버레이 개선) - 선택 사항, 필요 시 백로그
이관

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-04 섹션 참조)

---

### Epic CONTEXT-MENU-UI (2025-01-03 완료)

**목적**: 커스텀 컨텍스트 메뉴 컴포넌트 구현 (브랜드 일관성 + 접근성)

**완료 Phase**: Phase 1 (RED, 18 tests), Phase 2 (GREEN, 12/18 passing - 기능적
베이스라인)

**남은 작업**: Phase 3 (접근성 완전성 + 키보드 네비게이션) - 백로그 이관

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-03 섹션 참조)

---

## 4. 다음 사이클 준비

새로운 Epic을 시작하려면:

1. `docs/TDD_REFACTORING_BACKLOG.md`에서 후보 검토
2. 우선순위/가치/난이도 고려하여 1-3개 선택
3. 본 문서 "활성 Epic 현황" 섹션에 추가
4. Phase 1 (RED) 테스트부터 시작

---

## 5. 참고: 이전 완료 Epic 목록

### Epic CONTEXT-MENU-UI-PHASE-3 (완료: 2025-01-03)

**목적**: Epic CONTEXT-MENU-UI Phase 3 완성 - 접근성 완전성 & 키보드 네비게이션

**결과**: ✅ 18/18 tests GREEN, WCAG 2.1 Level AA 완전 준수, Epic 완전 종료

상세 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-03 섹션) 참조

---

     'Settings',
     'Close',
     'ChevronLeft',
     'ChevronRight',
     'ZoomIn',
     'ArrowAutofitWidth',
     'ArrowAutofitHeight',
     'ArrowsMaximize',
     'FileZip',
     'QuestionMark', // 추가
     'Notifications',
     'NotificationsOff',

] as const;

export type IconName = (typeof CORE_ICONS)[number];

````

3. **Toolbar 키보드 도움말 버튼 아이콘 변경**
(`src/shared/components/ui/Toolbar/Toolbar.tsx`)
```typescript
{props.onShowKeyboardHelp ? (
  <ToolbarButton
    aria-label='Show keyboard shortcuts'
    title='Show keyboard shortcuts (?)'
    disabled={Boolean(props.disabled)}
    onClick={event => handleButtonClick(event, props.onShowKeyboardHelp)}
    data-gallery-element='keyboard-help'
    icon='QuestionMark'  // Settings → QuestionMark
  />
) : null}
````

**결과**: ✅ 4/4 tests GREEN

**Acceptance Criteria**:

- [x] QuestionMark 아이콘 추가 및 등록
- [x] Toolbar 키보드 도움말 버튼 아이콘 변경
- [x] 모든 테스트 GREEN (4/4 passing)
- [x] TypeScript 0 errors
- [x] Settings 아이콘은 설정 버튼에만 사용됨
- [x] 번들 크기 증가 < 1 KB (464.05 KB raw, 115.57 KB gzip)

---

#### Phase 3: REFACTOR (문서화)

**목표**: 변경 사항 문서화 및 가이드라인 업데이트

**작업 항목**:

1. CHANGELOG.md에 변경 사항 기록
2. 아이콘 고유성 원칙을 CODING_GUIDELINES.md에 추가
3. 완료 내역을 TDD_REFACTORING_PLAN_COMPLETED.md로 이관

**결과**: ✅ 완료

**Acceptance Criteria**:

- [x] 문서 업데이트 완료
- [x] 빌드 성공
- [x] 모든 테스트 GREEN 유지

---

### Sub-Epic 1 완료 체크리스트

- [x] Phase 1: RED (4 tests) - Commit 7a1dc308
- [x] Phase 2: GREEN (4/4 passing) - Commit 4ce345c5
- [x] Phase 3: REFACTOR (문서화) - Commit [PENDING]

**상태**: ✅ 완료 - 문서화 완료, 커밋 대기 중

---

**다음 단계**: Sub-Epic 2 (I18N-TOOLBAR-LABELS) 또는 Sub-Epic 4
(CONTEXTMENU-ARIA-ENHANCEMENT) 선택 (둘 다 독립 실행 가능)

---

### Sub-Epic 2: I18N-TOOLBAR-LABELS ✅ (완료: 2025-01-08)

**부모 Epic**: UI-TEXT-ICON-OPTIMIZATION (분할됨)

**목적**: Toolbar의 하드코딩된 텍스트를 LanguageService로 전환하여 완전한 다국어
지원

**우선순위**: P1 (Medium Impact) **난이도**: S (3-4 files, ~150 lines)
**의존성**: 없음 (독립 실행 가능)

**완료 Phase**:

- [x] Phase 1: RED (14 tests) - Test file created
- [x] Phase 2: GREEN (14/14 passing, TypeScript 0 errors) - Commit `409ba2a4`
- [x] Phase 3: REFACTOR (문서화) - Commit `[PENDING]`

**결과**:

- LanguageService에 23개 새 toolbar 키 추가 (ko, en, ja)
- Toolbar.tsx의 12개 하드코딩 위치 제거 (모두 languageService.getString() 사용)
- 템플릿 지원 (downloadAllWithCount with {count} placeholder)
- 키보드 단축키 통합 (\*WithShortcut pattern)
- 테스트: 14/14 RED→GREEN transition, TypeScript 0 errors
- 영향: 하드코딩 12 → 0, i18n 커버리지 85% → 100%
- 번들 크기: +3.24 KB raw (+0.70%), +0.61 KB gzip (+0.53%)

**참고**: Phase 1 테스트는 "현재 상태 검증" 방식으로 작성되어 Phase 2 완료 후
RED로 전환됨 (TDD 워크플로 준수)

---

**다음 단계**: Sub-Epic 3 (ARIA-TITLE-SEPARATION) 시작 가능 (Sub-Epic 2 의존성
충족)

---

### Sub-Epic 3: ARIA-TITLE-SEPARATION (대기 중)

**부모 Epic**: UI-TEXT-ICON-OPTIMIZATION (분할됨)

**목적**: 키보드 단축키가 있는 버튼의 aria-label과 title 속성을 의미론적으로
분리

**우선순위**: P2 (Low Impact - 접근성 개선) **난이도**: S (2-3 files, ~100
lines) **의존성**: Sub-Epic 2 완료 후 (I18N 키 필요)

**전략**: I18N 완료 후 시작

---

### Sub-Epic 4: CONTEXTMENU-ARIA-ENHANCEMENT ✅ (완료: 2025-01-XX)

**부모 Epic**: UI-TEXT-ICON-OPTIMIZATION (분할됨)

**목적**: ContextMenu의 ARIA 속성 강화

**우선순위**: P2 (Low Impact - 접근성 개선) **난이도**: XS (1 file, ~30 lines)
**의존성**: 없음 (독립 실행 가능, Epic CONTEXT-MENU-UI Phase 3 기반)

**전략**: 다른 Sub-Epic과 병행 가능

**완료 Phase**:

- [x] Phase 1 RED (6 tests): commit `c5dea3b2`
- [x] Phase 2 GREEN (6/6 passing, TypeScript 0 errors): commit `cb9b972e`
- [x] Phase 3 REFACTOR (문서화): commit `[PENDING]`

**결과**:

- Enhanced ARIA attributes: `aria-orientation='vertical'`,
  `aria-activedescendant` (reactive tracking), unique menuitem `id`, optional
  `aria-labelledby`
- Type extension: `ContextMenuAction.ariaLabelledBy?: string`
- Documentation: CODING_GUIDELINES.md "ContextMenu ARIA 원칙" section
- Tests: 6/6 GREEN, WCAG 2.1 Level AA compliant

**참고**: Epic CONTEXT-MENU-UI Phase 3 (completed 2025-01-03) accessibility
foundation 위에 enhanced ARIA attributes 추가

---

## 3. 최근 완료 Epic

### Epic JSX-PRAGMA-CLEANUP Phase 1-3 (완료: 2025-01-04)

**목적**: esbuild JSX pragma 경고 제거 및 SolidJS 설정 표준화

**완료 Phase**: Phase 1 (RED, 6 tests), Phase 2 (GREEN, 6/6 passing), Phase 3
(REFACTOR, 문서화 + 커밋)

**결과**: ✅ 6/6 tests GREEN, 빌드 경고 0개, TypeScript 0 errors, 번들 크기 동일
(781.20 KB)

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-04 섹션 참조)

---

### Epic GALLERY-NAV-ENHANCEMENT Phase 1-2 (완료: 2025-01-04)

**목적**: 갤러리 네비게이션 UX 개선 - 좌우 네비게이션 버튼 구현

**완료 Phase**: Phase 1 (RED, 17 tests), Phase 2 (GREEN + Integration, 17/17
passing)

**결과**: ✅ 17/17 tests GREEN, 번들 +3.15 KB (+0.68%), NavigationButton
컴포넌트 구현 완료

**남은 작업**: Phase 3 (키보드 도움말 오버레이 개선) - 선택 사항, 필요 시 백로그
이관

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-04 섹션 참조)

---

### Epic CONTEXT-MENU-UI (2025-01-03 완료)

**목적**: 커스텀 컨텍스트 메뉴 컴포넌트 구현 (브랜드 일관성 + 접근성)

**완료 Phase**: Phase 1 (RED, 18 tests), Phase 2 (GREEN, 12/18 passing - 기능적
베이스라인)

**남은 작업**: Phase 3 (접근성 완전성 + 키보드 네비게이션) - 백로그 이관

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-03 섹션 참조)

---

## 4. 다음 사이클 준비

새로운 Epic을 시작하려면:

1. `docs/TDD_REFACTORING_BACKLOG.md`에서 후보 검토
2. 우선순위/가치/난이도 고려하여 1-3개 선택
3. 본 문서 "활성 Epic 현황" 섹션에 추가
4. Phase 1 (RED) 테스트부터 시작

---

## 5. 참고: 이전 완료 Epic 목록

### Epic CONTEXT-MENU-UI-PHASE-3 (완료: 2025-01-03)

**목적**: Epic CONTEXT-MENU-UI Phase 3 완성 - 접근성 완전성 & 키보드 네비게이션

**결과**: ✅ 18/18 tests GREEN, WCAG 2.1 Level AA 완전 준수, Epic 완전 종료

상세 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-03 섹션) 참조

---

### Epic CONTEXT-MENU-UI (완료: 2025-01-03)

**목적**: 커스텀 컨텍스트 메뉴 컴포넌트 구현 (브랜드 일관성 + 접근성)

**결과**: ✅ Phase 1 (RED, 18 tests), Phase 2 (GREEN, 12/18 passing - 기능적
베이스라인 완료)

상세 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-03 섹션) 참조

---

### Epic DOWNLOAD-TOGGLE-TOOLBAR (완료: 2025-01-03)

**목적**: 진행률 토스트 토글을 설정 패널에서 툴바로 이동 (다운로드 워크플로
중심화)

**결과**: ✅ Phase 1-3 완료, 15/15 tests GREEN, i18n 지원, 번들 크기 +0.47 KB

상세 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-03 섹션) 참조

---

### Epic SOLID-NATIVE-MIGRATION (완료: 2025-10-03)

**목적**: 레거시 `createGlobalSignal` 패턴 제거 및 SolidJS 네이티브 패턴 완전
전환

**결과**: ✅ 호환 레이어 제거 완료, 모든 import/call 제거, 11/11 tests PASS,
번들 크기 감소

상세 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

### Epic REF-LITE-V4 (완료: 2025-10-02)

**목적**: 서비스 워밍업 성능 테스트 작성 및 검증

**결과**: ✅ 9/9 tests PASS, 성능 기준 충족 (< 50ms / < 100ms), 회귀 방지 테스트
확보

상세 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

### Epic CONNECT_SYNC_AUTOMATION (완료: 2025-01-13)

**목적**: 코드베이스에서 사용되는 외부 호스트를 자동으로 추출하여
`vite.config.ts`의 @connect 헤더와 동기화

**구현 내용**:

- @connect 헤더 동기화 테스트 (`test/tools/connect-sync.test.ts`, 11 tests) ✅
  - vite.config.ts에서 @connect 헤더 추출 (백틱 문자열 파싱) ✅
  - Set으로 중복 없이 반환 ✅
  - constants.ts에서 DOMAINS 추출 ✅
  - url-safety.ts에서 TWITTER_MEDIA_HOSTS 추출 ✅
  - 코드베이스 전체 호스트 추출 함수 ✅
  - @connect 헤더와 코드 사용 호스트 비교 ✅
  - 누락 호스트 감지 ✅
  - 미사용 호스트 감지 ✅
  - 호스트 동기화 검증 ✅
  - 실제 프로젝트 불일치 감지 ✅
  - 동기화 리포트 생성 ✅

- 동기화 스크립트 구현 (`scripts/sync-connect-hosts.mjs`) ✅
  - 현재 @connect 헤더 파싱 (백틱 문자열 내부 처리)
  - 코드베이스 전체 스캔 (constants.ts, url-safety.ts, URL 리터럴)
  - 누락/미사용 호스트 리포트
  - --dry-run 옵션으로 미리보기
  - --fix 옵션으로 vite.config.ts 자동 업데이트

- npm 스크립트 추가 (`package.json`) ✅
  - `npm run sync:connect` - 분석만 (현재 상태)
  - `npm run sync:connect:fix` - 자동 수정
  - `npm run sync:connect:dry-run` - 미리보기

**발견 사항**:

- 현재 프로젝트의 @connect 헤더는 이미 완벽하게 동기화되어 있음 ✅
- 6개 호스트 모두 일치: x.com, api.twitter.com, pbs.twimg.com, video.twimg.com,
  abs.twimg.com, abs-0.twimg.com
- 스캔 전략: 정규식 기반 (constants, URL 리터럴) + 특정 파일 타겟팅
  (url-safety.ts)
- vite.config.ts 업데이트 시 백틱 문자열 패턴 정확히 매칭 (`\`// @connect
  hostname\\n\``)

**문서화**:

- AGENTS.md에 "@connect 헤더 동기화" 섹션 추가 ✅
- 스캔 대상, 목적, 사용법 명시

---

### Epic SPA_IDEMPOTENT_MOUNT (완료: 2025-01-13)

**목적**: SPA 라우트 변경 시 단일 마운트/클린업 가드 테스트 및 서비스 중복 등록
방지

**구현 내용**:

- SPA 중복 마운트 방지 테스트 (`test/architecture/spa-idempotent-mount.test.ts`,
  10 tests) ✅
  - 연속 startApplication 호출 시 단일 초기화 보장 ✅
  - 이미 시작된 상태에서 재호출 시 중복 초기화 방지 ✅
  - DOM body 교체 후 재초기화 시 이전 인스턴스 정리 ✅
  - Toast 컨테이너 중복 생성 방지 (test mode는 의도적 skip, 조건부 테스트로
    해결) ✅
  - 병렬 호출 시 단일 초기화 보장 ✅
  - cleanup 후 재시작 정상 동작 ✅
  - cleanup과 startApplication 동시 호출 시 경쟁 조건 처리 ✅
  - 여러 start/cleanup 사이클에서 메모리 누수 방지 ✅
  - SPA 라우트 변경 시뮬레이션에서 이벤트 리스너 누수 방지 ✅
  - galleryApp 인스턴스 cleanup 후 null 및 재초기화 가능 ✅

**발견 사항**:

- `main.ts`의 `isStarted` 플래그와 `startPromise` 재사용으로 중복 마운트가 이미
  완벽하게 방지됨 ✅
- cleanup 후 재시작 시 서비스 중복 등록 경고 발생 (CoreService 덮어쓰기 warning)
  - 예: `[WARN] [CoreService] 서비스 덮어쓰기: media.service`
  - 이는 warning이지 error가 아니며, 재초기화 시 정상 동작
  - cleanup()에서 CoreService.cleanup() 호출 시 모든 서비스가 정리되고, 재시작
    시 새로 등록되는 것이 의도된 동작
- test mode에서 Toast 컨테이너와 Gallery 초기화를 skip하는 것은 테스트 격리를
  위한 의도된 설계 ✅

**품질 게이트**:

- ✅ typecheck (0 errors)
- ✅ lint (clean)
- ✅ 10/10 tests GREEN
- ✅ build:dev (성공)

---

### Epic A11Y_LAYER_TOKENS (완료: 2025-01-13)

**목적**: 접근성 레이어(z-index), 포커스 링, 대비 토큰 재점검 및 회귀 방지
테스트 추가

**구현 내용**:

- Z-index 레이어 관리 토큰 검증 (`a11y-layer-tokens.test.ts`, 5 tests)
  - Semantic z-index 토큰 정의 검증 (--xeg-z-modal, --xeg-z-toolbar 등)
  - Z-index 계층 구조 검증 (overlay: 9999 < modal: 10000 < toolbar: 10001 <
    toast: 10080)
  - Toolbar/SettingsModal/Toast z-index 토큰 사용 검증
- 대비(Contrast) 토큰 검증 (`a11y-contrast-tokens.test.ts`, 6 tests)
  - 텍스트/배경 색상 토큰 정의 검증 (--color-text-primary, --color-bg-\* 등)
  - prefers-contrast: high 미디어 쿼리 존재 검증
  - Toolbar 고대비 모드 테두리 강화 검증 (2px)
  - SettingsModal/Toast 디자인 토큰 사용 검증 (하드코딩된 hex 색상 금지)
  - Focus ring 대비 검증
- 코드 수정:
  - `Toolbar.module.css` line 256: `z-index: 10;` →
    `z-index: var(--xeg-layer-base, 0);`

**발견 사항**:

- 토큰 네이밍 패턴 혼재: semantic 레이어는 `--color-text-*` 형식, 다른 토큰은
  `--xeg-*` 형식 사용
- 기존 테스트 `a11y-visual-feedback.tokens.test.ts` (5 tests) 모두 GREEN 유지

**품질 게이트**: ✅ typecheck (0 errors) / ✅ lint (clean) / ✅ 11 tests GREEN /
✅ build (success)

---

**최근 완료** (2025-01-13):

- **Epic RED-TEST-005 완료**: Style/CSS Consolidation & Token Compliance
  - toolbar-fit-group-contract: fitModeGroup 제거 검증, fitButton radius 토큰
    사용 확인 ✅
  - style-consolidation: 6개 테스트 모두 GREEN ✅
    - Toolbar 버튼 디자인 토큰 사용 검증
    - 중복 스타일 클래스 제거 확인
    - CSS Module 일관성 검증
    - 색상 토큰 통합 확인
    - 하드코딩된 색상값 제거
    - Spacing 토큰 정책 준수

- **Epic RED-TEST-004 검증 완료**: Signal Selector 유틸리티는 이미 SolidJS
  Native 패턴으로 구현됨
  - `useSignalSelector` ✅
  - `useCombinedSignalSelector` ✅
  - 테스트는 레거시 API 참조로 skip됨 (구현과 무관)
- **Epic THEME-ICON-UNIFY-002 Phase B 완료**: 아이콘 디자인 일관성 검증
  - 모든 아이콘 24x24 viewBox 표준화 ✅
  - stroke-width 디자인 토큰 적용 ✅
  - 13개 테스트 모두 GREEN
- Epic RED-TEST-002 검증: UnifiedToastManager는 이미 SolidJS 네이티브 패턴으로
  완전히 마이그레이션 완료됨
- 완료 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 4. TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Rename**: `.red.` 파일명 제거 → 가드 전환
5. **Document**: Completed 로그에 1줄 요약

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build:dev` (산출물 검증 통과)

---

## 5. 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
| 벤더 API    | `docs/vendors-safe-api.md`               |
