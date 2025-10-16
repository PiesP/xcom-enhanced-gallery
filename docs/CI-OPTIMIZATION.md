# CI 최적화 가이드

> xcom-enhanced-gallery 프로젝트의 CI 친화적 설정 및 사용 가이드

## 📋 개요

이 프로젝트는 **로컬(Windows PowerShell)**과 **CI(Ubuntu)**에서 모두 원활하게
동작하도록 최적화되었습니다. 중간 입력 없이 자동화된 워크플로우를 제공합니다.

## 🔧 핵심 개선사항

### 1. `.npmrc` 설정

프로젝트 루트에 `.npmrc` 파일이 추가되어 CI/로컬 공통 설정을 제공합니다:

- **legacy-peer-deps**: 의존성 충돌 자동 해결
- **loglevel=error**: CI 로그 정리 (경고/정보 메시지 최소화)
- **fund=false**: 펀딩 메시지 숨김
- **update-notifier=false**: 업데이트 알림 비활성화
- **fetch-timeout 설정**: 네트워크 불안정 대비

### 2. lint-staged 개선

**이전 문제**:

```json
"*.{ts,tsx}": [
  "eslint --fix",
  "prettier --write",
  "bash -c 'npm run typecheck'"  // ❌ Windows에서 bash 필요
]
```

**개선 후**:

```json
"*.{ts,tsx}": [
  "eslint --fix",
  "prettier --write"
  // ✅ bash 제거, typecheck는 pre-push에서 전체 실행
]
```

**변경 이유**:

- Windows에서 bash 의존성 제거
- Staged 파일만으로 typecheck는 불완전 (전체 프로젝트 체크 필요)
- Pre-push 훅에서 전체 typecheck 수행으로 충분

### 3. CI 전용 스크립트 추가

#### validate:ci

```json
"validate:ci": "npm run typecheck && npm run lint && npm run lint:css && npm run lint:md && npm run format:check && npm run deps:check && npm run codeql:check"
```

- CI 환경에서 모든 품질 검사를 한 번에 실행
- 수정하지 않고 체크만 수행 (읽기 전용)
- CodeQL 검증 포함으로 보안 정책 자동 검증

#### test:coverage

```json
"test:coverage": "vitest --project unit --coverage --run"
```

- 단위 테스트 커버리지 수집
- CI/로컬 모두에서 동일하게 동작

### 4. check-codeql.js 최적화 (Phase 85.1)

**성능 개선**:

- **도구 감지 캐싱**: detectCodeQLTool() 결과를 전역 변수에 캐싱 (0.3초 절약)
- **CI Early Exit**: CI 환경에서 main() 함수 최상단 즉시 종료 (30-60초 절약)
- **증분 DB 업데이트**: src/ 수정 시간 기반 캐싱 (2회차 이후 30-40초 절약)
- **강제 재생성**: 환경변수 `CODEQL_FORCE_REBUILD=true`로 캐시 우회 가능

**CI 환경 자동 감지**:

```javascript
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
```

**CI 모드 동작**:

- ANSI 색상 코드 비활성화
- 간결한 메시지 출력
- CodeQL CLI 미설치 시 조용히 스킵

**로컬 모드 동작**:

- 컬러풀한 출력
- 상세한 설치 가이드 제공
- 사용자 친화적 메시지

## 📝 NPM 스크립트 구조

### 로컬 개발용 (인터랙티브)

```bash
npm run validate         # 전체 검증 + 자동 수정
npm run lint:fix         # ESLint 수정
npm run lint:css:fix     # stylelint 수정
npm run lint:md:fix      # markdownlint 수정
npm run format           # Prettier 포맷팅
```

### CI 환경용 (읽기 전용)

```bash
npm run validate:ci      # 전체 검증 (typecheck + lint + lint:css + lint:md + format:check + deps:check + codeql:check)
npm run format:check     # Prettier 체크만
npm run test:coverage    # 커버리지 테스트
npm run codeql:check     # CodeQL 정적 분석
```

## 🚀 CI 워크플로우 개선 (Phase 85.1)

### Quality Job

```yaml
- name: � Setup GitHub CLI with CodeQL extension
  run: |
    gh extension install github/gh-codeql || true
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

- name: ✅ Run quality checks
  run: npm run validate:ci
  # Runs: typecheck + lint + lint:css + lint:md + format:check + deps:check + codeql:check
```

**이전 대비 개선**:

- **스크립트 통합**: 7개의 개별 스크립트 → 1개의 validate:ci로 통합
- **CodeQL 추가**: 정적 분석을 CI 파이프라인에 통합
- **gh extension 설치**: CodeQL CLI 자동 설치로 로컬/CI 동일 환경
- **실패 시 빌드 중단**: CodeQL 문제 발견 시 자동으로 빌드 중단

### Tests Job

