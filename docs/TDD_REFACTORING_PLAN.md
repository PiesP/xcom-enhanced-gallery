# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-02 — DOM 구조 분석 기반 3개 리팩토링 Epic 완료 및
이관

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심

---

## 2. 활성 Epic 현황

현재 활성화된 Epic이 없습니다. 새로운 리팩토링이나 기능 구현은 본 섹션에
추가됩니다.

---

## 3. 최근 완료 Epic (참고용)

### Epic CONNECT_SYNC_AUTOMATION (완료: 2025-01-13)

**배경**:

- 현재 언어 선택: `<select>` 요소로 구현, 텍스트만 표시 ('자동 / Auto / 自動',
  '한국어', 'English', '日本語')
- 문제: 문자를 이해하지 못하는 사용자는 언어를 선택하기 어려움
- 해결: 각 언어에 대응하는 국기/언어 아이콘을 추가하여 시각적 식별 가능

**솔루션 선택 과정**:

| 옵션                             | 장점                                           | 단점                                                    | 채택 여부 |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------- | --------- |
| Custom Radio Button Grid         | 아이콘+텍스트 조합, 완전한 접근성, 디자인 토큰 | 새 컴포넌트 필요, 아이콘 4개 추가, 테스트 추가          | ✅ 채택   |
| Custom Select (Combobox)         | Native select 대비 아이콘 표시 가능            | 구현 복잡, Listbox 관리, 키보드 네비게이션 복잡         | ❌        |
| Icon Prefix in Native Select     | 최소한 변경, 기존 select 유지                  | `<option>`에 아이콘 불가 (HTML 제약), 목표 달성 불가    | ❌        |
| Segmented Control with Icons     | 모던 UI, 명확한 선택 상태                      | 공간 많이 차지, 확장성 제한 (4개는 OK)                  | △ 대안    |
| Icon-only Button Grid            | 공간 절약, 시각적 명확성                       | 텍스트 부재 시 접근성 우려, aria-label 의존도 높음      | ❌        |
| Dropdown with Custom Item Render | Native-like UX, 스크린리더 호환                | 커스텀 드롭다운 구현 복잡, 모바일 최적화 필요 (PC 전용) | ❌        |

#### 최종 선택: Custom Radio Button Grid

이유:

- PC 전용 이벤트만 사용 (click, keyboard) ✅
- 접근성 최우선 (ARIA + 시각적 아이콘) ✅
- 디자인 토큰 준수 용이 ✅
- 테스트 작성 가능 (TDD) ✅
- 확장 가능 (테마 선택에도 적용 가능) ✅
- 현재 프로젝트의 IconButton/LazyIcon 인프라 재사용 ✅

#### 구현 계획 (TDD - RED → GREEN → REFACTOR)

##### Phase 1: 아이콘 추가 (RED)

**목표**: 언어별 아이콘 4개를 xeg-icons.ts에 추가

**작업**:

1. 아이콘 디자인 정의 (`src/assets/icons/xeg-icons.ts`)
   - `language-auto`: 지구본 아이콘 (🌐)
   - `language-ko`: 태극기 또는 한글 심볼
   - `language-en`: 영미권 국기 또는 A 심볼
   - `language-ja`: 일본 국기 또는 あ 심볼
2. 아이콘 컴포넌트 등록 (`src/shared/components/ui/Icon/icons/registry.ts`)
   - `LanguageAuto`, `LanguageKo`, `LanguageEn`, `LanguageJa` 추가
3. iconRegistry.ts에 동적 import 추가 (`src/shared/services/iconRegistry.ts`)
   - `ICON_IMPORTS`에 4개 아이콘 추가

**Acceptance**:

- ✅ xeg-icons.ts에 4개 언어 아이콘 정의 추가
- ✅ registry.ts에서 createSvgIcon으로 컴포넌트 생성
- ✅ iconRegistry.ts ICON_IMPORTS에 등록
- ✅ typecheck 통과 (strict mode)
- ✅ 아이콘 24x24 viewBox 표준 준수 (THEME-ICON-UNIFY-002)

**테스트** (`test/features/settings/language-icon-definitions.test.ts`):

