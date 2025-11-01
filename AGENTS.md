# xcom-enhanced-gallery • AGENTS.md

개발자가 빠르게 온보딩하고, 로컬/CI에서 동일한 워크플로로 작업할 수 있도록
정리한 프로젝트 실행 가이드입니다.

---

## 📊 최소 저장소 구조 (Minimal Repository Structure)

> **1인 개발 + AI 협업** 최적화. 원격 저장소는 **배포 필수 파일만**, 개발 도구는
> **로컬에서만**.

### 원격 저장소 추적 파일 (Git Tracked)

```text
✅ src/              # 소스 코드
✅ types/            # 타입 정의
✅ .github/          # GitHub Actions
✅ LICENSES/         # 의존성 라이선스
✅ package.json, package-lock.json, .npmrc
✅ tsconfig.json, tsconfig.base.json, vite.config.ts
✅ README.md, LICENSE, .gitignore
```

### 로컬만 처리 (Git Ignored)

```text
❌ docs/, test/, playwright/  # 개발 문서, 테스트
❌ scripts/, config/local/    # 개발 스크립트, 로컬 설정
❌ AGENTS.md, CLAUDE.md      # 개발 가이드
❌ coverage/, .cache/, *.log  # 생성물, 캐시, 로그
```

**상세 가이드**:
[REPOSITORY_STRUCTURE_IMPLEMENTATION_PLAN.md](docs/REPOSITORY_STRUCTURE_IMPLEMENTATION_PLAN.md)
**참고**: `.gitignore.minimal` (추천 최소 구조용 참조)

---

## 🎯 프로젝트 구조: 로컬 vs. 원격 저장소 (화이트리스트 방식)

### 📋 핵심 원칙

- **원격 저장소 역할**: 소스 코드 + 빌드된 배포 스크립트 + CI/CD 설정만
- **로컬 처리**: 모든 캐시, 테스트 결과, 개발 설정, 임시 파일
- **`.gitignore`**: 화이트리스트 방식 (모든 것 무시 → 필요한 것만 추적)

### 원격 리포지토리에 포함 (Git Tracked) ✅

**소스 코드**

- `src/` - 애플리케이션 소스
- `types/` - TypeScript 타입 정의
- `test/` - 단위/통합 테스트
- `playwright/` - E2E/접근성 테스트

**필수 빌드 설정**

- `tsconfig.base.json`, `tsconfig.json`, `tsconfig.tests.json`
- `vite.config.ts`, `vitest.config.ts`
- `eslint.config.js`, `postcss.config.js`, `playwright.config.ts`

**패키지 관리**

- `package.json`, `package-lock.json`
- `.npmrc` (글로벌 설정)

**문서 및 가이드**

- `README.md`, `LICENSE`, `CHANGELOG.md`
- `AGENTS.md`, `CLAUDE.md`
- `docs/` - 모든 가이드 문서

**배포 및 CI/CD**

- `dist/*.user.js` - 빌드된 배포 스크립트만 (중간산출물 제외)
- `.github/` - GitHub Actions 워크플로우
- `release/RELEASE_NOTES.md` - 릴리스 노트

**라이선스 및 설정**

- `LICENSES/` - 의존성 라이선스
- `config/utils/` - 로컬 오버라이드 헬퍼
- `config/local/README.md` - 로컬 설정 템플릿
- `scripts/` - 공용 검증/빌드 스크립트

### 로컬 개발 환경에만 (Git Ignored) ❌

**개발 설정 (개발자별 다름)**

- `*.local.ts`, `*.local.js`, `*.local.json` - 개발자 오버라이드
- `.env.local`, `.env.*.local` - 환경 변수
- `config/local/*` - 로컬 설정 (README.md 제외)

**빌드 및 테스트 캐시 (로컬만)**

- `.eslintcache`, `.prettiercache`, `.tscache`, `.vitest-cache`
- `.dependency-cruiser-cache`, `.stylelintcache`, `.markdownlintcache`
- `coverage/`, `test-results/`, `playwright-report/`
- `dist-ssr/`, `build/`, `.vite/`, `.cache/`

