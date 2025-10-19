# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-19 | **상태**: 유지보수 모드 (모든 활성 Phase 완료)
> ✅

## 프로젝트 현황

### 빌드 및 품질 지표

- **빌드**: 333.54 KB / 335 KB (99.5%, 여유 1.46 KB) ✅
- **경고 기준**: 332 KB (경고 기준 초과 +1.54 KB) ⚠️
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings, Markdown 0 errors ✅
- **CSS 린트**: stylelint 0 warnings ✅
- **CodeQL**: 5/5 쿼리 통과 ✅
- **의존성**: 0 violations (273 modules, 755 dependencies) ✅

### 테스트 현황

- **단위 테스트**: 1130 passing / 0 skipped (100% 통과율) ✅
- **E2E 테스트**: 44 passed / 1 skipped (97.8% 통과율) ✅
- **커버리지**: v8로 통일 완료, 45% 기준선 설정 ✅

### 코드 품질

- **로깅 일관성**: console 직접 사용 0건 (logger.ts 경유) ✅
- **디자인 토큰**: px 하드코딩 0개, rgba 0개, oklch 전용 ✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅
- **타입 단언**: **27개** (설계상 필수 15개 포함) ⚠️

### 완료된 Phase (최근 10개)

| Phase | 주제                               | 완료일     | 결과                                        |
| ----- | ---------------------------------- | ---------- | ------------------------------------------- |
| 123   | Skipped Tests 완전 제거 & E2E 검증 | 2025-10-19 | 1개 제거, E2E 커버리지 갭 분석, 100% 통과율 |
| 122   | Skipped Tests 최적화 및 정리       | 2025-10-19 | 16개 제거, 테스트 파일 2개 삭제, 90% 개선   |
| 121   | 툴바/설정 메뉴 텍스트 색상 토큰    | 2025-10-19 | 3 tokens, 9 tests GREEN                     |
| 119   | Gallery 디자인 단일화              | 2025-10-19 | 토큰 재사용 · 스타일 테스트                 |
| 118   | SettingsControls 언어 실시간 반영  | 2025-10-19 | 8 tests, Solid.js 반응성 완료               |
| 117   | Language 설정 실시간 적용 & 저장   | 2025-10-19 | 8 tests, 영속성 확보, 동기화                |
| 116   | Settings 드롭다운 라벨 문자 정리   | 2025-10-19 | 장식 제거 · 라벨 텍스트 검증                |
| 100   | 타입 단언 전수 조사                | 2025-10-17 | 31개 분석, 우선순위 결정                    |
| 101   | 즉시 제거 7개                      | 2025-10-17 | 타입 단언 7개 제거 (31→24)                  |
| 102   | 검토 후 제거 가능 타입 단언 10개   | 2025-10-18 | 실제 2개 제거 (24→27)                       |

> 상세 내용:
> [`TDD_REFACTORING_PLAN_COMPLETED.md`](./archive/TDD_REFACTORING_PLAN_COMPLETED.md)

##

## 활성 Phase

### 진행 중 Phase

**Phase 124: Test Coverage Expansion - Critical Infrastructure & UI** 🔄
(2025-01-19)

**목표**: 테스트 커버리지 64.17% → 70%+ 달성, Critical Services 60%+, UI
Components 50%+

**현재 커버리지 분석**:

- **Overall**: 64.17% statements, 73.48% branches, 50.71% functions
- **Critical 0% Coverage**: logger.ts (337 lines), useProgressiveImage.ts (299
  lines)
- **Low Coverage (<20%)**: GalleryApp 3%, ErrorBoundary 17%, Toast 7-20%, media
  extraction 7-50%
- **High Coverage (90-100%)**: Gallery components, Settings, i18n (유지)

**우선순위 1: Critical Services** (0-20% → 60%+)

