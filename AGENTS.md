# xcom-enhanced-gallery • AGENTS.md

개발자가 빠르게 온보딩하고, 로컬/CI에서 동일한 워크플로로 작업할 수 있도록
정리한 프로젝트 실행 가이드입니다.

## 개발 환경

- 패키지 매니저: npm (단일 패키지)
- Node.js: 20 권장 (CI는 20/22에서 검증)
- 번들러: Vite 7,## PR 규칙

- 제목: `[xcom-enhanced-gallery] <Title>`
- 머지 전 필수: `npm run typecheck` / `npm run lint` / `npm test`
- 스타일/토큰/접근성은 `docs/CODING_GUIDELINES.md`와 테스트 스위트 기준을
  따릅니다.
  - PR 설명에 다음 확인 사항을 포함해 주세요:
    - 최소 컨텍스트 제공(파일 경로/타입/제약/수용 기준)
    - "한 줄 구조 리팩토링"/최소 diff 원칙 적용 여부
    - vendors/Userscript getter 사용, PC 전용 이벤트, 디자인 토큰 준수 여부
    - RED→GREEN 테스트 링크 또는 요약

## 최근 완료된 작업 (2025-01-10)

### Phase 9.22: SETTINGS-THEME-INTEGRATION 완료 (Preact→Solid 리팩토링 버그 수정) ✅

**배경**: 브라우저 테스트에서 3가지 Critical/High 버그 발견
(v0.3.1-dev.1759929188276)

**발견된 문제**:

1. ❌ **Critical**: 설정 변경이 적용되지 않음 - 설정 모달에서 테마/언어 선택 시
   아무 반응 없음
2. ❌ **High**: 다크모드에서 툴바 아이콘이 보이지 않음 - 다크 배경에 다크
   아이콘으로 렌더링
3. ⚠️ **Medium**: 설정 모달 CSS가 무너진 것처럼 보임 (문제 2와 동일 원인)

**근본 원인**:

1. `ToolbarWithSettings`가 `SettingsModal`에 `onThemeChange`, `onLanguageChange`
   props 전달 안 함
   - SettingsModal의 select onChange → `handlers.onThemeChange?.(value)` 호출 →
     undefined 호출
   - ThemeService.setTheme() 절대 호출되지 않음
2. CSS에 `[data-theme="dark"]` 선택자 없음
   (`@media (prefers-color-scheme: dark)`만 존재)
   - ThemeService는 `<html data-theme="dark">` 속성 설정
   - 그러나 CSS가 이를 인식 못함 → 수동 테마 변경 불가

**해결 방법**:

1. ThemeService 인스턴스를 `src/shared/services/index.ts`에서 export
   (LanguageService 패턴과 일관성)
2. ToolbarWithSettings에 `handleThemeChange`, `handleLanguageChange` 구현 및
   SettingsModal에 6개 props 전달
3. `design-tokens.semantic.css`에 `[data-theme='dark']`와 `[data-theme='light']`
   선택자 추가
4. 테스트에서 `@solidjs/testing-library`의 `cleanup()` 사용 (Portal 정리 문제
   해결)

**결과**:

- ✅ 설정 변경 적용됨 (onChange 핸들러 연결)
- ✅ 다크모드 아이콘 표시됨 (CSS [data-theme] 선택자)
- ✅ 설정 모달 CSS 정상 (위 문제 2 해결로 자동 해결)
- ✅ 4개 테스트 모두 PASS (RED → GREEN)
- ✅ 빌드: Dev 1,056.06 KB, Prod 338.07 KB (gzip 90.63 KB)
- ✅ 타입/린트/빌드 검증 통과
- ✅ 의존성: 247 modules, 707 dependencies (위반 0건)

**교훈**:

- Solid.js 리팩토링 시 onChange 핸들러 연결을 놓치기 쉬움 (특히 props 전달
  체인이 긴 경우)
- CSS에 @media와 [data-attribute] 선택자를 모두 제공해야 수동/자동 테마 전환
  지원 가능
- 서비스 인스턴스는 일관되게 export해야 테스트 가능 (themeService ≈
  languageService 패턴)
