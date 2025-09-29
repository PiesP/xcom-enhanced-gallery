# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-29 — Stage B·Stage C·Stage D 범위는 Completed 로그로 모두
이관되었으며, 활성 계획은 Stage E Solid shell UI parity 복구에만 집중합니다.
관련 검증 결과와 세부 실행 로그는 `TDD_REFACTORING_PLAN_COMPLETED.md`에서 확인할
수 있습니다.

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 “활성 Epic/작업”과 해당 Acceptance에만 집중합니다.

---

## 2. 활성 Epic 현황

### EPIC — FRAME-ALT-001 SolidJS 전체 전환 (활성)

#### FRAME-ALT-001 · 문제 진단

- Preact + Signals 조합은 안정적이지만 dist 번들에 Preact/compat 코드와 Signals
  인터롭 계층이 중복 포함되어, 호스트인 Twitter React 트리와 별도의 vDOM이
  유지되는 비용이 큽니다.
- ServiceManager는 Signals 상태 모델을 전제로 작성되어 있어 SolidJS 등 다른
  반응형 모델로 이동 시 인터페이스 변환 계층이 필요하며, 이를 방치하면
  composition 이벤트가 두 번 트리거되는 버그가 지속됩니다.
- Runtime Slim Epic(REF-LITE-V4)과 빌드 전환 Epic(BUILD-ALT-001)이 백로그로
  이동함에 따라, 프레임워크 전환을 통해 번들/런타임 최적화를 한번에 달성해야
  합니다.

#### FRAME-ALT-001 · 대안 비교 (요약)

- ✅ **선택** — SolidJS 전체 전환 + Signals 호환 레이어: SolidJS의 컴파일 기반
  fine-grained 반응형 모델을 도입하고, 기존 Signals 스토어를 단계적으로 Solid
  store로 치환합니다.
- ⏸️ Signals 최적화만 진행: 번들 크기 감소 폭이 제한적이며 Preact 의존성 제거에
  실패하므로 추후 검토용으로 백로그에 유지합니다.
- ⏸️ React 18 전환: 호스트와의 스택 통합 장점은 있지만 번들 크기/실행 성능에서
  이점이 없고 userscript 빌드 특성과 충돌하여 제외합니다.

#### FRAME-ALT-001 · 추가 대안 비교 — Stage E UI 정합성

- ⚠️ **Option A — 최소 CSS 재매핑**: `SolidGalleryShell`에서 기존 클래스명으로
  치환하고 누락된 전역 CSS를 import하여 스타일만 복원합니다. 구현이 빠르고 회귀
  범위가 작지만, 수동 DOM 패치/로컬라이제이션 부재·접근성 결함이 그대로 유지되어
  장기 유지보수에 취약합니다.
- ✅ **선택 — Solid UI 재구성 + 격리 복원**: `GalleryRenderer`가
  `#xeg-gallery-root` 격리 컨테이너와 `mountGallery`를 재사용하고,
  `SolidGalleryShell`을 공용 UI 컴포넌트(`GalleryContainer`, `Toolbar`,
  `SolidVerticalImageItem` 등)로 조합해 디자인·접근성·테스트 파이프라인을
  일관되게 유지합니다. 초기 투자 비용은 크지만 Epic 전반의 아키텍처 원칙과 품질
  목표를 가장 잘 만족합니다.
- ⏸️ **Option C — Solid 전용 CSS 신규 작성**: `xeg-solid-*` 접두사의 전용 스타일
  세트를 작성해 디자인을 복제합니다. 단기 시연에는 활용 가능하지만, 디자인
  토큰과 글로벌 규칙이 이중화되어 차후 가드 테스트/토큰 갱신과 충돌하므로
  제외합니다.

#### FRAME-ALT-001 · 선택한 해법 — 4 Stage 계획

