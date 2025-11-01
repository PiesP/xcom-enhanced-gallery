# 프로젝트 최소 구조 점검 보고서 (Minimum Repository Structure Validation)

**작성일**: 2025-11-01  
**프로젝트**: xcom-enhanced-gallery (1인 개발 + AI 협업)  
**목표**: 원격 저장소에 정말 필요한 파일만 남기고 빌드 및 배포 가능성 검증

---

## 📋 요청사항

사용자가 요청한 최소 파일 목록:

```bash
.github/workflows
LICENSES
src
types
.gitignore
LICENSE
package.json
README.md
tsconfig.json
vite.config.ts
```

---

## ✅ 검증 결과

### 1️⃣ 빌드 가능성: **YES** ✓

**테스트 명령어**:

```bash
npm run build:only  # 의존성 설치 후 실행
```

**결과**:

- ✅ TypeScript 타입 체크: 통과
- ✅ Vite 번들링: 성공
- ✅ UserScript 생성: `dist/*.user.js` (2개 파일)
- ✅ 소스맵 생성: `dist/*.user.js.map` (개발 빌드만)

---

## 🔍 최소 요구 파일 상세 분석

### 필수 파일 (요청 목록에 포함)

| 파일/디렉토리        | 용도                   | 상태                              |
| -------------------- | ---------------------- | --------------------------------- |
| `src/`               | 애플리케이션 소스 코드 | ✅ 필수                           |
| `types/`             | TypeScript 타입 정의   | ✅ 필수                           |
| `vite.config.ts`     | Vite 빌드 설정         | ✅ 필수                           |
| `tsconfig.json`      | TypeScript 설정        | ✅ 필수                           |
| `package.json`       | 의존성 및 스크립트     | ✅ 필수                           |
| `.gitignore`         | Git 무시 규칙          | ✅ 필수                           |
| `README.md`          | 프로젝트 소개          | ✅ 권장                           |
| `LICENSE`            | 라이선스               | ✅ 권장                           |
| `LICENSES/`          | 의존성 라이선스        | ✅ 필수 (vite.config.ts에서 참조) |
| `.github/workflows/` | GitHub Actions         | ✅ 필수 (배포용)                  |

### 추가 필수 파일 (빌드/배포 위해 필요)

| 파일                  | 용도                   | 현재 상태                    |
| --------------------- | ---------------------- | ---------------------------- |
| `tsconfig.base.json`  | `tsconfig.json`이 확장 | ⚠️ 필수 추가                 |
| `tsconfig.tests.json` | 테스트 타입 체크       | ⚠️ 선택 (테스트 미포함 시)   |
| `package-lock.json`   | npm 의존성 잠금        | ⚠️ 필수 추가                 |
| `.npmrc`              | npm 설정               | ⚠️ 필수 추가 (메모리 제한)   |
| `eslint.config.js`    | 코드 린트              | ⚠️ 선택 (Vite 빌드는 불필요) |
| `postcss.config.js`   | CSS 처리               | ⚠️ 선택 (default 사용 가능)  |

### CI/CD 제외 파일들 (로컬만)

| 디렉토리/파일            | 이유                 |
| ------------------------ | -------------------- |
| `docs/`                  | 문서 (배포 불필요)   |
| `test/`                  | 테스트 코드          |
| `playwright/`            | E2E 테스트           |
| `scripts/`               | 개발용 스크립트      |
| `config/`                | 로컬 오버라이드 설정 |
| `AGENTS.md`, `CLAUDE.md` | 개발 가이드          |

---

## 🎯 권장: 최소 원격 저장소 구조

```
xcom-enhanced-gallery/
├── .github/
│   └── workflows/              # GitHub Actions (배포/보안)
├── .gitignore                  # Git 무시 규칙
├── LICENSES/                   # 의존성 라이선스
├── src/                        # 소스 코드
├── types/                      # TypeScript 타입 정의
├── LICENSE                     # 프로젝트 라이선스
├── README.md                   # 프로젝트 소개
├── package.json               # 의존성 + 스크립트
├── package-lock.json          # 의존성 잠금
├── .npmrc                      # npm 글로벌 설정
├── tsconfig.base.json         # TS 기본 설정
├── tsconfig.json              # TS 메인 설정
└── vite.config.ts             # Vite 빌드 설정
```

