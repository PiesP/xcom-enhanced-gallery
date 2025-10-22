# xcom-enhanced-gallery • AGENTS.md

개발자가 빠르게 온보딩하고, 로컬/CI에서 동일한 워크플로로 작업할 수 있도록
정리한 프로젝트 실행 가이드입니다.

## 개발 환경

### 로컬 개발 환경 (Local)

- **운영 체제**: Windows 11 (권장)
- **에디터**: Visual Studio Code (권장)
- **셸/터미널**: Windows PowerShell (pwsh) — 모든 명령어는 PowerShell 기준으로
  작성됩니다
- **패키지 매니저**: npm (단일 패키지)
- **Node.js**: 22 권장 (로컬), CI는 22/24에서 검증
- **번들러**: Vite 7, 프레임워크: Solid.js 1.9.9, 테스트: Vitest 3 + JSDOM
- **타입 경로 별칭(ts/vite)**: `@`, `@features`, `@shared`, `@assets`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md`를 항상 준수 (디자인 토큰, 벤더
  getter, PC 전용 이벤트, TDD 우선)

설치

```pwsh
npm ci
```

Windows PowerShell에서도 위 명령 그대로 사용 가능합니다.

### tsgo 설치 (권장)

프로젝트는 빠른 타입 체크를 위해 `tsgo`를 사용합니다:

```pwsh
# npx로 자동 실행 (package.json에 이미 설정됨)
npm run typecheck

# 직접 설치하려면
npm install -g @typescript/tsgo
```

## 자주 쓰는 스크립트

> 💡 **모든 명령어는 Windows PowerShell 기준입니다.** Linux/macOS를 사용
> 중이라면 문법을 필요에 따라 조정하세요.

- 타입 체크: `npm run typecheck` (tsgo 사용, `src/` 및 구성 파일 대상으로 실행)
- 테스트 타입 체크(WIP): `npm run typecheck:tests` (테스트 디렉터리의 잔여 타입
  오류 추적 용도)
- 린트(수정 포함): `npm run lint` / `npm run lint:fix`
- 포맷: `npm run format`
- 테스트:
  - 전체: `npm test` (vitest run)
  - 워치: `npm run test:watch`
  - 커버리지: `npm run test:coverage` (사전 단계: `pretest:coverage`가 프로덕션
    빌드를 수행)
  - UI: `npm run test:ui`
  - E2E: `npm run e2e:smoke` (Playwright 스모크 테스트, Chromium 브라우저 실행)
- 빌드:
  - 개발: `npm run build:dev`
  - 프로덕션: `npm run build:prod`
  - 전체(클린 포함): `npm run build` → dev와 prod 연속 빌드 후 `postbuild` 검증
    실행
- 종합 검증: `npm run validate` → typecheck + lint:fix + format

의존성 그래프/검증 (dependency-cruiser)

- **빠른 검증**: `npm run deps:json` (JSON만, ~1-2초, 캐싱 지원)
- **DOT 생성**: `npm run deps:dot` (JSON + DOT, ~2-3초)
- **전체 그래프**: `npm run deps:graph` (JSON + DOT + SVG, ~3-8초, Graphviz
  필요)
- **검증 + 전체**: `npm run deps:all` (deps:check + 전체 그래프)
- **강제 재생성**: `--force` 플래그 추가 (PowerShell 예시:
  `node ./scripts/generate-dep-graph.cjs --force`)
- **캐싱**: src/ 디렉터리 변경 시만 재생성 (미변경 시 즉시 스킵)
- **산출물 위치**: `docs/dependency-graph.(json|dot|svg)`
- **시각화**: `docs/dependency-graph-viewer.html` (브라우저에서 확인)

**성능 최적화**:

- 캐시 히트 시 즉시 스킵 (~0.1초)
- JSON만 생성 시 1-2초 (빌드 후 검증에 사용)
- 전체 생성 시 3-8초 (개발 중 필요 시에만)
- Graphviz 미설치 시 placeholder SVG 생성 (CI 실패 방지)

**SVG 렌더링 옵션**:

- 레이아웃 엔진: dot (계층적) > fdp (force-directed) > sfdp (확장 가능)
- 최적화 옵션: 직교 엣지, 겹침 제거, 반응형 뷰포트
- 대화형 뷰어: 줌, 패닝, 다운로드 기능 포함

**주의**: SVG 파일은 Git에서 추적되지 않습니다. 처음 클론 후 또는 src/ 변경 후
`npm run deps:graph`를 실행하여 생성하세요.

## 테스트 전략 개요

**핵심 원칙**: Testing Trophy 모델 기반 - Static Analysis(가장 많음) →
Unit(많음) → Integration(중간) → E2E(적음)

**책임 분리**:

- **Static Analysis**: TypeScript, ESLint, stylelint, CodeQL (타입/린트/보안)
- **Unit Tests** (JSDOM): 순수 함수, 단일 서비스, 컴포넌트 렌더링 (1-2분)
- **Browser Tests** (Vitest + Chromium): Solid.js 반응성, 실제 DOM 동작 (1-2분)
- **Integration Tests** (JSDOM): 다중 서비스 협업, 상태 동기화 (2-5분)
- **E2E Tests** (Playwright): 핵심 사용자 시나리오, 브라우저 전용 API (5-15분)
- **Accessibility Tests** (axe-core): WCAG 2.1 Level AA 자동 검증 (1-3분)

**상세 가이드**: [`docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md) 참고
(JSDOM 제약사항, 선택 기준, 패턴 등)

