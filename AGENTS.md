# xcom-enhanced-gallery • AGENTS.md

> 개발자를 위한 빠른 온보딩 가이드 — 로컬/CI 동일 워크플로

문서 참조: 아키텍처 → `docs/ARCHITECTURE.md`, 코딩 규칙 →
`docs/CODING_GUIDELINES.md`, 벤더 API → `docs/vendors-safe-api.md`

---

## 개발 환경

- **스택**: TypeScript(strict) + Vite 7 + SolidJS 1.9 + Vitest 3(JSDOM)
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
npm run codeql:scan       # 로컬 CodeQL 분석
npm run codeql:dry-run    # 미리보기
```

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
npm run sync:connect      # 분석만
npm run sync:connect:fix  # 자동 수정
```

스캔 대상: `src/constants.ts`, `src/shared/utils/url-safety.ts`,
`src/**/*.{ts,tsx}`

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
npm ci
npm run prepare          # 또는 npx husky
node ./scripts/setup-dev.js
```

### 커밋 메시지 규칙

Conventional Commits 형식: `type(scope): description`

```pwsh
"feat: message" | npx --no-install commitlint --config commitlint.config.cjs
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
