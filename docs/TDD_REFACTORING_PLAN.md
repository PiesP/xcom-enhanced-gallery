# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-03 — Epic CONTEXT-MENU-UI 백로그에서 승격 (활성)

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심

---

## 2. 활성 Epic 현황

### Epic CONTEXT-MENU-UI (활성, 2025-10-03 승격)

**목적**: 네이티브 브라우저 컨텍스트 메뉴를 커스텀 SolidJS 컴포넌트로 대체하여
브랜드 일관성, 접근성, UX 통일성 향상

**우선순위**: LOW → MEDIUM (백로그 승격) | **난이도**: M

**현재 상태**: 네이티브 contextmenu 이벤트만 사용 중, 브라우저 기본 UI 표시

**선택 솔루션**: Option A - 커스텀 컨텍스트 메뉴 컴포넌트 (PC 전용)

#### 솔루션 평가

##### Option A: 커스텀 컨텍스트 메뉴 컴포넌트 (선택됨)

- **장점**: 브랜드 일관성, 스타일링 완전 제어, 접근성 개선 가능, 커스텀 액션
  추가 용이, Toolbar/Settings와 UX 통일, PC 전용 정책 준수 가능
- **단점**: 구현 복잡도 M, 브라우저 네이티브 동작과 차이, 포커스 관리 복잡성,
  번들 크기 증가 (~2-3KB)
- **선택 이유**: Epic 목적 충족 ("커스텀 SolidJS 컴포넌트로 대체"), UX 일관성,
  확장성, 접근성 제어 가능, PC 전용 정책 준수

##### Option B: 네이티브 컨텍스트 메뉴 유지 (제외됨)

- **장점**: 구현 단순 S, 브라우저 표준 UX, 번들 크기 영향 없음
- **단점**: 스타일링 불가능, 브랜드 통일성 부족, Epic 목적 미충족
- **제외 이유**: "커스텀 컴포넌트로 대체" 요구사항 미충족

##### Option C: 툴바/버튼으로 대체 (제외됨)

- **장점**: 명확한 UI, 접근성 우수, 디자인 토큰 활용
- **단점**: 컨텍스트 메뉴 패러다임 포기, 툴바 복잡도 증가, Epic 의도 불일치
- **제외 이유**: "컨텍스트 메뉴 대체" 요구사항과 불일치

#### Phase 1: RED (테스트 작성)

**목표**: ContextMenu 컴포넌트 계약 테스트 작성 (15-18 tests)

**테스트 파일**: `test/components/context-menu/context-menu.test.tsx`

**테스트 범위**:

1. **렌더링 및 표시/숨김** (3 tests)
   - 초기 상태에서 렌더링되지 않아야 함
   - show() 호출 시 표시되어야 함
   - hide() 호출 시 숨겨져야 함
2. **위치 계산** (3 tests)
   - 마우스 좌표에 따라 위치 설정
   - viewport 오른쪽 경계 초과 시 왼쪽 조정
   - viewport 하단 경계 초과 시 위쪽 조정
3. **액션 항목** (3 tests)
   - 다운로드 액션 클릭 시 onDownload 콜백 호출
   - 정보 보기 액션 클릭 시 onInfo 콜백 호출
   - 외부 클릭 시 메뉴 닫힘
4. **PC 전용 입력** (3 tests)
   - TouchEvent 사용하지 않아야 함 (onTouchStart/Move/End 없음)
   - PointerEvent 사용하지 않아야 함 (onPointerDown/Up 없음)
   - contextmenu 이벤트만 사용해야 함
5. **접근성** (3 tests)
   - role="menu" 속성 존재
   - aria-label 설정
   - 각 항목에 role="menuitem" 존재
6. **키보드 네비게이션** (3 tests)
   - Escape 키로 메뉴 닫기
   - Arrow Down/Up으로 항목 간 이동
   - Enter 키로 선택된 항목 실행

**Acceptance Criteria (Phase 1)**:

- ✅ 15+ tests 작성 (모두 RED 상태)
- ✅ PC 전용 입력 검증 포함 (Touch/Pointer 금지)
- ✅ 접근성 기준 정의 (ARIA, role)
- ✅ 키보드 네비게이션 명세 정의

#### Phase 2: GREEN (최소 구현)

**목표**: 테스트를 통과하는 최소 구현

**구현 파일**:

- `src/shared/components/ui/ContextMenu/ContextMenu.solid.tsx` - 메인 컴포넌트
- `src/shared/components/ui/ContextMenu/ContextMenu.module.css` - 스타일
- `src/shared/components/ui/ContextMenu/types.ts` - 타입 정의
- `src/shared/utils/position-calculator.ts` - 위치 계산 유틸리티

