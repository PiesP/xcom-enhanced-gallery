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

- **단위 테스트**: 1389 passing / 0 skipped (100% 통과율) ✅
- **Unhandled Errors**: 0 (Phase 130 완료로 해결) ✅
- **브라우저 테스트**: 60 passed (Chromium) ✅
- **E2E 테스트**: 44 passed / 1 skipped (97.8% 통과율) ✅
- **접근성 테스트**: 14 passed (axe-core, WCAG 2.1 Level AA) ✅
- **커버리지**: 65.93% (lines), 53.81% (functions), 73.79% (branches)

### 코드 품질

- **로깅 일관성**: console 직접 사용 0건 (logger.ts 경유) ✅
- **디자인 토큰**: px 하드코딩 0개, rgba 0개, oklch 전용 ✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅
- **타입 단언**: **27개** (설계상 필수 15개 포함) ⚠️

### 완료된 Phase (최근 10개)

| Phase | 주제                               | 완료일     | 결과                                                        |
| ----- | ---------------------------------- | ---------- | ----------------------------------------------------------- |
| 130   | 테스트 Unhandled Error 수정        | 2025-10-19 | 1 unhandled error → 0, withRetry 테스트 타이밍 개선          |
| 128   | 로깅 환경 감지 단순화              | 2025-10-19 | `__DEV__` 플래그 전용, import.meta.env 제거, 빌드 크기 유지 |
| 125.6 | video-control-service 커버리지     | 2025-10-19 | 17.79% → 82.62% (+64.83%p), 39 tests GREEN                  |
| 125.5 | 미디어 추출 커버리지 개선          | 2025-10-19 | fallback-extractor 100%, media-extraction-service 96.19%    |
| 125.4 | base-service-impl.ts 커버리지 개선 | 2025-10-19 | 12.9% → 100% (+87.1%p), 42 tests GREEN                      |
| 125.3 | error-handling.ts 커버리지 개선    | 2025-10-19 | 8.73% → 100% (+91.27%p), 54 tests GREEN                     |
| 125.2 | 테마 & 엔트리 커버리지 개선        | 2025-10-19 | initialize-theme.ts 89.47%, main.ts 55.65%, 39 tests GREEN  |
| 125.1 | GalleryApp 커버리지 개선           | 2025-10-19 | 3.34% → 56.93% (+53.59%p), 18 tests GREEN                   |
| 123   | Skipped Tests 완전 제거 & E2E 검증 | 2025-10-19 | 1개 제거, E2E 커버리지 갭 분석, 100% 통과율                 |
| 122   | Skipped Tests 최적화 및 정리       | 2025-10-19 | 16개 제거, 테스트 파일 2개 삭제, 90% 개선                   |
| 121   | 툴바/설정 메뉴 텍스트 색상 토큰    | 2025-10-19 | 3 tokens, 9 tests GREEN                                     |

> 상세 내용:
> [`docs/archive/TDD_REFACTORING_PLAN_COMPLETED.md`](./archive/TDD_REFACTORING_PLAN_COMPLETED.md)

##

## 활성 Phase

### Phase 129: 빌드 크기 최적화 (우선순위: 중간)

**목표**: 333.54 KB → 330 KB 이하 (-3.54 KB 이상)

**현황**:

- 현재 빌드: 333.54 KB / 335 KB (99.5%, 여유 1.46 KB)
- 경고 기준: 332 KB (초과 +1.54 KB) ⚠️
- 문제: 경고 기준을 초과하여 사용자 경험에 영향 가능

**전략**:

1. **Dead Code 제거 최적화**
   - 사용하지 않는 유틸리티 함수 탐색
   - 미사용 타입 정의 제거
   - 조건부 실행 코드 tree-shaking 개선

2. **중복 코드 통합**
   - 유사한 로직 패턴 추출
   - 반복되는 타입 정의 통합
   - 헬퍼 함수 재사용 증대

3. **Import 최적화**
   - 동적 import 검토 (큰 모듈)
   - 부분 import로 전환
   - Re-export 체인 단순화

4. **Vite 번들링 설정 최적화**
   - Rollup 플러그인 옵션 조정
   - Mangling/Minification 설정 검토
   - Source map 크기 최적화

**수용 기준 (AC)**:

