# 최소 구조 적용 계획 (Repository Structure Implementation Plan)

**작성일**: 2025-11-01  
**목표**: 1인 개발 + AI 협업에 최적화된 프로젝트 구조로 전환  
**기간**: Phase 1 (즉시), Phase 2 (선택사항)

---

## 🎯 개선 목표

### Before (현재)

- 추적 파일: **929개**
- 구조: 개발/테스트/배포 파일 혼재
- 책임: 로컬/원격/CI 경계 불명확

### After (목표)

- 추적 파일: **~50-100개**
- 구조: 소스 + 배포 설정만 (개발 도구는 로컬)
- 책임: 로컬(테스트/린트) vs 원격(배포) vs CI(검증) 명확히 분리

---

## 📋 Phase 1: 기본 구조 적용 (필수)

### 1.1 .gitignore 최소화

**목표**: Whitelist 방식 → 필수 파일만 추적

**제외할 디렉토리/파일**:

```text
docs/             # 개발 가이드 (로컬 참고용)
test/             # 테스트 코드 (CI 실행)
playwright/       # E2E 테스트 (CI 실행)
scripts/          # 개발 스크립트 (로컬 실행)
config/           # 로컬 오버라이드
*.local.*         # 로컬 설정
AGENTS.md, CLAUDE.md  # 개발 가이드
.eslintcache, coverage/, dist-ssr/, ...
```

**유지할 파일**:

```text
✅ src/              # 소스 코드
✅ types/            # 타입 정의
✅ .github/          # GitHub Actions
✅ LICENSES/         # 의존성 라이선스
✅ .gitignore        # Git 설정
✅ LICENSE           # 프로젝트 라이선스
✅ README.md         # 프로젝트 소개
✅ package.json      # 의존성 + 스크립트
✅ package-lock.json # npm 잠금
✅ .npmrc            # npm 설정
✅ tsconfig*.json    # TypeScript 설정
✅ vite.config.ts    # Vite 설정
```

**작업**:

- [ ] 새 .gitignore.minimal 생성
- [ ] 테스트: `git ls-files | wc -l` (결과: 50-100)
- [ ] 검증: `npm run build:only` 성공 확인

---

### 1.2 package.json 스크립트 분류

**목표**: 로컬/원격/겸용 명시적 표시

**분류 기준**:

```text
로컬 전용 (개발자 머신에서만 실행):
  test:* (테스트)
  lint:* (린팅)
  format (포매팅)
  deps:graph (의존성 시각화)
  maintenance:* (유지보수)
  watch (감시)

원격 전용 (GitHub Actions에서만 실행):
  release (릴리스 생성)
  publish (배포)

겸용 (로컬 + CI 모두):
  build* (빌드)
  validate* (검증)
  typecheck (타입 체크)
```

**작업**:

- [ ] 주석 추가로 분류 명시

```json
{
  "scripts": {
    "// === LOCAL ONLY (Development) === ": "",
    "test": "...",
    "// === REMOTE ONLY (CI/CD) === ": "",
    "release": "...",
    "// === SHARED (Local + CI) === ": "",
    "build": "..."
  }
}
```

---

### 1.3 GitHub Actions 워크플로우 정리

**현재 워크플로우**:

- `.github/workflows/ci.yml` - 품질 검증 + 테스트
- `.github/workflows/release.yml` - 릴리스 생성
- `.github/workflows/security.yml` - 보안 검사 (주간)
- `.github/workflows/maintenance.yml` - 유지보수 (월간)

**정리 작업**:

#### ci.yml (원격 전용)

- [ ] 주석 추가: "CI 환경에서만 자동 실행"
- [ ] 명시: 이 워크플로우는 로컬 개발에 영향 없음
- [ ] 문서화: 각 단계의 목적 (validate → test → build → e2e)

#### release.yml (배포 전용)

- [ ] 주석 추가: "마스터 브랜치 버전 변경 시 자동 실행"
- [ ] 명시: 배포된 파일 목록 (dist/\*.user.js)

#### security.yml, maintenance.yml

- [ ] 주석 추가: "주간/월간 자동 실행 (개발자 알림용)"

---

## 📄 Phase 2: 문서 갱신 (권장)

### 2.1 AGENTS.md 개선

**추가 섹션**:

