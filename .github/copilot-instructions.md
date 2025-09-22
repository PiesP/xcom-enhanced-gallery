# GitHub Copilot 개발 지침 (xcom-enhanced-gallery)

> Preact + Signals 기반 Userscript 프로젝트를 위한 AI 코딩 가이드 (프로젝트
> 특화, TDD 우선)

## 핵심 스택/워크플로

- Stack: TypeScript(strict) + Vite 7 + Preact 10 + @preact/signals + Vitest
  3(JSDOM)
- Userscript 번들: `vite.config.ts`의 userscript 플러그인이 단일
  파일(`dist/xcom-enhanced-gallery*.user.js`) 생성, Dev는 sourcemap 포함
- 경로 별칭: `@`, `@features`, `@shared`, `@assets` (vite/vitest/tsconfig 일치)
- 스크립트: 타입 `npm run typecheck`, 린트 `npm run lint:fix`, 테스트
  `npm test`/`npm run test:watch`, 빌드 `npm run build:dev|prod`, 종합
  `npm run validate`

## 아키텍처와 경계

- 3 계층: `features/`(도메인 UI/기능) → `shared/`(services/state/utils/logging)
  → `external/`(브라우저/벤더/유저스크립트 어댑터)
- 외부 라이브러리 접근은 오직 getter 경유: `@shared/external/vendors`가 안전
  API를 제공(TDZ-safe, 모킹 용이)
  - 예)
    `const { h, render } = getPreact(); const { signal } = getPreactSignals(); const { zip } = getFflate();`
  - 직접 import 금지: `preact`, `@preact/signals`, `fflate`, `preact/compat`
    등을 코드에서 바로 import 하지 마세요
- Userscript 통합: `shared/external/userscript/adapter.ts`에서 GM\_\* 안전
  래핑(`getUserscript()`), Node/Vitest에서 fallback 제공

### Features 계층 지도와 서비스 경계(요약)

- Features: `gallery/`(주요 UI) · `settings/`(환경설정 UI)
  - 예: `features/gallery/GalleryApp.ts`, `GalleryRenderer.ts`,
    `components/vertical-gallery-view/*`
- Shared Services(순수 로직/API): `shared/services/`
  - Media/다운로드: `MediaService.ts`, `BulkDownloadService.ts`
  - 매핑/추출: `media-extraction/*`, `media-mapping/*`
  - UX: `UnifiedToastManager.ts`, `ThemeService.ts`, `AnimationService.ts`
- State: `shared/state/**`(Signals), 파생값은 `@shared/utils/signalSelector.ts`
- External: `shared/external/vendors/*`(벤더 getter),
  `userscript/adapter.ts`(GM\_\*), `external/zip/zip-creator.ts`
  - 규칙: Features → Shared(Service/State/Utils) → External(어댑터) 단방향 의존

## 상태/UI/스타일 규칙

- 상태: Signals 중심(`src/shared/state/**`, `@shared/utils/signalSelector.ts`
  활용). 컴포넌트에서는 signal selector로 파생값을 메모이즈
- UI: Preact 컴포넌트. 필요 시 `getPreactCompat()`로 `forwardRef`/`memo` 사용
- 입력: PC 전용 이벤트만 사용(설계 원칙). 터치/모바일 제스처는 추가하지 않음
- 스타일: CSS Modules + 디자인 토큰만 사용(`docs/CODING_GUIDELINES.md`) —
  색상/라운드 값 하드코딩 금지, `--xeg-*` 토큰만

### PC 전용 입력 범위(허용/금지)

- 허용: click, keydown/keyup(ArrowLeft/Right, Home/End, Escape, Space), wheel,
  contextmenu, mouseenter/leave/move/down/up
- 금지: 모든 TouchEvent(onTouchStart/Move/End/Cancel), PointerEvent
  전반(pointerdown/up/move/enter/leave/cancel), 제스처 전용 이벤트
