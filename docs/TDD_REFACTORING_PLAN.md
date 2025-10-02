# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-02 — DOM 구조 분석 기반 3개 리팩토링 Epic 추가

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심

---

## 2. 활성 Epic 현황

### Epic DOM-DEPTH-GUARD (신규: 2025-10-02)

**목적**: 갤러리 아이템 포커스 상태 역할 명확화 및 접근성 향상

**배경**:

- VerticalImageItem에서 `.active`와 `.focused` 상태의 역할 구분이 불명확
- 두 상태 모두 box-shadow만 다르고 로직적 차이가 명시되지 않음
- 접근성 측면에서 현재 아이템 표시가 시각적으로만 존재

**솔루션 분석**:

| 옵션                   | 설명                             | 장점                   | 단점                  | 위험도 | 선택       |
| ---------------------- | -------------------------------- | ---------------------- | --------------------- | ------ | ---------- |
| A. 단일 상태 통합      | active만 사용                    | 단순화                 | 스크롤/선택 분리 불가 | 중간   | ❌         |
| B. 명확한 역할 분리    | active=선택, focused=스크롤 대상 | 명확한 의미, 확장 가능 | 복잡도                | 낮음   | ✅ 채택    |
| C. aria-current 재설계 | 웹 표준 준수                     | 접근성 향상            | CSS 수정 필요         | 중간   | ⚠️ Phase 2 |

**선택 근거**:

- 현재 두 상태는 서로 다른 목적으로 사용됨을 확인
- 명확한 문서화와 테스트로 역할 구분 강화
- aria-current는 추후 점진적 개선

**구현 계획**:

**Phase 1: 상태 역할 테스트 작성 (RED → GREEN)**

- [ ] 테스트 파일: `test/features/gallery/focus-state-roles.test.tsx`
  - [ ] `isActive=true`: 사용자가 클릭/키보드로 명시적 선택한 아이템
  - [ ] `isFocused=true`: 갤러리 열릴 때 시작 인덱스 (자동 스크롤 대상)
  - [ ] 두 상태가 동시에 true일 수 있음 검증 (startIndex로 열린 경우)
  - [ ] 각 상태별 CSS 클래스 적용 검증 (`.active`, `.focused`)
  - [ ] 키보드 네비게이션 시 active 상태 이동 검증

**Phase 2: 타입 및 주석 개선 (REFACTOR)**

- [ ] `VerticalImageItem.types.ts` Props 인터페이스에 JSDoc 추가:

  ```typescript
  /**
   * 현재 활성화된 아이템 여부
   * @remarks 사용자가 클릭하거나 키보드 네비게이션으로 선택한 아이템.
   * 명시적 사용자 인터랙션의 결과.
   */
  isActive?: boolean;

  /**
   * 현재 포커스된 아이템 여부 (스크롤 대상)
   * @remarks 갤러리 열릴 때 자동 스크롤 대상 아이템.
   * 일반적으로 startIndex와 일치하며, 시각적 주목을 위해 사용.
   */
  isFocused?: boolean;
  ```

- [ ] `VerticalImageItem.module.css`에 주석 추가:

  ```css
  /* 활성 상태: 사용자가 명시적으로 선택한 아이템 */
  .container.active {
    /* ... */
  }

  /* 포커스 상태: 자동 스크롤 대상 아이템 (갤러리 열림 시 시작점) */
  .container.focused {
    /* ... */
  }
  ```

**Phase 3: 디자인 토큰 문서화 (DOCUMENT)**

- [ ] `src/styles/design-tokens.css` 또는 관련 토큰 파일에 주석:
  ```css
  --xeg-active-shadow: /* 사용자 선택 아이템 강조 */;
  --xeg-focus-shadow: /* 자동 스크롤 대상 아이템 표시 */;
  ```
- [ ] `docs/CODING_GUIDELINES.md`에 "포커스 상태 관리" 섹션 추가

**Phase 4 (선택적): aria-current 적용**

- [ ] `isActive=true`일 때 `aria-current="true"` 추가
- [ ] 스크린 리더 테스트 (수동)
- [ ] CSS에서 `[aria-current="true"]` 선택자로 스타일 적용 검토

**Acceptance Criteria**:

- ✅ 포커스 상태 역할 테스트 5개 이상 GREEN
- ✅ Props 인터페이스에 JSDoc 추가로 역할 명확화
- ✅ CSS 주석으로 스타일 의도 문서화
- ✅ CODING_GUIDELINES.md에 포커스 상태 섹션 추가
- ✅ 기존 동작 변경 없음

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (5+ tests GREEN)
- ✅ `npm run build:dev` (산출물 검증 통과)

**예상 소요 시간**: 1-2시간

---

### Epic DOM-DEPTH-GUARD (신규: 2025-10-02)

**목적**: 갤러리 DOM 중첩 깊이 회귀 방지 테스트

**배경**:

- 현재 갤러리 DOM은 6단계 중첩으로 양호한 수준
- Phase 4 최적화에서 이미 불필요한 래퍼 제거 완료 (`itemsList`, `imageWrapper`)
- 향후 기능 추가 시 중첩 깊이가 증가하지 않도록 가드 필요

**구현 계획**:

**Phase 1: DOM 깊이 측정 테스트 (RED → GREEN)**

- [ ] 테스트 파일: `test/architecture/dom-depth-guard.test.ts`
  - [ ] 실제 렌더링된 갤러리 DOM 트리 깊이 측정
  - [ ] 최대 허용 깊이 6단계 검증
  - [ ] 각 레이어의 역할 검증:
    1. `#xeg-gallery-root` (GalleryRenderer)
    2. `.xeg-gallery-overlay` (GalleryContainer)
    3. `.shell` (SolidGalleryShell)
    4. Toolbar + `.contentArea`
    5. `.itemsContainer`
    6. `.container` (VerticalImageItem)
  - [ ] 불필요한 중간 래퍼 존재 여부 검증

**Phase 2: 깊이 계산 유틸리티 (선택적)**

- [ ] `test/utils/dom-depth-calculator.ts`:
  ```typescript
  /**
   * DOM 트리의 최대 깊이를 계산
   * @param root 시작 노드
   * @returns 최대 중첩 깊이
   */
  export function calculateMaxDepth(root: Element): number;
  ```

**Phase 3: 문서화**

- [ ] `docs/ARCHITECTURE.md`에 "DOM 구조 제약" 섹션 추가
- [ ] 최대 깊이 6단계 정책 명시
- [ ] 새 레이어 추가 시 검토 프로세스 안내

**Acceptance Criteria**:

- ✅ DOM 깊이 측정 테스트 3개 이상 GREEN
- ✅ 최대 깊이 6단계 가드 동작
- ✅ 각 레이어 역할 검증
- ✅ ARCHITECTURE.md에 DOM 구조 제약 문서화

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm test` (3+ tests GREEN)
- ✅ `npm run build:dev` (산출물 검증 통과)

**예상 소요 시간**: 1시간

---

## 우선순위 및 진행 순서

1. **Epic DOM-EVENT-CLARITY** (우선순위: 높음, 2-3시간)
   - 가장 실용적 개선 효과
   - 향후 기능 추가의 기반

2. **Epic DOM-DEPTH-GUARD** (우선순위: 중간, 1시간)
   - 빠른 구현, 즉시 효과
   - 회귀 방지 가드

3. **Epic A11Y-FOCUS-ROLES** (우선순위: 중간, 1-2시간)
   - 접근성 및 코드 가독성 향상
   - 문서화 중심

**총 예상 소요 시간**: 4-6시간

---

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
