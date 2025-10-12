# 🔧 프로젝트 유지보수 가이드

> 프로젝트를 최신 상태로 유지하고 기술 부채를 관리하기 위한 체계적인 가이드

## 📅 주기적 점검 일정

### 매주 (Weekly)

- [ ] 의존성 보안 취약점 확인 (`npm audit`)
- [ ] 테스트 실패 여부 확인
- [ ] 빌드 크기 모니터링

### 매월 (Monthly)

- [ ] 의존성 업데이트 검토
- [ ] 사용되지 않는 코드 스캔
- [ ] 문서 최신성 검토
- [ ] 설정 파일 정리

### 분기별 (Quarterly)

- [ ] 전체 프로젝트 구조 리뷰
- [ ] 테스트 커버리지 분석
- [ ] 성능 벤치마크
- [ ] 아키텍처 개선 검토

---

## 🎯 점검 영역별 가이드

### 1. 문서 (docs/)

#### 점검 항목

```bash
# 1. 오래된 문서 찾기 (6개월 이상 미수정)
git log --all --pretty=format: --name-only --diff-filter=M -- docs/ | \
  sort -u | \
  xargs -I {} git log -1 --format="%ai {}" -- {}

# 2. 문서 크기 확인
Get-ChildItem docs\ -File |
  Where-Object { $_.Extension -eq '.md' } |
  Select-Object Name, @{Name="Lines";Expression={(Get-Content $_.FullName | Measure-Object -Line).Lines}} |
  Sort-Object Lines -Descending
```

#### 제거 후보

- Phase 완료 검증 문서
- 임시 실험/분석 문서
- 중복된 가이드
- 500줄 이상의 과도한 문서 (간소화 검토)

#### 유지 기준

- 활발히 참조되는 문서
- 온보딩에 필수적인 문서
- 아키텍처 결정 기록 (ADR)

---

### 2. 테스트 디렉터리 (test/)

#### 점검 항목

```bash
# 백업/임시 디렉터리 확인
Get-ChildItem test\ -Directory -Recurse |
  Where-Object { $_.Name -match 'backup|tmp|old|archive' }

# 사용되지 않는 테스트 파일 찾기 (vitest.config.ts exclude 참조)
```

#### 제거 후보

- `.backup-*` 디렉터리 (마이그레이션 완료 후)
- `tmp/` 임시 파일
- `*.skip.test.ts` (장기간 skip된 테스트)
- 중복된 테스트 파일

#### 현재 확인된 제거 대상

```bash
# .backup-preact 제거 (348개 파일)
Remove-Item -Recurse -Force test\.backup-preact
```

---

### 3. 소스 코드 (src/)

#### 사용되지 않는 코드 찾기

```bash
# 1. ESLint unused-exports 규칙 활성화
# eslint.config.js에 추가:
# '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]

# 2. TypeScript unused 체크
npm run typecheck -- --noUnusedLocals --noUnusedParameters

# 3. 수동 스캔: 특정 심볼 검색
git grep -l "exportedFunction" src/ | wc -l
```

#### 제거 후보

- Deprecated 마크된 함수/컴포넌트 (3개월 이상 경과)
- 테스트만 사용하는 유틸리티 (test/로 이동)
- 중복된 유틸리티 함수
- 사용되지 않는 타입 정의

---

### 4. 설정 파일

#### 점검 항목

```bash
# 루트 설정 파일 목록
Get-ChildItem -Path . -File |
  Where-Object { $_.Name -match '\.(json|js|cjs|ts|yml|yaml|toml)$' -and $_.Name -notmatch 'lock' } |
  Select-Object Name, LastWriteTime |
  Sort-Object LastWriteTime
```

#### 중복 확인

- `.eslintignore` vs `eslint.config.js` ignores
- `.prettierignore` vs `.gitignore` 패턴 중복
- 여러 `.browserslistrc` 설정

#### 최신화 체크

- ESLint 9+ flat config 사용
- TypeScript 5.x 기능 활용
- Vite 7 최신 옵션 적용

---

### 5. 의존성 (package.json)

#### 정기 점검

```bash
# 1. 오래된 패키지 확인
npx npm-check-updates

# 2. 사용되지 않는 의존성 찾기
npx depcheck

# 3. 번들 크기 분석
npm run build:prod
npx vite-bundle-visualizer

# 4. 보안 취약점
npm audit
npm audit fix
```

#### 제거 후보 체크리스트

- [ ] devDependencies에서 사용되지 않는 패키지
- [ ] 중복 기능 제공 패키지 (예: jest + vitest)
- [ ] Polyfill이 더 이상 필요없는 패키지
- [ ] 테스트 전용 패키지가 dependencies에 있는 경우