**로컬 보안 및 임시 파일**

- `*.pem`, `*.p12`, `secret.key`, `ssl/`, `certs/`
- `temp/`, `tmp/`, `backup*/`, `*.backup`
- `logs/`, `*.log`, `*.cpuprofile`

**IDE 및 OS**

- `.vscode/`, `.idea/`, `.husky/`
- `.DS_Store`, `Thumbs.db`

**자세한 가이드**: [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md)

---

## 개발 환경

### 로컬 개발 환경 (Local)

- **운영 체제**: Debian/Linux (권장)
- **에디터**: Visual Studio Code (권장)
- **셸/터미널**: Bash — 명령은 Bash 기준으로 표기되지만, 실행 스크립트는 모두
  Node.js(JS)로 통일되었습니다
- **패키지 매니저**: npm (단일 패키지)
- **Node.js**: 22 권장 (로컬), CI는 22/24에서 검증
- **번들러**: Vite 7, 프레임워크: Solid.js 1.9.9, 테스트: Vitest 3 + JSDOM
- **타입 경로 별칭(ts/vite)**: `@`, `@features`, `@shared`, `@assets`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md`를 항상 준수 (디자인 토큰, 벤더
  getter, PC 전용 이벤트, TDD 우선)

설치

```bash
npm ci
```

### 스크립트 통일 정책 (Node.js)

- 모든 `scripts/` 내 실행 스크립트는 JS(Node) 기반입니다. OS 의존적 명령은
  사용하지 않습니다.
- OS/도구 사전 점검(preflight)을 통과하지 못하는 경우, 스크립트는 친절한
  메시지와 함께 "건너뜀" 처리(exit 0)합니다.
- 전체 테스트 러너: `npm run test:full` → `node ./scripts/run-all-tests.js`
- 예: CodeQL 로컬 실행 미설치/미로그인 시 가이드 출력 후 스킵, Graphviz 미설치
  시 의존성 그래프 SVG를 placeholder로 대체

### tsgo 설치 (권장)

프로젝트는 빠른 타입 체크를 위해 `tsgo`를 사용합니다:

```bash
# npx로 자동 실행 (package.json에 이미 설정됨)
npm run typecheck

# 직접 설치하려면
npm install -g @typescript/tsgo
```

### CodeQL 설정 및 사용 (로컬 + CI)

프로젝트는 **GitHub 공식 CodeQL** 분석을 사용합니다:

**목적**: 보안 취약점 정적 분석 (XSS, 코드 인젝션, Prototype pollution 등)

**실행 환경**:

1. **CI (필수)**: GitHub Actions에서 `github/codeql-action` 자동 실행
2. **로컬 (선택)**: `scripts/check-codeql.js`로 빠른 피드백 (CI와 동일한
   security-extended 쿼리)

**책임 분리**:

- ✅ **CI**: 전체 보안 검증 (PR 차단, Security 탭 결과 표시)
- 💡 **로컬**: 빠른 피드백 (선택사항, validate 스크립트는 CodeQL 없이도 통과)

#### 로컬 환경 설정 (선택사항, 자동 설치 지원)

로컬에서 CodeQL을 사용하려면 다음 중 하나를 설치하세요:

**우선순위 1: GitHub CLI + CodeQL 확장 (권장, 자동 설치)**

```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y gh

# GitHub에 로그인 (한 번만)
gh auth login

# CodeQL 확장 설치 (수동 또는 스크립트가 자동 시도)
gh extension install github/gh-codeql

# 설치 확인
gh codeql version
```

**💡 자동 설치 기능**: GitHub CLI (`gh`)만 설치하면 `npm run codeql:check` 실행
시 스크립트가 자동으로 CodeQL 확장 설치를 시도합니다.

**우선순위 2: CodeQL CLI 직접 설치 (대안)**

```bash
# 최신 버전 다운로드
# https://github.com/github/codeql-cli-binaries/releases에서 확인

