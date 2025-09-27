# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-27 — 현재 활성 Epic 없음. SEC-2025-09 Epic 완료 내역은
`docs/TDD_REFACTORING_PLAN_COMPLETED.md`를 참조하세요.

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 “활성 Epic/작업”과 해당 Acceptance에만 집중합니다.

---

## 2. 활성 Epic 현황

### EPIC — SEC-2025-10 CodeQL URL/Settings 하드닝

#### 문제 정의

- GitHub CodeQL(JavaScript) 스캔에서 `js/incomplete-url-substring-sanitization`,
  `js/double-escaping`, `js/prototype-pollution-utility`가 반복 감지되었습니다.
- dist 번들에 동일 패턴이 남아 있어 Userscript 배포물까지 영향이 전파됩니다.
- UI 계층(`VerticalImageItem`, `MediaClickDetector`), 서비스 계층
  (`MediaService`, `MediaExtractionService`, `SettingsService`)와 유틸리티
  (`URLPatterns`, `media-url.util.ts`)가 모두 관련되어 있어 TDD 경로가
  필요합니다.

#### 가설 / 기대효과

- URL 검사 로직을 구조화된 파서(`URL`/`URLPattern`) +
  `createTrustedHostnameGuard` 기반으로 통합하면 문자열 서브스트링 취약 경로를
  제거할 수 있습니다.
- `URLPatterns.normalizeUrl`을 쿼리 파서 기반으로 재작성하면 HTML 엔티티 이중
  디코딩 경로를 종결할 수 있습니다.
- `SettingsService` 병합 경로를 `Object.create(null)` + 키 가드로 고정하면
  사용자 입력을 통한 프로토타입 오염을 차단할 수 있습니다.

#### Acceptance (GREEN 기준)

1. URL/미디어 관련 모든 검증 진입점이 `@shared/utils/url-safety`의 안전 가드를
   사용하며, CodeQL `js/incomplete-url-substring-sanitization`가 0건이 됩니다.
2. `URLPatterns.normalizeUrl`/`cleanUrl`이 중복 디코딩 없이 추적 파라미터를
   제거하고, `js/double-escaping` 경고가 재발하지 않습니다.
3. `SettingsService` 전 경로가 `assertSafeSettingPath`와 새로운 `safeMerge`
   유틸리티를 사용해 `js/prototype-pollution-utility`를 제거합니다.
4. 신규/갱신 테스트: URL 위협
   벤치(`test/shared/utils/url-patterns.security.test.ts`), DOM 추출
   가드(`test/integration/gallery-activation.test.ts` 확장), SettingsService
   보안 가드(`test/unit/shared/services/settings-service.security.test.ts`) 가
   RED→GREEN 사이클을 거쳐 안정화됩니다.
5. 품질 게이트: `npm run typecheck`, `npm run lint`, `npm test`,
   `npm run build:dev`, `npm run build:prod`, `node scripts/validate-build.js`
   모두 PASS.

#### TDD 워크브레이크다운 (순차 실행)

1. `@shared/utils/url-safety`에 `parseTrustedUrl`, `isTrustedTwitterMediaUrl` 등
   구조화된 검사 API 추가 → RED: 악의적 호스트가 통과하는 케이스 작성.
2. `URLPatterns`, `MediaService`, `VerticalImageItem`, `media-url.util.ts`,
   `MediaClickDetector`를 새 API로 마이그레이션 → 각 단계별 단위/통합 테스트
   확장(트위터 미디어/비디오 탐지, DOM 셀렉터 필터링).
3. `URLPatterns.normalizeUrl`을 `URL`/`URLSearchParams` 기반으로 재작성하고
   엔티티 디코더 테스트를 분리해 이중 디코딩 방지 RED→GREEN 수행.
4. `SettingsService` 병합/마이그레이션 경로를 `safeMergeSettings`로 대체하고
   프로토타입 오염 회귀 테스트를 강화.
5. dist 번들 스냅샷 테스트(`test/final/`)에 CodeQL 패턴 회귀 체크 추가 (정규식
   기반 서브스트링 금지 가드) 후 전체 품질 게이트 실행.

#### Risks / Mitigation

- DOM 쿼리 변경으로 성능 회귀 가능 → `cachedQuerySelector(All)` 사용 범위 내에서
  guard 필터링을 수행하고, 성능 회귀
  테스트(`test/performance/media-extraction`)로 감시.
- URL 파서가 상대 경로를 던지는 경우 → `try...catch` 내 폴백 경로 마련 및 테스트
  케이스 추가.
- SettingsService 마이그레이션 변경 시 기존 저장 데이터와 호환성 붕괴 위험 →
  백업/복원 통합 테스트로 마이그레이션 안전성 검증.

#### 타임라인 & 메모

- 목표 완료: 2025-10-04 (CodeQL 다음 주기 이전)
- 필요 리소스: 보안 리뷰 1인 (병행 검증), 번들 사이즈 영향 측정은 Epic 종료 시
  `metrics/button-consolidation-metrics.json` 업데이트로 확인.

## 3. 다음 사이클 준비 메모(Placeholder)

- 신규 Epic 제안은 백로그에 초안 등록 후 합의되면 본 문서의 활성 Epic으로
  승격합니다.
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

- 2025-09-27 — SEC-2025-10 Epic 추가(CodeQL URL/Settings 하드닝). 신규 Epic은 위
  2절 계획에 따라 RED→GREEN 진행 예정.
- 2025-09-26 — 문서 검토, 활성 Epic 없음 재확인.
- 2025-09-26 — GitHub CodeQL(JavaScript) 스캔 수행. 경고 30건(중복 포함)으로
  `js/incomplete-url-substring-sanitization`, `js/double-escaping`,
  `js/prototype-pollution-utility` 패턴이 보고됨. 위 "다음 사이클 준비" 메모에
  정리된 후속 하드닝 작업을 백로그에 편입 예정.