```yaml
- name: 🧪 Run tests (Node ${{ matrix.node-version }})
  if: ${{ matrix.node-version != 20 }}
  run: npm test

- name: 🧪 Run tests with coverage (Node 20)
  if: ${{ matrix.node-version == 20 }}
  run: npm run test:coverage
```

**이전 대비 개선**:

- **스크립트 단순화**: test:ci:node22 → npm test
- **커버리지 통합**: test:coverage:ci → test:coverage

## 🎯 크로스 플랫폼 호환성

### Windows (PowerShell)

- `.npmrc`의 `legacy-peer-deps` 설정으로 의존성 자동 해결
- lint-staged에서 bash 제거
- npm scripts는 모두 크로스 플랫폼 도구 사용 (cross-env, rimraf 등)

### Ubuntu (GitHub Actions)

- 동일한 `.npmrc` 설정 적용
- CI 전용 스크립트로 간결한 로그
- `npm ci --prefer-offline --no-audit --legacy-peer-deps` 최적화

## 📊 성능 최적화

### 패키지 설치

```yaml
- name: 📦 Install dependencies
  run: npm ci --prefer-offline --no-audit --legacy-peer-deps
```

- `--prefer-offline`: 캐시 우선 사용
- `--no-audit`: 보안 감사 스킵 (별도 워크플로우에서 수행)
- `--legacy-peer-deps`: peer deps 충돌 자동 해결

### Git Hooks

- **pre-commit**: lint-staged만 실행 (변경 파일만)
- **pre-push**: typecheck + smoke tests (빠른 검증)
- **CI 환경**: 훅 자동 스킵 (`CI=true` 감지)

## 🔍 검증 명령어

### 전체 검증 (로컬)

```bash
npm run validate
```

- typecheck → lint:fix → lint:css → lint:md:fix → codeql:check → format

### 전체 검증 (CI)

```bash
npm run validate:ci
```

- typecheck → lint → lint:css → lint:md → format:check → deps:check →
  codeql:check
- CodeQL 실패 시 빌드 중단

### 빌드 검증

```bash
npm run build
```

- clean → build:dev → build:prod → validate-build.js

## 🛠️ 트러블슈팅

### Q: lint-staged가 typecheck를 실행하지 않는 이유?

**A**: Staged 파일만으로는 불완전한 typecheck입니다. 전체 프로젝트 타입 체크는
pre-push 훅에서 수행합니다.

### Q: CI에서 CodeQL 문제가 발견되면 어떻게 되나요?

**A**: CodeQL에서 문제가 발견되면 빌드가 자동으로 중단됩니다. `codeql-results/`
디렉터리에서 SARIF 결과를 확인할 수 있습니다.

### Q: CodeQL 캐시를 강제로 재생성하려면?

**A**: 환경변수를 설정하여 실행하세요:

```bash
# PowerShell
$env:CODEQL_FORCE_REBUILD = 'true'
npm run codeql:check

# Bash/Zsh
CODEQL_FORCE_REBUILD=true npm run codeql:check
```

### Q: Windows에서 npm 설치가 느립니다

**A**: `.npmrc`의 `fetch-timeout` 설정을 확인하고, npm 캐시를 정리하세요:

```bash
npm cache clean --force
npm ci
```

### Q: CI에서 ANSI 색상 코드가 나타납니다

**A**: 대부분의 도구가 CI 환경을 자동 감지합니다. 필요시 환경변수 추가:

```yaml
env:
  NO_COLOR: 1
  FORCE_COLOR: 0
```

## 📚 관련 문서

- **AGENTS.md**: 개발 환경 설정 및 빠른 시작
- **docs/CODING_GUIDELINES.md**: 코딩 규칙
- **.github/workflows/ci.yml**: CI 파이프라인 상세

## 🔄 업데이트 내역

### 2025-10-16 (Phase 85.1)

- **validate:ci 스크립트 통합**: 7개 개별 스크립트 → 1개로 통합
- **CodeQL 자동 검증**: CI 파이프라인에 정적 분석 통합
- **gh extension 자동 설치**: CodeQL CLI 환경 자동 구성
- **CodeQL 성능 최적화**: 캐싱, CI early exit, 증분 DB (30-60초 절약)
- **빌드 중단 메커니즘**: CodeQL 실패 시 자동 빌드 중단
- **중복 스크립트 제거**: test:ci:node22, test:coverage:ci 등 정리

### 2025-10-15

- `.npmrc` 추가 (CI 친화적 설정)
- lint-staged bash 제거
- CI 전용 스크립트 추가 (typecheck:ci, lint:ci 등)
- check-codeql.js CI 모드 개선
- 워크플로우 최적화 (compact/dot 리포터)

---

모든 스크립트는 Windows/Linux 모두에서 동일하게 동작하며, 사용자 입력 없이
자동화됩니다.