# Linux x64 예시
wget https://github.com/github/codeql-cli-binaries/releases/download/v2.18.0/codeql-linux64.zip
unzip codeql-linux64.zip
sudo mv codeql /usr/local/bin/

# 확인
codeql version
```

**도구 우선순위**:

1. `gh codeql` (GitHub CLI 확장) - 최우선
2. `gh` (GitHub CLI) → 자동으로 CodeQL 확장 설치 시도
3. `codeql` (직접 설치 CLI) - 폴백

#### 로컬 사용법 (고급 옵션)

```bash
# 기본 실행
npm run codeql:check

# JSON 형식 출력 (CI/도구 통합용)
npm run codeql:check -- --json

# 마크다운 리포트 생성 (codeql-reports/ 디렉터리)
npm run codeql:check -- --report

# 데이터베이스 강제 재생성
npm run codeql:check -- --force

# 상세 디버깅 정보 표시
npm run codeql:check -- --verbose

# 최소 출력 (결과만 표시)
npm run codeql:check -- --quiet

# 옵션 조합 예시
npm run codeql:check -- --json --report --verbose
```

**스크립트 옵션**:

- `--json`: JSON 형식으로 결과 출력 (CI 아티팩트용)
- `--report`: 마크다운 리포트 생성 (codeql-reports/ 저장)
- `--force`: CODEQL_FORCE_REBUILD=true와 동일 (DB 재생성)
- `--quiet`: 최소한의 출력만 표시
- `--verbose`: 상세 디버깅 정보 출력
- `--help`: 도움말 표시

**결과 위치**:

- SARIF 결과: `codeql-results/` (GitHub Actions 업로드)
- 마크다운 리포트: `codeql-reports/` (로컬 검토용)
- JSON 리포트: stdout (--json 옵션)

**JavaScript 쿼리 팩 자동 다운로드**:

최초 실행 시 스크립트가 자동으로 `codeql/javascript-queries` 팩을
다운로드합니다. 수동 다운로드가 필요한 경우:

```bash
gh codeql pack download codeql/javascript-queries
```

#### CI 환경 (GitHub Actions)

`.github/workflows/ci.yml`에서 자동 실행 (모든 PR/커밋):

**CodeQL Analysis** (GitHub Advanced Security):

- 공식 `github/codeql-action/init@v3` 사용
- `queries: +security-extended` 설정 (확장 보안 쿼리 스위트)
- JavaScript/TypeScript 자동 분석
- 결과는 GitHub Security tab에 표시 (Code scanning alerts)

**쿼리 스위트**:

- `security-extended`: 표준 보안 쿼리 + 확장 규칙 (XSS, 인젝션, prototype
  pollution 등)
- CI와 로컬이 동일한 쿼리 사용 (일관성 보장)

**CI 결과 확인**:

- GitHub 저장소 → Security tab → Code scanning alerts
- 또는 PR의 Security 체크 항목

#### 추천 워크플로우

**개발 중**:

```bash
# 기본 검증 (CodeQL 없이도 통과)
npm run validate

# CodeQL 설치했으면 추가 보안 체크 (선택)
npm run codeql:check
```

**커밋 전**:

```bash
# 전체 검증 (선택사항)
npm run validate:build  # 타입, 린트, 의존성, 테스트, E2E, 접근성