---

### 6. GitHub Actions (.github/workflows/)

#### 점검 항목

```bash
# workflow 파일 확인
Get-ChildItem .github\workflows\ -File | Select-Object Name
```

#### 최신화 체크

- [ ] GitHub Actions 버전 (actions/checkout@v4, actions/setup-node@v4 등)
- [ ] Node.js 버전 (현재 LTS 사용)
- [ ] 캐싱 전략 최적화
- [ ] 불필요한 워크플로 제거

---

## 🤖 자동화 스크립트

### 1. 전체 점검 스크립트

```bash
# scripts/maintenance-check.js 실행
npm run maintenance:check
```

### 2. 문서 최신성 체크

```bash
# 6개월 이상 미수정 문서 리스트
npm run maintenance:docs
```

### 3. 사용되지 않는 파일 스캔

```bash
# 백업/임시 파일 찾기
npm run maintenance:scan
```

---

## 📋 점검 체크리스트 템플릿

### 월간 점검 (복사해서 사용)

```markdown
## 🗓️ YYYY-MM 유지보수 체크리스트

### 의존성

- [ ] `npm audit` 실행 및 취약점 해결
- [ ] `npx npm-check-updates` 검토
- [ ] `npx depcheck` 실행

### 코드 정리

- [ ] 사용되지 않는 exports 제거
- [ ] Deprecated 코드 제거
- [ ] 테스트 커버리지 확인

### 문서

- [ ] README.md 최신성 확인
- [ ] docs/ 문서 검토
- [ ] 변경사항 changelog 업데이트

### 설정

- [ ] 설정 파일 중복 확인
- [ ] .gitignore 최적화
- [ ] CI/CD 워크플로 검토

### 빌드

- [ ] 빌드 크기 확인 (예산 초과 여부)
- [ ] Sourcemap 정상 생성 확인
- [ ] 프로덕션 빌드 테스트

### 정리

- [ ] 백업/임시 파일 삭제
- [ ] 불필요한 주석 제거
- [ ] Git 브랜치 정리
```

---

## 🚨 즉시 조치 항목

### 현재 확인된 정리 대상

1. **test/.backup-preact/** (348개 파일)

   ```bash
   Remove-Item -Recurse -Force test\.backup-preact
   ```

2. **임시 디렉터리 확인**

   ```bash
   # test/tmp/ 내용 확인
   Get-ChildItem test\tmp\ -Recurse
   ```

3. **Git에서 추적되지 않는 큰 파일**
   ```bash
   git ls-files --others --exclude-standard | xargs -I {} ls -lh {}
   ```

---

## 📊 메트릭 추적

### 프로젝트 건강도 지표

```javascript
// 추적할 메트릭
const metrics = {
  // 코드
  linesOfCode: 'cloc src/',
  testCoverage: 'npm run test:coverage',

  // 빌드
  bundleSize: {
    dev: '~730 KB',
    prod: '~325 KB',
    gzip: '~88 KB',
  },

  // 품질
  eslintIssues: 'npm run lint',
  typeErrors: 'npm run typecheck',

  // 의존성
  dependencies: Object.keys(require('../package.json').dependencies).length,
  devDependencies: Object.keys(require('../package.json').devDependencies)
    .length,

  // 테스트
  totalTests: 603,
  skippedTests: 24,
};
```

---

## 🔄 주기적 작업 자동화

### GitHub Actions로 자동화

```yaml
# .github/workflows/maintenance.yml
name: Monthly Maintenance

on:
  schedule:
    - cron: '0 0 1 * *' # 매월 1일
  workflow_dispatch:

jobs:
  maintenance-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit
      - run: npx npm-check-updates
      - run: npx depcheck
```

---

## 📝 문서화 규칙

### 변경사항 기록

모든 정리 작업은 다음 형식으로 커밋:

```bash
chore(maintenance): clean up [영역]

- Remove: [제거한 항목]
- Update: [업데이트한 항목]
- Reason: [이유]
```

### 월간 리포트

`docs/maintenance/YYYY-MM.md` 형식으로 작업 내역 기록

---

## 🎯 성공 기준

프로젝트가 잘 유지되고 있다는 지표:

- ✅ 모든 테스트 통과
- ✅ 빌드 크기 예산 이내
- ✅ 보안 취약점 0건
- ✅ 사용되지 않는 코드 0%
- ✅ 문서 최신성 100%
- ✅ 의존성 6개월 이내 업데이트

---

**정기적인 유지보수로 기술 부채를 최소화하고 프로젝트 품질을 유지하세요!** 🚀