- @solidjs/testing-library의 cleanup()이 Portal 정리에 필수적

**상세 문서**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 9.22 참조

---

### Phase 9.21.3: GALLERY-STATE-ISOPEN-DERIVED-SIGNAL 완료 (Phase 9.21.2 버그 수정) ✅

**배경**: Phase 9.21.2 완료 후 Critical 버그 발견 - 갤러리가 화면에 표시되지
않음. 로그에는 "갤러리 컨테이너 생성됨"이 출력되지만 "[GalleryRenderer] isOpen
변경 감지" 로그가 없음

**Phase 9.21.2의 치명적 오류**: `untrack()` 패턴이 모든 반응성을 제거

- `const currentState = untrack(() => galleryState.value);` → snapshot (zero
  reactivity)
- `const isOpen = currentState.isOpen;` → plain boolean (not tracked)
- createEffect가 isOpen 변경을 감지하지 못함 → `renderGallery()` 호출 안 됨
- untrack()는 "모든 반응성 제거" 도구, "일부만 추적"에는 부적합

**올바른 해결 방법 (Phase 9.21.3)**:

- createMemo로 derived signal 구현:
  `export const isGalleryOpen = createMemo(() => galleryState.value.isOpen);`
- GalleryRenderer에서 사용: `const isOpen = isGalleryOpen();` - **isOpen만
  추적**
- createMemo의 equality check가 핵심: currentIndex 변경 시 결과값(isOpen) 동일 →
  effect 재실행 안 함

**결과**:

- ✅ 갤러리 정상 표시 (renderGallery() 호출 보장)
- ✅ currentIndex 변경 시 재렌더링 없음 (createMemo equality check)
- ✅ 설정 모달 정상 표시
- ✅ 10개 테스트 모두 PASS (RED → GREEN)
- ✅ 빌드: Dev 1,054.98 KB, Prod 336.82 KB (gzip 90.36 KB)
- ✅ 타입/린트/빌드 검증 통과

**교훈**:

- Solid.js 반응성: untrack()는 모든 반응성 제거, derived signals에는 createMemo
  사용
- createMemo equality check: 결과값 동일하면 의존자 업데이트 안 함
- TDD 효과: RED 테스트가 올바른 패턴 강제 (untrack 제거, createMemo 사용)
- Test-driven debugging: 로그 분석 + 테스트로 반응성 문제 조기 탐지

**상세 문서**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 9.21.3 참조

### Phase 9.21.2: GALLERY-STATE-ISOPEN-UNTRACK-FIX (Phase 9.21.1 HOTFIX 오류 수정 시도 ❌)

**배경**: Phase 9.21.1 HOTFIX 적용 후에도 2가지 Critical 버그 재발

**Phase 9.21.1 HOTFIX의 오류**: Solid.js transitive tracking 메커니즘 미숙지 -
`galleryState.value.isOpen` 접근 시 `value` 객체 전체를 추적

**Phase 9.21.2 시도**: untrack() 패턴 적용

**결과**: ❌ 빌드는 성공했으나 갤러리가 화면에 표시되지 않음 (Critical 버그)

**실패 원인**: untrack()가 모든 반응성 제거, isOpen 변경 감지 불가

**최종 해결**: Phase 9.21.3에서 createMemo derived signal로 수정

**상세 문서**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 9.21.2 참조

### Phase 9.16: SERVICE-INIT-CLEANUP 완료 (서비스 초기화 정리 및 갤러리 이중 렌더링 수정) ✅

**배경**: 로그 분석 중 서비스 중복 등록(3건 WARN)과 갤러리 이중 렌더링(8ms 간격)
발견

**근본 원인**:

- `service-initialization.ts`에서 동일 서비스를 여러 키로 중복 등록
  - `toast.controller` 2회 등록 (SERVICE_KEYS.TOAST + 'toast.controller')
  - `theme.service` 2회 등록 (SERVICE_KEYS.THEME + 'theme.service')
- `GalleryRenderer.tsx`에서 `isRenderingFlag` 필드가 finally 블록에서 즉시 리셋
  - 컨테이너 존재 여부와 플래그가 이중으로 체크되어 혼란
  - Solid.js `effectSafe`가 즉시 실행 후 signal 변경으로 재실행