- 4개 언어 아이콘이 XEG_ICON_DEFINITIONS에 존재
- 각 아이콘이 24x24 viewBox 사용
- registry에서 getXegIconComponent로 로드 가능
- iconRegistry에서 동적 import 가능

##### Phase 2: RadioGroup 컴포넌트 생성 (RED → GREEN)

**목표**: 접근성을 갖춘 Radio Button Group 컴포넌트 구현

**작업**:

1. RadioGroup.tsx 생성 (`src/shared/components/ui/RadioGroup/RadioGroup.tsx`)
   - Props: `name`, `value`, `options`, `onChange`, `orientation`
     (vertical/horizontal)
   - option:
     `{ value: string, label: string, icon?: IconName, ariaLabel?: string }`
   - 접근성: `role="radiogroup"`, `aria-labelledby`, `aria-orientation`
   - 키보드: Arrow keys, Space, Enter
   - PC 전용 이벤트만 사용 (click, keydown)
2. RadioGroup.module.css 생성
   - 디자인 토큰만 사용 (`--xeg-*`, `--color-*`, `--size-icon-*`)
   - 하드코딩된 색상/radius 값 금지
   - Focus ring, hover, selected 스타일
3. RadioOption 서브 컴포넌트
   - 아이콘 + 텍스트 레이아웃
   - `role="radio"`, `aria-checked`
   - `tabindex` 관리 (선택된 항목만 0, 나머지 -1)

**Acceptance**:

- ✅ SolidJS 네이티브 패턴 사용 (createSignal, createMemo)
- ✅ WAI-ARIA radiogroup 패턴 준수
- ✅ 키보드 네비게이션 (ArrowUp/Down/Left/Right, Space, Enter)
- ✅ 디자인 토큰만 사용 (하드코딩 금지)
- ✅ PC 전용 이벤트만 (터치/포인터 이벤트 금지)
- ✅ typecheck 통과 (strict mode)

**테스트** (`test/unit/shared/components/ui/RadioGroup.test.tsx`):

- 기본 렌더링 및 선택 상태 표시
- 클릭으로 선택 변경
- 키보드 네비게이션 (Arrow keys, Space)
- 아이콘 표시 (LazyIcon 사용)
- 접근성 속성 (role, aria-checked, aria-labelledby)
- Disabled 옵션 처리
- 디자인 토큰 사용 검증

##### Phase 3: LanguageSelector 컴포넌트 생성 (GREEN)

**목표**: RadioGroup을 활용한 언어 선택 전용 컴포넌트

**작업**:

1. LanguageSelector.tsx 생성
   (`src/shared/components/ui/LanguageSelector/LanguageSelector.tsx`)
   - Props: `value: LanguageOption`, `onChange: (lang: LanguageOption) => void`
   - RadioGroup 래핑
   - 언어별 아이콘 매핑:
     - auto → LanguageAuto
     - ko → LanguageKo
     - en → LanguageEn
     - ja → LanguageJa
   - i18n 라벨 (LanguageService 사용)
2. LanguageSelector.module.css 생성
   - 레이아웃 스타일 (Grid 또는 Flex)
   - 디자인 토큰 사용

**Acceptance**:

- ✅ RadioGroup 재사용
- ✅ 언어별 아이콘 자동 매핑
- ✅ LanguageService와 통합 (라벨 다국어 지원)
- ✅ 디자인 토큰 준수
- ✅ typecheck 통과

**테스트** (`test/unit/shared/components/ui/LanguageSelector.test.tsx`):

- 4개 언어 옵션 렌더링 (아이콘 + 텍스트)
- 현재 언어 선택 상태 표시
- 언어 변경 시 onChange 호출
- 각 언어에 올바른 아이콘 표시
- 접근성 라벨 검증

##### Phase 4: SettingsModal 통합 (GREEN)

**목표**: 기존 `<select>`를 LanguageSelector로 교체

**작업**:

1. SettingsModal.tsx 수정
   - 기존 `<select id="language-select">`를 `<LanguageSelector>` 컴포넌트로 교체
   - handleLanguageChange 시그니처 유지
   - 기존 label 유지 (`localizedStrings().language`)
