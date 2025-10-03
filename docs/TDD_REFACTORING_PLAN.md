# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-03 — Epic SOLID-NATIVE-MIGRATION 완료 및 이관

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심

---

## 2. 활성 Epic 현황

### Epic UX-GALLERY-FEEDBACK-001: 갤러리 피드백 및 가시성 강화 (2025-10-03 추가)

**상태**: 활성 (Phase 1-1 완료, Phase 1-2/1-3 진행 예정)

**목적**: 사용자가 갤러리 상태와 진행 상황을 명확히 인지하고, 주요 기능을 쉽게
발견하며, 액션 결과를 즉각 확인할 수 있도록 UI/UX를 개선합니다.

**배경 (사용자 여정 분석 결과)**:

현재 갤러리 UI는 기능적으로 완성도가 높으나, 사용자 피드백 측면에서 다음
문제점이 식별되었습니다:

- 툴바 자동 숨김(2초)이 너무 짧아 첫 방문자가 기능을 놓칠 수 있음
- Fit 모드 버튼의 현재 선택 상태가 불명확함
- 전체 갤러리 중 현재 위치 파악이 어려움 (MediaCounter만으로 직관성 부족)
- 대량 다운로드 진행 상황을 기본적으로 알 수 없음 (옵션 설정 필요)
- 다운로드 버튼이 툴바와 아이템 오버레이에 중복 배치되어 혼란 발생

**범위 (3 Phase 접근)**:

#### **Phase 1: 툴바 가시성 및 상태 피드백 강화 (High Priority)**

1. **툴바 자동 숨김 지연 연장** (2s → 5s) ✅ **완료 (2025-10-03)**
   - `useToolbarPositionBased` hook의 `initialAutoHideDelay` 기본값을 5000ms로
     변경
   - 파라미터 커스터마이징 기능 유지
   - 테스트: `toolbar-visibility.auto-hide-delay.test.tsx` (4 tests GREEN)
   - 커밋: `178d0f54` feat(ui): extend toolbar auto-hide delay from 2s to 5s
2. **Fit 모드 선택 상태 시각화** (`data-selected` 속성 활용) ✅ **완료
   (2025-01-03)**
   - 현재 활성 Fit 모드 버튼에 시각적 강조 (배경색/테두리 변경)
   - 디자인 토큰 기반 스타일 적용 (`--xeg-color-primary` 등)
   - `Toolbar.module.css`에 `[data-selected='true']` 셀렉터 추가
   - 테스트: `toolbar-fit-mode.selected-state.test.tsx` (9 tests GREEN)
   - 커밋: `7069d9e4` feat(ui): add visual emphasis for selected fit mode
     buttons (Phase 1-2)
3. **키보드 단축키 힌트 추가**
   - 기존 `KeyboardHelpOverlay` 강화 또는 툴바 하단 영구 힌트 추가
   - `?` 키 발견성 개선 (버튼 또는 아이콘 추가)

#### **Phase 2: 진행 상황 가시성 개선 (High Priority)**

1. **미니 진행률 바 추가**
   - 전체 미디어 수 대비 현재 위치를 시각적으로 표시
   - `MediaCounter` 통합 또는 독립 컴포넌트
   - 스크롤/네비게이션과 실시간 동기화
2. **대량 다운로드 진행률 토스트 기본 활성화**
   - `DEFAULT_SETTINGS.download.showProgressToast` 기본값 `false` → `true`
   - 사용자 안심감 제공 (즉시 피드백)
3. **MediaCounter 크기 및 대비 강화**
   - 폰트 크기 증대 (접근성 개선)
   - WCAG AA 대비 기준 충족 검증

#### **Phase 3: 다운로드 UX 통합 (Medium Priority)**

1. **아이템 오버레이 다운로드 버튼 제거**
   - `VerticalImageItem`의 오버레이 다운로드 버튼 삭제
   - 툴바 중심 일관된 워크플로 확립
2. **컨텍스트 메뉴 통합** (우클릭)
   - 아이템 우클릭 시 다운로드/정보 보기 액션 제공
   - 네이티브 패턴 활용, 고급 사용자 지원
   - PC 전용 인터랙션 정책 준수