**해결 방법**:

- 서비스 중복 등록 3건 제거 (단일 키로만 등록)
- `isRenderingFlag` 필드 제거, `container` 존재 여부를 단일 진실 원천으로 사용
- `renderGallery()` 가드를 `if (this.container)` 단순화

**결과**:

- ✅ WARN 로그 3건 → 0건 (100% 제거)
- ✅ 갤러리 렌더링 2회 → 1회 (8ms 절약)
- ✅ 코드 간소화 (isRenderingFlag 필드 제거)
- ✅ 빌드: Dev 1,053.80 KB, Prod 336.52 KB (gzip 90.31 KB)
- ✅ 타입/린트/빌드 검증 통과

**교훈**:

- 서비스 등록은 단일 키로만 수행 (중복 키는 디버깅 혼란 초래)
- 상태 가드는 단일 진실 원천 사용 (이중 플래그는 경합 조건 유발)
- 로그 타임스탬프 분석으로 렌더링 중복/경합 조건 조기 탐지 가능

**상세 문서**: `docs/TDD_REFACTORING_PLAN.md` Phase 9.16 참조

### Phase 9.13: SETTINGS-MODAL-CSS 완료 (설정 모달 CSS 품질 및 UX 개선) ✅

**배경**: Phase 9.12에서 설정 모달 반응성 문제를 해결한 후, CSS 중복 선언,
클래스 네이밍 불일치, UX 개선 기회를 발견

**주요 변경**:

- CSS 중복 제거: background/border 중복 선언 4건 제거
- 클래스 네이밍 통일: settings-form, settings-content 등 일관된 접두사
- HeroX 아이콘: 닫기 버튼에 텍스트 대신 X 아이콘 사용
- 커스텀 select: 디자인 토큰 기반 드롭다운 화살표 스타일 개선

**결과**:

- ✅ CSS 코드 품질 향상 (중복 제거, 일관성 확보)
- ✅ UX 개선 (아이콘화, 시각적 피드백 강화)
- ✅ 빌드: Dev 1,053.96 KB (+0.37 KB), Prod 336.96 KB (gzip 90.33 KB)
- ✅ 타입/린트/빌드 검증 통과

**교훈**:

- CSS 중복은 유지보수 비용 증가 원인, 정기적 점검 필요
- 일관된 클래스 네이밍은 가독성과 유지보수성 향상
- 디자인 토큰 시스템의 엄격한 준수가 품질 유지의 핵심

**상세 문서**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 9.13 참조

### Phase 9.12: MODAL-REACTIVITY-FIX 완료 (설정 모달 표시 버그 수정) ✅

**배경**: 설정 모달이 콘솔 로그에는 "설정 모달 렌더링 시작"이 출력되지만 실제로
사용자에게 표시되지 않는 버그 발생

**근본 원인**:

- `ModalShell.tsx`의 `backdropClass()`와 `shellClass()` 함수가 일반 함수로 정의
- Solid.js 반응성 시스템이 `local.isOpen` prop 변경을 추적하지 못함
- CSS 클래스 `modal-open`이 동적으로 추가/제거되지 않아 모달이
  `opacity: 0; visibility: hidden` 상태로 고정됨

**해결 방법**:

- `createMemo` import 추가 (`getSolid()`에서)
- `backdropClass` 함수를 `createMemo(() => {...})` 로 변경
- `shellClass` 함수를 `createMemo(() => {...})` 로 변경
- 반응성 컨텍스트를 명시적으로 생성하여 `local.isOpen` 변경 감지 보장

**결과**:

- ✅ 설정 모달 정상 표시 (Critical 버그 해결)
- ✅ 반응성 패턴 개선 (createMemo 사용)
- ✅ 빌드: Dev 1,053.59 KB (+0.03 KB), Prod 335.96 KB (gzip 89.92 KB)
- ✅ 타입/린트/빌드 검증 통과

**교훈**:

- Solid.js에서 props 접근 로직이 복잡하거나 조건부일 경우 `createMemo` 사용 권장
- 로그 출력과 실제 DOM 상태 불일치 시 반응성 추적 문제 의심
- CSS 기반 제어(Phase 9.6 Show 제거)는 올바른 방향이었으나 반응성 보장이 필수적

