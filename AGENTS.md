# xcom-enhanced-gallery • AGENTS.md

> 개발자를 위한 빠른 온보딩 가이드 — 로컬/CI 동일 워크플로

**목적**: X.com(구 Twitter) 미디어 뷰어/다운로더 Userscript 프로젝트 **버전**:
0.2.4 **문서 참조**: 아키텍처 → `docs/ARCHITECTURE.md`, 코딩 규칙 →
`docs/CODING_GUIDELINES.md`, 벤더 API → `docs/vendors-safe-api.md`

---

## 개발 환경

- **스택**: TypeScript 5.9 (strict) + Vite 7 + SolidJS 1.9 + Vitest 3 (JSDOM)
- **패키지 매니저**: npm (단일 패키지)
- **Node.js**: 20 권장 (CI는 20/22 검증)
- **경로 별칭**: `@`, `@features`, `@shared`, `@assets`

```pwsh
npm ci
```

---

## 핵심 스크립트

### 개발

```pwsh
npm run typecheck         # 타입 체크
npm run lint:fix          # 린트 + 자동 수정
npm run format            # Prettier 포맷
npm run validate          # 종합 검증 (typecheck + lint + format)
```

### 테스트

```pwsh
npm test                  # 전체 테스트
npm run test:watch        # watch 모드
npm run test:coverage     # 커버리지 리포트
npm run test -- -t "..."  # 특정 테스트 필터
npx vitest run <file>     # 특정 파일만 실행
```

- 환경: JSDOM, 기본 URL `https://x.com`, `test/setup.ts` 자동 로드
- 타임아웃: 테스트 20s, 훅 25s

### 빌드

```pwsh
npm run build:dev         # 개발 빌드 (소스맵 주석 포함)
npm run build:prod        # 프로덕션 빌드 (최적화)
npm run build             # dev + prod 연속 빌드 + 검증
```

산출물:

- dev: `dist/xcom-enhanced-gallery.dev.user.js` + `.map`
- prod: `dist/xcom-enhanced-gallery.user.js` + `.map`
- 검증: `scripts/validate-build.js` 자동 실행

### 번들 크기 검증

```pwsh
# 번들 크기 확인
Get-ChildItem dist -File | Select-Object Name, @{Name="SizeKB";Expression={[math]::Round($_.Length/1KB, 2)}}

# 번들 최적화 테스트 실행
npx vitest run test/architecture/bundle-size-optimization.contract.test.ts

# 상한선 확인 (회귀 방지)
# Raw: 495.19 KB ≤ 473 KB (목표 초과 22 KB) ⚠️
# Gzip: 123.73 KB ≤ 118 KB (목표 초과 5.73 KB) ⚠️
```

**목표**:

- Raw 크기: ≤473 KB (현재: 495.19 KB, **22 KB 초과** ⚠️)
- Gzip 크기: ≤118 KB (현재: 123.73 KB, **5.73 KB 초과** ⚠️)
- 향후 이상적 목표: Raw 420 KB, Gzip 105 KB

---

## CI/CD

### CI (`ci.yml`)

Node 20/22 매트릭스:

1. typecheck → lint → prettier check
2. 테스트 (Node 20에서 커버리지)
3. dev/prod 빌드 + 산출물 검증 (`scripts/validate-build.js`)
4. 커버리지/아티팩트 업로드

### 보안 (`security.yml`)

- `npm audit` + 라이선스 보고서
- CodeQL 스캔 (SARIF + 요약 + 개선 계획 업로드)

```pwsh
npm run codeql:scan       # 로컬 CodeQL 분석 (Fallback 쿼리 팩 자동 전환)
npm run codeql:dry-run    # 미리보기
```

**로컬 환경 제약**:

- **표준 쿼리 팩** (`codeql/javascript-security-and-quality`): GitHub Advanced
  Security 전용 (403 Forbidden)
- **Fallback 쿼리 팩** (`codeql/javascript-queries`): 로컬 환경에서 사용 가능
  (50+ 규칙)
- **자동 전환**: 표준 쿼리 팩 접근 실패 시 Fallback으로 자동 전환

**CI 환경**:

- GitHub Code Scanning: 표준 쿼리 팩 자동 제공 (400+ 보안 규칙)
- SARIF 업로드: `github/codeql-action/upload-sarif@v3`
- 역할 분리: Vitest (프로젝트 정책), CodeQL (보안 취약점)

**로깅 개선** (2025-10-05):

- Fallback 전환 시 명확한 가이드 제공
- 쿼리 팩 종류 자동 감지 (표준/Fallback/커스텀)
- 예상 규칙 수 표시 (표준: 400+, Fallback: 50+)
- 환경별 트러블슈팅 힌트 제공

**상세 가이드**: [`docs/CODEQL_LOCAL_GUIDE.md`](docs/CODEQL_LOCAL_GUIDE.md)

### 릴리즈 (`release.yml`)

master 브랜치 버전 변경 시:

1. 프로덕션 빌드 + 검증
2. GitHub Release 생성
3. 산출물: `xcom-enhanced-gallery.user.js`, `checksums.txt`, `metadata.json`,
   CodeQL 리포트

---

## 도구

### 의존성 그래프

