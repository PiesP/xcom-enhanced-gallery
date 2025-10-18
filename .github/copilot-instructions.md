# GitHub Copilot 개발 지침 (xcom-enhanced-gallery)

> Solid.js 기반 Userscript 프로젝트를 위한 AI 코딩 가이드 (프로젝트 특화, TDD
> 우선)
>
> 📚 **전체 문서 구조**: [docs/DOCUMENTATION.md](../docs/DOCUMENTATION.md) 참고

## 핵심 스택/워크플로

- Stack: TypeScript(strict) + Vite 7 + Solid.js 1.9.9 + Vitest 3(JSDOM)
- Userscript 번들: `vite.config.ts`의 userscript 플러그인이 단일
  파일(`dist/xcom-enhanced-gallery*.user.js`) 생성, Dev는 sourcemap 포함
- 경로 별칭: `@`, `@features`, `@shared`, `@assets` (vite/vitest/tsconfig 일치)
- 스크립트: 타입 `npm run typecheck` (tsgo 사용), 린트 `npm run lint:fix`,
  테스트 `npm test`/`npm run test:watch`, 빌드 `npm run build:dev|prod`, 종합
  `npm run validate`

## 아키텍처와 경계

- 3 계층: `features/`(도메인 UI/기능) → `shared/`(services/state/utils/logging)
  → `external/`(브라우저/벤더/유저스크립트 어댑터)
- 외부 라이브러리 접근은 오직 getter 경유: `@shared/external/vendors`가 안전
  API를 제공(TDZ-safe, 모킹 용이)
  - 예)
    `const { createSignal, createEffect } = getSolid(); const { createStore } = getSolidStore();`
  - 직접 import 금지: `solid-js`, `solid-js/store`, `solid-js/web` 등을 코드에서
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

- 상태: Solid.js의 내장 Signals(`createSignal`, `createStore`) 사용.
  컴포넌트에서는 signal selector로 파생값을 메모이즈(`createMemo`)
- UI: Solid.js 컴포넌트. JSX를 사용하며, 반응성은 자동으로 처리됨
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
  `import { initializeVendors, getSolid, getSolidStore } from '@shared/external/vendors'`
- Userscript:
  `import { getUserscript } from '@shared/external/userscript/adapter'` →
  `await getUserscript().download(url, name)`/`xhr(...)`
- 상태 선택자: Solid.js의 `createMemo`를 사용하여 파생 상태를 메모이제이션

## 품질 게이트

- 커밋/PR 전: `npm run typecheck` · `npm run lint:fix` · `npm test` · 필요 시
  `npm run deps:all`
- 빌드 산출물 검증: `npm run build:dev|prod` 후 `scripts/validate-build.js` 자동
  실행
- **작업 종료 시**: `npm run maintenance:check` 실행으로 프로젝트 건강 상태 점검
  - 백업/임시 디렉터리 확인
  - 큰 문서(500줄+) 감지
  - Git 추적되지 않는 파일 확인
  - 조치 필요 항목이 발견되면 사용자에게 보고

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

- "TDD로 … 구현", "getter 함수 사용하여(벤더/유저스크립트)", "TypeScript strict
  모드로", "PC 전용 이벤트만", "테스트와 함께"
- **작업 완료 시**: "npm run maintenance:check 실행하여 프로젝트 상태 점검"

---

## 개발 원칙 및 코드 품질 기준

### 에러 핸들링 철학

- **근본 원인 해결**: `@ts-ignore`, `try-catch` 무음 처리 등 에러 억제 금지.
  관련이 약해 보이는 에러도 반드시 해결
- **조기 감지**: 에러는 가능한 빨리 감지하고, 명확한 메시지 제공
- **테스트 커버리지**: 에러 케이스도 반드시 테스트로 검증
- **외부 의존성**: API/네트워크 호출은 항상 실패 가능성 고려 (타임아웃,
  리트라이, 폴백)

### 코드 품질 원칙

- **DRY 원칙**: 중복 제거, 단일 진실 공급원(Single Source of Truth) 유지
- **보이스카우트 규칙**: 코드를 발견했을 때보다 더 나은 상태로 남기기. 작은
  문제도 즉시 수정(Broken Windows 이론)
- **의미 있는 명명**: 변수/함수명으로 의도를 명확히 전달. 주석은 "왜"를 설명하고
  "무엇"은 코드로 표현