2. 스타일 조정 (SettingsModal.module.css)
   - 언어 선택 영역 레이아웃 조정 (Grid/Flex)
   - 디자인 토큰 사용

**Acceptance**:

- ✅ 기존 테스트 모두 GREEN 유지
  (`test/unit/shared/components/ui/SettingsModal.test.tsx`)
- ✅ 언어 변경 기능 정상 동작
- ✅ 접근성 테스트 통과
  (`test/unit/shared/components/ui/settings-modal-accessibility.test.tsx`)
- ✅ 디자인 토큰 위반 없음 (기존 토큰 테스트 통과)
- ✅ typecheck 통과

**테스트** (기존 테스트 수정 + 추가):

- `SettingsModal.test.tsx`:
  - 언어 선택이 RadioGroup으로 렌더링됨
  - 각 언어에 아이콘이 표시됨
  - 언어 변경 시 localizedStrings 업데이트
- `settings-modal-accessibility.test.tsx`:
  - 언어 선택 radiogroup이 올바른 role 속성 가짐
  - 키보드 네비게이션 동작
  - 스크린리더 라벨 검증

##### Phase 5: 접근성 통합 테스트 (REFACTOR)

**목표**: 전체 시나리오에서 접근성 검증

**작업**:

1. 통합 테스트 추가
   (`test/features/settings/settings-modal-language-icons.integration.test.tsx`)
   - 설정 모달 열기
   - 언어 선택 radiogroup 확인
   - 각 언어 아이콘 표시 확인
   - 키보드로 언어 탐색 및 선택
   - 언어 변경 후 UI 업데이트 확인
   - 선택 상태 시각적 표시 확인
2. 접근성 가이드 검증
   - WAI-ARIA 패턴 준수
   - 색상 대비 (Focus ring, Selected state)
   - 키보드 전용 사용 가능
   - 스크린리더 호환성

**Acceptance**:

- ✅ 모든 통합 테스트 GREEN
- ✅ WAI-ARIA radiogroup 패턴 준수
- ✅ 키보드 전용으로 모든 기능 사용 가능
- ✅ Focus indicator 명확 (디자인 토큰 사용)
- ✅ 색상 대비 4.5:1 이상 (WCAG AA)
- ✅ typecheck 통과
- ✅ lint 통과
- ✅ 모든 기존 테스트 GREEN 유지

**테스트**:

- 설정 모달 → 언어 선택 → 아이콘 표시 확인
- 키보드 네비게이션 (Tab, Arrow, Space, Enter)
- 언어 변경 후 모달 전체 라벨 업데이트
- 선택 상태 시각적 피드백 (border, background)

##### Phase 6: 문서화 및 마이그레이션 가이드 (REFACTOR)

**목표**: 변경 사항 문서화 및 확장 가능성 가이드 작성

**작업**:

1. ARCHITECTURE.md 업데이트
   - RadioGroup 컴포넌트 아키텍처 추가
   - LanguageSelector 설계 설명
2. CODING_GUIDELINES.md 업데이트
   - Radio button 접근성 패턴 예시 추가
   - 아이콘 + 텍스트 조합 가이드
3. TDD_REFACTORING_PLAN_COMPLETED.md에 Epic 이관
   - 완료 요약 작성
   - Acceptance 체크리스트
   - 학습 포인트

**Acceptance**:

- ✅ 문서 업데이트 완료
- ✅ 확장 가이드 작성 (테마 선택에도 적용 가능)
- ✅ 코드 리뷰 체크리스트 작성

---

**품질 게이트 (각 Phase 완료 시)**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN, 기존 테스트 유지)
- ✅ `npm run build:dev` (산출물 검증 통과)
- ✅ PC 전용 이벤트만 사용 (터치/포인터 이벤트 금지)
- ✅ 디자인 토큰만 사용 (하드코딩 색상/radius 금지)
- ✅ WAI-ARIA 패턴 준수

---

**확장 계획** (Future):

- 테마 선택에도 RadioGroup 적용 (아이콘: 태양/달/자동)
- 다운로드 설정에 RadioGroup 적용 가능
- RadioGroup을 재사용 가능한 디자인 시스템 컴포넌트로 발전

---

## 3. 최근 완료 Epic (참고용)

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