**상세 문서**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 9.12 참조

### Phase 9.11 & 9.5: vitest.config 재작성 & 키보드 리스너 중앙화 ✅

**배경**: 240개 테스트가 "React is not defined" 오류로 실패. vitest.config.ts가
348줄로 과도하게 복잡했고, vite-plugin-solid가 JSX transform을 적용하지 않음.

**해결 방법**:

- solidjs/solid-start 프로젝트의 간단한 패턴 참고
- vitest.config.ts 전면 재작성 (348줄 → 70줄, 80% 감소)
- `solid()` 플러그인을 옵션 없이 사용
- 명시적 resolve.alias 추가

**결과**:

- ✅ JSX transform 문제 해결 (핵심 목표)
- ✅ 테스트 pass rate: 28% → 79% (+175% 증가)
- ✅ Passing files: 107 → 294 (+187 files)
- ✅ 빌드 성공: Dev 1,031.79 KB, Prod 331.86 KB

**Vitest 설정 패턴**:

```typescript
plugins: [
  solid(), // 옵션 없음 - solid-start 패턴
  tsconfigPaths({ projects: ['tsconfig.json'] }),
];
```

**교훈**:

- 단순함이 최고: 복잡한 설정보다 공식 예제의 간단한 패턴이 효과적
- 플러그인 옵션 주의: 과도한 옵션이 오히려 동작을 방해할 수 있음
- 공식 예제 참조: solidjs/solid-start 같은 공식 프로젝트가 가장 신뢰할 수 있는
  레퍼런스

**상세 문서**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 9.5 참조

### Phase 9.8: Deprecated @testing-library/preact 정리 ✅

**배경**: Preact에서 Solid.js로 전환 완료 후에도 일부 테스트(11개)가 여전히
`@testing-library/preact`를 사용하여 일관성 문제 발생

**해결 내용**:

- RED: `deprecated-preact-imports.scan.red.test.ts` 작성 (11개 파일 검출)
- GREEN: 11개 테스트 파일에서 `@solidjs/testing-library`로 import 교체
- REFACTOR: `test/utils/vendor-testing-library.ts` 삭제 (미사용 Preact 래퍼)
- 린트 수정: Event, IntersectionObserver, Document 타입 문제 해결

**결과**:

- ✅ 테스트 라이브러리 일관성 확보 (100% Solid.js)
- ✅ 불필요한 Preact 의존성 제거 준비
- ✅ 빌드: Prod 331.79 KB (gzip 88.57 KB) - 변동 없음
- ✅ 모든 테스트 GREEN 유지

**상세 문서**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 9.8 참조

### Phase 9.9: SRC-PATH-RENAME-01 완료 (Legacy 용어 명확성 개선) ✅

**배경**: 백로그 3개 후보(MEDIA-CYCLE-PRUNE-01, 컴포넌트 중첩,
SRC-PATH-RENAME-01) 분석 결과, 2개는 이미 해결되었고 1개(SRC-PATH-RENAME)만 잔여
작업 필요

**해결 내용**:

- 백로그 정리:
  - MEDIA-CYCLE-PRUNE-01: 순환 참조 없음 확인 (dependency-cruiser 0건)
  - 컴포넌트 중첩: Phase 9.3/9.4에서 이미 완료
  - SRC-PATH-RENAME-01: icons/normalizer는 2025-09-16 완료, legacy 주석 명확화만
    남음
- RED: `test/unit/lint/legacy-terminology.clarity.red.test.ts` 작성 (1건 위반
  검출)
- GREEN: `shared/utils/styles/index.ts` 주석 수정
  - "Legacy style utils" → "Style utility functions (combineClasses 등 - 하위
    호환성 유지)"
- REFACTOR: 타입/린트/빌드 검증 통과

**결과**:

- ✅ SRC-PATH-RENAME-01 완료 (모든 항목 처리)
- ✅ 모호한 "legacy" 용어 0건 (기능적 twitter.ts는 의도적 유지)
- ✅ 빌드: Dev 1,031.52 KB (map 1,844.92 KB)
- ✅ 의존성: 249 modules, 701 dependencies (위반 없음)