## 테스트 가이드 (Vitest)

- 환경: JSDOM, 기본 URL `https://x.com`, 격리 실행, `test/setup.ts` 자동 로드
- 실행 타임아웃: 테스트 20s, 훅 25s (장시간 I/O 모킹 시 유의)
- 테스트 포함 경로: `test/**/*.{test,spec}.{ts,tsx}`
- 일부 리팩터링 테스트는 임시 제외됨(워크플로 파일 참고)
- **JSDOM 제약사항**: Solid.js 반응성 제한, CSS 레이아웃 미지원,
  IntersectionObserver 부분 모킹 필요 → E2E 고려

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

# Windows PowerShell에서 환경 변수 설정
$env:XEG_PREPUSH_SCOPE = 'full'   # 전체 스위트 실행
git push

# 또는 한 줄로
$env:XEG_PREPUSH_SCOPE = 'smoke'; git push

# 또는 임시로 설정 후 복원
$originalScope = $env:XEG_PREPUSH_SCOPE
$env:XEG_PREPUSH_SCOPE = 'full'
git push
$env:XEG_PREPUSH_SCOPE = $originalScope
```

사용 가능한 값: `smoke` | `fast` | `unit` | `styles` | `performance` | `phases`
| `refactor` | `full`(all)

- 기본값: `smoke`
- 전체 스위트를 실행하려면 `'full'` 또는 `'all'`을 사용하세요.

주의

- 변경 시 반드시 관련 테스트를 추가/수정하세요. 커버리지 리포트는 `coverage/`에
  생성됩니다.
- PC 전용 입력/디자인 토큰/벤더 getter 규칙 위반은 테스트로 RED가 됩니다.

## E2E 테스트 가이드 (Playwright)

- 환경: Playwright + Chromium, Solid.js 하네스 패턴
- 실행 타임아웃: 테스트 60s
- 테스트 위치: `playwright/smoke/*.spec.ts`

### 실행 방법

```pwsh
# 전체 E2E 스모크 테스트 실행
npm run e2e:smoke

# 특정 테스트만 실행
npx playwright test playwright/smoke/<파일명>.spec.ts

# 헤드풀 모드 (브라우저 UI 표시)
npx playwright test --headed

# 디버그 모드
npx playwright test --debug
```

### 하네스 패턴 (Harness Pattern)

Playwright 테스트는 JSDOM 제약을 우회하기 위해 **실제 브라우저 환경**에서
Solid.js 컴포넌트를 로드하는 하네스 패턴을 사용합니다.

**구조**:

- `playwright/harness/index.ts`: 런타임 API (`window.__XEG_HARNESS__` 노출)
- `playwright/harness/types.d.ts`: 타입 정의
- `playwright/global-setup.ts`: esbuild + babel 파이프라인으로 harness 번들링

**주요 API**:

- `errorBoundaryScenario()`: ErrorBoundary 테스트 시나리오
- `mountToolbar()`: Toolbar 컴포넌트 마운트
- `mountKeyboardOverlay()`: KeyboardHelpOverlay 마운트
- `focusSettingsModal()`: SettingsModal 포커스 테스트
- `setupGalleryApp()`: GalleryApp 초기화 및 이벤트 등록
- `evaluateGalleryEvents()`: PC 전용 이벤트 정책 검증

**JSX 변환**:

- esbuild + babel-preset-solid 파이프라인 사용
- CSS Modules는 Proxy 스텁으로 대체 (`cssModuleStubPlugin`)

**서비스 모킹**:

- `HarnessMediaService`: 미디어 추출 로직 모킹
- `HarnessRenderer`: 렌더링 로직 모킹

### E2E 테스트 작성 가이드

**Solid.js 반응성 제약사항**:

Playwright 브라우저 환경에서 Solid.js의 fine-grained reactivity는 제한적으로
작동합니다. Signal getter를 통한 props 전달이 반응성 추적을 제대로 수립하지
못합니다.

**권장 패턴**:

1. **Remount 패턴**: props 변경 테스트 시 `dispose()` + `mount()` 사용

   ```typescript
   // ❌ 작동하지 않음: reactive props update
   await harness.updateToolbar({ currentIndex: 1 });

   // ✅ 권장: remount 패턴
   await harness.disposeToolbar();
   await harness.mountToolbar({ currentIndex: 1 });
   ```

2. **마운트/언마운트 검증**: 이벤트 기반 상호작용 대신 상태 전환 검증

   ```typescript
   // ❌ 작동하지 않음: Escape key로 모달 닫기
   await page.keyboard.press('Escape');
   await expect(modal).toBeHidden();

   // ✅ 권장: 마운트/언마운트 사이클 검증
   await harness.mountKeyboardOverlay();
   await expect(modal).toBeVisible();
   await harness.disposeKeyboardOverlay();
   await expect(modal).toBeHidden();
   ```

3. **에러 경계 테스트**: 하네스 래퍼에서 예외 처리

   ```typescript
   // 하네스에서 try-catch로 감싸서 에러 전파 방지
   await harness.errorBoundaryScenario();
   // 토스트 생성 여부만 확인
   ```

**주의사항**:

- Playwright 테스트는 실제 브라우저에서 실행되므로, JSDOM 환경과 다를 수
  있습니다.
- Solid.js 반응성은 Playwright 환경에서 JSDOM과 다르게 동작합니다.
- 하네스 API를 수정할 때는 `playwright/harness/types.d.ts`도 함께
  업데이트하세요.
- 환경의 한계를 인정하고 달성 가능한 시나리오로 테스트를 설계하세요.

## 빌드/검증 플로우

로컬 (Windows PowerShell)

```pwsh
# 타입/린트/포맷 일괄
npm run validate

# 개발/프로덕션 빌드 및 산출물 검증 (전체 검증 포함)
npm run build:dev
npm run build:prod
node ./scripts/validate-build.js

# 빌드 전 전체 검증 (prebuild hook)
npm run validate:build  # typecheck + lint + deps + codeql + browser + e2e + a11y

# 유지보수 점검 (작업 종료 시)
npm run maintenance:check
```

> **참고**: 모든 npm 명령어는 Windows PowerShell에서 표준적으로 작동합니다.
> 크로스 플랫폼 지원이 필요한 경우
> [Node.js 공식 문서](https://nodejs.org/en/docs/)를 참고하세요.

CI

- 워크플로: `.github/workflows/ci.yml`
- Node 22 단일 환경에서 다음을 수행:
  - **품질 검증**: typecheck → lint → prettier check
  - **단위 테스트**: JSDOM 기반 (커버리지 포함)
  - **브라우저 테스트**: Vitest + Chromium (2개 샤드로 병렬 실행)
  - **E2E 테스트**: Playwright 스모크 테스트
  - **접근성 테스트**: axe-core WCAG 2.1 Level AA 검증
  - **빌드 검증**: dev/prod 빌드 후 `scripts/validate-build.js`로 산출물 검증
  - 커버리지/빌드/E2E 실패 아티팩트 업로드
- **성능 최적화** (Phase 1.1):
  - Node 24 매트릭스 제거 → 단일 Node 22 환경 (10-15분 절약)
  - 브라우저 테스트 샤딩 (2개 shard) → 병렬 실행 (5분 절약)
  - Playwright 브라우저 캐싱 (30-60초 절약)
  - 예상 총 CI 시간: ~15분 → ~8-10분 (40-50% 단축)

보안/라이선스

- 워크플로: `.github/workflows/security.yml`
- `npm audit`와 라이선스 보고서 업로드를 자동화

CodeQL (로컬 정적 분석)

- 스크립트: `node scripts/check-codeql.js`
- 지원 도구: `gh codeql` (GitHub CLI 확장) 또는 `codeql` (직접 설치 CLI)
- 커스텀 쿼리: `codeql-custom-queries-javascript/*.ql` (8개 정책)
- 성능 최적화 (Phase 85.1):
  - 도구 감지 결과 캐싱 (0.3초 절약)
  - CI 환경에서 즉시 종료 (30-60초 절약)
  - 증분 데이터베이스 업데이트 (2회차 이후 30-40초 절약)
  - 강제 재생성: `CODEQL_FORCE_REBUILD=true node scripts/check-codeql.js`
- 상세 가이드: `codeql-custom-queries-javascript/README.md`

유지보수

- 워크플로: `.github/workflows/maintenance.yml`
- 매월 1일 09:00 UTC 자동 실행 (수동 실행 가능)
- GitHub Issue 자동 생성: `[유지보수] YYYY년 MM월 정기 점검`
- 로컬 실행: `npm run maintenance:check` (작업 종료 시 권장)

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

요청 시 최소 컨텍스트 패키지

- 파일 경로 목록(3–7개)
- 관련 타입/시그니처(입력/출력/에러 모드) 2–4줄 요약
- 제약 요약: vendors getter, PC-only, 디자인 토큰, TDD
- 수용 기준(3–5줄): 어떤 테스트가 추가/수정되고 무엇이 GREEN이어야 하는지

## 커밋 규칙

- 커밋 전 필수: `npm run typecheck` / `npm run lint:fix` / `npm test`
- 스타일/토큰/접근성은 `docs/CODING_GUIDELINES.md`와 테스트 스위트 기준을
  따릅니다.
- AI 협업 시 확인사항:
  - 최소 컨텍스트 제공(파일 경로/타입/제약/수용 기준)
  - "한 줄 구조 리팩토링"/최소 diff 원칙 적용 여부
  - vendors/Userscript getter 사용, PC 전용 이벤트, 디자인 토큰 준수 여부
  - RED→GREEN 테스트 링크 또는 요약

## 트러블슈팅 팁

- 훅/테스트 타임아웃: 테스트가 느릴 경우 `-t`로 범위를 좁히거나
  네트워크/타이머를 모킹하세요.
- Git hooks 미작동: 최초 설치 후 `npm ci`가 Husky 훅을 준비합니다(로컬 Git이
  필요).
- 경로 별칭 오류: TS/Vite/테스트 설정의 alias가 일치하는지
  확인하세요(`vitest.config.ts`의 `resolve.alias`).

## 작업 종료 체크리스트 (AI/개발자 공통)

모든 개발 작업(기능 추가, 리팩토링, 버그 수정 등)을 완료한 후 반드시 실행:

1. **코드 품질 검증**

   ```pwsh
   npm run validate  # typecheck + lint:fix + format
   npm test          # 전체 테스트 실행
   ```

2. **빌드 검증**

   ```pwsh
   npm run build     # dev + prod 빌드 및 validate-build.js 자동 실행
   ```

3. **유지보수 점검** ⭐ 필수

   ```pwsh
   npm run maintenance:check
   ```

   **AI는 반드시 출력 결과를 사용자에게 보고:**
   - ✅ 정상 항목 (보안, Git 상태 등)
   - ⚠️ 조치 필요 항목 (백업 디렉터리, 큰 문서, 빌드 크기 초과 등)
   - 💡 권장 조치 (발견된 항목에 대한 제거 명령 등)

4. **커밋 준비**
   - 모든 검증이 통과하면 커밋 권장
   - 조치 필요 항목이 있으면 사용자에게 먼저 확인 요청

**중요**: 대규모 작업(여러 파일 변경, 새 기능 추가) 후에는 반드시 maintenance
점검을 실행하여 임시 파일이나 불필요한 백업이 남아있지 않은지 확인하세요.

---

## 참고 문서 및 가이드

> 📚 **[문서 통합 가이드](docs/DOCUMENTATION.md)**: 모든 문서를 한눈에 보려면
> 여기를 참고하세요
>
> 💡
> **[개발 원칙 및 코드 품질 기준](.github/copilot-instructions.md#개발-원칙-및-코드-품질-기준)**:
> 에러 핸들링, 보안, 성능, 신뢰성, 디버깅, 지속적 개선 등 상세 가이드는
> copilot-instructions.md 참고

### 핵심 개발 가이드

- **[CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md)**: 코딩 규칙, 디자인 토큰,
  PC 전용 이벤트, 벤더 getter 규칙
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: 3계층 구조 (Features → Shared →
  External), 의존성 규칙
- **[DEPENDENCY-GOVERNANCE.md](docs/DEPENDENCY-GOVERNANCE.md)**: 의존성 관리
  정책, dependency-cruiser 규칙
- **[TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)**: Testing Trophy, JSDOM
  제약사항, E2E 하네스 패턴

### TDD 및 리팩토링

- **[TDD_REFACTORING_PLAN.md](docs/TDD_REFACTORING_PLAN.md)**: 활성 리팩토링
  계획, Phase 추적
- **[SOLID_REACTIVITY_LESSONS.md](docs/SOLID_REACTIVITY_LESSONS.md)**: Solid.js
  반응성 시스템 핵심 교훈 (Phase 80.1 경험 기반)

### 운영 및 유지보수

- **[MAINTENANCE.md](docs/MAINTENANCE.md)**: 유지보수 체크리스트, 정기 점검 항목

### 스크립트 및 도구

- **scripts/maintenance-check.js**: 프로젝트 건강 상태 점검 (백업 파일, 큰 문서,
  Git 상태)
- **scripts/validate-build.js**: 빌드 산출물 검증 (크기, 무결성, 메타데이터)
- **scripts/generate-dep-graph.cjs**: 의존성 그래프 생성 (GraphViz)
- **scripts/check-codeql.js**: CodeQL SARIF 결과 검증

---

## 📂 문서 및 스크립트 관리 규칙

### 문서 디렉터리 구조

```
docs/
  ├── *.md              # 핵심 가이드 문서 (Git 추적)
  ├── archive/          # 완료된 Phase 등 (Git 무시, 로컬 보관)
  └── temp/             # 작업 중인 초안 (Git 무시)
```

### 스크립트 디렉터리 구조

```
scripts/
  ├── *.js              # 항구적 스크립트 (Git 추적)
  └── temp/             # 임시 실험 스크립트 (Git 무시)
```

### 사용 지침

- **초안 작성**: `docs/temp/` 또는 `scripts/temp/`에서 시작
- **확정**: `docs/` 또는 `scripts/` 루트로 이동 (Git 추적 시작)
- **완료**: Phase 완료 시 `docs/archive/`로 이동 (Git 추적 종료)

상세 가이드: [MAINTENANCE.md](docs/MAINTENANCE.md) "문서 및 스크립트 관리 정책"
섹션

---

추가 세부 가이드는 `docs/` 폴더와 각 스크립트(`scripts/`)를 참고하세요. 변경
시에는 관련 테스트와 문서를 함께 업데이트해 주세요.