# 또는 최종 검증
npm run build
```

**참고**:

- 로컬 CodeQL은 **선택사항** (없어도 CI에서 자동 실행)
- CI는 GitHub Advanced Security 공식 분석 실행
- CI 실패 시 PR이 차단되므로 보안 이슈를 조기에 발견 가능

## 자주 쓰는 스크립트

- 타입 체크: `npm run typecheck` (tsgo 사용, `src/` 및 구성 파일 대상으로 실행)
- 테스트 타입 체크(WIP): `npm run typecheck:tests` (테스트 디렉터리의 잔여 타입
  오류 추적 용도)
- 린트(수정 포함): `npm run lint` / `npm run lint:fix`
- 포맷: `npm run format`
- 테스트:
  - 전체: `npm test` (vitest run + 자동 워커 정리)
  - 워치: `npm run test:watch`
  - 커버리지: `npm run test:coverage` (사전 단계: `pretest:coverage`가 프로덕션
    빌드를 수행 + 자동 워커 정리)
  - UI: `npm run test:ui`
  - E2E: `npm run e2e:smoke` (Playwright 스모크 테스트, Chromium 브라우저 실행)
  - 워커 정리: `npm run test:cleanup` (Vitest 워커 프로세스 자동 종료, 실패
    시에도 진행)
- 빌드:
  - 빠른 빌드: `npm run build:only` → dev와 prod 빌드만 수행 (검증 없음, 빠른
    개발용)
  - 전체 빌드: `npm run build` → build:only + validate-build.ts + e2e:smoke
    (CI/CD용)
  - 개발: `npm run build:dev` (dev 모드만)
  - 프로덕션: `npm run build:prod` (prod 모드만)
- 종합 검증: `npm run validate` → typecheck + lint:fix + format

의존성 그래프/검증 (dependency-cruiser)

- **빠른 검증**: `npm run deps:json` (JSON만, ~1-2초, 캐싱 지원)
- **DOT 생성**: `npm run deps:dot` (JSON + DOT, ~2-3초)
- **전체 그래프**: `npm run deps:graph` (JSON + DOT + SVG, ~3-8초, Graphviz
  필요)
- **검증 + 전체**: `npm run deps:all` (deps:check + 전체 그래프)
- **강제 재생성**: `--force` 플래그 추가

  ```bash
  node ./scripts/generate-dep-graph.js --force
  ```

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

- **Static Analysis**: TypeScript, ESLint, stylelint (타입/린트)
- **Security Analysis**: CodeQL (보안 취약점 - XSS, 인젝션, prototype pollution)
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

### Vitest 워커 자동 정리 (Phase 241)

**자동 정리 메커니즘** (2중 안전장치):

1. **Vitest globalTeardown** (`test/global-teardown.ts`)
   - 모든 Vitest 실행 종료 시 자동 실행
   - 정상 종료 시 워커 프로세스 자동 정리
   - 비정상 종료 시 작동하지 않을 수 있음

2. **npm 스크립트 후처리**
   - 모든 주요 테스트 스크립트에 `npm run test:cleanup` 자동 추가
   - 성공 시: `&& npm run test:cleanup`
   - 실패 시: `|| (npm run test:cleanup && exit 1)`
   - 보장: 성공/실패 상관없이 항상 워커 정리

**적용 범위**:

- `test:all`, `test:coverage`, `test:smoke`, `test:unit`, `test:styles`,
  `test:perf`, `test:phases`, `test:refactor`, `test:browser`

**수동 정리** (필요 시):

```bash
npm run test:cleanup
# 또는
node ./scripts/cleanup-vitest-workers.js
```

**이유**: 잔여 워커로 인한 메모리/파일 핸들/포트 점유 방지, 다음 실행 안정화

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

```bash
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

```bash
# 특정 테스트 이름으로 필터
npm run test -- -t "<test name>"

# 특정 파일만 실행
npx vitest run test/path/to/file.test.ts
```

## Git Hooks (Husky + pre-commit/pre-push)

프로젝트는 Husky v9를 사용하여 자동 검증 훅을 제공합니다:

**구조**:

- `.husky/pre-commit`: 스테이징된 파일에 린트/포매팅 적용
- `.husky/pre-push`: 타입 체크 + 테스트 (선택적 범위)
- ✨ **Husky v9 현대적 패턴**: `husky.sh` 제거, shebang만 사용

### Pre-commit Hook

**역할**: 스테이징된 파일에 린트/포매팅 적용

```bash
# 커밋 전 자동 실행 (git commit 시)
# - lint-staged로 스테이징된 파일만 검증
# - CI 환경에서는 스킵
```

**CI 제외 이유**: 전체 검증은 GitHub Actions에서 실행되므로, 로컬에서는 신속한
피드백에 집중합니다.

### Pre-push Hook

**역할**: 타입 체크 + 테스트 (선택적 범위)

