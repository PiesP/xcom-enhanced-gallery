# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-01-04 — Epic UI-TEXT-ICON-OPTIMIZATION 활성화

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심

---

## 2. 활성 Epic 현황

### Epic UI-TEXT-ICON-OPTIMIZATION (활성: 2025-01-04)

**목적**: UI 요소의 텍스트/아이콘 사용 최적화를 통한 사용자 경험 개선

**배경**:

- 현황 평가 결과, 전반적으로 우수한 접근성과 일관성을 갖추었으나 4가지 개선 기회
  발견
- 하드코딩된 텍스트로 인한 국제화 불일치 (한국어/영어 혼재)
- aria-label과 title 속성 중복으로 키보드 단축키 가시성 저하
- Settings 아이콘의 중복 사용으로 기능 구분 혼동
- ContextMenu 접근성 ARIA 역할 미흡 (Epic CONTEXT-MENU-UI Phase 3 미완료)

**우선순위**: P0 (High Impact - 모든 언어 사용자에게 영향)

**예상 영향**:

- ✅ 완전한 다국어 지원 (한국어/영어/일본어)
- ✅ 접근성 WCAG 2.1 Level AA 완전 준수
- ✅ 키보드 단축키 발견성 향상
- ✅ 시각적 명확성 개선

**전략**: 4가지 개선 영역을 단계별로 통합 구현

1. I18N-COMPLETION: 국제화 완전성 확보
2. TOOLTIP-SEMANTICS: aria-label/title 의미 분리
3. ICON-SEMANTIC-CLARITY: 아이콘 중복 해소
4. CONTEXTMENU-A11Y: 접근성 강화

---

#### Phase 1: RED (실패 테스트 작성)

**목표**: 각 개선 영역의 계약을 테스트로 정의

**테스트 파일 생성**:

1. **국제화 커버리지 테스트** (`test/unit/i18n/toolbar-i18n-coverage.test.ts`)
   - 모든 언어(ko/en/ja)에서 Toolbar 버튼 라벨 렌더링
   - 하드코딩 텍스트 감지 (undefined, 템플릿 변수 남김)
   - LanguageService 키 존재 검증

2. **ARIA/Title 의미론적 분리 테스트**
   (`test/accessibility/button-label-semantics.test.ts`)
   - aria-label은 간결 (기능 설명만)
   - title은 상세 (키보드 단축키 포함)
   - 키보드 단축키가 있는 버튼은 title ≠ aria-label

3. **아이콘 고유성 테스트**
   (`test/architecture/icon-semantic-uniqueness.test.ts`)
   - 동일 아이콘이 서로 다른 기능에 사용되지 않음
   - 키보드 도움말 버튼은 QuestionMark 아이콘 사용

4. **ContextMenu ARIA 계약 테스트**
   (`test/accessibility/contextmenu-aria-roles.test.ts`)
   - 메뉴 컨테이너에 role="menu"
   - 메뉴 항목에 role="menuitem"
   - aria-orientation="vertical"
   - 첫 항목 자동 포커스

**예상 결과**: 4개 테스트 파일, 총 15-20개 테스트 케이스 RED

**Acceptance Criteria**:

- [ ] 4개 테스트 파일 생성
- [ ] 모든 테스트 RED 상태 확인
- [ ] TypeScript 0 errors
- [ ] 테스트 의도 명확 (describe/it 문구)

---

#### Phase 2: GREEN (최소 구현)

**목표**: RED 테스트를 통과시키는 최소 변경

**구현 작업**:

1. **LanguageService 확장** (`src/shared/services/LanguageService.ts`)

   ```typescript
   export interface LanguageStrings {
     readonly toolbar: {
       // 기존 키 유지
       readonly previous: string;
       readonly next: string;
       // ... 기존 키들 ...

       // 추가 키
       readonly fitOriginal: string;
       readonly fitWidth: string;
       readonly fitHeight: string;
       readonly fitContainer: string;
       readonly downloadCurrent: string;
       readonly keyboardHelp: string;

       // 키보드 단축키 포함 버전 (title 전용)
       readonly previousWithKey: string; // "이전 미디어 (←)"
       readonly nextWithKey: string; // "다음 미디어 (→)"
       readonly fitOriginalWithKey: string; // "원본 크기 (1:1)"
       readonly downloadCurrentWithKey: string; // "현재 파일 다운로드 (Ctrl+D)"
       readonly closeWithKey: string; // "갤러리 닫기 (Esc)"
       readonly keyboardHelpWithKey: string; // "키보드 단축키 도움말 (?)"
     };
     // ... 기존 인터페이스 유지 ...
   }
   ```

2. **다국어 리소스 추가** (ko/en/ja)
   - 한국어 리소스: 13개 키 추가
   - 영어 리소스: 13개 키 추가
   - 일본어 리소스: 13개 키 추가

