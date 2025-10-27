# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-27 | **상태**: Phase 207 완료 ✅

## 📊 현황 요약

| 항목          | 상태              | 비고                          |
| ------------- | ----------------- | ----------------------------- |
| 빌드          | ✅ 안정           | 병렬화 + 메모리 최적화 완료   |
| 성능          | ✅ 14.7% 향상     | 병렬 실행으로 7.3초 단축      |
| 테스트        | ✅ 82/82 E2E      | 모두 통과 (5 skipped)         |
| 접근성 테스트 | ✅ 33/33 통과     | 3개 파일 통합 완료            |
| 타입/린트     | ✅ 0 errors       | 모두 통과                     |
| 의존성        | ✅ 0 violations   | 정책 준수                     |
| 로컬 빌드     | ✅ 최적화         | 순차 49.5초 → 병렬 42.2초     |
| 번들 크기     | ✅ 341 KB         | 목표 ≤345 KB (4 KB 여유)      |
| 상태          | ✅ Phase 207 완료 | Global Setup 현대화 및 최적화 |

---

## 🎯 활성 작업

**현재 활성 작업 없음**

모든 Phase가 완료되었습니다. 다음 리팩토링 작업이 필요한 경우 이 섹션에
추가하세요.

---

## ✅ 최근 완료

### Phase 206 ✅ (2025-10-27) - Playwright Smoke 테스트 통합 및 최적화

**목표**: `playwright/smoke` 디렉터리 테스트 파일 통합 및 현대화

**완료 항목**:

1. **JSDoc 문서화** ✅
   - 역할 및 책임: E2E 테스트 하네스 빌드 파이프라인
   - 처리 흐름: JSX 변환 → 번들링 → IIFE 생성
   - 의존성: esbuild, @babel/core, babel-preset-solid
   - 산출물: `.cache/harness.js` (window.\_\_XEG_HARNESS\_\_ 노출)

2. **타입 안정성 개선** ✅
   - `types/babel-preset-solid.d.ts` 생성 (untyped 패키지 선언)
   - `@ts-expect-error` 제거 (동적 import로 대체)
   - TypeScript strict mode 통과

3. **에러 핸들링 추가** ✅
   - Babel 변환: try-catch로 JSX 변환 실패 감지
   - 빌드 함수: top-level try-catch로 예외 전파
   - 상세 에러 메시지: 스택 트레이스 및 컨텍스트 정보

4. **CI/Verbose 로깅** ✅
   - 환경 감지: `process.env.CI` 및 `process.env.VERBOSE`
   - 조건부 출력: CI/verbose 환경에서만 상세 로그
   - 빌드 산출물 경로 명시

5. **검증** ✅
   - E2E 스모크 테스트: 82/82 통과 (5 skipped)
   - 타입 체크: 0 errors
   - 린트: 0 warnings
   - 빌드 파이프라인: 정상 작동

**효과**:

- 타입 안정성 향상 (@ts-expect-error 제거)
- 디버깅 용이성 개선 (상세 에러 로깅)
- CI 환경 최적화 (환경별 로그 레벨)
- 코드 가독성 향상 (명확한 JSDoc)

**세부사항**:

- `types/babel-preset-solid.d.ts`:
  - babel-preset-solid 모듈 선언 (unknown 타입)
  - TypeScript 컴파일러가 untyped 패키지 인식
- `playwright/global-setup.ts`:
  - 37줄 → 125줄 (JSDoc, 에러 핸들링, 로깅 추가)
  - 동적 import로 babel-preset-solid 로드
  - 환경별 로그 레벨 자동 조정

---

### Phase 206 ✅ (2025-10-27) - Playwright 스모크 테스트 통합 및 최신화

**목표**: playwright/smoke 디렉터리의 중복 테스트 통합 및 논리적 그룹화

**완료 항목**:

1. **파일 통합** ✅
   - Phase 특화 파일 정리:
     - phase-145-3-loading-timing-e2e.spec.ts 제거 (SKIP 상태, 네트워크 테스트)
     - phase-b3-5-e2e-performance.spec.ts → performance.spec.ts 리네임
   - Keyboard 테스트 통합 (5개 → 2개):
     - keyboard-navigation.spec.ts + keyboard-video.spec.ts → keyboard.spec.ts
       (통합)
     - keyboard-interaction.spec.ts (성능 테스트만 유지)
   - Gallery 테스트 통합 (2개 → 1개):
     - gallery-app.spec.ts + gallery-events.spec.ts → gallery.spec.ts
   - Scroll Chaining 테스트 통합 (2개 → 1개):
     - scroll-chaining-boundary.spec.ts + scroll-chaining-keyboard.spec.ts →
       scroll-chaining.spec.ts

