# xcom-enhanced-gallery • AGENTS.md

개발자가 빠르게 온보딩하고, 로컬/CI에서 동일한 워크플로로 작업할 수 있도록
정리한 프로젝트 실행 가이드입니다.

## 개발 환경

- 패키지 매니저: npm (단일 패키지)
- Node.js: 20 권장 (CI는 18/20/22에서 검증)
- 번들러: Vite 7, 프레임워크: Preact 10, 테스트: Vitest 3 + JSDOM
- 타입 경로 별칭(ts/vite): `@`, `@features`, `@shared`, `@assets`
- 코딩 규칙: `docs/CODING_GUIDELINES.md`를 항상 준수 (디자인 토큰, 벤더 getter,
  PC 전용 이벤트, TDD 우선)

설치

```pwsh
npm ci
```

Windows PowerShell에서도 위 명령 그대로 사용 가능합니다.

## 자주 쓰는 스크립트

- 타입 체크: `npm run typecheck`
- 린트(수정 포함): `npm run lint` / `npm run lint:fix`
- 포맷: `npm run format`
- 테스트:
  - 전체: `npm test` (vitest run)
  - 워치: `npm run test:watch`
  - 커버리지: `npm run test:coverage`
  - UI: `npm run test:ui`
- 빌드:
  - 개발: `npm run build:dev`
  - 프로덕션: `npm run build:prod`
  - 전체(클린 포함): `npm run build` → dev와 prod 연속 빌드 후 `postbuild` 검증
    실행
- 종합 검증: `npm run validate` → typecheck + lint:fix + format

의존성 그래프/검증 (dependency-cruiser)

- JSON/그래프/검증 일괄: `npm run deps:all`
- 산출물 위치: `docs/dependency-graph.(json|dot|svg)`

## 테스트 가이드 (Vitest)

- 환경: JSDOM, 기본 URL `https://x.com`, 격리 실행, `test/setup.ts` 자동 로드
- 실행 타임아웃: 테스트 20s, 훅 25s (장시간 I/O 모킹 시 유의)
- 테스트 포함 경로: `test/**/*.{test,spec}.{ts,tsx}`
- 일부 리팩터링 테스트는 임시 제외됨(워크플로 파일 참고)

유용한 실행 패턴

```pwsh
# 특정 테스트 이름으로 필터
npm run test -- -t "<test name>"

# 특정 파일만 실행
npx vitest run test/path/to/file.test.ts
```

주의

- 변경 시 반드시 관련 테스트를 추가/수정하세요. 커버리지 리포트는 `coverage/`에
  생성됩니다.
- PC 전용 입력/디자인 토큰/벤더 getter 규칙 위반은 테스트로 RED가 됩니다.

## 빌드/검증 플로우

로컬

```pwsh
# 타입/린트/포맷 일괄
npm run validate

# 개발/프로덕션 빌드 및 산출물 검증
npm run build:dev
npm run build:prod
node ./scripts/validate-build.js
```

CI

- 워크플로: `.github/workflows/ci.yml`
- Node 18/20/22 매트릭스에서 다음을 수행:
  - typecheck → lint → prettier check → 테스트(20에서는 커버리지)
  - dev/prod 빌드 후 `scripts/validate-build.js`로 산출물 검증
  - 커버리지/빌드 아티팩트 업로드

보안/라이선스

- 워크플로: `.github/workflows/security.yml`
- `npm audit`와 라이선스 보고서 업로드를 자동화

릴리즈

- 워크플로: `.github/workflows/release.yml`
- master로의 버전 변경(또는 수동 트리거) 시 프로덕션 빌드, 산출물 검증, GitHub
  Release 생성
- 릴리즈 산출물: `xcom-enhanced-gallery.user.js`, `checksums.txt`,
  `metadata.json`

## PR 규칙

- 제목: `[xcom-enhanced-gallery] <Title>`
- 머지 전 필수: `npm run typecheck` / `npm run lint` / `npm test`
- 스타일/토큰/접근성은 `docs/CODING_GUIDELINES.md`와 테스트 스위트 기준을
  따릅니다.

## 트러블슈팅 팁

- 훅/테스트 타임아웃: 테스트가 느릴 경우 `-t`로 범위를 좁히거나
  네트워크/타이머를 모킹하세요.
- Git hooks 미작동: 최초 설치 후 `npm ci`가 Husky 훅을 준비합니다(로컬 Git이
  필요).
- 경로 별칭 오류: TS/Vite/테스트 설정의 alias가 일치하는지
  확인하세요(`vitest.config.ts`의 `resolve.alias`).

---

추가 세부 가이드는 `docs/` 폴더와 각 스크립트(`scripts/`)를 참고하세요. 변경
시에는 관련 테스트와 문서를 함께 업데이트해 주세요.