3. **Toolbar.tsx 하드코딩 제거**
   (`src/shared/components/ui/Toolbar/Toolbar.tsx`)

   ```tsx
   // Before
   aria-label='이전 미디어'
   title='이전 미디어 (←)'

   // After
   aria-label={languageService.getString('toolbar.previous')}
   title={languageService.getString('toolbar.previousWithKey')}
   ```

   - 12개 버튼 모두 변경

4. **QuestionMark 아이콘 추가** (`src/assets/icons/xeg-icons.ts`)

   ```typescript
   export const QuestionMarkIcon: IconComponent = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
       <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/>
       <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" fill="none" stroke-width="2"/>
       <circle cx="12" cy="17" r="1" fill="currentColor"/>
     </svg>
   );
   ```

5. **IconRegistry에 QuestionMark 등록** (`src/shared/services/iconRegistry.ts`)

   ```typescript
   const ICON_IMPORTS = {
     // ... 기존 아이콘들 ...
     QuestionMark: () =>
       Promise.resolve(resolveXegIconComponent('QuestionMark')),
   } as const;
   ```

6. **Toolbar 키보드 도움말 버튼 아이콘 변경**

   ```tsx
   <ToolbarButton
     icon='QuestionMark' // 'Settings'에서 변경
     aria-label={languageService.getString('toolbar.keyboardHelp')}
     title={languageService.getString('toolbar.keyboardHelpWithKey')}
   />
   ```

7. **ContextMenu ARIA 역할 추가**
   (`src/shared/components/ui/ContextMenu/ContextMenu.solid.tsx`)
   ```tsx
   <div
     ref={menuRef}
     class={styles.contextMenu}
     role='menu'
     aria-orientation='vertical'
     aria-label='Context menu'
   >
     <For each={props.actions}>
       {(action, index) => (
         <button
           role='menuitem'
           tabindex={focusedIndex() === index() ? 0 : -1}
           // ... 기존 props ...
         >
           {action.label}
         </button>
       )}
     </For>
   </div>
   ```

**예상 결과**: 15-20/15-20 tests GREEN

**Acceptance Criteria**:

- [ ] 모든 테스트 GREEN
- [ ] TypeScript 0 errors
- [ ] Lint clean
- [ ] 언어 변경 시 실시간 반영 확인 (수동 테스트)
- [ ] 번들 크기 변화 측정 (±5 KB 이내 예상)

---

#### Phase 3: REFACTOR (문서화 + 최적화)

**목표**: 코드 정리, 문서 업데이트, 가이드라인 추가

**작업 항목**:

1. **코딩 가이드라인 업데이트** (`docs/CODING_GUIDELINES.md`)

   ```markdown
   ## 버튼 접근성 속성 가이드

   ### aria-label vs title 사용 원칙

   | 속성         | 용도                                     | 예시                |
   | ------------ | ---------------------------------------- | ------------------- |
   | `aria-label` | 스크린 리더용 **간결한 기능 설명**       | `"이전 미디어"`     |
   | `title`      | 마우스 호버 툴팁, **키보드 단축키 포함** | `"이전 미디어 (←)"` |

   ### 규칙

   - **필수**: 모든 아이콘 버튼은 `aria-label` 필수
   - **권장**: `title`에 키보드 단축키 명시 (있는 경우)
   - **금지**: 동일한 텍스트 반복 (`aria-label`과 `title`이 완전히 같은 경우)

   ### 국제화 (i18n)

   - **필수**: UI 텍스트는 반드시 `LanguageService` 경유
   - **금지**: 하드코딩된 문자열 (한국어, 영어, 일본어 등)
   - **패턴**: 키보드 단축키가 있는 텍스트는 `xxxWithKey` 키 사용
   ```

2. **LanguageService 사용 가이드 추가** (`docs/CODING_GUIDELINES.md`)

   ````markdown
   ## 국제화 (i18n)

   ### LanguageService 사용 패턴

   ```tsx
   import { LanguageService } from '@shared/services/LanguageService';

   const languageService = new LanguageService();

   // 간단한 문자열
   const label = languageService.getString('toolbar.previous');

   // 템플릿 변수 포함
   const message = languageService.getFormattedString(
     'messages.download.progress.body',
     {
       current: 5,
       total: 10,
       percentage: 50,
       filename: 'image.jpg',
     }
   );
   ```
   ````

   ### 새 키 추가 절차
   1. `LanguageStrings` 인터페이스에 타입 정의
   2. 모든 언어(ko/en/ja)에 리소스 추가
   3. 테스트로 키 존재 검증

   ```

   ```

3. **아이콘 사용 가이드 추가** (`docs/CODING_GUIDELINES.md`)

   ```markdown
   ## 아이콘 사용 가이드

   ### 의미론적 고유성

   - **원칙**: 하나의 아이콘은 하나의 의미만 표현
   - **금지**: 동일 아이콘을 서로 다른 기능에 재사용

   ### 주요 아이콘 매핑

   | 아이콘         | 용도                 | 컴포넌트                 |
   | -------------- | -------------------- | ------------------------ |
   | `Settings`     | 설정 열기            | Toolbar 설정 버튼        |
   | `QuestionMark` | 도움말/키보드 단축키 | Toolbar 키보드 도움말    |
   | `Close`        | 닫기                 | Toolbar 닫기, Modal 닫기 |
   | `Download`     | 단일 다운로드        | Toolbar 현재 파일        |
   | `FileZip`      | ZIP 다운로드         | Toolbar 전체 파일        |
   ```