2. **파일 수 감소** ✅
   - 통합 전: 23개 파일
   - 통합 후: 18개 파일 (21.7% 감소)
   - 제거된 파일: 5개

3. **현대화 및 문서화** ✅
   - 각 통합 파일에 명확한 JSDoc 추가
   - "Consolidated from" 섹션으로 원본 파일 명시
   - 테스트 범위 및 목적 명확화
   - kebab-case 명명 규칙 준수

4. **검증** ✅
   - E2E 스모크 테스트: 82/82 통과 (5 skipped)
   - 타입 체크: 0 errors
   - 린트: 0 warnings
   - 테스트 실행 시간: ~19.7초 (안정적)

**효과**:

- 파일 수 21.7% 감소 (23개 → 18개)
- 관련 테스트 논리적 그룹화로 유지보수성 향상
- 중복 setup/teardown 로직 제거
- 명확한 테스트 범위 문서화

**세부사항**:

- 통합 파일:
  - `keyboard.spec.ts`: 네비게이션(ArrowLeft/Right, Home/End, Escape) + 비디오
    제어(Space, M)
  - `keyboard-interaction.spec.ts`: 성능 테스트 (렌더링 < 50ms, 메모리 < 10MB)
  - `gallery.spec.ts`: 초기화, 이벤트 정책, 열기/닫기 플로우
  - `scroll-chaining.spec.ts`: Wheel 경계 + Keyboard 네비게이션 차단
  - `performance.spec.ts`: Phase B3.5 성능 측정 (프레임율, 메모리, 네트워크)

- Toolbar 파일 (6개) 유지:
  - toolbar.spec.ts, toolbar-headless.spec.ts, toolbar-initial-display.spec.ts
  - toolbar-settings.spec.ts, toolbar-settings-panel-e2e.spec.ts,
    toolbar-settings-migration.spec.ts
  - 각각 명확한 Phase와 기능 목적이 있어 유지

---

### Phase 205 ✅ (2025-10-27) - Playwright Harness 코드 정리 및 최적화

**목표**: playwright/accessibility 테스트 스위트 리팩토링 및 간소화

**완료 항목**:

1. **다이얼로그/포커스 테스트 통합** ✅
   - modal-a11y.spec.ts (7 tests) → 제거
   - settings-a11y.spec.ts (6 tests) → 제거
   - focus-management-a11y.spec.ts (7 tests) → 제거
   - dialog-focus-a11y.spec.ts (19 tests) → 신규 생성 (통합)

2. **기존 테스트 현대화** ✅
   - gallery-a11y.spec.ts: 중복 에러 로깅 제거, 간결화
   - toolbar-a11y.spec.ts: 불필요한 주석 제거, 일관성 개선
   - toast-a11y.spec.ts: 중복 코드 제거, 정리
   - keyboard-overlay-a11y.spec.ts: await 최적화, 간결화

3. **문서 업데이트** ✅
   - README.md 전면 개편
   - 파일 구조 및 테스트 수 반영 (7개 → 5개 파일, 34개 → 33개 테스트)
   - 각 스위트별 상세 설명 추가
   - 현재 제한사항 및 향후 계획 추가

4. **검증** ✅
   - 접근성 테스트: 33/33 통과 (5.6초)
   - E2E 스모크: 94/94 통과
   - 브라우저 테스트: 111/111 통과
   - 빌드: 340.54 KB (제한 내)

**효과**:

- 파일 수 29% 감소 (7개 → 5개)
- 중복 패턴 제거로 유지보수성 향상
- 문서 품질 개선 (현실적 제한사항 명시)
- 모든 테스트 통과 유지 (33/33)

**통합 세부사항**:

`dialog-focus-a11y.spec.ts` 구조:

- Basic Dialog (3 tests): role, aria-modal, 닫기 버튼
- Focus Trap (4 tests): Tab 순환, Escape, inert 처리
- Settings Dialog (5 tests): 폼 컨트롤, 키보드 탐색, 색상 대비
- Focus Indicators (7 tests): 포커스 인디케이터, Skip link, 순서, 숨김 요소

---

### Phase 200 ✅ (2025-10-27) - 프로젝트 문서 정리 및 표준화

**목표**: 프로젝트 문서의 일관성 향상 및 마크다운 린트 오류 해결

**완료 항목**:

1. **마크다운 HR 스타일 통일** ✅
   - 모든 문서의 `------` 를 `------` 로 통일 (markdownlint MD035 규칙 준수)
   - 영향 문서: ACCESSIBILITY_CHECKLIST.md, ARCHITECTURE.md, CODE_QUALITY.md 등
     7개