- **일관성**: 프로젝트 전체에서 일관된 코딩 스타일 유지 (ESLint, Prettier 준수)

### 보안 의식

- **환경 변수 관리**: API 키, 비밀번호 등 민감 정보는 환경 변수로 관리 (하드코딩
  금지)
- **입력 검증**: 모든 외부 입력 검증 (특히 userscript 환경에서 DOM 조작 시)
- **최소 권한 원칙**: 필요 최소한의 권한으로 동작
- **정기 감사**: `npm audit`, CodeQL 등 보안 도구 정기 실행

### 성능 의식

- **측정 기반 최적화**: 추측 대신 프로파일링 결과에 기반해 최적화
- **지연 로딩**: 필요할 때까지 리소스 로딩 지연 (Solid.js `lazy()`, dynamic
  import)
- **캐싱 전략**: 캐시 유효기간과 무효화 전략 명확히 설정
- **N+1 문제 회피**: 데이터 fetch 시 오버페치/언더페치 최소화

### 신뢰성 확보

- **타임아웃 설정**: 모든 비동기 작업에 적절한 타임아웃 설정 (테스트 20s, 훅
  25s)
- **재시도 메커니즘**: 일시적 장애 대응 (지수 백오프 고려)
- **관찰 가능성**: 적절한 로깅(`@shared/logging`)과 메트릭으로 디버깅 용이성
  확보
- **단계적 퇴화**(Graceful Degradation): 일부 기능 실패 시에도 핵심 기능은 유지

### 의존성 관리 원칙

- **최소 의존성**: 정말 필요한 의존성만 추가. 추가 전 라이선스, 크기, 유지보수
  상태 확인
- **정기 업데이트**: 보안 패치/버그 수정 위해 `npm run deps:all`로 정기 점검
- **잠금 파일**: `package-lock.json` 반드시 커밋 (CI와 로컬 환경 일치)

### 디버깅 베스트 프랙티스

- **재현 가능성 확보**: 문제를 확실히 재현할 수 있는 단계 확립
- **이진 탐색**: 문제 범위를 절반씩 좁혀가며 원인 격리
- **도구 활용**: Chrome DevTools, Vitest UI, Playwright 디버그 모드 적극 사용
- **지식 공유**: 조사 결과와 해결책을 문서화 (`docs/`, 코드 주석, PR 설명)

### 지속적 개선

- **회고**: 정기적으로 프로세스 개선 (Phase 완료 시 교훈 문서화, 예:
  `SOLID_REACTIVITY_LESSONS.md`)
- **학습 공유**: 팀/미래 개발자를 위해 지식 문서화 (ADR, 가이드라인 업데이트)
- **도구 평가**: 새 도구/기법을 적절히 평가 후 도입 (예: tsgo, ModGo 전략)

## 작업 종료 프로토콜

모든 개발 작업(기능 추가, 리팩토링, 버그 수정 등)을 완료한 후:

1. **코드 품질 검증**

   ```pwsh
   npm run validate  # typecheck + lint:fix + format
   npm test          # 전체 테스트 실행
   ```

2. **빌드 검증**

   ```pwsh
   npm run build     # dev + prod 빌드 및 validate-build.js 자동 실행
   ```

3. **유지보수 점검** ⭐ 신규

   ```pwsh
   npm run maintenance:check
   ```

   출력 결과를 사용자에게 요약 보고:
   - ✅ 정상 항목 (보안, Git 상태 등)
   - ⚠️ 조치 필요 항목 (백업 디렉터리, 큰 문서, 빌드 크기 초과 등)
   - 💡 권장 조치 (발견된 항목에 대한 제거 명령 등)

4. **커밋 준비**
   - 변경사항이 모두 정상이면 커밋 권장
   - 조치 필요 항목이 있으면 사용자에게 먼저 확인 요청

**중요**: 대규모 작업(여러 파일 변경, 새 기능 추가) 후에는 반드시 maintenance
점검을 실행하여 임시 파일이나 불필요한 백업이 남아있지 않은지 확인하세요.

---

의미가 불명확하거나 누락된 규칙이 있으면 알려주세요. 빌드/테스트/디자인 토큰
규칙 등 세부는 `AGENTS.md`와 `docs/CODING_GUIDELINES.md`를 참고해
보완하겠습니다.