**다음 Phase 후보**:

1. I18N-MISSING-LITERALS (2건 위반, High)
2. KBD-CENTRALIZATION-MISSING (Medium)

**상세 문서**: `docs/TDD_REFACTORING_PLAN.md` Phase 9.9 참조

### Phase 9.10: I18N-MISSING-LITERALS 완료 (국제화 누락 문자열 수정) ✅

**배경**: i18n-literal.scan.red.test.ts가 2건 위반 검출. HelloSolid (Phase 0
검증용)는 삭제하고 SettingsModal만 국제화 적용

**해결 내용**:

- HelloSolid 제거: Phase 0 검증용 컴포넌트 삭제 (HelloSolid.tsx,
  HelloSolid.module.css)
- LanguageService 확장:
  - `LanguageStrings` 인터페이스에 language 옵션 키 4개 추가 (`languageAuto`,
    `languageKo`, `languageEn`, `languageJa`)
  - 한국어/영어/일본어 3개 언어 리소스에 각각 추가
  - `services/index.ts`에서 `languageService` 인스턴스 export
- SettingsModal 국제화:
  - "Settings", "Close" → `languageService.getString('settings.title|close')`
  - "Theme", "Auto (System)", "Light", "Dark" → `settings.theme*` 키 사용
  - "Language", "Auto (Detect)", "한국어", "English", "日本語" →
    `settings.language*` 키 사용
- GREEN: i18n-literal.scan.red.test.ts PASS (2건 → 0건)

**결과**:

- ✅ i18n 위반: 2건 → 0건 (-100%)
- ✅ HelloSolid 제거 (-2 files)
- ✅ SettingsModal 완전 국제화 (7개 문자열)
- ✅ 빌드: Dev 1,053.56 KB (+21.94 KB vs Phase 9.9)
- ✅ 타입/린트/빌드 검증 통과

**다음 Phase 후보**:

1. KBD-CENTRALIZATION-MISSING (Medium)

**상세 문서**: `docs/TDD_REFACTORING_PLAN.md` Phase 9.10 참조

### Phase 9.11: KBD-CENTRALIZATION-MISSING 완료 (키보드 리스너 중앙화) ✅

**배경**: keyboard-listener.centralization.policy.test가 1건 위반 검출.
VerticalGalleryView가 document.addEventListener('keydown')을 직접 사용

**해결 내용**:

- RED: keyboard-listener.centralization.policy.test 실행 (1건 위반 검출)
  - `VerticalGalleryView.tsx:262`: document.addEventListener('keydown',
    handleKeyDown)
- GREEN: KeyboardNavigator 서비스 사용으로 전환
  - `services/index.ts`에 keyboardNavigator export 추가
  - `VerticalGalleryView.tsx`에서 keyboardNavigator.subscribe() 사용
  - Escape 키 핸들링 중앙화 (context: 'vertical-gallery-view')
  - createEffect의 onCleanup으로 자동 정리
- TEST: keyboard-listener.centralization.policy.test PASS (1건 → 0건)

**결과**:

- ✅ 키보드 리스너 위반: 1건 → 0건 (-100%)
- ✅ 코드 품질: 직접 이벤트 리스너 제거, EventManager 중앙화 완료
- ✅ 빌드: Dev 1,053.53 KB (-0.03 KB, 사실상 동일)
- ✅ 타입/린트/빌드 검증 통과

**다음 Phase 후보**:

1. 백로그 검토 필요 (High/Medium 우선순위 항목 완료)

**상세 문서**: `docs/TDD_REFACTORING_PLAN.md` Phase 9.11 참조

---

## 트러블슈팅 팁id.js 1.9\*\*, 테스트: Vitest 3 + JSDOM

- 타입 경로 별칭(ts/vite): `@`, `@features`, `@shared`, `@assets`
- 코딩 규칙: `docs/CODING_GUIDELINES.md`를 항상 준수 (디자인 토큰, 벤더 getter,
  PC 전용 이벤트, TDD 우선)

설치

```pwsh
npm ci
```