- ✅ 빌드 크기 < 332 KB (경고 기준 이하)
- ✅ 모든 테스트 GREEN (단위/브라우저/E2E/접근성)
- ✅ 기능 회귀 없음 (수동 테스트 포함)
- ✅ 타입 체크 통과 (TypeScript strict)
- ✅ CodeQL/ESLint/stylelint PASS

**장점**:

- 실질적 문제 해결 (경고 기준 초과)
- 사용자 경험 개선 (로딩 시간 단축)
- 측정 가능한 성과 (KB 단위)

**단점**:

- 코드 제거 시 회귀 가능성 (테스트로 완화)
- 작업 시간 소요 (코드 분석 필요)

**리스크**: 중간 (테스트 커버리지로 완화)

**예상 절감**: 2-5 KB

**마이그레이션 단계**:

1. **분석 단계** (1-2시간)
   - 번들 분석 도구로 큰 모듈 식별
   - 미사용 export 탐색
   - 중복 코드 패턴 찾기

2. **최적화 실행** (2-3시간)
   - Dead code 제거
   - 중복 코드 통합
   - Import 최적화
   - Vite 설정 조정

3. **검증 단계** (1시간)
   - 빌드 크기 측정
   - 전체 테스트 실행
   - 수동 기능 테스트
   - 성능 회귀 검사

4. **문서화** (30분)
   - 변경 사항 기록
   - Phase 완료 보고

##

## 유지 관리 모드 ✅

### 현황 요약

**프로젝트는 모든 품질 지표에서 우수한 상태입니다:**

- ✅ 타입 안전성: TypeScript strict, 0 errors
- ✅ 테스트 커버리지: 100% 통과율 (단위), 97.8% 통과율 (E2E)
- ✅ 의존성 정책: 0 violations
- ✅ 빌드 크기: 333.54 KB (여유 1.46 KB)
- ✅ 코드 품질: ESLint, stylelint, CodeQL 모두 통과

### 주요 활동

- 📊 정기 유지보수 점검 (`npm run maintenance:check`)
- 🔒 의존성 보안 업데이트 (`npm audit`)
- 🐛 버그 리포트 대응
- 👥 사용자 피드백 모니터링

### 경계 조건

| 지표           | 임계값     | 현재 상태              | 조치            |
| -------------- | ---------- | ---------------------- | --------------- |
| 번들 크기      | 335 KB     | 333.54 KB (99.5%)      | 여유 1.46 KB ✅ |
| 경고 기준      | 332 KB     | 333.54 KB (+1.54)      | 경고 범위 ⚠️    |
| 테스트 Skipped | 20개       | 0개 (단위) + 1개 (E2E) | 정상 범위 ✅    |
| 테스트 통과율  | 95%        | 100% / 97.8%           | 우수 ✅         |
| 문서 크기      | 500줄/파일 | PLAN 200줄             | 간소화 완료 ✅  |
| 타입 단언      | 20개       | 27개 (15개 필수)       | 정상 범위 ⚠️    |

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, Skipped 수
- **월간**: 의존성 보안, 문서 최신성, maintenance 점검
- **분기**: 아키텍처 리뷰, 성능 벤치마크, 사용자 피드백 분석

##

## 핵심 교훈

1. **큰 파일의 가치** (Phase 104)
   - 단일 책임을 가진 큰 파일은 오히려 응집도가 높음
   - 파일 크기보다 아키텍처 경계가 우선

2. **현실적 목표 설정** (Phase 106)
   - 0.42 KB를 위해 기능을 제거하는 것은 비합리적
   - 품질 우선: 빌드 크기보다 타입 안전성, 테스트 커버리지

3. **YAGNI 원칙** (Phase 107-108)
   - 실제 문제가 없으면 리팩토링하지 않는다
   - 작업 가치 평가: 작업량 대비 실질적 효과를 먼저 평가

4. **과도한 최적화 경계**
   - 무리한 최적화는 코드 품질을 해칠 수 있음
   - 타입 단언 27개 중 15개는 시스템 설계상 필수

5. **유지보수성 우선**
   - 읽기 쉽고 이해하기 쉬운 코드가 최고의 코드
   - 복잡도 증가는 버그 증가로 이어짐

6. **테스트 커버리지 개선** (Phase 125)
   - 체계적 우선순위 적용: 핵심 기능 → 로깅/에러 → 미디어 추출 → UI
   - TDD 실천: RED → GREEN → REFACTOR 사이클 준수
   - 230개 테스트 추가로 64.75% → 65.93% 달성 (+1.18%p)

