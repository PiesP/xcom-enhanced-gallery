# xcom-enhanced-gallery • AGENTS.md

개발자가 빠르게 온보딩하고, 로컬/CI에서 동일한 워크플로로 작업할 수 있도록
정리한 프로젝트 실행 가이드입니다.

## 개발 환경

- 패키지 매니저: npm (단일 패키지)
- Node.js: 20 권장 (CI는 20/22에서 검증)
- 번들러: Vite 7,## PR 규칙

- 제목: `[xcom-enhanced-gallery] <Title>`
- 머지 전 필수: `npm run typecheck` / `npm run lint` / `npm test`
- 스타일/토큰/접근성은 `docs/CODING_GUIDELINES.md`와 테스트 스위트 기준을
  따릅니다.
  - PR 설명에 다음 확인 사항을 포함해 주세요:
    - 최소 컨텍스트 제공(파일 경로/타입/제약/수용 기준)
    - "한 줄 구조 리팩토링"/최소 diff 원칙 적용 여부
    - vendors/Userscript getter 사용, PC 전용 이벤트, 디자인 토큰 준수 여부
    - RED→GREEN 테스트 링크 또는 요약

## 최근 완료된 작업 (2025-10-08)

### Phase 9.5: vitest.config.ts 전면 재작성 및 Solid JSX Transform 해결 ✅

**배경**: 240개 테스트가 "React is not defined" 오류로 실패. vitest.config.ts가
348줄로 과도하게 복잡했고, vite-plugin-solid가 JSX transform을 적용하지 않음.

**해결 방법**:

- solidjs/solid-start 프로젝트의 간단한 패턴 참고
- vitest.config.ts 전면 재작성 (348줄 → 70줄, 80% 감소)
- `solid()` 플러그인을 옵션 없이 사용
- 명시적 resolve.alias 추가

**결과**:

- ✅ JSX transform 문제 해결 (핵심 목표)
- ✅ 테스트 pass rate: 28% → 79% (+175% 증가)
- ✅ Passing files: 107 → 294 (+187 files)
- ✅ 빌드 성공: Dev 1,031.79 KB, Prod 331.86 KB

**Vitest 설정 패턴**:

```typescript
plugins: [
  solid(), // 옵션 없음 - solid-start 패턴
  tsconfigPaths({ projects: ['tsconfig.json'] }),
];
```

**교훈**:

- 단순함이 최고: 복잡한 설정보다 공식 예제의 간단한 패턴이 효과적
- 플러그인 옵션 주의: 과도한 옵션이 오히려 동작을 방해할 수 있음
- 공식 예제 참조: solidjs/solid-start 같은 공식 프로젝트가 가장 신뢰할 수 있는
  레퍼런스

**상세 문서**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 9.5 참조

### Phase 9.3 & 9.4: Solid.js Show 컴포넌트 중첩 제거 ✅

**배경**: 설정 버튼 클릭 시 모달이 표시되지 않는 문제 발견 및 전체 프로젝트
Solid.js 패턴 스캔 수행

**해결한 문제**:

- Phase 9.3: ToolbarWithSettings ↔ SettingsModal Show 중첩 제거
- Phase 9.4: SettingsModal ↔ ModalShell Show 중첩 제거

**Solid.js 베스트 프랙티스 적용**:

- Show 컴포넌트는 중첩하지 않음
- 각 컴포넌트는 자신의 렌더링 조건만 관리
- 부모는 자식의 가시성 조건을 중복 평가하지 않음

**검증 완료**:

- Show 사용 패턴 스캔: 6개 검토, 2개 수정
- Vendors getter 규칙: 전체 준수 확인
- 빌드: Dev 1,114.75 KB / Prod 331.17 KB
- 의존성: 249 modules, 699 dependencies (위반 없음)

**상세 문서**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 9.3, 9.4 참조

## 트러블슈팅 팁id.js 1.9\*\*, 테스트: Vitest 3 + JSDOM

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
  - 커버리지: `npm run test:coverage` (사전 단계: `pretest:coverage`가 프로덕션
    빌드를 수행)
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

### 분할 실행(Projects)

대규모 스위트는 Vitest projects로 분할되어 있으며, `vitest.config.ts`의 최상위
`projects` 필드에 정의되어 있습니다. `vitest --project <name>` 필터로 선택
실행할 수 있습니다.