Windows PowerShell에서도 위 명령 그대로 사용 가능합니다.

## 자주 쓰는 스크립트

- 타입 체크: `npm run typecheck`
- 린트(수정 포함): `npm run lint` / `npm run lint:fix`
- 포맷: `npm run format`
- 테스트:
  - 전체: `npm test` (vitest run)
  - 워치: `npm run test:watch`
  - 커버리지: `npm run test:coverage` (사전 단계: `pretest:coverage`가 프로덕션
    빌드를 수행)
  - UI: `npm run test:ui`
- 빌드:
  - 개발: `npm run build:dev`
  - 프로덕션: `npm run build:prod`
  - 전체(클린 포함): `npm run build` → dev와 prod 연속 빌드 후 `postbuild` 검증
    실행
- 종합 검증: `npm run validate` → typecheck + lint:fix + format

의존성 그래프/검증 (dependency-cruiser)

- JSON/그래프/검증 일괄: `npm run deps:all`
- 산출물 위치: `docs/dependency-graph.(json|dot|svg)`

## 테스트 가이드 (Vitest)

- 환경: JSDOM, 기본 URL `https://x.com`, 격리 실행, `test/setup.ts` 자동 로드
- 실행 타임아웃: 테스트 20s, 훅 25s (장시간 I/O 모킹 시 유의)
- 테스트 포함 경로: `test/**/*.{test,spec}.{ts,tsx}`
- 일부 리팩터링 테스트는 임시 제외됨(워크플로 파일 참고)

### 분할 실행(Projects)

대규모 스위트는 Vitest projects로 분할되어 있으며, `vitest.config.ts`의 최상위
`projects` 필드에 정의되어 있습니다. `vitest --project <name>` 필터로 선택
실행할 수 있습니다.

- smoke: 초고속 스모크(구성/토큰 가드)
- fast: 빠른 단위 테스트(RED/벤치/퍼포먼스 제외)
- unit: 단위 전체
- styles: 스타일/토큰/정책 전용
- performance: 성능/벤치 전용
- phases: 단계별(phase-\*)/최종 스위트
- refactor: 리팩토링 진행/가드

실행 방법

```pwsh
# 프로젝트 직접 지정
vitest --project smoke run

# npm 스크립트 단축키 권장
npm run test:smoke
npm run test:fast
npm run test:unit
npm run test:styles
npm run test:perf
npm run test:phases
npm run test:refactor
```

유용한 실행 패턴

```pwsh
# 특정 테스트 이름으로 필터
npm run test -- -t "<test name>"

# 특정 파일만 실행
npx vitest run test/path/to/file.test.ts
```

로컬 푸시 가속(선택):

```pwsh
# Pre-push 훅은 기본으로 'smoke' 프로젝트만 실행합니다. 아래처럼 스코프를 바꿀 수 있습니다.
# PowerShell
$env:XEG_PREPUSH_SCOPE = 'full'   # 전체 스위트 실행 예시
git push

# Bash/Zsh
export XEG_PREPUSH_SCOPE=smoke    # 기본 smoke 유지 예시
git push

# 사용 가능한 값: smoke | fast | unit | styles | performance | phases | refactor | full(all)
# 기본은 smoke 입니다. 전체 스위트를 실행하려면 'full' 또는 'all'을 사용하세요.
```

주의

- 변경 시 반드시 관련 테스트를 추가/수정하세요. 커버리지 리포트는 `coverage/`에
  생성됩니다.
- PC 전용 입력/디자인 토큰/벤더 getter 규칙 위반은 테스트로 RED가 됩니다.

## 빌드/검증 플로우

로컬

```pwsh
# 타입/린트/포맷 일괄
npm run validate

# 개발/프로덕션 빌드 및 산출물 검증
npm run build:dev
npm run build:prod
node ./scripts/validate-build.js
```

CI

- 워크플로: `.github/workflows/ci.yml`
- Node 20/22 매트릭스에서 다음을 수행:
  - typecheck → lint → prettier check → 테스트(20에서는 커버리지)
  - dev/prod 빌드 후 `scripts/validate-build.js`로 산출물 검증
  - 커버리지/빌드 아티팩트 업로드