```bash
# 기본 실행 (smoke 프로젝트, ~20-30초)
git push

# 범위 변경 - 환경 변수 우선
export XEG_PREPUSH_SCOPE='full'
git push

# 범위 변경 - git config 저장 (설정 유지)
git config xeg.prepushScope fast
git push  # 이후 모든 push에서 fast 프로젝트 실행

# git config 확인/해제
git config --get xeg.prepushScope         # 확인
git config --unset xeg.prepushScope       # 해제 (기본값 복구)
```

**범위 선택 가이드**:

| 범위         | 용도                 | 시간    |
| ------------ | -------------------- | ------- |
| `smoke`      | 기본값, 빠른 검증    | 20-30초 |
| `fast`       | 주요 단위 테스트     | 30-60초 |
| `unit`       | 전체 단위 테스트     | 1-2분   |
| `full`/`all` | 모든 검증 (권장: PR) | 5-10분  |

**우선순위** (환경 변수 > git config > 기본값):

```bash
# 1️⃣  환경 변수 (일회성, 가장 높음)
export XEG_PREPUSH_SCOPE='full' && git push

# 2️⃣  git config (저장됨, 중간)
git config xeg.prepushScope fast

# 3️⃣  기본값 smoke (변경 없음, 가장 낮음)
git push
```

**CI 제외 이유**: GitHub Actions에서 모든 검증(E2E, a11y 포함)을 자동
실행하므로, 로컬 훅은 신속한 피드백에만 집중합니다.

## E2E 테스트 가이드 (Playwright)

- 환경: Playwright + Chromium, Solid.js 하네스 패턴
- 실행 타임아웃: 테스트 60s
- 테스트 위치: `playwright/smoke/*.spec.ts`

### 실행 방법

```bash
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

### 📍 책임 분리 (2025-11-01)

**모든 검증·테스트는 로컬에서만 실행** → **CI는 빌드·배포만 담당**

| 작업                 | 로컬                           | CI                     |
| -------------------- | ------------------------------ | ---------------------- |
| 타입 체크            | ✅ (npm run typecheck)         | ❌                     |
| 린트/포맷            | ✅ (npm run lint/format)       | ❌                     |
| 보안 분석 (CodeQL)   | ✅ 선택 (npm run codeql:check) | ❌                     |
| 단위 테스트          | ✅ (npm test)                  | ❌                     |
| 브라우저 테스트      | ✅ (npm run test:browser)      | ❌                     |
| E2E 테스트           | ✅ (npm run e2e:smoke)         | ❌                     |
| 접근성 테스트        | ✅ (npm run e2e:a11y)          | ❌                     |
| **빌드 (dev/prod)**  | ✅                             | **✅ (ci.yml만 담당)** |
| **빌드 산출물 검증** | ✅                             | **✅**                 |
| **릴리즈 생성**      | ✅                             | **✅ (release.yml)**   |

### 로컬 워크플로우

```bash
# 1️⃣ 개발 중: 빠른 검증
npm run validate              # typecheck + lint + format
npm run test:smoke           # 빠른 스모크 테스트

# 2️⃣ 커밋 전: Pre-push Hook (자동 실행)
git push                      # typecheck + test:smoke (기본)
export XEG_PREPUSH_SCOPE=full && git push  # 전체 테스트 (선택)

# 3️⃣ 작업 종료 시: 전체 검증 (권장)
npm run validate              # typecheck + lint + format
npm test && npm run test:cleanup       # 전체 테스트 + 정리
npm run e2e:smoke            # E2E 스모크
npm run maintenance:check     # 임시 파일/구조 점검

# 4️⃣ 빌드 (수동)
npm run build:dev            # 개발 모드
npm run build:prod           # 프로덕션 모드
npm run build                # 전체 (빌드 + 산출물 검증)
```

### Pre-push Hook (자동 검증)

커밋 푸시 시 **자동으로** 다음을 실행:

```bash
# 기본 (scope: smoke) - ~30초
npm run typecheck
npm run test:smoke

