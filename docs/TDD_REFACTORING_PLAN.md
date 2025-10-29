# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-29 | **상태**: Phase 243 완료 ✅ |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## 🔄 현재 진행 중인 작업

현재 진행 중인 작업이 없습니다.

## ✅ 최근 완료 작업 (간략)

### Phase 243: 포인터 이벤트 정책 로직 간결화 및 재발 방지 강화 (2025-10-29)

- 목표: Phase 242 완료 후 코드 가독성 향상 및 재발 방지 조치 강화
- 조치:
  - `FORM_CONTROL_SELECTORS` 상수 추출로 중복 제거
  - `isFormControlElement()` 명시적 함수로 폼 컨트롤 판별 로직 분리
  - `getPointerEventPolicy()` 정책 결정 로직을 명확한 3단계로 정리
    (allow/block/log)
  - CODING_GUIDELINES.md에 포인터 정책 및 재발 방지 전략 문서화
  - test/global-teardown.ts를 Git 추적 추가
- 결과: 빌드 성공 (342.44 KB), 전체 테스트 통과 (Browser 111/111, E2E 82/82)
- 효과: 정책 로직 명확화로 유지보수성 향상, 문서화로 향후 유사 이슈 예방

### Phase 242: 설정 드롭다운 포인터 정책 조정 (2025-10-29)

- 원인: PC-only 포인터 차단 로직이 `select` 폼 컨트롤의 기본 동작을 막고,
  Document 타깃을 `isGalleryInternalElement`에 전달해 경고 발생
- 조치: `isGalleryInternalElement`에 `HTMLElement` 가드 추가,
  `blockTouchAndPointerEvents`가 마우스 기반 폼 컨트롤을 통과시키도록 조정,
  포인터 정책 회귀 테스트 추가
- 결과: Vitest 포인터 정책 스위트 13/13 통과(dual project), 로그 경고 제거 확인,
  설정 드롭다운 정상 동작
- 회귀 없음: 갤러리 내부 일반 요소는 계속 차단되며, PC-only 정책/디자인 토큰
  규칙 유지

### Phase 241: event.target 타입 가드 강화 (2025-10-29)

- 원인: `event.target`을 `HTMLElement`로 강제 캐스팅하여 `Document` 객체 전달 시
  `matches is not a function` 경고 발생
- 조치: 기존 `isHTMLElement` 타입 가드 활용 (Phase 135에서 이미 구현)
  - `isGalleryInternalEvent` (utils.ts, core-utils.ts)
  - `handleMediaClick`, `detectMediaFromEvent` (events.ts)
- 결과: 테스트 13/13 통과, E2E 82/82 통과, 번들 342.08 KB
- 효과: 타입 안전성 향상, 경고 제거, 코드 가독성 개선

### Phase 240: 설정 드롭다운 클릭 시 펼치기 문제 수정 (2025-10-29)

- 원인: `.toolbarWrapper * { pointer-events: inherit; }`로 인해 hover 해제 시
  패널 내부까지 비상호작용 상태가 되는 CSS 상속 문제
- 조치: `VerticalGalleryView.module.css`에 확장 상태 전용 오버라이드 추가
  - `[data-gallery-element='settings-panel'][data-expanded='true'] { pointer-events: auto; }`
  - `.toolbarWrapper:has([data-gallery-element='settings-panel'][data-expanded='true'])`에서
    툴바 가시성/포인터 이벤트 유지
- 결과: E2E 스모크 82/82 통과, 브라우저 테스트 통과, dev/prod 빌드 성공
- 회귀 없음: outside-click, Escape 닫기, PC-only 정책/디자인 토큰 규칙 준수 확인

### Phase 239: 문서 정리 (2025-10-29)

- **목적**: 중복 문서 제거 및 docs/temp/ 정리
- **변경사항**:
  - CODE_QUALITY.md 삭제 (AGENTS.md와 중복)
  - DOCUMENTATION.md 업데이트 (CODE_QUALITY.md 참조 제거)
  - docs/temp/ 정리:
    - PHASE_210_ANALYSIS.md 삭제 (빈 파일)
    - phase-227-\*.md 파일들 archive로 이동
- **효과**: 문서 중복 제거, 유지보수 부담 감소
- 상세: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)

### Phase 238: 린터 ignore 설정 개선 (2025-10-29)