3. **진행률 토스트 토글 툴바 이동**
   - 설정 패널에서 다운로드 워크플로로 이동
   - 툴바 다운로드 그룹에 서브메뉴 또는 토글 버튼 추가

### Acceptance Criteria

#### Phase 1

- [x] 툴바 자동 숨김이 5초로 연장되며, `useToolbarPositionBased` 파라미터로 조정
      가능 ✅ **완료**
- [x] Fit 모드 버튼에 `data-selected="true"` 속성이 현재 모드에만 적용됨 ✅
      **완료**
- [x] Fit 모드 선택 상태가 디자인 토큰 기반 스타일로 시각화됨 (배경/테두리 강조)
      ✅ **완료**
- [ ] 키보드 단축키 힌트가 툴바 또는 독립 오버레이로 표시됨
- [ ] 회귀 방지: 기존 툴바 키보드 네비게이션 테스트 모두 PASS

#### Phase 2

- [ ] 미니 진행률 바가 전체 미디어 수 대비 현재 위치를 시각적으로 표시
- [ ] 진행률 바가 스크롤/네비게이션과 실시간 동기화됨
- [ ] `download.showProgressToast` 기본값이 `true`로 변경됨
- [ ] 진행률 토스트가 대량 다운로드 시 실시간 업데이트됨 (`1/10 • 10%` 형식)
- [ ] MediaCounter 폰트 크기 및 대비가 WCAG AA 기준 충족
- [ ] 회귀 방지: 기존 다운로드 서비스 테스트 모두 PASS

#### Phase 3

- [ ] `VerticalImageItem` 오버레이의 다운로드 버튼 제거 완료
- [ ] 아이템 우클릭 시 컨텍스트 메뉴 표시 (다운로드/정보 보기 액션)
- [ ] 컨텍스트 메뉴가 PC 전용 인터랙션 정책 준수 (Touch/Pointer 금지)
- [ ] 진행률 토스트 토글이 툴바 다운로드 그룹에 통합됨
- [ ] 설정 패널에서 진행률 토스트 옵션 제거 또는 연동 유지(논의)
- [ ] 회귀 방지: 기존 아이템 클릭/네비게이션 테스트 모두 PASS

### 구현 전략 (TDD)

#### Phase 1 구현 단계

1. **RED**: 툴바 자동 숨김 지연 테스트
   (`test/shared/components/ui/toolbar-visibility.auto-hide-delay.test.tsx`)
   - 5초 후 숨김 검증
   - 파라미터 커스터마이징 검증
2. **RED**: Fit 모드 선택 상태 테스트
   (`test/shared/components/ui/toolbar-fit-mode.selected-state.test.tsx`)
   - `data-selected="true"` 속성 검증
   - CSS 클래스 적용 검증
3. **GREEN**: `useToolbarPositionBased` 파라미터 확장
   - `initialAutoHideDelay` 기본값 5000ms로 변경
4. **GREEN**: Fit 모드 버튼 선택 상태 로직 구현
   - `Toolbar.tsx`에서 `currentFitMode`와 비교하여 `data-selected` 설정
5. **GREEN**: CSS 선택 상태 스타일 추가 (`Toolbar.module.css`)
   - `[data-selected="true"]` 셀렉터로 강조 스타일 적용
6. **REFACTOR**: 키보드 힌트 컴포넌트 강화
   - `KeyboardHelpOverlay` 기본 표시 시간 조정 또는 툴바 통합

#### Phase 2 구현 단계

1. **RED**: 진행률 바 렌더링 테스트
   (`test/shared/components/ui/media-counter.progress-bar.test.tsx`)
   - 진행률 바 DOM 존재 검증
   - 너비 계산 검증 (`(currentIndex + 1) / totalCount * 100%`)
2. **RED**: 진행률 바 동기화 테스트
   - 네비게이션 후 진행률 바 업데이트 검증
   - 스크롤 이벤트 시 동기화 검증