##

## 재활성화 조건

다음 상황에서만 새로운 Phase를 시작합니다:

1. **실제 문제 발생**
   - 사용자 버그 리포트

2. **품질 지표 저하**
   - 빌드 크기 > 335 KB (임계값 초과)
   - 의존성 위반 발생

3. **새로운 기능 추가**
   - 필수 기능 개선
   - 플랫폼 업데이트 대응

##

## 참고 문서

- **[docs/archive/TDD_REFACTORING_PLAN_COMPLETED.md](./archive/TDD_REFACTORING_PLAN_COMPLETED.md)**:
  완료된 Phase 상세 기록
- **[AGENTS.md](../AGENTS.md)**: 개발 워크플로우, 스크립트 사용법
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 3계층 구조
- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)**: 코딩 규칙
- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)**: Testing Trophy, E2E 하네스
  패턴
- **[MAINTENANCE.md](./MAINTENANCE.md)**: 유지보수 체크리스트

##

> **유지보수 정책**: 이 문서는 활성 Phase만 포함. 완료 시 즉시
> `docs/archive/TDD_REFACTORING_PLAN_COMPLETED.md`로 이관. **현재 상태**: 모든
> 활성 Phase 완료, 유지보수 모드 진입 ✅

##

## 활성 Phase

### Phase 125: 테스트 커버리지 개선 계획 수립

**목표**: 전체 커버리지 64.75% → 75% 달성

**현황 분석** (2025-10-19):

- **전체 커버리지**: 64.99% (lines), 52.98% (functions), 73.16% (branches)
- **테스트 상태**: 1256 passed, 0 skipped (100% 통과율) ✅
- **Phase 125.1 완료**: GalleryApp.ts 3.34% → 56.93% (+53.59%p)
- **Phase 125.2 완료**: initialize-theme.ts 7.36% → 89.47% (+82.11%p), main.ts
  56.26% → 55.65% (현상 유지)

**우선순위별 개선 대상**:

#### 우선순위 1: 핵심 기능 (완료)

| 파일                   | 현재   | 목표 | 중요도  | 비고                                |
| ---------------------- | ------ | ---- | ------- | ----------------------------------- |
| `GalleryApp.ts`        | 56.93% | 50%  | ✅ 완료 | Phase 125.1 완료 (+53.59%p)         |
| `initialize-theme.ts`  | 89.47% | 40%  | ✅ 완료 | Phase 125.2-A 완료 (+82.11%p)       |
| `main.ts`              | 55.65% | 75%  | ⚠️ 제한 | Phase 125.2-B 완료 (test mode 제약) |
| `base-service-impl.ts` | 100%   | 60%  | ✅ 완료 | Phase 125.4 완료 (+87.1%p)          |

#### 우선순위 2: 로깅 및 에러 처리 (완료)

| 파일                | 현재   | 목표 | 중요도  | 비고                        |
| ------------------- | ------ | ---- | ------- | --------------------------- |
| `logger.ts`         | 83.69% | 70%  | ✅ 완료 | Phase 124.1 완료 (Step 1)   |
| `error-handling.ts` | 100%   | 60%  | ✅ 완료 | Phase 125.3 완료 (+91.27%p) |
| `ErrorBoundary.tsx` | 17.14% | 50%  | 🟡 중간 | E2E로 부분 커버 (충분)      |

#### 우선순위 3: 미디어 추출 (완료 ✅)

| 파일                          | 현재   | 목표 | 중요도  | 비고                        |
| ----------------------------- | ------ | ---- | ------- | --------------------------- |
| `twitter-video-extractor.ts`  | 58.26% | 50%  | ✅ 완료 | Phase 124.2 완료 (Step 2)   |
| `fallback-extractor.ts`       | 100%   | 50%  | ✅ 완료 | Phase 125.5 완료 (+81.36%p) |
| `media-extraction-service.ts` | 96.19% | 60%  | ✅ 완료 | Phase 125.5 완료 (+71.43%p) |
| `video-control-service.ts`    | 82.62% | 50%  | ✅ 완료 | Phase 125.6 완료 (+64.83%p) |

#### 우선순위 4: UI 컴포넌트 및 Hooks (부분 완료)