- **목적**: 임시/생성/아카이브 파일을 모든 린터에서 일관성 있게 제외
- **변경사항**:
  - ESLint: codeql-reports/**, codeql-results/**, docs/temp/**, docs/archive/**,
    scripts/temp/\*\* 추가
  - Stylelint: test-results/**, codeql-reports/**, codeql-results/**,
    docs/temp/**, docs/archive/**, scripts/temp/** 추가
  - Prettier: test-results/, codeql-reports/, codeql-results/, docs/temp/,
    docs/archive/, scripts/temp/ 추가
  - Markdownlint: codeql-results/, docs/temp/, docs/archive/, scripts/temp/\*\*
    추가
- **효과**: 린터가 불필요한 파일을 검사하지 않아 성능 개선 및 false positive
  방지
- 번들 크기 유지: 341.78 KB
- 상세: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)

### Phase 237: 서비스 등록 require 제거 및 타입 가드 강화 (2025-10-29)

- **문제**: 브라우저 환경에서 `require is not defined` 오류로 ThemeService,
  LanguageService 등록 실패
- **해결**: `registerCoreBaseServices`에서 require를 static import로 변경
- **타입 안전성 향상**: `isGalleryInternalElement`에 `element.matches` 함수 존재
  여부 체크 추가
- **테스트**: Phase 237 회귀 방지 테스트 9개 추가 (모두 통과)
- 번들 크기 유지: 341.78 KB
- 상세: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)

### Phase 236: DOMContentLoaded 리스너 제거 - 유저스크립트 격리 완성 (2025-10-29)

- DOMContentLoaded 리스너 제거 (@run-at document-idle 보장 활용)
- main.ts 단순화 (즉시 startApplication 호출)
- cleanup 로직 정리 (불필요한 리스너 제거 코드 삭제)
- 트위터 네이티브 페이지 간섭 최소화 완료
- 번들 크기 유지: 339.05 KB (변화 없음)
- 상세: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)

### Phase 235: Toast 알림을 GalleryRenderer 내부로 격리 (2025-10-29)

- main.ts에서 Toast 관련 코드 제거 (함수, 변수, import)
- GalleryRenderer에 Toast 컨테이너 통합 (renderToastContainer, cleanupContainer)
- 유저스크립트는 이벤트 위임만 담당, Toast는 갤러리 내부에서만 동작
- 번들 크기 유지: 339.19 KB (변화 없음)
- 상세: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)

### Phase 234: TESTING_STRATEGY.md 간소화 (2025-10-29)

- TESTING_STRATEGY.md 517줄 → 271줄 (48% 감소)
- 테이블 형태로 재구성, 핵심 정보 접근성 향상
- 상세 내용은 참조 링크로 대체 (AGENTS.md, test/README.md 등)
- 상세: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)

### Phase 233: 문서 간소화 및 정리 (2025-10-29)

- 3개 문서 4667줄 → 444줄 (90% 감소)
- 개발자 온보딩 시간 대폭 단축, 유지보수 부담 감소
- 상세: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)

### Phase 232: CodeQL 보안 경고 해결 (2025-10-29)

- 6개 보안 이슈 해결: URL 검증(3), Prototype Pollution(1), 빌드 안전성(2)

### Phase 229-231 (2025-10-28)

- Phase 231: Phase 199 중단 흔적 제거
- Phase 230: BaseService 초기화 실패 수정 (ThemeService export)
- Phase 229: PC-only 정책 부작용 수정 (텍스트 선택 복원)

### Phase 228.1: 이벤트 캡처 최적화 (2025-10-28)

- 미디어 컨테이너 fast-path 체크로 비미디어 클릭 10-20ms 개선

**이전 Phase**:
[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) 참고

---

## ⏸️ 보류된 작업

### Phase 228.2-228.5: 트위터 페이지 간섭 최소화

**보류 이유**: Phase 228.1 완료로 주요 간섭 해결, ROI 재평가 필요

**재평가 조건**: 사용자 피드백 수집 + Phase 228.1/229 효과 측정

---

## 🎯 다음 작업 후보

1. **Phase 228.2-228.5 재평가** (보류 해제 필요)
2. **성능 프로파일링** (bundlesize 모니터링, 번들 분석)
3. **접근성 개선** (ARIA 속성 강화, 키보드 네비게이션 개선)

---

## 📊 프로젝트 현황

| 항목          | 상태          | 비고                        |
| ------------- | ------------- | --------------------------- |
| 빌드          | ✅ 안정       | 병렬화 + 메모리 최적화 완료 |
| 테스트        | ✅ 82/82 통과 | E2E 스모크 테스트 포함      |
| 접근성        | ✅ 통과       | WCAG 2.1 Level AA 달성      |
| 타입/린트     | ✅ 0 errors   | 모두 통과                   |
| 의존성        | ✅ 0 위반     | 3계층 구조 강제             |
| 번들 크기     | ✅ 340 KB     | 목표 ≤420 KB (여유 80 KB)   |
| 보안 (CodeQL) | ✅ 0 경고     | Phase 232 완료              |

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **유지보수**: [MAINTENANCE.md](./MAINTENANCE.md)