**구현 범위**:

1. **ContextMenu 컴포넌트**
   - Props: `isVisible`, `position`, `actions`, `onClose`
   - 기본 렌더링 (show/hide 로직)
   - 액션 항목 리스트 렌더링
2. **위치 계산 유틸리티**
   - `calculateMenuPosition(mouseX, mouseY, menuWidth, menuHeight)` 함수
   - viewport 경계 체크 및 조정
3. **상태 관리**
   - `createSignal<boolean>()` - 표시/숨김
   - `createSignal<{x: number, y: number}>()` - 위치
4. **기본 스타일**
   - 디자인 토큰 사용 (`--xeg-radius-lg`, `--color-bg-primary` 등)
   - z-index: `--xeg-z-modal`
5. **VerticalImageItem 통합**
   - contextmenu 이벤트 핸들러에서 ContextMenu 표시
   - 이벤트 preventDefault() 호출 (네이티브 메뉴 차단)

**Acceptance Criteria (Phase 2)**:

- ✅ 15+ tests GREEN
- ✅ 타입 체크 0 errors
- ✅ 린트 clean
- ✅ 빌드 성공
- ✅ 기본 다운로드 액션 작동

#### Phase 3: REFACTOR (고급 기능 및 최적화)

**목표**: 고급 기능 추가 및 코드 품질 개선

**개선 항목**:

1. **고급 위치 조정**
   - 스크롤 위치 고려
   - 다중 모니터 환경 지원
   - 메뉴 크기 동적 계산
2. **액션 확장**
   - 정보 보기 액션 구현 (미디어 메타데이터 표시)
   - 공유 액션 추가 (클립보드 복사)
   - 아이콘 추가 (DownloadIcon, InfoIcon 등)
3. **성능 최적화**
   - `createMemo()` 활용 (액션 리스트, 스타일)
   - `onCleanup()` 정리 로직 (이벤트 리스너)
   - 리렌더 최소화
4. **스타일 폴리싱**
   - 애니메이션 (fade-in, slide-in)
   - 호버 효과 (항목 하이라이트)
   - 그림자 및 테두리 개선
5. **다크 모드 지원**
   - ThemeService 통합
   - 테마별 색상 토큰 적용
6. **i18n 지원**
   - LanguageService 통합
   - 액션 레이블 다국어 지원 (ko/en/ja)

**Acceptance Criteria (Phase 3)**:

- ✅ 모든 tests GREEN (회귀 없음)
- ✅ viewport 경계 완벽 처리
- ✅ 정보 보기/공유 액션 작동
- ✅ 애니메이션 적용 (`prefers-reduced-motion` 준수)
- ✅ 다크 모드 완전 지원
- ✅ i18n 완전 지원 (ko/en/ja)
- ✅ 번들 크기 증가 < +3KB
- ✅ 성능: 메뉴 표시 < 16ms (60fps)

#### 전체 Acceptance Criteria

**기능 요구사항**:

- ✅ 네이티브 컨텍스트 메뉴 완전 대체
- ✅ 다운로드/정보/공유 액션 지원
- ✅ 마우스 우클릭 시 표시
- ✅ 외부 클릭 시 자동 닫힘
- ✅ Escape 키로 닫힘

**품질 요구사항**:

- ✅ 타입 체크 0 errors
- ✅ 린트 clean
- ✅ 15+ tests GREEN
- ✅ PC 전용 입력만 사용 (Touch/Pointer 금지)
- ✅ 디자인 토큰 사용 (하드코딩 금지)
- ✅ ARIA 완전성 (role, aria-label 등)
- ✅ 키보드 네비게이션 (Arrow, Enter, Escape)
- ✅ 번들 크기 < +3KB
- ✅ 빌드 성공 (dev + prod)

**PC 전용 정책 준수**:

- ✅ contextmenu 이벤트만 사용 (허용 목록)
- ✅ TouchEvent 사용 금지 (테스트로 검증)
- ✅ PointerEvent 사용 금지 (테스트로 검증)
- ✅ 백로그 "터치 디바이스 대응" 문구 제거

#### 예상 영향

**변경 파일** (예상):

- 신규: `src/shared/components/ui/ContextMenu/*` (3 files)
- 신규: `src/shared/utils/position-calculator.ts`
- 수정:
  `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.solid.tsx`
- 신규: `test/components/context-menu/context-menu.test.tsx`

**번들 크기 영향**: +2-3KB (컴포넌트 + 유틸리티 + 스타일)

**회귀 리스크**: LOW (기존 contextmenu 동작 유지, 추가 UI만 변경)

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