1. **logger.ts** (0% → 80%) - 15 tests
   - 로그 레벨 필터링 테스트
   - 포맷팅 함수 테스트
   - 출력 채널 테스트
   - 성능 최적화 검증

1. **twitter-token-extractor.ts** (10% → 70%) - 12 tests
   - 토큰 추출 로직 테스트
   - 에러 핸들링 테스트
   - 캐싱 로직 테스트

1. **useProgressiveImage.ts** (0% → 60%) - 10 tests
   - IntersectionObserver 모킹
   - 로딩 상태 전환 테스트
   - 에러 처리 테스트

**우선순위 2: UI Components** (0-20% → 50%+)

1. **ErrorBoundary.tsx** (17% → 80%) - 6 tests
   - 에러 캐치 및 표시
   - 재시도 로직
   - 폴백 UI 렌더링

2. **Toast.tsx + ToastContainer.tsx** (7-19% → 70%) - 12 tests
   - 토스트 생성/제거
   - 애니메이션 라이프사이클
   - 타입별 렌더링

3. **GalleryApp.ts** (3% → 50%) - 15 tests
   - 초기화 테스트
   - 상태 전환 테스트
   - 정리 로직 테스트

**우선순위 3: Medium Coverage** (20-44% → 60%+)

1. **base-service-impl.ts** (12% → 60%) - 8 tests
2. **toast-controller.ts** (32% → 65%) - 10 tests
3. **initialize-theme.ts** (7% → 60%) - 8 tests
4. **media-mapping-service.ts** (0% → 70%) - 6 tests

**예상 일정**: 18-26시간 (약 3-4일)

**상세 계획**: `docs/temp/phase-124-coverage-expansion-plan.md` 참조

**다음 단계**: Step 1 - logger.ts 테스트 작성 (RED → GREEN → REFACTOR)

### 최근 완료된 작업

**Phase 121: 툴바/설정 메뉴 텍스트 색상 토큰 완성** ✅ (2025-10-19)

- 누락된 3개 xeg 텍스트 토큰 추가: `--xeg-color-text-muted`,
  `--xeg-color-text-inverse`, `--xeg-color-text-tertiary`
- `design-tokens.css`에서 semantic 토큰을 xeg 접두사로 re-export하여 프로젝트
  네이밍 일관성 유지
- 신규 테스트 9개 (token definitions, light/dark themes, inversion) 모두 GREEN
- TDD 방식으로 RED→GREEN 달성, 빌드 검증 통과 (333.54 KB, 경고 기준 초과 +1.54
  KB)

**Phase 120: 언어 모듈 리패키징 & 버전 가드** ✅ (2025-10-19)

- 번역 문자열 정의를 `src/shared/i18n`으로 분리하고 `language-service`는
  레지스트리 의존으로 단순화
- `module-versions.ts`와 `module.autoupdate.js`로 번역 모듈 버전 관리 자동화, 키
  누락 가드 추가
- 신규 Vitest(`language-module-registry.test.ts`)로 번역 레지스트리/버전 맵
  일관성 검증
- Phase 117 회귀 테스트 및 lint/typecheck 모두 GREEN 유지

**Phase 119: Gallery 디자인 단일화** ✅ (2025-10-19)

- Gallery 및 Vertical view CSS에서 블루 계열 OKLCH 값을 제거하고 시맨틱/컴포넌트
  토큰으로 통일
- `design-tokens.semantic.css`에 라이트/다크 변형 및 고대비 토큰을 보강하여
  `token-definition-guard` GREEN 유지
- `theme-responsiveness`, `token-definition-guard`, `gallery-design-uniformity`
  테스트를 통해 모노톤 정책 회귀 방지

**Phase 118: SettingsControls 언어 변경 실시간 반영** ✅ (2025-10-19)

- 언어 설정 변경 시 SettingsControls 컴포넌트의 UI 텍스트가 즉시 반영되지 않는
  문제 해결
