# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-22 — EPIC-C(Userscript 하드닝 v3)의 P0/P1 범위가 완료되어
모니터링 단계로 전환되었고, 활성 계획서에서는 제거되었습니다(Completed 로그
참조). 이번 사이클의 활성 작업으로 “EPIC-SM — Settings Modal Implementation
Audit”를 등록하여 설정 모달 각 메뉴의 실제 동작/연동을 점검합니다.

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

- 활성 Epic 1건 — EPIC-SM(Settings Modal Implementation Audit)

---

## 3. 활성 Epic 상세

### EPIC-SM — Settings Modal Implementation Audit

목표(Outcome)

- 설정 모달 각 메뉴가 실제 기능과 정확히 연동되는지 검증하고 회귀 가드를 강화
- 접근성/키보드 내비게이션과 패널/모달 모드 전환의 동작 일관성을 보장

스코프(What)

- 메뉴 동작 점검 및 연동 검증
  - Theme: select 변경 시 ThemeService.setTheme 호출 및 document.documentElement
    data-theme 반영, ThemeService의 저장(localStorage) 보존 확인
  - Language: select 변경 시 LanguageService.setLanguage 호출 및 문자열 리소스
    반영 확인(지속성 여부는 서비스 정책에 따름 — 현재는 메모리)
  - Download: “대량 다운로드 진행 토스트 표시” 체크박스 — settings-access 경유로
    'download.showProgressToast' 저장/로드가 동작하고, GalleryRenderer →
    BulkDownloadService 옵션 전달이 일치하는지 확인
- 패널/모달 동작 및 접근성
  - 키보드: Escape 닫힘, Tab/Shift+Tab 순환, 첫 포커스 요소 보장
  - 포커스: 이전 포커스 동기 복원, 외부 inert 처리 해제/복구 일관성
  - 위치: position 'toolbar-below'|'top-right'|'center'|'bottom-sheet' 클래스
    매핑 및 외부 클릭(backdrop/panel) 닫힘 동작

Acceptance(측정 기준)

- 메뉴 연동
  - Theme: select 변경 시 data-theme가 기대값으로 즉시 갱신되고 재방문 시 저장값
    복원(ThemeService 저장 정책 기준) — 단위/통합 테스트 GREEN
  - Language: select 변경 시 LanguageService의 현재 언어가 변경되고 UI 문자열
    조회 결과가 바뀌는 경로에 대해 스모크 테스트 GREEN
  - Download: settings-access로 저장된 'download.showProgressToast'가 이후 ZIP
    다운로드 경로에서 읽혀 옵션으로 전달되는지 통합 테스트 GREEN
- 접근성/키보드: Esc 닫힘, Tab 루프, 첫 포커스, inert 처리에 대한 테스트가
  jsdom에서 신뢰 가능한 형태로 통과하거나 최소한 회귀 스냅샷을 제공

작업 분해(Tasks · TDD)

1. 메뉴 연동 검증
   - Theme select → ThemeService.setTheme 및 data-theme 반영 테스트 추가/보강
   - Language select → LanguageService.setLanguage 호출 스파이 및 문자열 조회
     스모크
   - Download 진행 토스트 토글 → setSetting/getSetting 경로 저장/복원 및
     GalleryRenderer/BulkDownloadService 옵션 전달 가드
2. 문서/가이드
   - 코딩 가이드에 settings-access 키('download.showProgressToast') 명시 및 소비
     경로 주석 보강

실행 순서(권장)

- 메뉴 연동 스모크 → 접근성 스모크 → 문서 보강

완료 정의(DoD)

- typecheck/lint/test/build 모두 GREEN, postbuild validator 통과
- 활성 테스트에서 Settings Modal 관련 동작이 최소 스모크 수준으로 보장됨
- 본 문서의 Epic 항목을 Completed로 이관하고 간결 요약만 유지

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
- `npm run build:prod` + 산출물 validator(Userscript 헤더/퍼미션/메타데이터
  정합성 포함)

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
