# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-22 — 활성 Epic 1건 진행(EPIC-C: Userscript 하드닝 v3). 직전
사이클 EPIC-B 종료 항목은 Completed로 이관됨. A11y-001(모션 가드) 1차 적용 및
Refactoring Tests 토글 도입까지 완료(Completed 로그 참조).

직전 사이클 Epic(유저스크립트 하드닝 v1) Phases 1–4 전체 완료(Completed 로그
이관)

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

- 활성 Epic 1건 — EPIC-C(Userscript 하드닝 v3). 직전 EPIC-B 종료 후 후속 경량
  하드닝과 운영 안전성 개선에 집중합니다.

---

## 3. 활성 Epic 상세

### EPIC-C — Userscript 하드닝 v3 (경량·신뢰성)

목표(Outcome)

- 배포 신뢰성 강화: 헤더/릴리즈 메타데이터 정합성, 네트워크 권한/정책 일치
- UX 품질 유지하며 성능/접근성 리스크 완화(가벼운 가드 수준)
- RED 가드 유지: PC 전용 입력, 벤더 getter 정책, 디자인 토큰 일관성

스코프(What)

- 모션 접근성 가드: prefers-reduced-motion 전역 유틸/토큰 레벨 적용(1차 적용
  완료)
- 리팩토링 테스트 재활성화(단건 검증 후) — 토글 경로 도입 완료, 단계적 GREEN
  확인 예정
- 스타일 Hex 사용 임계 상향 계획 수립(문서화 중심)

상태 메모(2025-09-22)

- 다음 3개 항목은 완료되어 Completed 로그로 이관됨: 헤더 정합성, 릴리즈
  메타데이터 동기화, 네트워크 정책 기본값 강화
- Gallery-Perf-001(간단 윈도우링) 완료 — Completed 로그 참조. 스코프/AC에서 관련
  항목 제거.
- A11y-001: CSS 애니메이션 정적 스캔 테스트 추가 및 CSS 보정으로 1차 완성. 전체
  스위트 GREEN 유지.
- Tests-Refactor-001: 환경 변수(VITEST_INCLUDE_REF_TESTS=1) 토글·vitest alias로
  개별 실행 경로 도입 완료. 테스트 본체 재활성화는 단계적 진행(개별 GREEN 확인
  후 exclude 제거).

Acceptance(측정 기준)

- 빌드 산출물 validator 통과 + Userscript 헤더 검사 추가 항목 녹색
- 테스트: 신규/갱신 테스트 GREEN, 제외 테스트 단계적 재활성화(개별 실행 GREEN
  확인)
- 접근성 가드: 애니메이션 존재 파일의 “prefers-reduced-motion” 고려율 100%(허용
  리스트 제외 0)

작업 분해(Tasks · TDD)

5. A11y-001 — 모션 가드

- 변경: CSS 레이어/유틸로 prefers-reduced-motion 가드 믹스인(or 토큰) 추가 및
  적용 가이드(1차 완료)
- 테스트: 애니메이션 선언 파일이 가드를 포함하는지 정적 검사(화이트리스트 예외
  허용) — 테스트 및 CSS 보정 완료

6. Tests-Refactor-001 — 제외 테스트 재활성화 플랜

- 절차: 개별 파일 단독 실행으로 GREEN 확인 → vitest.config.ts exclude에서 제거
- 파일: test/refactoring/event-manager-integration.test.ts,
  test/refactoring/service-diagnostics-integration.test.ts
- 현황: test 전용 어댑터 경로 및 조건부 alias 도입 완료. 본체 재활성화는 각 파일
  GREEN 확인 후 순차 진행.

7. Style-Guard-001 — Hex 직접 사용 임계 상향 계획(단계적)

- 현재: 경고/허용 수치 기반(Phase 6 테스트)
- 계획: 릴리스마다 허용 수치 점진 하향(예: 25 → 15 → 5 → 0) 로드맵을
  README/docs에 표기

완료 정의(DoD)

- typecheck/lint/test/build 모두 GREEN, postbuild validator 통과
- Epic 산출물/결과 요약을 Completed 로그로 이관(변경 파일/테스트/지표 링크 포함)

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