| Stage                                  | 목표                                                                                           | 핵심 작업                                                                                                                                                                                                                       | TDD 게이트                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage E — Solid Shell UI Parity (활성) | Solid 갤러리 오버레이가 격리 스타일·툴바·썸네일·로컬라이제이션까지 기존 디자인과 동등하게 동작 | `GalleryRenderer`가 `#xeg-gallery-root` + `mountGallery`를 재사용하도록 리팩토링, `SolidGalleryShell`을 `GalleryContainer`/`Toolbar`/`SolidVerticalImageItem` 조합으로 재작성, 수동 DOM 동기화 제거 및 Signals 반응형 흐름 복구 | 핵심 RED 스펙 졸업: `test/features/gallery/solid-shell-ui.test.tsx`, `test/accessibility/gallery-toolbar-parity.test.ts`, `test/features/gallery/solid-shell-settings.test.tsx` → Solid 런타임/빌드 경고 제거용 신규 RED 추가 예정. GREEN 후 `npm run typecheck`, `npm run lint`, `npm test`, `npm run build:prod` + `node scripts/validate-build.js`, 영향도 있는 메트릭(`metrics/bundle-metrics.json`, `metrics/button-consolidation-metrics.json`) 갱신 |

#### FRAME-ALT-001 · 진행 중 우선 작업

- Stage E — Solid shell UI parity 하드닝 (2025-10-14 업데이트)
  - 최근 완료 항목은 Completed 로그(2025-09-29 parity 가드 졸업, 2025-10-06
    Solid 경고 제거, 2025-10-13 Solid 전용 훅 하드닝)에 정리되어 있습니다.
  - Acceptance 게이트 재실행(2025-10-14):
    - `npm run typecheck` ✅, `npm run lint` ✅
    - `npm test` ❌ — Stage D 잔여 RED 가드가 여전히 실패합니다. 대표적으로
      Solid primitive 테스트에서 `React` 네임스페이스 참조, Stage D 번들 메트릭
      노트 기대값 불일치, Preact/legacy 스캔 가드가 RED 상태를 유지합니다.
    - `Clear-Host && npm run build` ✅ — deps:all →
      validate(typecheck/lint/format) → dev/prod 빌드 및 postbuild validator까지
      모두 PASS
  - 남은 작업
    - Stage D RED 가드와 Stage E acceptance 범위 재조정: Solid primitive
      테스트의 React 참조 제거, Stage D 스캔 가드 성공 기준 재확인, Stage E
      기준에서 RED를 허용할지 여부 결정
    - `metrics/bundle-metrics.json`과
      `metrics/button-consolidation-metrics.json` 최신화 필요성 검토(현재
      version 3/Stage E 메모 유지). 필요 시 `scripts/build-metrics.js` 재실행
    - 위 조치 이후 `npm test` 재실행으로 GREEN 확인, acceptance 게이트 종료

#### FRAME-ALT-001 · Acceptance (Epic 레벨)

- Stage별로 RED→GREEN 사이클을 유지하며, 각 단계 완료 시 `npm run typecheck`,
  `npm run lint`, `npm test`, `npm run build:prod` +
  `node scripts/validate-build.js` 통과를 필수로 합니다.
- Stage B 완료 시 SolidJS 렌더링 경로와 기존 Preact 경로가 기능 플래그 기준으로
  동일한 DOM 스냅샷/이벤트 시퀀스를 유지해야 하며, 린트에서 Preact 신규 사용이
  차단돼야 합니다.
- Stage C 완료 시 갱신된 번들 메트릭이 Preact 대비 브로틀리 기준 ≥15% 축소를
  증명하거나, 해당 목표 미달 시 원인 분석 리포트를
  `docs/research/solid-migration.md` 에 기록해야 합니다.
- Stage D 완료 후 Preact 관련 의존성과 토글이 완전히 제거되고, Tampermonkey 배포
  스모크 테스트(실행/업데이트)가 GREEN을 유지해야 합니다.
- Stage E 완료 후 Solid 갤러리 오버레이는 `GalleryContainer`/Toolbar/썸네일 UI를
  공유 컴포넌트로 구동하고, `#xeg-gallery-root`에 `xeg-root` 격리 스타일이
  적용된 상태에서 parity/접근성/번들 메트릭 가드가 모두 GREEN이어야 합니다.

#### FRAME-ALT-001 · 리스크 및 완화

- Userscript 빌드 파이프라인(Vite)은 Stage A 검증에서 충돌이 없었지만, Stage B
  에서 Solid 렌더링 범위가 확장될 때 문제가 발생하면 `BUILD-ALT-001` 백로그를
  재승격해 esbuild 전환을 준비합니다.