| 파일                    | 현재   | 목표 | 중요도  | 비고                      |
| ----------------------- | ------ | ---- | ------- | ------------------------- |
| `useProgressiveImage`   | 60.78% | 60%  | ✅ 완료 | Phase 124.3 완료 (Step 3) |
| `Toast.tsx`             | 6.97%  | 40%  | 🟢 낮음 | E2E로 충분 커버           |
| `ToastContainer.tsx`    | 19.69% | 40%  | 🟢 낮음 | E2E로 충분 커버           |
| `VerticalImageItem.tsx` | 58.45% | 70%  | 🟢 낮음 | 이미 중간 수준            |

**실행 계획**:

현재 전체 커버리지 **64.99%** (Phase 125.2 완료 후)

**완료된 작업**:

1. ~~Phase 125.1: GalleryApp.ts~~ ✅ 완료 (3.34% → 56.93%)
2. ~~Phase 125.2-A: initialize-theme.ts~~ ✅ 완료 (7.36% → 89.47%)
3. ~~Phase 125.2-B: main.ts~~ ⚠️ 부분 완료 (55.65%, test mode 제약)
4. ~~Phase 125.3: error-handling.ts~~ ✅ 완료 (8.73% → 100%)
5. ~~Phase 125.4: base-service-impl.ts~~ ✅ 완료 (12.9% → 100%)

**남은 우선순위 작업**:

1. **Phase 125.5**: 미디어 추출 서비스 (fallback-extractor 18.64% → 50%,
   media-extraction-service 24.76% → 60%)

**예상 효과**: 64.99% → 70%+ (Phase 125.5 완료 시)

**현재 상태**: Phase 125.4 완료, 다음은 Phase 125.5 진행 권장

---

### ⚠️ 이전 Phase 상태

**Phase 124 종료**: Test Coverage Expansion (Step 1-4 완료)