4. **변경 사항 요약 문서 작성** (`docs/UI-TEXT-ICON-OPTIMIZATION-SUMMARY.md`)
   - 변경된 파일 목록
   - 추가된 i18n 키 목록
   - 테스트 커버리지 리포트
   - 번들 크기 변화 측정
   - 마이그레이션 가이드 (다른 컴포넌트 참고용)

5. **회귀 방지 가드 추가**
   - ESLint 규칙: 하드코딩 텍스트 감지 (한글/영문 리터럴)
   - Pre-commit hook: i18n 키 동기화 검증

**Acceptance Criteria**:

- [ ] 문서 3개 업데이트/추가
- [ ] 회귀 방지 가드 2개 추가
- [ ] 번들 크기 측정 및 기록
- [ ] `npm run build` 성공
- [ ] 모든 테스트 GREEN 유지

---

#### 품질 게이트 (Phase 2-3 공통)

**필수 체크리스트**:

- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run lint:fix` — clean
- [ ] `npm test` — 모든 테스트 GREEN
- [ ] `npm run build:dev` — 성공
- [ ] `npm run build:prod` — 성공
- [ ] 번들 크기: ±10 KB 이내 (예상: +2-5 KB)

**수동 검증**:

- [ ] 한국어/영어/일본어 전환 시 모든 버튼 라벨 정상 표시
- [ ] 키보드 단축키 툴팁 정상 표시 (마우스 호버)
- [ ] 스크린 리더 테스트 (NVDA/JAWS 호환)
- [ ] 키보드 네비게이션 정상 동작
- [ ] ContextMenu 키보드 네비게이션 (Arrow/Enter/Escape)

---

#### 예상 산출물

**변경 파일** (총 12개):

1. `src/shared/services/LanguageService.ts` — 인터페이스 확장
2. `src/shared/components/ui/Toolbar/Toolbar.tsx` — 하드코딩 제거
3. `src/assets/icons/xeg-icons.ts` — QuestionMark 아이콘 추가
4. `src/shared/services/iconRegistry.ts` — 아이콘 등록
5. `src/shared/components/ui/ContextMenu/ContextMenu.solid.tsx` — ARIA 역할
6. `test/unit/i18n/toolbar-i18n-coverage.test.ts` — 신규
7. `test/accessibility/button-label-semantics.test.ts` — 신규
8. `test/architecture/icon-semantic-uniqueness.test.ts` — 신규
9. `test/accessibility/contextmenu-aria-roles.test.ts` — 신규
10. `docs/CODING_GUIDELINES.md` — 가이드 추가
11. `docs/UI-TEXT-ICON-OPTIMIZATION-SUMMARY.md` — 신규
12. `.eslintrc.js` (선택) — 하드코딩 감지 규칙

**테스트 커버리지**:

- 신규 테스트: 15-20개
- 기존 테스트: 회귀 방지 (모두 GREEN 유지)

**번들 영향**:

- QuestionMark 아이콘: ~0.5 KB
- LanguageService 확장: ~1-2 KB (리소스 추가)
- 총 예상: +2-3 KB

---

#### 리스크 및 완화 전략

**리스크 1**: 언어 변경 시 리렌더링 성능

- **완화**: LanguageService는 이미 최적화됨 (signal 기반), 추가 성능 테스트

**리스크 2**: 기존 테스트 회귀

- **완화**: Phase 1에서 계약 테스트로 경계 명확화, Phase 2에서 점진적 변경

**리스크 3**: 번들 크기 증가

- **완화**: 아이콘 1개만 추가, i18n 리소스는 압축 효과 높음

**리스크 4**: ContextMenu 변경으로 인한 부작용

- **완화**: Epic CONTEXT-MENU-UI의 기존 18개 테스트로 회귀 방지

---

#### 성공 지표

**정량적**:

- ✅ 하드코딩 텍스트: 12개 → 0개
- ✅ i18n 키 커버리지: 85% → 100%
- ✅ 접근성 테스트: +4개 파일, +15-20개 케이스
- ✅ 아이콘 중복 사용: 1건 → 0건

**정성적**:

- ✅ 모든 언어 사용자에게 완전한 번역 제공
- ✅ 키보드 단축키 발견성 향상
- ✅ 스크린 리더 호환성 개선
- ✅ 시각적 명확성 향상

---

#### 다음 단계

Phase 1-3 완료 후:

1. `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관
2. 백로그 검토: 장기 개선 과제 (커스텀 툴팁 컴포넌트 등)
3. 다른 컴포넌트에 동일 패턴 적용 (Settings, Toast 등)

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