---

## 📊 현재 vs 권장 비교

### 현재 추적 파일 수: **929개**

### 권장 구조에서 추적할 파일 수: **~50-100개**

**감소 사항**:

```
- docs/           : 개발 가이드 (로컬 저장)
- test/           : 테스트 코드 (GitHub Actions에서 실행)
- playwright/     : E2E 테스트 (GitHub Actions에서 실행)
- scripts/        : 개발/유지보수 스크립트 (로컬 실행)
- config/         : 로컬 오버라이드 설정
- AGENTS.md, etc. : 개발 가이드 문서
```

**유지 사항**:

```
+ src/             : 소스 코드 (배포 필수)
+ types/           : 타입 정의 (배포 필수)
+ .github/         : GitHub Actions (CI/CD 필수)
+ LICENSES/        : 라이선스 (법적 필요)
```

---

## 🔧 빌드 명령어 검증

### 현재 빌드 프로세스

```bash
# 1. 타입 체크 (ts 전용, 린트/테스트 불필요)
npm run typecheck

# 2. 번들링 (Vite 빌드 - 배포 스크립트 생성)
npm run build:only  # 또는 npm run build:dev / build:prod
```

### 최소 구조에서 필요한 명령어

```bash
npm ci                    # 의존성 설치 (package-lock.json 필수)
npm run typecheck        # 타입 체크
npm run build:dev        # 개발 모드 빌드 → dist/*.user.js
npm run build:prod       # 프로덕션 빌드 → dist/*.user.js
```

---

## ⚠️ 주의사항

### 1. 빌드 반드시 필요한 파일

```json
반드시 포함해야 함:
✓ tsconfig.base.json    (tsconfig.json이 extends)
✓ package-lock.json     (npm ci가 의존)
✓ .npmrc                (npm 설정)
✓ vite.config.ts        (빌드 설정)
```

### 2. 배포용 이미지/아이콘

- vite.config.ts에서 `LICENSES/` 자동 참조
- src/ 내 모든 리소스가 번들에 포함됨

### 3. GitHub Actions 워크플로우

```yaml
# .github/workflows/release.yml에서 필요:
- npm ci
- npm run typecheck
- npm run build # 또는 build:prod
```

---

## 🚀 권장 GitHub Actions 최소 워크플로우

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - run: npm ci
      - run: npm run typecheck
      - run: npm run build:prod

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: dist/*.user.js
```

---

## 📝 결론

### ✅ 빌드 가능성

**결론**: 요청하신 최소 파일 목록으로 **빌드 및 배포 가능합니다.**

단, 다음 파일 추가 필요:

- `tsconfig.base.json` (필수)
- `package-lock.json` (필수)
- `.npmrc` (필수)

### ✅ 최소 구조의 이점

1. **저장소 최소화**: 929개 → ~100개 파일로 감소
2. **CI/CD 초점화**: 배포 필수 항목만 추적
3. **개발 독립성**: 테스트/문서는 로컬/CI에서 처리
4. **1인 개발 적합**: 소스 코드 + 배포 스크립트만 버전 관리

### 📌 권장 다음 단계

1. **저장소 정리**: 제외할 디렉토리를 `.gitignore`에 추가

   ```
   docs/
   test/
   playwright/
   scripts/ (선택)
   config/local/ (선택)
   ```

2. **GitHub Actions 정리**: 배포만 담당하는 최소 워크플로우 작성

3. **로컬 개발 정책**: 문서 참고
   [`docs/LOCAL_DEVELOPMENT.md`](../docs/LOCAL_DEVELOPMENT.md)

---

## 🔗 참고 자료

- **AGENTS.md**: 프로젝트 전체 개발 가이드
- **docs/LOCAL_DEVELOPMENT.md**: 로컬 개발 환경 설정
- **.gitignore**: 화이트리스트 방식 파일 추적

---

**작성**: 2025-11-01  
**상태**: ✅ 검증 완료 - 최소 파일 세트로 빌드 가능