- 가이드: 네비게이션 키 처리 시 기본 스크롤 충돌을 피하려면 목적 동작에 한해
  `preventDefault()` 적용
- 테스트: 터치/포인터 사용은 테스트로 RED 대상(`docs/CODING_GUIDELINES.md` 참조)

## 테스트 전략 (TDD)

- 환경: Vitest + JSDOM, 기본 URL `https://x.com`, `test/setup.ts` 자동
  로드(폴리필/GM\_\* 모킹/벤더 초기화)
- 포함 경로: `test/**/*.{test,spec}.{ts,tsx}`. 커버리지/타임아웃/스레드 설정은
  `vitest.config.ts` 참고
- 외부 의존성: 벤더/Userscript/DOM API는 반드시 getter를 통해 주입 가능하게 작성
  → 테스트에서 손쉽게 모킹
- 새 기능은 “실패하는 테스트 → 최소 구현 → 리팩토링” 순서로 진행. 타입은
  명시적으로 선언(strict 유지)

### 테스트 제외(Refactoring) 유지 정책

- 임시 제외만 허용: `vitest.config.ts` exclude 예시 →
  `test/refactoring/event-manager-integration.test.ts`,
  `test/refactoring/service-diagnostics-integration.test.ts`
- 추가/갱신 기준: 반드시 PR/이슈 번호를 주석으로 남기고, 기능 안정화 시 재활성화
  검토
- 재활성화 체크: 단일 파일로 실행해 GREEN 확인 후 exclude에서 제거(예:
  `npx vitest run <file>`)

## 구현 시 필수 컨벤션

- Import 순서: 타입 → 외부 라이브러리 getter → 내부 모듈 → 스타일(자세한 규칙은
  `docs/CODING_GUIDELINES.md`)
- 파일/디렉터리: kebab-case, 경로 별칭 사용
- 로깅: `@shared/logging` 사용. 네트워크/압축/다운로드 등은 적절한 로그 레벨
  적용
- 다운로드/ZIP: `getNativeDownload()`와 `shared/external/zip/zip-creator.ts`
  사용. 직접 `a[href]` 작성 금지(Userscript/브라우저 호환 고려)

## 통합 포인트 예시

- Vendors:
  `import { initializeVendors, getPreact, getPreactSignals, getFflate } from '@shared/external/vendors'`
- Userscript:
  `import { getUserscript } from '@shared/external/userscript/adapter'` →
  `await getUserscript().download(url, name)`/`xhr(...)`
- 상태 선택자:
  `useSignalSelector(signal, selectorFn)`/`useCombinedSelector([...], combiner)`(`@shared/utils/signalSelector.ts`)

## 품질 게이트

- 커밋/PR 전: `npm run typecheck` · `npm run lint:fix` · `npm test` · 필요 시
  `npm run deps:all`
- 빌드 산출물 검증: `npm run build:dev|prod` 후 `scripts/validate-build.js` 자동
  실행

## Git 커밋/푸시 자동화 정책 (Copilot)

코파일럿이 로컬에서 커밋 메시지를 생성하거나 `git commit`/`git push`를 실행하기
전에 반드시 Husky 훅이 정상 동작하는지 확인하고, 훅이 준비된 경우에만 작업을
진행합니다.

- 대상 훅: `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`
- 훅 검증 절차(빠른 체크)
  - 세 훅 파일이 모두 존재하는지 확인합니다.
  - 누락 시 자동 복구를 시도합니다(아래 순서 중 가능한 항목을 적용).
    1. `npm ci`(필요 시 의존성 설치)
    2. `npm run prepare` 또는 `npx husky`로 Husky 초기화
    3. `node ./scripts/setup-dev.js`로 훅/개발 도구 일괄 점검
- 커밋 메시지 작성 규칙
  - `commit-msg` 훅(commitlint) 통과를 목표로 Conventional Commits 형식을
    사용합니다: `type(scope): description`
  - 필요 시 사전 검증: PowerShell 기준 예)
    - `"feat: short message" | npx --no-install commitlint --config commitlint.config.cjs`
    - 또는 `npx --no-install commitlint --from HEAD~1`로 직전 커밋 범위를 점검