- `createSignal` + `createEffect` + `createMemo` 패턴으로 Solid.js 반응성 구현
- `languageService.onLanguageChange` 이벤트를 구독하여 언어 변경 시 자동으로 UI
  업데이트
- 신규 테스트 8개 (unit + fast 환경)로 Solid.js 반응성 패턴 검증 (GREEN)
- 메모리 누수 방지를 위해 `onCleanup`으로 이벤트 리스너 정리
- 빌드 검증: 330.70 KB (임계값 332 KB 이내), 모든 테스트 통과

**Phase 117: Language 설정 실시간 적용 & 저장** ✅ (2025-10-19)

- 사용자 언어 선택이 즉시 UI에 반영되고 재접속 시에도 복원되도록 LanguageService
  개선
- 저장소 어댑터 통합으로 영속성 확보, 중복 저장 방지
- Toolbar settings 컨트롤과 동기화하여 외부 변경에도 즉시 업데이트
- 신규 테스트 8개로 저장/복원/리스너 알림/동기화 검증 완료 (GREEN)
- Solid.js 반응성 테스트 패턴 확립 (microtask 대기)

**Phase 116: Settings 드롭다운 라벨 문자 정리** ✅ (2025-10-19)

- 사용자 피드백을 반영해 SettingsControls 라벨에서 `/` 및 `▾` 장식 문자를
  제거하고 순수 텍스트만 노출하도록 JSX 구조를 단순화
- 관련 CSS 모듈에서 인디케이터 전용 클래스 삭제로 불필요한 스타일 정리 및
  compact 모드 영향 점검
- 신규 테스트
  `test/unit/shared/components/ui/phase-116-settings-dropdown-text-only.test.tsx`로
  장식 span 유무와 라벨 텍스트 일치 여부를 검증 (GREEN)

**Phase 113: Settings compact 라벨 & Focus Ring 단일톤** ✅ (2025-10-19)

- compact 모드에서도 라벨을 시각적으로 노출하도록 `SettingsControls` 구조 개선
- `design-tokens.css` / semantic/component 토큰에서 focus alias를 gray 기반으로
  재정의
- 테스트: `settings-controls.compact-labels.test.tsx`(2) ·
  `phase-113-focus-ring-alias.test.ts`(4) → 6 GREEN
- 실제 툴바 설정 패널에서 포커스 테두리 회색, 라벨 가시성 확인

**Phase 112: Settings 드롭다운 흑백 통일 검증** ✅ (2025-10-19)

- 사용자 보고에 따른 검증 작업
- 9개 테스트 추가: 모두 GREEN (Phase 109에서 이미 완료된 상태 확인)
- 결과: hover/focus 상태가 이미 gray 기반, 라벨 가시성 정상
- 상세: `docs/archive/TDD_REFACTORING_PLAN_COMPLETED.md` 참고

**Phase 111.1: Toast 색상 토큰 흑백 통일** ✅ (2025-10-18)

- 8개 Toast 색상 토큰 + 2개 shadow → gray 기반 통일
- TDD: 11/11 tests PASSED (155ms)
- 빌드: 328.83 KB (-1.59 KB)
- 상세: `docs/archive/TDD_REFACTORING_PLAN_COMPLETED.md` 참고

### 보류된 Phase

**Phase 111.2: 다른 색상 토큰 검토** (보류)

**검토 대상**: `--color-primary`, `--color-success/error/warning/info`,
`--xeg-color-primary`

1. 실제 사용처 확인 필요 (grep 검색으로 범위 파악)
1. 접근성 영향 평가 필요 (WCAG 2.1 준수 확인)
1. 사용자 경험 평가 필요 (색상이 필수적인 컨텍스트인지 판단)
1. 브랜드 정체성 고려 필요 (Twitter blue가 플랫폼 연관성에 중요한지)

**재개 조건**: 사용자 피드백 수집, 사용 패턴 분석, 대체 UX 전략 수립 완료

##