- smoke: 초고속 스모크(구성/토큰 가드)
- fast: 빠른 단위 테스트(RED/벤치/퍼포먼스 제외)
- unit: 단위 전체
- styles: 스타일/토큰/정책 전용
- performance: 성능/벤치 전용
- phases: 단계별(phase-\*)/최종 스위트
- refactor: 리팩토링 진행/가드

실행 방법

```pwsh
# 프로젝트 직접 지정
vitest --project smoke run

# npm 스크립트 단축키 권장
npm run test:smoke
npm run test:fast
npm run test:unit
npm run test:styles
npm run test:perf
npm run test:phases
npm run test:refactor
```

유용한 실행 패턴

```pwsh
# 특정 테스트 이름으로 필터
npm run test -- -t "<test name>"

# 특정 파일만 실행
npx vitest run test/path/to/file.test.ts
```

로컬 푸시 가속(선택):

```pwsh
# Pre-push 훅은 기본으로 'smoke' 프로젝트만 실행합니다. 아래처럼 스코프를 바꿀 수 있습니다.
# PowerShell
$env:XEG_PREPUSH_SCOPE = 'full'   # 전체 스위트 실행 예시
git push

# Bash/Zsh
export XEG_PREPUSH_SCOPE=smoke    # 기본 smoke 유지 예시
git push

# 사용 가능한 값: smoke | fast | unit | styles | performance | phases | refactor | full(all)
# 기본은 smoke 입니다. 전체 스위트를 실행하려면 'full' 또는 'all'을 사용하세요.
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
- Node 20/22 매트릭스에서 다음을 수행:
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

## AI 협업/토큰 절약 워크플로 (ModGo 적용)

ModGo 실험에서 확인된 “구조가 좋을수록 동일 지시에서도 토큰 사용이 크게
줄어든다”는 결과를 팀 워크플로에 반영합니다. 세부 작업 지침은
`.github/copilot-instructions.md`의 “토큰/맥락 최적화 가이드”를 참고하세요.

핵심 원칙

- 구조 우선: 기능 작업 전 3계층 경계(Features → Shared → External)와 vendors
  getter 규칙을 먼저 정리합니다.
- 최소 컨텍스트: 요청/PR에는 영향 파일 경로(3–7개), 핵심 타입/시그니처,
  제약(벤더 getter/PC-only/토큰 규칙)만 요약해 제공합니다.
- 최소 diff: 큰 파일 전체 붙여넣기 대신 변경 diff만 제시합니다.
- TDD 실행: 실패 테스트 → 최소 구현 → 리팩토링으로 RED→GREEN 흐름을 짧게
  보고합니다.
- 정책 준수: PC 전용 이벤트만 사용, CSS Modules + 디자인 토큰만 사용, 외부
  라이브러리는 vendors getter 경유.

한 줄 구조 리팩토링 템플릿(프로젝트 맞춤)

- Services/로직: “Refactor <기능> 동작은 Strategy, 생성은 Factory로 분리하고
  구현을 `shared/services/<domain>/**`로 이동. 외부 의존은 `@shared/external/*`
  getter 경유. Vitest 추가/갱신. strict TS/alias 유지.”
- UI/Features: “Split <컴포넌트> into container(pure wiring) and
  presentational(view). 상태는 `shared/state/**` Signals로 이동하고
  `@shared/utils/signalSelector` 사용. PC 전용 이벤트만, CSS Modules + 디자인
  토큰만.”

요청/PR 최소 컨텍스트 패키지

- 파일 경로 목록(3–7개)
- 관련 타입/시그니처(입력/출력/에러 모드) 2–4줄 요약
- 제약 요약: vendors getter, PC-only, 디자인 토큰, TDD
- 수용 기준(3–5줄): 어떤 테스트가 추가/수정되고 무엇이 GREEN이어야 하는지

## PR 규칙

- 제목: `[xcom-enhanced-gallery] <Title>`
- 머지 전 필수: `npm run typecheck` / `npm run lint` / `npm test`
- 스타일/토큰/접근성은 `docs/CODING_GUIDELINES.md`와 테스트 스위트 기준을
  따릅니다.
  - PR 설명에 다음 확인 사항을 포함해 주세요:
    - 최소 컨텍스트 제공(파일 경로/타입/제약/수용 기준)
    - “한 줄 구조 리팩토링”/최소 diff 원칙 적용 여부
    - vendors/Userscript getter 사용, PC 전용 이벤트, 디자인 토큰 준수 여부
    - RED→GREEN 테스트 링크 또는 요약

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