3. **GREEN**: `ProgressBar` 컴포넌트 구현 (신규)
   - props: `current`, `total`, `className`
   - 디자인 토큰 기반 스타일
4. **GREEN**: `MediaCounter`에 진행률 바 통합
   - `layout='stacked'` 모드에 진행률 바 추가
5. **GREEN**: 설정 기본값 변경
   - `constants.ts`: `DEFAULT_SETTINGS.download.showProgressToast = true`
6. **REFACTOR**: MediaCounter 접근성 개선
   - `aria-live="polite"` 추가
   - 폰트 크기 토큰 상향 조정

#### Phase 3 구현 단계

1. **RED**: 컨텍스트 메뉴 테스트
   (`test/features/gallery/vertical-image-item.context-menu.test.tsx`)
   - 우클릭 시 메뉴 표시 검증
   - 다운로드 액션 트리거 검증
2. **GREEN**: `VerticalImageItem` 다운로드 버튼 제거
   - 오버레이 다운로드 버튼 관련 코드 삭제
3. **GREEN**: 컨텍스트 메뉴 핸들러 구현
   - `onContextMenu` 이벤트에서 메뉴 표시
   - 기존 `onImageContextMenu` 로직 확장
4. **GREEN**: 진행률 토스트 토글 툴바 이동
   - 툴바 다운로드 그룹에 아이콘 버튼 추가
   - 토글 상태와 설정 동기화
5. **REFACTOR**: 다운로드 액션 통합
   - 툴바 중심 워크플로 최적화
   - 설정 패널 단순화

### 영향 범위

#### 변경 파일

- `src/shared/hooks/useToolbarPositionBased.ts` (파라미터 기본값 변경)
- `src/shared/components/ui/Toolbar/Toolbar.tsx` (Fit 모드 상태 관리)
- `src/shared/components/ui/Toolbar/Toolbar.module.css` (선택 상태 스타일)
- `src/features/gallery/components/KeyboardHelpOverlay/` (강화 또는 통합)
- `src/shared/components/ui/MediaCounter/MediaCounter.tsx` (진행률 바 통합)
- `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.solid.tsx`
  (다운로드 버튼 제거)
- `src/constants.ts` (`DEFAULT_SETTINGS.download.showProgressToast`)
- `src/features/settings/solid/SolidSettingsPanel.solid.tsx` (옵션 제거 또는
  연동)

#### 신규 컴포넌트 (옵션)

- `src/shared/components/ui/ProgressBar/ProgressBar.tsx`
- `src/shared/components/ui/ContextMenu/ContextMenu.tsx` (Phase 3)

#### 테스트 파일

- `test/shared/components/ui/toolbar-visibility.auto-hide-delay.test.tsx` (신규)
- `test/shared/components/ui/toolbar-fit-mode.selected-state.test.tsx` (신규)
- `test/shared/components/ui/media-counter.progress-bar.test.tsx` (신규)
- `test/features/gallery/vertical-image-item.context-menu.test.tsx` (신규)
- 기존 툴바/갤러리 테스트 업데이트 (회귀 방지)

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ 신규/수정 테스트 모두 GREEN
- ✅ `npm run build:dev` (산출물 검증 통과)
- ✅ 접근성 테스트 (WCAG AA 준수: 대비, 포커스, 키보드)
- ✅ PC 전용 입력 정책 준수 (Touch/Pointer 금지)
- ✅ 디자인 토큰 준수 (하드코딩 색상/크기 금지)

**예상 일정**:

- Phase 1: 1-2일 (툴바 가시성 기초)
- Phase 2: 2-3일 (진행률 시각화)
- Phase 3: 2-3일 (다운로드 UX 통합)
- 총 예상: 5-8일 (테스트 + 문서화 포함)

**후속 작업 후보** (Epic 완료 후 검토):

- 썸네일 미니맵 추가 (전체 갤러리 개요)
- 툴바 애니메이션 세련화 (Framer Motion 등)
- 다크 모드 최적화 (고대비 모드 개선)
- 모바일 대응 검토 (현재 PC 전용)

---

## 3. 최근 완료 Epic (참고용)

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
