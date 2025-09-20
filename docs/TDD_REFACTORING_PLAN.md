# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-20 — 현재 활성 Epic 없음

---

## 1. 불변 운영 원칙

| 영역        | 규칙 요약                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| TypeScript  | strict 100%, 공개 API 명시적 반환 타입                                      |
| 외부 의존성 | preact / signals / fflate / GM\_\* 모두 전용 getter 경유 (직접 import 금지) |
| 입력 이벤트 | PC 전용(click, keydown, keyup, wheel, contextmenu) — 터치/포인터 금지       |
| 스타일      | 색/치수/모션/층(z-index) 모두 토큰 기반 (raw hex/px/ms 직접값 금지)         |
| Result 모델 | 'success' · 'partial' · 'error' · 'cancelled' 고정                          |

테스트 스위트는 위 규칙 위반 시 RED 가드를 유지합니다.

---

## 2. 활성 Epic 현황

현재 활성 Epic 없음. 신규 Epic은 백로그에 제안 후 승격합니다.

---

## 5. TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

Gate 체크리스트 (병합 전):

- `npm run typecheck`
- `npm run lint`
- `npm test` (selective RED 허용)
- `npm run build:prod` + 산출물 validator

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

## 7. 활성 리팩토링 계획 — 카테고리별 리뷰 결과(2025-09-20)

본 섹션은 최신 코드 리뷰 결과를 바탕으로 즉시 실행 가능한 리팩토링 계획을
정리합니다. 모든 변경은 TDD(RED → GREEN → REFACTOR)로 진행합니다.

### 7.1 아키텍처/의존성 경계

- 진단: 의존성 경계는 `@shared/external/vendors`의 getter와 Userscript
  어댑터(`getUserscript()`)로 일관 유지 중. `src/` 하위에서
  preact/signals/fflate 직접 import 없음(OK).
  `test/unit/lint/direct-imports-source-scan.test.js`가 가드. 일부 유틸 중복
  가능성은 낮으나 정기 점검 필요.
- 계획/액션:
  - dependency-cruiser 주기 점검 유지: `npm run deps:all` CI/로컬 동일화
    확인(사이클 0 목표, 현재 GREEN 유지).
  - 유틸 중복 후보 스캔을 백로그로 분리(발견 시 단건 PR로 정리).

### 7.2 타입스크립트/타입 안전성

- 진단: TS strict 유지, 공개 API 반환 타입 명시 상태 양호. `tsc --noEmit`가
  스크립트에 포함되어 타입 회귀를 가드.
- 계획/액션:
  - 신규/변경 공개 API는 반환 타입을 명시(불변 원칙 유지).
  - 타입 any 유입 감시: PR 리뷰 체크리스트에 “noImplicitAny 회피” 항목 상기.
  - 외부 통합 타입은 최소 안정 표면만 노출(추상화 타입 좁히기).

### 7.3 이벤트 입력 정책(PC 전용)

- 진단: 정책상 PC 전용 입력만 허용(click/keydown/keyup/wheel/contextmenu). 현재
  코드베이스에서 touch/pointer 이벤트 사용 없음(OK).
- 계획/액션:
  - 모바일/터치 입력은 정책상 비대상. 필요 시 별도 Epic/백로그로 검토.
  - 키보드 네비게이션 테스트를 보강하여 회귀 방지(Arrow/Home/End/Escape/Space).

### 7.4 외부 통합(Vendors/Userscript/ZIP)

- 진단: Userscript API는 `getUserscript()` 경유, ZIP 생성은
  `shared/external/zip/zip-creator.ts` 경유, Vendors는 getter로 안전 주입. 외부
  API 변경(예: X.com DOM/API 변화)에 대한 방어 로직은 최소화되어 있어 feature
  detection 보강 여지가 있음.
- 계획/액션:
  - Vendors 안전 표면(Safe API Surface) 필수 존재 체크 및 graceful degrade
    가드를 추가(벤더 getter 내부/호출부 단위 테스트 포함).
  - ZIP 처리: 대용량 처리 시 idle/raf 청크 처리 유틸을 우선 검토(워커 도입은
    Userscript 제약을 고려해 백로그로 유지).
  - 네트워크/토큰 취급은 현행 규칙 유지(HTTPS 기본/민감정보 로깅 금지). 필요 시
    URL 스킴 검증 유틸 도입을 소규모 변경으로 검토.