- 실행 정책
  - `git commit`은 `pre-commit` 훅이 준비된 상태에서만 시도하고, 실패 시
    린트/포맷을 먼저 수정합니다.
  - `git push`는 `pre-push` 훅(타입 체크 + 테스트)이 통과 가능한 상태에서만
    시도합니다.
- 예외 처리(페일세이프)
  - 훅이 계속 누락되거나 비정상일 경우, 코파일럿은 훅을 우회하지 않고 복구
    절차를 시도한 뒤 원인을 보고합니다(예: Git 설정의 `core.hooksPath` 변경 등).
  - 수동 확인 스니펫(Windows PowerShell):
    - `Test-Path .husky\pre-commit`
    - `Test-Path .husky\commit-msg`
    - `Test-Path .husky\pre-push`

## 빠른 체크리스트 (AI 요청 문구에 포함)

- “TDD로 … 구현”, “getter 함수 사용하여(벤더/유저스크립트)”, “TypeScript strict
  모드로”, “PC 전용 이벤트만”, “테스트와 함께”

의미가 불명확하거나 누락된 규칙이 있으면 알려주세요. 빌드/테스트/디자인 토큰
규칙 등 세부는 `AGENTS.md`와 `docs/CODING_GUIDELINES.md`를 참고해
보완하겠습니다.

## 프롬프트 전처리 규칙 (의도 분석 → 최적화 프롬프트)

모든 Copilot 작업은 실행(파일 편집/터미널/테스트) 전에 다음 전처리를 수행합니다.

- Intent 분석: 요청자의 목표를 1-3문장으로 요약하고, 다음을 추출합니다.
  - 요구사항/제약(스택, 경로 별칭, 계층 경계, Userscript 정책)
  - Acceptance(테스트/빌드/산출물/접근성/이벤트/헤더)
  - 단일 소스 링크: `docs/CODING_GUIDELINES.md`, `docs/vendors-safe-api.md`,
    `AGENTS.md`
- 최적화 프롬프트 도출: 실행 계획을 간결히 재정의합니다.
  - 목표(1-3줄), 불변 Acceptance, 성공 지표(GREEN: 타입/린트/테스트/빌드)
  - 저리스크 가정 1-2개만 선언하고 즉시 코드/문서로 검증
  - 경계 확인: Features → Shared → External 단방향, 벤더 접근은 getter만
- 계획/추적: 작업 시작 전 Todo 작성 → 첫 항목 in-progress 설정.
  - 작은 단위로 분해, 각 항목 완료 즉시 완료 처리(배치 금지)
  - 도구 호출 전 배치 요약(목적/실행/예상 결과 1줄) 기입
- 컨텍스트 수집: 큰 의미 블록 중심으로 읽기, 시맨틱/grep 검색 병행.
  - 중복 호출 지양, 외부 네트워크/비밀 유출 금지
  - Userscript API는 `@shared/external/userscript/adapter` 경유
- 실행: TDD — RED(실패 테스트) → GREEN(최소 구현) → REFACTOR.
  - PC 전용 입력만 사용(터치/포인터 금지, 위반 시 테스트 RED)
  - 벤더 접근은 오직 `@shared/external/vendors`의 getter 사용
- 리포팅: 3~5회 도구 호출마다 핵심 결과와 다음 액션 2-3줄 요약, 변경 파일 요약.
- 종료 전 품질 게이트 요약: Build/Lint/Typecheck/Tests TRIAGE + 요구사항
  커버리지.
  - 산출물 정책(단일 파일, 소스맵 주석, 헤더) 준수 여부 명시

참고: 본 섹션은 전처리의 단일 소스입니다. 다른 문서의 요약과 불일치 시 본 섹션을
기준으로 정정합니다.