## 유지 관리 모드 ✅

### 현황 요약

**프로젝트는 모든 품질 지표에서 우수한 상태입니다:**

- ✅ 타입 안전성: TypeScript strict, 0 errors
- ✅ 테스트 커버리지: 99.1% 통과율 (단위), 96.6% 통과율 (E2E)
- ✅ 의존성 정책: 0 violations
- ✅ 빌드 크기: 경고 기준 이하 (332 KB 기준, 328.88 KB)
- ✅ 코드 품질: ESLint, stylelint, CodeQL 모두 통과

### 주요 활동

- 📊 정기 유지보수 점검 (`npm run maintenance:check`)
- 🔒 의존성 보안 업데이트 (`npm audit`)
- 🐛 버그 리포트 대응
- 👥 사용자 피드백 모니터링

### 경계 조건

| 지표           | 임계값     | 현재 상태               | 조치            |
| -------------- | ---------- | ----------------------- | --------------- |
| 번들 크기      | 335 KB     | 328.88 KB (98.1%)       | 여유 6.12 KB ✅ |
| 경고 기준      | 332 KB     | 328.88 KB               | 정상 범위 ✅    |
| 테스트 Skipped | 20개       | 10개 (단위) + 1개 (E2E) | 정상 범위 ✅    |
| 테스트 통과율  | 95%        | 99.1% / 96.6%           | 우수 ✅         |
| 문서 크기      | 500줄/파일 | PLAN 100줄              | 간소화 완료 ✅  |
| 타입 단언      | 20개       | 27개 (15개 필수)        | 정상 범위 ⚠️    |

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, Skipped 수
- **월간**: 의존성 보안, 문서 최신성, maintenance 점검
- **분기**: 아키텍처 리뷰, 성능 벤치마크, 사용자 피드백 분석

##

## 핵심 교훈 (Phase 104-108)

1. **큰 파일의 가치** (Phase 104)
   - 단일 책임을 가진 큰 파일은 오히려 응집도가 높음
   - 파일 크기보다 아키텍처 경계가 우선

1. **현실적 목표 설정** (Phase 106)
   - 0.42 KB를 위해 기능을 제거하는 것은 비합리적
   - 품질 우선: 빌드 크기보다 타입 안전성, 테스트 커버리지

1. **YAGNI 원칙** (Phase 107-108)
   - 실제 문제가 없으면 리팩토링하지 않는다
   - 작업 가치 평가: 작업량 대비 실질적 효과를 먼저 평가

1. **과도한 최적화 경계**
   - 무리한 최적화는 코드 품질을 해칠 수 있음
   - 타입 단언 27개 중 15개는 시스템 설계상 필수

1. **유지보수성 우선**
   - 읽기 쉽고 이해하기 쉬운 코드가 최고의 코드
   - 복잡도 증가는 버그 증가로 이어짐

##

## 재활성화 조건

다음 상황에서만 새로운 Phase를 시작합니다:

1. **실제 문제 발생**
   - 사용자 버그 리포트

1. **품질 지표 저하**
   - 빌드 크기 > 333 KB (경고 기준 1 KB 초과)
   - 의존성 위반 발생

1. **새로운 기능 추가**
   - 필수 기능 개선
   - 플랫폼 업데이트 대응

##

## 참고 문서

- **[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)**:
  완료된 Phase 상세 기록
- **[AGENTS.md](../AGENTS.md)**: 개발 워크플로우, 스크립트 사용법
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 3계층 구조
- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)**: 코딩 규칙
- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)**: Testing Trophy, E2E 하네스
  패턴
- **[MAINTENANCE.md](./MAINTENANCE.md)**: 유지보수 체크리스트

##

> **유지보수 정책**: 이 문서는 활성 Phase만 포함. 완료 시 즉시
> `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관. **현재 상태**: 모든 활성 Phase
> 완료, 유지보수 모드 진입 ✅