### 7.5 상태 관리(Signals)와 파생값

- 진단: Signals 사용은 일관적이며 selector 기반 파생값 구성이 정착. 일부 효과의
  정리(cleanup) 타이밍이 복잡한 구간은 점검 필요.
- 계획/액션:
  - 파생값은 `useSignalSelector`/`useCombinedSelector` 중심으로 유지, 불필요한
    재계산이 의심되는 구간에 memo/selector 재검토.
  - 구독/이펙트 cleanup 확인 테스트를 소규모 추가(메모리 누수 회귀 가드).

### 7.6 UI 계층/컴포넌트 경계

- 진단: 컴포넌트 경계 전반 양호. 일부 복합 컴포넌트는 역할 분리가 더 명확하면
  유지보수성이 향상될 여지.
- 계획/액션:
  - 복합 컴포넌트의 내부 모달/툴바/리스트 영역을 소단위로 분리(Props drilling
    최소화). 영향 범위가 작을 때 점진 시행.
  - 공유 가능한 프리미티브는 `shared/components`로 상향 배치 검토.

### 7.7 스타일 시스템(디자인 토큰/CSS Modules)

- 진단: CSS Modules + 디자인 토큰(`--xeg-*`) 사용 일관, 정책 위반 없음. 일부
  인라인 스타일/직접값 사용이 잔존할 수 있어 정기 스캔 필요.
- 계획/액션:
  - 토큰 위반/직접값 스캔 스크립트 활용(`scripts/find-token-violations.js`).
  - 테마(라이트/다크) 전환은 현행 `ThemeService`를 유지하되,
    `prefers-color-scheme` 반영은 별도 백로그로 검토.

### 7.8 테스트 전략(TDD/JSDOM/모킹)

- 진단: Vitest + JSDOM 환경, Vendors/Userscript 모킹 및 정책 가드 테스트가
  존재하며 GREEN 유지.
- 계획/액션:
  - 벤더 안전 표면/feature detection 추가에 맞춘 단위 테스트 보강.
  - PC 전용 입력 가드 유지 테스트 점검(터치/포인터 사용 시 RED 유지).

### 7.9 빌드/배포(Userscript 번들/소스맵)

- 진단: Vite 7 기반 단일 번들, dev/prod 이중 빌드 및 산출물 validator 동작. 번들
  사이즈/스타일 번들 메트릭 수집 스크립트가 존재.
- 계획/액션:
  - 사이즈 추이를 정기 수집(`scripts/build-metrics.js`,
    `scripts/css-bundle-metrics.cjs`).
  - 프로덕션 소스맵 정책은 현행 유지(배포 요구사항에 따라 추후 조정 가능).

### 7.10 성능/메모리/수명주기

- 진단: 스케줄러/idle/raf 유틸 사용. 신호 변동으로 인한 불필요 렌더링이 의심되는
  구간은 소규모 점검 필요.
- 계획/액션:
  - 이벤트 바인딩/해제 일관성 확인(수명주기 누수 방지).
  - 필요 시 idle 분할 처리로 UI 스톨 방지.

### 7.11 접근성(A11y)

- 진단: 포커스 유틸/라이브 리전이 존재하며 기본 준수 상태.
- 계획/액션:
  - 키보드 포커스 이동/읽기 순서에 대한 스폿 테스트 보강.
  - 버튼/인터랙티브 요소의 접근 가능한 이름(aria-label 등) 점검.

### 7.12 서비스 계층/다운로드 흐름

- 진단: 다운로드 파이프라인은 Userscript/native download 경유로 일관하며, Result
  모델 표준을 유지.
- 계획/액션:
  - 오류 표준화: 서비스 에러를 `UnifiedToastManager`로 일괄 라우팅하는 경로 점검
    및 테스트 추가.
  - 동시성 제한/큐 정책은 현행 유지, 필요 시 설정값 노출을 소규모 개선으로 고려.

---

<!-- EPIC XEG-SEL-01 — Completed and moved to TDD_REFACTORING_PLAN_COMPLETED.md -->
