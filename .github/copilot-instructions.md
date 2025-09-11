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

## 빠른 체크리스트 (AI 요청 문구에 포함)

- “TDD로 … 구현”, “getter 함수 사용하여(벤더/유저스크립트)”, “TypeScript strict
  모드로”, “PC 전용 이벤트만”, “테스트와 함께”

의미가 불명확하거나 누락된 규칙이 있으면 알려주세요. 빌드/테스트/디자인 토큰
규칙 등 세부는 `AGENTS.md`와 `docs/CODING_GUIDELINES.md`를 참고해
보완하겠습니다.