# 범위 변경 예시
export XEG_PREPUSH_SCOPE=full && git push  # 전체 테스트 (5-10분)
git config xeg.prepushScope fast && git push  # fast 프로젝트 (1분)
```

**범위 옵션**:

- `smoke` (기본): 빠른 스모크 테스트
- `fast`: 주요 단위 테스트
- `unit`: 전체 단위 테스트
- `full`/`all`: 모든 검증 + 테스트 + E2E

### CI 워크플로우 (로컬 검증 후 자동 실행)

**전제 조건**: pre-push hook을 통과한 코드만 master에 도달

- 워크플로: `.github/workflows/ci.yml`
- **책임**: 프로덕션 빌드만 수행
- 단일 Job: `build`
  - Node 22 환경
  - 프로덕션 빌드: `npx vite build --mode production`
  - 아티팩트 업로드 (성공 시)
- **예상 CI 시간**: ~2-3분 (프로덕션 빌드만)

**워크플로우 결과 확인** (선택사항):

```bash
# 최근 워크플로우 실행 목록 확인
gh run list --limit 10

# 특정 실행 상태 확인
gh run view <RUN_ID> --log

# 최근 빌드 파이프라인 상태만 확인
gh run list --limit 5 | grep "Build Pipeline"
```

### Release 워크플로우

- 워크플로: `.github/workflows/release.yml`
- **책임**: 릴리즈 산출물 생성
- 버전 변경 감지 또는 수동 트리거 시:
  - 개발 빌드: `npx vite build --mode development`
  - 프로덕션 빌드: `npx vite build --mode production`
  - 산출물 검증: `node ./scripts/validate-build.js`
  - GitHub Release 생성 (userscript + checksums + metadata)
- **예상 시간**: ~3-5분

### 보안 및 유지보수 워크플로우

**보안** (`.github/workflows/security.yml`)

- 주간 스케줄 + 온디맨드
- `npm audit` + 라이선스 보고서

**유지보수** (`.github/workflows/maintenance.yml`)

- 월간 스케줄 (1일 09:00 UTC)
- GitHub Issue 자동 생성
- 로컬: `npm run maintenance:check`

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
- Vitest 워커 메모리 누적: 테스트 완료 후 `npm run test:cleanup`이 자동 실행되어
  워커 프로세스를 정리합니다. 수동 실행 시:
  `node ./scripts/cleanup-vitest-workers.js`

## 작업 종료 체크리스트 (AI/개발자 공통)

모든 개발 작업(기능 추가, 리팩토링, 버그 수정 등)을 완료한 후 반드시 실행:

1. **코드 품질 검증**

   ```bash
   npm run validate  # typecheck + lint:fix + format
   npm test          # 전체 테스트 실행
   ```

2. **빌드 검증**

   ```bash
   npm run build     # 프로덕션 빌드
   ```

3. **유지보수 점검** ⭐ 필수

   ```bash
   npm run maintenance:check
   ```

   **AI는 반드시 출력 결과를 사용자에게 보고:**
   - ✅ 정상 항목 (보안, Git 상태 등)
   - ⚠️ 조치 필요 항목 (백업 디렉터리, 큰 문서, 빌드 크기 초과 등)
   - 💡 권장 조치 (발견된 항목에 대한 제거 명령 등)

4. **커밋 및 푸시**

   ```bash
   git add <files>
   git commit -m "..."
   git push  # pre-push 훅 자동 실행 (typecheck + test:smoke)
   ```

5. **워크플로우 결과 확인** (선택사항)

   커밋을 푸시한 후 CI 워크플로우 결과 확인:

   ```bash
   # 최근 워크플로우 실행 상태 확인
   gh run list --limit 10

   # 특정 빌드 파이프라인 결과만 확인
   gh run list --limit 5 | grep "Build Pipeline"

   # 상세 로그 확인 (실패 시)
   gh run view <RUN_ID> --log
   ```

6. **개발 전용 트레이싱 확인 (권장)**
   - dev 번들에서 Flow Tracer 활성 (`__XEG_TRACE_*` 전역 함수 확인)
   - prod 번들에서 트레이싱 코드 완전 제거 확인(grep으로
     `__XEG_TRACE_|tracePoint|flow-tracer` 매치 0)

**중요**: 대규모 작업(여러 파일 변경, 새 기능 추가) 후에는 반드시 maintenance
점검을 실행하여 임시 파일이나 불필요한 백업이 남아있지 않은지 확인하세요. 또한
푸시 후 `gh run list`로 워크플로우 성공을 확인하세요.

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

#### 개발 스크립트 (scripts/ 루트)

**원칙**: scripts/ 디렉터리는 주로 로컬 개발 환경을 위한 유틸리티입니다. CI는
GitHub Actions 네이티브 기능을 우선하며, 프로젝트 특화 검증이 필요한 경우에만
스크립트를 사용합니다.

**스크립트 목록**:

- **scripts/validate-build.js**: UserScript 빌드 검증 (CI + Local)
  - 헤더, 메타데이터, @grant 권한, PC-only 정책, 소스맵, 레거시 API 검증
  - CI 사용 이유: UserScript 특화 검증으로 표준 도구로 대체 불가
  - 사용 위치: `.github/workflows/ci.yml`, `.github/workflows/release.yml`

- **scripts/check-codeql.js**: CodeQL 보안 분석 실행 (Local Only)
  - 커스텀 쿼리 검증, SARIF 결과 생성, YAML 기반 필터링
  - CI는 `github/codeql-action@v3` 사용 (GitHub 공식)
  - 로컬 용도: 빠른 피드백, CI와 동일한 security-extended 쿼리

- **scripts/maintenance-check.js**: 프로젝트 건강 점검 (Local Only)
  - 백업 디렉터리, 큰 문서, 의존성, 빌드 크기, Git 상태 검사
  - CI는 별도 워크플로우 사용 (maintenance.yml, security.yml)
  - 로컬 용도: 작업 종료 시 정리 권장사항

- **scripts/generate-dep-graph.js**: 의존성 그래프 생성 (Local Only)
  - JSON/DOT/SVG 다중 포맷, 캐싱, Graphviz 지원
  - CI는 `npx depcruise src --validate`만 사용 (검증에만 집중)
  - 로컬 용도: 시각화 및 리팩토링 참고

- **scripts/cleanup-vitest-workers.js**: Vitest 워커 프로세스 정리 (Local + Test
  Automation)
  - Vitest 워커 프로세스 자동 종료 (SIGTERM → SIGKILL)
  - 메모리 확보 및 상태 보고
  - 사용 위치: 모든 테스트 스크립트 (`npm test`, `npm run test:*`)
  - 실행: `npm run test:cleanup` (자동, 실패 시에도 진행)

- **scripts/protect-vscode.js**: VS Code 서버 OOM Killer 보호 (Manual Only)
  - OOM Score 조정, Nice 값 조정, Swap 설정 확인
  - 로컬 용도: 수동 실행 (필요 시)
  - 실행: `node ./scripts/protect-vscode.js`

#### 스크립트 작성 가이드

- **언어 선택**: Node.js (JS/TS) 권장 > Bash > Python
  - JS/TS: 전체 환경에서 호환 (npm 통합)
  - Bash: Windows WSL 이슈 가능, 최소화
  - Python: 추가 의존성 (가급적 피함)
- **배치 규칙**:
  - ✅ 개발/재사용 스크립트: `scripts/` 루트 (npm 스크립트 연계)
  - ⏳ 실험/임시 스크립트: `scripts/temp/` (develop 중)
- **실행 방식**:
  - 개발 스크립트: `node scripts/*.js` 또는 `npm run <script>`
  - 임시 스크립트: `node scripts/temp/*.js` (완료 후 루트 승격)
- **CI 사용 기준**:
  - ✅ 허용: 프로젝트 특화 검증 (예: UserScript 헤더, 메타데이터)
  - ❌ 지양: GitHub Actions 기능으로 대체 가능한 경우 (린트, 포맷, 테스트)

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
