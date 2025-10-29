# 🔧 유지보수 가이드

> 프로젝트를 최신 상태로 유지하기 위한 가이드

## 🤖 자동화 스크립트

```bash
npm run maintenance:check
```

**점검 항목**:

- 보안 취약점 (`npm audit`)
- 보안 정적 분석 (CodeQL, 선택사항)
- Git 추적되지 않는 파일
- 백업 디렉터리 (`.backup-*`, `tmp/`)
- 큰 문서 (500줄 이상)
- 빌드 크기 예산 (325 KB)
- 테스트 통과율

**참고**: CodeQL은 로컬에서 선택사항입니다. CI에서 필수로 실행되므로 로컬 점검은
빠른 피드백용입니다.

---

## 📋 정기 점검 항목

### 필수

- [ ] `npm audit` - 보안 취약점 (npm 패키지)
- [ ] `npm run codeql:check` - 보안 정적 분석 (선택사항, CI에서 필수 실행)
- [ ] `npm test` - 테스트 통과
- [ ] `npm run build` - 빌드 크기
- [ ] 임시 디렉터리 정리: `docs/temp/`, `scripts/temp/`

### 선택

- [ ] `npx npm-check-updates` - 의존성 업데이트
- [ ] `npx depcheck` - 사용되지 않는 의존성
- [ ] 테스트 커버리지: `npm run test:coverage`
- [ ] 번들 분석: `npx vite-bundle-visualizer`

---

## 🧹 정리 가이드

### 문서 (docs/)

- Phase 완료 문서는 `archive/`로 이동
- 500줄 이상 문서는 분리 검토
- `docs/temp/`의 임시 파일 정리

### 테스트 (test/)

- `.backup-*` 디렉터리 제거
- 장기간 skip된 테스트 제거 또는 수정

### 소스 코드 (src/)

- Deprecated 함수 제거
- 사용되지 않는 export 정리

### 의존성

```bash
npm audit                  # 보안
npx npm-check-updates      # 업데이트
npx depcheck               # 미사용 패키지
```

---

## 📂 문서 및 스크립트 관리 정책

### 디렉터리 구조

```
docs/
  ├── *.md        # 핵심 문서 (Git 추적)
  ├── archive/    # 완료된 문서 (Git 무시)
  └── temp/       # 임시 문서 (Git 무시)

scripts/
  ├── *.js        # 항구적 스크립트 (Git 추적)
  └── temp/       # 임시 스크립트 (Git 무시)
```

### 문서 및 스크립트 관리

**문서 라이프사이클**:

1. `docs/temp/` - 초안 작성
2. `docs/` - 확정 (Git 추적)
3. `docs/archive/` - 완료 (Git 무시)

**스크립트 라이프사이클**:

1. `scripts/temp/` - 실험
2. `scripts/` - 승격 (재사용 가능)

**정리 주기**: 작업 완료 시 임시 파일 정리

---

## 참고 문서

- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 아키텍처 구조
- [DEPENDENCY-GOVERNANCE.md](./DEPENDENCY-GOVERNANCE.md): 의존성 정책