보안/라이선스

- 워크플로: `.github/workflows/security.yml`
- `npm audit`와 라이선스 보고서 업로드를 자동화

릴리즈

- 워크플로: `.github/workflows/release.yml`
- master로의 버전 변경(또는 수동 트리거) 시 프로덕션 빌드, 산출물 검증, GitHub
  Release 생성
- 릴리즈 산출물: `xcom-enhanced-gallery.user.js`, `checksums.txt`,
  `metadata.json`

## AI 협업/토큰 절약 워크플로 (ModGo 적용)

ModGo 실험에서 확인된 “구조가 좋을수록 동일 지시에서도 토큰 사용이 크게
줄어든다”는 결과를 팀 워크플로에 반영합니다. 세부 작업 지침은
`.github/copilot-instructions.md`의 “토큰/맥락 최적화 가이드”를 참고하세요.

핵심 원칙

- 구조 우선: 기능 작업 전 3계층 경계(Features → Shared → External)와 vendors
  getter 규칙을 먼저 정리합니다.
- 최소 컨텍스트: 요청/PR에는 영향 파일 경로(3–7개), 핵심 타입/시그니처,
  제약(벤더 getter/PC-only/토큰 규칙)만 요약해 제공합니다.
- 최소 diff: 큰 파일 전체 붙여넣기 대신 변경 diff만 제시합니다.
- TDD 실행: 실패 테스트 → 최소 구현 → 리팩토링으로 RED→GREEN 흐름을 짧게
  보고합니다.
- 정책 준수: PC 전용 이벤트만 사용, CSS Modules + 디자인 토큰만 사용, 외부
  라이브러리는 vendors getter 경유.

한 줄 구조 리팩토링 템플릿(프로젝트 맞춤)

- Services/로직: “Refactor <기능> 동작은 Strategy, 생성은 Factory로 분리하고
  구현을 `shared/services/<domain>/**`로 이동. 외부 의존은 `@shared/external/*`
  getter 경유. Vitest 추가/갱신. strict TS/alias 유지.”
- UI/Features: “Split <컴포넌트> into container(pure wiring) and
  presentational(view). 상태는 `shared/state/**` Signals로 이동하고
  `@shared/utils/signalSelector` 사용. PC 전용 이벤트만, CSS Modules + 디자인
  토큰만.”

요청/PR 최소 컨텍스트 패키지

- 파일 경로 목록(3–7개)
- 관련 타입/시그니처(입력/출력/에러 모드) 2–4줄 요약
- 제약 요약: vendors getter, PC-only, 디자인 토큰, TDD
- 수용 기준(3–5줄): 어떤 테스트가 추가/수정되고 무엇이 GREEN이어야 하는지

## PR 규칙

- 제목: `[xcom-enhanced-gallery] <Title>`
- 머지 전 필수: `npm run typecheck` / `npm run lint` / `npm test`
- 스타일/토큰/접근성은 `docs/CODING_GUIDELINES.md`와 테스트 스위트 기준을
  따릅니다.
  - PR 설명에 다음 확인 사항을 포함해 주세요:
    - 최소 컨텍스트 제공(파일 경로/타입/제약/수용 기준)
    - “한 줄 구조 리팩토링”/최소 diff 원칙 적용 여부
    - vendors/Userscript getter 사용, PC 전용 이벤트, 디자인 토큰 준수 여부
    - RED→GREEN 테스트 링크 또는 요약

## 트러블슈팅 팁

- 훅/테스트 타임아웃: 테스트가 느릴 경우 `-t`로 범위를 좁히거나
  네트워크/타이머를 모킹하세요.
- Git hooks 미작동: 최초 설치 후 `npm ci`가 Husky 훅을 준비합니다(로컬 Git이
  필요).
- 경로 별칭 오류: TS/Vite/테스트 설정의 alias가 일치하는지
  확인하세요(`vitest.config.ts`의 `resolve.alias`).

---

추가 세부 가이드는 `docs/` 폴더와 각 스크립트(`scripts/`)를 참고하세요. 변경
시에는 관련 테스트와 문서를 함께 업데이트해 주세요.
