# 🔧 프로젝트 유지보수 가이드

> 프로젝트를 최신 상태로 유지하고 기술 부채를 관리하기 위한 체계적인 가이드

## 📅 주기적 점검 일정

### 매주 (Weekly)

- [ ] 의존성 보안 취약점: `npm audit`
- [ ] 테스트 실패 여부: `npm test`
- [ ] 빌드 크기 모니터링: `npm run build`

### 매월 (Monthly)

- [ ] 의존성 업데이트: `npx npm-check-updates`
- [ ] 사용되지 않는 코드: `npx depcheck`
- [ ] 문서 최신성 검토
- [ ] 설정 파일 정리

### 분기별 (Quarterly)

- [ ] 전체 프로젝트 구조 리뷰
- [ ] 테스트 커버리지 분석: `npm run test:coverage`
- [ ] 성능 벤치마크
- [ ] 아키텍처 개선 검토

---

## 🤖 자동화 스크립트

### 전체 점검

```bash
npm run maintenance:check
```

**점검 항목**:

- ✅ 보안 취약점 (`npm audit`)
- ✅ Git 추적되지 않는 파일
- ✅ 백업 디렉터리 (`.backup-*`, `tmp/`)
- ✅ 큰 문서 (500줄 이상)
- ✅ 빌드 크기 예산 (325 KB)
- ✅ 테스트 통과율

### 개별 점검

```bash
# 문서 크기 확인
Get-ChildItem docs\ -File -Filter *.md |
  Select-Object Name, @{N='Lines';E={(Get-Content $_.FullName | Measure-Object -Line).Lines}} |
  Sort-Object Lines -Descending

# 백업 디렉터리 찾기
Get-ChildItem test\ -Directory -Recurse |
  Where-Object { $_.Name -match 'backup|tmp|old' }

# 사용되지 않는 의존성
npx depcheck

# 번들 분석
npm run build:prod
npx vite-bundle-visualizer
```

---

## 📋 월간 점검 체크리스트

```markdown
## 🗓️ YYYY-MM 유지보수

### 의존성

- [ ] `npm audit` 실행 및 해결
- [ ] `npx npm-check-updates` 검토
- [ ] `npx depcheck` 실행

### 코드 정리

- [ ] 사용되지 않는 exports 제거
- [ ] Deprecated 코드 제거
- [ ] 테스트 커버리지 확인

### 문서

- [ ] README.md 최신성
- [ ] docs/ 문서 검토
- [ ] 변경사항 기록

### 빌드

- [ ] 빌드 크기 확인 (예산: 325 KB)
- [ ] Sourcemap 생성 확인
- [ ] 프로덕션 빌드 테스트

### 정리

- [ ] 백업/임시 파일 삭제
- [ ] Git 브랜치 정리
```

---

## 🎯 영역별 가이드

### 1. 문서 (docs/)

**제거 후보**:

- Phase 완료 검증 문서
- 500줄 이상의 비대한 문서 (간소화 필요)
- 임시 실험 문서

**유지 기준**:

- 온보딩 필수 문서 (AGENTS.md, ARCHITECTURE.md)
- 코딩 규칙 (CODING_GUIDELINES.md)
- 히스토리 추적 (TDD_REFACTORING_PLAN_COMPLETED.md)

### 2. 테스트 (test/)

**제거 후보**:

- `.backup-*` 디렉터리 (마이그레이션 완료 후)
- `*.skip.test.ts` (장기간 skip)
- 중복 테스트 파일

**점검 명령**:

```bash
# vitest.config.ts exclude 참조
grep "exclude:" vitest.config.ts
```

### 3. 소스 코드 (src/)

**제거 후보**:

- Deprecated 함수 (3개월 이상)
- 중복 유틸리티
- 사용되지 않는 타입

**점검 명령**:

```bash
# TypeScript unused check
npm run typecheck -- --noUnusedLocals --noUnusedParameters

# 특정 심볼 사용처 확인
git grep -l "symbolName" src/
```

### 4. 설정 파일

**중복 확인**:

- `.eslintignore` vs `eslint.config.js`
- `.prettierignore` vs `.gitignore`

**최신화 체크**:

- ESLint 9+ flat config ✅
- TypeScript 5.x ✅
- Vite 7 ✅

### 5. 의존성

**정기 점검**:

```bash
npm audit                  # 보안
npx npm-check-updates      # 업데이트
npx depcheck               # 미사용 패키지
```

**제거 체크리스트**:

- [ ] devDependencies 미사용 패키지
- [ ] 중복 기능 패키지
- [ ] 불필요한 polyfill
- [ ] dependencies에 있는 테스트 전용 패키지

### 6. GitHub Actions

**최신화**:

- [ ] Actions 버전 (checkout@v4, setup-node@v4)
- [ ] Node.js LTS 버전
- [ ] 캐싱 전략
- [ ] 불필요한 워크플로 제거

---

## 참고 문서

- [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md): 리팩토링 백로그
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 아키텍처 구조
- [DEPENDENCY-GOVERNANCE.md](./DEPENDENCY-GOVERNANCE.md): 의존성 정책

> **자동화 우선**: 수동 점검보다 `npm run maintenance:check` 활용 권장