```pwsh
npm run deps:all          # JSON/DOT/SVG 생성 + 룰 검증
```

산출물: `docs/dependency-graph.(json|dot|svg|html)`

### @connect 헤더 동기화

코드에서 사용하는 외부 호스트를 `vite.config.ts`의 @connect 헤더와 자동 동기화:

```pwsh
npm run sync:connect        # 분석만
npm run sync:connect:fix    # 자동 수정
```

스캔 대상: `src/constants.ts`, `src/shared/utils/url-safety.ts`,
`src/**/*.{ts,tsx}`

### 아이콘 사용 분석

코드베이스 전체에서 아이콘 사용 패턴을 분석:

```pwsh
npm run icon:audit          # 콘솔 출력 (Markdown)
npm run icon:audit:json     # JSON 형식
npm run icon:audit:save     # docs/icon-usage-report.md 저장
```

분석 항목: 사용처, 중복 사용, 미사용 아이콘, 빈도 통계

### CodeQL 분석

```pwsh
npm run codeql:scan         # 로컬 분석 (Fallback 쿼리 팩 자동 전환)
npm run codeql:dry-run      # 미리보기
```

산출물: SARIF, 요약 CSV, 개선 계획 마크다운

**로컬 환경 특징**:

- **자동 Fallback 전환**: 표준 쿼리 팩 접근 실패 시 자동으로 Fallback 쿼리 팩
  사용
- **명확한 로깅**: 전환 사유, 쿼리 팩 종류, 예상 규칙 수 표시
- **환경 감지**: 표준/Fallback/커스텀 쿼리 팩 자동 감지
- **트러블슈팅**: 에러 발생 시 환경별 가이드 제공

**쿼리 팩 정보**:

| 환경 | 쿼리 팩                                  | 규칙 수 | 접근 권한                     |
| ---- | ---------------------------------------- | ------- | ----------------------------- |
| 로컬 | `codeql/javascript-queries`              | 50+     | 무료                          |
| CI   | `codeql/javascript-security-and-quality` | 400+    | GitHub Advanced Security 필요 |

**상세 가이드**: [`docs/CODEQL_LOCAL_GUIDE.md`](docs/CODEQL_LOCAL_GUIDE.md)

### Codemod 도구

```pwsh
npm run codemod:solid-native        # SolidJS Native 패턴 미리보기
npm run codemod:solid-native:apply  # SolidJS Native 패턴 적용
npm run codemod:legacy:dry-run      # 레거시 패턴 분석
npm run codemod:legacy:apply        # 레거시 패턴 마이그레이션
```

---

## Git Hooks (Husky)

필수 훅: `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`

### 빠른 체크 (PowerShell)

```pwsh
Test-Path .husky\pre-commit
Test-Path .husky\commit-msg
Test-Path .husky\pre-push
```

### 복구

```pwsh
npm ci                      # 의존성 재설치
npm run prepare             # Husky 초기화
node ./scripts/setup-dev.js # 개발 도구 일괄 점검
```

### 커밋 메시지 규칙

Conventional Commits 형식: `type(scope): description`

**type**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`

**예시**:

```text
feat(gallery): add keyboard navigation
fix(download): handle URL encoding errors
refactor(state): migrate to SolidJS native signals
```

**사전 검증**:

```pwsh
"feat: message" | npx --no-install commitlint --config commitlint.config.cjs
npx --no-install commitlint --from HEAD~1
```

### Pre-push 테스트

`TEST_SKIP_BUILD=true` 플래그로 빌드 생략. 번들/문서 최신화가 필요하면 별도로
`npm run build` 실행.

---

## Copilot 프롬프트 전처리 정책

자동화 작업은 실행 전에 요청 의도를 분석하고 최적화된 프롬프트를 도출합니다.

**핵심 프로세스**:

1. Intent 분석: 목표/요구사항/Acceptance 추출
2. 최적화 프롬프트: 목표/성공 지표(GREEN) 정리
3. 계획/추적: Todo 작성 → in-progress → 완료 즉시 체크
4. 컨텍스트 수집: 큰 블록 위주, 중복 방지
5. 실행: TDD(RED→GREEN→REFACTOR), PC 전용 입력, 벤더 getter만
6. 리포팅: 3~5회 도구 호출마다 요약, 종료 전 품질 게이트 명시

상세: `.github/copilot-instructions.md` "프롬프트 전처리 규칙" 섹션

---

## PR 규칙

- 제목: `[xcom-enhanced-gallery] <Title>`
- 머지 전 필수: `npm run typecheck` / `npm run lint` / `npm test`
- 스타일/토큰/접근성: `docs/CODING_GUIDELINES.md` + 테스트 스위트 기준

---

## 트러블슈팅

- **훅/테스트 타임아웃**: `-t`로 범위 좁히기, 네트워크/타이머 모킹
- **Git hooks 미작동**: `npm ci` 후 훅 자동 설정 (로컬 Git 필요)
- **경로 별칭 오류**: TS/Vite/테스트 설정의 alias 일치 확인 (`vitest.config.ts`)

---

추가 세부 가이드: `docs/` 폴더 및 `scripts/` 참고. 변경 시 관련 테스트와 문서
함께 업데이트하세요.
