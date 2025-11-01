# 로컬 개발 환경 설정 (Local Development Setup)

## 개요

이 프로젝트는 **1인 개발 + AI 협업** 모델을 위해 설계되었습니다. 로컬 개발
설정과 원격 리포지토리(소스 코드 + 필수 빌드 설정)를 명확히 분리합니다.

---

## 핵심 원칙

### 1️⃣ 원격 리포지토리에 포함되는 것 (Git Tracked)

✅ **소스 코드**: `src/`, `types/`, `playwright/`

✅ **필수 빌드 설정**: `tsconfig.base.json`, `vite.config.ts` (기본값)

✅ **의존성**: `package.json`, `package-lock.json`

✅ **핵심 가이드**: `docs/*.md`, `AGENTS.md`, `.github/copilot-instructions.md`

✅ **CI/CD 워크플로우**: `.github/workflows/*.yml`

### 2️⃣ 로컬 개발 환경에만 있는 것 (Git Ignored)

❌ **개발자별 설정 오버라이드**:

- `eslint.local.js`, `eslint.local.ts`
- `vite.local.ts`, `vitest.local.ts`
- `postcss.local.js`, `tsconfig.local.json`
- `.env.local`, `.env.*.local`
- `config/local/*` (예외: `config/local/README.md`)

❌ **코드 품질 도구 캐시**:

- `.eslintcache`, `.prettiercache`, `.stylelintcache`, `.markdownlintcache`
- `.tscache/`, `.vitest-cache/`
- `.dependency-cruiser-cache`

❌ **테스트 및 빌드 산출물**:

- `coverage/`, `test-results/`, `playwright-report/`
- `dist/`, `build/`, `.vite/`, `.cache/`

❌ **환경 및 보안**:

- `.env`, `.env.*`
- `*.pem`, `*.p12`, `secret.key`, `ssl/`, `certs/`
- 모든 로컬 보안 정보

---

## 로컬 개발 워크플로우

### 초기 설정

```bash
# 1. 저장소 클론 및 의존성 설치
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery
npm ci

# 2. (선택사항) 로컬 개발 설정 추가
mkdir -p config/local
cat > vite.local.ts <<EOF
import type { UserConfig } from 'vite';

export default {
  server: {
    port: 5173,
    open: true,
    // 로컬 전용 개발 서버 설정
  },
} satisfies UserConfig;
EOF
```

### 일상 개발

```bash
# 타입 체크 + 린트 + 포맷 (로컬 가이드 적용)
npm run validate

# 개발 서버 시작 (로컬 설정 자동 로드)
npm run dev

# 테스트 실행
npm test                 # 전체 테스트
npm run test:watch      # Watch 모드
npm run test:coverage   # 커버리지 포함

# 빌드
npm run build           # 전체 검증 포함
npm run build:only      # 빌드만 (빠름)
npm run build:dev       # 개발 모드
npm run build:prod      # 프로덕션 모드
```

### 커밋 전 체크리스트

```bash
# 로컬 검증 (pre-commit/pre-push 훅으로 자동 실행)
npm run validate        # TypeScript, ESLint, Prettier, Stylelint
npm test && npm run test:cleanup  # 전체 테스트 + 워커 정리

# 최종 빌드 검증
npm run build

# 유지보수 점검 (작업 종료 시 필수)
npm run maintenance:check

# 커밋 준비
git add .
git commit -m "feat: 설명"
```

---

## 로컬 오버라이드 시스템

### 개요

로컬 개발 설정은 **런타임에 로드**되며 Git에 저장되지 않습니다. 이를 통해:

- 각 개발자가 자신의 머신 환경에 맞춘 설정 사용 가능
- CI/CD는 항상 일관된 기본 설정 사용
- 설정 충돌 없음

### 지원되는 로컬 오버라이드 파일

| 파일                  | 용도                         | 예시                   |
| --------------------- | ---------------------------- | ---------------------- |
| `eslint.local.js/.ts` | ESLint 규칙 커스터마이제이션 | IDE 추가 규칙          |
| `vite.local.ts`       | Vite 서버/빌드 옵션          | 포트, 프록시, 환경변수 |
| `vitest.local.ts`     | Vitest 테스트 옵션           | 타임아웃, 필터         |
| `postcss.local.js`    | PostCSS 플러그인             | CSS 전처리기           |
| `tsconfig.local.json` | TypeScript 오버라이드        | paths 추가             |
| `.env.local`          | 환경 변수                    | API 키, 디버그 플래그  |

### 로드 방식

각 설정 파일은 **`config/utils/load-local-config.js`** 유틸리티로 로드됩니다:

```javascript
// eslint.config.js
const localConfig = await loadLocalConfig(import.meta.url, 'eslint.local');
export default [...baseConfig, ...(localConfig || [])];
```

**특징**:

- ✅ CI 환경에서 자동 스킵 (`CI=true` 감지)
- ✅ `XEG_DISABLE_LOCAL_CONFIG=true`로 수동 비활성화 가능
- ✅ 파일이 없으면 자동 스킵 (오류 없음)
- ✅ ESM/CommonJS 모두 지원

### 예시: `vite.local.ts`