- Signals 의존 서비스(예: ToastManager, UnifiedDownload)가 Solid store 전환 시
  race condition을 유발할 수 있으므로, Stage B에서 서비스별 짝 테스트를 작성하고
  Stage C에서 회귀 모니터링을 자동화합니다.
- 트위터 DOM 변동과 Solid 렌더러의 hydration 충돌 가능성을 대비해 Stage B부터
  SSR 미사용 경로를 명확히 하고, 화면 재마운트 테스트를 `test/smoke/twitter-dom`
  네임스페이스에 추가합니다.

#### FRAME-ALT-001 · 준비 사항 & 일정 가이드

- Stage B는 3~4주를 예상하며, 종료 후 1주간 실제 트위터 환경에서 smoke 테스트를
  수행해 이벤트/메모리 회귀를 확인합니다.
- Stage C 역시 3~4주를 예상하며, Stage B 결과에 따라 smoke 테스트 범위를
  확장하고 Bundle/접근성 메트릭을 재산출합니다.
- Stage D는 2주 이내로 계획하되, 배포 전 최소 3일 동안 베타 배포(프리플래그)
  모니터링을 실시하고 문제가 발견되면 Stage C로 롤백합니다.
- Stage E는 설계/RED 1주, 구현 1.5주, 하드닝/검증 0.5주로 3주 이내 완료를 목표로
  하며, 베타 플래그(내부 only)로 1주간 UI 회귀 관찰 후 전면 활성화를 결정합니다.

## 3. 다음 사이클 준비 메모(Placeholder)

- 신규 Epic 제안은 백로그에 초안 등록 후 합의되면 본 문서의 활성 Epic으로
  승격합니다.
- REF-LITE-V4 Runtime Slim과 BUILD-ALT-001 Userscript Bundler 교체 파일럿은
  백로그 Candidate로 이동했으며, SolidJS 전환 Stage 진행 중 빌드/런타임 리스크가
  재현되면 즉시 재승격합니다.
- CodeQL 하드닝 Epic 진행 상황 점검 후 추가 보안 하드닝 대상(예: Userscript
  sandbox 정책) 여부를 재평가합니다.

---

## 5. TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

Gate 체크리스트(요지):

- 타입/린트/테스트/빌드 검증은 `AGENTS.md`와 `CODING_GUIDELINES.md`의 품질
  게이트를 따릅니다.

---

## 6. 참고 문서

| 문서                   | 위치                                     |
| ---------------------- | ---------------------------------------- |
| 완료 로그              | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그                 | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계                   | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙              | `docs/CODING_GUIDELINES.md`              |
| 계획 아카이브(축약 전) | `docs/archive/`                          |

필요 시 새 Epic 제안은 백로그에 초안(Problem/Outcome/Metrics) 형태로 먼저 추가
후 합의되면 본 문서 Epic 템플릿 섹션에 승격합니다.

---

## 7. 품질 게이트 및 검증 방법

모든 Epic/Task는 다음 게이트를 통과해야 합니다.

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint` / `npm run format` — 수정 사항 없거나 자동 수정 적용
- 테스트: `npm test` — 신규/갱신 테스트 GREEN, 리팩터링 임시 RED만 허용 주석
  필수
- 빌드: `npm run build:dev`/`prod` — 산출물 검증 스크립트 통과

추가로, 접근성 전용 스모크:

- Tab/Shift+Tab 네비게이션 스모크, Escape 복귀 스모크, aria-live 공지 스냅샷

메모리 전용 스모크:

- 타이머/리스너 카운트 0, revoke 큐 0, 대량 로딩 후 회복 확인(모킹)

---

## Change Notes (Active Session)

- Stage E Solid shell UI parity 계획을 본 문서에 반영했으며, RED 스펙을 `.test`
  표면으로 졸업하고 격리/디자인 복구 작업을 순차적으로 진행합니다.
- Stage E parity 가드와 Solid 경고 가드가 모두 GREEN 상태이며, 번들 메트릭
  재측정을 위한 acceptance 게이트 재실행만 남았습니다. 2025-10-14 재실행 결과
  typecheck/lint/build는 GREEN, 전체 `npm test`는 Stage D RED 가드로 인해 RED
  상태입니다.