```markdown
## 파일 책임 분리 (Local vs Remote)

### 원격 저장소 추적 (Git Tracked) ✅

- src/, types/, .github/, LICENSES/, package.json, ...
- 특징: 배포 필수 파일만

### 로컬 저장소만 (Git Ignored) ❌

- docs/, test/, playwright/, scripts/, coverage/, ...
- 특징: 개발/테스트 도구 및 생성물

### 스크립트 책임

- 로컬 전용: npm test, npm run lint, npm run deps:graph
- 원격 전용: GitHub Actions 워크플로우 (자동 실행)
- 겸용: npm run build, npm run typecheck, npm run validate
```

### 2.2 copilot-instructions.md 개선

**수정사항**:

```markdown
## 로컬 vs 원격 개발 워크플로우

### 개발 단계 (로컬)

1. npm ci # 의존성 설치
2. npm test # 로컬 테스트 (JSDOM)
3. npm run lint # 린팅
4. git push # 커밋

### CI 검증 (GitHub Actions)

1. npm ci # CI 환경에서 의존성 설치
2. npm run typecheck # 타입 체크
3. npm test:full # 전체 테스트
4. npm run build # 빌드 검증
5. npm run e2e:smoke # E2E 스모크 테스트
6. GitHub Release 자동 생성 (version 변경 시)
```

---

## 🚀 구현 순서

### Step 1: .gitignore 최소화

```bash
git ls-files | wc -l  # Before: 929
# → Replace .gitignore → After: ~100
git ls-files | wc -l
```

### Step 2: 검증

```bash
npm ci                # 의존성 설치
npm run build:only    # 빌드 테스트
npm run typecheck     # 타입 체크 테스트
```

### Step 3: 문서 커밋

```bash
git add .gitignore docs/REPOSITORY_STRUCTURE_IMPLEMENTATION_PLAN.md
git commit -m "refactor: apply minimum repository structure (929 → ~100 files)"
```

### Step 4: 가이드 문서 업데이트

```bash
# AGENTS.md 수정 (로컬/원격 책임 추가)
# copilot-instructions.md 수정 (워크플로우 명시)
# CHANGELOG.md 수데이트
```

---

## ✅ 검증 체크리스트

### .gitignore 적용 후

- [ ] `git ls-files | wc -l` → 50-100 범위 확인
- [ ] `npm run build:only` → UserScript 생성 성공
- [ ] `npm run typecheck` → 타입 에러 없음
- [ ] `npm run lint` → 린트 에러 없음
- [ ] `git status` → 추적 파일만 표시

### 문서 업데이트 후

- [ ] AGENTS.md에 "로컬 vs 원격" 섹션 추가
- [ ] copilot-instructions.md 워크플로우 명시
- [ ] CHANGELOG.md 최신 버전 업데이트
- [ ] README.md "최소 구조 도입" 표기 (선택)

---

## 📊 예상 효과

| 항목         | Before    | After  | 절감     |
| ------------ | --------- | ------ | -------- |
| 추적 파일    | 929       | 100    | 89% ↓    |
| 저장소 크기  | ~50MB     | ~5MB   | 90% ↓    |
| 클론 시간    | ~15초     | ~2초   | 87% ↓    |
| PR 리뷰 범위 | 제약 없음 | 소스만 | 명확함 ↑ |

---

## 🔔 주의사항

### 테스트/문서는 로컬에서만

- 원격 저장소에는 없지만 CI에서 자동 실행
- 개발자 로컬에는 `npm ci` 후 자동 생성

### 초기 클론 후 동작

```bash
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
npm ci           # 의존성 설치 (package-lock.json 사용)
npm run build    # 배포 빌드
npm run build:dev  # 또는 개발 빌드
```

### 이전 로컬 저장소 정리

```bash
git clean -fd    # 미추적 파일 제거
git reset --hard # 변경사항 초기화
```

---

## 참고: 현재 워크플로우 (변경 없음)

### GitHub Actions

- **ci.yml**: PR/Push 시 자동 (변경 없음, 원격 전용)
- **release.yml**: 배포 (변경 없음)
- **security.yml**: 주간 보안 (변경 없음)

### 로컬 스크립트

- 모두 `scripts/` 디렉토리에 위치 (원격에서 제외)
- CI와 로컬이 동일한 검증 기준 유지

---

**다음 단계**: Phase 1 구현 준비 완료.  
사용자 승인 후 .gitignore 최소화를 진행합니다.