```typescript
import type { UserConfig } from 'vite';

export default {
  // 로컬 개발 서버 설정
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    middlewareMode: false,
    watch: {
      usePolling: true, // WSL2/Docker 환경용
    },
  },

  // 로컬 디버그 설정
  define: {
    __DEBUG_MODE__: JSON.stringify(true),
  },
} satisfies UserConfig;
```

### 예시: `eslint.local.js`

```javascript
export default [
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'off', // 로컬에서만 console.log 허용
    },
  },
];
```

---

## GitHub Actions (CI/CD) 워크플로우

### 독립성 보장

모든 CI 워크플로우는 **로컬 설정과 무관하게** 실행됩니다:

```yaml
# .github/workflows/ci.yml
env:
  XEG_DISABLE_LOCAL_CONFIG: 'true' # 로컬 override 비활성화
  CI: 'true' # CI 감지
```

### CI의 역할

| 단계              | 작업                   | 이유                         |
| ----------------- | ---------------------- | ---------------------------- |
| **TypeCheck**     | `npx tsgo`             | 타입 안정성 (로컬 설정 무시) |
| **Security**      | CodeQL 분석            | 보안 취약점 정적 분석        |
| **Tests**         | Vitest 브라우저 테스트 | 크로스 브라우저 검증         |
| **E2E**           | Playwright 테스트      | 실제 브라우저 동작 검증      |
| **Accessibility** | axe-core WCAG 검증     | 접근성 자동 점검             |
| **Build**         | Vite 빌드 + 검증       | 최종 산출물 검증             |

### 로컬과 CI의 역할 분리

#### 🏠 로컬 (Pre-commit/Pre-push Hook)

- ✅ 빠른 피드백 (린트, 포매팅, 타입 체크)
- ✅ 스모크 테스트 (기본 검증)
- ✅ 선택적 full 검증 (pre-push 스코프 설정)

#### 🤖 CI (GitHub Actions)

- ✅ 보안 분석 (CodeQL)
- ✅ 종합 테스트 (E2E, 접근성)
- ✅ 최종 빌드 검증
- ✅ 로컬 머신 상태와 무관하게 실행

---

## 문제 해결

### 1. "로컬 설정이 CI에 영향을 주는 것 같음"

**원인**: `XEG_DISABLE_LOCAL_CONFIG=true`가 설정되지 않음

**해결**:

```bash
# 환경 변수 확인
echo $XEG_DISABLE_LOCAL_CONFIG
echo $CI

# 수동으로 설정하여 CI 시뮬레이션
export XEG_DISABLE_LOCAL_CONFIG=true
npm run typecheck
```

### 2. "로컬 설정이 로드되지 않음"

**원인**: 파일 이름 오류 또는 경로 문제

**해결**:

```bash
# 파일명 확인 (정확한 이름 필요)
ls -la vite.local.* eslint.local.*

# config/ 디렉터리 구조 확인
tree config/

# 로컬 설정 비활성화된 상태 확인
unset XEG_DISABLE_LOCAL_CONFIG
npm run typecheck -- --listFiles | grep local
```

### 3. "캐시 오류 (ESLint, Vitest 등)"

**원인**: 이전 설정 캐시 남음

**해결**:

```bash
# 모든 캐시 정리
rm -rf .eslintcache .prettiercache .tscache .vitest-cache .dependency-cruiser-cache
npm run test:cleanup

# 다시 실행
npm run validate
```

---

## Git 설정 확인

### .gitignore 규칙 검증

```bash
# 로컬 설정 파일이 추적되지 않는지 확인
git check-ignore -v vite.local.ts eslint.local.js .env.local

# 추적되면 (상태 코드 0), 올바른 설정
# 추적 안 되면 (상태 코드 1), .gitignore 확인 필요
```

### 실수로 추가된 로컬 파일 제거

```bash
# 만약 로컬 파일이 이미 커밋된 경우
git rm --cached vite.local.ts eslint.local.js
git commit -m "chore: remove local config files from tracking"
```

---

## 개발자 협업 가이드

### 새 개발자 온보딩

```bash
# 1. 저장소 클론
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery

# 2. 의존성 설치
npm ci

# 3. 로컬 개발 설정 생성 (필요시)
# docs/LOCAL_DEVELOPMENT.md의 "로컬 오버라이드 시스템" 섹션 참고
mkdir -p config/local
# vite.local.ts, eslint.local.js 등 필요한 파일만 생성

# 4. 기본 검증
npm run validate
npm test
```

### AI 협업 시 고려사항

1. **로컬 설정 변경 제안 금지**: AI는 `*.local.*` 파일이나 `config/local/` 수정
   제안 안 함
2. **CI 명령어 검증**: AI가 제안하는 스크립트는 `npx` 기반이거나 GitHub Actions
   기능 사용
3. **문서화 우선**: 로컬 설정이 필요한 경우, 이 문서에 예시 추가

---

## 참고 자료

- **[AGENTS.md](../AGENTS.md)**: 전체 개발 환경 가이드
- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)**: 코드 스타일 및 아키텍처
- **[.github/copilot-instructions.md](../.github/copilot-instructions.md)**: AI
  협업 규칙
- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)**: 테스트 전략
