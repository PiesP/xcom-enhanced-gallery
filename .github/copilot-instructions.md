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
    `const { h, render } = getPreact(); const { signal } = getPreactSignals();`
  - 직접 import 금지: `preact`, `@preact/signals`, `preact/compat` 등을 코드에서
    바로 import 하지 마세요
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
  `import { initializeVendors, getPreact, getPreactSignals } from '@shared/external/vendors'`
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

## 토큰/맥락 최적화 가이드(ModGo 실험 적용)

ModGo의 “구조적 리팩토링 후 동일 프롬프트 재실행 시 토큰 사용이 최대 37.91%
감소” 관찰을 본 프로젝트 운영 규칙에 적용합니다. 목표는 “적은 맥락으로 더 정확한
변경”입니다.

### 원칙(구조 우선 → 기능)

- 구조가 곧 맥락 압축입니다. 코드는 3계층 경계(Features → Shared → External)와
  vendors getter 규칙을 엄격히 따르도록 먼저 정리하세요.
- 새로운 기능/수정 요청 전, 필요하다면 “한 줄 구조 리팩토링”을 먼저 수행해 파일
  단위·역할 단위로 분리합니다.
- 단일 파일 대용량 편집 대신, 작은 모듈에 걸친 최소 diff만 제안하세요.

### 한 줄 구조 리팩토링 템플릿(프로젝트 맞춤)

- Services/로직 공통: “Refactor <기능명> 동작은 Strategy 패턴으로, 생성은
  Factory 패턴으로 분리하고, 구현을 `shared/services/<domain>/**`로 이동. 외부
  의존은 `@shared/external/*` getter를 경유. 관련 테스트(Vitest) 추가/갱신. 경로
  별칭/strict TS 유지.”

- UI/Features 공통: “Split <컴포넌트명> into container(pure wiring) and
  presentational(view). 상태는 Signals(`shared/state/**`)로 이동하고 파생값은
  `@shared/utils/signalSelector` 사용. PC 전용 이벤트만 유지. 스타일은 CSS
  Modules + 디자인 토큰만 사용.”

- 예시(즉시 사용 가능):
  - “Refactor Media extraction to Strategy and creation to Factory, place
    concrete strategies under `shared/services/media-extraction/`, ensure
    consumers use vendors getters and `getUserscript()` for GM APIs. Add/adjust
    unit tests.”
  - “Refactor BulkDownload flow to Strategy + Factory, route ZIP via
    `external/zip/zip-creator.ts`, and downloads via `getUserscript().download`.
    Update tests and logs.”
  - “Split Gallery keyboard navigation: extract key handling to
    `shared/services/input/KeyboardNavigator.ts`, ensure only PC events, add
    vitest for Arrow/Home/End/Escape.”

### AI에게 제공할 최소 컨텍스트(토큰 절약)

- 바꾸려는 영역의 얇은 맥락만:
  - 관련 파일 경로 목록(3–7개), 핵심 인터페이스/타입 시그니처, 현재 제약(벤더
    getter/PC-only/토큰 규칙) 요약
  - 받아야 하는 결과의 수용 기준 3–5줄: 어떤 테스트가 생기고 무엇이 GREEN이어야
    하는가
- 큰 파일 전체 붙여넣기 금지. 필요 시 “어떤 심볼을 어디서 읽을지”만 가리키고,
  코드는 diff로 제시하게 합니다.

### 응답 형식/제약(맥락 최소화)

- 변경은 반드시 최소 diff로 제시하고, 불변 부분은 생략합니다.
- 외부 라이브러리 직접 import 제안 금지(벤더 getter 강제).
- PC 전용 이벤트 외의 핸들러 추가 제안 금지.
- 테스트 우선(TDD): 실패 테스트 → 최소 구현 → 리팩토링 순으로 단계화하고, 각
  단계에서 GREEN 확인을 보고합니다.
- 보고는 간결한 체크리스트와 PASS/FAIL 요약 중심. 장문의 서사/반복 설명은
  피합니다.

### 빠른 체크(요청문에 포함하면 효과적)

- “한 줄 구조 리팩토링 후, 최소 diff로 구현”
- “벤더/유저스크립트 getter 사용 보장(직접 import 금지)”
- “PC 전용 이벤트만, CSS Modules + 디자인 토큰만”
- “Vitest로 실패 테스트부터 추가, GREEN 보고”
- “필요 파일 목록만 제공, 대용량 본문 금지”

## 빠른 체크리스트 (AI 요청 문구에 포함)

- “TDD로 … 구현”, “getter 함수 사용하여(벤더/유저스크립트)”, “TypeScript strict
  모드로”, “PC 전용 이벤트만”, “테스트와 함께”

의미가 불명확하거나 누락된 규칙이 있으면 알려주세요. 빌드/테스트/디자인 토큰
규칙 등 세부는 `AGENTS.md`와 `docs/CODING_GUIDELINES.md`를 참고해
보완하겠습니다.
