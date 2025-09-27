# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-27 — FRAME-ALT-001 SolidJS 전체 전환 Epic 단독 진행.
SEC-2025-10 Epic 완료 내역은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`를
참조하세요.

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

#### FRAME-ALT-001 · 선택한 해법 — 4 Stage 계획

| Stage                                      | 목표                                                                 | 핵심 작업                                                                                                                                                    | TDD 게이트                                                                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage A — Solid Foundation & Tooling       | SolidJS 빌드/테스트 파이프라인을 준비하고 Signals 호환 어댑터를 구축 | `vite.config.ts`와 `tsconfig.json`에 Solid 플러그인 구성, `@shared/state/solid-adapter.ts` 설계, `docs/research/solid-feasibility.md`를 실험 결과로 업데이트 | RED → GREEN: `test/research/solid-foundation.red.test.ts`(신규) → `solid-foundation.test.ts`, `npm run typecheck`, `npm run build:dev`                  |
| Stage B — Gallery & Settings Migration     | 주요 UI(갤러리/설정)와 루트 엔트리포인트를 SolidJS로 재구성          | `src/main.ts` Solid 진입점 작성, `features/gallery`와 `features/settings` 핵심 컴포넌트 Solid 포팅, Dual-render 스냅샷 테스트 작성                           | `test/features/gallery/solid-migration.integration.test.tsx`, `test/features/settings/solid-migration.test.tsx`, 전체 `npm test`                        |
| Stage C — Feature Sweep & Performance Gate | 나머지 기능/서비스를 SolidJS 기반으로 이전하고 성능/번들 예산을 확정 | Notifications/단축키/다운로드 등 부가 기능 Solid 포팅, 번들 메트릭(`metrics/bundle-metrics.json`) 갱신, 접근성 회귀 테스트 강화                              | `test/optimization/bundle-budget.test.ts` 갱신, `test/accessibility/solid-regressions.test.ts`, `npm run build:prod` + `node scripts/validate-build.js` |
| Stage D — Preact Retirement & Cleanup      | Preact/Signals 의존성을 제거하고 Solid 전용 아키텍처로 최종 전환     | `package.json`에서 Preact 제거, Userscript 헤더/Docs 업데이트, 남은 compat 경로 삭제, Feature flag 제거                                                      | `npm run validate`, `npm run build:prod`, `test/tooling/no-preact-usage.scan.test.ts`(신규), dist 비교 스냅샷 테스트                                    |

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

#### FRAME-ALT-001 · 리스크 및 완화

- 기존 Userscript 빌드 파이프라인(Vite)이 SolidJS 최적화와 충돌할 수 있으므로,
  Stage A에서 빌드 플러그인 충돌 여부를 테스트하고, 문제가 있을 경우
  `BUILD-ALT-001` 백로그 항목을 재승격해 esbuild 전환을 준비합니다.
- Signals 의존 서비스(예: ToastManager, UnifiedDownload)가 Solid store 전환 시
  race condition을 유발할 수 있으므로, Stage B에서 서비스별 짝 테스트를 작성하고
  Stage C에서 회귀 모니터링을 자동화합니다.
- 트위터 DOM 변동과 Solid 렌더러의 hydration 충돌 가능성을 대비해 Stage B부터
  SSR 미사용 경로를 명확히 하고, 화면 재마운트 테스트를 `test/smoke/twitter-dom`
  네임스페이스에 추가합니다.

#### FRAME-ALT-001 · 준비 사항 & 일정 가이드

- Stage A는 2주 이내 완료를 목표로 하며, 이 단계에서 REF-LITE-V4/BUILD-ALT-001
  관련 개선 사항은 백로그로 유지합니다.
- Stage B·C는 각각 3~4주를 예상하며, Stage B 종료 후 1주간 실제 트위터에서 smoke
  테스트를 수행해 이벤트/메모리 회귀를 확인합니다.
- Stage D는 2주 이내로 계획하되, 배포 전 최소 3일 동안 베타 배포(프리플래그)
  모니터링을 실시하고 문제가 발견되면 Stage C로 롤백합니다.

## 3. 다음 사이클 준비 메모(Placeholder)

- 신규 Epic 제안은 백로그에 초안 등록 후 합의되면 본 문서의 활성 Epic으로
  승격합니다.
- REF-LITE-V4 Runtime Slim과 BUILD-ALT-001 Userscript Bundler 교체 파일럿은
  백로그 Candidate로 이동했으며, SolidJS 전환 Stage A 도중 빌드/런타임 리스크가
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

- 2025-09-27 — 활성 Epic을 SolidJS 전체 전환으로 단일화하고, REF-LITE-V4 및
  BUILD-ALT-001을 백로그로 이동.
- 2025-09-27 — SEC-2025-10 Epic을 Completed 로그로 이관하고 활성 계획서를 정리.
- 2025-09-26 — 문서 검토, 활성 Epic 없음 재확인.
- 2025-09-26 — GitHub CodeQL(JavaScript) 스캔 수행. 경고 30건(중복 포함)으로
  `js/incomplete-url-substring-sanitization`, `js/double-escaping`,
  `js/prototype-pollution-utility` 패턴이 보고됨. 위 "다음 사이클 준비" 메모에
  정리된 후속 하드닝 작업을 백로그에 편입 예정.