2. **빌드 검증** ✅
   - E2E 테스트: 94/94 통과
   - 접근성 테스트: 34/34 통과
   - 빌드 크기: 340.54 KB (345 KB 제한 내)
   - 타입/린트: 0 errors

**효과**:

- 마크다운 린트 정책 준수
- 문서 일관성 향상
- 모든 품질 검증 통과 유지

---

### Phase 199 ✅ (2025-10-27) - Settings 드롭다운 클릭 동작 복구

**주제**: 설정 패널에서 드롭다운 메뉴 클릭 시 선택 가능한 옵션이 표시되지 않는
이슈 해결 (근본 원인 수정)

#### 문제 분석

**로그 분석 결과**:

- 로그 파일: x.com-1761535653226.log (510줄)
- 03:27:24.553부터 SELECT 요소의 pointerdown 이벤트가 반복적으로 차단됨
- PC-only 정책이 SELECT 요소의 pointer 이벤트를 차단하여 브라우저 네이티브
  드롭다운 동작 방해

**근본 원인**:

- blockTouchAndPointerEvents() 함수가 모든 pointer 이벤트를 일괄 차단
- SELECT, INPUT, TEXTAREA, BUTTON, OPTION 등 form 요소는 브라우저 네이티브
  동작을 위해 pointer 이벤트 필요
- 결과: 드롭다운 클릭 시 브라우저가 옵션 목록을 표시하지 못함

**솔루션 검토**:

1. ❌ pointer-events: none 조건부 적용 - CSS만으로는 이벤트 리스너 우회 불가
2. ❌ 클래스 토글로 이벤트 비활성화 - 타이밍 복잡도 증가, 상태 동기화 문제
3. ✅ form 요소에 대한 pointer 이벤트 예외 처리 - 최소 변경, 명확한 의도

#### 해결책 적용

**1. PC-only 정책 수정** ✅

- 파일: src/shared/utils/events.ts
- blockTouchAndPointerEvents() 함수 개선:
  - Touch 이벤트: 모든 요소에서 strict 차단 (PC-only 정책 준수)
  - Pointer 이벤트: form 요소에서만 허용
  - 일반 요소: pointer 이벤트도 차단
- Phase 199 설명 주석 추가

**2. 테스트 추가** ✅

- 파일: test/unit/shared/utils/events-coverage.test.ts
- events.ts - PC-only Policy (Phase 199) 테스트 스위트 추가
  - Pointer event blocking: DIV/SPAN 등 일반 요소에서 차단 검증
  - Form element exception: SELECT/INPUT/TEXTAREA/BUTTON/OPTION에서 허용 검증
  - Touch event strict: form 요소를 포함한 모든 요소에서 touch 차단 검증

#### 최종 결과

✅ 테스트 결과:

- 단위 테스트: events-coverage.test.ts 110/110 PASSED
- E2E 스모크 테스트: 94/94 PASSED
- 접근성 테스트: 34/34 PASSED
- 빌드: ✅ 340.54 KB (< 345 KB 제한)
- 코드 품질: typecheck/lint/deps ✅

✅ 기능 검증:

- 드롭다운 클릭 시 브라우저 네이티브 옵션 목록 표시 ✅
- 각 옵션 선택 가능 ✅
- 테마/언어 설정 변경 정상 작동 ✅
- PC-only 정책 유지: touch 이벤트 모든 요소 차단 ✅

---

## ✅ 최근 완료

### Phase 198 ✅ (2025-10-27) - Settings 드롭다운 옵션 표시 문제 해결 (CSS 레이어)

**완료 항목**: ✅ appearance:none 제거, 브라우저 네이티브 드롭다운 사용, E2E
94/94 통과

**상세**: docs/TDD_REFACTORING_PLAN_COMPLETED.md

**참고**: Phase 199에서 근본 원인(PC-only 정책) 해결

---

### Phase 197 ✅ (2025-10-27) - E2E 테스트 안정화

**완료 항목**: ✅ Playwright 스모크 테스트 2개 수정, E2E 94/94 통과

**상세**: docs/TDD_REFACTORING_PLAN_COMPLETED.md

---

## 📚 참고 문서

- **완료 기록**: docs/TDD_REFACTORING_PLAN_COMPLETED.md
- **아키텍처**: docs/ARCHITECTURE.md
- **코딩 규칙**: docs/CODING_GUIDELINES.md
- **테스트 전략**: docs/TESTING_STRATEGY.md
- **유지보수**: docs/MAINTENANCE.md
