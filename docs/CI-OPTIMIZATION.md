# CI 최적화 가이드

> xcom-enhanced-gallery 프로젝트의 CI 친화적 설정 및 사용 가이드

## 📋 개요

이 프로젝트는 **로컬(Windows PowerShell)**과 **CI(Ubuntu)**에서 모두 원활하게 동작하도록 최적화되었습니다. 중간 입력 없이 자동화된 워크플로우를 제공합니다.

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

#### typecheck:ci

```json
"typecheck:ci": "tsgo --project ./tsconfig.json --noEmit --pretty=false"
```

- `--pretty=false`: CI 로그에 맞춰 간결한 출력

#### lint:ci

```json
"lint:ci": "eslint ./src --report-unused-disable-directives --max-warnings 0 --format=compact"
```

- `--format=compact`: 한 줄 출력으로 CI 로그 정리

#### lint:css:ci

```json
"lint:css:ci": "stylelint \"src/**/*.css\" --formatter=compact"
```

#### lint:md:ci

```json
"lint:md:ci": "markdownlint-cli2 \"**/*.md\" \"#node_modules\" \"#coverage\" --config .markdownlint.json"
```

#### test:coverage:ci

```json
"test:coverage:ci": "cross-env CI=true vitest --project unit --coverage --run --reporter=dot"
```

- `--reporter=dot`: 간결한 테스트 결과 출력

#### validate:ci

```json
"validate:ci": "npm run typecheck:ci && npm run lint:ci && npm run lint:css:ci && npm run lint:md:ci && npm run format:check"
```

- CI 환경에서 모든 품질 검사를 한 번에 실행
- 수정하지 않고 체크만 수행 (읽기 전용)

### 4. check-codeql.js CI 모드

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
npm run validate:ci      # 전체 검증 (수정 없음)
npm run typecheck:ci     # 타입 체크 (간결 출력)
npm run lint:ci          # ESLint (compact 포맷)
npm run lint:css:ci      # stylelint (compact 포맷)
npm run lint:md:ci       # markdownlint (설정 명시)
npm run format:check     # Prettier 체크만
npm run test:coverage:ci # 커버리지 테스트 (dot 리포터)
```

## 🚀 CI 워크플로우 개선

### Quality Job

```yaml
- name: 🔎 Type check
  run: npm run typecheck:ci

- name: 🧹 Lint
  run: npm run lint:ci

- name: 🎨 CSS Lint
  run: npm run lint:css:ci

- name: 📝 Markdown Lint
  run: npm run lint:md:ci

- name: 🎨 Prettier check
  run: npm run format:check
```

**이전 대비 개선**:

- 각 단계별로 CI 최적화된 스크립트 사용
- 출력 포맷 통일 (compact/dot)
- 불필요한 npx 호출 제거

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

- typecheck:ci → lint:ci → lint:css:ci → lint:md:ci → format:check

### 빌드 검증

```bash
npm run build
```

- clean → build:dev → build:prod → validate-build.js

## 🛠️ 트러블슈팅

### Q: lint-staged가 typecheck를 실행하지 않는 이유?

**A**: Staged 파일만으로는 불완전한 typecheck입니다. 전체 프로젝트 타입 체크는 pre-push 훅에서 수행합니다.

### Q: CI에서 CodeQL CLI 경고가 표시됩니다

**A**: 정상입니다. 로컬 CodeQL은 선택사항이며, GitHub Actions에서 별도로 실행됩니다.

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

### 2025-10-15

- `.npmrc` 추가 (CI 친화적 설정)
- lint-staged bash 제거
- CI 전용 스크립트 추가 (typecheck:ci, lint:ci 등)
- check-codeql.js CI 모드 개선
- 워크플로우 최적화 (compact/dot 리포터)

---

모든 스크립트는 Windows/Linux 모두에서 동일하게 동작하며, 사용자 입력 없이 자동화됩니다.