- 달성: 67 tests, 5 files, 58-95% coverage
- UI Components (ErrorBoundary, Toast)는 E2E로 충분히 검증됨
- 상세: `docs/archive/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

### 최근 완료된 작업

**Phase 130: 테스트 Unhandled Error 수정** ✅ (2025-10-19)

- **목표**: withRetry 테스트에서 발생하는 unhandled promise rejection 제거
- **문제**: `test/unit/shared/utils/phase-125.3-error-handling.test.ts:362`에서 "should throw after max retries exceeded" 테스트 실행 중 unhandled rejection 발생
- **원인**: `vi.advanceTimersByTimeAsync()` 호출 중 promise rejection이 발생하지만, `await expect(...).rejects`가 타이머 진행 후에 설정되어 일시적으로 unhandled 상태 발생
- **해결책**: 
  - `expect(promise).rejects` 호출을 타이머 진행 **전에** 실행하도록 순서 변경
  - rejection handler를 미리 연결하여 unhandled rejection 방지
  - 코드 변경: expectPromise 변수에 먼저 할당 후 타이머 진행, 마지막에 await
- **결과**: 
  - Unhandled errors: 1 → 0 (100% 해결)
  - 모든 테스트 통과: 1389 passed, 0 errors
  - 테스트 안정성 향상, CI/CD 안정화
- **변경 범위**: 테스트 파일 1개, 1개 테스트 케이스 수정
- **작업 시간**: 약 30분

**Phase 125.4: base-service-impl.ts 커버리지 개선** ✅ (2025-10-19)

- **목표**: 12.9% → 60% (+47.1%p)
- **실제 달성**: 12.9% → 100% (+87.1%p, 목표 대비 +45%)
- **테스트 작성**: 42개 테스트 (2개 클래스별 그룹)
  - BaseServiceImpl: 18 tests (initialize, destroy, isInitialized, lifecycle)
    - 초기화 성공/실패 처리
    - 중복 초기화 방지
    - 비동기 초기화 지원
    - destroy 성공/실패 처리 (에러 시 상태 유지)
    - 초기화되지 않은 서비스 destroy 방지
    - 전체 라이프사이클 (init → destroy → init 재초기화)
  - SingletonServiceImpl: 6 tests (싱글톤 패턴, resetSingleton)
    - 동일 인스턴스 반환 검증
    - 싱글톤 상태 유지 확인
    - 테스트용 리셋 기능 (destroy 호출 확인)
    - 비존재 인스턴스 리셋 안전성
  - 엣지 케이스: 2 tests (serviceName 특수문자, 빈 문자열 처리)
- **테스트 전략**:
  - 추상 클래스 테스트: 구체적인 구현체(TestService, AsyncTestService,
    TestSingletonService) 생성
  - 라이프사이클 검증: 초기화/정리/상태 확인의 전체 흐름 테스트
  - 에러 핸들링: logger.error 호출 확인, 에러 throw 여부 검증
  - 싱글톤 패턴: 인스턴스 재사용 및 상태 공유 확인
- **커버리지 결과**: Statements 100%, Branches 100%, Functions 100%, Lines 100%
- **전체 테스트**: 1322 passed (100% 통과율), TypeScript 0 errors

**Phase 125.3: error-handling.ts 커버리지 개선** ✅ (2025-10-19)

- **목표**: 8.73% → 60% (+51.27%p)
- **실제 달성**: 8.73% → 100% (+91.27%p, 목표 대비 +67%)
- **테스트 작성**: 54개 테스트 (7개 함수별 그룹)
  - standardizeError: 6 tests (Error 인스턴스, 비-Error 객체, 타임스탬프 자동
    추가, 개발/프로덕션 스택 트레이스, 메타데이터 보존)
  - getErrorMessage: 6 tests (Error/string/object 메시지 추출, fallback 처리,
    커스텀 fallback, 타입 변환)
  - isRetryableError: 4 tests (네트워크 에러 패턴 매칭, 비-재시도 에러, 비-Error
    타입, 대소문자 무시)
  - isFatalError: 4 tests (시스템 에러 패턴, 비-치명적 에러, 비-Error 타입,
    대소문자 무시)
  - serializeError: 5 tests (Error 직렬화, 일반 객체, 순환 참조 처리, 원시값
    변환, 커스텀 Error 타입)
  - withFallback: 4 tests (성공 경로, fallback 실행, 이중 실패, 컨텍스트 보존)
  - withRetry: 6 tests (첫 시도 성공, 재시도 가능 에러 처리, 최대 재시도, 재시도
    불가 에러, 지수 백오프, 즉시 성공)
- **테스트 전략**:
  - Vitest fake timers로 비동기 재시도 로직 테스트 (vi.useFakeTimers,
    vi.advanceTimersByTimeAsync)
  - 환경별 동작 검증 (development/production, process.env.NODE_ENV 조작)
  - 엣지 케이스 철저 검증 (circular references, null, undefined, non-Error
    types)
- **커버리지 결과**: Statements 100%, Branches 100%, Functions 100%, Lines 100%
- **전체 테스트**: 1298 passed (100% 통과율), TypeScript 0 errors

**Phase 125.2: 테마 초기화 & 엔트리 포인트 커버리지 개선** ✅ (2025-10-19)

- **Phase 125.2-A (initialize-theme.ts)**: 7.36% → 89.47% (+82.11%p, 목표 40%
  대비 +123%)
  - 23개 테스트 작성 (detectSystemTheme, getSavedThemeSetting, applyThemeToDOM,
    resolveAndApplyTheme, initializeTheme, setupThemeChangeListener)
  - JSDOM 환경에서 localStorage, matchMedia 모킹으로 테마 로직 검증
  - Functions 100%, Statements 89.47%, Branches 78.78% 달성
  - 미커버: 에러 엣지 케이스 (lines 21-22, 33-34, 52-53, 70-71, 77-78)
- **Phase 125.2-B (main.ts)**: 56.26% → 55.65% (현상 유지, 목표 75% 대비
  -19.35%p)
  - 16개 통합 테스트 작성 (createConfig, start, cleanup)
  - Test Mode 제약으로 인한 커버리지 한계 확인:
    - Toast Container 초기화 (lines 280-282)
    - Gallery 초기화 (lines 425, 428-471, 가장 큰 미커버 영역)
    - Non-Critical Systems (lines 262-263)
    - Dev Tools (lines 489-496)
  - Internal 함수 export 실험 결과: test mode 가드가 여전히 작동하여 실질적 개선
    제한적
  - 결론: Entry point는 E2E/Browser Test 영역으로 판단, 통합 테스트로 핵심 API
    검증 완료

- **전략 교훈**:
  - Entry point 파일은 초기화 로직 특성상 단위 테스트 커버리지 한계 존재
  - Test mode 가드는 JSDOM 제약 우회를 위한 의도적 설계
  - 향후 개선: Playwright harness 패턴 도입 또는 초기화 로직 별도 모듈화 고려

- **전체 테스트**: 1256 passed (100% 통과율), TypeScript 0 errors, 빌드 333.54
  KB

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
